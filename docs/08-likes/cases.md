# Likes: test cases

## Request

> People want to show they like a quack without having to reply. I want a like button and a like count on every quack. Everyone can like a quack only once, and take the like back.

## Decisions

| Question                              | Decision                                                                                                               |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Can I like my own quack?              | Yes, like any other.                                                                                                   |
| Signed out?                           | 401, like the rest of `/api/quacks`.                                                                                   |
| Deleted quack (tombstone)?            | Like and unlike get 404. The placeholder shows no button and no count. Existing likes stay in the database, hidden.    |
| Like again when already liked?        | Succeeds, the count stays.                                                                                             |
| Unlike when not liked?                | Succeeds, the count stays.                                                                                             |
| Does the user see that they liked it? | Yes: the button is pressed (`aria-pressed`), and the API returns `likedByMe`. No list of who liked.                    |
| Replies?                              | A reply is a quack: it can be liked everywhere it appears (feed, "mine", search, the quack's page).                    |
| Is a count of 0 shown?                | Yes.                                                                                                                   |
| After a click?                        | The button and count change at once. If the request fails, they return to the previous state and an error toast shows. |
| Sorting                               | The feed has Newest (default) / Most liked. Most liked: by count, ties newest first. Works with search and "mine".     |
| Admin Stats                           | Total likes and likes in the last 7 days. Likes on deleted quacks are not counted.                                     |

API proposed by these cases: `POST /api/quacks/:quackId/like` and `DELETE /api/quacks/:quackId/like`, both answering `200 { likeCount, likedByMe }`; every quack in responses has `likeCount` and `likedByMe`; `GET /api/quacks` takes `sort=newest|likes`; `GET /api/stats` adds `likes` and `recentLikes`.

## Rules (unit tests)

### Liking and unliking

**R1 — Like counts once**

- Given a quack with 0 likes
- When I like it
- Then its count is 1 and `likedByMe` is true

**R2 — Unlike takes it back**

- Given a quack I liked, with 1 like
- When I unlike it
- Then its count is 0 and `likedByMe` is false

**R3 — Liking twice changes nothing**

- Given a quack I liked, with 1 like
- When I like it again
- Then it succeeds, the count is still 1 and `likedByMe` is true

**R4 — Unliking without a like changes nothing**

- Given a quack I haven't liked, with 0 likes
- When I unlike it
- Then it succeeds and the count is still 0

**R5 — My own quack**

- Given my own quack with 0 likes
- When I like it
- Then its count is 1

**R6 — Each user counts once**

- Given a quack liked by Alice
- When Bob likes it
- Then its count is 2, `likedByMe` is true for Bob and for Alice, and false for Carol

**R7 — Deleted quack can't be liked or unliked**

- Given a deleted quack (kept as a placeholder because it has replies)
- When I like it, or unlike it
- Then it is refused as not found and nothing changes

**R8 — Missing quack**

- Given no quack with the id
- When I like it
- Then it is refused as not found

**R9 — Deleted quack shows no likes**

- Given a deleted quack that had 3 likes before it was deleted
- When it is turned into a response
- Then `likeCount` and `likedByMe` are `null`, like its author and text

### Sorting

**R10 — Most liked first, ties newest first**

- Given quack A (2 likes, oldest), B (5 likes) and C (2 likes, newest)
- When the feed is sorted by likes
- Then the order is B, C, A

**R11 — Newest stays the default**

- Given the same quacks
- When no sort is chosen
- Then the order is C, B, A (newest first), as today

### Stats

**R12 — Total and recent likes**

- Given 3 likes: one 2 days old, one exactly 7 days old, one 8 days old
- When the stats are computed
- Then `likes` is 3 and `recentLikes` follows the same 7-day boundary as `recentQuacks`

**R13 — Likes on deleted quacks don't count**

- Given 2 likes on a live quack and 3 on a deleted one
- When the stats are computed
- Then `likes` is 2

### Like button (frontend component)

**R14 — Shows the count and my state**

- Given a quack with 4 likes, liked by me
- When it is rendered
- Then the like button shows 4 and is pressed (`aria-pressed="true"`)

**R15 — Zero is shown**

- Given a quack with 0 likes
- When it is rendered
- Then the like button shows 0 and is not pressed

**R16 — Instant update**

- Given a quack with 0 likes, not liked by me
- When I click like, before the server answers
- Then the button shows 1 and is pressed

**R17 — Rollback on error**

- Given a quack with 0 likes and a server that fails the like
- When I click like
- Then the button returns to 0, not pressed, and an error toast shows

**R18 — No button on a deleted quack**

- Given the placeholder of a deleted quack
- When it is rendered
- Then there is no like button and no count

**R19 — Sort switch**

- Given the feed
- When I choose "Most liked"
- Then the list is requested with `sort=likes`, and search and "mine" are kept

## API behaviour (integration tests)

**A1 — Signed out**

- Given a signed-out visitor and an existing quack
- When they `POST` or `DELETE /api/quacks/:quackId/like`
- Then they get 401 and the count doesn't change

**A2 — Like**

- Given a signed-in user and someone else's quack with 0 likes
- When they `POST /api/quacks/:quackId/like`
- Then they get 200 `{ likeCount: 1, likedByMe: true }`

**A3 — The like shows in the feed, per viewer**

- Given Alice liked a quack
- When Alice and Bob each `GET /api/quacks`
- Then both see `likeCount: 1`; Alice sees `likedByMe: true`, Bob `false`

**A4 — Like twice**

- Given a user who liked a quack
- When they `POST` the like again
- Then they get 200 `{ likeCount: 1, likedByMe: true }`

**A5 — Unlike**

- Given a user who liked a quack
- When they `DELETE /api/quacks/:quackId/like`
- Then they get 200 `{ likeCount: 0, likedByMe: false }`

**A6 — Unlike without a like**

- Given a user who hasn't liked a quack with 1 like from someone else
- When they `DELETE` the like
- Then they get 200 `{ likeCount: 1, likedByMe: false }`

**A7 — Two likes at once from one user**

- Given a user and a quack with 0 likes
- When they send two `POST` likes in parallel
- Then both get 200 and the count is 1

**A8 — Own quack**

- Given a user's own quack
- When they like it
- Then they get 200 `{ likeCount: 1, likedByMe: true }`

**A9 — Deleted quack**

- Given a quack with a reply, liked once, then deleted
- When a user `POST`s or `DELETE`s its like
- Then they get 404, and `GET /api/quacks/:quackId` shows the placeholder with `likeCount: null`, `likedByMe: null`

**A10 — Missing quack**

- Given an id that doesn't exist
- When a user likes it
- Then they get 404

**A11 — Replies**

- Given a quack with a reply
- When a user likes the reply and opens `GET /api/quacks/:quackId`
- Then the reply has `likeCount: 1` and the parent `likeCount: 0`

**A12 — Sort by likes**

- Given three quacks with 0, 2 and 1 likes
- When a user `GET /api/quacks?sort=likes`
- Then they come back ordered 2, 1, 0

**A13 — Sort combines with search and "mine"**

- Given my quacks and others' quacks, some containing "pond", with different counts
- When I `GET /api/quacks?sort=likes&scope=mine&q=pond`
- Then I get only my quacks containing "pond", most liked first

**A14 — Invalid sort**

- Given a signed-in user
- When they `GET /api/quacks?sort=popular`
- Then they get 400

**A15 — Stats**

- Given 2 likes on live quacks and 1 on a deleted quack
- When an admin `GET /api/stats`
- Then the response has `likes: 2` and `recentLikes: 2`; a regular user still gets 403 and signed out 401

## End-to-end flows (Playwright)

**E1 — Like, reload, unlike**

- Given I am signed in and post a new quack
- When I click its like button
- Then it shows 1 and is pressed; after reloading the page it still shows 1 and is pressed
- When I click it again
- Then it shows 0 and is not pressed; after reloading it still shows 0

**E2 — Two users**

- Given Alice liked a new quack
- When Bob opens the feed
- Then he sees 1 and the button is not pressed
- When Bob likes it
- Then he sees 2 and the button is pressed

## Out of scope

- Notifying the author about a like.
- Live updates of other people's likes (the count refreshes on reload or refetch).
- A list of who liked a quack.
- A "Liked by me" filter.
- The most liked quack on the Stats page.
