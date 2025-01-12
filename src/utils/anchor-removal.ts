class AstroAnchorRemoval extends HTMLElement {
  constructor() {
    super()

    const anchorLinks =
      (document.querySelectorAll(".anchor-link") as NodeListOf<HTMLElement>) ||
      []
    
    anchorLinks.forEach((anchorLink) => {
      anchorLink.remove()
    })
  }
}

// Tell the browser to use our AstroAnchorRemoval class for <astro-anchor-removal> elements.
customElements.define("astro-anchor-removal", AstroAnchorRemoval)
