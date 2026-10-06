# Perfin_02

Projeto da Perfin composto por um aplicativo, um site institucional e sua documentação.

## Estrutura

| Pasta | Conteúdo |
|---|---|
| `Aplicativo/` | Código do aplicativo |
| `Website/` | Código do site institucional |
| `Documentacao/` | Documentação técnica e funcional |
| `.claude/` | Configuração do Claude Code (CLAUDE.md, agents, skills, rules e hooks) — versionada |

## Tecnologias

- [Supabase](https://supabase.com) (banco de dados PostgreSQL, Auth e RLS)
- Next.js 16 + TypeScript (Portal Perfin em `Aplicativo/`, PWA; site em `Website/`)
- Vercel (hospedagem e cron), GitHub Actions (coleta diária em Python dos dados do Banco Central)
- Google (login, Agenda, Planilhas, Drive, Gmail) e Gemini (assistente)

## Primeiros passos

1. Clone o repositório:
   ```bash
   git clone https://github.com/CESARNF805/perfin_02.git
   ```
2. Crie o arquivo `.env` a partir do modelo e preencha os valores reais:
   ```bash
   cp .env.example .env
   ```
3. Instale e teste cada projeto (`npm install`, `npm test`) em `Aplicativo/` e `Website/`.
4. Configure Vercel, Google Cloud, Supabase e GitHub conforme `Documentacao/aplicativo/configuracao.md`.

Documentação completa em `Documentacao/` (visão geral, regras de cálculo, segurança, funcionalidades, dados e site).

## Fluxo de trabalho

Mudanças relevantes seguem o fluxo definido em `.claude/`: `architect` → implementação → `tester` → `reviewer`, com a documentação registrada em `Documentacao/`.

## Segurança

- O arquivo `.env` nunca deve ser versionado.
- Segredos ficam apenas em variáveis de ambiente.
