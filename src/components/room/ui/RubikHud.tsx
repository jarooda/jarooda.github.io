import { useRef } from "react"
import { RUBIK_FACES } from "../rubikFaces"
import { useRubikStore } from "../rubikStore"
import { useRoomStore } from "../store"
import { SIDE_ORDER } from "../systems/rubikOrientation"
import { buttonClass } from "./buttons"
import { useFocusTrap } from "./useFocusTrap"

// Tech Stack UI while the Rubik is focused: the cube is the content, this panel names the
// current face, lists its items as text and offers keyboard-friendly face switching.
export default function RubikHud() {
  const side = useRubikStore((state) => state.side)
  const tooltip = useRubikStore((state) => state.tooltip)
  const show = useRubikStore((state) => state.show)
  const closePopup = useRoomStore((state) => state.closePopup)
  const panel = useRef<HTMLDivElement>(null)
  const trapFocus = useFocusTrap(panel)

  const face = RUBIK_FACES[side]
  const step = (delta: number) => show(SIDE_ORDER[(SIDE_ORDER.indexOf(side) + delta + SIDE_ORDER.length) % SIDE_ORDER.length])

  return (
    <>
      <div
        ref={panel}
        role="dialog"
        aria-modal="false"
        aria-label="Tech stack"
        tabIndex={-1}
        onKeyDown={trapFocus}
        className="pointer-events-auto fixed inset-x-3 bottom-16 z-30 mx-auto flex max-w-xl flex-col gap-3 rounded-lg bg-white/95 p-4 text-gray-700 shadow-2xl outline-none backdrop-blur md:bottom-6 dark:bg-gray-800/95 dark:text-gray-300"
      >
        <div className="flex items-center gap-3">
          <p className="flex-1">
            <span className="block text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Tech Stack</span>
            <span aria-live="polite" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {face.category}
            </span>
          </p>
          <button type="button" onClick={closePopup} className={buttonClass} aria-label="Close tech stack">
            Close ✕
          </button>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label={`${face.category} technologies`}>
          {face.items.map((item) => (
            <li key={item.name} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
              {item.name}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={() => step(-1)} className={buttonClass}>
            ← Previous face
          </button>
          <span className="hidden text-xs text-gray-500 sm:inline dark:text-gray-400">Drag the cube to turn it</span>
          <button type="button" onClick={() => step(1)} className={buttonClass}>
            Next face →
          </button>
        </div>
      </div>
      {tooltip && (
        <span
          role="tooltip"
          className="room-label pointer-events-none fixed z-40"
          style={{ left: tooltip.x, top: tooltip.y - 8, transform: "translate(-50%, -100%)" }}
        >
          {tooltip.name}
        </span>
      )}
    </>
  )
}
