import type { CollectionTab } from "../../../../data/room"
import { externalLink } from "../format"

export default function CollectionPopup({ tab }: { tab: CollectionTab | undefined }) {
  if (!tab || tab.items.length === 0) return <p className="text-sm">Nothing here yet.</p>

  return (
    <ul className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
      {tab.items.map((item, index) => (
        <li key={`${item.title}-${index}`} className="py-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {item.url ? (
                <a href={item.url} {...externalLink} className="hover:underline">
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </h3>
            {item.subtitle && <span className="shrink-0 text-sm text-gray-500 dark:text-gray-400">{item.subtitle}</span>}
          </div>
          {item.meta.length > 0 && <p className="text-xs">{item.meta.join(" · ")}</p>}
          {item.notes && <p className="mt-1 text-sm italic">{item.notes}</p>}
        </li>
      ))}
    </ul>
  )
}
