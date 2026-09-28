import { create } from "zustand"
import type { RubikSide } from "./systems/rubikOrientation"

interface RubikState {
  side: RubikSide
  // Sticker under the pointer, in viewport pixels.
  tooltip: { name: string; x: number; y: number } | null
  // Requested face from the keyboard-accessible HUD; `token` makes repeated requests distinct.
  request: { side: RubikSide; token: number } | null
  setSide(side: RubikSide): void
  setTooltip(tooltip: RubikState["tooltip"]): void
  show(side: RubikSide): void
}

export const useRubikStore = create<RubikState>((set, get) => ({
  side: "front",
  tooltip: null,
  request: null,
  setSide: (side) => set({ side }),
  setTooltip: (tooltip) => set({ tooltip }),
  show: (side) => set({ request: { side, token: (get().request?.token ?? 0) + 1 } })
}))
