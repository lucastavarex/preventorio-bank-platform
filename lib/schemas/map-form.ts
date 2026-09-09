import { z } from 'zod'

export const mapFormSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título.'),
  description: z.string(),
  notes: z.string(),
  basemapId: z.enum(['streets', 'satellite']),
  isPrivate: z.boolean(),
  layers: z
    .array(
      z.object({
        id: z.string().min(1),
        opacity: z.number().min(0).max(1).optional(),
      })
    )
    .min(1, 'Selecione pelo menos uma camada.'),
})

export type MapFormValues = z.infer<typeof mapFormSchema>
