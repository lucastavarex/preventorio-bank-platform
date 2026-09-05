# Autenticação com Clerk

Documentação única da autenticação do portal interno **Banco do Preventório**. Cobre o modelo de acesso, a implementação no Next.js, a superfície de segurança, a operação no Dashboard e os gaps conhecidos.

Última revisão alinhada ao código em `proxy.ts`, `app/`, `components/` e `lib/` (SDK `@clerk/nextjs` ^7.8.4, Next.js 16).

---

## 1. Contexto

O portal é interno (~50 pessoas), **somente por convite**, com dois papéis de Organizations: `org:admin` e `org:member`. Há uma única organização (“Banco do preventório”). Não há cadastro público nem OAuth social. Visitantes sem sessão veem só grupos e layers públicos.

O Clerk é o IdP e o store de usuários. A aplicação **não** persiste usuários, sessões ou senhas no próprio banco. Firebase (se entrar depois) fica para dados do geoportal, não para login.

Instância em uso: app Clerk **Preventório - Geoportal**.

### Por que Clerk (e não Firebase Auth)

| Requisito | Clerk | Firebase Auth |
|-----------|-------|----------------|
| Convite apenas | Modo nativo no Dashboard | Admin SDK + trava extra no cadastro |
| Papéis `org:admin` / `org:member` | Organizations + `has({ role })` | Custom claims + Cloud Functions |
| Next.js 16 App Router | `clerkMiddleware` em `proxy.ts`, `auth()` nos Server Components | Integração menos direta |
| UI própria (shadcn) | Custom flows (`useSignIn` / `useSignUp`) | Também possível, mas convite/papéis exigem mais código |

---

## 2. Decisões de desenho

1. **UI própria, não componentes pré-construídos.** Não usamos `<SignIn />`, `<SignInButton />`, `<SignUpButton />`, `<UserButton />` nem `@clerk/ui`. O motivo é o cadastro só por convite: o `SignUpButton` abriria fluxo público. As telas são shadcn (`Field`, `Card`, `Button`) + hooks do Clerk.

2. **Protected-first.** Tudo que não está na lista pública exige sessão. O proxy é a primeira linha; o layout do dashboard reforça.

3. **Papel na Organization, não em `publicMetadata`.** Um único tenant (“Banco do preventório”). O cliente lê `orgRole` / `has({ role: 'org:admin' })` para UX; autorização de verdade acontece no servidor com `requireAdmin()` / `canReadPrivate()`. Sem `<OrganizationSwitcher />` e sem rotas `/orgs/[slug]`.

4. **Future API do SDK (Core 3).** `useSignIn()` / `useSignUp()` no formato atual (`password()`, `finalize()`, `resetPasswordEmailCode`, `errors`, `fetchStatus`). Não usar o padrão legado `isLoaded` + `setActive({ session })` + `prepareFirstFactor`.

5. **Next.js 16: `proxy.ts`, não `middleware.ts`.** O arquivo na raiz exporta o handler do Clerk. Não recriar `middleware.ts`.

---

## 3. Mapa de arquivos

| Arquivo | Função |
|---------|--------|
| `proxy.ts` | `clerkMiddleware`: rotas públicas, redirect de quem já está logado, `auth.protect()` no resto |
| `app/layout.tsx` | `<ClerkProvider>` + `<ActivateOrganization />`, `lang="pt-BR"` |
| `app/(public)/sign-in/page.tsx` | Login |
| `app/(public)/sign-in/tasks/page.tsx` | Session task: ativa a org única e segue ao dashboard |
| `app/(public)/forgot-password/page.tsx` | Redefinição de senha (`SignInForm mode="forgot"`) |
| `app/(public)/sign-up/page.tsx` | Aceite de convite (`__clerk_ticket`) |
| `app/(private)/dashboard/layout.tsx` | `await auth.protect()` + shell logado |
| `app/(private)/dashboard/geoportal/gerenciar-usuarios/page.tsx` | `requireAdmin()` (página ainda é stub) |
| `components/sign-in-form.tsx` | Login, MFA e-mail, forgot-password |
| `components/sign-up-form.tsx` | Ticket Clerk; sem ticket, bloqueia |
| `components/auth-page-shell.tsx` | Layout visual das telas de auth |
| `components/public-auth-controls.tsx` | Home: Entrar / Painel via `<Show>` |
| `components/nav-user.tsx` | Nome, e-mail, avatar, `signOut` |
| `components/app-sidebar.tsx` | Esconde Gestão se não for `org:admin` |
| `components/activate-organization.tsx` | `setActive` na única org se a sessão não tiver `orgId` |
| `lib/roles.ts` | Tipos e parsers **seguros para o client** (`admin` / `member`) |
| `lib/roles.server.ts` | `getRole()` / `canReadPrivate()` / `requireAdmin()` — **somente servidor** |
| `lib/clerk-organization.ts` | Escolhe a org e chama `setActive` |
| `lib/clerk-navigation.ts` | Redirect pós-auth (`decorateUrl` + `router.push`) |
| `lib/clerk-errors.ts` | Códigos Clerk → mensagens em português |
| `types/globals.d.ts` | Claim `user_role` do JWT (`org:admin` / `org:member`) |
| `.env.example` | Nomes das variáveis (sem segredos) |

Grupos de rotas `(public)` e `(private)` **não** aparecem na URL. Isolar código de servidor (`@clerk/nextjs/server`) de código de client (`@clerk/nextjs`) é obrigatório: importar `auth` / `currentUser` em `lib/roles.ts` quebra o bundle da sidebar.

---

## 4. Configuração

### 4.1 Variáveis de ambiente

Definidas em `.env.local` (gitignored). Modelo em `.env.example`:

| Variável | Onde vive | Uso |
|----------|-----------|-----|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Client + server | Identifica a instância (`pk_test_…` / `pk_live_…`) |
| `CLERK_SECRET_KEY` | **Somente servidor** | Backend API, verificação de sessão (`sk_test_…` / `sk_live_…`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Destino do `auth.protect()` quando não há sessão |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Destino dos convites (query `__clerk_ticket`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/dashboard` | Fallback pós-login |
| `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | `/dashboard` | Fallback pós-aceite do convite |
| `NEXT_PUBLIC_CLERK_ORGANIZATION_ID` | Client + server | Opcional. Trava o `setActive` no id da org “Banco do preventório” (`org_…`) |

Nunca colocar `CLERK_SECRET_KEY` em código client, `NEXT_PUBLIC_*` extra, ou commits. `.gitignore` cobre `.env*` com exceção de `.env.example`. A pasta `.clerk/` também é ignorada.

O `<ClerkProvider>` em `app/layout.tsx` **não** recebe a publishable key à mão: o SDK lê `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

### 4.2 Dashboard Clerk (obrigatório para o modelo fechar)

Estas opções **não estão no código**. Se o Dashboard estiver errado, o app não consegue compensar tudo.

1. **Access mode → Invite-only.** É o controle real contra cadastro aberto. A UI recusa `/sign-up` sem ticket, mas a Frontend API do Clerk ainda obedeceria ao modo da instância.
2. **Estratégia de login: e-mail + senha.** As telas não implementam OAuth/Apple/Google/Meta.
3. **URLs da aplicação** apontando para este app (`/sign-in`, `/sign-up`, redirect `/dashboard`).
4. **Organizations habilitadas**, membership **optional**, criação de organizações por usuários **desligada**. Org única: **Banco do preventório**, roles `org:admin` e `org:member`.
5. **Primeiro administrador** como membro `org:admin` dessa org (Dashboard → Organizations → Members), não via `publicMetadata`.
6. **Session token** com `user_role` vindo da org ativa (seção 4.4). Sem org ativa, `orgRole` fica vazio e o app trata como visitante (só conteúdo público).
7. **Convites** pela org (Members → Invite), com a URL de sign-up desta aplicação, para o ticket cair em `/sign-up?__clerk_ticket=…`.
8. **Integração Clerk + Supabase** (obrigatória para layers privados). Ver seção 4.4.

Checklist operacional: `npx clerk@latest doctor` no projeto.

### 4.4 Clerk como third-party auth no Supabase

Não use JWT template nem custom signing key. O template antigo do Clerk para Supabase está depreciado. O Supabase verifica o **token de sessão do Clerk** via JWKS.

**No Clerk**

1. Sessions → Customize session token. **Desligue** Custom signing key.
2. Claims do session token:

```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "user_role": "{{org.role}}"
}
```

3. Ative a integração oficial: [Connect with Supabase](https://dashboard.clerk.com/setup/supabase) → Activate. Copie o **Clerk domain** (ex.: `funky-bluejay-8133.clerk.accounts.dev`).

**No Supabase**

1. Authentication → Sign In / Providers → Add provider → Clerk
2. Cole o Clerk domain

`role` precisa ser `"authenticated"` (papel do Postgres). O papel do app (`org:admin` / `org:member`) vai em `user_role`, lido por `public.requesting_role()`. Sem org ativa, `{{org.role}}` fica vazio e o RLS trata como público. Policies atuais ainda aceitam os valores legados `admin` / `reader` até os JWTs antigos expirarem.

### 4.3 O que o `clerk init` não deve fazer

O CLI pode gerar rotas catch-all do hosted UI:

- `app/sign-in/[[...sign-in]]`
- `app/sign-up/[[...sign-up]]`

Elas **conflitam** com `app/(public)/sign-in` e `app/(public)/sign-up`. Não restaurar. Auth é só pelos formulários customizados.

---

## 5. Proteção de rotas

### 5.1 Proxy (`proxy.ts`) — Next.js 16

`clerkMiddleware` corre em `proxy.ts` (não em `middleware.ts`). O arquivo exporta `default` e `proxy`.

**Públicas** (sem sessão):

- `/`
- `/geoportal`
- `/sobre`
- `/sign-in`
- `/sign-up`
- `/forgot-password`

**Privadas:** qualquer outro path, incluindo `/dashboard` e futuros `/api/*` (quando existirem). Matcher também inclui `/__clerk/:path*` (rotas internas do SDK).

Comportamento:

```
request
  ├─ logado + /sign-in|/sign-up|/forgot-password  → redirect /dashboard
  ├─ path público                                  → segue
  └─ demais                                        → auth.protect()
                                                     (sem sessão → /sign-in)
```

O matching é prefixo (`/sign-in` e `/sign-in/...`). `/` é igualdade estrita, para não tornar o site inteiro público.

Há **segunda linha** no layout do dashboard: `await auth.protect()`. Quem chegar em `/dashboard/*` sem sessão é barrado mesmo se o matcher do proxy for alterado por engano.

### 5.2 O que o proxy *não* faz

O proxy **não** verifica papel. Um `org:member` autenticado acessa `/dashboard` e `/dashboard/geoportal/gerenciar-mapas`. Só `/dashboard/geoportal/gerenciar-usuarios` (e as rotas de CRUD) chamam `requireAdmin()`.

Novas rotas de admin precisam de `requireAdmin()` (ou equivalente) **na página/ação**, não só de esconder o link na sidebar.

Não existem Route Handlers (`app/api`) ainda. Quando existirem, o matcher já os cobre: sem sessão, `auth.protect()`. Autorização por papel continua sendo responsabilidade de cada handler.

---

## 6. Papéis e autorização

### 6.1 Modelo

```ts
type Role = 'admin' | 'member'
```

Fonte da verdade: role da organização ativa no Clerk (`org:admin` / `org:member`).

- **Leitura no client:** `useAuth().has({ role: 'org:admin' })` — só para UX (esconder menu / lápis de editar).
- **Leitura no servidor:** `auth().orgRole` via `getRole()`; `requireAdmin()` usa `has({ role: 'org:admin' })`.
- **Escrita:** Dashboard → Organizations → Members (ou Backend API). O browser **não** consegue alterar a role.

`parseRole()` aceita `org:admin` → `admin`, `org:member` → `member`, e o valor legado `reader` → `member`. Papel inválido ou ausente **não** vira admin (`requireAdmin` é fail-closed).

`DEFAULT_ROLE` (`member`) existe em `lib/roles.ts` só para exibição na página Conta. Usuário autenticado sem membership (ou sem org ativa) não lê conteúdo privado.

### 6.2 Onde o papel é aplicado

| Superfície | Tipo | Efeito |
|------------|------|--------|
| Sidebar “Gerenciar usuários” | Client (UX) | Item some se não for admin |
| Página gerenciar-usuarios | Server (`requireAdmin`) | Não-admin → `redirect('/dashboard')` |
| Proxy | Sessão apenas | Não distingue papéis |
| Gerenciar mapas / dashboard | Sessão apenas | Qualquer usuário logado |

Esconder o link **não** é autorização. A URL direta é o teste: `requireAdmin()` precisa continuar no servidor.

### 6.3 Tipos TypeScript

`types/globals.d.ts` tipa o claim `user_role` do JWT (`org:admin` | `org:member`) usado pelo Supabase. A role da sessão no app vem de `auth().orgRole`, não de `publicMetadata`.

---

## 7. Fluxos da aplicação

Todas as telas de auth compartilham `AuthPageShell` (card em duas colunas no desktop, painel da marca à direita). Copy em português. Rodapé: acesso somente por convite.

### 7.1 Login (`/sign-in`)

1. `signIn.password({ emailAddress, password })`.
2. Se `status === 'complete'` → `signIn.finalize({ navigate })` → `setActive` na org → `/dashboard` via `navigateAfterAuth`.
3. Se `needs_client_trust` ou `needs_second_factor` → envia código por e-mail (`signIn.mfa.sendEmailCode`) e pede o código (`verifyEmailCode`).
4. Link **Esqueci minha senha** → `/forgot-password` (navegação completa, não estado interno do form).

Não há botões sociais. Captcha (`#clerk-captcha`) **não** está no login; só no aceite de convite.

### 7.2 Esqueci a senha (`/forgot-password`)

Mesmo componente (`SignInForm` com `mode="forgot"`), rota própria (estado de reset no client + Fast Refresh era frágil no mesmo form).

1. `signIn.create({ identifier })`
2. `signIn.resetPasswordEmailCode.sendCode()`
3. `verifyCode({ code })` → `needs_new_password`
4. `submitPassword({ password, signOutOfOtherSessions: true })` + `finalize()`

`signOutOfOtherSessions: true` invalida outras sessões ao trocar a senha.

Usuário já logado que abre esta rota é mandado ao dashboard pelo proxy (não faz sentido resetar autenticado por essa tela).

### 7.3 Convite (`/sign-up`)

Sem `?__clerk_ticket=` a página **não** mostra formulário de cadastro: mensagem de convite + link para o login.

Com ticket:

1. `signUp.create({ strategy: 'ticket', ticket, firstName, lastName, password })`
2. Se `complete` → `signUp.finalize({ navigate })` → ativa a org (`setActive`) → `/dashboard`
3. Mount point `#clerk-captcha` (bot de sign-up)

O e-mail do convite é o da instância Clerk. Convites devem sair de **Organizations → Members → Invite** (com role), não de Users → Invite. A aplicação não envia o convite hoje (ver gaps).

### 7.4 Sessão no app logado

- `NavUser`: `useUser()` + `useClerk().signOut({ redirectUrl: '/sign-in' })`.
- Item **Conta** no dropdown **não faz nada** (sem `UserProfile` / página de conta).
- Home pública: `<Show when="signed-out">` → Entrar; `<Show when="signed-in">` → Painel.

### 7.5 Navegação pós-auth

`navigateAfterAuth` usa `decorateUrl` do Clerk (session tasks / handshake). URL absoluta → `window.location`; relativa → `router.push`. Tasks que não são `choose-organization` (MFA, reset de senha) ainda interrompem a navegação.

Depois do `finalize`, `activateSingleOrganization` chama `clerk.setActive({ organization })` mesmo quando a task é `choose-organization`, para member e admin irem direto ao dashboard. `<ActivateOrganization />` no root layout e `/sign-in/tasks` fazem o mesmo se o Clerk ainda mandar para a tela de escolher org. O picker (`<TaskChooseOrganization />`) só aparece se a pessoa não tiver membership. Sem `<OrganizationSwitcher />`.

---

## 8. Segurança

### 8.1 O que o Clerk cobre (e nós não reimplementamos)

- Hash e política de senha, detecção de senha vazada (`form_password_pwned`)
- Cookie de sessão httpOnly gerenciado pelo SDK
- Verificação do token no `clerkMiddleware`
- Convites com ticket de uso único
- Rate limit e bot protection na Frontend API (conforme plano/instância)
- MFA por e-mail **quando a instância exige** (o form já trata o status)

### 8.2 Controles nesta aplicação

| Controle | Status |
|----------|--------|
| Segredo só no servidor | Sim (`CLERK_SECRET_KEY` sem `NEXT_PUBLIC_`) |
| `.env*` fora do git | Sim |
| Protected-first no proxy | Sim |
| `auth.protect()` no layout do dashboard | Sim (defesa em profundidade) |
| Sign-up sem ticket recusado na UI | Sim |
| Invite-only no Dashboard | **Operacional** — não versionado |
| Papel não gravável pelo client | Sim (role da org) |
| Autorização admin no servidor | Sim (`requireAdmin` nas pages/actions de CRUD) |
| Reset invalida outras sessões | Sim |
| Mensagens de erro sem vazar stack | Sim (códigos mapeados; fallback `error.message`) |
| UI admin-only ≠ autorização | Sidebar é só UX |

### 8.3 Superfície de confiança do papel

`orgRole` e `has()` vêm da sessão (org ativa). Isso é aceitável para *mostrar* o menu. Um usuário não pode se promover pelo browser, mas **pode** chamar URLs. Toda ação privilegiada deve repetir `requireAdmin()` / `canReadPrivate()` no servidor, nunca confiar só no React.

Sem org ativa, `has({ role: 'org:admin' })` é falso e o geoportal cai no caminho público. `{{org.role}}` no session token alimenta o RLS do Supabase.

### 8.4 Enumeração de contas

No forgot-password, `signIn.create({ identifier })` pode devolver `form_identifier_not_found` (“Não encontramos uma conta com este e-mail.”). Isso permite confirmar se um e-mail existe. Mitigação possível: mensagem genérica no client **sem** esconder o erro real nos logs; o Clerk ainda responde distinto. Aceitável para um portal fechado de ~50 pessoas; não serve para um produto público.

No login, a cópia de senha errada é genérica (“E-mail ou senha incorretos.”).

### 8.5 Headers, CSP, captcha

Não há CSP, HSTS nem outros security headers em `next.config.ts`. Scripts/frames do Clerk passam no default do Next.

`#clerk-captcha` existe só no sign-up. Se a instância exigir captcha no sign-in, o login pode falhar com `captcha_invalid` até o mount point ser adicionado também em `SignInForm`.

### 8.6 Dependência do Dashboard

O código **não** força invite-only na Backend API. Se alguém mudar Access mode para público, um cliente que fale direto com a FAPI do Clerk poderia criar conta. Manter invite-only é parte do modelo de ameaça.

### 8.7 Sem webhooks, sem API própria, sem auditoria

Não há `app/api/webhooks/clerk`, nem verificação Svix, nem log de “quem convidou / quem mudou papel”. Eventos (user.created, session.created) existem só no Clerk. Para um portal pequeno isso é um gap operacional, não um bypass imediato — desde que o Dashboard permaneça restrito.

---

## 9. Operação

### 9.0 Checklist Organizations (obrigatório)

Estas opções **não estão no código**. Sem elas, `orgRole` fica `undefined` e todo mundo vê só o público.

1. Organizations habilitadas; org **Banco do preventório** com roles `admin` / `member` (`org:admin`, `org:member`).
2. Membership **optional** (não required).
3. Usuários **não** podem criar organizações.
4. Cada usuário existente é membro da org: quem era `publicMetadata.role = "admin"` → `org:admin`; demais → `org:member`.
5. Session token com `"user_role": "{{org.role}}"` (seção 4.4).
6. Convites daqui pra frente: Organizations → Members → Invite (com role).
7. Rodar `supabase/migration-org-roles.sql` no SQL Editor se o banco já existia.
8. Opcional: `NEXT_PUBLIC_CLERK_ORGANIZATION_ID=org_…` no `.env.local`.

O `publicMetadata.role` antigo pode ficar no usuário; o app não o lê mais.

### 9.1 Primeiro administrador

1. `npx clerk@latest auth login` (conta da instância).
2. Dashboard: Invite-only + e-mail/senha + Organizations (checklist 9.0).
3. Criar o usuário (convite da org ou create user + membership).
4. Na org, role `org:admin`.
5. Confirmar o session token (seção 4.4).
6. Entrar em `/sign-in`. “Gestão” deve aparecer na sidebar.

Usuário sem membership entra, mas não vê / não abre as telas admin e não lê layers privados.

### 9.2 Convidar alguém (hoje)

Só pelo **Clerk Dashboard → Organizations → Banco do preventório → Members → Invite**, com role `org:member` (ou `org:admin`). O e-mail leva a `/sign-up?__clerk_ticket=…`. O aceite já associa a pessoa à org.

Não há CRUD de usuários no app. A página “Gerenciar usuários” só aplica o guard.

### 9.3 Promover / rebaixar

Alterar a role do membro na org no Dashboard. Sessões já emitidas podem continuar com o claim antigo até o JWT renovar — em dúvida, revogar sessões ou pedir um novo login (`session.reload()`).

### 9.4 Produção

- Trocar keys `pk_live_` / `sk_live_`.
- Cadastrar o domínio de produção nas URLs da instância.
- Manter invite-only e a org única.
- Não commitar `.env.production` com segredos.

---

## 10. Gaps conhecidos

Ordenados pelo impacto no modelo atual.

| Gap | Risco / efeito | Notas |
|-----|----------------|-------|
| **Gerenciar usuários é stub** | Convites, papéis e revogação só no Dashboard | Próximo passo: convites de org via `clerkClient().organizations`, atrás de `requireAdmin()` |
| **Invite-only só no Dashboard** | Mudança na instância reabre cadastro na FAPI | Documentar como controle operacional; opcionalmente recusar sign-ups na API |
| **Session token sem `{{org.role}}`** | RLS do Supabase não vê a role da org | Configurar o claim; o app já lê `auth().orgRole` |
| **Usuário sem membership** | Entra no dashboard mas só vê público | Fail-closed; convites devem ser da org |
| **Admin só nas pages/actions atuais** | Fácil esquecer o guard em rotas/APIs novas | Considerar matcher de admin no proxy **ou** helper obrigatório em toda action |
| **Item Conta inerte** | Sem troca de senha / perfil no app | Reset existe em `/forgot-password` (deslogado); logado não tem UserProfile |
| **Sem webhooks** | App não reage a user.deleted, ban, etc. | Sessão some quando o Clerk invalida; dados locais futuros ficariam órfãos |
| **Captcha só no sign-up** | Login pode quebrar se o Dashboard exigir bot protection | Espelhar `#clerk-captcha` no form de login se isso for ligado |
| **Sem testes de auth** | Regressão em proxy, ticket, roles | Playwright/Clerk testing skill ainda não usados |
| **Sem headers de segurança** | CSP/HSTS não definidos | Relevante na hora de publicar |
| **Enumeração no forgot-password** | Confirma existência de e-mail | Aceitável no portal fechado |
| **Gerenciar mapas sem distinção de papel** | Qualquer logado acessa | `org:member` deve só visualizar |
| **Sem auditoria** | Não há trilha de ações admin | Necessário quando o CRUD de usuários existir |
| **Multi-org / SSO / billing** | Fora de escopo | Não usar `<OrganizationSwitcher />` nem Billing |
| **MFA não é obrigatório** | O form trata o status; a instância pode não exigir | Ativar no Dashboard se o risco pedir |

Fora de auth, mas relacionado: não há `app/api` nem persistência própria. Qualquer dado sensível futuro (mapas, PII) precisa de checagem de sessão **e** papel no servidor, não só no client.

---

## 11. Armadilhas para quem for alterar o código

1. **Não criar `middleware.ts`.** Next.js 16 usa `proxy.ts`.
2. **Não criar catch-alls `[[...sign-in]]` / `[[...sign-up]]`.**
3. **Não importar `@clerk/nextjs/server` em arquivos usados pelo client.** Papéis puros em `lib/roles.ts`; I/O em `lib/roles.server.ts`.
4. **Não usar `SignUpButton` / hosted SignUp.** Quebra o modelo de convite.
5. **Não tratar a sidebar como ACL.** Guard no servidor em toda rota privilegiada.
6. **Custom flow = Future API.** `signIn.password` + `finalize`, não `prepareFirstFactor`. `setActive({ organization })` é o jeito certo de ativar a org — não usar `setActive({ session })` do Core 2.
7. **`auth()` é async.** Sempre `await auth()`.
8. **Novas rotas públicas** precisam entrar em `PUBLIC_ROUTES` (e em `AUTH_REDIRECT_ROUTES` se forem telas de auth).
9. **Matcher `/__clerk/:path*`** deve permanecer.
10. **Convite = `strategy: 'ticket'`.** Cadastro por e-mail/senha aberto não deve ser adicionado.
11. **Não montar `<OrganizationSwitcher />`.** Uma org só; membership optional + `ActivateOrganization`.
12. **`/sign-in/tasks` não é redirect de quem já está logado.** O proxy deixa essa rota passar para ativar a org. Não tratar o prefixo `/sign-in` como redirect cego.

---

## 12. Diagrama

```
                    ┌─────────────────────────┐
                    │  Clerk (IdP + org)      │
                    │  invite-only, org roles │
                    └───────────┬─────────────┘
                                │ cookie de sessão / FAPI
┌───────────────┐   public     ┌▼──────────────┐    sessão     ┌─────────────────────┐
│ / /geoportal  │◄─────────────┤   proxy.ts    ├──────────────►│ /dashboard/*        │
│ /sobre        │              │ clerkMiddleware│               │ auth.protect()      │
│ /sign-in      │              └───────────────┘               │                     │
│ /sign-up      │                                              │ gerenciar-usuarios  │
│ /forgot-pass  │                                              │   requireAdmin()    │
└───────────────┘                                              └─────────────────────┘
        ▲                                                                ▲
        │ useSignIn / useSignUp                                          │ useAuth().has / orgRole
        │ (custom UI) + setActive(org)                                   │ ActivateOrganization
        └────────────────────────── ClerkProvider (root layout) ─────────┘
```

---

## 13. Referência rápida de APIs usadas

| API | Onde | Para quê |
|-----|------|----------|
| `clerkMiddleware` + `auth.protect()` | `proxy.ts`, dashboard layout | Sessão |
| `auth()` / `has({ role })` | `lib/roles.server.ts` | Papel no servidor (`orgRole`) |
| `useSignIn()` | `sign-in-form.tsx` | Login, MFA, reset |
| `useSignUp()` | `sign-up-form.tsx` | Ticket |
| `useAuth().has` | sidebar, geoportal | Papel (UX) |
| `useUser()` | NavUser | Perfil |
| `useClerk().setActive` | sign-in/up, ActivateOrganization | Org ativa |
| `useClerk().signOut` | NavUser | Logout |
| `<Show when="signed-in\|signed-out">` | home | CTA Entrar / Painel |
| `ClerkProvider` | root layout | Contexto |

Não usados (de propósito): `SignIn`, `SignUp`, `UserButton`, `OrganizationSwitcher`, webhooks, Billing.

---

## 14. Evolução prevista (quando for implementar)

Quando **Gerenciar usuários** deixar de ser stub, o caminho alinhado a este desenho é:

1. Server Actions ou Route Handlers com `await requireAdmin()` **antes** de qualquer `clerkClient()`.
2. Convites: `clerkClient().organizations.createOrganizationInvitation` com `redirectUrl` em `/sign-up` e `role: 'org:member'` (ou `org:admin`).
3. Listar / remover / atualizar membership pela Backend API.
4. Webhook `organizationMembership.*` / `user.deleted` se existir cópia local de dados.
5. Testes e2e de login, ticket sem/com query, member bloqueado em gerenciar-usuarios, admin passando.

Não misturar Firebase Auth nesse fluxo.
