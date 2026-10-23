import { expect, test } from "@playwright/test"

import { signIn } from "./signIn"

const API = "http://localhost:4050/api"

test("an admin opens Stats from the user menu", async ({ page }) => {
  await signIn(page, "admin@example.com", "adminpassword")

  await page.getByRole("button", { name: "User menu" }).click()
  await page.getByRole("menuitem", { name: "Stats" }).click()

  await expect(page).toHaveURL(/\/stats$/)
  await expect(page.getByRole("heading", { name: "Stats" })).toBeVisible()
  await expect(page.getByRole("main").getByText("Users", { exact: true })).toBeVisible()
})

test("a regular user can't reach Stats", async ({ page }) => {
  await signIn(page, "caffeinatedduck@example.com", "password1")

  await page.getByRole("button", { name: "User menu" }).click()
  await expect(page.getByRole("menuitem", { name: "Settings" })).toBeVisible()
  await expect(page.getByRole("menuitem", { name: "Stats" })).toHaveCount(0)
  await page.keyboard.press("Escape")

  await page.goto("/stats")
  await expect(page).toHaveURL(/\/quacks$/)

  const response = await page.request.get(`${API}/stats`)
  expect(response.status()).toBe(403)
})
