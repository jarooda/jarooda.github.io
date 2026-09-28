import { useEffect, useRef } from "react"
import { targetFromHash, type ZoneId } from "../sections"
import { useRoomStore } from "../store"
import { buttonClass } from "./buttons"

// Intro pan (00 §4, K35): once per visit, after the splash, the camera visits the three zones
// with a caption each, then returns to the room and the avatar waves. Skippable any time.
const STEPS: { view: ZoneId; title: string; text: string }[] = [
  { view: "desk", title: "Desk", text: "About me, contact, tech stack and blog" },
  { view: "tv", title: "TV corner", text: "Films, games, books, music and gadgets" },
  { view: "whiteboard", title: "Whiteboard", text: "Projects and how they connect" }
]
const HOLD_MS = 1400
const SEEN_KEY = "room-intro-seen"

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1"
  } catch {
    return false
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1")
  } catch {
    // Without storage the intro may show again on reload; harmless.
  }
}

export default function Intro() {
  const ready = useRoomStore((state) => state.ready)
  const step = useRoomStore((state) => state.introStep)
  const settledView = useRoomStore((state) => state.settledView)
  const endIntro = useRoomStore((state) => state.endIntro)
  const started = useRef(false)
  const skipButton = useRef<HTMLButtonElement>(null)

  // Start once, when the first view is framed.
  useEffect(() => {
    if (!ready || started.current) return
    started.current = true
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const { mode, sequence } = useRoomStore.getState()
    if (alreadySeen() || reduced || targetFromHash(window.location.hash) || sequence || mode !== "roam") return
    markSeen()
    useRoomStore.setState({ mode: "intro", introStep: 0, view: STEPS[0].view })
  }, [ready])

  // Hold each zone once the camera has arrived, then move on.
  useEffect(() => {
    if (step === null || settledView !== STEPS[step].view) return
    const timer = window.setTimeout(() => {
      if (useRoomStore.getState().introStep !== step) return
      if (step + 1 < STEPS.length) useRoomStore.setState({ introStep: step + 1, view: STEPS[step + 1].view })
      else endIntro(false)
    }, HOLD_MS)
    return () => window.clearTimeout(timer)
  }, [step, settledView, endIntro])

  useEffect(() => {
    if (step === 0) skipButton.current?.focus({ preventScroll: true })
  }, [step])

  if (step === null) return null
  const current = STEPS[step]

  return (
    <div className="pointer-events-auto fixed inset-0 z-20 cursor-pointer" onClick={() => endIntro(true)}>
      <div
        className="absolute inset-x-3 bottom-6 mx-auto flex max-w-md flex-col items-center gap-2 rounded-lg bg-white/90 p-4 text-center text-gray-700 shadow-xl backdrop-blur dark:bg-gray-800/90 dark:text-gray-200"
        onClick={(event) => event.stopPropagation()}
      >
        <p aria-live="polite">
          <span className="block text-lg font-semibold text-gray-900 dark:text-gray-100">{current.title}</span>
          <span className="text-sm">{current.text}</span>
        </p>
        <div className="flex items-center gap-3">
          <span className="flex gap-1" aria-hidden="true">
            {STEPS.map((s, i) => (
              <span key={s.view} className={`h-1.5 w-4 rounded-full ${i <= step ? "bg-gray-900 dark:bg-gray-100" : "bg-gray-300 dark:bg-gray-600"}`} />
            ))}
          </span>
          <button ref={skipButton} type="button" onClick={() => endIntro(true)} className={buttonClass}>
            Skip intro
          </button>
        </div>
      </div>
    </div>
  )
}
