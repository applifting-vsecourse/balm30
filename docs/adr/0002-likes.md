# 0002 — Likes are rows, counted on read

## Status

Accepted, 2026-11-24. Not implemented yet. The cases are in [`docs/08-likes/cases.md`](../08-likes/cases.md).

## Context

The product owner wants a like button and a like count on every quack. Each user can like a quack once and take the like back. The agreed cases add more requirements on the data:

- The API tells each viewer whether they liked a quack (`likedByMe`), so the app must know who liked what, not only how many.
- Liking twice, or twice at once, leaves the count at 1 (R3, A7). Unliking without a like changes nothing (R4, A6).
- The feed can be sorted by like count, ties newest first (R10, A12), together with search and "mine".
- Admin Stats show total likes and likes in the last 7 days (R12), so a like needs a time.
- Deleted quacks are tombstones ([ADR 0001](0001-quack-deletion-tombstones.md)). Their likes stay in the database but are never shown or counted (R9, R13).

Today the feed returns all quacks without pagination. The closest existing model is `PollVote`: one row per user and poll, with the composite key `@@id([pollId, userId])`.

This is a data model decision. Whatever the table looks like, the feed, the quack's page, search, sorting and stats will all read it.

## Decision

A new `Like` model, one row per user and quack:

```prisma
model Like {
  quack     Quack    @relation(fields: [quackId], references: [id], onDelete: Cascade)
  quackId   String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  createdAt DateTime @default(now())

  @@id([quackId, userId])
  @@index([userId])
  @@map("like")
}
```

- **Once per user:** the composite primary key `(quackId, userId)`. The database enforces it, so concurrent requests can't create a second like.
- **Like:** an insert that ignores a conflict on the key (`ON CONFLICT DO NOTHING`, or Prisma `createMany` with `skipDuplicates`). Liking again is not an error.
- **Unlike:** `deleteMany` by `quackId` and `userId`. Deleting nothing is not an error.
- **Count:** computed when read, with Prisma's relation count (`_count: { select: { likes: true } }`), the way replies are already counted in `includeQuackRelationsFor`. It is never stored.
- **`likedByMe`:** the viewer's own like, selected through the relation filtered by `userId`, the way the viewer's poll vote is read today.
- **Sorting by likes:** `orderBy: [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }]`.
- **Stats:** `like.count` filtered on `quack.deletedAt: null`. The last 7 days also filter on `Like.createdAt`.
- **Tombstones:** deleting a quack leaves its likes in place. Anything that returns or counts likes must go through the quack's `deletedAt`.

## Options considered

| Option                                                             | Why not chosen                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Like` table, count on read** (chosen)                           | —                                                                                                                                                                                                                                                                                                                                                 |
| `Like` table plus a `likeCount` column, updated in the transaction | Two sources of truth. The counter may only change when a row was really inserted or deleted, or retries and races push it out of sync. Deleting a user cascades away their likes without lowering any counter. Stats still have to count rows, for the 7-day window. Its benefit, cheap sorting, doesn't matter while the feed has no pagination. |
| `Like` table plus a counter kept in sync by a Postgres trigger     | Keeps the counter correct, cascades included. But the logic lives in hand-written SQL in a migration, outside TypeScript and invisible to Prisma, which nothing else in the project does. Harder to read and test, for a speed-up that isn't needed yet.                                                                                          |
| Only a counter on `Quack`                                          | Can't say who liked a quack, so it can't enforce "once", answer `likedByMe` or allow an unlike. It doesn't meet the request.                                                                                                                                                                                                                      |
| `Like` with its own `id` plus a unique `(quackId, userId)`         | Behaves the same, with an extra column nobody uses. The composite key matches `PollVote`.                                                                                                                                                                                                                                                         |

## Consequences

**For reads**

- Every quack response counts its likes. One feed request runs a count per quack, served by the primary key index, which starts with `quackId`. That is fine at this app's size, without pagination.
- Sorting by likes counts likes for every quack that matches. It can't use an index on the count. If the feed gets pagination or grows large, revisit this. The way out is the counter from the rejected options, filled from the existing rows in one migration with no data lost.
- Likes on deleted quacks stay in the table. The quack response returns `likeCount: null` and `likedByMe: null` for a tombstone (R9), and stats join on `quack.deletedAt: null` (R13). As in ADR 0001, a missing filter fails silently, so these places need a test with a liked tombstone.

**For writes**

- Liking and unliking are idempotent, and nothing has to be read first. The client can retry safely, which the optimistic UI relies on (R16, R17).
- The tombstone transaction in `QuackRepository.deleteQuack` stays as it is. The `onDelete: Cascade` on `Like.quack` only matters if a quack row is ever physically removed, which ADR 0001 rules out in application code.
- Deleting a user cascades to their likes, and nothing has to be recomputed. Account deletion is still blocked for other reasons (ADR 0001).

**Undoing or changing this decision**

- Adding a stored counter later is cheap: add the column, backfill it from `Like` and keep it in sync from then on. Removing one is just as cheap.
- Turning likes into reactions of several kinds (👍 ❤️ 😂) changes the key to `(quackId, userId, kind)` or adds a `kind` column with a new unique constraint. That is a migration on a populated table, and every `likedByMe` and count changes meaning. Decide it before reactions are promised.
- The likes table is the only record of who liked what. Once it holds data, removing it loses that for good.
