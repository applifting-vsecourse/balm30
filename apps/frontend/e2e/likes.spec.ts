import { expect, test, type Browser, type Page } from "@playwright/test"

import { signIn } from "./signIn"

async function pageSignedInAs(browser: Browser, email: string, password: string): Promise<Page> {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL })
  const page = await context.newPage()
  await signIn(page, email, password)
  return page
}

async function postQuack(page: Page, text: string) {
  await page.goto("/quacks")
  await page.getByLabel("New quack").fill(text)
  await page.getByRole("button", { name: "Quack", exact: true }).click()
  const quack = page.getByRole("article").filter({ hasText: text })
  await expect(quack).toBeVisible()
  return quack
}

test("E1: like a quack, reload, take the like back", async ({ page }) => {
  await signIn(page, "caffeinatedduck@example.com", "password1")
  const quack = await postQuack(page, `E2E like me ${Date.now()}`)
  const likeButton = quack.getByRole("button", { name: "Like" })
  await expect(likeButton).toHaveText("0")
  await expect(likeButton).toHaveAttribute("aria-pressed", "false")

  await likeButton.click()
  await expect(likeButton).toHaveText("1")
  await expect(likeButton).toHaveAttribute("aria-pressed", "true")

  await page.reload()
  await expect(likeButton).toHaveText("1")
  await expect(likeButton).toHaveAttribute("aria-pressed", "true")

  await likeButton.click()
  await expect(likeButton).toHaveText("0")
  await expect(likeButton).toHaveAttribute("aria-pressed", "false")

  await page.reload()
  await expect(likeButton).toHaveText("0")
  await expect(likeButton).toHaveAttribute("aria-pressed", "false")
})

test("E2: a second user sees the like and adds their own", async ({ browser }) => {
  const text = `E2E liked by two ${Date.now()}`
  const alice = await pageSignedInAs(browser, "caffeinatedduck@example.com", "password1")
  const bob = await pageSignedInAs(browser, "deepduckthoughts@example.com", "password2")

  const alicesQuack = await postQuack(alice, text)
  const alicesLikeButton = alicesQuack.getByRole("button", { name: "Like" })
  await expect(alicesLikeButton).toHaveText("0")
  await alicesLikeButton.click()
  await expect(alicesLikeButton).toHaveText("1")

  await bob.goto("/quacks")
  const bobsLikeButton = bob
    .getByRole("article")
    .filter({ hasText: text })
    .getByRole("button", { name: "Like" })
  await expect(bobsLikeButton).toHaveText("1")
  await expect(bobsLikeButton).toHaveAttribute("aria-pressed", "false")

  await bobsLikeButton.click()
  await expect(bobsLikeButton).toHaveText("2")
  await expect(bobsLikeButton).toHaveAttribute("aria-pressed", "true")

  await Promise.all([alice, bob].map((page) => page.context().close()))
})
