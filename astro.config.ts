import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import icon from "astro-icon";
import sitemap from '@astrojs/sitemap';
import tailwind from "@astrojs/tailwind";
import autolinkHeadings from 'rehype-autolink-headings'
import rehypeExternalLinks from 'rehype-external-links'
import rehypeSlug from 'rehype-slug'
import { remarkReadingTime } from './src/utils/remark-reading-time';
import { autolinkConfig } from './src/utils/rehype-auto-link';

// https://astro.build/config
export default defineConfig({
  site: 'https://jaluwibowo.id',
  integrations: [
    icon(),
    mdx(),
    sitemap(),
    tailwind({
      // Example: Disable injecting a basic `base.css` import on every page.
      // Useful if you need to define and/or import your own custom `base.css`.
      applyBaseStyles: false,
    })
  ],
  markdown: {
    gfm: true,
    syntaxHighlight: 'prism',
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [
      rehypeSlug,
      [
        autolinkHeadings,
        autolinkConfig
      ],
      [
        rehypeExternalLinks,
        {
          target: '_blank',
          rel: 'noreferrer',
        },
      ],
    ]
  },
});