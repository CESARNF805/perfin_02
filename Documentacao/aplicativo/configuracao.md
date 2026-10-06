# Configuração: Vercel, Google Cloud, Supabase e GitHub

## Objetivo
Checklist do que precisa ser cadastrado para o Portal e o site funcionarem na URL da Vercel.

## Como funciona
O código lê tudo de variáveis de ambiente (validadas em `lib/env.ts` e `lib/env-publico.ts`). Nenhuma chave fica no código.

## Como usar
### 1. Vercel
1. Importar o repositório duas vezes: projeto **Portal** (Root Directory `Aplicativo`) e projeto **Site** (Root Directory `Website`).
2. Portal → Settings → Environment Variables:
   `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_USER`, `ALLOWED_GOOGLE_DOMAIN`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
   `TOKEN_ENCRYPTION_KEY`, `CRON_SECRET`, `GITHUB_ACTIONS_TOKEN`, `GITHUB_REPO`.
3. Site → `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Depois de definir `NEXT_PUBLIC_SITE_URL`, fazer **Redeploy** (ela entra no build). O cron do `vercel.json` é criado no deploy.

### 2. Google Cloud Console (projeto do client OAuth)
1. APIs e serviços → Biblioteca: ativar **Google Calendar API, Google Drive API, Google Sheets API, Gmail API**.
2. Tela de consentimento: tipo **Interno**; nome "Portal Perfin"; e-mail de suporte; página inicial = URL do Portal; domínios autorizados: `vercel.app` (ou domínio próprio) e `<projeto>.supabase.co`.
3. Acesso a dados (scopes): `openid`, `email`, `profile`, `.../auth/calendar.events.readonly`, `.../auth/drive.file`, `.../auth/gmail.compose`.
4. Credenciais → client OAuth Web: origem JavaScript = URL do Portal; **URI de redirecionamento = `https://<projeto>.supabase.co/auth/v1/callback`**.
5. Chave do Gemini (AI Studio): restringir à Generative Language API.

### 3. Supabase
1. Authentication → Providers: **Google** ligado (Client ID e Secret); **Email** ligado (só para o admin).
2. Authentication → URL Configuration: Site URL = URL do Portal; Redirect URLs = `<URL do Portal>/auth/callback`.
3. Authentication → MFA: habilitar **TOTP**.
4. Authentication → Users → Add user: e-mail de `ADMIN_USER`, senha forte, auto-confirmar. No 1º login em `/admin/login`, cadastrar o autenticador.
5. Project Settings → API Keys: criar a **secret key** (`SUPABASE_SECRET_KEY`).
6. SQL Editor: `alter role etl_indicadores with password '<senha forte>';` (as migrations já foram aplicadas).
7. Connect → Session pooler: montar `postgresql://etl_indicadores.<ref>:<senha>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`.

### 4. GitHub
1. Settings → Secrets and variables → Actions: `INDICADORES_DATABASE_URL` (string do item 3.7).
2. Criar um token fine-grained só deste repositório com permissão **Actions: read and write** → `GITHUB_ACTIONS_TOKEN` na Vercel.

## Observações
- `TOKEN_ENCRYPTION_KEY`: 32 bytes aleatórios em base64. Trocar a chave invalida as conexões Google salvas (usuários reconectam).
- `CRON_SECRET`: texto aleatório com 16+ caracteres; a Vercel envia no cabeçalho do cron.

_Última atualização: 2026-10-06_
