import * as THREE from "three"
import type { PhaseId } from "../store"

// Look of the room per time phase (00 §6, 03 §5.7). Colors are sRGB hex; intensities are
// tuned for the AgX tone mapping in Effects. `sun.direction` points from the room toward the
// sun/moon: the window is on wall A (Three.js -z), so daylight comes from -z.
export interface PhasePreset {
  id: PhaseId
  start: string
  label: string
  ambient: { color: string; intensity: number }
  ground: string
  sun: { color: string; intensity: number; direction: [number, number, number] }
  sky: string
  // Far, mid, near. Each layer is darker than the one behind it and than the sky, so buildings
  // read clearly and lit windows sit on them (user feedback).
  skyline: [string, string, string]
  cityLights: number
  background: { top: string; bottom: string }
  lampDefaultOn: boolean
  // `intensity` drives the light through the window; `glass` the glow of the pane itself, kept low
  // in dark phases so the skyline and city lights behind it are not washed out (user feedback).
  windowGlow: { color: string; intensity: number; glass: number }
  exposure: number
}

export const PHASES: PhasePreset[] = [
  {
    id: "dawn",
    start: "04:30",
    label: "Dawn",
    ambient: { color: "#9aa0cc", intensity: 0.75 },
    ground: "#4a3f55",
    sun: { color: "#b7c0ff", intensity: 0.5, direction: [-3, 3, -6] },
    sky: "#7a6bb5",
    skyline: ["#4d4578", "#3a345f", "#282443"],
    cityLights: 0.5,
    background: { top: "#3e3d68", bottom: "#d8a9a6" },
    lampDefaultOn: true,
    windowGlow: { color: "#a8b6ff", intensity: 0.7, glass: 0.2 },
    exposure: 0.95
  },
  {
    id: "morning",
    start: "06:00",
    label: "Morning",
    ambient: { color: "#fff1dc", intensity: 1.65 },
    ground: "#8a6a4f",
    sun: { color: "#ffd9a0", intensity: 3, direction: [-2.5, 4, -6] },
    sky: "#8fc5f2",
    skyline: ["#7f98b3", "#647c96", "#4b5f76"],
    cityLights: 0,
    background: { top: "#fbe9cf", bottom: "#f1c68e" },
    lampDefaultOn: false,
    windowGlow: { color: "#ffe2ad", intensity: 1.4, glass: 0.35 },
    exposure: 1
  },
  {
    id: "noon",
    start: "11:00",
    label: "Noon",
    ambient: { color: "#fffaf2", intensity: 1.75 },
    ground: "#8f7a66",
    sun: { color: "#fff6e8", intensity: 2.8, direction: [0.6, 8, -3] },
    sky: "#6fb5f0",
    skyline: ["#88a0b8", "#6b829b", "#51667e"],
    cityLights: 0,
    background: { top: "#f7efe2", bottom: "#e6d3b3" },
    lampDefaultOn: false,
    windowGlow: { color: "#ffffff", intensity: 1.5, glass: 0.35 },
    exposure: 1.02
  },
  {
    id: "afternoon",
    start: "15:00",
    label: "Afternoon",
    ambient: { color: "#ffdcb8", intensity: 1.35 },
    ground: "#7a5238",
    sun: { color: "#ffb56b", intensity: 2.6, direction: [3.5, 2.6, -6] },
    sky: "#f2a65a",
    skyline: ["#b8764f", "#94593f", "#6b3f2f"],
    cityLights: 0,
    background: { top: "#fcd9a8", bottom: "#e4935e" },
    lampDefaultOn: false,
    windowGlow: { color: "#ffc07a", intensity: 1.6, glass: 0.4 },
    exposure: 1
  },
  {
    id: "dusk",
    start: "18:00",
    label: "Dusk",
    ambient: { color: "#c7a2c9", intensity: 0.85 },
    ground: "#4d3848",
    sun: { color: "#ff8d5e", intensity: 1.1, direction: [4.5, 1.4, -6] },
    sky: "#8e5cab",
    skyline: ["#4f3862", "#3d2b4f", "#2b1f38"],
    cityLights: 0.6,
    background: { top: "#6c4c8b", bottom: "#e58f6a" },
    lampDefaultOn: false,
    windowGlow: { color: "#ff9f7a", intensity: 1, glass: 0.3 },
    exposure: 0.97
  },
  {
    id: "night",
    start: "19:00",
    label: "Night",
    ambient: { color: "#7282bd", intensity: 0.38 },
    ground: "#1f2238",
    sun: { color: "#a4b6ff", intensity: 0.4, direction: [-2, 6, -5] },
    sky: "#1d2a52",
    skyline: ["#111a36", "#0c1328", "#080d1c"],
    cityLights: 1,
    background: { top: "#1b2340", bottom: "#3b3662" },
    lampDefaultOn: true,
    windowGlow: { color: "#6f86d6", intensity: 0.55, glass: 0.08 },
    exposure: 0.95
  },
  {
    id: "latenight",
    start: "23:00",
    label: "Late night",
    ambient: { color: "#4b5683", intensity: 0.26 },
    ground: "#15172a",
    sun: { color: "#8292d4", intensity: 0.22, direction: [-1.5, 6, -5] },
    sky: "#0c1123",
    skyline: ["#070b18", "#050812", "#03050c"],
    cityLights: 0.7,
    background: { top: "#0e1224", bottom: "#24213b" },
    lampDefaultOn: true,
    windowGlow: { color: "#3f519c", intensity: 0.35, glass: 0.05 },
    exposure: 0.9
  }
]

export const BLEND_MINUTES = 30
const DAY = 24 * 60

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

// Wall-clock time in Semarang (Asia/Jakarta, WIB), not the visitor's time zone.
const semarangFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })

export const semarangClock = (date = new Date()) => semarangFormat.format(date)

export function semarangMinutes(date = new Date()) {
  return toMinutes(semarangClock(date))
}

export const presetById = (id: PhaseId) => PHASES.find((p) => p.id === id)!

// Phase at `minutes` after midnight; during the last BLEND_MINUTES before the next phase the
// preset blends linearly into it.
export function phaseAt(minutes: number): { id: PhaseId; next: PhaseId; blend: number } {
  const starts = PHASES.map((p) => toMinutes(p.start))
  let index = PHASES.length - 1
  for (let i = 0; i < PHASES.length; i++) {
    const from = starts[i]
    const to = starts[(i + 1) % PHASES.length]
    const inRange = from < to ? minutes >= from && minutes < to : minutes >= from || minutes < to
    if (inRange) index = i
  }
  const nextIndex = (index + 1) % PHASES.length
  const untilNext = (starts[nextIndex] - minutes + DAY) % DAY
  const blend = untilNext < BLEND_MINUTES ? 1 - untilNext / BLEND_MINUTES : 0
  return { id: PHASES[index].id, next: PHASES[nextIndex].id, blend }
}

// Numeric form of a preset, so it can be interpolated and eased every frame.
export interface Atmosphere {
  ambientColor: THREE.Color
  ambient: number
  ground: THREE.Color
  sunColor: THREE.Color
  sun: number
  sunDirection: THREE.Vector3
  sky: THREE.Color
  skyline: [THREE.Color, THREE.Color, THREE.Color]
  cityLights: number
  windowColor: THREE.Color
  window: number
  glass: number
  exposure: number
  backgroundTop: THREE.Color
  backgroundBottom: THREE.Color
}

export function toAtmosphere(p: PhasePreset): Atmosphere {
  return {
    ambientColor: new THREE.Color(p.ambient.color),
    ambient: p.ambient.intensity,
    ground: new THREE.Color(p.ground),
    sunColor: new THREE.Color(p.sun.color),
    sun: p.sun.intensity,
    sunDirection: new THREE.Vector3(...p.sun.direction).normalize(),
    sky: new THREE.Color(p.sky),
    skyline: [new THREE.Color(p.skyline[0]), new THREE.Color(p.skyline[1]), new THREE.Color(p.skyline[2])],
    cityLights: p.cityLights,
    windowColor: new THREE.Color(p.windowGlow.color),
    window: p.windowGlow.intensity,
    glass: p.windowGlow.glass,
    exposure: p.exposure,
    backgroundTop: new THREE.Color(p.background.top),
    backgroundBottom: new THREE.Color(p.background.bottom)
  }
}

// Moves `out` toward `target` by `t` (0–1); used both for phase blending and easing.
export function lerpAtmosphere(out: Atmosphere, target: Atmosphere, t: number) {
  const n = (a: number, b: number) => a + (b - a) * t
  out.ambientColor.lerp(target.ambientColor, t)
  out.ambient = n(out.ambient, target.ambient)
  out.ground.lerp(target.ground, t)
  out.sunColor.lerp(target.sunColor, t)
  out.sun = n(out.sun, target.sun)
  out.sunDirection.lerp(target.sunDirection, t).normalize()
  out.sky.lerp(target.sky, t)
  out.skyline.forEach((color, i) => color.lerp(target.skyline[i], t))
  out.cityLights = n(out.cityLights, target.cityLights)
  out.windowColor.lerp(target.windowColor, t)
  out.window = n(out.window, target.window)
  out.glass = n(out.glass, target.glass)
  out.exposure = n(out.exposure, target.exposure)
  out.backgroundTop.lerp(target.backgroundTop, t)
  out.backgroundBottom.lerp(target.backgroundBottom, t)
  return out
}

export function atmosphereAt(minutes: number): { id: PhaseId; atmosphere: Atmosphere } {
  const { id, next, blend } = phaseAt(minutes)
  const atmosphere = toAtmosphere(presetById(id))
  if (blend > 0) lerpAtmosphere(atmosphere, toAtmosphere(presetById(next)), blend)
  return { id, atmosphere }
}
