import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"

import * as Collection from "./content/collections"
import { githubLoader } from "./loaders/github-blog-loader"

const blog = defineCollection({
  loader: githubLoader({ 
    owner: "jarooda", 
    repo: "blogs", 
    path: "blog",
    branch: "main"
  }),
  // Type-check frontmatter using a schema
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Transform string to Date object
    pubDate: z
      .string()
      .or(z.date())
      .transform((val) => val instanceof Date ? val : new Date(val)),
    updatedDate: z
      .string()
      .or(z.date())
      .optional()
      .transform((str) => {
        if (!str) return undefined;
        return str instanceof Date ? str : new Date(str);
      }),
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
    heroImage: z.string().optional(),
    status: z
      .enum(["planning", "in-progress", "completed", "on-hold", "abandoned"])
      .default("planning"),
    category: z
      .enum([
        "web-app",
        "mobile-app",
        "library",
        "tool",
        "extension",
        "game",
        "other"
      ])
      .default("other"),
    platform: z
      .enum([
        "web",
        "mobile",
        "desktop",
        "cli",
        "browser-extension",
        "server",
        "multi-platform",
        "other"
      ])
      .default("other"),
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
    stacks: z.array(z.string())
  })
})

const games = defineCollection({
  loader: async () => {
    const data = await Collection.getGamesCollection()
    return data.map((item, index) => ({
      id: `game-${index + 1}`,
      ...item
    }))
  },
  schema: z.object({
    title: z.string(),
    developer: z.string(),
    platform: z.enum([
      "Nintendo Switch",
      "Mobile",
      "PC",
      "Web",
      "PlayStation",
      "Xbox",
      "Other"
    ]),
    status: z.enum([
      'Backlog',
      'Playing',
      'Finished',
      'Paused',
      'Dropped',
    ]),
    format: z.string(),
    web: z.string().optional()
  })
})

const figures = defineCollection({
  loader: async () => {
    const data = await Collection.getFiguresCollection()
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

const books = defineCollection({
  loader: async () => {
    const data = await Collection.getBooksCollection()
    return data.map((item, index) => ({
      id: `book-${index + 1}`,
      ...item
    }))
  },
  schema: z.object({
    title: z.string(),
    author: z.string(),
    format: z.string(),
    type: z.string(),
    read_status: z.string(),
    notes: z.string()
  })
})

const movies = defineCollection({
  loader: async () => {
    const data = await Collection.getMoviesCollection()
    return data.map((item, index) => ({
      id: `movie-${index + 1}`,
      ...item
    }))
  },
  schema: z.object({
    title: z.string(),
    year: z.string(),
    director: z.string(),
    notes: z.string(),
    web: z.string().optional()
  })
})

const series = defineCollection({
  loader: async () => {
    const data = await Collection.getSeriesCollection()
    return data.map((item, index) => ({
      id: `series-${index + 1}`,
      ...item
    }))
  },
  schema: z.object({
    title: z.string(),
    year: z.string(),
    writer: z.string(),
    notes: z.string(),
    web: z.string().optional()
  })
})

const anime = defineCollection({
  loader: async () => {
    const data = await Collection.getAnimeCollection()
    return data.map((item, index) => ({
      id: `anime-${index + 1}`,
      ...item
    }))
  },
  schema: z.object({
    title: z.string(),
    year: z.string(),
    studio: z.string(),
    notes: z.string(),
    web: z.string().optional()
  })
})

const musics = defineCollection({
  loader: async () => {
    const data = await Collection.getMusicsCollection()
    return data.map((item, index) => ({
      id: `music-${index + 1}`,
      ...item
    }))
  },
  schema: z.object({
    title: z.string(),
    year: z.string(),
    artist: z.string(),
    album: z.string(),
    notes: z.string()
  })
})

const gadgets = defineCollection({
  loader: async () => {
    const data = await Collection.getGadgetsCollection()
    return data.filter(item => item.in_use.toLowerCase() === "true").map((item, index) => ({
      id: `gadget-${index + 1}`,
      ...item
    }))
  },
  schema: z.object({
    name: z.string(),
    type: z.enum([
      "Smartphone",
      "Tablet",
      "Laptop",
      "Desktop",
      "Monitor",
      "Keyboard",
      "Mouse",
      "Headphone",
      "Earphone",
      "Smartwatch",
      "Camera",
      "Console",
      "Accessory",
      "Other"
    ]),
    brand: z.string(),
    notes: z.string(),
    in_use: z.string(),
    web: z.string().optional()
  })
})

export const collections = {
  blog,
  project,
  games,
  figures,
  books,
  movies,
  series,
  anime,
  musics,
  gadgets
}
