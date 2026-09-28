import { useEffect, useId, useState } from "react"
import { labels } from "../labels"
import { NAV_TARGETS, QUICK_MENU, SECTIONS, SECTION_ZONE, navTarget, type NavTarget } from "../sections"
import { useRoomStore } from "../store"
import { buttonClass } from "./buttons"
import MovePad from "./MovePad"
import PopupHost from "./PopupHost"
import TimeControl from "./TimeControl"

function isVisited(target: NavTarget, visited: string[]) {
  if (target.section) return visited.includes(target.section)
  return SECTIONS.some((s) => SECTION_ZONE[s] === target.zone && visited.includes(s))
}

// Decision 6: always-visible, first in tab order, same items as the classic menu.
function QuickMenu() {
  const travelTo = useRoomStore((state) => state.travelTo)
  return (
    <nav aria-label="Quick menu" className="pointer-events-none flex gap-2">
      {QUICK_MENU.map((item) => (
        <button
          key={item.target}
          type="button"
          onClick={() => travelTo(navTarget(item.target))}
          className={buttonClass}
        >
          {item.label}
        </button>
      ))}
    </nav>
  )
}

// Decision 10: the full quick nav stays as a smaller secondary menu with exploration progress.
function QuickNav() {
  const travelTo = useRoomStore((state) => state.travelTo)
  const visited = useRoomStore((state) => state.visited)
  const [open, setOpen] = useState(false)
  const listId = useId()

  return (
    <nav aria-label="Explore the room" className="pointer-events-none relative z-40">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={buttonClass}
      >
        Explore · {visited.length}/{SECTIONS.length}
      </button>
      {open && (
        <ul
          id={listId}
          className="pointer-events-auto absolute right-0 mt-2 flex w-48 flex-col rounded-md bg-white/95 py-1 text-sm shadow-lg backdrop-blur dark:bg-gray-800/95"
        >
          {NAV_TARGETS.map((target) => {
            const done = isVisited(target, visited)
            return (
              <li key={target.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    travelTo(target)
                  }}
                  className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {target.label}
                  <span aria-label={done ? "visited" : "not visited yet"} className={done ? "text-green-700 dark:text-green-400" : "text-gray-300 dark:text-gray-600"}>
                    {done ? "✓" : "○"}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </nav>
  )
}

function StatusBar() {
  const mode = useRoomStore((state) => state.mode)
  const view = useRoomStore((state) => state.view)
  const popup = useRoomStore((state) => state.popup)
  const sequence = useRoomStore((state) => state.sequence)
  const back = useRoomStore((state) => state.back)
  const zone = popup ? SECTION_ZONE[popup.section] : view

  // The room itself needs no hint: the pad, the prompt and hover labels explain the controls.
  if (sequence || mode === "roam") return null
  return (
    <button type="button" onClick={back} className={buttonClass}>
      ← Back {mode === "popup" ? `to ${labels[zone as keyof typeof labels] ?? "room"}` : "to room"}
      <span className="ml-2 hidden text-xs font-normal opacity-70 md:inline">Esc</span>
    </button>
  )
}

// Input is locked during a navigation sequence; any click or Esc skips to the end.
function SequenceSkip() {
  const sequence = useRoomStore((state) => state.sequence)
  const skip = useRoomStore((state) => state.skipSequence)
  if (!sequence) return null
  return (
    <button
      type="button"
      onClick={skip}
      className="pointer-events-auto fixed inset-0 z-20 flex cursor-pointer items-end justify-center bg-transparent pb-6"
    >
      <span className="rounded-sm bg-white/80 px-3 py-1 text-sm text-gray-700 shadow backdrop-blur dark:bg-gray-800/80 dark:text-gray-200">
        Going to {sequence.target.section ? labels[sequence.target.section] : labels[sequence.target.zone]}… click or press Esc to skip
      </span>
    </button>
  )
}

function useEscape() {
  const back = useRoomStore((state) => state.back)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") back()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [back])
}

export default function Overlay() {
  useEscape()
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 md:p-4">
      {/* Quick menu and quick nav form one group on the right, clear of the monitor's status bar. */}
      <div className="relative z-40 flex flex-wrap items-start justify-between gap-2">
        <TimeControl />
        <div className="flex flex-wrap items-start justify-end gap-2">
          <QuickMenu />
          <QuickNav />
        </div>
      </div>
      <div className="relative z-40 flex flex-col items-start gap-2">
        <MovePad />
        <StatusBar />
      </div>
      <SequenceSkip />
      <PopupHost />
    </div>
  )
}
