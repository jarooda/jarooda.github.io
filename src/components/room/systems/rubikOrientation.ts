import * as THREE from "three"

export type RubikSide = "front" | "back" | "left" | "right" | "top" | "bottom"

// Face normals in int_rubik's local space, converted from the contract's Blender axes (§8.2).
export const SIDE_NORMALS: Record<RubikSide, THREE.Vector3> = {
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
  right: new THREE.Vector3(1, 0, 0),
  left: new THREE.Vector3(-1, 0, 0),
  top: new THREE.Vector3(0, 1, 0),
  bottom: new THREE.Vector3(0, -1, 0)
}

export const SIDE_ORDER: RubikSide[] = ["front", "right", "back", "left", "top", "bottom"]

const SIGNED_AXES = [0, 1, 2].flatMap((axis) => [1, -1].map((sign) => ({ axis, sign })))

// Anything with a camera orientation: the live camera or a view preset.
export interface ViewOrientation {
  quaternion: THREE.Quaternion
}

// The 24 rotations that leave the cube axis-aligned with the camera (right, up, toward camera).
export function alignedOrientations(camera: ViewOrientation): THREE.Quaternion[] {
  const basis = [
    new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion),
    new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion),
    new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion)
  ]
  const result: THREE.Quaternion[] = []
  for (const x of SIGNED_AXES) {
    for (const y of SIGNED_AXES) {
      if (y.axis === x.axis) continue
      const colX = basis[x.axis].clone().multiplyScalar(x.sign)
      const colY = basis[y.axis].clone().multiplyScalar(y.sign)
      const colZ = new THREE.Vector3().crossVectors(colX, colY)
      result.push(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(colX, colY, colZ)))
    }
  }
  return result
}

const closest = (candidates: THREE.Quaternion[], current: THREE.Quaternion) =>
  candidates.reduce((best, q) => (Math.abs(q.dot(current)) > Math.abs(best.dot(current)) ? q : best))

export function snapOrientation(current: THREE.Quaternion, camera: ViewOrientation) {
  return closest(alignedOrientations(camera), current)
}

// Aligned orientation that shows `side` to the camera, with as little turning as possible.
export function orientationShowing(side: RubikSide, current: THREE.Quaternion, camera: ViewOrientation) {
  const toCamera = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion)
  const candidates = alignedOrientations(camera).filter(
    (q) => SIDE_NORMALS[side].clone().applyQuaternion(q).dot(toCamera) > 0.99
  )
  return closest(candidates, current)
}

export function sideFacingCamera(orientation: THREE.Quaternion, camera: ViewOrientation): RubikSide {
  const toCamera = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion)
  return SIDE_ORDER.reduce((best, side) =>
    SIDE_NORMALS[side].clone().applyQuaternion(orientation).dot(toCamera) >
    SIDE_NORMALS[best].clone().applyQuaternion(orientation).dot(toCamera)
      ? side
      : best
  )
}
