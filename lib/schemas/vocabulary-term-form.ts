import { z } from 'zod'
import { slugify } from '@/lib/vocabularies'

export function createVocabularyTermFormSchema(options: { isCreate: boolean }) {
  return z
    .object({
      label: z.string().trim().min(1, 'Informe o rótulo do termo.'),
      slug: z.string(),
      description: z.string(),
      sortOrder: z.coerce.number().int(),
      isActive: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (!options.isCreate) return

      const source = data.slug.trim() || data.label
      if (slugify(source).length > 0) return

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: data.slug.trim() ? ['slug'] : ['label'],
        message:
          'Não foi possível gerar um identificador a partir do rótulo. Preencha o identificador manualmente.',
      })
    })
}

export type VocabularyTermFormValues = z.infer<
  ReturnType<typeof createVocabularyTermFormSchema>
>
