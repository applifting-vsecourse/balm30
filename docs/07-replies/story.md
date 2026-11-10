# Replies: answer a quack and see the conversation under it

## Story

As a user, I want to reply to a quack and see the replies under it, so that everyone can tell what a reply is answering instead of guessing from "@name …" at the start of a new quack.

As an author, I want my quack's content to really disappear when I delete it, while other people's replies to it stay, because those replies are theirs.

### Acceptance criteria

**Replying**

- A reply is a quack with a parent. It has the same rules as any quack: up to 280 characters, text unless it has a poll, optional mood, optional poll.
- I reply from the quack's detail page (`/quacks/$quackId`). The feed's "N replies" / "Reply" link takes me there. The feed's post form stays as it is.
- I can reply to a reply. Each detail page shows one level: the quack and its direct replies.
- The author of a reply is taken from the session, as for any quack.
- Replying to a quack that is deleted or doesn't exist gets 404 "This quack does not exist". A deleted quack's page has no reply box.

**What I see**

- The feed shows every quack that isn't deleted, top-level quacks and replies alike, newest first.
- A reply in the feed, in "mine" and in search results is labelled "replying to @name", linking to the parent's detail page. If the parent is deleted, the label reads "replying to a deleted quack" and still links there.
- Every quack shows "N replies", linking to its detail page. N counts replies that aren't deleted.
- The detail page shows the quack at the top, then its direct replies, oldest first.
- A deleted quack is shown only as a placeholder, "This quack was deleted": no author, text, mood, poll, date or delete button. It appears only on a detail page:
  - as the top of its own page, if it has at least one reply that isn't deleted. Otherwise the page is 404.
  - as a reply in its parent's list, if it has at least one reply that isn't deleted. Otherwise it is left out.
- Search and "mine" never return deleted quacks.

**Deleting**

- Who can delete doesn't change: the author, or an admin (see `docs/06-moderation/story.md`).
- Deleting a quack that has replies says in the confirmation that the replies will stay. The wording is the same for an author and for an admin, apart from the existing "@username's quack" variant.
- Deleting wipes the content: the text is emptied, the mood is cleared, and the poll is deleted together with its options and votes. The row stays with `deletedAt` set, so its replies keep their parent.
- The API never returns the author of a deleted quack (`user: null`). The `userId` stays in the database only.
- Deleting a quack that is already deleted gets 404.
- Replies to a deleted quack are not touched.

**Stats**

- `quacks` and `recentQuacks` count quacks that aren't deleted, replies included.

**Existing data**

- Quacks that exist today become top-level quacks with no replies. Old "@name …" quacks are not converted.

### Out of scope

- Deleting a user account (nothing in the app does it today). The database refuses to delete a user whose quacks have replies from other people. See question 3 below.
- Notifications about replies, mentions, editing quacks, restoring deleted quacks.
- Showing a whole thread several levels deep on one page.
- Pagination of the feed or of replies.

### Known limitation

- In the chain `A → B (deleted) → C (deleted) → D`, B has no reply that isn't deleted, so B's page is 404. D is still reachable from the feed, and C's page shows C's placeholder with D under it, but you can't walk up from C to A.

## Where it lands in the code

| Area                                                                        | Change                                                                                                                                  |
| --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `prisma/schema.prisma` + migration                                          | `parentId`, `replies`, `deletedAt` on `Quack`, plus an index on `parentId`.                                                             |
| `modules/quack/domain/quack.ts`                                             | `parentId`, `replyCount`, `replyingTo`, `isDeleted`; `user` becomes nullable in the response.                                           |
| `modules/quack/repositories/quack.repository.ts`                            | `deletedAt: null` filter on every list, `_count` of replies, parent's author, `getQuackWithReplies`, delete becomes a tombstone update. |
| `modules/quack/services/quacks.service.ts`                                  | Reply to a quack that isn't deleted, detail page 404 rule, `getAuthorId` ignores deleted quacks.                                        |
| `modules/quack/controllers` + DTOs                                          | Optional `parentId` in `CreateQuackDto`, `GET /api/quacks/:quackId`, new response fields.                                               |
| `modules/stats/repositories/stats.repository.ts`                            | `deletedAt: null` on the quack counts.                                                                                                  |
| `scripts/seed`                                                              | A few replies, plus one deleted quack that has replies.                                                                                 |
| `features/quack/api` (`quackSchemas`, `quackKeys`, new detail query)        | New fields, nullable `user`, detail query.                                                                                              |
| `features/quack/components` (`QuackItem`, `QuackForm`, `DeleteQuackButton`) | "N replies", "replying to", placeholder, `parentId` on the form, confirmation wording.                                                  |
| `routes/_ProtectedPages/quacks.$quackId.tsx`                                | New detail page.                                                                                                                        |

## Decisions

| Question                             | Decision                                                                                                                                                                   | Rejected option and why                                                                                                                                                                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Is a reply a quack?                  | Yes: `Quack` with a nullable `parentId` (self-relation).                                                                                                                   | A separate `Reply` model would need its own delete, moderation, permission and "content must disappear" logic, and replies to replies would need yet another relation.                                                                                     |
| Do replies show in the feed?         | Yes, labelled "replying to @name".                                                                                                                                         | Only under the parent: replies would be hard to find. Only under the parent but also in "mine" and search (recommended at the time): rejected in favour of showing all activity in the feed.                                                               |
| How do I see replies to a quack?     | A detail page `/quacks/$quackId` with one level of replies.                                                                                                                | Inline under the parent in the feed: every reply would appear twice. A "N replies" toggle: "replying to" would have no page to link to.                                                                                                                    |
| What happens to the row on delete?   | Tombstone: `deletedAt` set, content wiped, poll deleted, row kept. **This overrides "delete for good" in `docs/06-moderation/story.md`** for the row, not for the content. | Hard delete with `onDelete: SetNull` on replies: a reply would turn into an answer to nothing, and the lost link can't be restored later. Hard delete only without replies: two code paths, plus cleanup when the last reply under a tombstone is deleted. |
| Does a tombstone keep its author?    | Yes, `userId` stays in the database but is never returned by the API.                                                                                                      | Setting `userId` to null: makes `userId` optional across the whole codebase to guard against someone reading the database directly. It can still be done later in one migration.                                                                           |
| Where does "N replies" come from?    | Computed on read with a filtered `_count`.                                                                                                                                 | A stored `replyCount` column: the same fact in two places, which drifts as soon as one write path forgets to update it.                                                                                                                                    |
| Does a deleted reply count toward N? | No. N means "replies you can read".                                                                                                                                        | Counting it: the number would include placeholders, which says nothing to the reader.                                                                                                                                                                      |
| `onDelete` of `parentId`             | `NoAction`.                                                                                                                                                                | `Cascade` deletes other people's replies, against the story. `SetNull` silently breaks threads. `Restrict` would also block deleting a user whose quacks reply to each other, because Postgres checks it immediately, not at the end of the statement.     |

## Proposed schema

Only `Quack` changes. Every other model stays as it is.

```prisma
model Quack {
  id        String    @id @default(cuid())
  text      String    @db.Text
  mood      Mood?
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  poll      Poll?
  parent    Quack?    @relation("QuackReplies", fields: [parentId], references: [id], onDelete: NoAction)
  parentId  String?
  replies   Quack[]   @relation("QuackReplies")
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @default(now()) @updatedAt

  @@index([userId])
  @@index([parentId])
  @@map("quack")
}
```

Expected migration (generated by `pnpm backend prisma:migrations:run`, name `quack_replies`):

```sql
ALTER TABLE "quack" ADD COLUMN "parentId" TEXT, ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE INDEX "quack_parentId_idx" ON "quack"("parentId");
ALTER TABLE "quack" ADD CONSTRAINT "quack_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "quack"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
```
