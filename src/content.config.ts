import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/blog" }),
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
    draft: z.boolean().optional(),
  }),
});

const project = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: "./src/content/project" }),
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
    stacks: z.array(z.string()),
  }),
}); 

export const collections = { blog, project };
