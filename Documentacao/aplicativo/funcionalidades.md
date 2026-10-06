# Funcionalidades do Portal

## Objetivo
Descrever o que cada tela faz e como o usuário e o admin a usam.

## Como funciona
| Tela | Rota | Conteúdo |
|---|---|---|
| Visão geral | `/` | 6 destaques (IPCA 12m × meta, Selic, CDI 12m, juro real, dólar, IGP-M 12m), insights e próximas 3 reuniões |
| Inflação | `/inflacao` | mensal (barras), 12m × banda da meta, livres × monitorados, spread, tabela |
| Juros | `/juros` | Selic meta, CDI, juro real ex-post e ex-ante |
| Câmbio | `/cambio` | PTAX diária, variação mensal, maiores altas e quedas, volatilidade |
| Expectativas | `/expectativas` | medianas Focus (ano e seguinte), surpresas do IPCA, Selic por reunião do Copom |
| Comparador | `/comparador` | R$ 100 em CDI, IPCA, IGP-M, dólar e euro (nominal e real) |
| Relatórios | `/relatorios` | gera Planilha Google no Drive, baixa .xlsx, cria rascunho no Gmail |
| Agenda | `/agenda` | próximas reuniões (7 dias) do Google Agenda |
| Assistente | `/assistente` | chat Gemini sobre os dados do período filtrado |
| Admin | `/admin/*` | usuários, indicadores (nova série SGS, coletar agora), metas, publicação no site e carta mensal |

- **Filtro de período** (`?periodo=12m|24m|5a|ano|mes|personalizado&de=AAAA-MM&ate=AAAA-MM`) vale para todos os painéis e é levado ao assistente.
- **Relatório**: mês de referência = último mês fechado com IPCA e IGP-M. Abas: Resumo, Inflação, Juros, Câmbio, Focus, Insights, Dados. Salvo na pasta "Portal Perfin – Relatórios" do Drive do usuário.
- **Gmail**: apenas `drafts.create`, com o .xlsx anexado e o link da planilha; sem destinatário.
- **Assistente**: o servidor recarrega os dados do período (não confia no navegador), envia ao Gemini só esse contexto, responde em streaming e sem recomendação de investimento.
- **PWA**: manifest, service worker (`public/sw.js`) que guarda só arquivos estáticos públicos, página `/offline`, botão "Instalar app" e aviso de nova versão. Dados nunca vão para o cache do aparelho; o cache é limpo no logout.

## Como usar
Use o filtro no topo de cada painel; clique em "Perguntar ao assistente sobre este período" para levar o filtro ao chat.

## Observações
- Agenda, Relatório e Gmail exigem a conta Google conectada; o admin logado por senha precisa entrar com o Google para usá-los.
- Planilhas são do usuário que as gerou (escopo `drive.file`).

_Última atualização: 2026-10-06_
