import { useEffect } from "react"
import { useRoomStore } from "../store"

// Live weather (07-rencana-v3.md §3, §5): fetched once the room's first frame is framed (never
// blocks the splash), refreshed every 15 min while the tab is active, cached in sessionStorage
// for 10 min. Any failure (timeout, network, bad payload) resolves to `null` — the room stays
// exactly as it is today, without an error message.

export type WeatherKind = "clear" | "clouds" | "rain" | "storm" | "mist"

export interface WeatherState {
  kind: WeatherKind
  // 0–1 severity of the active effect (rain/storm line density + flashes, mist opacity). 0 for
  // "clear"/"clouds" — clouds only grey the sky, they have no line/opacity effect of their own.
  intensity: number
  // 0–1 cloud cover; always present, dims the sun/window light and greys the sky regardless of kind.
  clouds: number
  // -1..1 horizontal lean for rain lines and cloud drift, from wind speed + direction.
  windX: number
  temp: number
  feelsLike: number
  humidity: number
  description: string
  isNight: boolean
}

// Same host as PUBLIC_CONTACT_ME_API (confirmed by user), different path. Read from
// PUBLIC_WEATHER_API (set in .env locally, and as the WEATHER_API secret in deploy.yml) — no
// hardcoded fallback: if it's unset, `fetchWeather` skips the request and the room stays
// weather-less, same as any other fetch failure.
export const WEATHER_API_URL: string | undefined = import.meta.env.PUBLIC_WEATHER_API

const CACHE_KEY = "room-weather"
const CACHE_MS = 10 * 60 * 1000
export const WEATHER_REFRESH_MS = 15 * 60 * 1000
const FETCH_TIMEOUT_MS = 5000

interface OpenWeatherCondition {
  id: number
  main: string
  description: string
  icon: string
}

interface OpenWeatherResponse {
  weather?: OpenWeatherCondition[]
  main?: { temp: number; feels_like: number; humidity: number }
  clouds?: { all: number }
  wind?: { speed: number; deg: number }
  visibility?: number
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

// OpenWeather condition id → effect kind (00-konsep.md §6 / 07-rencana-v3.md §2): 2xx storm,
// 3xx/5xx rain (drizzle reads as light rain), 7xx mist/haze/fog/smoke, 800 clear, 80x clouds.
// 6xx (snow) never happens in Semarang; it falls back to "clear" so nothing breaks if it ever does.
function kindFromId(id: number): WeatherKind {
  if (id >= 200 && id < 300) return "storm"
  if (id >= 300 && id < 600) return "rain"
  if (id >= 700 && id < 800) return "mist"
  if (id === 800) return "clear"
  if (id > 800 && id < 900) return "clouds"
  return "clear"
}

// Rough severity per exact condition id: light → extreme (used for rain/storm line density and
// flash rate; §3 W's "500 ringan vs 502 lebat" example).
const RAIN_STORM_INTENSITY: Record<number, number> = {
  200: 0.5, 201: 0.65, 202: 0.9, 210: 0.35, 211: 0.6, 212: 0.85, 221: 0.5, 230: 0.4, 231: 0.55, 232: 0.7,
  300: 0.15, 301: 0.2, 302: 0.3, 310: 0.2, 311: 0.25, 312: 0.35, 313: 0.3, 314: 0.4, 321: 0.25,
  500: 0.3, 501: 0.55, 502: 0.8, 503: 0.9, 504: 1, 511: 0.6, 520: 0.35, 521: 0.6, 522: 0.85, 531: 0.7
}

// Maps an OpenWeather *current weather* payload to the room's small weather shape, or null if
// the payload is missing the fields the room needs.
export function mapWeather(data: OpenWeatherResponse): WeatherState | null {
  const condition = data.weather?.[0]
  if (!condition || !data.main) return null

  const kind = kindFromId(condition.id)
  const clouds = clamp01((data.clouds?.all ?? 0) / 100)
  const intensity =
    kind === "rain" || kind === "storm"
      ? (RAIN_STORM_INTENSITY[condition.id] ?? 0.5)
      : kind === "mist"
        ? clamp01(1 - (data.visibility ?? 6000) / 10000)
        : 0

  const speed = data.wind?.speed ?? 0
  const deg = data.wind?.deg ?? 0
  const windMagnitude = Math.min(speed / 8, 1)
  const windX = windMagnitude * Math.sin((deg * Math.PI) / 180)

  return {
    kind,
    intensity,
    clouds,
    windX,
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: Math.round(data.main.humidity),
    description: condition.description,
    isNight: condition.icon.endsWith("n")
  }
}

interface CacheEntry {
  value: WeatherState
  at: number
}

function readCache(): WeatherState | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (Date.now() - entry.at > CACHE_MS) return null
    return entry.value
  } catch {
    return null
  }
}

function writeCache(value: WeatherState) {
  try {
    const entry: CacheEntry = { value, at: Date.now() }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // Ignore: the cache is a convenience only.
  }
}

// Fetches live weather (sessionStorage cache first). Resolves to null on any failure — no
// PUBLIC_WEATHER_API configured, timeout, network error, non-200, or a payload `mapWeather` can't use.
export async function fetchWeather(): Promise<WeatherState | null> {
  const cached = readCache()
  if (cached) return cached
  if (!WEATHER_API_URL) return null

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const response = await fetch(WEATHER_API_URL, { signal: controller.signal })
    if (!response.ok) return null
    const data = (await response.json()) as OpenWeatherResponse
    const weather = mapWeather(data)
    if (weather) writeCache(weather)
    return weather
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

// Fetches once the room's first frame is framed (`store.ready`), then refreshes every
// `WEATHER_REFRESH_MS` while the tab is visible (checked on the interval tick and again when the
// tab regains visibility, in case the interval fired while hidden).
export function useWeatherPolling() {
  const ready = useRoomStore((state) => state.ready)

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    let lastFetchAt = 0

    const run = async () => {
      lastFetchAt = Date.now()
      const weather = await fetchWeather()
      if (!cancelled) useRoomStore.setState({ weather })
    }

    run()
    const timer = window.setInterval(() => {
      if (!document.hidden) run()
    }, WEATHER_REFRESH_MS)
    const onVisibilityChange = () => {
      if (!document.hidden && Date.now() - lastFetchAt >= WEATHER_REFRESH_MS) run()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [ready])
}
