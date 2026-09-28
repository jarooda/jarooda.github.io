import "cypress-wait-until"

// V3: live weather (07-rencana-v3.md §5). The API is intercepted so the mapping (all condition
// groups) and the failure path are deterministic, independent of the real weather in Semarang.
const WEATHER_URL = Cypress.env("PUBLIC_WEATHER_API")

function openRoom() {
  cy.clearAllLocalStorage()
  cy.clearAllSessionStorage()
  cy.visit("/?view=3d")
  cy.get("#room-splash", { timeout: 30000 }).should("not.exist")
}

const base = {
  main: { temp: 27, feels_like: 29, humidity: 70 },
  wind: { speed: 3, deg: 200 },
  visibility: 10000
}

const FIXTURES: { name: string; kind: string; payload: object }[] = [
  { name: "clear", kind: "clear", payload: { ...base, weather: [{ id: 800, main: "Clear", description: "clear sky", icon: "01d" }], clouds: { all: 0 } } },
  { name: "clouds", kind: "clouds", payload: { ...base, weather: [{ id: 803, main: "Clouds", description: "broken clouds", icon: "04d" }], clouds: { all: 75 } } },
  { name: "drizzle (rain)", kind: "rain", payload: { ...base, weather: [{ id: 301, main: "Drizzle", description: "drizzle", icon: "09d" }], clouds: { all: 90 } } },
  { name: "heavy rain", kind: "rain", payload: { ...base, weather: [{ id: 502, main: "Rain", description: "heavy intensity rain", icon: "10d" }], clouds: { all: 95 } } },
  { name: "thunderstorm", kind: "storm", payload: { ...base, weather: [{ id: 202, main: "Thunderstorm", description: "thunderstorm with heavy rain", icon: "11n" }], clouds: { all: 98 } } },
  { name: "mist", kind: "mist", payload: { ...base, weather: [{ id: 701, main: "Mist", description: "mist", icon: "50d" }], visibility: 2000, clouds: { all: 40 } } }
]

describe("Weather", () => {
  for (const { name, kind, payload } of FIXTURES) {
    it(`maps ${name} to kind "${kind}" and shows it in the clock chip`, () => {
      cy.intercept("GET", WEATHER_URL, { statusCode: 200, body: payload }).as("weather")
      openRoom()
      cy.wait("@weather")
      cy.get(`[data-weather-kind="${kind}"]`, { timeout: 10000 }).should("exist").and("contain.text", `${(payload as any).main.temp}°`)
    })
  }

  it("shows description, feels-like and humidity in the clock panel", () => {
    cy.intercept("GET", WEATHER_URL, {
      statusCode: 200,
      body: { ...base, weather: [{ id: 500, main: "Rain", description: "light rain", icon: "10d" }], clouds: { all: 80 } }
    }).as("weather")
    openRoom()
    cy.wait("@weather")
    cy.get('[data-weather-kind="rain"]', { timeout: 10000 }).should("exist")
    cy.get("button").contains("Semarang,").click()
    cy.contains("Light rain").should("exist")
    cy.contains("Feels like 29°").should("exist")
    cy.contains("70% humidity").should("exist")
  })

  it("stays weather-less (no error) when the API fails", () => {
    cy.intercept("GET", WEATHER_URL, { forceNetworkError: true }).as("weather")
    openRoom()
    cy.wait("@weather")
    cy.contains("Semarang,").should("exist")
    cy.get("[data-weather-kind]").should("not.exist")
    cy.get(".room-canvas canvas").should("exist")
  })

  it("shows the weather chip in the mobile menu too", () => {
    cy.viewport(390, 844)
    cy.intercept("GET", WEATHER_URL, {
      statusCode: 200,
      body: { ...base, weather: [{ id: 803, main: "Clouds", description: "broken clouds", icon: "04d" }], clouds: { all: 75 } }
    }).as("weather")
    openRoom()
    cy.wait("@weather")
    cy.get('[aria-label="Menu"]').click()
    cy.get('[data-weather-kind="clouds"]').should("exist")
  })
})
