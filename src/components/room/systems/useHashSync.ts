import { useEffect } from "react"
import { SECTION_ZONE, hashFor, targetFromHash, type ZoneId } from "../sections"
import { useRoomStore } from "../store"

// Deep links (#projects, #talks, #games, …) run the navigation sequence once the scene is
// framed; the hash then mirrors whatever is open so the URL can be shared.
export function useHashSync() {
  const ready = useRoomStore((state) => state.ready)

  useEffect(() => {
    if (!ready) return
    const { travelTo } = useRoomStore.getState()

    const initial = targetFromHash(window.location.hash)
    if (initial) travelTo(initial)

    const onHashChange = () => {
      const target = targetFromHash(window.location.hash)
      if (target) travelTo(target)
    }
    window.addEventListener("hashchange", onHashChange)

    const unsubscribe = useRoomStore.subscribe((state) => {
      if (state.sequence) return
      const zone: ZoneId | null = state.popup ? SECTION_ZONE[state.popup.section] : state.view === "main" || state.view === "monitor" ? null : state.view
      const hash = hashFor(state.popup?.section ?? null, state.popup?.tab, zone)
      const url = hash ? `#${hash}` : window.location.pathname + window.location.search
      if (`#${hash}` !== window.location.hash && (hash || window.location.hash)) {
        history.replaceState(null, "", url)
      }
    })

    return () => {
      window.removeEventListener("hashchange", onHashChange)
      unsubscribe()
    }
  }, [ready])
}
