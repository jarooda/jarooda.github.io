import * as THREE from "three"

const SWEEP_STEPS = 16

// Top-level objects that sit between `target` and a camera looking along -`towardCamera`.
// The target box is swept step by step toward the camera instead of taking one bounding box of
// the whole path, which would be far too large for slanted views.
export function findOccluders(
  scene: THREE.Object3D,
  target: THREE.Box3,
  towardCamera: THREE.Vector3,
  distance: number,
  exclude: THREE.Object3D[] = []
): THREE.Object3D[] {
  const direction = towardCamera.clone().normalize()
  const sweep = Array.from({ length: SWEEP_STEPS + 1 }, (_, i) =>
    target.clone().translate(direction.clone().multiplyScalar((distance * i) / SWEEP_STEPS))
  )
  return scene.children.filter((node) => {
    if (!node.visible || exclude.includes(node) || node.name.startsWith("room_") || node.userData.zone_root) return false
    const bounds = new THREE.Box3().setFromObject(node)
    return sweep.some((box) => box.intersectsBox(bounds))
  })
}
