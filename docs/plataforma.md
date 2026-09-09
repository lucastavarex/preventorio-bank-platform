# Documentação da plataforma

Geoportal Preventório — gerenciamento e visualização de camadas geoespaciais produzidas no mapeamento participativo do Morro do Preventório (Niterói, RJ).

Este texto descreve o que o sistema faz hoje, como os dados estão organizados e onde cada peça vive no código. Serve tanto para retomar o desenvolvimento quanto como memória técnica do TCC.

Documentos relacionados:

- [Proposta de projeto de graduação (atualizada)](proposta-tcc.md)
- [Autenticação com Clerk](clerk.md)
- Capítulo de estudo de caso: `public/docs/mapeando-o-invisivel.pdf`

---

## 1. O que o sistema é

Há dois ambientes:

| Ambiente | Rota | Quem acessa |
|----------|------|-------------|
| Geoportal público | `/geoportal` | Qualquer pessoa (só camadas e mapas públicos) |
| Portal interno | `/dashboard` | Sessão Clerk; escrita só `org:admin` |

O recorte territorial é o Morro do Preventório. A base cartográfica é o OpenStreetMap (e satélite Esri), em razão do mapeamento participativo já realizado na região.

O sistema **não** edita geometrias no navegador, **não** faz análise espacial avançada e **não** se integra ao QGIS. As camadas entram como GeoJSON exportado dos projetos existentes.

---

## 2. Stack

| Camada | Tecnologia |
|--------|------------|
| App | Next.js 16 (App Router), React 19, TypeScript |
| Mapa | MapLibre GL JS + react-map-gl |
| UI | shadcn/ui, Tailwind 4 |
| Auth | Clerk Organizations (`org:admin`, `org:member`) |
| Dados | Supabase Postgres (RLS) + Storage (bucket `geojson`, privado) |
| Cliente de dados | TanStack Query; Server Actions (não há API REST pública) |

Firebase e Deck.GL **não** são usados. A proposta original citava esses itens; a implementação consolidou Clerk + Supabase + MapLibre.

---

## 3. Modelo de dados

Schema em `supabase/migration.sql`. Bancos que já existiam antes das features de TCC precisam do patch `supabase/patch-tcc-features.sql`; bancos anteriores ao N:N camada↔grupo precisam de `supabase/patch-layer-groups.sql`.

### 3.1 Grupos (`groups`)

Pastas temáticas (ex.: vulnerabilidade, infraestrutura). Campos: título, descrição, anotações internas (`notes`), `is_private`, ordem.

Apagar um grupo **não** apaga suas camadas: só remove os vínculos (ver §3.3).

### 3.2 Camadas (`layers`)

Uma camada = metadados + estilo + um arquivo GeoJSON no Storage (`{id}.geojson`).

Campos principais:

- `title`, `description`, `notes` (notes **não** vão para o público)
- `is_private`
- `style` (JSON): tipo fill/line/circle, cores, opacidade, classificação
- `legend` (JSON)
- `provenance` (JSON): ficha de coprodução (ver §5)
- `popup` (JSON): quais atributos aparecem no clique (ver §9)
- `geojson_storage_path`, `bbox`

### 3.3 Camada em vários grupos (`layer_groups`)

O vínculo camada↔grupo é N:N: uma camada pode aparecer no catálogo de vários grupos ao mesmo tempo (ex.: um cruzamento que serve tanto a “infraestrutura” quanto a “percepção de risco”).

- Tabela de junção `layer_groups(layer_id, group_id)`, com PK composta e `ON DELETE CASCADE` nos dois lados
- A PK composta é o que faz o PostgREST reconhecer o N:N e manter o embedding `groups(*, layers(*))` do geoportal
- Toda camada precisa de **no mínimo um grupo**. Isso é garantido no formulário e nas actions `createLayer`/`updateLayer`, não por constraint do banco
- No geoportal, a camada aparece em cada grupo marcado; no mapa continua sendo uma só (o viewer indexa por `id`)

### 3.4 Mapas salvos (`maps`)

Uma composição publicável: conjunto de camadas + ordem + opacidades + basemap + câmera opcional. Não é uma nova geometria; é um “mapa de leitura” no sentido do artigo (sobreposição de camadas).

### 3.5 Privacidade

- Anônimo: só linhas com `is_private = false`
- Membro ou admin autenticado: vê também o privado
- Escrita (grupos, camadas, mapas, upload): só `org:admin`
- Arquivos GeoJSON **não** são públicos no bucket. A leitura passa por URL assinada gerada no servidor (`lib/actions/geojson.ts`), depois de conferir se a camada pode ser vista

---

## 4. Geoportal (viewer)

Arquivos centrais: `components/geoportal/geoportal-client.tsx`, sidebar, toolbar, `components/map/`.

### Visualização

- Mapa em tela cheia, centro no Preventório
- Basemap OSM ou satélite (persistido em `localStorage`)
- Catálogo por grupos, busca por nome, ligar/desligar camadas
- Várias camadas ao mesmo tempo, ordem por arraste, opacidade
- Zoom para a extensão (`bbox`) ao clicar no nome
- Legenda; nas camadas classificadas, clique na classe mostra/oculta
- Identify (clique na feição) com popup
- Comparação swipe quando há exatamente duas camadas visíveis
- Geolocalização, tela cheia, zoom +/−
- Download do GeoJSON (pelo mesmo canal autenticado/assinado)

### URL compartilhável

Precedência: `map` > `layers` > `layer`.

| Parâmetro | Significado |
|-----------|-------------|
| `map` | UUID de um mapa salvo |
| `layer` | Liga e foca uma camada (deep link antigo) |
| `layers` | IDs na ordem baixo → cima, separados por vírgula |
| `o` | Opacidades 0–100, na mesma ordem de `layers` (omitido se todas forem 100) |
| `b` | `streets` ou `satellite` |
| `lng`, `lat`, `z` | Câmera |

Exemplos:

- `/geoportal?layer=<uuid>`
- `/geoportal?map=<uuid>`
- `/geoportal?layers=id1,id2&o=100,60&b=satellite`

A vista atual é escrita na URL com `history.replaceState` (sem recarregar a página).

### Toolbar extra (além de zoom / GPS / comparar)

- **Exportar PNG** da vista atual (`preserveDrawingBuffer` no MapLibre)
- **Salvar como mapa** (só admin): abre `/dashboard/maps/new` já preenchido com as camadas visíveis

---

## 5. Metadados de proveniência + ficha

Objetivo acadêmico: a camada não é só um arquivo no mapa; carrega o contexto de coprodução do URBE Latam / LABIS (fonte, método, grau de participação). Vocabulário alinhado ao capítulo *Mapeando o (in)visível*.

Campos em `layers.provenance` (`lib/provenance.ts`, `lib/supabase/types.ts`):

| Campo | Valores |
|-------|---------|
| `source` | `osm`, `kobo`, `workshop`, `qgis`, `other` |
| `sourceDetail` | texto (ex.: entrevistas Kobo, oficina na UMEI) |
| `period` | texto (ex.: abril de 2022) |
| `producers` | texto (LABIS, BCP, URBE Latam, AMMP…) |
| `theme` | vulnerabilidade física, percepção de risco, infraestrutura, cruzamento, outro |
| `hazard` | deslizamento de terra, de rocha, eventos hídricos, não se aplica |
| `participationLevel` | baixo, médio, alto |
| `license` | texto |
| `usageRestriction` | texto (ex.: dados de domicílio só para pesquisa) |

- **Admin:** editor no formulário da camada (`components/forms/provenance-editor.tsx`)
- **Público:** ícone de informação na lista de camadas abre a ficha (`components/geoportal/layer-fact-sheet.tsx`). `notes` não entra

---

## 6. Classificação cartográfica

`lib/classify.ts`, editor em `components/forms/classify-editor.tsx`.

1. **Cor única** — estilo fill/line/circle
2. **Graduada** — intervalos iguais em campo numérico (já existia)
3. **Categórica** — um valor = uma classe (ex.: postes ruim / regular)

Camadas graduadas antigas (sem `mode`) continuam válidas: ausência de `mode` = graduada.

A legenda interativa e o filtro de classes no mapa valem para os dois modos.

---

## 7. Mapas salvos (composições)

No artigo, mapas relevantes muitas vezes são **sobreposições** (percepção vs obras da Defesa Civil; postes sobre o mapa-base), não uma camada isolada.

- Admin: `/dashboard/maps` (CRUD). O stub `/dashboard/geoportal/gerenciar-mapas` redireciona para cá
- Um mapa guarda: título, descrição, privacidade, basemap, lista `{ id, opacity }` na ordem, câmera opcional
- Público: `/geoportal?map=<uuid>`
- Actions: `lib/actions/maps.ts`

---

## 8. Storage privado (signed URLs)

Antes o bucket `geojson` era público: camada `is_private` sumia do catálogo, mas o arquivo continuava acessível pela URL.

Agora:

1. Bucket privado (`public = false`)
2. Policy de leitura pública do Storage removida
3. `getLayerGeojsonAccess(layerId)` gera URL assinada (~1 h) se a camada for pública **ou** o usuário puder ler privado
4. O viewer, o preview do admin e o download usam esse canal (`hooks/use-geojson.ts`)

Arquivo: `lib/actions/geojson.ts`.

---

## 9. Popup configurável

Identify padrão: todos os atributos da feição.

No admin (`components/forms/popup-editor.tsx`) dá para:

- marcar quais campos aparecem e em que rótulo
- indicar um campo de imagem (URL `http(s)`, típico de foto do Kobo)

Se nenhum campo for marcado, o popup mostra tudo (compatível com camadas antigas).

---

## 10. Portal interno (admin)

| Rota | Função |
|------|--------|
| `/dashboard` | Visão geral |
| `/dashboard/groups` | CRUD de grupos |
| `/dashboard/layers` | CRUD de camadas (upload GeoJSON, estilo, classificação, proveniência, popup) |
| `/dashboard/maps` | CRUD de composições |
| `/dashboard/artigo` | PDF do capítulo |
| `/dashboard/conta` | Conta Clerk |
| `/sobre` | Página pública do TCC / origem das camadas |

Papéis: ver `docs/clerk.md`. Convite apenas; sem cadastro aberto.

A gestão de usuários no Clerk Dashboard permanece fora do app (`/dashboard/geoportal/gerenciar-usuarios` ainda é placeholder).

---

## 11. Mapa de arquivos (orientação)

```
lib/supabase/types.ts          tipos (style, provenance, popup, maps)
lib/classify.ts                paletas, graduada, categórica, expressões MapLibre
lib/provenance.ts              vocabulário da ficha
lib/geoportal-url.ts           parse/serialize da query string
lib/actions/layers.ts          CRUD camadas + catálogo do geoportal
lib/actions/maps.ts            CRUD mapas + leitura no viewer
lib/actions/geojson.ts         URL assinada
supabase/migration.sql         schema completo (banco novo)
supabase/patch-tcc-features.sql  patch (banco que já existia)
supabase/patch-layer-groups.sql  patch (camada em vários grupos)
```

---

## 12. Como aplicar o schema

**Banco novo:** rode `supabase/migration.sql` no SQL Editor.

**Banco que já tinha grupos/camadas:** rode `supabase/patch-tcc-features.sql` e depois `supabase/patch-layer-groups.sql`. Sem o primeiro, listar camadas ou salvar layer falha (faltam `provenance`, `popup` e a tabela `maps`), e o GeoJSON continua publicamente listável. Sem o segundo, o app quebra ao ler grupos de uma camada — o patch cria `layer_groups`, copia os vínculos de `layers.group_id` e só então derruba a coluna.

Depois dos patches, recarregue o app.

---

## 13. Fora do escopo (de propósito)

Alinhado à delimitação do TCC:

- Edição online de geometrias
- Buffer, medição, consulta espacial, WMS/WFS
- Tiles vetoriais / PostGIS como motor de consulta
- Integração QGIS / coleta em campo (Kobo)
- Time slider
- UI completa de usuários (fica no Clerk)

Possíveis trabalhos futuros: serviços OGC, tiles, dimensão temporal, coleta em campo.

---

## 14. Checklist rápido de validação

1. Camada com ficha de proveniência aparece no geoportal público; `notes` não aparece
2. Camada categórica pinta e filtra na legenda; camada graduada antiga não quebra
3. Anônimo não baixa GeoJSON de camada privada; membro autenticado carrega
4. `/geoportal?map=` restaura overlay; copiar URL com `layers=` reproduz a vista
5. PNG baixa a tela atual; popup mostra só os campos escolhidos (e foto, se houver URL)
