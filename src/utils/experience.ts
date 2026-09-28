// 2D ↔ 3D routing (decisions 1–2): the room is the homepage, the 2D homepage is /classic.
export const ROOM_URL = "/"
export const CLASSIC_URL = "/classic"

// Manual choice ("room" | "classic"), kept across visits.
export const EXPERIENCE_KEY = "experience"
// Automatic fallback reason for this visit only (sessionStorage).
export const FALLBACK_KEY = "room-fallback"

export type Experience = "room" | "classic"

export function setExperience(value: Experience) {
  try {
    localStorage.setItem(EXPERIENCE_KEY, value)
    if (value === "room") sessionStorage.removeItem(FALLBACK_KEY)
  } catch {
    // Storage blocked: the choice simply is not remembered.
  }
}

export function setFallback(reason: string) {
  try {
    sessionStorage.setItem(FALLBACK_KEY, reason)
  } catch {
    // Ignore: the redirect still happens.
  }
}
