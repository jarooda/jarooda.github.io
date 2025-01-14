const baseUrl = Cypress.config("baseUrl")

const getElement = (el: string) => `[data-test=${el}]`

export { baseUrl, getElement }
