class AstroBlogImg extends HTMLElement {
  constructor() {
    super()

    const imgTags: HTMLImageElement[] = Array.from(this.querySelectorAll("img"))

    imgTags.forEach((imgTag: HTMLImageElement) => {
      imgTag.classList.add(
        "border",
        "border-gray-300",
        "rounded-lg",
        "shadow-md",
        "mb-6",
        "md:w-4/5",
        "w-full",
        "h-auto",
        "block",
        "mx-auto"
      )
    })
  }
}

// Tell the browser to use our AstroBlogImg class for <astro-blog-img> elements.
customElements.define("astro-blog-img", AstroBlogImg)
