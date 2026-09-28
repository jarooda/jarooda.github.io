import { useMediaQuery } from "./useMediaQuery"

// "Mobile" UI (burger menu, joystick, prompt at the bottom): narrow screens or touch devices.
export const MOBILE_QUERY = "(max-width: 639px), (pointer: coarse)"

export function useIsMobile() {
  return useMediaQuery(MOBILE_QUERY)
}
