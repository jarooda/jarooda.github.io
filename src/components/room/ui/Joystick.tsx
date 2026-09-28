import { useRef, useState, type PointerEvent } from "react"
import { useRoomStore } from "../store"
import { useControls } from "../systems/controls"

const RADIUS = 44
const DEAD_ZONE = 0.15

// Mobile movement (user feedback): drag the knob; distance from the center sets the speed.
// Tapping the floor keeps working alongside it.
export default function Joystick() {
  const mode = useRoomStore((state) => state.mode)
  const sequence = useRoomStore((state) => state.sequence)
  const base = useRef<HTMLDivElement>(null)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const [active, setActive] = useState(false)
  // A ref as well: the first move can arrive before React re-renders with `active`.
  const dragging = useRef(false)
  if (mode !== "roam" || sequence) return null

  const move = (event: PointerEvent) => {
    const rect = base.current!.getBoundingClientRect()
    let dx = event.clientX - (rect.left + rect.width / 2)
    let dy = event.clientY - (rect.top + rect.height / 2)
    const distance = Math.hypot(dx, dy)
    if (distance > RADIUS) {
      dx = (dx / distance) * RADIUS
      dy = (dy / distance) * RADIUS
    }
    setKnob({ x: dx, y: dy })
    const x = dx / RADIUS
    const y = -dy / RADIUS
    useControls.getState().setAnalog(Math.hypot(x, y) < DEAD_ZONE ? null : { x, y })
  }

  const release = () => {
    dragging.current = false
    setActive(false)
    setKnob({ x: 0, y: 0 })
    useControls.getState().setAnalog(null)
  }

  return (
    <div
      ref={base}
      role="application"
      aria-label="Joystick: drag to walk"
      data-testid="joystick"
      onPointerDown={(event) => {
        // Capture can fail if the pointer is already gone; the drag still works without it.
        try {
          event.currentTarget.setPointerCapture(event.pointerId)
        } catch {}
        dragging.current = true
        setActive(true)
        move(event)
      }}
      onPointerMove={(event) => dragging.current && move(event)}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      className="pointer-events-auto relative h-28 w-28 touch-none select-none rounded-full border-2 border-white/60 bg-gray-900/30 shadow-md backdrop-blur-sm"
    >
      <span
        className={`absolute top-1/2 left-1/2 h-12 w-12 rounded-full shadow-lg transition-colors ${active ? "bg-white" : "bg-gray-900"}`}
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  )
}
