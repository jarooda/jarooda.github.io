import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useRoomStore } from "../store"
import { lightning } from "../systems/lightning"
import { useReducedMotion } from "../systems/useReducedMotion"
import {
  DROP_MAX_PX,
  DROP_WIDTH_PX,
  dropProfile,
  dropsPerScreen,
  PAGE_FALL_SCREENS,
  rainAngle,
  rainDensity,
  rainSpeed,
  rainStrength
} from "../systems/weatherVisual"
import { applyWindowMask, useWindowMask } from "../systems/windowMask"

// Rain/storm and mist, outside the window (07-rencana-v3.md §3 W3/W6): masked to the glass like
// Outside.tsx. Drops follow the same model as the page rain (ui/PageRain.tsx): depth-layered
// streaks from `dropProfile`, fading from transparent at the top to white at the bottom, each
// with its own phase and speed. Reduced motion freezes them; the `low` tier thins them and drops
// the flash.
// Instance buffer size; the actual count comes from the window's share of the screen.
const RAIN_CAP = 380
// At density 1; rain (~0.55) → ~10 drops, storm (~0.94) → ~17.
const MIN_WINDOW_DROPS = 13
const DROP_GEOMETRY_WIDTH = 0.012
const DROP_GEOMETRY_LENGTH = 0.3
const FLASH_MIN_GAP = 8
const FLASH_MAX_GAP = 15
const FLASH_DECAY_PER_SECOND = 1 / 0.15

const noRaycast = () => {}
const dummy = new THREE.Object3D()
const corner = new THREE.Vector3()

// Screen-space size (px) of a world rectangle facing ±Z, from its projected corners.
function screenRect(
  cx: number,
  cy: number,
  z: number,
  width: number,
  height: number,
  camera: THREE.Camera,
  size: { width: number; height: number }
) {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const [dx, dy] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
    corner.set(cx + dx * width, cy + dy * height, z).project(camera)
    minX = Math.min(minX, corner.x)
    maxX = Math.max(maxX, corner.x)
    minY = Math.min(minY, corner.y)
    maxY = Math.max(maxY, corner.y)
  }
  return { width: ((maxX - minX) / 2) * size.width, height: ((maxY - minY) / 2) * size.height }
}

// Streak alpha along the drop: 0 at the top, 1 at the bottom (PlaneGeometry v = 0 is the bottom),
// the same gradient as `.room-drop` on the page.
function streakTexture() {
  const size = 32
  const data = new Uint8Array(size * 4)
  for (let row = 0; row < size; row++) {
    const alpha = Math.round(255 * (1 - row / (size - 1)))
    data.set([alpha, alpha, alpha, 255], row * 4)
  }
  const texture = new THREE.DataTexture(data, 1, size)
  texture.needsUpdate = true
  return texture
}

export default function Weather({ room }: { room: THREE.Object3D }) {
  const mask = useWindowMask(room)
  const weather = useRoomStore((state) => state.weather)
  const tier = useRoomStore((state) => state.tier)
  const phase = useRoomStore((state) => state.phase)
  const reducedMotion = useReducedMotion()

  const bounds = useMemo(() => {
    const glass = room.getObjectByName("int_window_glass")
    if (!glass) return null
    const box = new THREE.Box3().setFromObject(glass)
    return { center: box.getCenter(new THREE.Vector3()), size: box.getSize(new THREE.Vector3()) }
  }, [room])

  const rainGeometry = useMemo(() => new THREE.PlaneGeometry(DROP_GEOMETRY_WIDTH, DROP_GEOMETRY_LENGTH), [])
  // Additive, so each drop's instance color works as its opacity (black = invisible), like the
  // per-drop opacity on the page.
  const rainMaterial = useMemo(() => {
    const material = new THREE.MeshBasicMaterial({
      color: "#ffffff",
      alphaMap: streakTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    })
    applyWindowMask(material)
    return material
  }, [])
  const rainMesh = useRef<THREE.InstancedMesh>(null)
  const rainSeeds = useMemo(
    () =>
      Array.from({ length: RAIN_CAP }, () => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        ...dropProfile(Math.random())
      })),
    []
  )

  // Per-drop brightness = depth opacity × rain strength (same as the page drops).
  useEffect(() => {
    const mesh = rainMesh.current
    if (!mesh) return
    const strength = rainStrength(weather, phase)
    const color = new THREE.Color()
    rainSeeds.forEach((seed, i) => mesh.setColorAt(i, color.setScalar(seed.opacity * strength)))
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    rainMaterial.needsUpdate = true
  }, [weather, phase, rainSeeds, rainMaterial])

  const mistMaterial = useMemo(() => {
    const material = new THREE.MeshBasicMaterial({ color: "#ccd3db", transparent: true, depthWrite: false, opacity: 0 })
    applyWindowMask(material)
    return material
  }, [])
  const mistMesh = useRef<THREE.Mesh>(null)

  // Lightning: fires every FLASH_MIN_GAP–FLASH_MAX_GAP seconds while a storm is active.
  const nextFlashIn = useRef(FLASH_MIN_GAP + Math.random() * (FLASH_MAX_GAP - FLASH_MIN_GAP))

  useEffect(() => {
    return () => {
      lightning.strength = 0
    }
  }, [])

  useFrame((state, delta) => {
    if (!bounds) return
    const raining = weather?.kind === "rain" || weather?.kind === "storm"
    const misty = weather?.kind === "mist"
    const canFlash = weather?.kind === "storm" && tier !== "low" && !reducedMotion

    if (rainMesh.current) {
      rainMesh.current.visible = !!raining
      if (!raining) rainMesh.current.count = 0
      else {
        const width = Math.max(bounds.size.x, 0.4) * 1.7
        const height = Math.max(bounds.size.y, 0.4) * 1.7
        const depthZ = bounds.center.z - 0.475
        // Match the page rain on screen (user feedback: the window looked denser): same drops
        // per pixel, drop length and width in pixels, and fall speed in pixels per second.
        const rect = screenRect(bounds.center.x, bounds.center.y, depthZ, width, height, state.camera, state.size)
        const screenShare = (rect.width * rect.height) / (state.size.width * state.size.height)
        // A floor keeps rain visible in the window even when it's tiny on screen (user
        // feedback); it scales with density too, so a storm still shows more than rain.
        const density = rainDensity(weather)
        const matched = dropsPerScreen(tier) * density * screenShare
        const budget = Math.min(RAIN_CAP, Math.round(Math.max(matched, MIN_WINDOW_DROPS * density)))
        const count = reducedMotion ? Math.min(80, budget) : budget
        rainMesh.current.count = count
        const pxPerWorldX = rect.width / width || 1
        const pxPerWorldY = rect.height / height || 1
        const dropWidth = DROP_WIDTH_PX / pxPerWorldX / DROP_GEOMETRY_WIDTH
        const pageFallPxPerSecond = PAGE_FALL_SCREENS * state.size.height
        const angle = rainAngle(weather!.windX)
        const lean = Math.tan(angle)
        const speed = rainSpeed(weather)
        const now = performance.now() / 1000
        for (let i = 0; i < count; i++) {
          const seed = rainSeeds[i]
          const fallSeconds = (rect.height / pageFallPxPerSecond) * (seed.duration / speed)
          const fall = reducedMotion ? 0 : (now / fallSeconds) % 1
          const t = (seed.y + fall) % 1
          dummy.position.set(
            bounds.center.x + (seed.x - 0.5) * width + lean * t * height,
            bounds.center.y + (0.5 - t) * height,
            bounds.center.z - 0.3 - seed.z * 0.35
          )
          dummy.rotation.z = angle
          dummy.scale.set(dropWidth, (seed.length * DROP_MAX_PX) / pxPerWorldY / DROP_GEOMETRY_LENGTH, 1)
          dummy.updateMatrix()
          rainMesh.current.setMatrixAt(i, dummy.matrix)
        }
        rainMesh.current.instanceMatrix.needsUpdate = true
      }
    }

    if (mistMesh.current) {
      mistMesh.current.visible = !!misty
      if (misty) {
        const width = Math.max(bounds.size.x, 0.4) * 1.8
        const height = Math.max(bounds.size.y, 0.4) * 1.8
        mistMesh.current.position.set(bounds.center.x, bounds.center.y, bounds.center.z - 0.55)
        mistMesh.current.scale.set(width, height, 1)
        mistMaterial.opacity = THREE.MathUtils.lerp(0.12, 0.65, weather!.intensity)
      }
    }

    if (canFlash) {
      nextFlashIn.current -= delta
      if (nextFlashIn.current <= 0) {
        lightning.strength = 1
        nextFlashIn.current = FLASH_MIN_GAP + Math.random() * (FLASH_MAX_GAP - FLASH_MIN_GAP)
      }
    }
    if (lightning.strength > 0) lightning.strength = Math.max(0, lightning.strength - delta * FLASH_DECAY_PER_SECOND)
  })

  return (
    <>
      {mask && <primitive object={mask} />}
      <instancedMesh
        ref={rainMesh}
        args={[rainGeometry, rainMaterial, RAIN_CAP]}
        visible={false}
        frustumCulled={false}
        raycast={noRaycast}
      />
      <mesh ref={mistMesh} visible={false} raycast={noRaycast}>
        <planeGeometry args={[1, 1]} />
        <primitive object={mistMaterial} attach="material" />
      </mesh>
    </>
  )
}
