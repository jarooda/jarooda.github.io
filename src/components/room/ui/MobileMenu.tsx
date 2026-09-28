import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { CLASSIC_URL, setExperience } from "../../../utils/experience"
import { QUICK_MENU, SECTIONS, navTarget } from "../sections"
import { useRoomStore } from "../store"
import { buttonClass } from "./buttons"
import ExploreList from "./ExploreList"
import { isNightPhase, MoonIcon, PhasePicker, SunIcon, useSemarangClock } from "./TimeControl"
import { useFocusTrap } from "./useFocusTrap"

// Collapsed by default so the menu stays compact on small screens.
function Collapsible({ title, children }: { title: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  return (
    <section className="border-t border-gray-200 pt-2 dark:border-gray-700">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full cursor-pointer items-center justify-between rounded-sm px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-blue-500"
      >
        {title}
        <span aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && <div id={bodyId}>{children}</div>}
    </section>
  )
}

// Mobile menu (user feedback): the quick menu (About me · Blog · Projects) first, then the
// explore list and the time of day as collapsible sections, and the way back to the simple view.
export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  const visited = useRoomStore((state) => state.visited)
  const phase = useRoomStore((state) => state.phase)
  const travelTo = useRoomStore((state) => state.travelTo)
  const time = useSemarangClock()
  const panelId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const trapFocus = useFocusTrap(panel, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      event.stopImmediatePropagation()
      setOpen(false)
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [open])

  return (
    <div className="pointer-events-auto">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Menu"
        onClick={() => setOpen(true)}
        className={`${buttonClass} flex h-10 w-10 items-center justify-center p-0`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-gray-900/40" onClick={() => setOpen(false)}>
          <div
            ref={panel}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            tabIndex={-1}
            onKeyDown={trapFocus}
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] flex-col gap-3 overflow-y-auto bg-white p-4 text-gray-700 shadow-2xl outline-none dark:bg-gray-900 dark:text-gray-200"
          >
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold">
                {isNightPhase(phase) ? <MoonIcon /> : <SunIcon />}
                Semarang, <time>{time}</time>
              </p>
              <button type="button" onClick={() => setOpen(false)} className={buttonClass} aria-label="Close menu">
                ✕
              </button>
            </div>

            <nav aria-label="Quick menu" className="flex flex-col gap-2">
              {QUICK_MENU.map((item) => (
                <button
                  key={item.target}
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    travelTo(navTarget(item.target))
                  }}
                  className={`${buttonClass} w-full py-3 text-base`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <Collapsible title={`Explore · ${visited.length}/${SECTIONS.length}`}>
              <ExploreList onPick={() => setOpen(false)} />
            </Collapsible>

            <Collapsible title="Time of day">
              <PhasePicker className="px-1 pb-1" />
            </Collapsible>

            <a href={CLASSIC_URL} onClick={() => setExperience("classic")} className={`${buttonClass} mt-auto text-center`}>
              Simple view
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
