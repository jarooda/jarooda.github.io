import { baseUrl, getElement } from "../helper"

describe("Homepage", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  it("ensure hero text animation is working", () => {
    cy.get(getElement("hero-text")).should(
      "contain.text",
      "Software Engineer with more than three years of experience."
    )

    cy.get(getElement("changing-text")).then((el) => {
      const text = el.text()
      cy.wait(1000)
      cy.get(getElement("changing-text")).should("not.contain.text", text)
    })
  })

  it("ensure hero links working", () => {
    cy.get(getElement("hero-link-blog")).click()
    cy.url().should("eq", `${baseUrl}/#blog`)

    cy.get(getElement("hero-link-about")).click()
    cy.url().should("eq", `${baseUrl}/about`)
  })

  it("ensure first blog showing and working", () => {
    cy.get(getElement("first-blog"))
      .should("have.attr", "href")
      .then((href) => {
        cy.get(getElement("first-blog")).click()
        cy.url().should("eq", `${baseUrl}${href}`)
      })
  })

  it("ensure discover other posts button is working", () => {
    cy.get(getElement("discover-other-posts")).click()
    cy.url().should("eq", `${baseUrl}/blog`)
  })

  it("check for techstack canvas element", () => {
    cy.get(getElement("techstack-canvas") + " canvas").should("exist")
  })

  it("make sure add stack button is working", () => {
    cy.get(getElement("techstack-canvas") + " canvas").then(($canvas) => {
      const canvas = $canvas[0] as HTMLCanvasElement

      const initialImage = canvas.toDataURL()
      cy.get(getElement("add-stack-button")).click()
      cy.wait(500)

      cy.get(getElement("techstack-canvas") + " canvas").should(
        ($updatedCanvas) => {
          const updatedCanvas = $updatedCanvas[0] as HTMLCanvasElement
          const updatedImage = updatedCanvas.toDataURL()

          expect(updatedImage).not.to.equal(initialImage)
        }
      )
    })
  })

  it("ensure featured projects is showing and a valid link", () => {
    cy.get(getElement("featured-project-0")).should("exist")

    cy.get(getElement("featured-project-0"))
      .invoke("attr", "href")
      .then((href) => {
        expect(href).to.exist
        expect(href).to.match(/^https?:\/\/[^\s/$.?#].[^\s]*$/)
      })
  })

  it("ensure check other projects button is working", () => {
    cy.get(getElement("check-other-projects")).click()
    cy.url().should("eq", `${baseUrl}/projects`)
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
