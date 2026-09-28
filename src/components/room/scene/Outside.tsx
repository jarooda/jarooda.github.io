import { useFrame } from "@react-three/fiber"
import { useEffect, useMemo } from "react"
import * as THREE from "three"
import { useRoomStore } from "../store"
import { lightning } from "../systems/lightning"
import { applyWindowMask, useWindowMask } from "../systems/windowMask"
import { applyOvercast } from "../systems/weatherVisual"
import { live } from "./Atmosphere"
import { useOutsideModel } from "./roomAsset"

const CITY_LIGHT_GLOW = 2.2
// Storm lightning (V3 §3 W): the sky flashes white briefly (Weather.tsx drives `lightning`).
const FLASH_COLOR = new THREE.Color("#ffffff")
const noRaycast = () => {}

// Sky and skylines are flat, unlit silhouettes; their color is driven by the phase.
function unlit(material: THREE.Material) {
  if (!(material instanceof THREE.MeshStandardMaterial)) return
  material.color.set("#000000")
  material.emissiveIntensity = 1
  material.roughness = 1
  material.metalness = 0
}

export default function Outside({ room }: { room: THREE.Object3D }) {
  const scene = useOutsideModel()
  const mask = useWindowMask(room)
  const weather = useRoomStore((state) => state.weather)

  const materials = useMemo(() => {
    const byName = new Map<string, THREE.MeshStandardMaterial>()
    scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.raycast = noRaycast
      for (const material of [object.material].flat()) {
        applyWindowMask(material)
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
    // Weather mutes and darkens the sky/skyline the same way as the CSS background
    // (Atmosphere.tsx); the sun/moon and city lights are untouched (V3 W5, doc §3).
    const sky = materials.get("mat_sky")
    if (sky) applyOvercast(sky.emissive.copy(live.sky), weather).lerp(FLASH_COLOR, lightning.strength)
    const layers = ["mat_skyline_far", "mat_skyline_mid", "mat_skyline_near"] as const
    layers.forEach((name, i) => {
      const material = materials.get(name)
      if (material) applyOvercast(material.emissive.copy(live.skyline[i]), weather)
    })
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
