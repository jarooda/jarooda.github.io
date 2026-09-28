import { useEffect, useRef, useState } from "react"
import { useRoomStore } from "../store"
import { setMonitorElement } from "../systems/monitorOverlay"
import { AboutContent, ContactContent } from "./popups/AboutContactPopup"
import { useFocusTrap } from "./useFocusTrap"

const APPS = [
  { id: "about", label: "About Me", icon: "👤" },
  { id: "contact", label: "Contact Me", icon: "✉️" }
] as const

const clock = () =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" }).format(new Date())

// Mini desktop drawn on top of the monitor screen in the close-up view; MonitorScreen keeps
// the element's box aligned with the projected screen.
export default function MonitorDesktop({ tab }: { tab: string | undefined }) {
  const setPopupTab = useRoomStore((state) => state.setPopupTab)
  const closePopup = useRoomStore((state) => state.closePopup)
  const root = useRef<HTMLDivElement>(null)
  const [time, setTime] = useState(clock)
  const trapFocus = useFocusTrap(root, [tab])
  const app = APPS.find((a) => a.id === tab)

  useEffect(() => {
    setMonitorElement(root.current)
    return () => setMonitorElement(null)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setTime(clock()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label="About & Contact"
      tabIndex={-1}
      onKeyDown={trapFocus}
      style={{ visibility: "hidden" }}
      className="room-monitor pointer-events-auto fixed z-30 flex flex-col overflow-hidden text-gray-800 outline-none"
    >
      <div className="flex items-center justify-between bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
        <span>jaluwibowo.id</span>
        <span className="flex items-center gap-3">
          <span>Semarang, {time}</span>
          <button type="button" onClick={closePopup} className="cursor-pointer rounded-sm px-1 hover:bg-white/20" aria-label="Turn away from the monitor">
            ✕
          </button>
        </span>
      </div>

      <div className="relative flex-1">
        <ul className="flex w-[18%] flex-col items-center gap-3 p-3">
          {APPS.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setPopupTab(a.id)}
                className={`flex w-24 cursor-pointer flex-col items-center gap-1 rounded-md p-2 text-sm font-semibold text-white hover:bg-white/15 focus-visible:bg-white/20 ${
                  a.id === tab ? "bg-white/20" : ""
                }`}
              >
                <span className="text-4xl" aria-hidden="true">
                  {a.icon}
                </span>
                {a.label}
              </button>
            </li>
          ))}
        </ul>

        {app && (
          <section
            aria-label={app.label}
            className="absolute top-[5%] right-[3%] bottom-[5%] left-[20%] flex flex-col overflow-hidden rounded-md bg-white shadow-2xl dark:bg-gray-800 dark:text-gray-300"
          >
            <header className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-3 py-1.5 dark:border-gray-700 dark:bg-gray-900">
              <h2 className="text-sm font-semibold">{app.label}</h2>
              <button
                type="button"
                onClick={() => setPopupTab("")}
                className="cursor-pointer rounded-sm px-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label={`Close ${app.label}`}
              >
                ✕
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-4">{app.id === "about" ? <AboutContent /> : <ContactContent />}</div>
          </section>
        )}
      </div>
    </div>
  )
}
