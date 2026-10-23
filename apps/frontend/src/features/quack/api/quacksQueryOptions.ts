import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api-client"

import { quackKeys } from "@/features/quack/api/quackKeys"
import { quacksSchema, type Quack, type QuackScope } from "@/features/quack/api/quackSchemas"

const keepPreviousDataWithinScope =
  (scope: QuackScope) =>
  (previous: Quack[] | undefined, previousQuery?: { queryKey: readonly unknown[] }) => {
    const [, , previousFilter] = previousQuery?.queryKey ?? []
    const isSameScope =
      typeof previousFilter === "object" &&
      previousFilter !== null &&
      "scope" in previousFilter &&
      previousFilter.scope === scope
    return isSameScope ? previous : undefined
  }

export const quacksQueryOptions = (search = "", scope: QuackScope = "all") =>
  queryOptions({
    queryKey: quackKeys.list(search, scope),
    queryFn: async () =>
      quacksSchema.parse(
        await api
          .get("quacks", {
            searchParams: {
              ...(search ? { q: search } : {}),
              ...(scope === "mine" ? { scope } : {}),
            },
          })
          .json(),
      ),
    placeholderData: keepPreviousDataWithinScope(scope),
  })
