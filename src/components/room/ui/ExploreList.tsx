import { NAV_TARGETS, SECTIONS, SECTION_ZONE, type NavTarget } from "../sections"
import { useRoomStore } from "../store"

function isVisited(target: NavTarget, visited: string[]) {
  if (target.section) return visited.includes(target.section)
  return SECTIONS.some((s) => SECTION_ZONE[s] === target.zone && visited.includes(s))
}

// Full quick nav (decision 10) with visited marks; used by the Explore dropdown and the mobile menu.
export default function ExploreList({ id, onPick, className = "" }: { id?: string; onPick?: () => void; className?: string }) {
  const travelTo = useRoomStore((state) => state.travelTo)
  const visited = useRoomStore((state) => state.visited)
  return (
    <ul id={id} className={`flex flex-col text-sm ${className}`}>
      {NAV_TARGETS.map((target) => {
        const done = isVisited(target, visited)
        return (
          <li key={target.id}>
            <button
              type="button"
              onClick={() => {
                onPick?.()
                travelTo(target)
              }}
              className="flex w-full cursor-pointer items-center justify-between rounded-sm px-3 py-2 text-left text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {target.label}
              <span aria-label={done ? "visited" : "not visited yet"} className={done ? "text-green-700 dark:text-green-400" : "text-gray-300 dark:text-gray-600"}>
                {done ? "✓" : "○"}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
