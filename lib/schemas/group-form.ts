import { z } from 'zod'

export const groupFormSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título.'),
  description: z.string(),
  notes: z.string(),
  isPrivate: z.boolean(),
})

export type GroupFormValues = z.infer<typeof groupFormSchema>
