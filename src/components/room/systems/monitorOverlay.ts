// Bridges the canvas (which knows where the monitor screen is) and the DOM mini desktop
// (which must sit exactly on it) without re-rendering React every frame.
let element: HTMLElement | null = null

export const setMonitorElement = (next: HTMLElement | null) => {
  element = next
}

export function placeMonitorElement(rect: { left: number; top: number; width: number; height: number } | null) {
  if (!element) return
  if (!rect) {
    element.style.visibility = "hidden"
    return
  }
  element.style.visibility = "visible"
  element.style.left = `${rect.left}px`
  element.style.top = `${rect.top}px`
  element.style.width = `${rect.width}px`
  element.style.height = `${rect.height}px`
}
