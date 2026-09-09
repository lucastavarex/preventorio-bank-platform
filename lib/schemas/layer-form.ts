import { z } from 'zod'

export function createLayerFormSchema(options: { geojsonRequired: boolean }) {
  return z
    .object({
      title: z.string().trim().min(1, 'Informe o título.'),
      description: z.string(),
      notes: z.string(),
      groupIds: z.array(z.string()).min(1, 'Selecione ao menos um grupo.'),
      geojson: z.instanceof(File).nullable(),
      isPrivate: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (options.geojsonRequired && !data.geojson) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['geojson'],
          message: 'Envie um arquivo GeoJSON.',
        })
      }
    })
}

export type LayerFormValues = z.infer<ReturnType<typeof createLayerFormSchema>>
