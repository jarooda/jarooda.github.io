import gsap from "gsap"
import { useEffect, useMemo } from "react"
import * as THREE from "three"
import { useRoomStore } from "../store"
import { useReducedMotion } from "../systems/useReducedMotion"
import { meshMaterial } from "./canvasTexture"

const CURTAIN_SECONDS = 0.6
const SWITCH_TILT = THREE.MathUtils.degToRad(14)
const BULB_ON = 1
const BULB_OFF = 0.12

// Direct feedback for the light switch and curtains (K24). Room lighting per time phase,
// including what the curtains and lamp do to the light, comes with K27.
export default function Fixtures({ scene }: { scene: THREE.Object3D }) {
  const lightOn = useRoomStore((state) => state.lightOn)
  const curtainsOpen = useRoomStore((state) => state.curtainsOpen)
  const reducedMotion = useReducedMotion()

  const toggle = useMemo(() => scene.getObjectByName("int_switch_toggle") ?? null, [scene])
  const toggleRest = useMemo(() => toggle?.rotation.z ?? 0, [toggle])
  const bulb = useMemo(() => meshMaterial(scene, "emit_bulb_ceiling"), [scene])
  const curtains = useMemo(
    () =>
      ["int_window_curtain_l", "int_window_curtain_r"].flatMap((name) => {
        const mesh = scene.getObjectByName(name)
        const index = mesh instanceof THREE.Mesh ? mesh.morphTargetDictionary?.closed : undefined
        if (!(mesh instanceof THREE.Mesh) || index === undefined || !mesh.morphTargetInfluences) {
          console.warn(`[room] fixtures: "${name}" has no "closed" morph target`)
          return []
        }
        return [{ influences: mesh.morphTargetInfluences, index }]
      }),
    [scene]
  )

  useEffect(() => {
    if (toggle) toggle.rotation.z = toggleRest + (lightOn ? -SWITCH_TILT : SWITCH_TILT)
    if (bulb instanceof THREE.MeshStandardMaterial) bulb.emissiveIntensity = lightOn ? BULB_ON : BULB_OFF
  }, [lightOn, toggle, toggleRest, bulb])

  useEffect(() => {
    const target = curtainsOpen ? 0 : 1
    const tweens = curtains.map(({ influences, index }) =>
      gsap.to(influences, { [index]: target, duration: reducedMotion ? 0 : CURTAIN_SECONDS, ease: "power2.inOut" })
    )
    return () => tweens.forEach((tween) => tween.kill())
  }, [curtainsOpen, curtains, reducedMotion])

  return null
}
