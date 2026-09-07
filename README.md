# Geoportal Preventório

Geoportal para gerenciamento e visualização de camadas do mapeamento participativo do Morro do Preventório (TCC — UFRJ / Escola Politécnica).

## Documentação

- [O que a plataforma faz](docs/plataforma.md)
- [Proposta de TCC (versão atualizada)](docs/proposta-tcc.md)
- [Autenticação Clerk](docs/clerk.md)

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Variáveis de ambiente: copie `.env.example`. Schema do banco: `supabase/migration.sql` (banco novo) ou `supabase/patch-tcc-features.sql` (banco que já existia).
