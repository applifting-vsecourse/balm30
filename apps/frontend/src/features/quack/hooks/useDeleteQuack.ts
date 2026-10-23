import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteQuack } from "@/features/quack/api/deleteQuack"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Quack } from "@/features/quack/api/quackSchemas"

export function useDeleteQuack(quackId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: quackKeys.delete(quackId),
    mutationFn: () => deleteQuack(quackId),
    onSuccess: async () => {
      queryClient.setQueriesData<Quack[]>({ queryKey: quackKeys.lists() }, (quacks) =>
        quacks?.filter((quack) => quack.id !== quackId),
      )
      await queryClient.invalidateQueries({ queryKey: quackKeys.lists() })
    },
  })
}
