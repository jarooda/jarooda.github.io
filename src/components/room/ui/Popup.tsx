import { useId, useRef, type KeyboardEvent, type ReactNode } from "react"
import { useFocusTrap } from "./useFocusTrap"

export interface TabDef {
  id: string
  label: string
}

interface PopupProps {
  title: string
  onClose: () => void
  tabs?: TabDef[]
  activeTab?: string
  onTab?: (id: string) => void
  headerAction?: ReactNode
  children: ReactNode
}

export default function Popup({ title, onClose, tabs, activeTab, onTab, headerAction, children }: PopupProps) {
  const dialog = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const panelId = useId()

  // Content changes (tabs, project detail) keep focus inside the dialog.
  const trapFocus = useFocusTrap(dialog, [activeTab, children])

  const onTabKey = (event: KeyboardEvent, index: number) => {
    if (!tabs || !onTab) return
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = tabs[(index + step + tabs.length) % tabs.length]
    onTab(next.id)
    document.getElementById(`${panelId}-tab-${next.id}`)?.focus()
  }

  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={trapFocus}
      className="room-popup pointer-events-auto fixed inset-x-0 bottom-0 z-30 flex max-h-[85dvh] flex-col rounded-t-xl bg-white text-gray-700 shadow-2xl outline-none transition-colors duration-200 md:inset-auto md:right-4 md:top-20 md:bottom-4 md:max-h-none md:w-[34rem] md:rounded-lg dark:bg-gray-800 dark:text-gray-300"
    >
      <header className="flex items-center gap-3 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
        {headerAction}
        <h2 id={titleId} className="flex-1 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-sm px-2 py-1 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Close"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </header>

      {tabs && tabs.length > 1 && (
        <div role="tablist" aria-label={title} className="flex gap-1 border-b border-gray-200 px-5 dark:border-gray-700">
          {tabs.map((tab, index) => {
            const selected = tab.id === activeTab
            return (
              <button
                key={tab.id}
                id={`${panelId}-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                onClick={() => onTab?.(tab.id)}
                onKeyDown={(event) => onTabKey(event, index)}
                className={`-mb-px cursor-pointer border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                  selected
                    ? "border-green-700 text-gray-900 dark:border-green-500 dark:text-gray-100"
                    : "border-transparent hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      <div
        id={panelId}
        role={tabs && tabs.length > 1 ? "tabpanel" : undefined}
        aria-labelledby={tabs && tabs.length > 1 ? `${panelId}-tab-${activeTab}` : undefined}
        className="flex-1 overflow-y-auto px-5 py-4"
      >
        {children}
      </div>
    </div>
  )
}
