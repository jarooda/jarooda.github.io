import { Html, useAnimations, useGLTF } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import gsap from "gsap"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { ZONE_MEMBERS, zoneTarget, type ZoneId } from "../sections"
import { useRoomStore, type FixtureTarget, type TriggerTarget } from "../store"
import { useAssetUrl } from "../systems/assets"
import { avatarPosition } from "../systems/avatarState"
import { isHeld, useControls, type MoveKey } from "../systems/controls"
import { buildNavGrid, pathLength, type NavGrid, type Point } from "../systems/navGrid"
import { sweepBoxes } from "../systems/occluders"
import { HIDDEN_IN_ZOOM, POSE_CLIPS, curtainDrive, readPoseMarkers, type PoseTarget } from "../systems/poses"
import { useIsMobile } from "../systems/useIsMobile"
import { useReducedMotion } from "../systems/useReducedMotion"
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
const TURN_SECONDS = 0.25
const OCCLUSION_DISTANCE = 4
// Extra reach around trigger radii, so standing right against the window or switch still counts.
const TRIGGER_TOLERANCE = 0.25
// Contract §10.2: the desk chair is pulled back 0.3 m, then chair and seated avatar slide forward.
const CHAIR_SHIFT = 0.3
const CHAIR_BACK_SECONDS = 0.3
const CHAIR_FORWARD_SECONDS = 0.4
// 06 §4 V3: the avatar ponders ±1 s at the whiteboard before the camera zooms in.
const PONDER_SECONDS = 1
const FADE_SECONDS = 0.3

// Object each trigger faces when interacting.
const FACE_NODE: Record<TriggerTarget, string> = {
  desk: "zone_desk",
  tv: "zone_tv_table",
  whiteboard: "int_whiteboard",
  switch: "int_switch",
  window: "int_window",
  bed: "deco_bed"
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

type HeldPose = Exclude<PoseTarget, "window">

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z)

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
  const { actions, mixer } = useAnimations(gltf.animations, root)

  const mobile = useIsMobile()
  const reducedMotion = useReducedMotion()
  const reduced = useRef(reducedMotion)
  reduced.current = reducedMotion

  const nav = useMemo<NavGrid>(() => buildNavGrid(scene), [scene])
  const triggers = useMemo(() => readTriggers(scene), [scene])
  const poses = useMemo(() => {
    const markers = readPoseMarkers(scene)
    for (const target of ["window", "whiteboard", "tv", "desk", "bed"] as PoseTarget[]) {
      if (!markers[target]) console.warn(`[room] avatar: missing "pose_${target}"`)
    }
    return markers
  }, [scene])

  // The desk chair and its collision box move together (K45). Offsets are applied in each
  // object's parent space so any parent transform in the asset is respected.
  const chair = useMemo(() => {
    const marker = poses.desk
    if (!marker) return null
    const back = new THREE.Vector3(-marker.facing.x, 0, -marker.facing.z).multiplyScalar(CHAIR_SHIFT)
    const parts = ["deco_desk_chair", "collision_deco_desk_chair"].flatMap((name) => {
      const object = scene.getObjectByName(name)
      if (!object?.parent) return []
      const world = object.getWorldPosition(new THREE.Vector3())
      const localBack = object.parent.worldToLocal(world.clone().add(back)).sub(object.parent.worldToLocal(world.clone()))
      return [{ object, rest: object.position.clone(), localBack }]
    })
    const state = { t: 0 }
    const apply = () => parts.forEach(({ object, rest, localBack }) => object.position.copy(rest).addScaledVector(localBack, state.t))
    return { state, apply }
  }, [scene, poses])

  // Walkable floor while the chair is pulled back: where the avatar steps aside before sitting.
  const deskGrid = useMemo(() => {
    if (!chair) return nav
    chair.state.t = 1
    chair.apply()
    scene.updateMatrixWorld(true)
    const grid = buildNavGrid(scene)
    chair.state.t = 0
    chair.apply()
    scene.updateMatrixWorld(true)
    return grid
  }, [chair, nav, scene])

  const naturalSpeed = useMemo(() => {
    const rig = gltf.scene.getObjectByName("avatar_rig")
    const stride = Number(rig?.userData.walk_stride_m)
    const frames = Number(rig?.userData.walk_cycle_frames)
    if (!stride || !frames) console.warn("[room] avatar: missing walk_stride_m / walk_cycle_frames, using defaults")
    return (stride || 1.525) / ((frames || 25) / ANIMATION_FPS)
  }, [gltf])
  const normalSpeed = naturalSpeed * NORMAL_SPEED_FACTOR

  const task = useRef<WalkTask | null>(null)
  // The current clip is owned by a script or pose; the frame loop leaves animation alone.
  const busy = useRef(false)
  // A pose script runs: movement input is ignored.
  const scripted = useRef(false)
  const pose = useRef<HeldPose | null>(null)
  const exiting = useRef<Promise<void> | null>(null)
  const runToken = useRef(0)
  const pending = useRef(new Set<() => void>())
  const heading = useRef(0)
  const targetHeading = useRef(0)
  const current = useRef<string>("idle")

  const setAvatarPose = (target: HeldPose | null) => {
    pose.current = target
    useRoomStore.getState().setAvatarPose(target)
  }

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

  // Pose clips: `once` clamps on the last frame, `reverse` plays from the end back to frame 0.
  const startClip = (name: string, { once = false, reverse = false, fade = CROSSFADE_SECONDS } = {}) => {
    const next = actions[name]
    if (!next) return null
    const same = current.current === name
    const previous = same ? null : actions[current.current]
    next.reset()
    next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity)
    next.clampWhenFinished = once
    next.timeScale = reverse ? -1 : 1
    if (reverse) next.time = next.getClip().duration
    if (fade > 0 && !same) {
      next.fadeIn(fade).play()
      previous?.fadeOut(fade)
    } else {
      next.setEffectiveWeight(1).play()
      previous?.stop()
    }
    current.current = name
    return next
  }

  // The looping clip of a held pose, or `_enter` clamped on its last frame when it has none.
  const holdPose = (target: HeldPose, fade = CROSSFADE_SECONDS) => {
    const { enter, loop } = POSE_CLIPS[target]
    if (loop) return startClip(loop, { fade })
    const action = current.current === enter ? actions[enter] : startClip(enter, { once: true, fade })
    if (action) action.time = action.getClip().duration
  }

  // Awaitable steps; cancelling a script resolves every pending step so it can bail out.
  const until = (setup: (done: () => void) => (() => void) | void) =>
    new Promise<void>((resolve) => {
      let cleanup: (() => void) | void
      const done = () => {
        if (!pending.current.delete(done)) return
        cleanup?.()
        resolve()
      }
      pending.current.add(done)
      cleanup = setup(done)
    })

  const wait = (seconds: number) =>
    until((done) => {
      const id = window.setTimeout(done, seconds * 1000)
      return () => window.clearTimeout(id)
    })

  const finished = (action: THREE.AnimationAction) =>
    until((done) => {
      const onFinished = (event: { action: THREE.AnimationAction }) => event.action === action && done()
      mixer.addEventListener("finished", onFinished)
      return () => mixer.removeEventListener("finished", onFinished)
    })

  const walkPath = (path: Point[], speed: number) =>
    until((done) => {
      task.current = { path, index: 1, speed, onArrive: done }
      return () => {
        if (task.current?.onArrive === done) task.current = null
      }
    })

  const tween = (target: object, vars: gsap.TweenVars) =>
    until((done) => {
      const animation = gsap.to(target, { ...vars, onComplete: done })
      return () => animation.kill()
    })

  const turnTo = async (angle: number) => {
    targetHeading.current = angle
    await wait(TURN_SECONDS)
    heading.current = targetHeading.current = angle
  }

  const here = (): Point => ({ x: root.current?.position.x ?? 0, z: root.current?.position.z ?? 0 })

  // Where the avatar stands before sitting down at the desk: pose_desk minus the chair shift.
  const deskApproach = (): Point => {
    const marker = poses.desk!
    return { x: marker.position.x - marker.facing.x * CHAIR_SHIFT, z: marker.position.z - marker.facing.z * CHAIR_SHIFT }
  }

  // Chair pulled back by t (0 = at the desk, 1 = pulled back); `carry` moves the seated avatar along.
  const moveChair = (t: number, seconds: number, carry = false) => {
    if (!chair) return Promise.resolve()
    const marker = poses.desk!
    return tween(chair.state, {
      t,
      duration: seconds,
      ease: "power2.inOut",
      onUpdate: () => {
        chair.apply()
        const avatar = root.current
        if (carry && avatar) {
          avatar.position.set(
            marker.position.x - marker.facing.x * CHAIR_SHIFT * chair.state.t,
            0,
            marker.position.z - marker.facing.z * CHAIR_SHIFT * chair.state.t
          )
        }
      }
    })
  }

  const resetChair = () => {
    if (!chair) return
    gsap.killTweensOf(chair.state)
    chair.state.t = 0
    chair.apply()
  }

  // Fade the avatar out when the camera frames the desk or whiteboard (D3, D4) and back in on return.
  const materials = useMemo(() => {
    const list = new Set<THREE.Material>()
    gltf.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) [object.material].flat().forEach((material) => list.add(material))
    })
    return [...list]
  }, [gltf])
  const opacity = useRef({ value: 1 })
  const fading = useRef<(() => void) | null>(null)
  const applyOpacity = () => {
    const value = opacity.current.value
    for (const material of materials) {
      if (material.transparent !== value < 1) {
        material.transparent = value < 1
        material.needsUpdate = true
      }
      material.opacity = value
    }
    gltf.scene.visible = value > 0
  }
  // A new fade settles the previous one, so a script awaiting it never hangs.
  const fadeTo = (value: number, seconds = FADE_SECONDS) => {
    fading.current?.()
    if (seconds <= 0 || reduced.current || opacity.current.value === value) {
      opacity.current.value = value
      applyOpacity()
      return Promise.resolve()
    }
    return until((done) => {
      fading.current = done
      const animation = gsap.to(opacity.current, { value, duration: seconds, onUpdate: applyOpacity, onComplete: done })
      return () => {
        animation.kill()
        if (fading.current === done) fading.current = null
      }
    })
  }

  const cancelScripts = () => {
    runToken.current++
    ;[...pending.current].forEach((done) => done())
    task.current = null
    busy.current = false
    scripted.current = false
    exiting.current = null
    curtainDrive.action = null
  }

  const script = async (body: (alive: () => boolean) => Promise<unknown>) => {
    const token = ++runToken.current
    const alive = () => token === runToken.current
    scripted.current = true
    try {
      await body(alive)
    } finally {
      if (alive()) scripted.current = false
    }
  }

  const faceTowards = (point: Point) => {
    const avatar = root.current
    if (!avatar) return
    targetHeading.current = Math.atan2(point.x - avatar.position.x, point.z - avatar.position.z)
  }

  // A one-shot clip (interact, wave), then back to idle.
  const playOnce = (name: string, onDone?: () => void) => {
    const action = actions[name]
    if (!action) return onDone?.()
    busy.current = true
    action.setLoop(THREE.LoopOnce, 1)
    action.clampWhenFinished = true
    play(name)
    window.setTimeout(() => {
      busy.current = false
      play("idle")
      onDone?.()
    }, (action.getClip().duration * 1000) / action.timeScale)
  }

  const interact = (face: Point, onDone?: () => void) => {
    faceTowards(face)
    playOnce("interact", onDone)
  }

  const walk = (to: Point, speed: number, onArrive?: () => void) => {
    const avatar = root.current
    if (!avatar) return
    const path = nav.findPath({ x: avatar.position.x, z: avatar.position.z }, to)
    if (!path) return onArrive?.()
    task.current = { path, index: 1, speed, onArrive }
  }

  // Walk to a pose marker (06 §3): path to the nearest walkable spot, a straight step onto the
  // marker when it lies inside a collision margin (bed, desk), turn to its heading, snap.
  const approachPose = async (target: PoseTarget, speed: number, alive: () => boolean) => {
    const marker = poses[target]!
    const spot = target === "desk" ? deskApproach() : marker.position
    const entry = (target === "desk" ? deskGrid : nav).nearestFree(spot)
    const path = nav.findPath(here(), entry)
    if (path) await walkPath(path, speed)
    if (!alive()) return false
    if (target === "desk") await moveChair(1, CHAIR_BACK_SECONDS)
    if (!alive()) return false
    if (distance(here(), spot) > 0.01) await walkPath([here(), spot], normalSpeed)
    if (!alive()) return false
    await turnTo(marker.heading)
    if (!alive()) return false
    root.current?.position.set(spot.x, 0, spot.z)
    return true
  }

  // Final state of a held pose: last frame of `_enter`, i.e. the first frame of `_loop` (skip).
  const placeInPose = (target: HeldPose) => {
    const avatar = root.current
    const marker = poses[target]
    if (!avatar || !marker) return
    resetChair()
    task.current = null
    avatar.position.set(marker.position.x, 0, marker.position.z)
    heading.current = targetHeading.current = marker.heading
    busy.current = true
    setAvatarPose(target)
    holdPose(target, 0)
    fadeTo(1, 0)
  }

  const exitSpot = (target: HeldPose): Point => {
    const marker = poses[target]!
    if (target === "desk") return deskGrid.nearestFree(deskApproach())
    return nav.nearestFree(marker.position)
  }

  const placeStanding = (target: HeldPose) => {
    const avatar = root.current
    resetChair()
    task.current = null
    busy.current = false
    if (avatar && poses[target]) {
      const spot = exitSpot(target)
      avatar.position.set(spot.x, 0, spot.z)
    }
    startClip("idle", { fade: 0 })
    setAvatarPose(null)
    fadeTo(1, 0)
  }

  const enterPose = async (target: HeldPose, speed: number, alive: () => boolean) => {
    if (!(await approachPose(target, speed, alive))) return false
    if (reduced.current) {
      placeInPose(target)
      return true
    }
    busy.current = true
    setAvatarPose(target)
    const clips = POSE_CLIPS[target]
    const action = startClip(clips.enter, { once: true })
    if (action) await finished(action)
    if (!alive()) return false
    holdPose(target)
    if (target === "desk") await moveChair(0, CHAIR_FORWARD_SECONDS, true)
    return alive()
  }

  // Leaving = `_enter` reversed, then idle (06 §3). Reuses a running exit.
  const leavePose = (): Promise<void> => {
    if (exiting.current) return exiting.current
    const target = pose.current
    if (!target) return Promise.resolve()
    const run = script(async (alive) => {
      if (reduced.current || !poses[target]) return placeStanding(target)
      busy.current = true
      await fadeTo(1)
      if (!alive()) return
      if (target === "desk") await moveChair(1, CHAIR_FORWARD_SECONDS, true)
      if (!alive()) return
      const action = startClip(POSE_CLIPS[target].enter, { once: true, reverse: true })
      if (action) await finished(action)
      if (!alive()) return
      busy.current = false
      play("idle")
      const spot = exitSpot(target)
      if (distance(here(), spot) > 0.01) await walkPath([here(), spot], normalSpeed)
      if (!alive()) return
      if (target === "desk") await moveChair(0, CHAIR_BACK_SECONDS)
      if (alive()) setAvatarPose(null)
    })
    const tracked = run.finally(() => {
      if (exiting.current === tracked) exiting.current = null
    })
    exiting.current = tracked
    return tracked
  }

  // pose_window lies inside the trash bin's collision margin; keyboard movement needs a free cell.
  const stepToFreeFloor = async () => {
    const spot = nav.nearestFree(here())
    if (distance(here(), spot) > 0.01) await walkPath([here(), spot], normalSpeed)
  }

  // Curtains (V2): both hands pull them while the morph follows the clip (contract §10.1).
  const pullCurtains = (speed: number) =>
    script(async (alive) => {
      if (!poses.window) {
        const trigger = triggers.find((t) => t.target === "window")
        return trigger && interact(trigger.face, () => useRoomStore.getState().toggleCurtains())
      }
      if (!(await approachPose("window", speed, alive))) return
      const state = useRoomStore.getState()
      const clip = state.curtainsOpen ? "curtain_close" : "curtain_open"
      const action = reduced.current ? null : startClip(clip, { once: true })
      if (!action) {
        state.toggleCurtains()
        return stepToFreeFloor()
      }
      busy.current = true
      curtainDrive.action = action
      curtainDrive.clip = clip
      state.toggleCurtains()
      await finished(action)
      if (!alive()) return
      busy.current = false
      play("idle")
      await stepToFreeFloor()
    })

  const sleep = (speed: number) =>
    script(async (alive) => {
      if (poses.bed) await enterPose("bed", speed, alive)
    })

  // Switch: used in place with `interact`; window and bed walk to their pose markers.
  const operateFixture = (target: FixtureTarget) => {
    if (target === "bed" && pose.current === "bed") return void leavePose()
    const speed = normalSpeed * SEQUENCE_SPEED_FACTOR
    if (target === "window") return void pullCurtains(speed)
    if (target === "bed") return void sleep(speed)
    const trigger = triggers.find((t) => t.target === target)
    if (!trigger) return
    task.current = null
    interact(trigger.face, () => useRoomStore.getState().toggleLight())
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
    return () => cancelScripts()
  }, [actions, gltf, scene])

  // Sequence walk (V2): leave any pose, walk to the zone's pose marker, take the pose, then zoom.
  const sequence = useRoomStore((state) => state.sequence)
  useEffect(() => {
    if (sequence?.stage !== "walk") return
    const running = sequence
    const still = () => useRoomStore.getState().sequence === running
    const zone = running.target.zone
    const arrived = () => still() && useRoomStore.getState().avatarArrived()
    leavePose().then(() => {
      if (!still()) return
      const avatar = root.current
      if (!avatar) return arrived()
      if (!poses[zone]) {
        const trigger = triggers.find((t) => t.target === zone)
        if (!trigger) return arrived()
        return walk(trigger.position, normalSpeed * SEQUENCE_SPEED_FACTOR, () => interact(trigger.face, arrived))
      }
      const entry = (zone === "desk" ? deskGrid : nav).nearestFree(zone === "desk" ? deskApproach() : poses[zone]!.position)
      const path = nav.findPath(here(), entry)
      const length = path ? pathLength(path) : 0
      const speed = Math.max(normalSpeed * SEQUENCE_SPEED_FACTOR, length / MAX_SEQUENCE_SECONDS)
      script(async (alive) => {
        if (!(await enterPose(zone, speed, alive))) return
        if (zone === "whiteboard" && !reduced.current) await wait(PONDER_SECONDS)
        if (alive()) arrived()
      })
    })
  }, [sequence?.stage, sequence?.target])

  // Back in the room view after a zone: stand up / step back (the bed is left by input instead).
  const view = useRoomStore((state) => state.view)
  useEffect(() => {
    if (view === "main" && pose.current && pose.current !== "bed") leavePose()
  }, [view])

  // End of the intro: turn toward the room camera and wave.
  const waveToken = useRoomStore((state) => state.waveToken)
  useEffect(() => {
    const avatar = root.current
    if (!waveToken || !avatar || !presets.main || busy.current || task.current || pose.current) return
    const toCamera = new THREE.Vector3(0, 0, 1).applyQuaternion(presets.main.quaternion)
    faceTowards({ x: avatar.position.x + toCamera.x, z: avatar.position.z + toCamera.z })
    playOnce("wave")
  }, [waveToken])

  // Skip / reduced motion: straight into the zone's pose (last frame of `_enter`).
  const avatarSnap = useRoomStore((state) => state.avatarSnap)
  useEffect(() => {
    const avatar = root.current
    if (!avatar || !avatarSnap) return
    cancelScripts()
    if (poses[avatarSnap.zone]) return placeInPose(avatarSnap.zone)
    const trigger = triggers.find((t) => t.target === avatarSnap.zone)
    if (!trigger) return
    resetChair()
    setAvatarPose(null)
    fadeTo(1, 0)
    const spot = nav.nearestFree(trigger.position)
    avatar.position.set(spot.x, 0, spot.z)
    heading.current = targetHeading.current = Math.atan2(trigger.face.x - spot.x, trigger.face.z - spot.z)
    play("idle")
  }, [avatarSnap])

  // Click / tap on the floor (wakes the avatar first when it sleeps).
  const walkRequest = useRoomStore((state) => state.walkRequest)
  useEffect(() => {
    const { mode, sequence } = useRoomStore.getState()
    if (!walkRequest || mode !== "roam" || sequence) return
    const go = () => walk(nav.nearestFree(walkRequest), normalSpeed)
    if (pose.current === "bed") return void leavePose().then(() => pose.current === null && go())
    if (busy.current || scripted.current) return
    go()
  }, [walkRequest])

  // F / Tap on the prompt: zones run the sequence (walk to the pose, zoom); fixtures are used.
  const interactRequest = useRoomStore((state) => state.interactRequest)
  useEffect(() => {
    const state = useRoomStore.getState()
    const target = state.nearbyTarget
    if (!interactRequest || !target || state.mode !== "roam" || state.sequence) return
    if (target === "bed" && pose.current === "bed") return void leavePose()
    if (busy.current || scripted.current) return
    if (target === "switch" || target === "window" || target === "bed") return operateFixture(target)
    state.travelTo(zoneTarget(target))
  }, [interactRequest])

  // Tap / click on the switch, window or bed itself: walk there first when far away.
  const fixtureRequest = useRoomStore((state) => state.fixtureRequest)
  useEffect(() => {
    const avatar = root.current
    const state = useRoomStore.getState()
    if (!avatar || !fixtureRequest || state.mode !== "roam" || state.sequence) return
    if (pose.current === "bed") return void leavePose()
    if (busy.current || scripted.current) return
    const target = fixtureRequest.target
    if (target !== "switch") return operateFixture(target)
    const trigger = triggers.find((t) => t.target === target)
    if (!trigger) return
    if (distance(trigger.position, here()) <= trigger.radius + TRIGGER_TOLERANCE) return operateFixture(target)
    walk(trigger.position, normalSpeed * SEQUENCE_SPEED_FACTOR, () => operateFixture(target))
  }, [fixtureRequest])

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

  // Desk & whiteboard poses: fade out once the camera has arrived (D3, D4); the exit fades back in.
  // Otherwise hide the avatar when it stands between a zoom camera and the zone's objects.
  const settledView = useRoomStore((state) => state.settledView)
  const avatarPose = useRoomStore((state) => state.avatarPose)
  useEffect(() => {
    const avatar = root.current
    if (!avatar) return
    if (avatarPose && HIDDEN_IN_ZOOM.includes(avatarPose) && view !== "main") {
      avatar.visible = true
      if (settledView === view) fadeTo(0)
      return
    }
    const preset = presets[view]
    const zone: ZoneId | null = view === "main" ? null : view === "monitor" ? "desk" : view
    if (!zone || !preset || avatarPose === zone) return void (avatar.visible = true)
    const content = new THREE.Box3()
    for (const name of ZONE_MEMBERS[zone]) {
      const node = scene.getObjectByName(name)
      if (node?.visible) content.expandByObject(node)
    }
    const towardCamera = new THREE.Vector3(0, 0, 1).applyQuaternion(preset.quaternion)
    const body = new THREE.Box3().setFromObject(avatar)
    avatar.visible = !sweepBoxes(content, towardCamera, OCCLUSION_DISTANCE).some((box) => box.intersectsBox(body))
  }, [view, settledView, avatarPose, presets, scene])

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
        const remaining = Math.hypot(dx, dz)
        if (remaining <= step) {
          avatar.position.x = goal.x
          avatar.position.z = goal.z
          step -= remaining
          walking.index++
        } else {
          avatar.position.x += (dx / remaining) * step
          avatar.position.z += (dz / remaining) * step
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
    } else if ((!busy.current || pose.current === "bed") && !scripted.current && mode === "roam" && !sequence && presets.main) {
      // Screen-relative: up on screen is away from the room camera, projected on the floor.
      const { pressed, analog } = useControls.getState()
      // Keys give full speed; the joystick scales speed with how far the knob is pushed.
      const right = analog ? analog.x : Number(isHeld(pressed, "right")) - Number(isHeld(pressed, "left"))
      const forward = analog ? analog.y : Number(isHeld(pressed, "up")) - Number(isHeld(pressed, "down"))
      const strength = analog ? Math.min(1, Math.hypot(analog.x, analog.y)) : 1
      const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(presets.main.quaternion).setY(0).normalize()
      const camRight = new THREE.Vector3(1, 0, 0).applyQuaternion(presets.main.quaternion).setY(0).normalize()
      const direction = camForward.multiplyScalar(forward).add(camRight.multiplyScalar(right))
      // Any movement input wakes the avatar; walking resumes once it stands (06 §4 V6).
      if (direction.lengthSq() > 0 && pose.current === "bed") leavePose()
      else if (direction.lengthSq() > 0) {
        direction.normalize()
        const step = normalSpeed * strength * delta
        const x = avatar.position.x + direction.x * step
        const z = avatar.position.z + direction.z * step
        // Slide along obstacles: try the full move, then each axis on its own.
        if (nav.isFree(x, z)) avatar.position.set(x, 0, z)
        else if (nav.isFree(x, avatar.position.z)) avatar.position.x = x
        else if (nav.isFree(avatar.position.x, z)) avatar.position.z = z
        targetHeading.current = Math.atan2(direction.x, direction.z)
        speed = normalSpeed * strength
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
    avatarPosition.copy(avatar.position)

    // While asleep the only action is waking up; other poses and scripts show no prompt.
    const state = useRoomStore.getState()
    if (mode !== "roam" || sequence || scripted.current) state.setNearbyTarget(null)
    else if (pose.current) state.setNearbyTarget(pose.current === "bed" ? "bed" : null)
    else {
      const near = triggers
        .map((t) => ({ t, d: Math.hypot(t.position.x - avatar.position.x, t.position.z - avatar.position.z) }))
        .filter(({ t, d }) => d <= t.radius + TRIGGER_TOLERANCE)
        .sort((a, b) => a.d - b.d)[0]
      state.setNearbyTarget(near?.t.target ?? null)
    }
  })

  return (
    <group ref={root}>
      <primitive object={gltf.scene} />
      {/* Action prompt floats above the avatar's head on desktop; mobile shows it at the bottom. */}
      {!mobile && (
        <Html position={[0, PROMPT_HEIGHT, 0]} center zIndexRange={[15, 10]}>
          <InteractPrompt />
        </Html>
      )}
    </group>
  )
}
