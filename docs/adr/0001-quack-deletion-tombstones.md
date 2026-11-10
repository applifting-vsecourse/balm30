# 0001 — Deleted quacks become tombstones

## Status

Accepted, 2026-11-10. Implemented with the replies story ([`docs/07-replies/story.md`](../07-replies/story.md)).

Supersedes the "delete for good" decision in [`docs/06-moderation/story.md`](../06-moderation/story.md) for the row, not for the content.

## Context

Replies are quacks with a `parentId` pointing at another quack. The product owner set two requirements that pull against each other:

- When an author deletes a quack that has replies, the replies must not disappear. They belong to the people who wrote them.
- When someone deletes their quack, its content has to really disappear from the app.

Until now, deleting a quack removed its row, with its poll and votes (`QuackRepository.deleteQuack`). With replies, removing the row means either removing other people's replies (cascade) or cutting them loose from what they answered.

The decision isn't local to replies. It changes what "a quack exists" means for every query, module and future feature that reads the `quack` table.

## Decision

Deleting a quack never removes its row. In one transaction it:

- sets `deletedAt` to now,
- empties `text` and clears `mood`,
- deletes the quack's `Poll`, which cascades to its options and votes.

The row keeps `id`, `userId`, `parentId` and the timestamps, so replies keep their parent. The API never returns the author or content of a deleted quack: `user` is `null` and the UI shows "This quack was deleted".

`Quack.parentId` uses `onDelete: NoAction`, so the database refuses to physically remove a quack that still has replies.

This applies the same way to deletion by the author and deletion by an admin.

## Options considered

| Option                                                             | Why not chosen                                                                                                                                                                                       |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tombstone: keep the row, wipe the content** (chosen)             | —                                                                                                                                                                                                    |
| Hard delete, replies' `parentId` set to null (`onDelete: SetNull`) | A reply to a deleted quack turns into a top-level quack answering nothing. It is also irreversible: once the link is nulled, no later change can bring the thread back.                              |
| Hard delete without replies, tombstone with replies                | Two delete paths to keep correct. When the last reply under a tombstone is deleted, the tombstone has to be cleaned up, possibly up a chain of tombstones. All that to save a few empty rows.        |
| Cascade replies with the parent (`onDelete: Cascade`)              | Removes other people's replies, against the first requirement.                                                                                                                                       |
| Hide the quack without wiping it (classic soft delete)             | The content would stay in the database, against the second requirement.                                                                                                                              |
| Tombstone that also nulls `userId`                                 | Makes `userId` optional across the domain, DTOs and frontend schema to guard against someone reading the database directly. It can still be added later with one migration over existing tombstones. |

## Consequences

**For every read of `quack`**

- Every query that lists or counts quacks must filter `deletedAt: null`. Today that covers the feed, "mine", search (`QuackRepository.getQuacks`), the author lookup used for deleting (`getAuthorId`) and stats (`StatsRepository.getStats`). A missing filter shows up as an empty quack, not as an error, so each of these needs a test with a tombstone in the data.
- Whether a quack is deleted is answered only by `deletedAt`. Empty `text` isn't a signal, because a quack with a poll can have empty text.
- The API's quack `user` becomes nullable, and the frontend's zod schema and components must handle it.

**For deleting**

- Application code must not call `prisma.quack.delete`/`deleteMany`. Deleting means the tombstone update. A physical delete of a quack with replies fails on the foreign key.
- A future feature that attaches data to a quack (likes, bookmarks, reports, attachments) must decide what happens to that data when the quack becomes a tombstone. A row-level `onDelete: Cascade` will **not** fire, because the quack row isn't deleted. If the data is content, the tombstone transaction must delete it explicitly, as it does for `Poll`.
- Deleting a user (`User → Quack` is `onDelete: Cascade`) fails while any of their quacks has a reply from another user. No feature deletes users today. Account deletion will need its own decision: probably tombstone the user's quacks first, then remove the user.
- `TRUNCATE … CASCADE` in the seed isn't affected, because it ignores row-level referential actions.

**For the data**

- Rows of deleted quacks stay forever, including ones that never had replies. At this app's scale the cost is negligible.
- The database still records that a given user wrote a quack at a given time, after it is deleted. If "content" ever has to include authorship (for example a GDPR erasure request), null `userId` on tombstones. That needs `userId` to become optional.

**Undoing this decision**

- Going back to hard deletes is easy only while no deleted quack has replies. After that, the remaining options are to null the replies' `parentId`, losing the thread for good, or to keep these tombstones anyway. Treat the decision as permanent once replies are in production.
