import { useEffect, useId, useState } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const SEARCH_DELAY_MS = 300
const MAX_LENGTH = 280

type QuackSearchProps = {
  value: string
  onSearchChange: (search: string) => void
  className?: string
}

export function QuackSearch({ value, onSearchChange, className }: QuackSearchProps) {
  const inputId = useId()
  const [draft, setDraft] = useState(value)
  const [lastReportedSearch, setLastReportedSearch] = useState(value)
  const [previousValue, setPreviousValue] = useState(value)
  const isChangedFromOutside = value !== previousValue && value !== lastReportedSearch
  if (value !== previousValue) {
    setPreviousValue(value)
  }
  if (isChangedFromOutside) {
    setLastReportedSearch(value)
    setDraft(value)
  }

  useEffect(() => {
    const next = draft.trim()
    if (next === lastReportedSearch) return
    const timeout = setTimeout(() => {
      setLastReportedSearch(next)
      onSearchChange(next)
    }, SEARCH_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [draft, lastReportedSearch, onSearchChange])

  return (
    <div className={className}>
      <Label
        htmlFor={inputId}
        className="mb-2"
      >
        Search quacks
      </Label>
      <Input
        id={inputId}
        type="search"
        maxLength={MAX_LENGTH}
        placeholder="A word, a name or @username"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
    </div>
  )
}
