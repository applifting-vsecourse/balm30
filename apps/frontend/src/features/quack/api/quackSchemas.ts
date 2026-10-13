import { z } from "zod"

import { moodSchema } from "@/lib/mood"

// Per the Applifting frontend playbook: validate every server payload with zod
// and infer types from the schema rather than auto-generating them.
export const quackUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string(),
})

export const POLL_QUESTION_MAX_LENGTH = 140
export const POLL_OPTION_MAX_LENGTH = 50
export const POLL_MIN_OPTIONS = 2
export const POLL_MAX_OPTIONS = 4

export const pollOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  votes: z.number().int().nonnegative(),
})

export const pollSchema = z.object({
  id: z.string(),
  question: z.string(),
  closedAt: z.coerce.date().nullable(),
  options: z.array(pollOptionSchema),
  totalVotes: z.number().int().nonnegative(),
  myOptionId: z.string().nullable(),
  canClose: z.boolean(),
})

export const quackSchema = z.object({
  id: z.string(),
  text: z.string(),
  mood: moodSchema.nullable(),
  userId: z.string(),
  createdAt: z.coerce.date(),
  user: quackUserSchema,
  poll: pollSchema.nullable(),
})

export const quacksSchema = z.array(quackSchema)

export type Poll = z.infer<typeof pollSchema>

export type Quack = z.infer<typeof quackSchema>
