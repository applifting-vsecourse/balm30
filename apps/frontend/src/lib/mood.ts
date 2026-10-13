import { z } from "zod"

export const MOODS = ["happy", "sad", "angry", "silly"] as const

export const moodSchema = z.enum(MOODS)

export type Mood = z.infer<typeof moodSchema>

export const moodLabels: Record<Mood, { emoji: string; label: string }> = {
  happy: { emoji: "😄", label: "Happy" },
  sad: { emoji: "😢", label: "Sad" },
  angry: { emoji: "😠", label: "Angry" },
  silly: { emoji: "🤪", label: "Silly" },
}
