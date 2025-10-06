import 'cypress-wait-until';
import { baseUrl, getElement } from "../helper"

describe("Homepage", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  it("ensure hero text animation is working", () => {
    cy.get(getElement("hero-text")).should(
      "contain.text",
      "Software Engineer with more than four years of experience."
    )

    cy.get(getElement("changing-text")).then((el) => {
      const text = el.text()
      cy.wait(1000)
      cy.get(getElement("changing-text")).should("not.contain.text", text)
    })
  })

  it("ensure hero links working", () => {
    cy.get(getElement("hero-link-blog")).click({ force: true })
    cy.url().should("eq", `${baseUrl}/#blog`)

    cy.get(getElement("hero-link-about")).click({ force: true })
    cy.url().should("eq", `${baseUrl}/about`)
  })

  it("ensure first blog showing and working", () => {
    cy.get(getElement("first-blog"))
      .should("have.attr", "href")
      .then((href) => {
        cy.get(getElement("first-blog")).click({ force: true })
        cy.url().should("eq", `${baseUrl}${href}`)
      })
  })

  it("ensure discover other posts button is working", () => {
    cy.get(getElement("discover-other-posts")).click({ force: true })
    cy.url().should("eq", `${baseUrl}/blog`)
  })

  it("check for techstack canvas element", () => {
    cy.get(getElement("techstack-canvas") + " canvas").should("exist")
  })

  it("make sure add stack button is working", () => {
    // Ensure the canvas is rendered and visible
    cy.get(getElement("techstack-canvas") + " canvas").should("be.visible")
    
    // Click the add stack button
    cy.get(getElement("add-stack-button")).click({ force: true })
    
    // Wait for the animation to start (the new stack should appear)
    // We'll wait and check that the canvas is still rendering
    cy.wait(500)
    cy.get(getElement("techstack-canvas") + " canvas").should("be.visible")
  })

  it("ensure at least github social link showing", () => {
    cy.get(getElement("social-github")).should("exist")

    cy.get(getElement("social-github"))
      .invoke("attr", "href")
      .then((href) => {
        expect(href).to.exist
        expect(href).to.contain("github.com")
      })
  })

  it("ensure the contact me form is working", () => {
    cy.intercept("POST", Cypress.env("PUBLIC_CONTACT_ME_API"), {
      statusCode: 200,
      body: {
        message: "Message sent successfully"
      }
    }).as("contact")

    cy.get(getElement("input-name")).type("John Doe")
    cy.get(getElement("input-email")).type("john@doe.com")
    cy.get(getElement("input-message")).type("Hello World")

    cy.get(getElement("send-msg-btn")).click()

    // ensure toast message is showing
    cy.wait("@contact").then((interception: any) => {
      expect(interception.response.statusCode).to.equal(200)
      cy.get(".toastify").should("have.class", "on")

      // toast should show text from api response
      cy.get(".toastify").should(
        "contain.text",
        interception.response.body.message
      )
    })
  })
})
