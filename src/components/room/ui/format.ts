const formatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" })

// Dates arrive as calendar days (YYYY-MM-DD); build them locally so no timezone shifts the day.
export function formatDay(day?: string) {
  if (!day) return ""
  const [y, m, d] = day.split("-").map(Number)
  return formatter.format(new Date(y, m - 1, d))
}

export const PROJECT_CATEGORY_LABELS: Record<string, string> = {
  "web-app": "Web app",
  "mobile-app": "Mobile app",
  library: "Library",
  tool: "Tool",
  extension: "Extension",
  game: "Game",
  other: "Other"
}

export const externalLink = { target: "_blank", rel: "noreferrer" } as const
