import { defineConfig } from "astro/config"
import { loadEnv } from "vite"
import mdx from "@astrojs/mdx"
import icon from "astro-icon"
import sitemap from "@astrojs/sitemap"
import autolinkHeadings from "rehype-autolink-headings"
import rehypeExternalLinks from "rehype-external-links"
import rehypeSlug from "rehype-slug"
import sentry from "@sentry/astro"

import { remarkReadingTime } from "./src/utils/remark-reading-time"
import { autolinkConfig } from "./src/utils/rehype-auto-link"

import tailwindcss from "@tailwindcss/vite"

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
    sentry({
      sourceMapsUploadOptions: {
        org: SENTRY_ORG,
        project: SENTRY_PROJECT,
        authToken: SENTRY_AUTH_TOKEN,
        telemetry: false
      }
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
  },

  vite: {
    plugins: [
      tailwindcss({
        applyBaseStyles: false
      })
    ],
    build: {
      sourcemap: true,
      rollupOptions: {
        onwarn(warning, warn) {
          // Suppress sourcemap warnings for astro:transitions plugin
          if (warning.code === 'SOURCEMAP_ERROR' && warning.message.includes('astro:transitions')) {
            return;
          }
          warn(warning);
        }
      }
    }
  }
})
