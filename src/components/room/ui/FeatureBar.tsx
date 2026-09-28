import { useEffect } from "react"
import { labels } from "../labels"
import { ZONE_FEATURES, type ZoneId } from "../sections"
import { useRoomStore } from "../store"
import { buttonClass } from "./buttons"

// While a zone is framed, its objects are listed as buttons (user feedback). Hovering or
// focusing a button highlights the object; on touch screens the row scrolls sideways.
export default function FeatureBar({ mobile }: { mobile: boolean }) {
  const mode = useRoomStore((state) => state.mode)
  const view = useRoomStore((state) => state.view)
  const sequence = useRoomStore((state) => state.sequence)
  const openPopup = useRoomStore((state) => state.openPopup)
  const setHoverSection = useRoomStore((state) => state.setHoverSection)
  const features = mode === "zoom" && !sequence ? ZONE_FEATURES[view as ZoneId] : undefined

  useEffect(() => {
    if (!features) setHoverSection(null)
  }, [features, setHoverSection])

  if (!features) return null
  return (
    <nav
      aria-label={`${labels[view as ZoneId]} objects`}
      className={`pointer-events-auto fixed z-30 flex gap-2 ${
        mobile ? "inset-x-3 bottom-16 overflow-x-auto pb-1" : "bottom-4 left-1/2 -translate-x-1/2"
      }`}
    >
      {features.map((section) => (
        <button
          key={section}
          type="button"
          onPointerEnter={() => setHoverSection(section)}
          onPointerLeave={() => setHoverSection(null)}
          onFocus={() => setHoverSection(section)}
          onBlur={() => setHoverSection(null)}
          onClick={() => {
            setHoverSection(null)
            openPopup(section)
          }}
          className={`${buttonClass} shrink-0`}
        >
          {labels[section]}
        </button>
      ))}
    </nav>
  )
}
