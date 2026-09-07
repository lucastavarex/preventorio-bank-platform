# Proposta de projeto de graduação (versão atualizada)

**Universidade Federal do Rio de Janeiro**  
Escola Politécnica — Departamento de Engenharia Eletrônica e de Computação  
Curso: Engenharia de Computação e Informação

**Aluno:** Lucas Tavares Da Silva Ferreira (`lucas.tavares@poli.ufrj.br`)  
**Orientador:** Luiz Arthur Silva de Faria

Versão de trabalho, setembro de 2026. Substitui a redação de 29 de junho de 2026 no que diz respeito a materiais, objetivos específicos e delimitação fina. O problema de pesquisa e o estudo de caso permanecem os mesmos.

A memória técnica do que já está implementado está em [plataforma.md](plataforma.md).

---

## 1. Título

Desenvolvimento de um Geoportal para Gerenciamento e Visualização de Camadas Geoespaciais Produzidas em Projetos de Mapeamento Participativo

## 2. Ênfase

Computação

## 3. Tema

O presente trabalho versa sobre o desenvolvimento de um sistema de informação geográfica baseado na Web destinado ao gerenciamento e à visualização de camadas geoespaciais produzidas em projetos de mapeamento participativo [1].

Nos últimos anos, pesquisadores do Laboratório de Banco Comunitário e Inclusão Social (LABIS), em parceria com organizações comunitárias, produziram diversas camadas geográficas contendo informações relacionadas à vulnerabilidade socioambiental, infraestrutura urbana e riscos presentes no território do Preventório, localizado no município de Niterói (RJ). Essas informações foram construídas utilizando ferramentas de Sistemas de Informação Geográfica, como o QGIS, e atualmente encontram-se distribuídas em diferentes arquivos e projetos, dificultando sua organização, compartilhamento e reutilização.

O capítulo *Mapeando o (in)visível* [1] descreve ainda que a devolução dos mapas à comunidade — com acessibilidade fácil e aberta — é parte do método, e que mapas relevantes frequentemente nascem do **cruzamento** de camadas (por exemplo, percepção de risco e obras de contenção), não de um arquivo isolado. Cada mapa carrega origem, método e grau de participação distintos (OpenStreetMap, KoboToolbox, oficinas, QGIS).

Nesse contexto, o problema desta pesquisa consiste em investigar como desenvolver uma aplicação web que permita organizar e disponibilizar essas camadas de maneira estruturada, oferecendo mecanismos adequados para visualização e gerenciamento, **preservando metadados de proveniência** e facilitando seu uso por pesquisadores e demais partes interessadas.

## 4. Delimitação

O estudo será desenvolvido tomando como estudo de caso os mapas produzidos pelo LABIS em parceria com o Banco Comunitário do Preventório, utilizando camadas geoespaciais referentes ao território do Preventório, no município de Niterói, estado do Rio de Janeiro.

O escopo limita-se a um geoportal de **gerenciamento e visualização** das camadas existentes, com:

- ambiente administrativo (grupos, camadas, composições de mapa, estilo e metadados), com controle de acesso por papéis;
- ambiente público de consulta;
- base cartográfica OpenStreetMap (e imagem de satélite como apoio), em razão do mapeamento participativo previamente realizado na região.

**Entram no escopo** (além da visualização clássica de camadas):

- modelagem e exibição de metadados de proveniência (fonte, período, método, tema, perigo associado, grau de participação, licença e restrição de uso);
- simbologia graduada e **categórica** (valores únicos);
- mapas salvos como composições (conjunto de camadas, ordem, opacidade, basemap e enquadramento), compartilháveis por URL;
- exportação da vista atual em imagem (PNG), em apoio a oficinas e reuniões;
- popup configurável no identify (campos e, quando houver, URL de foto);
- controle de acesso efetivo aos arquivos GeoJSON privados (leitura por URL assinada, não por bucket público).

**Continuam fora do escopo:**

- edição online de geometrias;
- processamento geoespacial avançado (buffer, rotas, consultas espaciais no servidor, serviços OGC WMS/WFS);
- geração automática de novos mapas temáticos a partir de modelos;
- integração direta com o ambiente QGIS ou com ferramentas de coleta em campo (Kobo, Field Papers);
- dimensão temporal (time slider), uma vez que parte do acervo não possui datas confiáveis das intervenções [1].

A estruturação dos dados parte das camadas atualmente existentes, convertidas para GeoJSON durante o desenvolvimento. A pesquisa compreende levantamento de requisitos, modelagem, implementação, validação junto aos pesquisadores e documentação.

## 5. Justificativa

Projetos de mapeamento participativo [1] têm desempenhado papel importante na produção de informações territoriais relacionadas às condições sociais, ambientais e urbanas de comunidades. Essas iniciativas geram um conjunto expressivo de dados geoespaciais que podem subsidiar pesquisas, apoiar ações comunitárias e contribuir para planejamento e tomada de decisão.

Entretanto, frequentemente esses dados permanecem restritos aos ambientes utilizados durante sua produção, como projetos QGIS, dificultando compartilhamento, atualização e uso por diferentes públicos. A inexistência de uma plataforma centralizada também dificulta a incorporação de novas camadas, a preservação dos metadados — inclusive o contexto de coprodução, que distingue dados cidadãos de um shapefile genérico — e a disponibilização ao longo do tempo.

Nesse cenário, torna-se relevante uma solução baseada em tecnologias abertas que organize e disponibilize essas informações por interface de navegador, reduzindo barreiras de consulta. Espera-se que a plataforma amplie o aproveitamento dos resultados do mapeamento comunitário do Preventório, favorecendo pesquisadores, gestores e instituições parceiras, e atenda ao requisito metodológico de **devolver** os mapas de forma acessível [1].

## 6. Objetivo

O objetivo geral consiste em desenvolver um geoportal baseado em tecnologias *open source* para o gerenciamento e a visualização de camadas geoespaciais produzidas em projetos de mapeamento participativo [1].

Objetivos específicos:

1. Levantar requisitos funcionais e não funcionais junto aos pesquisadores envolvidos.
2. Modelar o armazenamento das camadas, de seus metadados de proveniência e das composições de mapa.
3. Converter as camadas atualmente em projetos QGIS para GeoJSON, preservando atributos e, na medida do possível, o contexto de produção.
4. Desenvolver o módulo interno de gestão (grupos, camadas, mapas) com RBAC (administrador e membro).
5. Desenvolver o geoportal de visualização: seleção e sobreposição de camadas, opacidade, legendas (incluindo classes categóricas), identify, comparação de duas camadas, ficha de proveniência, compartilhamento por URL e exportação da vista.
6. Garantir que camadas privadas não sejam acessíveis pelo armazenamento de arquivos, apenas pelo catálogo.
7. Validar a solução junto aos pesquisadores do LABIS.

## 7. Metodologia

A pesquisa será conduzida segundo o método hipotético-dedutivo, partindo das dificuldades de organização e disponibilização das camadas produzidas pelo projeto, formulando como hipótese que um geoportal pode facilitar seu gerenciamento, compartilhamento e utilização — inclusive como suporte à leitura crítica por sobreposição e à preservação do contexto de coprodução.

Do ponto de vista dos procedimentos técnicos, combinam-se documentação indireta e direta.

A documentação indireta compreende levantamento bibliográfico sobre SIG, geoportais, visualização geoespacial, WebGIS e padrões abertos de representação espacial (em especial GeoJSON), além da documentação das ferramentas utilizadas. Metadados seguem uma abordagem “ISO 19115 lite”: um conjunto reduzido de campos alinhado ao estudo de caso, sem pretender implementar o padrão completo.

A documentação direta realiza-se por reuniões com pesquisadores do LABIS, análise dos projetos QGIS e das camadas disponíveis, e definição do processo de migração para o ambiente web.

Com base nisso, modelam-se a arquitetura, o armazenamento e os mecanismos de disponibilização. O geoportal é implementado com tecnologias abertas para frontend, autenticação e persistência. Ao término, a aplicação é submetida a testes funcionais com as camadas do estudo de caso.

**Protocolo de validação (objetivo 7):** verificar, com os pesquisadores, se (a) as camadas do artigo são localizáveis e a ficha de proveniência está correta; (b) percepção e vulnerabilidade do mesmo perigo podem ser comparadas (swipe ou composição); (c) um pesquisador consegue compartilhar a vista por URL e/ou exportar PNG para reunião; (d) camada privada não vaza pelo storage.

## 8. Materiais

O desenvolvimento utiliza computador pessoal para implementação e testes. As camadas são fornecidas pelo LABIS e pelos pesquisadores do mapeamento participativo [1]. A base cartográfica é o OpenStreetMap, de uso livre; imagens de satélite Esri World Imagery são usadas como basemap opcional.

Tecnologias (todas de código aberto ou com plano gratuito acadêmico/comercial usual):

| Função | Tecnologia |
|--------|------------|
| Aplicação web | Next.js, React, TypeScript, Node.js |
| Visualização do mapa | MapLibre GL JS |
| Interface | shadcn/ui, Tailwind CSS |
| Autenticação e RBAC | Clerk (Organizations: `org:admin` / `org:member`) |
| Banco e arquivos | Supabase (PostgreSQL + Storage) |
| Formato das camadas | GeoJSON |
| Versão e editor | Git, GitHub, Visual Studio Code |
| Preparação das camadas | QGIS (somente conversão inicial, fora da aplicação) |

Não se utilizam Firebase nem Deck.GL. O armazenamento e a autenticação, citados de forma genérica na versão de junho de 2026, ficam assim especificados: **Clerk para identidade e papéis; Supabase para metadados e GeoJSON.**

## 9. Cronograma

1. Levantar e caracterizar os requisitos funcionais e não funcionais  
2. Modelar a estrutura de dados (grupos, camadas, proveniência, composições)  
3. Exportar as camadas do QGIS com metadados, de forma estruturada em GeoJSON  
4. Desenvolver o módulo interno de gestão com RBAC  
5. Desenvolver o frontend de exibição e interação (incluindo ficha, classificação categórica, mapas salvos, URL, PNG e popup)  
6. Validar a solução junto aos pesquisadores  
7. Escrita da monografia  

Itens 4 e 5 encontram-se em estágio avançado de implementação na data desta versão. O item 2 foi estendido para cobrir proveniência e composições. O item 6 deve seguir o protocolo da seção 7.

## 10. Trabalhos futuros (fora do cronograma do TCC)

Serviços OGC (WMS/WFS), tiles vetoriais, consultas espaciais em PostGIS, dimensão temporal, coleta em campo e interface própria de gestão de usuários. Esses temas podem ser mencionados na monografia como limitações conscientes, não como pendências do objetivo geral.

## 11. Referências bibliográficas

[1] FIGUEIREDO, A. da S. et al. Mapeando o (in)visível: um estudo de caso sobre o mapeamento comunitário do Morro do Preventório pelo URBE Latam. In: SOUTO, R. D. (org.). *Estudos de caso em mapeamentos colaborativo e participativo*. Rio de Janeiro: Editora IVIDES, 2025. p. 517-552. ISBN 978-65-985676-2-0. DOI: [https://doi.org/10.5281/zenodo.16809202](https://doi.org/10.5281/zenodo.16809202).

Sugestões para a monografia (não eram obrigatórias na proposta de junho, mas dialogam com o que o sistema passou a enfatizar):

- MAGUIRE, D. J.; LONGLEY, P. A. The emergence of geoportals and their role in spatial data infrastructures. *Computers, Environment and Urban Systems*, 2005.
- ISO 19115 / Dublin Core — metadados geoespaciais (como referência conceitual da ficha “lite”).
- IETF RFC 7946 — The GeoJSON Format.
- UNSD. *Citizen data* e graus de participação, citados em [1].

---

Rio de Janeiro, setembro de 2026

Lucas Tavares Da S. Ferreira  
Luiz Arthur Silva de Faria  
