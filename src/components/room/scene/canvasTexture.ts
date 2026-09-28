import * as THREE from "three"

export interface CanvasSurface {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  texture: THREE.CanvasTexture
}

// Canvas textures for glTF meshes: glTF UVs start top-left, so flipY stays off (03 §3).
export function createCanvasSurface(width: number, height: number): CanvasSurface {
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")!
  const texture = new THREE.CanvasTexture(canvas)
  texture.flipY = false
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return { canvas, ctx, texture }
}

// Shows a canvas on a mesh: the image drives both color and glow, so screens stay readable
// regardless of room lighting.
export function applyScreenTexture(material: THREE.Material, texture: THREE.Texture, glow = 1) {
  if (!(material instanceof THREE.MeshStandardMaterial)) return
  material.map = texture
  material.color.set("#ffffff")
  material.emissiveMap = texture
  material.emissive.set("#ffffff")
  material.emissiveIntensity = glow
  material.needsUpdate = true
}

export function meshMaterial(root: THREE.Object3D | undefined, name: string): THREE.Material | null {
  let found: THREE.Material | null = null
  root?.traverse((object) => {
    if (found || !(object instanceof THREE.Mesh)) return
    for (const material of [object.material].flat()) if (material.name === name) found = material
  })
  return found
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Image failed: ${url}`))
    image.src = url
  })
}
