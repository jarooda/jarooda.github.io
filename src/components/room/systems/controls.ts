import { create } from "zustand"

export type MoveKey = "up" | "down" | "left" | "right"

// Movement held down, from the keyboard or the on-screen pad. Sources are tracked separately
// so releasing a pad button never cancels a key that is still held (and vice versa).
interface ControlsState {
  pressed: Record<string, MoveKey>
  press(source: string, key: MoveKey): void
  release(source: string): void
  clear(): void
}

export const useControls = create<ControlsState>((set) => ({
  pressed: {},
  press: (source, key) => set((state) => ({ pressed: { ...state.pressed, [source]: key } })),
  release: (source) =>
    set((state) => {
      if (!(source in state.pressed)) return state
      const { [source]: _, ...rest } = state.pressed
      return { pressed: rest }
    }),
  clear: () => set({ pressed: {} })
}))

export const isHeld = (pressed: Record<string, MoveKey>, key: MoveKey) => Object.values(pressed).includes(key)
