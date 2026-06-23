// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

import type { Dictionary } from './types';

export const SITE_TITLE: string = 'Jalu Wibowo Aji';
export const SITE_DESCRIPTION: string = "Jalu Wibowo | Front-end Web Developer & Software Engineer from Semarang. Explore my projects, blog, and open-source work.";

const icons: Dictionary = {
  android: 'logos:android-icon',
  apple: 'logos:apple',
  appstore: 'logos:apple-app-store',
  astro: 'logos:astro',
  aws: 'logos:aws',
  awss3: 'logos:aws-s3',
  bootstrap: 'logos:bootstrap',
  css: 'logos:css-3',
  chartjs: 'logos:chartjs',
  chrome: 'logos:chrome',
  cypress: 'logos:cypress',
  dart: 'logos:dart',
  electron: 'logos:electron',
  eslint: 'logos:eslint',
  expo: 'logos:expo-icon',
  express: 'logos:express',
  figma: 'logos:figma',
  firebase: 'logos:firebase',
  flutter: 'logos:flutter',
  github: 'logos:github-icon',
  git: 'logos:git-icon',
  gitlab: 'logos:gitlab',
  googleplay: 'logos:google-play-icon',
  graphql: 'logos:graphql',
  gsap: 'simple-icons:gsap',
  heroku: 'logos:heroku-icon',
  html: 'logos:html-5',
  javascript: 'logos:javascript',
  jest: 'logos:jest',
  jira: 'logos:jira',
  jquery: 'logos:jquery',
  jwt: 'logos:jwt-icon',
  markdown: 'logos:markdown',
  mdx: 'logos:mdx',
  mongodb: 'logos:mongodb',
  nodejs: 'logos:nodejs-icon',
  npm: 'logos:npm',
  next: 'logos:nextjs-icon',
  nuxt: 'logos:nuxt-icon',
  p5js: 'logos:p5js',
  parcel: 'logos:parcel-icon',
  php: 'logos:php',
  pinia: 'logos:pinia',
  pnpm: 'logos:pnpm',
  postgresql: 'logos:postgresql',
  prettier: 'logos:prettier',
  react: 'logos:react',
  reactnative: 'logos:react',
  redis: 'logos:redis',
  redux: 'logos:redux',
  remix: 'logos:remix-icon',
  ruby: 'logos:ruby',
  rubygems: 'logos:rubygems',
  rubyonrails: 'logos:rails',
  rust: 'logos:rust',
  sass: 'logos:sass',
  sequelize: 'logos:sequelize',
  supabase: 'logos:supabase-icon',
  tailwind: 'logos:tailwindcss-icon',
  tauri: 'logos:tauri',
  telegrambot: 'logos:telegram',
  threejs: 'logos:threejs',
  typescript: 'logos:typescript-icon',
  unity: 'logos:unity',
  vercel: 'logos:vercel-icon',
  vitest: 'logos:vitest',
  vuejs: 'logos:vue',
  vscode: 'logos:visual-studio-code',
  wordpress: 'logos:wordpress-icon',
  yarn: 'logos:yarn',
  yaml: 'logos:yaml'
} as const;

export const getIcon = (title: string):string => {
  // key must lowercase, no space, no dash, no dot, no underscore
  const key = title.toLowerCase().replace(/[\s\.\-_]/g, '');
  const icon = icons[key as keyof typeof icons];
  return icon || ''
}

// https://prismjs.com/#supported-languages
export const languages: Dictionary = {
  bash: 'Bash',
  css: 'CSS',
  dart: 'Dart',
  go: 'Go',
  graphql: 'GraphQL',
  html: 'HTML',
  java: 'Java',
  js: 'JavaScript',
  json: 'JSON',
  md: 'Markdown',
  php: 'PHP',
  py: 'Python',
  ruby: 'Ruby',
  scss: 'SCSS',
  sh: 'Shell',
  shell: 'Shell',
  sql: 'SQL',
  ts: 'TypeScript',
  tsx: 'TypeScript',
  yaml: 'YAML'
}
