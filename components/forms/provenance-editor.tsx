'use client'

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  PARTICIPATION_LEVELS,
  PROVENANCE_HAZARDS,
  PROVENANCE_SOURCES,
  PROVENANCE_THEMES,
} from '@/lib/provenance'
import type { LayerProvenance } from '@/lib/supabase/types'

const NONE = '__none__'

type ProvenanceEditorProps = {
  value: LayerProvenance
  onChange: (next: LayerProvenance) => void
}

export function ProvenanceEditor({ value, onChange }: ProvenanceEditorProps) {
  const update = (patch: Partial<LayerProvenance>) =>
    onChange({ ...value, ...patch })

  return (
    <FieldSet className="rounded-lg border p-4">
      <FieldLegend variant="label">Proveniência</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="provenance-source">Fonte / método</FieldLabel>
          <Select
            value={value.source ?? NONE}
            onValueChange={next =>
              update({
                source:
                  next === NONE
                    ? undefined
                    : (next as LayerProvenance['source']),
              })
            }
          >
            <SelectTrigger id="provenance-source" className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={NONE}>Não informado</SelectItem>
                {PROVENANCE_SOURCES.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="provenance-detail">Detalhe da fonte</FieldLabel>
          <Input
            id="provenance-detail"
            value={value.sourceDetail ?? ''}
            onChange={event =>
              update({ sourceDetail: event.target.value || undefined })
            }
            placeholder="Ex: entrevistas Kobo, oficina na UMEI"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="provenance-period">Período de coleta</FieldLabel>
          <Input
            id="provenance-period"
            value={value.period ?? ''}
            onChange={event =>
              update({ period: event.target.value || undefined })
            }
            placeholder="Ex: abril de 2022"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="provenance-producers">Responsáveis</FieldLabel>
          <Input
            id="provenance-producers"
            value={value.producers ?? ''}
            onChange={event =>
              update({ producers: event.target.value || undefined })
            }
            placeholder="Ex: LABIS, BCP, URBE Latam"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="provenance-theme">Tema</FieldLabel>
          <Select
            value={value.theme ?? NONE}
            onValueChange={next =>
              update({
                theme:
                  next === NONE
                    ? undefined
                    : (next as LayerProvenance['theme']),
              })
            }
          >
            <SelectTrigger id="provenance-theme" className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={NONE}>Não informado</SelectItem>
                {PROVENANCE_THEMES.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="provenance-hazard">Perigo associado</FieldLabel>
          <Select
            value={value.hazard ?? NONE}
            onValueChange={next =>
              update({
                hazard:
                  next === NONE
                    ? undefined
                    : (next as LayerProvenance['hazard']),
              })
            }
          >
            <SelectTrigger id="provenance-hazard" className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={NONE}>Não informado</SelectItem>
                {PROVENANCE_HAZARDS.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="provenance-participation">
            Grau de participação
          </FieldLabel>
          <Select
            value={value.participationLevel ?? NONE}
            onValueChange={next =>
              update({
                participationLevel:
                  next === NONE
                    ? undefined
                    : (next as LayerProvenance['participationLevel']),
              })
            }
          >
            <SelectTrigger id="provenance-participation" className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={NONE}>Não informado</SelectItem>
                {PARTICIPATION_LEVELS.map(option => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor="provenance-license">Licença</FieldLabel>
          <Input
            id="provenance-license"
            value={value.license ?? ''}
            onChange={event =>
              update({ license: event.target.value || undefined })
            }
            placeholder="Ex: CC BY 4.0"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="provenance-restriction">
            Restrição de uso
          </FieldLabel>
          <Textarea
            id="provenance-restriction"
            value={value.usageRestriction ?? ''}
            onChange={event =>
              update({ usageRestriction: event.target.value || undefined })
            }
            placeholder="Ex: dados de domicílios apenas para pesquisa"
          />
        </Field>
      </FieldGroup>
    </FieldSet>
  )
}
