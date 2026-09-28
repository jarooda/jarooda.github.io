import { Html, useAnimations, useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { ZONE_MEMBERS, zoneTarget, type ZoneId } from "../sections"
import { useRoomStore, type TriggerTarget } from "../store"
import { useAssetUrl } from "../systems/assets"
import { isHeld, useControls, type MoveKey } from "../systems/controls"
import { buildNavGrid, pathLength, type NavGrid, type Point } from "../systems/navGrid"
import { sweepBoxes } from "../systems/occluders"
import InteractPrompt from "../ui/InteractPrompt"
import type { ViewId, ViewPreset } from "./viewPresets"

export const AVATAR_URL = "/models/avatar.glb"

// Contract §10: the walk cycle covers walk_stride_m in walk_cycle_frames at 30 fps (±1.83 m/s).
// Normal walking is slowed to ±1.46 m/s (03 §5.2, animation scaled by the same factor).
const ANIMATION_FPS = 30
const NORMAL_SPEED_FACTOR = 0.8
// Decision 12: automatic sequences walk ×1.5 faster, at most ±3 s per walk.
const SEQUENCE_SPEED_FACTOR = 1.5
const MAX_SEQUENCE_SECONDS = 3
const CROSSFADE_SECONDS = 0.2
const TURN_RATE = 12
const OCCLUSION_DISTANCE = 4

// Object each trigger faces when interacting.
const FACE_NODE: Record<TriggerTarget, string> = {
  desk: "zone_desk",
  tv: "zone_tv_table",
  whiteboard: "int_whiteboard",
  switch: "int_switch",
  window: "int_window"
}

const MOVE_KEYS: Record<string, MoveKey> = {
  KeyW: "up",
  ArrowUp: "up",
  KeyS: "down",
  ArrowDown: "down",
  KeyD: "right",
  ArrowRight: "right",
  KeyA: "left",
  ArrowLeft: "left"
}
// Action key (user decision: F, not E).
export const ACTION_KEY = "KeyF"
// Height of the action prompt above the avatar's feet.
const PROMPT_HEIGHT = 2

interface Trigger {
  target: TriggerTarget
  position: Point
  radius: number
  face: Point
}

interface WalkTask {
  path: Point[]
  index: number
  speed: number
  onArrive?: () => void
}

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

function readTriggers(scene: THREE.Object3D): Trigger[] {
  const triggers: Trigger[] = []
  scene.traverse((object) => {
    if (object.userData.type !== "trigger") return
    const target = object.userData.target as TriggerTarget
    const position = object.getWorldPosition(new THREE.Vector3())
    const faceNode = scene.getObjectByName(FACE_NODE[target])
    const face = faceNode ? new THREE.Box3().setFromObject(faceNode).getCenter(new THREE.Vector3()) : position
    triggers.push({ target, position: { x: position.x, z: position.z }, radius: Number(object.userData.radius) || 0.5, face: { x: face.x, z: face.z } })
  })
  return triggers
}

export default function Avatar({ scene, presets }: { scene: THREE.Object3D; presets: Partial<Record<ViewId, ViewPreset>> }) {
  const gltf = useGLTF(useAssetUrl(AVATAR_URL))
  const root = useRef<THREE.Group>(null)
  const { actions } = useAnimations(gltf.animations, root)

  const nav = useMemo<NavGrid>(() => buildNavGrid(scene), [scene])
  const triggers = useMemo(() => readTriggers(scene), [scene])
  const naturalSpeed = useMemo(() => {
    const rig = gltf.scene.getObjectByName("avatar_rig")
    const stride = Number(rig?.userData.walk_stride_m)
    const frames = Number(rig?.userData.walk_cycle_frames)
    if (!stride || !frames) console.warn("[room] avatar: missing walk_stride_m / walk_cycle_frames, using defaults")
    return (stride || 1.525) / ((frames || 25) / ANIMATION_FPS)
  }, [gltf])
  const normalSpeed = naturalSpeed * NORMAL_SPEED_FACTOR

  const task = useRef<WalkTask | null>(null)
  const busy = useRef(false)
  const heading = useRef(0)
  const targetHeading = useRef(0)
  const current = useRef<string>("idle")

  const play = (name: string, timeScale = 1) => {
    const next = actions[name]
    if (!next) return
    next.timeScale = timeScale
    if (current.current === name) return
    const previous = actions[current.current]
    next.reset().fadeIn(CROSSFADE_SECONDS).play()
    previous?.fadeOut(CROSSFADE_SECONDS)
    current.current = name
  }

  const faceTowards = (point: Point) => {
    const avatar = root.current
    if (!avatar) return
    targetHeading.current = Math.atan2(point.x - avatar.position.x, point.z - avatar.position.z)
  }

  // interact once, then back to idle.
  const interact = (face: Point, onDone?: () => void) => {
    const action = actions.interact
    faceTowards(face)
    if (!action) return onDone?.()
    busy.current = true
    action.setLoop(THREE.LoopOnce, 1)
    action.clampWhenFinished = true
    play("interact")
    window.setTimeout(() => {
      busy.current = false
      play("idle")
      onDone?.()
    }, (action.getClip().duration * 1000) / action.timeScale)
  }

  const walk = (to: Point, speed: number, onArrive?: () => void) => {
    const avatar = root.current
    if (!avatar) return
    const path = nav.findPath({ x: avatar.position.x, z: avatar.position.z }, to)
    if (!path) return onArrive?.()
    task.current = { path, index: 1, speed, onArrive }
  }

  // Spawn, idle, and no frustum culling (skinned bounds are unreliable).
  useEffect(() => {
    const avatar = root.current
    const spawn = scene.getObjectByName("spawn_avatar")
    if (!spawn) console.warn('[room] avatar: missing "spawn_avatar"')
    if (avatar && spawn) avatar.position.copy(spawn.getWorldPosition(new THREE.Vector3())).setY(0)
    gltf.scene.traverse((object) => (object.frustumCulled = false))
    actions.idle?.reset().play()
    current.current = "idle"
  }, [actions, gltf, scene])

  // Sequence walk: to the zone's trigger, face the object, interact, then the camera zooms in.
  const sequence = useRoomStore((state) => state.sequence)
  useEffect(() => {
    if (sequence?.stage !== "walk") return
    const trigger = triggers.find((t) => t.target === sequence.target.zone)
    const avatar = root.current
    if (!trigger || !avatar) return useRoomStore.getState().avatarArrived()
    const path = nav.findPath({ x: avatar.position.x, z: avatar.position.z }, trigger.position)
    const length = path ? pathLength(path) : 0
    const speed = Math.max(normalSpeed * SEQUENCE_SPEED_FACTOR, length / MAX_SEQUENCE_SECONDS)
    walk(trigger.position, speed, () => interact(trigger.face, () => useRoomStore.getState().avatarArrived()))
  }, [sequence?.stage, sequence?.target])

  // Skip: jump straight to the trigger, facing the object.
  const avatarSnap = useRoomStore((state) => state.avatarSnap)
  useEffect(() => {
    const avatar = root.current
    const trigger = avatarSnap && triggers.find((t) => t.target === avatarSnap.zone)
    if (!avatar || !trigger) return
    task.current = null
    busy.current = false
    const spot = nav.nearestFree(trigger.position)
    avatar.position.set(spot.x, 0, spot.z)
    heading.current = targetHeading.current = Math.atan2(trigger.face.x - spot.x, trigger.face.z - spot.z)
    play("idle")
  }, [avatarSnap])

  // Click / tap on the floor.
  const walkRequest = useRoomStore((state) => state.walkRequest)
  useEffect(() => {
    const { mode, sequence } = useRoomStore.getState()
    if (!walkRequest || mode !== "roam" || sequence || busy.current) return
    walk(nav.nearestFree(walkRequest), normalSpeed)
  }, [walkRequest])

  // E / Tap on the prompt: zones run the sequence (walk to the trigger, interact, zoom);
  // the switch and window are used in place.
  const interactRequest = useRoomStore((state) => state.interactRequest)
  useEffect(() => {
    const state = useRoomStore.getState()
    const target = state.nearbyTarget
    if (!interactRequest || !target || state.mode !== "roam" || state.sequence || busy.current) return
    if (target === "switch" || target === "window") {
      const trigger = triggers.find((t) => t.target === target)!
      task.current = null
      // The window also opens the time-of-day picker (00 §6).
      interact(trigger.face, () => {
        if (target === "switch") return state.toggleLight()
        state.toggleCurtains()
        state.setTimeControlOpen(true)
      })
      return
    }
    state.travelTo(zoneTarget(target))
  }, [interactRequest])

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (isTyping(event.target) || event.altKey || event.ctrlKey || event.metaKey) return
      const { mode, sequence } = useRoomStore.getState()
      if (mode !== "roam" || sequence) return
      if (event.code in MOVE_KEYS) {
        useControls.getState().press(event.code, MOVE_KEYS[event.code])
        event.preventDefault()
      } else if (event.code === ACTION_KEY && !event.repeat) useRoomStore.getState().requestInteract()
    }
    const up = (event: KeyboardEvent) => useControls.getState().release(event.code)
    const clear = () => useControls.getState().clear()
    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)
    window.addEventListener("blur", clear)
    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
      window.removeEventListener("blur", clear)
    }
  }, [])

  // Hide the avatar when it stands between a zoom camera and the zone's objects.
  const view = useRoomStore((state) => state.view)
  useEffect(() => {
    const avatar = root.current
    if (!avatar) return
    const preset = presets[view]
    const zone: ZoneId | null = view === "main" ? null : view === "monitor" ? "desk" : view
    if (!zone || !preset) return void (avatar.visible = true)
    const content = new THREE.Box3()
    for (const name of ZONE_MEMBERS[zone]) {
      const node = scene.getObjectByName(name)
      if (node?.visible) content.expandByObject(node)
    }
    const towardCamera = new THREE.Vector3(0, 0, 1).applyQuaternion(preset.quaternion)
    const body = new THREE.Box3().setFromObject(avatar)
    avatar.visible = !sweepBoxes(content, towardCamera, OCCLUSION_DISTANCE).some((box) => box.intersectsBox(body))
  }, [view, presets, scene])

  useFrame((_, rawDelta) => {
    const avatar = root.current
    if (!avatar) return
    const delta = Math.min(rawDelta, 0.05)
    const { mode, sequence } = useRoomStore.getState()
    let speed = 0

    if (!busy.current && task.current) {
      const walking = task.current
      let step = walking.speed * delta
      while (step > 0 && walking.index < walking.path.length) {
        const goal = walking.path[walking.index]
        const dx = goal.x - avatar.position.x
        const dz = goal.z - avatar.position.z
        const distance = Math.hypot(dx, dz)
        if (distance <= step) {
          avatar.position.x = goal.x
          avatar.position.z = goal.z
          step -= distance
          walking.index++
        } else {
          avatar.position.x += (dx / distance) * step
          avatar.position.z += (dz / distance) * step
          targetHeading.current = Math.atan2(dx, dz)
          step = 0
        }
      }
      speed = walking.speed
      if (walking.index >= walking.path.length) {
        task.current = null
        speed = 0
        walking.onArrive?.()
      }
    } else if (!busy.current && mode === "roam" && !sequence && presets.main) {
      // Screen-relative: up on screen is away from the room camera, projected on the floor.
      const { pressed } = useControls.getState()
      const right = Number(isHeld(pressed, "right")) - Number(isHeld(pressed, "left"))
      const forward = Number(isHeld(pressed, "up")) - Number(isHeld(pressed, "down"))
      const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(presets.main.quaternion).setY(0).normalize()
      const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(presets.main.quaternion).setY(0).normalize()
      const direction = camForward.multiplyScalar(forward).add(camRight.multiplyScalar(right))
      if (direction.lengthSq() > 0) {
        direction.normalize()
        const step = normalSpeed * delta
        const x = avatar.position.x + direction.x * step
        const z = avatar.position.z + direction.z * step
        // Slide along obstacles: try the full move, then each axis on its own.
        if (nav.isFree(x, z)) avatar.position.set(x, 0, z)
        else if (nav.isFree(x, avatar.position.z)) avatar.position.x = x
        else if (nav.isFree(avatar.position.x, z)) avatar.position.z = z
        targetHeading.current = Math.atan2(direction.x, direction.z)
        speed = normalSpeed
      }
    }

    if (!busy.current) {
      if (speed > 0) play("walk", speed / naturalSpeed)
      else play("idle")
    }

    // Turn smoothly along the shortest way.
    const turn = Math.atan2(Math.sin(targetHeading.current - heading.current), Math.cos(targetHeading.current - heading.current))
    heading.current += turn * Math.min(1, TURN_RATE * delta)
    avatar.rotation.y = heading.current

    if (mode === "roam" && !sequence) {
      const near = triggers
        .map((t) => ({ t, d: Math.hypot(t.position.x - avatar.position.x, t.position.z - avatar.position.z) }))
        .filter(({ t, d }) => d <= t.radius)
        .sort((a, b) => a.d - b.d)[0]
      useRoomStore.getState().setNearbyTarget(near?.t.target ?? null)
    } else useRoomStore.getState().setNearbyTarget(null)
  })

  return (
    <group ref={root}>
      <primitive object={gltf.scene} />
      {/* Action prompt floats above the avatar's head (user decision). */}
      <Html position={[0, PROMPT_HEIGHT, 0]} center zIndexRange={[15, 10]}>
        <InteractPrompt />
      </Html>
    </group>
  )
}
