// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'Jalu Wibowo';
export const SITE_DESCRIPTION = 'Welcome to my website!';

const icons = {
  javascript: 'logos:javascript',
  typescript: 'logos:typescript-icon',
  ruby: 'logos:ruby',
  dart: 'logos:dart',
  vuejs: 'logos:vue',
  nuxtjs: 'logos:nuxt-icon',
  react: 'logos:react',
  astro: 'astro',
  jquery: 'logos:jquery',
  reactnative: 'logos:react',
  expo: 'logos:expo-icon',
  flutter: 'logos:flutter',
  nodejs: 'logos:nodejs-icon',
  expressjs: 'logos:express',
  rubyonrails: 'logos:rails',
  html: 'logos:html-5',
  markdown: 'logos:markdown',
  mdx: 'logos:mdx',
  yaml: 'yaml',
  css: 'logos:css-3',
  sass: 'logos:sass',
  tailwind: 'logos:tailwindcss-icon',
  bootstrap: 'logos:bootstrap',
  pinia: 'pinia',
  redux: 'logos:redux',
  postgresql: 'logos:postgresql',
  mongodb: 'mongodb',
  redis: 'logos:redis',
  firebase: 'logos:firebase',
  graphql: 'logos:graphql',
  aws: 'logos:aws',
  vercel: 'logos:vercel-icon',
  heroku: 'logos:heroku-icon',
  jest: 'logos:jest',
  eslint: 'logos:eslint',
  prettier: 'logos:prettier',
  npm: 'logos:npm',
  pnpm: 'pnpm',
  yarn: 'logos:yarn',
  rubygems: 'logos:rubygems',
  git: 'logos:git-icon',
  github: 'logos:github-icon',
  gitlab: 'logos:gitlab',
  vscode: 'logos:visual-studio-code',
  jira: 'logos:jira',
  figma: 'logos:figma'
} as const;

export const getIcon = (title: string):string => {
  // key must lowercase, no space, no dash, no dot, no underscore
  const key = title.toLowerCase().replace(/[\s\.\-_]/g, '');
  const icon = icons[key as keyof typeof icons];
  return icon || ''
}