export const SITE_NAME = 'Geoportal Preventório'

export const SITE_TAGLINE =
  'Gerenciamento e visualização de camadas geoespaciais de mapeamento participativo'

export const SITE_DESCRIPTION =
  'Geoportal para organizar e disponibilizar camadas produzidas no mapeamento comunitário do Morro do Preventório, em Niterói (RJ).'

export const SITE_SUBTITLE = 'Gestão das camadas'

export const PARTNERS = {
  labis: {
    name: 'LABIS',
    fullName: 'Laboratório de Banco Comunitário e Inclusão Social',
  },
  banco: {
    name: 'Banco Comunitário do Preventório',
    url: 'https://bancopreventorio.org.br/',
  },
  urbe: {
    name: 'URBE Latam',
  },
} as const

export const THESIS = {
  title:
    'Desenvolvimento de um Geoportal para Gerenciamento e Visualização de Camadas Geoespaciais Produzidas em Projetos de Mapeamento Participativo',
  student: 'Lucas Tavares Da Silva Ferreira',
  studentEmail: 'lucas.tavares@poli.ufrj.br',
  advisor: 'Luiz Arthur Silva de Faria',
  university: 'Universidade Federal do Rio de Janeiro',
  school: 'Escola Politécnica',
  department: 'Departamento de Engenharia Eletrônica e de Computação',
  course: 'Engenharia de Computação e Informação',
} as const

export const ARTICLE = {
  title: 'Mapeando o (in)visível',
  citation:
    'FIGUEIREDO, A. da S. et al. Mapeando o (in)visível: um estudo de caso sobre o mapeamento comunitário do Morro do Preventório pelo URBE Latam. In: SOUTO, R. D. (org.). Estudos de caso em mapeamentos colaborativo e participativo. Rio de Janeiro: Editora IVIDES, 2025. p. 517-552.',
  isbn: '978-65-985676-2-0',
  doiUrl: 'https://doi.org/10.5281/zenodo.16809202',
  doiLabel: '10.5281/zenodo.16809202',
  portalPath: '/dashboard/artigo',
} as const

export const ROUTES = {
  dashboard: '/dashboard',
  geoportal: '/geoportal',
  sobre: '/sobre',
  origem: '/sobre#origem',
  artigo: '/dashboard/artigo',
} as const

export function geoportalLayerPath(layerId: string) {
  return `${ROUTES.geoportal}?layer=${encodeURIComponent(layerId)}`
}
