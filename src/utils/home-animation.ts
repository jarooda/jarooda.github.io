import { gsap } from "gsap"
import { TextPlugin } from "gsap/TextPlugin"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Flip } from "gsap/Flip"
import { ScrollToPlugin } from "gsap/ScrollToPlugin"

class AstroHomeAnimation extends HTMLElement {
  resizeTimeout: ReturnType<typeof setTimeout> | undefined
  socialScrollTrigger: ScrollTrigger | null = null

  constructor() {
    super()
    this.handleResize = this.handleResize.bind(this)
  }

  connectedCallback() {
    this.initAnimation()
    this.setupResizeListener()
  }

  disconnectedCallback() {
    this.cleanupResizeListener()
  }

  initAnimation() {
    gsap.registerPlugin(TextPlugin, ScrollTrigger, Flip, ScrollToPlugin)

    this.scrollToHash()
    this.tiltLogo()
    this.initHeroTexts()
    this.initAboutMe()
    this.animatePosts()
    this.initSocialAnimations()
    this.initProjectCards()
  }

  scrollToHash() {
    const hash = window.location.hash
    if (hash) {
      const target = document.querySelector(hash)
      if (target) {
        gsap.to(window, {
          duration: 0.1,
          scrollTo: target,
          ease: "power3.inOut"
        })
      }
    }
  }

  tiltLogo() {
    const logoJ = document.querySelector("#jl-logo")
    if (logoJ) {
      window.addEventListener("mousemove", (e) => {
        const { innerWidth, innerHeight } = window

        // Calculate the position of the mouse relative to the screen's center
        const centerX = innerWidth / 2
        const centerY = innerHeight / 2

        const deltaX = e.clientX - centerX
        const deltaY = e.clientY - centerY

        // Tilt intensity
        const tiltIntensity = 50
        const rotateX = -(deltaY / innerHeight) * tiltIntensity
        const rotateY = (deltaX / innerWidth) * tiltIntensity

        // Animate the tilt effect
        gsap.to(logoJ, {
          duration: 0.3,
          rotateX: rotateX,
          rotateY: rotateY,
          ease: "power1.out"
        })
      })

      // Reset the tilt effect when the mouse leaves the screen
      window.addEventListener("mouseleave", () => {
        gsap.to(logoJ, {
          duration: 0.3,
          rotateX: 0,
          rotateY: 0,
          ease: "power1.out"
        })
      })
    }
  }

  initHeroTexts() {
    const heroTexts = this.querySelectorAll(".hero-text") as NodeListOf<Element>
    heroTexts.forEach((heroText) => {
      const words = heroText.querySelectorAll(".word")
      this.initHero(words)
      this.displayHero(words)
    })
  }

  initAboutMe() {
    const changingText = this.querySelector("#changing-text") as HTMLElement
    const specialties = [
      "turn ideas into code.",
      "craft seamless web experiences.",
      "build user-focused applications.",
      "optimize performance.",
      "create intuitive interfaces.",
      "transform designs into reality.",
      "write clean, efficient code.",
      "deliver high-quality software.",
      "collaborate to bring ideas to life."
    ]

    if (changingText) {
      let interval = null as any
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          let index = 0
          if (entry.isIntersecting) {
            interval = setInterval(() => {
              this.animateText(changingText, `${specialties[index]}`, 0)
              index = index === specialties.length - 1 ? 0 : index + 1
            }, 3000)
          } else {
            clearInterval(interval)
          }
        })
      })

      observer.observe(changingText)
    }
  }

  animatePosts() {
    const posts = gsap.utils.toArray(".post") as HTMLElement[]

    posts.forEach((post, index) => {
      const postAnimation = gsap.to(post, {
        duration: 1,
        opacity: 1,
        y: 0,
        ease: "power1.inOut"
      })

      ScrollTrigger.create({
        trigger: post,
        start: "top bottom-=30%",
        animation: postAnimation,
        toggleActions: "play none none none"
      })
    })
  }

  initSocialAnimations() {
    const socialTarget = document.querySelector("#social-target") as HTMLElement
    const socialFloating = document.querySelector(
      "#social-floating"
    ) as HTMLElement

    // check if device width more than 768px
    const isDesktop = window.matchMedia("(min-width: 768px)").matches

    // Clean up the previous instance of ScrollTrigger
    this.cleanupSocialScrollTrigger()

    if (socialFloating && socialTarget && isDesktop) {
      const floatingAnimation = () => {
        const state = Flip.getState(socialFloating)
        socialFloating.classList.add("floating")
        socialFloating.classList.remove("stay")
        Flip.from(state, { duration: 0.5, ease: "power1.inOut" })
      }

      const stayAnimation = () => {
        const state = Flip.getState(socialFloating)
        socialFloating.classList.remove("floating")
        socialFloating.classList.add("stay")
        Flip.from(state, { duration: 0.5, ease: "power1.inOut" })
      }

      this.socialScrollTrigger = ScrollTrigger.create({
        trigger: socialTarget,
        start: "top bottom-=10%",
        end: "top center",
        onEnter: stayAnimation,
        onLeaveBack: floatingAnimation
      })
    }
  }

  initProjectCards() {
    const cards = gsap.utils.toArray(".card") as HTMLElement[]
    const stickDistance = 0

    const lastCardST = ScrollTrigger.create({
      trigger: cards[cards.length - 1],
      start: "top top+=100"
    })

    cards.forEach((card, index) => {
      const scale = 1 - (cards.length - index) * 0.025
      const scaleDown = gsap.to(card, {
        scale: scale,
        ease: "none",
        transformOrigin: `50% ${lastCardST.start + stickDistance}`
      })

      ScrollTrigger.create({
        trigger: card,
        start: "top top+=100",
        end: () => lastCardST.start + stickDistance,
        pin: true,
        pinSpacing: false,
        animation: scaleDown,
        toggleActions: "restart none none reverse"
      })
    })
  }

  initHero(spans: NodeListOf<Element>) {
    gsap.set(spans, {
      opacity: 0,
      y: 50
    })

    ScrollTrigger.create({
      trigger: "#end-about-me",
      start: "top center-=10%",
      onEnter: () => {
        this.reverseHero(spans)
      },
      onLeaveBack: () => {
        this.displayHero(spans)
      }
    })
  }

  displayHero(spans: NodeListOf<Element>) {
    gsap.to(spans, {
      duration: 0.8,
      opacity: 1,
      y: 0,
      stagger: 0.1,
      ease: "power3.out"
    })
  }

  reverseHero(spans: NodeListOf<Element>) {
    // Reverse animation
    gsap.to(spans, {
      duration: 0.8,
      opacity: 0,
      y: 50,
      stagger: 0.1,
      ease: "power3.in"
    })
  }

  animateText(element: Element, text: string, delay: number) {
    gsap.to(element, {
      duration: 2,
      text: text,
      delay: delay,
      ease: "none"
    })
  }

  setupResizeListener() {
    window.addEventListener("resize", this.handleResize)
  }

  cleanupResizeListener() {
    window.removeEventListener("resize", this.handleResize)
  }

  cleanupSocialScrollTrigger() {
    if (this.socialScrollTrigger) {
      this.socialScrollTrigger.kill()
      this.socialScrollTrigger = null
    }
  }

  handleResize() {
    // Debounce to optimize performance during resize
    clearTimeout(this.resizeTimeout)
    this.resizeTimeout = setTimeout(() => {
      this.initSocialAnimations()
    }, 200)
  }
}

customElements.define("astro-home-animation", AstroHomeAnimation)
