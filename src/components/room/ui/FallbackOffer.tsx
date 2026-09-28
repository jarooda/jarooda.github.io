import { useRef } from "react"
import { CLASSIC_URL, setFallback } from "../../../utils/experience"
import { useRoomStore, type RuntimeIssue } from "../store"
import { buttonClass } from "./buttons"
import { useFocusTrap } from "./useFocusTrap"

const MESSAGES: Record<RuntimeIssue, { title: string; body: string; canStay: boolean }> = {
  "context-lost": {
    title: "The 3D view stopped working",
    body: "Your browser had to reset the graphics. The simple view shows the same content.",
    canStay: false
  },
  "load-failed": {
    title: "The room could not be loaded",
    body: "Some parts of the room failed to download. The simple view shows the same content.",
    canStay: false
  },
  slow: {
    title: "The room is running slowly",
    body: "This device is struggling with the 3D view. The simple view is lighter and shows the same content.",
    canStay: true
  }
}

// Runtime fallback (K32): offered, never forced; the choice counts for this visit only.
export default function FallbackOffer() {
  const issue = useRoomStore((state) => state.runtimeIssue)
  const reportIssue = useRoomStore((state) => state.reportIssue)
  const dialog = useRef<HTMLDivElement>(null)
  const trapFocus = useFocusTrap(dialog, [issue])
  if (!issue) return null
  const message = MESSAGES[issue]

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 grid place-items-center bg-gray-900/40 p-4">
      <div
        ref={dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="room-fallback-title"
        aria-describedby="room-fallback-body"
        tabIndex={-1}
        onKeyDown={trapFocus}
        className="flex max-w-sm flex-col gap-3 rounded-lg bg-white p-5 text-gray-700 shadow-2xl outline-none dark:bg-gray-800 dark:text-gray-300"
      >
        <h2 id="room-fallback-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {message.title}
        </h2>
        <p id="room-fallback-body" className="text-sm">
          {message.body}
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          {message.canStay ? (
            <button type="button" onClick={() => reportIssue(null)} className={buttonClass}>
              Stay in the room
            </button>
          ) : (
            <button type="button" onClick={() => window.location.reload()} className={buttonClass}>
              Try again
            </button>
          )}
          <a href={CLASSIC_URL} onClick={() => setFallback(issue)} className={buttonClass}>
            Go to simple view
          </a>
        </div>
      </div>
    </div>
  )
}
