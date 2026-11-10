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

test("a reply stays under its parent after the author deletes the parent", async ({ browser }) => {
  const stamp = Date.now()
  const parentText = `E2E question ${stamp}`
  const replyText = `E2E answer ${stamp}`
  const author = await pageSignedInAs(browser, "caffeinatedduck@example.com", "password1")
  const replier = await pageSignedInAs(browser, "breadcritic@example.com", "password3")
  const parentId = await postQuack(author, parentText)

  await replier.goto("/quacks")
  await replier
    .getByRole("article")
    .filter({ hasText: parentText })
    .getByRole("link", { name: "Reply" })
    .click()
  await expect(replier).toHaveURL(`/quacks/${parentId}`)
  await replier.getByLabel("Your reply").fill(replyText)
  await replier.getByRole("button", { name: "Reply" }).click()
  await expect(replier.getByRole("article").filter({ hasText: replyText })).toBeVisible()

  await author.goto(`/quacks/${parentId}`)
  await author.getByRole("button", { name: "Delete quack" }).click()
  const dialog = author.getByRole("alertdialog", { name: "Delete this quack?" })
  await expect(dialog).toContainText("Its replies stay")
  await dialog.getByRole("button", { name: "Delete" }).click()
  await expect(author.getByText("This quack was deleted.")).toBeVisible()
  await expect(author.getByText(parentText)).toHaveCount(0)
  await expect(author.getByRole("article").filter({ hasText: replyText })).toBeVisible()

  await replier.goto("/quacks")
  await expect(replier.getByText(parentText)).toHaveCount(0)
  const replyInFeed = replier.getByRole("article").filter({ hasText: replyText })
  await expect(replyInFeed.getByRole("link", { name: "a deleted quack" })).toBeVisible()

  const lateReply = await replier.request.post(`${API}/quacks`, {
    data: { text: "too late", parentId },
  })
  expect(lateReply.status()).toBe(404)

  await Promise.all([author, replier].map((page) => page.context().close()))
})
