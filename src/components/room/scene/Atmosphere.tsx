import { useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { useRoomStore } from "../store"
import { lightning } from "../systems/lightning"
import {
  atmosphereAt,
  lerpAtmosphere,
  presetById,
  semarangMinutes,
  toAtmosphere,
  type Atmosphere as AtmosphereValues
} from "../systems/timePhases"
import { useReducedMotion } from "../systems/useReducedMotion"
import { applyOvercast } from "../systems/weatherVisual"

const FLASH_STRENGTH = 0.3

// The live look of the room, eased toward the current phase every frame. Lighting, the
// outside view and the window read it directly (no React re-render per frame).
export const live: AtmosphereValues = atmosphereAt(semarangMinutes()).atmosphere

const EASE_PER_SECOND = 2.5
const CLOCK_CHECK_MS = 30_000

const cssColor = (color: AtmosphereValues["sky"]) => `#${color.getHexString()}`

export default function Atmosphere() {
  const phaseOverride = useRoomStore((state) => state.phaseOverride)
  const weather = useRoomStore((state) => state.weather)
  const reducedMotion = useReducedMotion()
  const target = useRef<AtmosphereValues>(live)
  const background = useRef("")
  // Scratch colors so the CSS background can grey with the weather without mutating `live`
  // itself (other consumers — Lighting, Outside — read `live` as the un-weathered phase color).
  const bgTop = useRef(new THREE.Color())
  const bgBottom = useRef(new THREE.Color())
  // Page-wide lightning overlay (index.astro): queried once, updated by style each frame.
  const flashEl = useRef<HTMLElement | null>(null)
  useEffect(() => {
    flashEl.current = document.querySelector(".room-weather-flash")
  }, [])

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

  // Lamp default per phase (00 §6), on load only: picking a phase changes the outside, never
  // the switch (user feedback).
  useEffect(() => {
    useRoomStore.setState({ lightOn: presetById(useRoomStore.getState().phase).lampDefaultOn })
  }, [])

  useFrame((_, delta) => {
    lerpAtmosphere(live, target.current, reducedMotion ? 1 : Math.min(1, delta * EASE_PER_SECOND))

    // Background gradient behind the transparent canvas (CSS vars, registered with @property).
    // Greyed by cloud cover the same way the sky/skyline are (Outside.tsx), so the page outside
    // the window matches what's visible through it instead of only showing weather indoors.
    applyOvercast(bgTop.current.copy(live.backgroundTop), weather)
    applyOvercast(bgBottom.current.copy(live.backgroundBottom), weather)
    const next = `${cssColor(bgTop.current)} ${cssColor(bgBottom.current)}`
    if (next !== background.current) {
      background.current = next
      const root = document.documentElement.style
      root.setProperty("--room-bg-top", cssColor(bgTop.current))
      root.setProperty("--room-bg-bottom", cssColor(bgBottom.current))
    }

    // Storm flash across the page, on the same beat as the window/sky (Weather.tsx drives it).
    if (flashEl.current) flashEl.current.style.opacity = (lightning.strength * FLASH_STRENGTH).toString()
  })

  return null
}
