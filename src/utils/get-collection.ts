import { google } from "googleapis"
import { JWT } from "google-auth-library"

export async function getGsheetCollection(sheetName: string) {
  try {
    const serviceAccountKey = import.meta.env.GOOGLE_SERVICE_ACCOUNT_KEY as string
    const spreadsheetId = import.meta.env.GOOGLE_SPREADSHEET_ID as string

    const credentials = JSON.parse(serviceAccountKey)
    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    })
    const sheets = google.sheets({ version: "v4", auth: auth as JWT })

    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId,
    })

    let targetSheet

    if (spreadsheetInfo.data.sheets) {
      targetSheet = spreadsheetInfo.data.sheets.find(
        (sheet) => sheet.properties?.title === sheetName
      )
    }

    if (!targetSheet || !targetSheet.properties?.title) {
      throw new Error(`Sheet with name "${sheetName}" not found.`)
    }

    const range = `${targetSheet.properties.title}!A:Z`
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    })

    const rows = response.data.values
    if (!rows || rows.length === 0) {
      console.log("No data found.")
      return []
    }

    const headers = rows[0]
    const data = rows.slice(1).map((row) => {
      const entry: { [key: string]: string } = {}
      headers.forEach((header, index) => {
        entry[header] = row[index] || ""
      })
      return entry
    })

    return data
  } catch (error) {
    console.error("Error fetching collection:", error)
    return []
  }
}
