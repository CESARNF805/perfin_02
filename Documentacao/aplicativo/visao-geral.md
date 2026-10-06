# Portal Perfin — visão geral

## Objetivo
Central de análise econômica do time Perfin: painéis de inflação, juros, câmbio e expectativas (Focus), insights automáticos, relatório mensal (Planilha Google/.xlsx), agenda, rascunho de e-mail e assistente com IA. Também alimenta o painel público e a carta mensal do site institucional.

## Como funciona
- **Stack**: Next.js 16 (App Router) + TypeScript, Supabase (Postgres + Auth, RLS em todas as tabelas), Vercel. Instalável como PWA.
- **Camadas**:
  - `app/` — rotas e telas (Server Components por padrão). Sem regra de negócio.
  - `components/` — exibição e eventos (gráficos com Recharts, filtro de período, chat).
  - `services/` — regras de negócio: `calculos/` (taxas, séries, câmbio, Focus), `painel/`, `insights/`, `relatorio.ts`, `assistente.ts`, `publicacao.ts`, `admin.ts`, `site.ts`.
  - `lib/` — infraestrutura: `env.ts`/`env-publico.ts` (validação de variáveis), `supabase/` (clientes), `auth/` (sessão e regras de acesso), `google/` (Agenda, Planilhas, Drive, Gmail, tokens cifrados), `gemini.ts`, `cripto.ts`, `formatacao.ts` (formatação pt-BR única).
  - `supabase/migrations/` — esquema, RLS e carga inicial.
  - `scripts/indicadores/` — coleta Python (SGS + Focus) rodada pelo GitHub Actions.
- **Fluxo de dados**: GitHub Actions (dias úteis, 18h) → Python → Supabase → telas do Portal (leitura com o RLS do usuário) → Vercel Cron (dias úteis, 20h30) recalcula o snapshot público → site.

## Como usar (desenvolvedor)
Na pasta `Aplicativo/`:

| Comando | O que faz |
|---|---|
| `npm install` | instala dependências |
| `npm run lint` | ESLint |
| `npm run typecheck` | checagem TypeScript |
| `npm test` | todos os testes (Vitest) |
| `npx vitest run tests/calculos.test.ts` | um arquivo de teste isolado |
| `npx vitest run -t "IPCA 12m"` | um teste pelo nome |
| `npm run build` | build de produção |

Coleta Python (`Aplicativo/scripts/indicadores/`): `pip install -r requirements.txt` e `python -m pytest -q`.

O sistema roda sempre pela URL da Vercel; não há uso de localhost. As variáveis ficam na Vercel (ver `configuracao.md`).

## Observações
- Projeto dentro do OneDrive: o OneDrive bloqueia arquivos de `node_modules` e `.next` durante a sincronização (erros `EPERM`) e consome memória. Recomenda-se manter o repositório fora do OneDrive (ex.: `C:\dev\Perfin_02`).
- Ícones do PWA são provisórios até o envio do logo oficial.

_Última atualização: 2026-10-06_
