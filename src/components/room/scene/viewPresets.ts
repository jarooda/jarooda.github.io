import * as THREE from "three"

// "monitor" is derived from the monitor screen mesh (About & Contact close-up), not a Blender camera.
export type ViewId = "main" | "desk" | "tv" | "whiteboard" | "monitor"

// Extra zoom per view on top of the camera presets from the model: 1 = frame exactly like
// the Blender camera, >1 = closer, <1 = wider. Tune framing here without re-exporting assets.
export const VIEW_ZOOM: Record<ViewId, number> = {
  main: 1,
  desk: 1,
  tv: 1,
  whiteboard: 1,
  monitor: 1
}

// Extra zoom on portrait screens (aspect < 1), where fitting the whole preset width leaves the
// room small. The main view zooms in close and follows the avatar there (CameraRig).
export const PORTRAIT_ZOOM: Record<ViewId, number> = {
  main: 2.6,
  desk: 1,
  tv: 1,
  whiteboard: 1,
  monitor: 1
}

// Zone views are framed on the zone's own objects (user feedback: the Blender cameras frame them
// loosely): same camera angle, re-centered and sized to the content with a margin, plus room at
// the bottom for the feature bar.
const FRAME_MARGIN = 1.12
const FRAME_BOTTOM_ROOM = 0.14

export function frameContent(preset: ViewPreset, content: THREE.Box3): ViewPreset {
  if (content.isEmpty()) return preset
  const toCamera = preset.quaternion.clone().invert()
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const x of [content.min.x, content.max.x])
    for (const y of [content.min.y, content.max.y])
      for (const z of [content.min.z, content.max.z]) {
        const p = new THREE.Vector3(x, y, z).sub(preset.position).applyQuaternion(toCamera)
        minX = Math.min(minX, p.x)
        maxX = Math.max(maxX, p.x)
        minY = Math.min(minY, p.y)
        maxY = Math.max(maxY, p.y)
      }
  minY -= (maxY - minY) * FRAME_BOTTOM_ROOM
  const shift = new THREE.Vector3((minX + maxX) / 2, (minY + maxY) / 2, 0).applyQuaternion(preset.quaternion)
  return {
    ...preset,
    position: preset.position.clone().add(shift),
    halfWidth: ((maxX - minX) / 2) * FRAME_MARGIN,
    halfHeight: ((maxY - minY) / 2) * FRAME_MARGIN
  }
}

export interface ViewPreset {
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  halfWidth: number
  halfHeight: number
  near: number
  far: number
}

// Works for both glTF cameras and the placeholder: presets are read from cam_* objects,
// never used as the active camera.
export function readViewPresets(cameras: THREE.Camera[]): Partial<Record<ViewId, ViewPreset>> {
  const presets: Partial<Record<ViewId, ViewPreset>> = {}

  for (const camera of cameras) {
    if (!(camera instanceof THREE.OrthographicCamera)) continue
    const view = camera.userData.view as ViewId | undefined
    if (!view) continue

    camera.updateWorldMatrix(true, false)
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    camera.matrixWorld.decompose(position, quaternion, new THREE.Vector3())

    presets[view] = {
      position,
      quaternion,
      halfWidth: (camera.right - camera.left) / 2,
      halfHeight: (camera.top - camera.bottom) / 2,
      near: camera.near,
      far: camera.far
    }
  }

  return presets
}

export interface Frame {
  halfWidth: number
  halfHeight: number
}

// Keeps the framed area fully visible: wide screens extend horizontally,
// portrait screens extend vertically.
export function fitFrustum(frame: Frame, aspect: number): Frame {
  const frameAspect = frame.halfWidth / frame.halfHeight
  return aspect >= frameAspect
    ? { halfWidth: frame.halfHeight * aspect, halfHeight: frame.halfHeight }
    : { halfWidth: frame.halfWidth, halfHeight: frame.halfWidth / aspect }
}
