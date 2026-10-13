import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
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
import { HTTPError } from "@/lib/api-client"
import { moodLabels, MOODS } from "@/lib/mood"
import { cn } from "@/lib/utils"

import {
  BIO_MAX_LENGTH,
  NAME_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
  type Profile,
} from "@/features/profile/api/profileSchemas"
import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile"

const NO_MOOD = "none"

const HTTP_CONFLICT = 409

const USERNAME_TAKEN_MESSAGE = "That username is already taken"

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(USERNAME_MIN_LENGTH, `Use at least ${USERNAME_MIN_LENGTH} characters`)
    .max(USERNAME_MAX_LENGTH, `Use at most ${USERNAME_MAX_LENGTH} characters`)
    .regex(USERNAME_PATTERN, "Use only letters, numbers, dots and underscores"),
  name: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(NAME_MAX_LENGTH, `Keep it under ${NAME_MAX_LENGTH} characters`),
  bio: z.string().trim().max(BIO_MAX_LENGTH, `Keep it under ${BIO_MAX_LENGTH} characters`),
  defaultMood: z.enum([NO_MOOD, ...MOODS]),
})

type FormValues = z.infer<typeof schema>

const toFormValues = (profile: Profile): FormValues => ({
  username: profile.username,
  name: profile.name,
  bio: profile.bio ?? "",
  defaultMood: profile.defaultMood ?? NO_MOOD,
})

const toProfile = (values: FormValues): Profile => ({
  username: values.username,
  name: values.name,
  bio: values.bio || null,
  defaultMood: values.defaultMood === NO_MOOD ? null : values.defaultMood,
})

const isConflict = (error: Error) =>
  error instanceof HTTPError && error.response.status === HTTP_CONFLICT

type ProfileFormProps = {
  profile: Profile
  onSaved?: () => void
}

export function ProfileForm({ profile, onSaved }: ProfileFormProps) {
  const updateProfile = useUpdateProfile()
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(profile),
  })

  const bio = useWatch({ control: form.control, name: "bio" })
  const bioLength = bio?.length ?? 0

  const handleSubmit = (values: FormValues) => {
    updateProfile.mutate(toProfile(values), {
      onSuccess: (saved) => {
        form.reset(toFormValues(saved))
        toast.success("Settings saved")
        onSaved?.()
      },
      onError: (error) => {
        if (isConflict(error)) {
          form.setError("username", { message: USERNAME_TAKEN_MESSAGE }, { shouldFocus: true })
        }
      },
    })
  }

  const handleDiscard = () => {
    updateProfile.reset()
    form.reset()
  }

  const isFailedOtherwise = updateProfile.error ? !isConflict(updateProfile.error) : false

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        {isFailedOtherwise && updateProfile.error ? (
          <Alert variant="destructive">
            <AlertDescription>{updateProfile.error.message}</AlertDescription>
          </Alert>
        ) : null}

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  disabled={updateProfile.isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {USERNAME_MIN_LENGTH}–{USERNAME_MAX_LENGTH} characters: letters, numbers, dots and
                underscores.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input
                  autoComplete="name"
                  disabled={updateProfile.isPending}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-baseline justify-between gap-3">
                <FormLabel>Bio</FormLabel>
                <span
                  className={cn(
                    "text-sm",
                    bioLength > BIO_MAX_LENGTH ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {bioLength}/{BIO_MAX_LENGTH}
                </span>
              </div>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="e.g. Professional bread critic. Opinions are my own."
                  disabled={updateProfile.isPending}
                  {...field}
                />
              </FormControl>
              <FormDescription>Optional.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="defaultMood"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default mood</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={updateProfile.isPending}
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
              <FormDescription>Preselected whenever you write a new quack.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={updateProfile.isPending}
          >
            {updateProfile.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Save changes
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscard}
            disabled={updateProfile.isPending}
          >
            Discard changes
          </Button>
        </div>
      </form>
    </Form>
  )
}
