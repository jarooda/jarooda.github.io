import * as THREE from "three"
import type { ZoneId } from "../sections"
import type { Point } from "./navGrid"

// Avatar poses (asset contract §5.6, §10, §10.2).
export type PoseTarget = ZoneId | "window" | "bed"

export interface PoseMarker {
  position: Point
  // Avatar rotation.y while in the pose; the avatar faces +Z at 0.
  heading: number
  facing: Point
}

// Clips per held pose: `_enter` plays once, `_loop` loops; leaving = `_enter` reversed.
// Without a loop the pose holds the last frame of `_enter` (sleeping lies still, user feedback).
export const POSE_CLIPS: Record<Exclude<PoseTarget, "window">, { enter: string; loop?: string }> = {
  desk: { enter: "sit_chair_enter", loop: "sit_chair_loop" },
  tv: { enter: "sit_floor_enter", loop: "sit_floor_loop" },
  whiteboard: { enter: "ponder_enter", loop: "ponder_loop" },
  bed: { enter: "sleep_enter" }
}

// Decisions D3/D4: the avatar is hidden once the camera frames these zones.
export const HIDDEN_IN_ZOOM: PoseTarget[] = ["desk", "whiteboard"]

export function readPoseMarkers(scene: THREE.Object3D): Partial<Record<PoseTarget, PoseMarker>> {
  const markers: Partial<Record<PoseTarget, PoseMarker>> = {}
  scene.updateMatrixWorld(true)
  scene.traverse((object) => {
    if (object.userData.type !== "pose") return
    const position = object.getWorldPosition(new THREE.Vector3())
    // The marker's local -Y (Blender) is the avatar's facing, which is local +Z after export.
    const facing = new THREE.Vector3(0, 0, 1).applyQuaternion(object.getWorldQuaternion(new THREE.Quaternion()))
    markers[object.userData.target as PoseTarget] = {
      position: { x: position.x, z: position.z },
      heading: Math.atan2(facing.x, facing.z),
      facing: { x: facing.x, z: facing.z }
    }
  })
  return markers
}

// Contract §10.1: curtain morph `closed` against the avatar clip frame (30 fps), smoothstep between keys.
const CURTAIN_KEYS: Record<"curtain_close" | "curtain_open", [number, number][]> = {
  curtain_close: [[0, 0], [6, 0], [24, 0.8], [27, 0.8], [36, 1], [45, 1]],
  curtain_open: [[0, 1], [6, 1], [15, 0.8], [18, 0.8], [36, 0], [45, 0]]
}

export type CurtainClip = keyof typeof CURTAIN_KEYS

export function curtainValue(clip: CurtainClip, seconds: number) {
  const keys = CURTAIN_KEYS[clip]
  const frame = seconds * 30
  if (frame <= keys[0][0]) return keys[0][1]
  for (let i = 1; i < keys.length; i++) {
    const [f1, v1] = keys[i]
    if (frame > f1) continue
    const [f0, v0] = keys[i - 1]
    const t = (frame - f0) / (f1 - f0)
    return v0 + (v1 - v0) * t * t * (3 - 2 * t)
  }
  return keys[keys.length - 1][1]
}

// Set by the avatar when a curtain clip starts; Fixtures drives the morph from its time and clears
// it after the last frame. The avatar clears it when the clip is cut short.
export const curtainDrive: { action: THREE.AnimationAction | null; clip: CurtainClip } = {
  action: null,
  clip: "curtain_close"
}
