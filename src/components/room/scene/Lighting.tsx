import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { useRoomStore, type Tier } from "../store"
import { lightning } from "../systems/lightning"
import { presetById, toAtmosphere } from "../systems/timePhases"
import { weatherDarken } from "../systems/weatherVisual"
import { live } from "./Atmosphere"
import { meshMaterial } from "./canvasTexture"

// Room lighting (00 §6, 03 §5.7): phase preset × ceiling lamp × curtains.
// Curtain factor c: 1 = open, 0 = closed, read from the curtain morph so light follows the
// animation. Closed curtains cut sunlight and window glow and drop ambient to night level.
const SUN_DISTANCE = 8
const SHADOW_SIZE = 1024
const SHADOW_EXTENT = 4
const LAMP_INTENSITY = 9
const LAMP_COLOR = "#ffc98a"
const LAMP_EASE_PER_SECOND = 6
const WINDOW_LIGHT_INTENSITY = 7
const BULB_ON = 3
const BULB_OFF = 0.08
const DESK_BULB = 1.2
const GLASS_GLOW = 1.1
// The pane is lit by the bright day light; at the asset's opacity it hides the view (user feedback).
const GLASS_OPACITY = 0.08

const NIGHT = toAtmosphere(presetById("night"))

// Weather dimming (V3 W5, `weatherDarken`): clouds/rain/storm/mist cut sunlight and window light,
// capped at −60%; the ceiling lamp, switch and curtains are untouched. Ambient only cools.
const COOL_MULTIPLY = new THREE.Color(0.82, 0.9, 1)
const coolTint = new THREE.Color()
const FLASH_COLOR = new THREE.Color("#ffffff")
const FLASH_LIGHT_BOOST = 5
const FLASH_GLASS_BOOST = 2.5

// Meshes that cast/receive shadows: everything solid, not glowing screens or glass.
const NO_SHADOW = /^(glass_window|emit_)/

// PCFSoftShadowMap is gone in recent three.js; PCF with a blur radius gives the soft look.
const SHADOW_RADIUS: Record<Tier, number> = { high: 4, medium: 1.5, low: 0 }

export default function Lighting({ scene }: { scene: THREE.Object3D }) {
  const tier = useRoomStore((state) => state.tier)
  const castShadows = tier !== "low"
  const lightOn = useRoomStore((state) => state.lightOn)
  const weather = useRoomStore((state) => state.weather)

  const hemisphere = useRef<THREE.HemisphereLight>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const windowLight = useRef<THREE.SpotLight>(null)
  const lamp = useRef<THREE.PointLight>(null)
  const lampLevel = useRef(lightOn ? 1 : 0)

  const center = useMemo(() => {
    const floor = scene.getObjectByName("room_floor")
    return floor ? new THREE.Box3().setFromObject(floor).getCenter(new THREE.Vector3()) : new THREE.Vector3()
  }, [scene])
  const lampPosition = useMemo(() => {
    const bulb = scene.getObjectByName("deco_ceiling_lamp_bulb")
    if (!bulb) console.warn('[room] lighting: missing "deco_ceiling_lamp_bulb"')
    return bulb ? bulb.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(0, 2.3, -0.2)
  }, [scene])
  const glassCenter = useMemo(() => {
    const glass = scene.getObjectByName("int_window_glass")
    return glass ? new THREE.Box3().setFromObject(glass).getCenter(new THREE.Vector3()) : null
  }, [scene])
  const curtain = useMemo(() => {
    const mesh = scene.getObjectByName("int_window_curtain_l")
    const index = mesh instanceof THREE.Mesh ? mesh.morphTargetDictionary?.closed : undefined
    return mesh instanceof THREE.Mesh && index !== undefined ? { mesh, index } : null
  }, [scene])
  const materials = useMemo(
    () => ({
      glass: meshMaterial(scene, "glass_window"),
      bulb: meshMaterial(scene, "emit_bulb_ceiling"),
      desk: meshMaterial(scene, "emit_bulb_desklamp")
    }),
    [scene]
  )

  useEffect(() => {
    if (materials.glass) materials.glass.opacity = GLASS_OPACITY
  }, [materials])

  useEffect(() => {
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || !object.visible) return
      const solid = ![object.material].flat().some((m) => NO_SHADOW.test(m.name))
      object.castShadow = solid
      object.receiveShadow = solid
    })
  }, [scene])

  useEffect(() => {
    if (!sun.current) return
    sun.current.target.position.copy(center)
    sun.current.target.updateMatrixWorld()
    if (windowLight.current && glassCenter) {
      // Spot from just outside the window, aimed down into the room.
      windowLight.current.position.copy(glassCenter).add(new THREE.Vector3(0, 0.6, -1.2))
      windowLight.current.target.position.copy(glassCenter).add(new THREE.Vector3(0, -1.2, 1.6))
      windowLight.current.target.updateMatrixWorld()
    }
  }, [center, glassCenter])

  useFrame((_, delta) => {
    const c = curtain ? 1 - (curtain.mesh.morphTargetInfluences?.[curtain.index] ?? 0) : 1
    const exposure = live.exposure
    lampLevel.current += ((lightOn ? 1 : 0) - lampLevel.current) * Math.min(1, delta * LAMP_EASE_PER_SECOND)

    const darken = weatherDarken(weather)
    const weatherFactor = 1 - darken
    const flash = lightning.strength

    if (hemisphere.current) {
      // Cooler ambient under bad weather: a multiply, so it can only cool/darken, never brighten.
      coolTint.setRGB(1, 1, 1).lerp(COOL_MULTIPLY, darken)
      hemisphere.current.color.copy(NIGHT.ambientColor).lerp(live.ambientColor, c).multiply(coolTint)
      hemisphere.current.groundColor.copy(NIGHT.ground).lerp(live.ground, c)
      hemisphere.current.intensity = THREE.MathUtils.lerp(NIGHT.ambient, live.ambient, c) * exposure
    }
    if (sun.current) {
      sun.current.color.copy(live.sunColor)
      sun.current.intensity = live.sun * c * exposure * weatherFactor
      sun.current.position.copy(center).addScaledVector(live.sunDirection, SUN_DISTANCE)
    }
    if (windowLight.current) {
      windowLight.current.color.copy(live.windowColor).lerp(FLASH_COLOR, flash)
      windowLight.current.intensity = live.window * c * WINDOW_LIGHT_INTENSITY * exposure * weatherFactor + flash * FLASH_LIGHT_BOOST
    }
    if (lamp.current) lamp.current.intensity = LAMP_INTENSITY * lampLevel.current * exposure

    if (materials.glass instanceof THREE.MeshStandardMaterial) {
      materials.glass.emissive.copy(live.windowColor).lerp(FLASH_COLOR, flash)
      materials.glass.emissiveIntensity = live.glass * c * GLASS_GLOW * weatherFactor + flash * FLASH_GLASS_BOOST
    }
    if (materials.bulb instanceof THREE.MeshStandardMaterial) {
      materials.bulb.emissiveIntensity = THREE.MathUtils.lerp(BULB_OFF, BULB_ON, lampLevel.current)
    }
    if (materials.desk instanceof THREE.MeshStandardMaterial) materials.desk.emissiveIntensity = DESK_BULB
  })

  return (
    <>
      <hemisphereLight ref={hemisphere} />
      <directionalLight
        ref={sun}
        castShadow={castShadows}
        shadow-mapSize={[SHADOW_SIZE, SHADOW_SIZE]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-radius={SHADOW_RADIUS[tier]}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
      />
      <spotLight ref={windowLight} angle={0.7} penumbra={0.8} decay={1.5} distance={6} />
      <pointLight ref={lamp} position={lampPosition} color={LAMP_COLOR} decay={2} distance={8} />
    </>
  )
}
