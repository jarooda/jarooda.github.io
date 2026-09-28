import type { ViewId } from "./scene/viewPresets"

export type ZoneId = Exclude<ViewId, "main">

export type SectionId =
  | "about-contact"
  | "techstack"
  | "blog-talks"
  | "projects"
  | "films"
  | "games"
  | "figures"
  | "books"
  | "music"
  | "gadgets"

export const SECTIONS: SectionId[] = [
  "about-contact",
  "techstack",
  "blog-talks",
  "projects",
  "films",
  "games",
  "figures",
  "books",
  "music",
  "gadgets"
]

export const SECTION_ZONE: Record<SectionId, ZoneId> = {
  "about-contact": "desk",
  techstack: "desk",
  "blog-talks": "desk",
  projects: "whiteboard",
  films: "tv",
  games: "tv",
  figures: "tv",
  books: "tv",
  music: "tv",
  gadgets: "tv"
}

export const isSection = (value: unknown): value is SectionId =>
  typeof value === "string" && (SECTIONS as string[]).includes(value)

// Top-level nodes of the Zone_* collections (asset contract §5.2–5.4). Collections are not
// exported to glTF, so zone membership is resolved by these names.
export const ZONE_MEMBERS: Record<ZoneId, string[]> = {
  desk: [
    "zone_desk",
    "deco_desk_chair",
    "int_monitor",
    "deco_keyboard",
    "deco_mouse",
    "deco_pc_tower",
    "int_rubik",
    "int_journal",
    "deco_tea_glass",
    "deco_desk_lamp"
  ],
  tv: ["zone_tv_table", "int_tv", "int_console", "int_mp3_player", "int_headset", "int_robot_figure", "int_bookshelf"],
  whiteboard: ["int_whiteboard", "deco_whiteboard_tray", "int_sticky_note_template"]
}

export type NavTargetId = "about" | "techstack" | "projects" | "blog" | "talks" | "collections" | "contact"

export interface NavTarget {
  id: NavTargetId | SectionId
  label: string
  zone: ZoneId
  section?: SectionId
  tab?: string
}

// Full quick nav (decision 10). Quick menu (decision 6) is a subset: about, blog, projects.
export const NAV_TARGETS: NavTarget[] = [
  { id: "about", label: "About", zone: "desk", section: "about-contact", tab: "about" },
  { id: "techstack", label: "Tech Stack", zone: "desk", section: "techstack" },
  { id: "projects", label: "Projects", zone: "whiteboard", section: "projects" },
  { id: "blog", label: "Blog", zone: "desk", section: "blog-talks", tab: "blog" },
  { id: "talks", label: "Talks", zone: "desk", section: "blog-talks", tab: "talks" },
  { id: "collections", label: "Collections", zone: "tv" },
  { id: "contact", label: "Contact", zone: "desk", section: "about-contact", tab: "contact" }
]

export const QUICK_MENU: { target: NavTargetId; label: string }[] = [
  { target: "about", label: "About me" },
  { target: "blog", label: "Blog" },
  { target: "projects", label: "Projects" }
]

export const navTarget = (id: NavTargetId) => NAV_TARGETS.find((t) => t.id === id)!

// Deep links accept quick nav ids (#projects, #talks) and raw section ids (#games).
export function targetFromHash(hash: string): NavTarget | null {
  const key = decodeURIComponent(hash.replace(/^#/, ""))
  if (!key) return null
  const nav = NAV_TARGETS.find((t) => t.id === key)
  if (nav) return nav
  if (isSection(key)) return { id: key, label: key, zone: SECTION_ZONE[key], section: key }
  return null
}

export function hashFor(section: SectionId | null, tab: string | undefined, zone: ZoneId | null): string {
  if (section) {
    const nav = NAV_TARGETS.find((t) => t.section === section && (t.tab === undefined || t.tab === tab))
    return nav ? nav.id : section
  }
  return zone === "tv" ? "collections" : ""
}
