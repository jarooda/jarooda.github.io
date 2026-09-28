import * as THREE from "three"

export type ViewId = "main" | "desk" | "tv" | "whiteboard"

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

// Keeps the preset's framed area fully visible: wide screens extend horizontally,
// portrait screens extend vertically.
export function fitFrustum(preset: ViewPreset, aspect: number) {
  const presetAspect = preset.halfWidth / preset.halfHeight
  return aspect >= presetAspect
    ? { halfWidth: preset.halfHeight * aspect, halfHeight: preset.halfHeight }
    : { halfWidth: preset.halfWidth, halfHeight: preset.halfWidth / aspect }
}
