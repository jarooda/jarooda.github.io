import { labels } from "../labels"
import { useRoomStore, type TriggerTarget } from "../store"
import { useMediaQuery } from "../systems/useMediaQuery"
import { buttonClass } from "./buttons"

function actionLabel(target: TriggerTarget, lightOn: boolean, curtainsOpen: boolean, asleep: boolean) {
  if (target === "switch") return lightOn ? "Turn off the light" : "Turn on the light"
  if (target === "window") return curtainsOpen ? "Close the curtains" : "Open the curtains"
  if (target === "bed") return asleep ? "Wake up" : "Sleep"
  return `Open ${labels[target]}`
}

// "F · Open Desk" on desktop, "Tap · Open Desk" on touch screens, shown above the avatar.
export default function InteractPrompt() {
  const target = useRoomStore((state) => state.nearbyTarget)
  const lightOn = useRoomStore((state) => state.lightOn)
  const curtainsOpen = useRoomStore((state) => state.curtainsOpen)
  const asleep = useRoomStore((state) => state.avatarPose === "bed")
  const requestInteract = useRoomStore((state) => state.requestInteract)
  const touch = useMediaQuery("(pointer: coarse)")

  if (!target) return null
  return (
    <button type="button" onClick={requestInteract} className={buttonClass} aria-keyshortcuts="F">
      <span className="mr-2 rounded-sm bg-white/20 px-1.5 py-0.5 text-xs">{touch ? "Tap" : "F"}</span>
      {actionLabel(target, lightOn, curtainsOpen, asleep)}
    </button>
  )
}
