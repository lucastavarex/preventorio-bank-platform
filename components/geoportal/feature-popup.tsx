'use client'

import { isHttpUrl, isImageUrl } from '@/lib/popup-media'
import type { Layer, LayerPopupField } from '@/lib/supabase/types'

export function FeaturePopup({
  layer,
  properties,
}: {
  layer: Layer
  properties: Record<string, unknown>
}) {
  const config = layer.popup ?? {}
  const fields: LayerPopupField[] =
    config.fields && config.fields.length > 0
      ? config.fields
      : Object.keys(properties).map(key => ({ key }))
  const imageValue = config.imageField
    ? properties[config.imageField]
    : undefined
  const imageSrc =
    typeof imageValue === 'string' && isHttpUrl(imageValue)
      ? imageValue
      : undefined

  const rows = fields
    .filter(field => field.key !== config.imageField)
    .map(field => {
      const value = properties[field.key]
      if (value == null || value === '') return null
      return {
        key: field.key,
        label: field.label || field.key,
        value: String(value),
      }
    })
    .filter((row): row is { key: string; label: string; value: string } =>
      Boolean(row)
    )

  if (!imageSrc && rows.length === 0) {
    return <p className="text-muted-foreground">Sem atributos</p>
  }

  return (
    <div className="flex max-h-64 flex-col gap-2 overflow-auto text-xs">
      {imageSrc ? (
        // biome-ignore lint/performance/noImgElement: remote survey URLs are not in next/image
        <img
          src={imageSrc}
          alt=""
          className="max-h-36 w-full rounded-sm object-cover"
        />
      ) : null}
      {rows.length > 0 && (
        <table className="w-full">
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className="border-b last:border-0">
                <td className="pr-2 align-top font-medium">{row.label}</td>
                <td className="break-all">
                  {isHttpUrl(row.value) ? (
                    <a
                      href={row.value}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-4 hover:underline"
                    >
                      {isImageUrl(row.value) ? 'Abrir imagem' : row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
