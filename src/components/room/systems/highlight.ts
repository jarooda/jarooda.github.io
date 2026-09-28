import * as THREE from "three"

const HIGHLIGHT = new THREE.Color("#ffb347")
const HIGHLIGHT_INTENSITY = 0.35

const originals = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>()
const highlighted = new WeakMap<THREE.Material, THREE.Material>()

function highlightMaterial(material: THREE.Material): THREE.Material {
  let clone = highlighted.get(material)
  if (!clone) {
    clone = material.clone()
    if (clone instanceof THREE.MeshStandardMaterial) {
      clone.emissive.lerp(HIGHLIGHT, 0.6)
      clone.emissiveIntensity = Math.max(clone.emissiveIntensity, HIGHLIGHT_INTENSITY)
    }
    highlighted.set(material, clone)
  }
  return clone
}

// Materials such as mat_palette are shared by most of the room, so a highlight swaps in
// per-material clones instead of mutating the shared instance.
export function setHighlight(root: THREE.Object3D, on: boolean) {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !object.visible) return
    if (on) {
      if (originals.has(object)) return
      originals.set(object, object.material)
      object.material = Array.isArray(object.material)
        ? object.material.map(highlightMaterial)
        : highlightMaterial(object.material)
    } else {
      const original = originals.get(object)
      if (!original) return
      object.material = original
      originals.delete(object)
    }
  })
}
