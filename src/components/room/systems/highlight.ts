import * as THREE from "three"

// Hover tint: a soft glow added on top of each material's own emission.
// Raise HIGHLIGHT_STRENGTH for a stronger glow, lower it for a subtler one.
const HIGHLIGHT = new THREE.Color("#ffffff")
const HIGHLIGHT_STRENGTH = 0.12

const originals = new WeakMap<THREE.Mesh, THREE.Material | THREE.Material[]>()

// Clones are made per hover, never cached: textures assigned after load (screens, whiteboard,
// Rubik logos) must show up in the highlighted copy too.
function highlightMaterial(material: THREE.Material, clones: Map<THREE.Material, THREE.Material>): THREE.Material {
  let clone = clones.get(material)
  if (!clone) {
    clone = material.clone()
    if (clone instanceof THREE.MeshStandardMaterial) {
      // Bake the original intensity in so the tint is additive, whatever the asset's emission strength.
      clone.emissive.multiplyScalar(clone.emissiveIntensity).add(HIGHLIGHT.clone().multiplyScalar(HIGHLIGHT_STRENGTH))
      clone.emissiveIntensity = 1
    }
    clones.set(material, clone)
  }
  return clone
}

// Materials such as mat_palette are shared by most of the room, so a highlight swaps in
// clones instead of mutating the shared instance.
export function setHighlight(root: THREE.Object3D, on: boolean) {
  const clones = new Map<THREE.Material, THREE.Material>()
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    if (on) {
      if (!object.visible || originals.has(object)) return
      originals.set(object, object.material)
      object.material = Array.isArray(object.material)
        ? object.material.map((m) => highlightMaterial(m, clones))
        : highlightMaterial(object.material, clones)
    } else {
      const original = originals.get(object)
      if (!original) return
      for (const clone of [object.material].flat()) clone.dispose()
      object.material = original
      originals.delete(object)
    }
  })
}
