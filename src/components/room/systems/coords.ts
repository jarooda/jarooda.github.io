import * as THREE from "three"

export type Vec3 = [number, number, number]

// Asset contract coordinates are Blender (Z up); glTF/Three.js is Y up: (x, y, z) -> (x, z, -y).
export const fromBlender = ([x, y, z]: Vec3): Vec3 => [x, z, -y]

export const vecFromBlender = (v: Vec3) => new THREE.Vector3(...fromBlender(v))

// Box sizes are given as Blender X × Y × Z extents.
export const sizeFromBlender = ([x, y, z]: Vec3): Vec3 => [x, z, y]
