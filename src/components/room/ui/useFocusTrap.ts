import { useEffect, type KeyboardEvent, type RefObject } from "react"

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Focuses the dialog on open, returns focus to the previous element on close,
// and keeps Tab / Shift+Tab inside. Returns the keydown handler for the dialog element.
export function useFocusTrap(dialog: RefObject<HTMLElement | null>, deps: unknown[] = []) {
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialog.current?.focus()
    return () => {
      if (previous?.isConnected) previous.focus()
    }
  }, [])

  useEffect(() => {
    if (!dialog.current?.contains(document.activeElement)) dialog.current?.focus()
  }, deps)

  return (event: KeyboardEvent) => {
    if (event.key !== "Tab" || !dialog.current) return
    const items = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null)
    if (items.length === 0) return event.preventDefault()
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
}
