# Autenticação, perfis e segurança

## Objetivo
Garantir que só o time Perfin acesse o Portal e que só o administrador, com senha e segundo fator, tenha poderes de admin.

## Como funciona
- **Usuário**: login Google (Supabase Auth, PKCE, `access_type=offline`). O callback (`app/auth/callback/route.ts`) exige e-mail verificado do domínio `ALLOWED_GOOGLE_DOMAIN` (e `hd` do Workspace quando presente). Só então o servidor cria o perfil (`perfis`, papel `usuario`). Bloqueados ou fora do domínio vão para "Acesso não autorizado".
- **Admin**: e-mail de `ADMIN_USER` + senha (guardada só no Supabase Auth) + MFA TOTP. Poder de admin exige sessão `aal2` com método `password`. O mesmo e-mail entrando pelo Google é tratado como usuário.
- **Guardas no servidor**: `exigirUsuario()` e `exigirAdmin()` (`lib/auth/sessao.ts`), além do `proxy.ts` que renova a sessão e manda quem não está logado para `/login`.
- **RLS**: funções `is_membro()` e `is_admin()` repetem as regras no banco. Tabelas internas negam o papel `anon`; `google_tokens` não tem policies (só a secret key acessa).
- **Tokens Google**: refresh/access token cifrados com AES-256-GCM (`lib/cripto.ts`, chave `TOKEN_ENCRYPTION_KEY`).
- **Cabeçalhos de segurança** em `next.config.ts` (HSTS, nosniff, frame DENY, etc.).

## Como usar
- Primeiro acesso do admin: `/admin/login` → senha → cadastrar o app autenticador (QR code) → código de 6 dígitos.
- Bloquear um usuário: Admin → Usuários → Bloquear.

## Observações
- O Supabase cria usuário para qualquer conta que faça OAuth; sem perfil criado pelo servidor ele não lê nada (RLS).
- `gmail.compose` permite enviar, mas o código só cria rascunhos (teste automatizado garante).
- Não há limite de requisições no assistente além dos limites do próprio Gemini.

_Última atualização: 2026-10-06_
