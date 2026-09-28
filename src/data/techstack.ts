const CLOUDINARY_BASE = "https://res.cloudinary.com/dpcjjs0wg/image/upload/v1731991834"

const logo = (id: string) => `${CLOUDINARY_BASE}/${id}.svg`

export interface TechItem {
  name: string
  logo: string
}

export interface TechCategory {
  category: string
  items: TechItem[]
}

export const techStack: TechCategory[] = [
  {
    category: "Languages",
    items: [
      { name: "JavaScript", logo: logo("logos--javascript_kpeloj") },
      { name: "TypeScript", logo: logo("logos--typescript-icon_jey5r1") },
      { name: "HTML", logo: logo("logos--html-5_syoy4b") },
      { name: "CSS", logo: logo("logos--css-3_ldlex2") },
      { name: "Sass", logo: logo("logos--sass_zljcvh") },
      { name: "PHP", logo: logo("logos--php_m0tm9q") },
      { name: "Ruby", logo: logo("logos--ruby_ur5lpa") }
    ]
  },
  {
    category: "Frontend",
    items: [
      { name: "Vue", logo: logo("logos--vue_xvrlr9") },
      { name: "React", logo: logo("logos--react_bl3k6d") },
      { name: "Astro", logo: logo("logos--astro-icon_vjwx9z") },
      { name: "Remix", logo: logo("logos--remix-icon_v8fk6t") },
      { name: "Pinia", logo: logo("logos--pinia_jdqmfc") },
      { name: "Tailwind", logo: logo("logos--tailwindcss-icon_kmcoki") },
      { name: "Bootstrap", logo: logo("logos--bootstrap_plhgmx") },
      { name: "WordPress", logo: logo("logos--wordpress_bml2jm") }
    ]
  },
  {
    category: "Backend & Data",
    items: [
      { name: "Node.js", logo: logo("logos--nodejs-icon_oywclz") },
      { name: "Express", logo: logo("logos--express_agc18f") },
      { name: "GraphQL", logo: logo("logos--graphql_k5yi7x") },
      { name: "MongoDB", logo: logo("logos--mongodb-icon_ja5hur") },
      { name: "PostgreSQL", logo: logo("logos--postgresql_olcugm") },
      { name: "Redis", logo: logo("logos--redis_ixfulj") },
      { name: "Firebase", logo: logo("logos--firebase_i9whnq") }
    ]
  },
  {
    category: "Cloud",
    items: [
      { name: "AWS", logo: logo("logos--aws_fgyb8m") },
      { name: "Google Cloud", logo: logo("logos--google-cloud_gtpb5b") },
      { name: "Cloudflare", logo: logo("logos--cloudflare-icon_mdfvde") },
      { name: "Vercel", logo: logo("logos--vercel-icon_imodls") }
    ]
  },
  {
    category: "Dev Tools",
    items: [
      { name: "Git", logo: logo("logos--git-icon_gtlej6") },
      { name: "GitHub", logo: logo("logos--github-icon_vdzn05") },
      { name: "GitLab", logo: logo("logos--gitlab_dbhr4c") },
      { name: "VS Code", logo: logo("logos--visual-studio-code_lhvv6b") },
      { name: "Figma", logo: logo("logos--figma_x8aqqc") }
    ]
  },
  {
    category: "Packages & Testing",
    items: [
      { name: "npm", logo: logo("logos--npm-icon_me451n") },
      { name: "Yarn", logo: logo("logos--yarn_qwtrtq") },
      { name: "pnpm", logo: logo("logos--pnpm_ayeayi") },
      { name: "Jest", logo: logo("logos--jest_rbzrdy") }
    ]
  }
]

export const RUBIK_SLOTS = 9

// Rubik faces never have empty slots: short lists repeat in order, long lists are cut.
export function toNineSlots<T>(items: readonly T[]): T[] {
  if (items.length === 0) return []
  return Array.from({ length: RUBIK_SLOTS }, (_, i) => items[i % items.length])
}

export const allTechItems = (): TechItem[] => techStack.flatMap((c) => c.items)
