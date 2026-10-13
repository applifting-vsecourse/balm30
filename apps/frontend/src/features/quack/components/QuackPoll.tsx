import type { Poll } from "@/features/quack/api/quackSchemas"

type QuackPollProps = { poll: Poll }

export function QuackPoll({ poll }: QuackPollProps) {
  return (
    <div className="mt-2 flex flex-col gap-2">
      <p className="text-sm font-medium">{poll.question}</p>
      <ul
        aria-label="Answers"
        className="flex flex-col gap-2"
      >
        {poll.options.map((option) => (
          <li
            key={option.id}
            className="rounded-md border border-border px-3 py-2 text-sm break-words"
          >
            {option.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
