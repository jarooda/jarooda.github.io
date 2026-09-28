import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import * as THREE from "three"
import { live } from "./Atmosphere"
import { useOutsideModel } from "./roomAsset"

// outside.glb is only visible through the window glass (03 §5.8): the glass geometry writes a
// stencil value first, the outside meshes only draw where that value is set. Objects in front
// of the glass (curtains, wardrobe) still hide it through the depth test.
const STENCIL_REF = 1
const CITY_LIGHT_GLOW = 2.2
const noRaycast = () => {}

// Sky and skylines are flat, unlit silhouettes; their color is driven by the phase.
function unlit(material: THREE.Material) {
  if (!(material instanceof THREE.MeshStandardMaterial)) return
  material.color.set("#000000")
  material.emissiveIntensity = 1
  material.roughness = 1
  material.metalness = 0
}

function masked(material: THREE.Material) {
  material.stencilWrite = true
  material.stencilRef = STENCIL_REF
  material.stencilFunc = THREE.EqualStencilFunc
  material.stencilFail = THREE.KeepStencilOp
  material.stencilZFail = THREE.KeepStencilOp
  material.stencilZPass = THREE.KeepStencilOp
}

export default function Outside({ room }: { room: THREE.Object3D }) {
  const scene = useOutsideModel()

  const mask = useMemo(() => {
    const glass = room.getObjectByName("int_window_glass")
    if (!(glass instanceof THREE.Mesh)) {
      console.warn('[room] outside: missing "int_window_glass", the outside view stays hidden')
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
        stencilRef: STENCIL_REF,
        stencilFunc: THREE.AlwaysStencilFunc,
        stencilZPass: THREE.ReplaceStencilOp
      })
    )
    mesh.name = "outside_mask"
    mesh.matrixAutoUpdate = false
    mesh.matrix.copy(glass.matrixWorld)
    mesh.renderOrder = -10
    mesh.raycast = noRaycast
    return mesh
  }, [room])

  const materials = useMemo(() => {
    const byName = new Map<string, THREE.MeshStandardMaterial>()
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.raycast = noRaycast
      for (const material of [object.material].flat()) {
        masked(material)
        if (material instanceof THREE.MeshStandardMaterial) byName.set(material.name, material)
      }
    })
    ;["mat_sky", "mat_skyline_far", "mat_skyline_mid", "mat_skyline_near"].forEach((name) => {
      const material = byName.get(name)
      if (material) unlit(material)
    })
    // City lights are glow only: a lit base color would show as grey/orange squares in daylight.
    // They fade in and out by opacity with the phase instead of dimming into visible patches.
    const city = byName.get("emit_city_lights")
    if (city) {
      unlit(city)
      city.transparent = true
      city.depthWrite = false
    }
    return byName
  }, [scene])

  useEffect(() => {
    scene.visible = !!mask
  }, [scene, mask])

  useFrame(() => {
    materials.get("mat_sky")?.emissive.copy(live.sky)
    materials.get("mat_skyline_far")?.emissive.copy(live.skyline[0])
    materials.get("mat_skyline_mid")?.emissive.copy(live.skyline[1])
    materials.get("mat_skyline_near")?.emissive.copy(live.skyline[2])
    const city = materials.get("emit_city_lights")
    if (city) {
      city.emissiveIntensity = CITY_LIGHT_GLOW
      city.opacity = Math.min(1, live.cityLights)
      city.visible = live.cityLights > 0.01
    }
  })

  return (
    <>
      {mask && <primitive object={mask} />}
      <primitive object={scene} />
    </>
  )
}
