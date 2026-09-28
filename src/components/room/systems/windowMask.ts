import { useMemo } from "react"
import * as THREE from "three"

// The window glass writes 1 into the stencil buffer; other materials (outside.glb, weather
// effects) draw only where that value is set, so they're only visible through the glass
// (03 §5.8). Objects in front of the glass (curtains, wardrobe) still hide it via the depth test.
export const WINDOW_STENCIL_REF = 1

const noRaycast = () => {}

// A mesh matching the window glass geometry, in world space, that writes the stencil value.
// Render it with `renderOrder={-10}` (before the masked content) and no color/depth write.
export function useWindowMask(room: THREE.Object3D): THREE.Mesh | null {
  return useMemo(() => {
    const glass = room.getObjectByName("int_window_glass")
    if (!(glass instanceof THREE.Mesh)) {
      console.warn('[room] window mask: missing "int_window_glass"')
      return null
    }
    glass.updateWorldMatrix(true, false)
    const mesh = new THREE.Mesh(
      glass.geometry,
      new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: false,
        side: THREE.DoubleSide,
        stencilWrite: true,
        stencilRef: WINDOW_STENCIL_REF,
        stencilFunc: THREE.AlwaysStencilFunc,
        stencilZPass: THREE.ReplaceStencilOp
      })
    )
    mesh.name = "window_mask"
    mesh.matrixAutoUpdate = false
    mesh.matrix.copy(glass.matrixWorld)
    mesh.renderOrder = -10
    mesh.raycast = noRaycast
    return mesh
  }, [room])
}

// Makes `material` draw only where the mask above has written the stencil value.
export function applyWindowMask(material: THREE.Material) {
  material.stencilWrite = true
  material.stencilRef = WINDOW_STENCIL_REF
  material.stencilFunc = THREE.EqualStencilFunc
  material.stencilFail = THREE.KeepStencilOp
  material.stencilZFail = THREE.KeepStencilOp
  material.stencilZPass = THREE.KeepStencilOp
}
