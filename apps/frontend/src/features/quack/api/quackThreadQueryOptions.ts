import { queryOptions } from "@tanstack/react-query"

import { api } from "@/lib/api-client"

import { quackKeys } from "@/features/quack/api/quackKeys"
import { quackThreadSchema } from "@/features/quack/api/quackSchemas"

export const quackThreadQueryOptions = (quackId: string) =>
  queryOptions({
    queryKey: quackKeys.thread(quackId),
    queryFn: async () => quackThreadSchema.parse(await api.get(`quacks/${quackId}`).json()),
  })
