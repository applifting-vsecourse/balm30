import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  workers: process.env.CI ? 1 : undefined,
  use: { baseURL: "http://localhost:3050" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
