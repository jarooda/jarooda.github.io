import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"

import { getGamesCollection, getFiguresCollection } from "./content/collections"

const blog = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/blog" }),
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Transform string to Date object
    pubDate: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val)),
    updatedDate: z
      .string()
      .optional()
      .transform((str) => (str ? new Date(str) : undefined)),
    heroImage: z.string().optional(),
    metaImage: z.string().optional(),
    tags: z.array(z.string()),
    otherUrl: z.string().optional(),
    en: z.boolean().optional(),
    draft: z.boolean().optional()
  })
})

const project = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/project" }),
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    repo: z.string().optional(),
    demo: z.string().optional(),
    // Transform string to Date object
    pubDate: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val)),
    updatedDate: z
      .string()
      .optional()
      .transform((str) => (str ? new Date(str) : undefined)),
    heroImage: z.string(),
    isFeatured: z.boolean().optional(),
    featuredOrder: z.number().optional(),
    stacks: z.array(z.string())
  })
})

const games = defineCollection({
  loader: async () => {
    const data = await getGamesCollection()
    return data.map((item, index) => ({
      id: `game-${index + 1}`,
      ...item
    }))
  },
  schema: z.object({
    title: z.string(),
    developer: z.string(),
    platform: z.string(),
    status: z.string(),
    format: z.string(),
    web: z.string().optional()
  })
})

const figures = defineCollection({
  loader: async () => {
    const data = await getFiguresCollection()
    return data.map((item, index) => ({
      id: `figure-${index + 1}`,
      ...item
    }))
  },
  schema: z.object({
    name: z.string(),
    type: z.string(),
    series: z.string(),
    manufacturer: z.string(),
    condition: z.string(),
    notes: z.string(),
    web: z.string().optional()
  })
})

export const collections = { blog, project, games, figures }
