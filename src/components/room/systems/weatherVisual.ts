import * as THREE from "three"
import type { PhaseId, Tier } from "../store"
import type { WeatherState } from "./weather"

// Shared by the window (Outside.tsx, Weather.tsx), the page around the diorama (Atmosphere.tsx,
// ui/PageRain.tsx) and the room light (Lighting.tsx), so all read as one weather.

// 0–0.6: how much the weather darkens things. Cloud cover alone dims a little, active
// rain/storm/mist more; capped at −60% (V3 W5).
export function weatherDarken(weather: WeatherState | null) {
  if (!weather) return 0
  const active =
    weather.kind === "rain" || weather.kind === "storm"
      ? weather.intensity * 0.45
      : weather.kind === "mist"
        ? weather.intensity * 0.2
        : 0
  return Math.min(0.6, weather.clouds * 0.35 + active)
}

const DESATURATE = 0.5
// Rain (darken ≈ 0.56) takes the sky ~50% darker, clouds alone ~27%: a rainy night is clearly
// darker than a clear one (user feedback).
const SKY_DARKEN = 0.9
const grey = new THREE.Color()

// Overcast look for a sky/background color: desaturated toward its own luminance, then darkened.
// Never brightens — a fixed grey target used to turn the dark night sky lighter in the rain.
export function applyOvercast(color: THREE.Color, weather: WeatherState | null) {
  if (!weather) return color
  const luminance = 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b
  color.lerp(grey.setRGB(luminance, luminance, luminance), weather.clouds * DESATURATE)
  return color.multiplyScalar(1 - weatherDarken(weather) * SKY_DARKEN)
}

// Rain lean from the wind, in radians; positive falls toward screen-right in both places.
const RAIN_LEAN = 0.6
export const rainAngle = (windX = 0) => Math.atan(windX * RAIN_LEAN)

// 0–1 share of the drop budget. A storm is always denser than rain of the same intensity.
export function rainDensity(weather: WeatherState | null) {
  if (weather?.kind === "rain") return 0.25 + 0.55 * weather.intensity
  if (weather?.kind === "storm") return Math.min(1, 0.6 + 0.4 * weather.intensity)
  return 0
}

export const rainSpeed = (weather: WeatherState | null) => (weather?.kind === "storm" ? 1.35 : 1)

// Drops catch less light in the dark, so they fade at night instead of lighting up the sky.
const DROP_LIGHT: Record<PhaseId, number> = {
  dawn: 0.6,
  morning: 1,
  noon: 1,
  afternoon: 1,
  dusk: 0.6,
  night: 0.35,
  latenight: 0.3
}

// Overall drop brightness from the rain's intensity and the time of day.
export const rainStrength = (weather: WeatherState | null, phase: PhaseId) =>
  weather ? (0.6 + 0.4 * weather.intensity) * DROP_LIGHT[phase] : 0

// Page drop budget per tier; the window derives its count from this so both have the same
// drops per pixel on screen.
export const PAGE_DROPS: Record<Tier, number> = { high: 160, medium: 110, low: 60 }
export const DROP_MAX_PX = 90
export const DROP_WIDTH_PX = 2
// Viewport heights a page drop travels per fall (`.room-drop` keyframes: -10vh → 160vh).
export const PAGE_FALL_SCREENS = 1.7
// Share of page drops on screen at any moment: the rotated container is 150% of the viewport
// wide, and a drop is on screen for ~100vh of its 170vh fall.
const PAGE_VISIBLE_SHARE = (1 / 1.5) * (1 / PAGE_FALL_SCREENS)

// Drops on screen per full viewport at density 1.
export const dropsPerScreen = (tier: Tier) => PAGE_DROPS[tier] * PAGE_VISIBLE_SHARE

// One drop by depth (0 = far, 1 = near), the same profile in the window and on the page:
// far drops are short, faint and slow; near drops long, bright and fast. Each drop is a streak
// fading from transparent at the top to white at the bottom.
export function dropProfile(depth: number) {
  return {
    length: 0.33 + depth * 0.67, // relative to the longest drop
    opacity: 0.25 + depth * 0.45,
    duration: 1.1 - depth * 0.5 // seconds per fall at rainSpeed 1
  }
}
