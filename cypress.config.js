import { defineConfig } from "cypress"
import { loadEnv } from "vite"

const { PUBLIC_CONTACT_ME_API, PUBLIC_WEATHER_API } = loadEnv("development", process.cwd(), "")

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:4321",
    supportFile: false,
    env: {
      PUBLIC_CONTACT_ME_API,
      PUBLIC_WEATHER_API
    }
  }
})
