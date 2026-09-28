import type { RoomProject } from "../../../../data/room"
import { useRoomData } from "../../roomData"
import { useRoomStore } from "../../store"
import { externalLink, formatDay, PROJECT_CATEGORY_LABELS } from "../format"

function Chip({ children }: { children: string }) {
  return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">{children}</span>
}

const linkLabel = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}

export function ProjectDetail({ project }: { project: RoomProject }) {
  const links = [
    project.demo && { label: "Live demo", url: project.demo },
    project.repo && { label: "Repository", url: project.repo },
    ...project.links.map((url) => ({ label: linkLabel(url), url }))
  ].filter((link): link is { label: string; url: string } => !!link)

  return (
    <article className="flex flex-col gap-4">
      {project.heroImage && <img src={project.heroImage} alt="" className="w-full rounded-md" />}
      <div className="flex flex-wrap gap-2">
        <Chip>{PROJECT_CATEGORY_LABELS[project.category] ?? project.category}</Chip>
        <Chip>{project.platform}</Chip>
        {project.pubDate && <Chip>{formatDay(project.pubDate)}</Chip>}
      </div>
      <div className="blog room-prose" dangerouslySetInnerHTML={{ __html: project.html }} />
      {project.stacks.length > 0 && (
        <section>
          <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Stack</h3>
          <div className="flex flex-wrap gap-2">
            {project.stacks.map((stack) => (
              <Chip key={stack}>{stack}</Chip>
            ))}
          </div>
        </section>
      )}
      {links.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {links.map((link) => (
            <li key={link.url}>
              <a href={link.url} {...externalLink} className="text-sm font-semibold hover:underline">
                {link.label} ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export default function ProjectsPopup() {
  const { projects } = useRoomData()
  const openProject = useRoomStore((state) => state.openProject)

  return (
    <div className="flex flex-col gap-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {projects.map((project) => (
          <li key={project.id}>
            <button
              type="button"
              onClick={() => openProject(project.id)}
              className="h-full w-full cursor-pointer rounded-md bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <span className="block font-semibold text-gray-900 dark:text-gray-100">{project.title}</span>
              <span className="text-xs">{PROJECT_CATEGORY_LABELS[project.category] ?? project.category}</span>
            </button>
          </li>
        ))}
      </ul>
      <a href="/projects" className="self-end text-sm font-semibold hover:underline">
        See all →
      </a>
    </div>
  )
}
