// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Jalu Wibowo';
export const SITE_DESCRIPTION = "Passionate web developer with a strong focus on frontend expertise. Crafting visually stunning and user-friendly interfaces using a diverse range of frameworks and languages. Meticulous attention to detail and a commitment to excellence in every project. Let's collaborate to create outstanding web experiences!";

const icons = {
  astro: 'astro',
  aws: 'logos:aws',
  bootstrap: 'logos:bootstrap',
  css: 'logos:css-3',
  dart: 'logos:dart',
  eslint: 'logos:eslint',
  expo: 'logos:expo-icon',
  figma: 'logos:figma',
  firebase: 'logos:firebase',
  flutter: 'logos:flutter',
  github: 'logos:github-icon',
  git: 'logos:git-icon',
  gitlab: 'logos:gitlab',
  graphql: 'logos:graphql',
  heroku: 'logos:heroku-icon',
  html: 'logos:html-5',
  javascript: 'logos:javascript',
  jest: 'logos:jest',
  jira: 'logos:jira',
  jquery: 'logos:jquery',
  jwt: 'logos:jwt-icon',
  markdown: 'logos:markdown',
  mdx: 'logos:mdx',
  mongodb: 'mongodb',
  nodejs: 'logos:nodejs-icon',
  npm: 'logos:npm',
  nuxt: 'logos:nuxt-icon',
  p5js: 'p5js',
  parcel: 'logos:parcel-icon',
  pinia: 'pinia',
  pnpm: 'pnpm',
  postgresql: 'logos:postgresql',
  prettier: 'logos:prettier',
  react: 'logos:react',
  reactnative: 'logos:react',
  redis: 'logos:redis',
  redux: 'logos:redux',
  ruby: 'logos:ruby',
  rubygems: 'logos:rubygems',
  rubyonrails: 'logos:rails',
  sass: 'logos:sass',
  sequelize: 'logos:sequelize',
  tailwind: 'logos:tailwindcss-icon',
  typescript: 'logos:typescript-icon',
  vercel: 'logos:vercel-icon',
  vuejs: 'logos:vue',
  vscode: 'logos:visual-studio-code',
  yarn: 'logos:yarn',
  yaml: 'yaml'
} as const;

export const getIcon = (title: string):string => {
  // key must lowercase, no space, no dash, no dot, no underscore
  const key = title.toLowerCase().replace(/[\s\.\-_]/g, '');
  const icon = icons[key as keyof typeof icons];
  return icon || ''
}