# Autenticação com Clerk

Documentação única da autenticação do portal interno **Banco do Preventório**. Cobre o modelo de acesso, a implementação no Next.js, a superfície de segurança, a operação no Dashboard e os gaps conhecidos.

Última revisão alinhada ao código em `proxy.ts`, `app/`, `components/` e `lib/` (SDK `@clerk/nextjs` ^7.8.4, Next.js 16).

---

## 1. Contexto

O portal é interno (~50 pessoas), **somente por convite**, com dois papéis: `admin` e `reader`. Não há cadastro público, OAuth social nem Organizations do Clerk.

O Clerk é o IdP e o store de usuários. A aplicação **não** persiste usuários, sessões ou senhas no próprio banco. Firebase (se entrar depois) fica para dados do geoportal, não para login.

Instância em uso: app Clerk **Preventório - Geoportal**.

### Por que Clerk (e não Firebase Auth)

| Requisito | Clerk | Firebase Auth |
|-----------|-------|----------------|
| Convite apenas | Modo nativo no Dashboard | Admin SDK + trava extra no cadastro |
| Papéis `admin` / `reader` | `publicMetadata` + JWT | Custom claims + Cloud Functions |
| Next.js 16 App Router | `clerkMiddleware` em `proxy.ts`, `auth()` nos Server Components | Integração menos direta |
| UI própria (shadcn) | Custom flows (`useSignIn` / `useSignUp`) | Também possível, mas convite/papéis exigem mais código |

---

## 2. Decisões de desenho

1. **UI própria, não componentes pré-construídos.** Não usamos `<SignIn />`, `<SignInButton />`, `<SignUpButton />`, `<UserButton />` nem `@clerk/ui`. O motivo é o cadastro só por convite: o `SignUpButton` abriria fluxo público. As telas são shadcn (`Field`, `Card`, `Button`) + hooks do Clerk.

2. **Protected-first.** Tudo que não está na lista pública exige sessão. O proxy é a primeira linha; o layout do dashboard reforça.

3. **Papel no `publicMetadata`, não em Organizations.** Um único “tenant”. O cliente pode *ler* o papel (sidebar); só o Backend/Dashboard pode *escrever*. Autorização de verdade acontece no servidor.

4. **Future API do SDK (Core 3).** `useSignIn()` / `useSignUp()` no formato atual (`password()`, `finalize()`, `resetPasswordEmailCode`, `errors`, `fetchStatus`). Não usar o padrão legado `isLoaded` + `setActive({ session })` + `prepareFirstFactor`.

5. **Next.js 16: `proxy.ts`, não `middleware.ts`.** O arquivo na raiz exporta o handler do Clerk. Não recriar `middleware.ts`.

---

## 3. Mapa de arquivos

| Arquivo | Função |
|---------|--------|
| `proxy.ts` | `clerkMiddleware`: rotas públicas, redirect de quem já está logado, `auth.protect()` no resto |
| `app/layout.tsx` | `<ClerkProvider>` em volta da árvore, `lang="pt-BR"` |
| `app/(public)/sign-in/page.tsx` | Login |
| `app/(public)/forgot-password/page.tsx` | Redefinição de senha (`SignInForm mode="forgot"`) |
| `app/(public)/sign-up/page.tsx` | Aceite de convite (`__clerk_ticket`) |
| `app/(private)/dashboard/layout.tsx` | `await auth.protect()` + shell logado |
| `app/(private)/dashboard/geoportal/gerenciar-usuarios/page.tsx` | `requireAdmin()` (página ainda é stub) |
| `components/sign-in-form.tsx` | Login, MFA e-mail, forgot-password |
| `components/sign-up-form.tsx` | Ticket Clerk; sem ticket, bloqueia |
| `components/auth-page-shell.tsx` | Layout visual das telas de auth |
| `components/public-auth-controls.tsx` | Home: Entrar / Painel via `<Show>` |
| `components/nav-user.tsx` | Nome, e-mail, avatar, `signOut` |
| `components/app-sidebar.tsx` | Esconde “Gerenciar usuários” se não for admin |
| `lib/roles.ts` | Tipos e parsers **seguros para o client** |
| `lib/roles.server.ts` | `getRole()` / `requireAdmin()` — **somente servidor** |
| `lib/clerk-navigation.ts` | Redirect pós-auth (`decorateUrl` + `router.push`) |
| `lib/clerk-errors.ts` | Códigos Clerk → mensagens em português |
| `types/globals.d.ts` | `CustomJwtSessionClaims` e `UserPublicMetadata` |
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

Nunca colocar `CLERK_SECRET_KEY` em código client, `NEXT_PUBLIC_*` extra, ou commits. `.gitignore` cobre `.env*` com exceção de `.env.example`. A pasta `.clerk/` também é ignorada.

O `<ClerkProvider>` em `app/layout.tsx` **não** recebe a publishable key à mão: o SDK lê `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

### 4.2 Dashboard Clerk (obrigatório para o modelo fechar)

Estas opções **não estão no código**. Se o Dashboard estiver errado, o app não consegue compensar tudo.

1. **Access mode → Invite-only.** É o controle real contra cadastro aberto. A UI recusa `/sign-up` sem ticket, mas a Frontend API do Clerk ainda obedeceria ao modo da instância.
2. **Estratégia de login: e-mail + senha.** As telas não implementam OAuth/Apple/Google/Meta.
3. **URLs da aplicação** apontando para este app (`/sign-in`, `/sign-up`, redirect `/dashboard`).
4. **Primeiro usuário** com `publicMetadata.role = "admin"` (JSON no perfil do usuário).
5. **(Recomendado)** JWT template da sessão com claim extra:

   ```json
   {
     "metadata": "{{user.public_metadata}}"
   }
   ```

   Sem isso, `getRole()` cai no fallback `currentUser()` (chamada à Backend API). Com o claim, o papel vem no JWT já verificado pelo middleware.

6. **Convites** devem usar a URL de sign-up desta aplicação, para o ticket cair em `/sign-up?__clerk_ticket=…`.

Checklist operacional: `npx clerk@latest doctor` no projeto.

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

O proxy **não** verifica papel. Um `reader` autenticado acessa `/dashboard` e `/dashboard/geoportal/gerenciar-mapas`. Só `/dashboard/geoportal/gerenciar-usuarios` chama `requireAdmin()`.

Novas rotas de admin precisam de `requireAdmin()` (ou equivalente) **na página/ação**, não só de esconder o link na sidebar.

Não existem Route Handlers (`app/api`) ainda. Quando existirem, o matcher já os cobre: sem sessão, `auth.protect()`. Autorização por papel continua sendo responsabilidade de cada handler.

---

## 6. Papéis e autorização

### 6.1 Modelo

```ts
type Role = 'admin' | 'reader'
```

Fonte da verdade: `user.publicMetadata.role` no Clerk.

- **Leitura no client:** `user.publicMetadata.role` via `useUser()` — só para UX (esconder menu).
- **Leitura no servidor:** JWT (`sessionClaims.metadata.role`) e, se ausente, `currentUser().publicMetadata.role`.
- **Escrita:** Dashboard ou Backend API (`clerkClient`). O browser **não** consegue alterar `publicMetadata`.

`parseRole()` ignora qualquer valor que não seja `admin` | `reader`. Papel inválido ou ausente **não** vira admin (`isAdminRole` é fail-closed).

`DEFAULT_ROLE` (`reader`) existe em `lib/roles.ts` mas **não é aplicado automaticamente**. Usuário sem metadata entra no dashboard como não-admin. Convites devem definir `role` no metadata (no convite ou depois, no usuário).

### 6.2 Onde o papel é aplicado

| Superfície | Tipo | Efeito |
|------------|------|--------|
| Sidebar “Gerenciar usuários” | Client (UX) | Item some se não for admin |
| Página gerenciar-usuarios | Server (`requireAdmin`) | Não-admin → `redirect('/dashboard')` |
| Proxy | Sessão apenas | Não distingue papéis |
| Gerenciar mapas / dashboard | Sessão apenas | Qualquer usuário logado |

Esconder o link **não** é autorização. A URL direta é o teste: `requireAdmin()` precisa continuar no servidor.

### 6.3 Tipos TypeScript

`types/globals.d.ts` estende as interfaces globais do Clerk (`CustomJwtSessionClaims`, `UserPublicMetadata`). Assim `auth().sessionClaims` e `user.publicMetadata.role` são tipados. Manter este arquivo alinhado se o conjunto de papéis crescer.

---

## 7. Fluxos da aplicação

Todas as telas de auth compartilham `AuthPageShell` (card em duas colunas no desktop, painel da marca à direita). Copy em português. Rodapé: acesso somente por convite.

### 7.1 Login (`/sign-in`)

1. `signIn.password({ emailAddress, password })`.
2. Se `status === 'complete'` → `signIn.finalize({ navigate })` → `/dashboard` via `navigateAfterAuth`.
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
2. Se `complete` → `signUp.finalize({ navigate })` → `/dashboard`
3. Mount point `#clerk-captcha` (bot de sign-up)

O e-mail do convite é o da instância Clerk. A aplicação não envia o convite hoje (ver gaps).

### 7.4 Sessão no app logado

- `NavUser`: `useUser()` + `useClerk().signOut({ redirectUrl: '/sign-in' })`.
- Item **Conta** no dropdown **não faz nada** (sem `UserProfile` / página de conta).
- Home pública: `<Show when="signed-out">` → Entrar; `<Show when="signed-in">` → Painel.

### 7.5 Navegação pós-auth

`navigateAfterAuth` usa `decorateUrl` do Clerk (session tasks / handshake). URL absoluta → `window.location`; relativa → `router.push`. Se `session.currentTask` existir, o `finalize` não navega (o Clerk ainda tem um passo pendente).

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
| Papel não gravável pelo client | Sim (`publicMetadata`) |
| Autorização admin no servidor | Sim, **só** em gerenciar-usuarios |
| Reset invalida outras sessões | Sim |
| Mensagens de erro sem vazar stack | Sim (códigos mapeados; fallback `error.message`) |
| UI admin-only ≠ autorização | Sidebar é só UX |

### 8.3 Superfície de confiança do papel

`publicMetadata` é visível no client. Isso é aceitável para *mostrar* o menu. Um usuário não pode se promover pelo browser, mas **pode** chamar URLs. Toda ação privilegiada futura (convites, mudança de papel, APIs) deve repetir `requireAdmin()` / `getRole()` no servidor, nunca confiar só no React.

O JWT com `metadata` evita round-trip e mantém o papel na sessão já validada. Sem o template, `currentUser()` busca o usuário na Backend API — correto, porém mais lento e dependente de rede.

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

### 9.1 Primeiro administrador

1. `npx clerk@latest auth login` (conta da instância).
2. Dashboard: Invite-only + e-mail/senha.
3. Criar o usuário (convite ou create user).
4. Em **Users → [usuário] → Metadata → public**: `{ "role": "admin" }`.
5. Confirmar o JWT template (seção 4.2) se quiser o papel no token.
6. Entrar em `/sign-in`. “Gerenciar usuários” deve aparecer.

Usuário sem `role` entra, mas não vê / não abre a tela admin.

### 9.2 Convidar alguém (hoje)

Só pelo **Clerk Dashboard → Users → Invite**. O e-mail leva a `/sign-up?__clerk_ticket=…`. Depois do aceite, definir `publicMetadata.role` (`reader` na maioria dos casos). O ideal é mandar o metadata já no convite (API/Dashboard), para não ficar janela sem papel.

Não há CRUD de usuários no app. A página “Gerenciar usuários” só aplica o guard.

### 9.3 Promover / rebaixar

Alterar `publicMetadata.role` no Dashboard. Sessões já emitidas podem continuar com o claim antigo até o JWT renovar, se o template estiver ativo — em dúvida, revogar sessões no Dashboard.

### 9.4 Produção

- Trocar keys `pk_live_` / `sk_live_`.
- Cadastrar o domínio de produção nas URLs da instância.
- Manter invite-only.
- Não commitar `.env.production` com segredos.

---

## 10. Gaps conhecidos

Ordenados pelo impacto no modelo atual.

| Gap | Risco / efeito | Notas |
|-----|----------------|-------|
| **Gerenciar usuários é stub** | Convites, papéis e revogação só no Dashboard | Próximo passo natural: `clerkClient().invitations` + `users.updateUserMetadata`, atrás de `requireAdmin()` |
| **Invite-only só no Dashboard** | Mudança na instância reabre cadastro na FAPI | Documentar como controle operacional; opcionalmente recusar sign-ups na API |
| **Papel não entra no JWT por padrão** | Extra `currentUser()`; atraso se o claim for esquecido | Configurar o template; o código já tem fallback |
| **`DEFAULT_ROLE` não é aplicado** | Usuário sem metadata não é `reader` explícito | Fail-closed para admin; convites devem setar `role` |
| **Admin só numa página** | Fácil esquecer o guard em rotas/APIs novas | Considerar matcher de admin no proxy **ou** helper obrigatório em toda action |
| **Item Conta inerte** | Sem troca de senha / perfil no app | Reset existe em `/forgot-password` (deslogado); logado não tem UserProfile |
| **Sem webhooks** | App não reage a user.deleted, ban, etc. | Sessão some quando o Clerk invalida; dados locais futuros ficariam órfãos |
| **Captcha só no sign-up** | Login pode quebrar se o Dashboard exigir bot protection | Espelhar `#clerk-captcha` no form de login se isso for ligado |
| **Sem testes de auth** | Regressão em proxy, ticket, roles | Playwright/Clerk testing skill ainda não usados |
| **Sem headers de segurança** | CSP/HSTS não definidos | Relevante na hora de publicar |
| **Enumeração no forgot-password** | Confirma existência de e-mail | Aceitável no portal fechado |
| **Gerenciar mapas sem distinção de papel** | Qualquer logado acessa | Confirmar se `reader` deve só visualizar |
| **Sem auditoria** | Não há trilha de ações admin | Necessário quando o CRUD de usuários existir |
| **Organizations / SSO / billing** | Fora de escopo | Não usar `<OrganizationSwitcher />` nem Billing |
| **MFA não é obrigatório** | O form trata o status; a instância pode não exigir | Ativar no Dashboard se o risco pedir |

Fora de auth, mas relacionado: não há `app/api` nem persistência própria. Qualquer dado sensível futuro (mapas, PII) precisa de checagem de sessão **e** papel no servidor, não só no client.

---

## 11. Armadilhas para quem for alterar o código

1. **Não criar `middleware.ts`.** Next.js 16 usa `proxy.ts`.
2. **Não criar catch-alls `[[...sign-in]]` / `[[...sign-up]]`.**
3. **Não importar `@clerk/nextjs/server` em arquivos usados pelo client.** Papéis puros em `lib/roles.ts`; I/O em `lib/roles.server.ts`.
4. **Não usar `SignUpButton` / hosted SignUp.** Quebra o modelo de convite.
5. **Não tratar a sidebar como ACL.** Guard no servidor em toda rota privilegiada.
6. **Custom flow = Future API.** `signIn.password` + `finalize`, não `prepareFirstFactor` / `setActive`.
7. **`auth()` é async.** Sempre `await auth()`.
8. **Novas rotas públicas** precisam entrar em `PUBLIC_ROUTES` (e em `AUTH_REDIRECT_ROUTES` se forem telas de auth).
9. **Matcher `/__clerk/:path*`** deve permanecer.
10. **Convite = `strategy: 'ticket'`.** Cadastro por e-mail/senha aberto não deve ser adicionado.

---

## 12. Diagrama

```
                    ┌─────────────────────────┐
                    │  Clerk (IdP + users)    │
                    │  invite-only, metadata  │
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
        │ useSignIn / useSignUp                                          │ useUser
        │ (custom UI)                                                    │ publicMetadata.role
        └────────────────────────── ClerkProvider (root layout) ─────────┘
```

---

## 13. Referência rápida de APIs usadas

| API | Onde | Para quê |
|-----|------|----------|
| `clerkMiddleware` + `auth.protect()` | `proxy.ts`, dashboard layout | Sessão |
| `auth()` / `currentUser()` | `lib/roles.server.ts` | Papel no servidor |
| `useSignIn()` | `sign-in-form.tsx` | Login, MFA, reset |
| `useSignUp()` | `sign-up-form.tsx` | Ticket |
| `useUser()` | sidebar, NavUser | Perfil e papel (UX) |
| `useClerk().signOut` | NavUser | Logout |
| `<Show when="signed-in\|signed-out">` | home | CTA Entrar / Painel |
| `ClerkProvider` | root layout | Contexto |

Não usados (de propósito): `SignIn`, `SignUp`, `UserButton`, `OrganizationSwitcher`, `clerkClient` (ainda), webhooks, Billing.

---

## 14. Evolução prevista (quando for implementar)

Quando **Gerenciar usuários** deixar de ser stub, o caminho alinhado a este desenho é:

1. Server Actions ou Route Handlers com `await requireAdmin()` **antes** de qualquer `clerkClient()`.
2. Convites: `clerkClient().invitations.createInvitation` com `redirectUrl` em `/sign-up` e `publicMetadata: { role: 'reader' }` (ou `admin`).
3. Listar / banir / atualizar metadata pela Backend API.
4. Webhook `user.deleted` / `session.revoked` se existir cópia local de dados.
5. Testes e2e de login, ticket sem/com query, reader bloqueado em gerenciar-usuarios, admin passando.

Não misturar Firebase Auth nesse fluxo.
