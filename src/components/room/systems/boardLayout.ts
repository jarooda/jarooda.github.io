// Whiteboard layout as a tiny ProjectC graph: sticky notes for the board projects, marker
// "hubs" for linked projects that are not on the board, edges from `related`.
// Deterministic (seeded) so the board looks the same on every visit.

export interface BoardProject {
  id: string
  title: string
  related: string[]
}

export interface Area {
  left: number
  top: number
  right: number
  bottom: number
}

export interface PlacedNote<P extends BoardProject = BoardProject> {
  project: P | null
  x: number
  y: number
  tilt: number
}

export interface PlacedHub {
  title: string
  x: number
  y: number
}

export interface BoardLayout<P extends BoardProject = BoardProject> {
  notes: PlacedNote<P>[]
  hubs: PlacedHub[]
  edges: { from: { x: number; y: number }; to: { x: number; y: number }; toHub: boolean }[]
}

const MAX_HUBS = 5
const ITERATIONS = 400
const TILT_DEGREES = 8

// Small deterministic PRNG (mulberry32).
function random(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// `hubWidth` measures a hub's circled label so it gets as much room as it visually needs.
export function layoutBoard<P extends BoardProject>(
  projects: P[],
  area: Area,
  noteSize: number,
  hubWidth: (title: string) => number
): BoardLayout<P> {
  const rand = random(7)
  const onBoard = new Set(projects.map((p) => p.title))
  const hubDegree = new Map<string, number>()
  for (const project of projects) {
    for (const title of project.related) if (!onBoard.has(title)) hubDegree.set(title, (hubDegree.get(title) ?? 0) + 1)
  }
  const hubTitles = [...hubDegree.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_HUBS)
    .map(([title]) => title)

  const width = area.right - area.left
  const height = area.bottom - area.top
  const centerX = area.left + width / 2
  const centerY = area.top + height / 2

  // Collision radius: a tilted note needs its half-diagonal, a hub half its label width.
  type Node = { key: string; x: number; y: number; hub: boolean; radius: number; pinned?: boolean }
  const noteRadius = noteSize * 0.72
  const hubs: Node[] = hubTitles.map((title, i) => ({
    key: title,
    x: area.left + (width * (i + 1)) / (hubTitles.length + 1),
    y: centerY + (i % 2 ? -1 : 1) * height * 0.18,
    hub: true,
    radius: hubWidth(title) / 2
  }))
  const notes: Node[] = projects.map((project) => {
    const anchor = hubs.find((h) => project.related.includes(h.key))
    return {
      key: project.title,
      x: (anchor?.x ?? centerX) + (rand() - 0.5) * noteSize * 3,
      y: (anchor?.y ?? centerY) + (rand() - 0.5) * noteSize * 3,
      hub: false,
      radius: noteRadius
    }
  })
  // "See all" sits in the bottom-right corner, pinned so the graph keeps clear of it.
  const seeAll: Node = { key: "", x: area.right - noteRadius, y: area.bottom - noteRadius, hub: false, radius: noteRadius, pinned: true }
  const nodes = [...hubs, ...notes, seeAll]
  const index = new Map(nodes.map((n, i) => [n.key, i]))
  const edges: [number, number][] = []
  for (const project of projects) {
    for (const title of project.related) {
      const a = index.get(project.title)!
      const b = index.get(title)
      if (b !== undefined && !edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) edges.push([a, b])
    }
  }

  const gap = noteSize * 0.18
  for (let step = 0; step < ITERATIONS; step++) {
    // Never cool to zero so overlaps keep resolving until the last step.
    const cooling = Math.max(0.2, 1 - step / ITERATIONS)
    const force = nodes.map(() => ({ x: 0, y: 0 }))
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x || 0.01
        const dy = nodes[j].y - nodes[i].y || 0.01
        const d = Math.hypot(dx, dy)
        const minGap = nodes[i].radius + nodes[j].radius + gap
        const push = d < minGap ? (minGap - d) * 0.5 : (noteSize * noteSize * 0.6) / (d * d)
        force[i].x -= (dx / d) * push
        force[i].y -= (dy / d) * push
        force[j].x += (dx / d) * push
        force[j].y += (dy / d) * push
      }
    }
    for (const [a, b] of edges) {
      const dx = nodes[b].x - nodes[a].x
      const dy = nodes[b].y - nodes[a].y
      const d = Math.hypot(dx, dy) || 0.01
      const rest = nodes[a].radius + nodes[b].radius + noteSize * 0.55
      const pull = (d - rest) * 0.06
      force[a].x += (dx / d) * pull
      force[a].y += (dy / d) * pull
      force[b].x -= (dx / d) * pull
      force[b].y -= (dy / d) * pull
    }
    nodes.forEach((node, i) => {
      if (node.pinned) return
      // Gentle gravity keeps the cluster vertically centered in the area.
      force[i].x += (centerX - node.x) * 0.005
      force[i].y += (centerY - node.y) * 0.012
      const marginX = node.hub ? node.radius + 8 : noteRadius
      const marginY = node.hub ? 36 : noteRadius
      node.x = Math.min(area.right - marginX, Math.max(area.left + marginX, node.x + force[i].x * cooling))
      node.y = Math.min(area.bottom - marginY, Math.max(area.top + marginY, node.y + force[i].y * cooling))
    })
  }

  const tilt = () => (rand() - 0.5) * 2 * TILT_DEGREES
  const placedNotes: PlacedNote<P>[] = projects.map((project) => {
    const node = nodes[index.get(project.title)!]
    return { project, x: node.x, y: node.y, tilt: tilt() }
  })
  placedNotes.push({ project: null, x: seeAll.x, y: seeAll.y, tilt: tilt() })

  return {
    notes: placedNotes,
    hubs: hubs.map(({ key, x, y }) => ({ title: key, x, y })),
    edges: edges.map(([a, b]) => ({
      from: { x: nodes[a].x, y: nodes[a].y },
      to: { x: nodes[b].x, y: nodes[b].y },
      toHub: nodes[a].hub || nodes[b].hub
    }))
  }
}
