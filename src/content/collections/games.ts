import { getGsheetCollection } from "../../utils/get-collection"

export async function getGamesCollection() {
  return await getGsheetCollection("games")
}