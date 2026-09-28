import { techStack, toNineSlots, type TechItem } from "../../data/techstack"
import type { RubikSide } from "./systems/rubikOrientation"

// Side order (decision 9 leaves it to K18): the front face faces the desk camera, so it
// carries the main specialty; top and right are the other faces visible from the room.
const SIDE_CATEGORY: Record<RubikSide, string> = {
  front: "Frontend",
  top: "Languages",
  right: "Backend & Data",
  left: "Cloud",
  back: "Dev Tools",
  bottom: "Packages & Testing"
}

// Sticker background per category: a soft tint of a distinct hue (Tailwind *-200); logos get
// a white outline so their colors never blend into it.
const CATEGORY_COLORS: Record<string, string> = {
  Frontend: "#bfdbfe",
  Languages: "#fef08a",
  "Backend & Data": "#bbf7d0",
  Cloud: "#ddd6fe",
  "Dev Tools": "#fed7aa",
  "Packages & Testing": "#fbcfe8"
}

export interface RubikFace {
  side: RubikSide
  category: string
  color: string
  items: TechItem[]
  slots: TechItem[]
}

export const RUBIK_FACES: Record<RubikSide, RubikFace> = Object.fromEntries(
  (Object.entries(SIDE_CATEGORY) as [RubikSide, string][]).map(([side, category]) => {
    const items = techStack.find((c) => c.category === category)?.items ?? []
    return [side, { side, category, color: CATEGORY_COLORS[category] ?? "#f3f4f6", items, slots: toNineSlots(items) }]
  })
) as Record<RubikSide, RubikFace>
