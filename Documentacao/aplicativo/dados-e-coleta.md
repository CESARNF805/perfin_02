# Banco de dados e coleta de indicadores

## Objetivo
Manter os indicadores do Banco Central atualizados no Supabase com acesso mínimo e RLS em todas as tabelas.

## Como funciona
### Tabelas (todas com RLS ligado)
| Tabela | Conteúdo | Quem lê / escreve |
|---|---|---|
| `perfis` | papel, bloqueio, último acesso | usuário lê o próprio; admin lê todos e altera só `bloqueado`; criação pelo servidor |
| `indicadores` | catálogo (código SGS, unidade, status da coleta) | membros leem; admin cadastra/ativa; ETL atualiza status |
| `indicador_valores` | valores por data | membros leem; só o papel `etl_indicadores` grava |
| `expectativas_focus` | medianas Focus (anual, 12m, mensal, Copom) | membros leem; só o ETL grava |
| `metas_inflacao` | centro e tolerância por ano | membros leem; admin altera |
| `relatorios` | planilhas geradas | só o dono |
| `google_tokens` | tokens cifrados | ninguém via API (só secret key no servidor) |
| `publicacao_indicadores` | seleção do painel público | admin |
| `painel_publico` | snapshot calculado | público (anon) lê; servidor grava |
| `cartas_mensais` | carta mensal | público lê só as publicadas (sem o autor); admin tudo |

Migrations em `Aplicativo/supabase/migrations/` (aplicadas em 06/10/2026).

### Coleta (`Aplicativo/scripts/indicadores/`)
- `coletar.py`: para cada série ativa, busca no SGS de forma incremental (reprocessa 45 dias, janelas de até ~10 anos), ignora datas futuras (a Selic meta vem projetada) e faz upsert idempotente. Depois busca o Focus (Olinda) a partir da última pesquisa − 7 dias.
- `banco.py` usa `INDICADORES_DATABASE_URL` (papel `etl_indicadores` via Session pooler IPv4).
- Retentativas com espera exponencial; termina com código 1 se algo falhar, sem imprimir a conexão.
- GitHub Actions `.github/workflows/indicadores.yml`: dias úteis 21h UTC e manual (inclusive pelo botão "Coletar agora" do admin).

Séries iniciais: IPCA (433), INPC (188), IGP-M (189), IPCA livres (11428), monitorados (4449), Selic meta (432), Selic diária (11), CDI (12), dólar PTAX venda (1), euro PTAX venda (21619).

## Como usar
- Nova série: Admin → Indicadores → Nova série do SGS (código, unidade, periodicidade).
- Rodar a coleta manualmente: GitHub → Actions → "Coleta de indicadores (BCB)" → Run workflow.

## Observações
- A carga inicial (2010 em diante; Focus desde 2020) foi feita uma única vez com a conexão administrativa local.
- A senha do papel `etl_indicadores` não está em nenhum arquivo: é definida no SQL Editor e guardada só como secret do GitHub.

_Última atualização: 2026-10-06_
