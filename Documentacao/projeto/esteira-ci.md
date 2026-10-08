# Esteira de CI (validação de PRs)

## Objetivo
Toda mudança chega à `main` por PR e só entra com as validações automáticas verdes, para não quebrar o Portal, o site, a coleta ou as regras de acesso do banco.

## Como funciona
Fluxo de trabalho: **issue → branch → PR (com `Refs #issue`) → checks verdes + preview da Vercel → merge**.

| Workflow | Quando roda | O que valida |
|---|---|---|
| `ci.yml` (CI) | toda PR e push na `main` | App e site: `npm audit` (alto/crítico), lint, typecheck, testes e **build**. Coleta: `pip-audit` e `pytest`. |
| `seguranca.yml` (Segurança) | toda PR, push na `main` e semanal | Varredura de segredos no histórico (**gitleaks**) e **CodeQL** (JS/TS e Python; só em repositório público). |
| `banco.yml` (Banco) | PR que mexe em `Aplicativo/supabase/` | Sobe um Supabase local, aplica **todas as migrations do zero**, roda os testes de RLS (`supabase/tests/*.sql`, pgTAP) e o lint do esquema. |
| `indicadores.yml` | dias úteis 21h UTC e manual | Coleta BCB/Focus (precisa do secret `INDICADORES_DATABASE_URL`). |

Além disso:
- **Preview da Vercel** em cada PR (check da própria Vercel).
- **Dependabot**: PRs semanais agrupadas de npm (app e site), pip e GitHub Actions.
- **Modelos**: `.github/pull_request_template.md` (checklist das rules) e modelos de issue.

O build no CI usa variáveis `NEXT_PUBLIC_*` **fictícias**; nenhum segredo real é usado.

## Como usar
- Teste de RLS novo: crie `Aplicativo/supabase/tests/<nome>.test.sql` (pgTAP) e simule o usuário com `set local role authenticated` + `set_config('request.jwt.claims', '{...}', true)` (ver `rls.test.sql`).
- Rodar localmente (precisa de Docker): `cd Aplicativo && supabase start && supabase test db`.
- Se o gitleaks acusar um segredo: **revogue a chave** no serviço de origem; apagar o commit não basta.

## Observações
- Proteção da `main` (PR obrigatória e checks CI/Segurança obrigatórios, sem force push) é configurada no GitHub depois do OK do responsável. Em repositório privado, exige GitHub Pro.
- `Aplicativo/supabase/config.toml` serve só ao Supabase local do CI; não altera o projeto na nuvem.

_Última atualização: 2026-10-08_
