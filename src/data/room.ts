import { getCollection, type CollectionEntry, type DataEntryMap } from "astro:content"
import { compiledContent as aboutHtml } from "../components/AboutMeContent.md"
import { talks, topics, venue } from "../content/talks"
import { filterEnPost, sortPosts } from "../utils/posts-helper"

export const WHITEBOARD_PROJECTS = 8

export interface RoomProject {
  id: string
  title: string
  category: string
  platform: string
  status: string
  stacks: string[]
  heroImage?: string
  repo?: string
  demo?: string
  // Titles of linked projects (ProjectC graph edges, both directions, abandoned excluded).
  related: string[]
  pubDate?: string
  updatedDate?: string
  html: string
}

export interface RoomBlogPost {
  id: string
  title: string
  description: string
  pubDate: string
  heroImage?: string
  tags: string[]
  url: string
}

export interface RoomTalkEvent {
  date: string
  venue: string
  venueUrl?: string
  location?: string
  slides?: string
  pdf?: string
  video?: string
}

export interface RoomTalk {
  id: string
  title: string
  description: string
  events: RoomTalkEvent[]
}

export interface CollectionItem {
  title: string
  subtitle?: string
  meta: string[]
  notes?: string
  url?: string
}

export interface CollectionTab {
  id: string
  label: string
  items: CollectionItem[]
}

export type CollectionSectionId = "films" | "games" | "figures" | "books" | "music" | "gadgets"

export interface RoomData {
  about: { html: string }
  projects: RoomProject[]
  blog: RoomBlogPost[]
  talks: RoomTalk[]
  collections: Record<CollectionSectionId, CollectionTab[]>
}

// Markdown headings carry autolink anchors (rehype-autolink-headings); the 2D /about page removes
// them client-side, the room strips them once here for every HTML it receives.
const stripHeadingAnchors = (html: string) => html.replace(/<a class="anchor-link"[^>]*>[\s\S]*?<\/a>/g, "")

const isValid = (date?: Date): date is Date => !!date && !Number.isNaN(date.valueOf())

// Frontmatter dates are calendar dates; format from local fields so the build timezone can't shift the day.
const toDay = (date?: Date) =>
  isValid(date)
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : undefined

// Invalid or missing dates sort as oldest instead of breaking the build.
const time = (date?: Date) => (isValid(date) ? date.valueOf() : 0)

// Sheet-backed collections are empty (or missing) without Google credentials; the room must still build.
async function safeCollection<C extends keyof DataEntryMap>(name: C): Promise<CollectionEntry<C>[]> {
  try {
    return await getCollection(name)
  } catch {
    console.warn(`[room] collection "${name}" is unavailable`)
    return []
  }
}

// Newest first: updatedDate, then pubDate (same rule the whiteboard has always used).
const byRecency = (a: CollectionEntry<"project">, b: CollectionEntry<"project">) =>
  (time(b.data.updatedDate) || time(b.data.pubDate)) - (time(a.data.updatedDate) || time(a.data.pubDate)) ||
  time(b.data.pubDate) - time(a.data.pubDate)

async function getProjects(): Promise<RoomProject[]> {
  const all = await getCollection("project", ({ data }) => data.status !== "abandoned")
  const titles = new Set(all.map(({ data }) => data.title))
  const related = new Map<string, Set<string>>()
  const connect = (a: string, b: string) => {
    if (a === b || !titles.has(a) || !titles.has(b)) return
    related.set(a, (related.get(a) ?? new Set()).add(b))
    related.set(b, (related.get(b) ?? new Set()).add(a))
  }
  for (const { data } of all) for (const link of data.links ?? []) connect(data.title, link)

  // V3 (decision 3, F1/F2): featured projects only (any status but abandoned), newest first, up
  // to 8. Nothing featured yet → fall back to the old rule so the board is never empty.
  const featured = all.filter(({ data }) => data.featured).sort(byRecency).slice(0, WHITEBOARD_PROJECTS)
  const selected =
    featured.length > 0
      ? featured
      : all
          .filter(({ data }) => data.status === "completed")
          .sort(byRecency)
          .slice(0, WHITEBOARD_PROJECTS)

  return selected
    .map(({ id, data, rendered }) => ({
      id,
      title: data.title,
      category: data.category,
      platform: data.platform,
      status: data.status,
      stacks: data.stacks,
      heroImage: data.heroImage,
      repo: data.repo,
      demo: data.demo,
      related: [...(related.get(data.title) ?? [])],
      pubDate: toDay(data.pubDate),
      updatedDate: toDay(data.updatedDate),
      html: stripHeadingAnchors(rendered?.html ?? "")
    }))
}

async function getBlog(): Promise<RoomBlogPost[]> {
  const posts: CollectionEntry<"blog">[] = sortPosts(filterEnPost(await getCollection("blog")))

  return posts.map(({ id, data }) => ({
    id,
    title: data.title,
    description: data.description,
    pubDate: toDay(data.pubDate) ?? "",
    heroImage: data.heroImage,
    tags: data.tags,
    url: `/blog/${id}/`
  }))
}

function getTalks(): RoomTalk[] {
  const venues: Record<string, { name: string; link?: string; location?: string }> = venue

  return topics
    .map((topic) => {
      const events = (talks[topic.id as keyof typeof talks] ?? [])
        .map((event) => ({
          date: event.date,
          venue: venues[event.venue]?.name ?? event.venue,
          venueUrl: venues[event.venue]?.link,
          location: venues[event.venue]?.location,
          slides: event.slides || undefined,
          pdf: event.pdf || undefined,
          video: event.video || undefined
        }))
        .sort((a, b) => b.date.localeCompare(a.date))

      return { id: topic.id, title: topic.title, description: topic.description, events }
    })
    .sort((a, b) => (b.events[0]?.date ?? "").localeCompare(a.events[0]?.date ?? ""))
}

async function getCollections(): Promise<RoomData["collections"]> {
  const [movies, series, anime, games, friendCodes, figures, books, musics, gadgets] =
    await Promise.all([
      safeCollection("movies"),
      safeCollection("series"),
      safeCollection("anime"),
      safeCollection("games"),
      safeCollection("friendCodes"),
      safeCollection("figures"),
      safeCollection("books"),
      safeCollection("musics"),
      safeCollection("gadgets")
    ])

  // Same columns as the 2D /collections (and /friend-code) tables: a title plus one column (user feedback).
  const pairs = <T,>(entries: { data: T }[], title: (data: T) => string, subtitle: (data: T) => string | undefined) =>
    entries.map(({ data }) => ({ title: title(data), subtitle: subtitle(data) || undefined, meta: [] }))

  return {
    films: [
      { id: "movies", label: "Movies", items: pairs(movies, (d) => d.title, (d) => d.director) },
      { id: "series", label: "Series", items: pairs(series, (d) => d.title, (d) => d.writer) },
      { id: "anime", label: "Anime", items: pairs(anime, (d) => d.title, (d) => d.studio) }
    ],
    games: [
      { id: "games", label: "Games", items: pairs(games, (d) => d.title, (d) => d.status) },
      {
        id: "friend-codes",
        label: "Friend codes",
        items: friendCodes.map(({ data }) => ({
          title: data.platform,
          subtitle: data.friend_code || undefined,
          meta: [],
          url: data.web || undefined
        }))
      }
    ],
    figures: [{ id: "figures", label: "Figures", items: pairs(figures, (d) => [d.type, d.name].filter(Boolean).join(" "), (d) => d.manufacturer) }],
    books: [{ id: "books", label: "Books", items: pairs(books, (d) => d.title, (d) => d.author) }],
    music: [{ id: "musics", label: "Music", items: pairs(musics, (d) => d.title, (d) => d.artist) }],
    gadgets: [{ id: "gadgets", label: "Gadgets", items: pairs(gadgets, (d) => d.name, (d) => d.brand) }]
  }
}

export async function getRoomData(): Promise<RoomData> {
  const [projects, blog, collections, about] = await Promise.all([
    getProjects(),
    getBlog(),
    getCollections(),
    aboutHtml()
  ])

  return { about: { html: stripHeadingAnchors(about) }, projects, blog, talks: getTalks(), collections }
}
