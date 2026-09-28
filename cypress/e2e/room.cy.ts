import "cypress-wait-until"

// Smoke tests for the 3D room at / and the 2D fallback at /classic.
describe("Room", () => {
  beforeEach(() => {
    cy.clearAllLocalStorage()
    cy.clearAllSessionStorage()
  })

  it("?view=classic goes to the classic homepage and remembers it", () => {
    cy.visit("/?view=classic")
    cy.location("pathname", { timeout: 10000 }).should("match", /^\/classic\/?$/)
    cy.window().then((win) => expect(win.localStorage.getItem("experience")).to.eq("classic"))
    cy.visit("/")
    cy.location("pathname", { timeout: 10000 }).should("match", /^\/classic\/?$/)
  })

  it("?view=3d loads the room", () => {
    cy.visit("/?view=3d")
    cy.location("pathname").should("eq", "/")
    cy.get("#room-splash", { timeout: 30000 }).should("not.exist")
    cy.get(".room-canvas canvas").should("exist")
  })

  it("the room page carries semantic content and a noscript fallback", () => {
    cy.request("/").its("body").should("contain", "<noscript>").and("contain", 'id="room-content"')
  })

  it("the 2D header links back into the room", () => {
    cy.visit("/classic")
    cy.get("[data-test=enter-room]").filter(":visible").first().should("have.attr", "href", "/")
  })
})
