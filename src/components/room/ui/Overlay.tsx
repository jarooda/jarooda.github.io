import { useEffect, useId, useState } from "react"
import { labels } from "../labels"
import { QUICK_MENU, SECTIONS, SECTION_ZONE, navTarget } from "../sections"
import { useRoomStore } from "../store"
import { useIsMobile } from "../systems/useIsMobile"
import { buttonClass } from "./buttons"
import ExploreList from "./ExploreList"
import FallbackOffer from "./FallbackOffer"
import FpsMeter, { showFps } from "./FpsMeter"
import InteractPrompt from "./InteractPrompt"
import FeatureBar from "./FeatureBar"
import Intro from "./Intro"
import Joystick from "./Joystick"
import MobileMenu from "./MobileMenu"
import MovePad from "./MovePad"
import PopupHost from "./PopupHost"
import SimpleViewLink from "./SimpleViewLink"
import TimeControl from "./TimeControl"

// Decision 6: always-visible, first in tab order, same items as the classic menu.
// On mobile it lives at the top of the burger menu instead (user feedback).
function QuickMenu() {
  const travelTo = useRoomStore((state) => state.travelTo)
  return (
    <nav aria-label="Quick menu" className="pointer-events-none order-2 ml-auto flex gap-2">
      {QUICK_MENU.map((item) => (
        <button key={item.target} type="button" onClick={() => travelTo(navTarget(item.target))} className={buttonClass}>
          {item.label}
        </button>
      ))}
    </nav>
  )
}

// Decision 10: the full quick nav stays as a smaller secondary menu with exploration progress.
function QuickNav() {
  const visited = useRoomStore((state) => state.visited)
  const [open, setOpen] = useState(false)
  const listId = useId()

  return (
    <nav aria-label="Explore the room" className="pointer-events-none relative z-40">
      <button type="button" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((value) => !value)} className={buttonClass}>
        Explore · {visited.length}/{SECTIONS.length}
      </button>
      {open && (
        <ExploreList
          id={listId}
          onPick={() => setOpen(false)}
          className="pointer-events-auto absolute right-0 mt-2 w-48 rounded-md bg-white/95 py-1 shadow-lg backdrop-blur dark:bg-gray-800/95"
        />
      )}
    </nav>
  )
}

function StatusBar({ mobile = false }: { mobile?: boolean }) {
  const mode = useRoomStore((state) => state.mode)
  const view = useRoomStore((state) => state.view)
  const popup = useRoomStore((state) => state.popup)
  const sequence = useRoomStore((state) => state.sequence)
  const back = useRoomStore((state) => state.back)
  const zone = popup ? SECTION_ZONE[popup.section] : view

  // The room itself needs no hint: the pad, the prompt and hover labels explain the controls.
  if (sequence || mode === "roam" || mode === "intro") return null
  // On mobile, open panels cover the bottom and carry their own Close button.
  if (mobile && mode === "popup") return null
  return (
    <button type="button" onClick={back} className={buttonClass}>
      Back {mode === "popup" ? `to ${labels[zone as keyof typeof labels] ?? "room"}` : "to room"}
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
        Going to {sequence.target.section ? labels[sequence.target.section] : labels[sequence.target.zone]}… tap or press Esc to skip
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
  const mobile = useIsMobile()

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-3 md:p-4">
      {/* The quick menu comes first in the DOM (first Tab stop); `order` places it visually. */}
      <div className="relative z-40 flex items-start gap-2">
        {!mobile && <QuickMenu />}
        {mobile ? (
          <div className="ml-auto">
            <MobileMenu />
          </div>
        ) : (
          <>
            <div className="order-1">
              <TimeControl />
            </div>
            <div className="order-3">
              <QuickNav />
            </div>
          </>
        )}
      </div>

      {mobile ? (
        // Joystick (or Back) on the left, action prompt on the right.
        <div className="relative z-40 flex items-end justify-between gap-2">
          <div className="flex flex-col items-start gap-2">
            <Joystick />
            <StatusBar mobile />
          </div>
          <InteractPrompt />
        </div>
      ) : (
        <div className="relative z-40 flex items-end justify-between gap-2">
          <div className="flex flex-col items-start gap-2">
            <MovePad />
            <StatusBar />
          </div>
          <SimpleViewLink />
        </div>
      )}

      <FeatureBar mobile={mobile} />
      <SequenceSkip />
      <Intro />
      <PopupHost />
      <FallbackOffer />
      {showFps && <FpsMeter />}
    </div>
  )
}
