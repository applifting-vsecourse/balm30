import { useId } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { BarChart3, Loader2, Plus, X } from "lucide-react"
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { moodLabels, MOODS, type Mood } from "@/lib/mood"
import { cn } from "@/lib/utils"

import {
  POLL_MAX_OPTIONS,
  POLL_MIN_OPTIONS,
  POLL_OPTION_MAX_LENGTH,
  POLL_QUESTION_MAX_LENGTH,
} from "@/features/quack/api/quackSchemas"
import { useAddQuack } from "@/features/quack/hooks/useAddQuack"

// Mirrors the server-side DTO (MaxLength(280)) so the user is told before
// the request is made — the server still validates independently.
const MAX_LENGTH = 280

const NO_MOOD = "none"

const pollFormSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1, "Ask a question")
    .max(POLL_QUESTION_MAX_LENGTH, `Keep it under ${POLL_QUESTION_MAX_LENGTH} characters`),
  options: z
    .array(
      z.object({
        text: z
          .string()
          .trim()
          .min(1, "Fill in this answer")
          .max(POLL_OPTION_MAX_LENGTH, `Keep it under ${POLL_OPTION_MAX_LENGTH} characters`),
      }),
    )
    .min(POLL_MIN_OPTIONS)
    .max(POLL_MAX_OPTIONS),
})

const schema = z
  .object({
    text: z.string().trim().max(MAX_LENGTH, `Keep it under ${MAX_LENGTH} characters`),
    mood: z.enum([NO_MOOD, ...MOODS]),
    poll: pollFormSchema.nullable(),
  })
  .superRefine((values, ctx) => {
    if (!values.text && !values.poll) {
      ctx.addIssue({ code: "custom", path: ["text"], message: "Write something first" })
    }
    const seen = new Set<string>()
    values.poll?.options.forEach((option, index) => {
      const key = option.text.toLowerCase()
      if (key && seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["poll", "options", index, "text"],
          message: "Each answer must be different",
        })
      }
      seen.add(key)
    })
  })

type FormValues = z.infer<typeof schema>

const EMPTY_POLL: NonNullable<FormValues["poll"]> = {
  question: "",
  options: Array.from({ length: POLL_MIN_OPTIONS }, () => ({ text: "" })),
}

type QuackFormProps = { defaultMood?: Mood | null; className?: string }

export function QuackForm({ defaultMood, className }: QuackFormProps) {
  const addQuack = useAddQuack()
  const emptyValues: FormValues = { text: "", mood: defaultMood ?? NO_MOOD, poll: null }
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  const text = useWatch({ control: form.control, name: "text" })
  const length = text?.length ?? 0
  const poll = useWatch({ control: form.control, name: "poll" })

  const handleSubmit = (values: FormValues) => {
    addQuack.mutate(
      {
        text: values.text,
        mood: values.mood === NO_MOOD ? null : values.mood,
        poll: values.poll
          ? {
              question: values.poll.question,
              options: values.poll.options.map((option) => option.text),
            }
          : null,
      },
      { onSuccess: () => form.reset(emptyValues) },
    )
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("space-y-3", className)}
      >
        {addQuack.error ? (
          <Alert variant="destructive">
            <AlertDescription>{addQuack.error.message}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New quack</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Quack something..."
                  disabled={addQuack.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {poll ? (
          <PollFields
            control={form.control}
            isDisabled={addQuack.isPending}
            onRemove={() => {
              form.clearErrors("poll")
              form.setValue("poll", null)
            }}
          />
        ) : null}

        <div className="flex items-end justify-between gap-3">
          <div className="flex items-end gap-3">
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mood</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={addQuack.isPending}
                  >
                    <FormControl>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_MOOD}>No mood</SelectItem>
                      {MOODS.map((mood) => (
                        <SelectItem
                          key={mood}
                          value={mood}
                        >
                          <span aria-hidden="true">{moodLabels[mood].emoji}</span>
                          {moodLabels[mood].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {poll ? null : (
              <Button
                type="button"
                variant="outline"
                onClick={() => form.setValue("poll", EMPTY_POLL)}
                disabled={addQuack.isPending}
              >
                <BarChart3 className="size-4" />
                Add poll
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-sm",
                length > MAX_LENGTH ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {length}/{MAX_LENGTH}
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={addQuack.isPending}
            >
              {addQuack.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Quack
            </Button>
          </div>
        </div>
      </form>
    </Form>
  )
}

type PollFieldsProps = {
  control: Control<FormValues>
  isDisabled: boolean
  onRemove: () => void
}

function PollFields({ control, isDisabled, onRemove }: PollFieldsProps) {
  const options = useFieldArray({ control, name: "poll.options" })
  const canAddOption = options.fields.length < POLL_MAX_OPTIONS
  const canRemoveOption = options.fields.length > POLL_MIN_OPTIONS
  const headingId = useId()

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className="space-y-3 border-t border-border pt-3"
    >
      <div className="flex items-center justify-between gap-3">
        <span
          id={headingId}
          className="text-sm font-medium"
        >
          Poll
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={isDisabled}
        >
          Remove poll
        </Button>
      </div>

      <FormField
        control={control}
        name="poll.question"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Question</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Where do we go for lunch?"
                disabled={isDisabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {options.fields.map((option, index) => (
        <FormField
          key={option.id}
          control={control}
          name={`poll.options.${index}.text`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Answer {index + 1}</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input
                    disabled={isDisabled}
                    {...field}
                  />
                </FormControl>
                {canRemoveOption ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove answer ${index + 1}`}
                    onClick={() => options.remove(index)}
                    disabled={isDisabled}
                  >
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}

      {canAddOption ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => options.append({ text: "" })}
          disabled={isDisabled}
        >
          <Plus className="size-4" />
          Add answer
        </Button>
      ) : null}
    </div>
  )
}
