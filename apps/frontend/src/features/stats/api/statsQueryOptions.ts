import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api-client"

import { statsKeys } from "@/features/stats/api/statsKeys"
import { statsSchema } from "@/features/stats/api/statsSchemas"

export const statsQueryOptions = () =>
  queryOptions({
    queryKey: statsKeys.all(),
    queryFn: async () => statsSchema.parse(await api.get("stats").json()),
  })
