import { z } from 'zod'

export const formSchema = z.object({
  repo: z.string(),
  owner: z.string(),
})
