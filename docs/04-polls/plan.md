# Polls on quacks

## Story

As a user, I want to ask a question with a few answers and let others vote, so we get a correct count without tallying replies by hand.

### Acceptance criteria

**Creating a poll**

- When writing a quack I can add a poll: a question (required, ≤ 140 characters) and 2–4 answers (each required, ≤ 50 characters, no two the same ignoring case).
- A quack with a poll doesn't need its own text; a quack without one still does.
- Mood works as today. Answers are shown in the order I entered them.

**Voting**

- Anyone signed in can vote, including the author. One vote per person per poll.
- Clicking an answer votes; clicking a different one moves my vote; clicking my own answer again removes it.
- The vote shows instantly. If the server rejects it, the poll returns to its previous state and a message with a retry appears under that poll.

**Results**

- Everyone always sees each answer's count and a percentage bar, plus the total ("12 votes"), whether or not they voted.
- My own answer is marked. Nobody, the author included, can see who voted for what.
- Counts always come from the server: updated after I vote and when I return to the tab, not live.

**Closing**

- The author can close the poll after confirming in a dialog. Closing can't be undone.
- A closed poll shows final counts, a "Closed" label and my answer still marked; nobody can vote or change their vote.
- A vote sent after the poll closed is rejected and shown as a failed vote.

**Other**

- Search finds a poll by its question (not its answers).
- The server logs each poll created and each vote cast, removed or moved, in the same style as the search log.

**Out of scope:** end dates, reopening, editing polls, voter lists, live updates, a stats page.

**Defaults chosen without asking:** "Add poll" opens a question and two answer fields, with add/remove between 2 and 4 answers. "Close poll" appears only on the author's own polls.

## Data model

Three new tables; `Quack` gets an optional `poll`, `User` gets `pollVotes`.

```prisma
model Poll {
  id        String       @id @default(cuid())
  quack     Quack        @relation(fields: [quackId], references: [id], onDelete: Cascade)
  quackId   String       @unique
  question  String       @db.VarChar(140)
  closedAt  DateTime?
  createdAt DateTime     @default(now())
  options   PollOption[]
  votes     PollVote[]

  @@map("poll")
}

model PollOption {
  id       String     @id @default(cuid())
  poll     Poll       @relation(fields: [pollId], references: [id], onDelete: Cascade)
  pollId   String
  text     String     @db.VarChar(50)
  position Int
  votes    PollVote[]

  @@unique([pollId, position])
  @@unique([id, pollId])
  @@map("poll_option")
}

model PollVote {
  poll      Poll       @relation(fields: [pollId], references: [id], onDelete: Cascade)
  pollId    String
  option    PollOption @relation(fields: [optionId, pollId], references: [id, pollId], onDelete: Cascade)
  optionId  String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  createdAt DateTime   @default(now())
  updatedAt DateTime   @default(now()) @updatedAt

  @@id([pollId, userId])
  @@index([optionId])
  @@map("poll_vote")
}
```

How "the numbers have to be right" is enforced:

- **One person, one vote:** primary key `(pollId, userId)`, so two racing requests can't create two votes.
- **A vote can't point at another poll's answer:** composite foreign key `(optionId, pollId)` → `poll_option(id, pollId)`.
- **Counts are never stored:** they are counted from `poll_vote` on read (one `groupBy` per feed request; the feed isn't paginated), so they can't drift.
- **No votes after closing:** voting and closing both lock the poll row (`SELECT … FOR UPDATE` in a transaction), so a vote either commits before the close or sees `closedAt` and is rejected.
- **Answers different ignoring case:** checked in the app, not the database; answers are written once, in one request, so there's no race.

**Quack text:** `Quack.text` stays non-null; a poll-only quack stores `""`. The service enforces "text or poll".

## Endpoints

| Method   | Path                       | Body                                                       | Success                 | Errors                                  |
| -------- | -------------------------- | ---------------------------------------------------------- | ----------------------- | --------------------------------------- |
| `POST`   | `/api/quacks` (extended)   | `{ text?, mood?, poll?: { question, options: string[] } }` | 201 quack               | 400                                     |
| `GET`    | `/api/quacks` (extended)   | –                                                          | each quack gains `poll` | –                                       |
| `PUT`    | `/api/polls/:pollId/vote`  | `{ optionId }`                                             | 200 poll                | 400 answer not in poll, 404, 409 closed |
| `DELETE` | `/api/polls/:pollId/vote`  | –                                                          | 200 poll                | 404, 409 closed                         |
| `POST`   | `/api/polls/:pollId/close` | –                                                          | 200 poll                | 403 not author, 404                     |

`poll` in responses, specific to the person asking:

```ts
{ id, question, closedAt: string | null, totalVotes,
  options: [{ id, text, votes }],
  myOptionId: string | null,
  canClose: boolean }
```

- **Idempotent writes:** `PUT` is an upsert on `(pollId, userId)` (cast or move); `DELETE` succeeds even with no vote; closing a closed poll returns 200.
- **Every write returns fresh counts**, so the client replaces its optimistic guess with the server's numbers.
- **`canClose` is computed by the server**, so `QuackItem` doesn't need the session user from the `auth` feature (the lint rules block that import).
- **Validation in `CreateQuackDto`:** nested `CreatePollDto` (2–4 answers, different ignoring case); `text` optional, max 280.
- **Search:** add the poll question to the existing `OR` filter.
- **Logs:** creation and each vote cast, moved or removed, without user IDs.

## Frontend

- Lives under `features/quack/`, since a poll is part of a quack.
- `QuackForm`: "Add poll" toggle, `useFieldArray` for 2–4 answers, zod `superRefine` for "text or poll" and different answers.
- `QuackPoll`: answers as buttons with count, bar and percentage; my answer marked; total underneath; closed polls show a "Closed" label with disabled answers.
- `useVote(pollId)` inside each `QuackPoll`, so errors stay with their poll:
  - `onMutate`: cancel quack queries, snapshot, update the poll in every cached list (`setQueriesData` on `quackKeys.lists()`).
  - `onError`: restore the snapshot; show the error under the poll with a retry.
  - `onSuccess`: write the server's poll into the caches.
  - `scope: { id: \`poll-${pollId}\` }` runs fast repeated clicks in order, so an older response can't overwrite a newer count.
- Closing: confirmation dialog, `alert-dialog` added with the shadcn CLI, shadows removed.

## Build order

Each step is a working vertical slice.

1. **Schema and migration**, plus one seeded poll.
2. **Creating and showing a poll:** DTO, repository, response, frontend schema, form, read-only `QuackPoll`. Shows answers without counts (counts arrive in slice 3, so the seeded votes aren't shown as 0).
3. **Voting on the backend:** vote endpoints, counts and `myOptionId` in the feed, the row lock, logs. Unit tests with a mocked repository.
4. **Voting on the frontend:** optimistic update, rollback, error and retry under the poll, mutation scope. Component tests for instant vote, move, remove and rollback.
5. **Closing:** endpoint, `canClose`, 409 for votes on a closed poll, dialog, closed view.
6. **Searching by question.**

## Decisions

- **Testing the row lock: checked by hand, no integration test in the repo.** In slice 3 a one-off script ran `PollRepository` against a throwaway database: 20 concurrent votes by one person left exactly one vote, and votes waiting on a closing poll were all rejected with none written. With `FOR UPDATE` removed, the same script failed (primary-key violations, votes written into a closing poll). Unit tests mock the repository, so nothing in the repo guards the lock: if it is removed, every test still passes.
