import { z } from "zod"

import { moodSchema } from "@/lib/mood"

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30
export const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/
export const NAME_MAX_LENGTH = 50
export const BIO_MAX_LENGTH = 160

export const profileSchema = z.object({
  username: z.string(),
  name: z.string(),
  bio: z.string().nullable(),
  defaultMood: moodSchema.nullable(),
})

export type Profile = z.infer<typeof profileSchema>
