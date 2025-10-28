import { getGsheetCollection } from "../../utils/get-collection"

export async function getGamesCollection() {
  return await getGsheetCollection("games")
}

export async function getBooksCollection() {
  return await getGsheetCollection("books")
}

export async function getFiguresCollection() {
  return await getGsheetCollection("figures")
}

export async function getMoviesCollection() {
  return await getGsheetCollection("movies")
}

export async function getSeriesCollection() {
  return await getGsheetCollection("series")
}

export async function getAnimeCollection() {
  return await getGsheetCollection("anime")
}

export async function getMusicsCollection() {
  return await getGsheetCollection("musics")
}

export async function getGadgetsCollection() {
  return await getGsheetCollection("gadgets")
}

export async function getAccountsCollection() {
  return await getGsheetCollection("accounts")
}