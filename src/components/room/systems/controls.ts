import { create } from "zustand"

export type MoveKey = "up" | "down" | "left" | "right"

// Movement held down, from the keyboard or the on-screen pad. Sources are tracked separately
// so releasing a pad button never cancels a key that is still held (and vice versa).
interface ControlsState {
  pressed: Record<string, MoveKey>
  // On-screen joystick: x = screen right, y = screen up, each -1…1 (null when released).
  analog: { x: number; y: number } | null
  setAnalog(analog: { x: number; y: number } | null): void
  press(source: string, key: MoveKey): void
  release(source: string): void
  clear(): void
}

export const useControls = create<ControlsState>((set) => ({
  pressed: {},
  analog: null,
  setAnalog: (analog) => set({ analog }),
  press: (source, key) => set((state) => ({ pressed: { ...state.pressed, [source]: key } })),
  release: (source) =>
    set((state) => {
      if (!(source in state.pressed)) return state
      const { [source]: _, ...rest } = state.pressed
      return { pressed: rest }
    }),
  clear: () => set({ pressed: {}, analog: null })
}))

export const isHeld = (pressed: Record<string, MoveKey>, key: MoveKey) => Object.values(pressed).includes(key)
