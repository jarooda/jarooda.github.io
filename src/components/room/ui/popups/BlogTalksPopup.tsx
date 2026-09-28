import { useRoomData } from "../../roomData"
import { externalLink, formatDay } from "../format"

function Blog() {
  const { blog } = useRoomData()
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
        {blog.map((post) => (
          <li key={post.id} className="py-3">
            <a href={post.url} className="group block">
              <time className="text-xs text-gray-500 dark:text-gray-400">{formatDay(post.pubDate)}</time>
              <h3 className="font-semibold text-gray-900 group-hover:underline dark:text-gray-100">{post.title}</h3>
              <p className="text-sm">{post.description}</p>
            </a>
          </li>
        ))}
      </ul>
      <a href="/blog" className="self-end text-sm font-semibold hover:underline">
        All posts
      </a>
    </div>
  )
}

function Talks() {
  const { talks } = useRoomData()
  return (
    <div className="flex flex-col gap-5">
      {talks.map((talk) => (
        <article key={talk.id}>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{talk.title}</h3>
          <p className="text-sm italic">{talk.description}</p>
          <ul className="mt-2 flex flex-col gap-2">
            {talk.events.map((event) => (
              <li key={event.date + event.venue} className="text-sm">
                <time>{formatDay(event.date)}</time>
                {" · "}
                {event.venueUrl ? (
                  <a href={event.venueUrl} {...externalLink} className="underline">
                    {event.venue}
                  </a>
                ) : (
                  event.venue
                )}
                {event.location && <span className="text-gray-500 dark:text-gray-400"> ({event.location})</span>}
                <span className="ml-2 inline-flex gap-2">
                  {event.slides && (
                    <a href={event.slides} {...externalLink} className="font-semibold hover:underline">
                      Slides
                    </a>
                  )}
                  {event.pdf && (
                    <a href={event.pdf} {...externalLink} className="font-semibold hover:underline">
                      PDF
                    </a>
                  )}
                  {event.video && (
                    <a href={event.video} {...externalLink} className="font-semibold hover:underline">
                      Video
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </article>
      ))}
      <a href="/talks" className="self-end text-sm font-semibold hover:underline">
        All talks
      </a>
    </div>
  )
}

export default function BlogTalksPopup({ tab }: { tab: string }) {
  return tab === "talks" ? <Talks /> : <Blog />
}
