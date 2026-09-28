import type { KeyboardEvent, PointerEvent } from "react"
import { useRoomStore } from "../store"
import { isHeld, useControls, type MoveKey } from "../systems/controls"

const PAD: { key: MoveKey; label: string; name: string; area: string }[] = [
  { key: "up", label: "W", name: "Move up", area: "col-start-2 row-start-1" },
  { key: "left", label: "A", name: "Move left", area: "col-start-1 row-start-2" },
  { key: "down", label: "S", name: "Move down", area: "col-start-2 row-start-2" },
  { key: "right", label: "D", name: "Move right", area: "col-start-3 row-start-2" }
]

// On-screen WASD: hold a button to walk. It also lights up for the matching keyboard keys,
// so both input methods show the same feedback (aria-pressed mirrors the held state).
export default function MovePad() {
  const mode = useRoomStore((state) => state.mode)
  const sequence = useRoomStore((state) => state.sequence)
  const pressed = useControls((state) => state.pressed)
  const { press, release } = useControls.getState()
  if (mode !== "roam" || sequence) return null

  const source = (key: MoveKey) => `pad-${key}`
  const holdKeys = (event: KeyboardEvent, key: MoveKey, down: boolean) => {
    if (event.key !== " " && event.key !== "Enter") return
    event.preventDefault()
    if (down) press(source(key), key)
    else release(source(key))
  }

  return (
    <div role="group" aria-label="Walk" className="pointer-events-auto grid w-max grid-cols-3 grid-rows-2 gap-1 select-none">
      {PAD.map(({ key, label, name, area }) => {
        const held = isHeld(pressed, key)
        return (
          <button
            key={key}
            type="button"
            aria-label={name}
            aria-pressed={held}
            onPointerDown={(event: PointerEvent) => {
              // Capture can fail if the pointer is already gone; holding still works without it.
              try {
                event.currentTarget.setPointerCapture(event.pointerId)
              } catch {}
              press(source(key), key)
            }}
            onPointerUp={() => release(source(key))}
            onPointerCancel={() => release(source(key))}
            onLostPointerCapture={() => release(source(key))}
            onKeyDown={(event) => holdKeys(event, key, true)}
            onKeyUp={(event) => holdKeys(event, key, false)}
            onBlur={() => release(source(key))}
            onContextMenu={(event) => event.preventDefault()}
            className={`${area} h-11 w-11 touch-none cursor-pointer rounded-sm text-sm font-bold shadow-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
              held
                ? "bg-white text-gray-900 ring-2 ring-gray-900"
                : "bg-gray-900 text-white hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
