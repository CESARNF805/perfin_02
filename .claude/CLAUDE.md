# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Perfin_02

Projeto da Perfin organizado em três áreas:

- `Aplicativo/`: código do aplicativo.
- `Website/`: código do site institucional.
- `Documentacao/`: documentação técnica e funcional do projeto.

### Convenções
- Responder e escrever documentação em português (PT-BR).
- Regras permanentes ficam em `.claude/rules/`: `geral.md`, `codigo.md`, `seguranca.md`, `architecture.md` e `react-nextjs.md`.

### Subagents (`.claude/agents/`)
- `architect`: analisa requisitos e arquitetura e entrega impacto, arquivos envolvidos, riscos e plano de implementação. Nunca altera código.
- `frontend`: especialista em React/Next.js; implementa interfaces seguindo os padrões existentes.
- `tester`: cria testes buscando edge cases, regressões, erros de estado e comportamento inesperado.
- `reviewer`: review rigoroso (bugs, duplicação, segurança, complexidade, código morto). Não altera arquivos.

### Skills (`.claude/skills/`)
- `nova-feature`: fluxo completo architect → implementação → tester → reviewer → documentação.
- `corrigir-bug`: reproduzir com teste, corrigir a causa raiz, revisar.
- `documentar-feature`: template de documentação em `Documentacao/`.

### Hooks (`.claude/settings.json`)
- `PreToolUse` → `.claude/hooks/proteger.ps1`: bloqueia a edição de `.env`, chaves e credenciais, e comandos destrutivos (`rm -rf`, `Remove-Item -Recurse -Force`, `git push --force`, `git reset --hard`, `git clean -f`, `DROP`/`TRUNCATE`).

### Comandos
Em `Aplicativo/` (Portal Perfin) e `Website/` (site institucional), cada um com seu `package.json`:
- `npm run lint` · `npm run typecheck` · `npm test` · `npm run build`
- Teste isolado: `npx vitest run tests/calculos.test.ts` ou por nome: `npx vitest run -t "IPCA 12m"`
- Coleta Python (`Aplicativo/scripts/indicadores/`): `python -m pytest -q`
- O sistema roda sempre pela URL da Vercel (sem localhost); variáveis na Vercel (ver `.env.example`).

### Arquitetura (resumo — detalhes em `Documentacao/aplicativo/visao-geral.md`)
- Portal: Next.js 16 App Router + Supabase (RLS em todas as tabelas) + PWA. `app/` só telas; regras em `services/` (`calculos/`, `painel/`, `insights/`, `relatorio.ts`, `assistente.ts`, `publicacao.ts`); infraestrutura em `lib/` (env, supabase, auth, google, gemini, cripto, formatacao).
- Acesso: usuário = Google @perfin.com.br; admin = `ADMIN_USER` com senha + MFA (aal2). Guardas `exigirUsuario`/`exigirAdmin` + funções RLS `is_membro`/`is_admin`.
- Dados: GitHub Actions (Python) grava indicadores BCB/Focus → Supabase → Portal; Vercel Cron gera o snapshot `painel_publico` que o `Website/` só exibe.
- Migrations em `Aplicativo/supabase/migrations/`.
- Ambiente local: o projeto está no OneDrive, que bloqueia `.next`/`node_modules` (EPERM) e pesa na memória; builds pesados exigem memória livre (ver `log_perfin.txt` na Área de Trabalho).
