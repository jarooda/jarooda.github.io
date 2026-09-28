import { Html } from "@react-three/drei"
import type { ThreeEvent } from "@react-three/fiber"
import { useEffect, useMemo, useRef, useState } from "react"
import * as THREE from "three"
import { labels } from "../labels"
import { SECTION_ZONE, isSection, zoneTarget, type SectionId, type ZoneId } from "../sections"
import { useRoomStore } from "../store"
import { setHighlight } from "../systems/highlight"
import { buildZoneGroups, type ZoneGroups } from "../systems/zoneGroups"

// `nodes` are highlighted together; `key` identifies the target for hover/tap comparisons.
type Target =
  | { kind: "zone"; zone: ZoneId; key: ZoneId; nodes: THREE.Object3D[] }
  | { kind: "section"; section: SectionId; key: THREE.Object3D; nodes: THREE.Object3D[] }

// Walks up from the hit mesh: in Roam any part of a zone targets the whole zone,
// in Zoom only interactive objects of the framed zone are targets. Zone roots are never
// targets in Zoom: the whiteboard's content is its sticky notes, not the board itself.
function resolveTarget(hit: THREE.Object3D, mode: string, view: string, groups: ZoneGroups): Target | null {
  for (let node: THREE.Object3D | null = hit; node; node = node.parent) {
    const zone = groups.zoneOf.get(node)
    if (mode === "roam" && zone) return { kind: "zone", zone, key: zone, nodes: groups.members.get(zone) ?? [node] }
    if (mode === "zoom" && node.userData.zone_root) return null
    if (mode === "zoom" && isSection(node.userData.section) && SECTION_ZONE[node.userData.section] === view) {
      return { kind: "section", section: node.userData.section, key: node, nodes: [node] }
    }
  }
  return null
}

const labelOf = (target: Target) =>
  target.kind === "zone" ? labels[target.zone] : (target.key.userData.label as string | undefined) ?? labels[target.section]

export default function Interactions({ scene }: { scene: THREE.Object3D }) {
  const mode = useRoomStore((state) => state.mode)
  const view = useRoomStore((state) => state.view)
  const sequence = useRoomStore((state) => state.sequence)
  const travelTo = useRoomStore((state) => state.travelTo)
  const walkTo = useRoomStore((state) => state.walkTo)
  const openPopup = useRoomStore((state) => state.openPopup)

  const groups = useMemo(() => buildZoneGroups(scene), [scene])
  const [hovered, setHovered] = useState<Target | null>(null)
  const pointerType = useRef("mouse")
  const locked = sequence !== null || (mode !== "roam" && mode !== "zoom")

  useEffect(() => {
    if (!hovered) return
    hovered.nodes.forEach((node) => setHighlight(node, true))
    document.body.style.cursor = "pointer"
    return () => {
      hovered.nodes.forEach((node) => setHighlight(node, false))
      document.body.style.cursor = ""
    }
  }, [hovered])

  useEffect(() => setHovered(null), [mode, view, locked])

  // While the camera zooms in at the end of a navigation sequence, the target object is highlighted.
  const zoomTarget = sequence?.stage === "zoomIn" ? sequence.target.section : undefined
  useEffect(() => {
    if (!zoomTarget) return
    let node: THREE.Object3D | null = null
    scene.traverse((object) => {
      if (!node && object.userData.section === zoomTarget && !object.userData.projectId && !object.userData.seeAll) node = object
    })
    const target = node as THREE.Object3D | null
    if (!target) return
    setHighlight(target, true)
    return () => setHighlight(target, false)
  }, [zoomTarget, scene])

  const sameTarget = (a: Target | null, b: Target | null) => !!a && !!b && a.key === b.key

  const activate = (target: Target) => {
    setHovered(null)
    // A zone clicked in the room: the avatar walks there first (decision 7).
    if (target.kind === "zone") return travelTo(zoneTarget(target.zone))
    const { projectId, seeAll } = target.key.userData
    // Sticky notes: a project note opens its detail, the last note goes to the full list page.
    if (seeAll) window.location.assign("/projects")
    else openPopup(target.section, undefined, projectId)
  }

  const onPointerMove = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    if (locked || event.pointerType === "touch") return
    const target = resolveTarget(event.object, mode, view, groups)
    setHovered((current) => (sameTarget(current, target) ? current : target))
  }

  const onPointerDown = (event: ThreeEvent<PointerEvent>) => {
    pointerType.current = event.pointerType
  }

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (locked) return
    const target = resolveTarget(event.object, mode, view, groups)
    if (!target) {
      setHovered(null)
      // Anything else in the room (floor, rug, bed…): walk to that spot.
      if (mode === "roam") walkTo(event.point.x, event.point.z)
      return
    }
    // Touch: first tap shows the label, second tap on the same object opens it.
    if (pointerType.current === "touch" && !sameTarget(hovered, target)) return setHovered(target)
    activate(target)
  }

  const labelPosition = useMemo(() => {
    if (!hovered) return null
    const box = new THREE.Box3()
    hovered.nodes.forEach((node) => box.expandByObject(node))
    return new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2)
  }, [hovered])

  return (
    <>
      <primitive
        object={scene}
        onPointerMove={onPointerMove}
        onPointerOut={() => pointerType.current !== "touch" && setHovered(null)}
        onPointerDown={onPointerDown}
        onClick={onClick}
      />
      {hovered && labelPosition && (
        <Html position={labelPosition} center zIndexRange={[5, 0]} style={{ pointerEvents: "none" }}>
          <span className="room-label">{labelOf(hovered)}</span>
        </Html>
      )}
    </>
  )
}
