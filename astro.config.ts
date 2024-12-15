import { defineConfig } from "astro/config"
import { loadEnv } from "vite"
import mdx from "@astrojs/mdx"
import icon from "astro-icon"
import sitemap from "@astrojs/sitemap"
import tailwind from "@astrojs/tailwind"
import autolinkHeadings from "rehype-autolink-headings"
import rehypeExternalLinks from "rehype-external-links"
import rehypeSlug from "rehype-slug"
import sentry from "@sentry/astro"

import { remarkReadingTime } from "./src/utils/remark-reading-time"
import { autolinkConfig } from "./src/utils/rehype-auto-link"

const nodeEnv = process.env.NODE_ENV || "development"
const { SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT } = loadEnv(
  nodeEnv,
  process.cwd(),
  ""
)

// https://astro.build/config
export default defineConfig({
  site: "https://jaluwibowo.id",
  integrations: [
    icon(),
    mdx(),
    sitemap(),
    tailwind({
      // Example: Disable injecting a basic `base.css` import on every page.
      // Useful if you need to define and/or import your own custom `base.css`.
      applyBaseStyles: false
    }),
    sentry({
      dsn: SENTRY_DSN,
      sourceMapsUploadOptions: {
        org: SENTRY_ORG,
        project: SENTRY_PROJECT,
        authToken: SENTRY_AUTH_TOKEN,
        telemetry: false
      },
      enabled: process.env.NODE_ENV === "production"
    })
  ],
  markdown: {
    gfm: true,
    syntaxHighlight: "prism",
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [
      rehypeSlug,
      [autolinkHeadings, autolinkConfig],
      [
        rehypeExternalLinks,
        {
          target: "_blank",
          rel: "noreferrer"
        }
      ]
    ]
  }
})
