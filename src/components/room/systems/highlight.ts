import * as THREE from "three"

// Hover tint: a soft glow added on top of each material's own emission.
// Raise HIGHLIGHT_STRENGTH for a stronger glow, lower it for a subtler one.
const HIGHLIGHT = new THREE.Color("#ffffff")
const HIGHLIGHT_STRENGTH = 0.12

const originals = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>()
const highlighted = new WeakMap<THREE.Material, THREE.Material>()

function highlightMaterial(material: THREE.Material): THREE.Material {
  let clone = highlighted.get(material)
  if (!clone) {
    clone = material.clone()
    if (clone instanceof THREE.MeshStandardMaterial) {
      // Bake the original intensity in so the tint is additive, whatever the asset's emission strength.
      clone.emissive.multiplyScalar(clone.emissiveIntensity).add(HIGHLIGHT.clone().multiplyScalar(HIGHLIGHT_STRENGTH))
      clone.emissiveIntensity = 1
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
