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

export const QUACK_SCOPES = ["all", "mine"] as const

export type QuackScope = (typeof QUACK_SCOPES)[number]

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

const replyingToSchema = z.object({
  quackId: z.string(),
  username: z.string().nullable(),
})

const threadFields = {
  id: z.string(),
  createdAt: z.coerce.date(),
  replyingTo: replyingToSchema.nullable(),
  replyCount: z.number().int().nonnegative(),
}

export const liveQuackSchema = z.object({
  ...threadFields,
  isDeleted: z.literal(false),
  text: z.string(),
  mood: moodSchema.nullable(),
  userId: z.string(),
  user: quackUserSchema,
  poll: pollSchema.nullable(),
  canDelete: z.boolean(),
})

export const deletedQuackSchema = z.object({
  ...threadFields,
  isDeleted: z.literal(true),
  text: z.literal(""),
  mood: z.null(),
  userId: z.null(),
  user: z.null(),
  poll: z.null(),
  canDelete: z.literal(false),
})

export const quackSchema = z.discriminatedUnion("isDeleted", [liveQuackSchema, deletedQuackSchema])

export const quacksSchema = z.array(quackSchema)

export const quackThreadSchema = z.object({
  quack: quackSchema,
  replies: quacksSchema,
})

export type Poll = z.infer<typeof pollSchema>

export type ReplyingTo = z.infer<typeof replyingToSchema>

export type LiveQuack = z.infer<typeof liveQuackSchema>

export type DeletedQuack = z.infer<typeof deletedQuackSchema>

export type Quack = z.infer<typeof quackSchema>

export type QuackThread = z.infer<typeof quackThreadSchema>
