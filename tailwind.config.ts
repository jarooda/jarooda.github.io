/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"]
      },
      maxWidth: {
        "20": "20px"
      },
      spacing: {
        "128": "32rem",
        "160": "40rem",
        "192": "48rem",
        "224": "56rem",
        "256": "64rem",
        "288": "72rem",
        "320": "80rem"
      }
    }
  },
  plugins: []
}
