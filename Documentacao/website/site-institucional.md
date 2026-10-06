# Site institucional — painel público e carta mensal

## Objetivo
Mostrar ao público uma seleção de indicadores e a carta mensal aprovada pelo admin, com aviso regulatório.

## Como funciona
- Projeto Next.js separado em `Website/` (não compartilha código com o Portal).
- Lê do Supabase só com a chave publishable (`lib/dados.ts`): `painel_publico` (snapshot já calculado pelo Portal, validado com zod) e `cartas_mensais` publicadas. O site não calcula nada.
- Páginas: `/` (institucional), `/indicadores` (revalida a cada hora), `/carta-mensal` e `/carta-mensal/AAAA-MM`.
- Textos da carta são exibidos como parágrafos de texto simples (sem HTML).
- Aviso regulatório no rodapé de todas as páginas (`lib/textos.ts`).
- Identidade visual Perfin: azul #101B2A, ardósia #415765, off-white #F9F4F4, cantos vivos, sem sombras.

## Como usar
- Comandos em `Website/`: `npm install`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- Conteúdo: o admin escolhe os indicadores e publica a carta no Portal (Admin → Publicação no site).

## Observações
- O texto do aviso regulatório precisa ser validado pelo compliance antes do lançamento.
- Variáveis na Vercel: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

_Última atualização: 2026-10-06_
