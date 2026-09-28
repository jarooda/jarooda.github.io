// Model URLs come from the splash preloader (RoomSplash.astro) as object URLs, so nothing is
// downloaded twice. Without a preloader (or if it failed) the original paths are used.
type AssetMap = Record<string, string>

declare global {
  interface Window {
    __roomPreload?: Promise<AssetMap>
  }
}

let resolved: AssetMap | null = null
let pending: Promise<void> | null = null

// Suspends (throws the promise) until the preloader settles.
export function useAssetUrl(path: string): string {
  if (!window.__roomPreload) return path
  if (resolved) return resolved[path] ?? path
  pending ??= window.__roomPreload.then(
    (map) => void (resolved = map),
    () => void (resolved = {})
  )
  throw pending
}
