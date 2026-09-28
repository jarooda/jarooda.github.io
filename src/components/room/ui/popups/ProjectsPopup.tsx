import type { RoomProject } from "../../../../data/room"
import { externalLink, formatDay, PROJECT_CATEGORY_LABELS } from "../format"

function Chip({ children }: { children: string }) {
  return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">{children}</span>
}

export function ProjectDetail({ project }: { project: RoomProject }) {
  const links = [
    project.demo && { label: "Live demo", url: project.demo },
    project.repo && { label: "Repository", url: project.repo }
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
      {project.related.length > 0 && (
        <section>
          <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">Related</h3>
          <div className="flex flex-wrap gap-2">
            {project.related.map((title) => (
              <Chip key={title}>{title}</Chip>
            ))}
          </div>
        </section>
      )}
      {links.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {links.map((link) => (
            <li key={link.url}>
              <a href={link.url} {...externalLink} className="text-sm font-semibold hover:underline">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
