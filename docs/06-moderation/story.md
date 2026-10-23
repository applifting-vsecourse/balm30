# Moderation: an admin can delete any quack

## Story

As a moderator (a user with the `admin` role), I want to delete any quack, so that nasty quacks disappear even when their author won't delete them.

### Acceptance criteria

**Who can delete**

- The author can delete their own quack, as today.
- An admin can delete any quack, their own and everyone else's.
- Everyone else gets 403, in the UI and when calling the API directly. Signed out gets 401. A quack that doesn't exist gets 404.
- The check is on the server, in the service: "the author, or an admin". The UI only follows what the server says (`canDelete`).

**What the admin sees**

- The admin sees "Delete quack" on every quack in the feed, in both tabs.
- Deleting their own quack asks the same question as for any author: "Delete this quack?".
- Deleting someone else's quack names the author: "Delete @username's quack?", and says it is deleted as a moderator.
- After deleting, the quack disappears from the feed, as today.

**What happens to the quack**

- It is deleted for good, the same as when the author deletes it, together with its poll and votes. No hiding, no restoring.
- The server log says who deleted it: `by=author` or `by=moderator`. Nothing is stored in the database.

### Out of scope

- A separate moderator role. Moderator means `admin` for now.
- Notifying the author, reasons for deleting, an audit table.
- Moderating anything else: editing quacks, closing other people's polls, banning users.

## Decisions

| Question                                                 | Decision                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------ |
| Delete for good, or hide (soft delete)?                  | For good, same as the author. "Nothing more for now."        |
| Same confirmation for the admin on someone else's quack? | No: name the author, so the admin knows they are moderating. |
| Record moderator deletions?                              | Server log only, telling author and moderator apart.         |
