import { z } from 'zod'

export const formSchema = z.object({
  repo: z.string(),
  owner: z.string(),
})

export const requestSchema = z.object({
  diff: z.string(),
  id: z.string(),
  description: z.string(),
  labels: z.array(z.string()),
})
