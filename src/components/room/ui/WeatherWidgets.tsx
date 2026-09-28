import type { ReactElement } from "react"
import { useRoomStore } from "../store"
import type { WeatherKind } from "../systems/weather"

// Weather icons (07-rencana-v3.md §3 W5): drawn ourselves, no OpenWeather icon assets.
// Same visual language as TimeControl's Sun/Moon icons.

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
      <path d="M7 18a4 4 0 1 1 .34-7.98A5 5 0 0 1 17 11a3.5 3.5 0 0 1-.5 7H7Z" />
    </svg>
  )
}

function RainIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M7 13.5a4 4 0 1 1 .34-7.98A5 5 0 0 1 17 7.5a3.5 3.5 0 0 1-.5 6.5H7Z" fill="currentColor" stroke="none" />
      <path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3" />
    </svg>
  )
}

function StormIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
      <path d="M7 12.5a4 4 0 1 1 .34-7.98A5 5 0 0 1 17 6.5a3.5 3.5 0 0 1-.5 6H7Z" />
      <path d="M13 13l-3.5 6h2.7l-1.4 4.5 4.7-7h-2.7l1.4-3.5Z" />
    </svg>
  )
}

function MistIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 8h16M6 12h12M3 16h18M6 20h12" />
    </svg>
  )
}

const WEATHER_ICONS: Partial<Record<WeatherKind, () => ReactElement>> = {
  clouds: CloudIcon,
  rain: RainIcon,
  storm: StormIcon,
  mist: MistIcon
}

// "· 27° ☁" next to the clock. Nothing rendered while weather hasn't loaded (or failed) — the
// clock stays exactly as it was before V3.
export function WeatherSummary() {
  const weather = useRoomStore((state) => state.weather)
  if (!weather) return null
  const Icon = WEATHER_ICONS[weather.kind]
  return (
    <span data-weather-kind={weather.kind} data-weather-intensity={weather.intensity} className="flex items-center gap-1">
      <span aria-hidden="true">·</span>
      <span>{weather.temp}°</span>
      {Icon && <Icon />}
      <span className="sr-only">, {weather.description}</span>
    </span>
  )
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

// Description + feels like + humidity, shown in the clock dropdown / mobile menu panel.
export function WeatherDetails({ className = "" }: { className?: string }) {
  const weather = useRoomStore((state) => state.weather)
  if (!weather) return null
  return (
    <p className={`text-xs text-gray-600 dark:text-gray-300 ${className}`}>
      {capitalize(weather.description)} · Feels like {weather.feelsLike}° · {weather.humidity}% humidity
    </p>
  )
}
