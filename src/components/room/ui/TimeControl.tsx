import { useEffect, useId, useState } from "react"
import { useRoomStore } from "../store"
import { PHASES, semarangClock } from "../systems/timePhases"
import { buttonClass } from "./buttons"

const NIGHT_PHASES = new Set(["dusk", "night", "latenight", "dawn"])

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="currentColor">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </svg>
  )
}

// Semarang clock + manual phase picker (00 §6). The window in the room opens it too.
export default function TimeControl() {
  const phase = useRoomStore((state) => state.phase)
  const phaseOverride = useRoomStore((state) => state.phaseOverride)
  const open = useRoomStore((state) => state.timeControlOpen)
  const setOpen = useRoomStore((state) => state.setTimeControlOpen)
  const setPhaseOverride = useRoomStore((state) => state.setPhaseOverride)
  const [time, setTime] = useState(semarangClock)
  const panelId = useId()

  useEffect(() => {
    const timer = window.setInterval(() => setTime(semarangClock()), 20_000)
    return () => window.clearInterval(timer)
  }, [])

  const night = NIGHT_PHASES.has(phase)
  const label = PHASES.find((p) => p.id === phase)?.label ?? phase

  return (
    <div className="pointer-events-auto relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        className={`${buttonClass} flex items-center gap-2`}
      >
        {night ? <MoonIcon /> : <SunIcon />}
        <span>
          Semarang, <time>{time}</time>
        </span>
        {phaseOverride && <span className="rounded-sm bg-white/20 px-1.5 text-xs">{label}</span>}
      </button>
      {open && (
        <div
          id={panelId}
          role="group"
          aria-label="Time of day"
          className="absolute left-0 mt-2 flex w-56 flex-col gap-1 rounded-md bg-white/95 p-2 text-sm shadow-lg backdrop-blur dark:bg-gray-800/95"
        >
          {PHASES.map((p) => {
            const active = phaseOverride === p.id
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => setPhaseOverride(p.id)}
                className={`flex cursor-pointer items-center justify-between rounded-sm px-3 py-1.5 text-left font-semibold transition-colors ${
                  active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {p.label}
                <span className="text-xs font-normal opacity-70">{p.start}</span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => {
              setPhaseOverride(null)
              setOpen(false)
            }}
            disabled={!phaseOverride}
            className={`${buttonClass} mt-1 justify-center`}
          >
            Back to Semarang time
          </button>
        </div>
      )}
    </div>
  )
}
