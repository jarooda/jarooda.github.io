import { getGsheetCollection } from "../../utils/get-collection"

export async function getFiguresCollection() {
  return await getGsheetCollection("figures")
}