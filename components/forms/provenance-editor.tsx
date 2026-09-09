'use client'

import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldDescription,
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
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useProvenanceVocabularies } from '@/hooks/use-vocabularies'
import { toTermSlugs } from '@/lib/provenance'
import type { LayerProvenance, ProvenanceTerm } from '@/lib/supabase/types'
import { VOCABULARIES, type VocabularyKind } from '@/lib/vocabularies'

const NONE = '__none__'

type ProvenanceEditorProps = {
  value: LayerProvenance
  onChange: (next: LayerProvenance) => void
}

/**
 * A retired term stays listed while it is the current selection, so editing an
 * old layer never drops its provenance silently.
 */
function availableTerms(terms: ProvenanceTerm[], selected: string[]) {
  return terms.filter(term => term.is_active || selected.includes(term.slug))
}

function EmptyVocabularyHint({ kind }: { kind: VocabularyKind }) {
  return (
    <FieldDescription>
      Nenhum termo cadastrado.{' '}
      <Link href={`/dashboard/vocabularios/${kind}`}>
        Gerenciar {VOCABULARIES[kind].title.toLowerCase()}
      </Link>
      .
    </FieldDescription>
  )
}

function TermSelect({
  kind,
  id,
  label,
  terms,
  value,
  onChange,
}: {
  kind: VocabularyKind
  id: string
  label: string
  terms: ProvenanceTerm[]
  value: string | undefined
  onChange: (next: string | undefined) => void
}) {
  const options = availableTerms(terms, value ? [value] : [])

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {options.length === 0 ? (
        <EmptyVocabularyHint kind={kind} />
      ) : (
        <Select
          value={value ?? NONE}
          onValueChange={next => onChange(next === NONE ? undefined : next)}
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={NONE}>Não informado</SelectItem>
              {options.map(term => (
                <SelectItem key={term.id} value={term.slug}>
                  {term.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </Field>
  )
}

export function ProvenanceEditor({ value, onChange }: ProvenanceEditorProps) {
  const vocabulariesQuery = useProvenanceVocabularies()

  const update = (patch: Partial<LayerProvenance>) =>
    onChange({ ...value, ...patch })

  const producers = toTermSlugs(value.producers)
  const toggleProducer = (slug: string, checked: boolean) => {
    const next = checked
      ? [...producers, slug]
      : producers.filter(current => current !== slug)
    update({ producers: next.length > 0 ? next : undefined })
  }

  if (vocabulariesQuery.isPending) {
    return (
      <FieldSet className="rounded-lg border p-4">
        <FieldLegend variant="label">Proveniência</FieldLegend>
        <Skeleton className="h-64 w-full" />
      </FieldSet>
    )
  }

  if (vocabulariesQuery.isError) {
    return (
      <FieldSet className="rounded-lg border p-4">
        <FieldLegend variant="label">Proveniência</FieldLegend>
        <FieldDescription>
          {vocabulariesQuery.error.message ||
            'Não foi possível carregar os vocabulários de proveniência.'}
        </FieldDescription>
      </FieldSet>
    )
  }

  const vocabularies = vocabulariesQuery.data
  const producerOptions = availableTerms(vocabularies.responsaveis, producers)

  return (
    <FieldSet className="rounded-lg border p-4">
      <FieldLegend variant="label">Proveniência</FieldLegend>
      <FieldGroup>
        <TermSelect
          kind="fontes"
          id="provenance-source"
          label="Fonte / método"
          terms={vocabularies.fontes}
          value={value.source}
          onChange={source => update({ source })}
        />

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
          <FieldLabel>Responsáveis</FieldLabel>
          <FieldDescription>
            Marque todas as instituições que produziram a camada.
          </FieldDescription>
          {producerOptions.length === 0 ? (
            <EmptyVocabularyHint kind="responsaveis" />
          ) : (
            <div className="flex flex-col gap-2 rounded-lg border p-3">
              {producerOptions.map(term => {
                const inputId = `provenance-producer-${term.id}`
                return (
                  <Field key={term.id} orientation="horizontal">
                    <Checkbox
                      id={inputId}
                      checked={producers.includes(term.slug)}
                      onCheckedChange={checked =>
                        toggleProducer(term.slug, checked === true)
                      }
                    />
                    <FieldLabel
                      htmlFor={inputId}
                      className="min-w-0 w-auto flex-1"
                    >
                      <span className="truncate">{term.label}</span>
                    </FieldLabel>
                  </Field>
                )
              })}
            </div>
          )}
        </Field>

        <TermSelect
          kind="temas"
          id="provenance-theme"
          label="Tema"
          terms={vocabularies.temas}
          value={value.theme}
          onChange={theme => update({ theme })}
        />

        <TermSelect
          kind="perigos"
          id="provenance-hazard"
          label="Perigo associado"
          terms={vocabularies.perigos}
          value={value.hazard}
          onChange={hazard => update({ hazard })}
        />

        <TermSelect
          kind="participacao"
          id="provenance-participation"
          label="Grau de participação"
          terms={vocabularies.participacao}
          value={value.participationLevel}
          onChange={participationLevel => update({ participationLevel })}
        />

        <TermSelect
          kind="licencas"
          id="provenance-license"
          label="Licença"
          terms={vocabularies.licencas}
          value={value.license}
          onChange={license => update({ license })}
        />

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
