import { z } from "zod"

const countSchema = z.number().int().nonnegative()

export const statsSchema = z.object({
  users: countSchema,
  quacks: countSchema,
  polls: countSchema,
  votes: countSchema,
  recentQuacks: countSchema,
  recentDays: z.number().int().positive(),
})

export type Stats = z.infer<typeof statsSchema>
