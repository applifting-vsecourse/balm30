# Stats: an overview for the admin

## Story

As an admin, I want to see a few numbers about the app on one page, so that I know how much is going on without looking into the database.

### Acceptance criteria

**What the page shows**

- Totals: users, quacks, polls and votes.
- How many quacks were posted in the last 7 days.
- The numbers come from the server when the page opens and when I return to the tab. Not live.

**Who can see it**

- Only an admin. The API (`GET /api/stats`) is marked `@Roles('admin')`: a regular user gets 403, signed out gets 401.
- The admin finds the link "Stats" in the user menu, next to "Settings". Nobody else sees the link.
- A regular user who opens `/stats` directly is sent to `/quacks`. Signed out is sent to the login page, as for any protected page.

### Out of scope

- Charts, history, filters, exports.
- Stats for the moderator role (there is none yet).

## Decisions

| Question                                | Decision                                       |
| --------------------------------------- | ---------------------------------------------- |
| Which numbers?                          | Totals, plus quacks in the last 7 days.        |
| A regular user opens `/stats` directly? | Redirect to `/quacks`. The API refuses anyway. |
| Where is the link?                      | The user menu, next to "Settings".             |
