import { useMemo, type CSSProperties } from "react"
import { useRoomStore } from "../store"
import { DROP_MAX_PX, dropProfile, PAGE_DROPS, rainAngle, rainDensity, rainSpeed, rainStrength } from "../systems/weatherVisual"

// Rain over the page around the diorama (user feedback: not only in the window). Individual
// drops with random position, delay and speed, layered by depth (far = short, faint, slow;
// near = long, bright, fast). Angle, density and speed come from the same helpers as the window
// rain (scene/Weather.tsx), so both fall the same way and a storm is denser than rain.

export default function PageRain() {
  const weather = useRoomStore((state) => state.weather)
  const tier = useRoomStore((state) => state.tier)
  const phase = useRoomStore((state) => state.phase)

  const drops = useMemo(
    () =>
      Array.from({ length: PAGE_DROPS.high }, () => {
        const { length, opacity, duration } = dropProfile(Math.random())
        return {
          left: Math.random() * 100,
          y: Math.random() * 150,
          delay: -Math.random() * 2,
          duration,
          height: length * DROP_MAX_PX,
          opacity
        }
      }),
    []
  )

  const density = rainDensity(weather)
  const count = Math.round(PAGE_DROPS[tier] * density)
  const speed = rainSpeed(weather)
  const strength = rainStrength(weather, phase)

  return (
    <div
      className="room-page-rain"
      aria-hidden="true"
      style={{ opacity: count > 0 ? 1 : 0, transform: `rotate(${-rainAngle(weather?.windX)}rad)` }}
    >
      {drops.slice(0, count).map((drop, i) => (
        <i
          key={i}
          className="room-drop"
          style={
            {
              left: `${drop.left}%`,
              height: `${drop.height}px`,
              opacity: drop.opacity * strength,
              animationDuration: `${drop.duration / speed}s`,
              animationDelay: `${drop.delay}s`,
              "--drop-y": `${drop.y}vh`
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
