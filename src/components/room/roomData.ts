import { createContext, useContext } from "react"
import type { RoomData } from "../../data/room"

export const RoomDataContext = createContext<RoomData | null>(null)

export function useRoomData() {
  const data = useContext(RoomDataContext)
  if (!data) throw new Error("useRoomData must be used inside RoomApp")
  return data
}
