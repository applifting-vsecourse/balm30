import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { QUACK_SORTS, type QuackSort as QuackSortValue } from "@/features/quack/api/quackSchemas"

type QuackSortProps = {
  value: QuackSortValue
  onSortChange: (sort: QuackSortValue) => void
  className?: string
}

const isQuackSort = (value: string): value is QuackSortValue =>
  (QUACK_SORTS as readonly string[]).includes(value)

export function QuackSort({ value, onSortChange, className }: QuackSortProps) {
  return (
    <Tabs
      value={value}
      activationMode="manual"
      onValueChange={(next) => {
        if (isQuackSort(next)) onSortChange(next)
      }}
      className={className}
    >
      <TabsList aria-label="Sort quacks">
        <TabsTrigger value="newest">Newest</TabsTrigger>
        <TabsTrigger value="likes">Most liked</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
