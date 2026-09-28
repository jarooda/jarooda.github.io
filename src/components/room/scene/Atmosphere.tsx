import { useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import { useRoomStore } from "../store"
import {
  atmosphereAt,
  lerpAtmosphere,
  presetById,
  semarangMinutes,
  toAtmosphere,
  type Atmosphere as AtmosphereValues
} from "../systems/timePhases"
import { useReducedMotion } from "../systems/useReducedMotion"

// The live look of the room, eased toward the current phase every frame. Lighting, the
// outside view and the window read it directly (no React re-render per frame).
export const live: AtmosphereValues = atmosphereAt(semarangMinutes()).atmosphere

const EASE_PER_SECOND = 2.5
const CLOCK_CHECK_MS = 30_000

const cssColor = (color: AtmosphereValues["sky"]) => `#${color.getHexString()}`

export default function Atmosphere() {
  const phaseOverride = useRoomStore((state) => state.phaseOverride)
  const reducedMotion = useReducedMotion()
  const target = useRef<AtmosphereValues>(live)
  const background = useRef("")

  // Target: the override preset, or Semarang time (checked every 30 s for the 30-min blends).
  useEffect(() => {
    const update = () => {
      if (phaseOverride) {
        target.current = toAtmosphere(presetById(phaseOverride))
        useRoomStore.setState({ phase: phaseOverride })
      } else {
        const { id, atmosphere } = atmosphereAt(semarangMinutes())
        target.current = atmosphere
        useRoomStore.setState({ phase: id })
      }
    }
    update()
    if (phaseOverride) return
    const timer = window.setInterval(update, CLOCK_CHECK_MS)
    return () => window.clearInterval(timer)
  }, [phaseOverride])

  // Lamp default per phase (00 §6): on load, and when a phase is picked manually.
  useEffect(() => {
    const phase = phaseOverride ?? useRoomStore.getState().phase
    useRoomStore.setState({ lightOn: presetById(phase).lampDefaultOn })
  }, [phaseOverride])

  useFrame((_, delta) => {
    lerpAtmosphere(live, target.current, reducedMotion ? 1 : Math.min(1, delta * EASE_PER_SECOND))
    // Background gradient behind the transparent canvas (CSS vars, registered with @property).
    const next = `${cssColor(live.backgroundTop)} ${cssColor(live.backgroundBottom)}`
    if (next !== background.current) {
      background.current = next
      const root = document.documentElement.style
      root.setProperty("--room-bg-top", cssColor(live.backgroundTop))
      root.setProperty("--room-bg-bottom", cssColor(live.backgroundBottom))
    }
  })

  return null
}
