import type { QuackSort as QuackSortValue } from "@/features/quack/api/quackSchemas"

type QuackSortProps = {
  value: QuackSortValue
  onSortChange: (sort: QuackSortValue) => void
}

export function QuackSort(_props: QuackSortProps) {
  return null
}
