import { expect, test, type Browser, type Page } from "@playwright/test"

import { signIn } from "./signIn"

const API = "http://localhost:4050/api"

async function pageSignedInAs(browser: Browser, email: string, password: string): Promise<Page> {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL })
  const page = await context.newPage()
  await signIn(page, email, password)
  return page
}

async function postQuack(page: Page, text: string): Promise<string> {
  const response = await page.request.post(`${API}/quacks`, { data: { text } })
  expect(response.status()).toBe(201)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const quack: { id: string } = await response.json()
  return quack.id
}

test("an admin deletes someone else's quack, a regular user gets 403", async ({ browser }) => {
  const text = `E2E nasty quack ${Date.now()}`
  const author = await pageSignedInAs(browser, "caffeinatedduck@example.com", "password1")
  const regularUser = await pageSignedInAs(browser, "deepduckthoughts@example.com", "password2")
  const admin = await pageSignedInAs(browser, "admin@example.com", "adminpassword")
  const quackId = await postQuack(author, text)

  await regularUser.goto("/quacks")
  const quackSeenByUser = regularUser.getByRole("article").filter({ hasText: text })
  await expect(quackSeenByUser).toBeVisible()
  await expect(quackSeenByUser.getByRole("button", { name: "Delete quack" })).toHaveCount(0)
  const forbidden = await regularUser.request.delete(`${API}/quacks/${quackId}`)
  expect(forbidden.status()).toBe(403)

  await admin.goto("/quacks")
  const quackSeenByAdmin = admin.getByRole("article").filter({ hasText: text })
  await quackSeenByAdmin.getByRole("button", { name: "Delete quack" }).click()
  const dialog = admin.getByRole("alertdialog", { name: "Delete @CaffeinatedDuck's quack?" })
  await dialog.getByRole("button", { name: "Delete" }).click()
  await expect(quackSeenByAdmin).toHaveCount(0)

  await author.reload()
  await expect(author.getByRole("article").filter({ hasText: text })).toHaveCount(0)

  await Promise.all([author, regularUser, admin].map((page) => page.context().close()))
})
