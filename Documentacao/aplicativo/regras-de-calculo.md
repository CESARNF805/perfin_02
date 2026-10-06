# Regras de cálculo e insights

## Objetivo
Documentar as fórmulas e regras de negócio usadas em painéis, relatório, assistente e site, para que qualquer número do Portal possa ser conferido.

## Como funciona
Todas as regras são funções puras em `Aplicativo/services/calculos/` e `services/insights/`, com testes em `Aplicativo/tests/`. Taxas entram e saem em percentual (0,45 = 0,45%).

### Composição (nunca somar taxas)
- Acumulado de taxas mensais (IPCA, INPC, IGP-M): `∏(1 + rᵢ) − 1`.
  - No ano: janeiro até o último mês divulgado. Em 12 meses: últimos 12 meses fechados.
- Taxas diárias (CDI, Selic % a.d.): `∏(1 + dᵢ) − 1` nos dias úteis. CDI do mês = composição dos dias do mês; o mês só conta quando é anterior ao mês corrente (fechado).
- **Validação**: IPCA 12m de ago/2026 calculado = 4,22%, igual à série oficial SGS 13522.

### Juro real (Fisher)
- Ex-post (12m) = `(1 + CDI 12m) / (1 + IPCA 12m) − 1`.
- Ex-ante (aproximação) = `(1 + Selic meta atual) / (1 + IPCA esperado 12m no Focus) − 1`.

### Câmbio (PTAX venda)
- Variação no período = PTAX do último dia do período ÷ PTAX do último dia útil antes do início − 1.
- Média, mínima e máxima do período; variação mensal = fechamento do mês ÷ fechamento do mês anterior − 1.
- Volatilidade anualizada = desvio-padrão amostral dos retornos log diários × √252.

### Comparativos
- "Quanto rendeu R$ 100": índice base 100 no início do período para CDI, IPCA, IGP-M, dólar e euro; rendimento real = Fisher contra o IPCA do mesmo intervalo. Usa só meses fechados com todos os dados.
- Spread IGP-M − IPCA (12m, em p.p.).
- IPCA 12m × meta (centro e banda cadastrados em `metas_inflacao`).

### Focus
- Esperado × realizado: 1ª pesquisa do ano para o IPCA do ano × IPCA acumulado até o último mês divulgado.
- Surpresa do mês: IPCA divulgado − mediana Focus mensal da última pesquisa até o dia 7 do mês seguinte.
- Tendência: amostra semanal (último valor da semana); variação em 4 semanas e semanas seguidas na mesma direção.

### Qualidade dos dados
- Acumulado só é calculado com **todos** os meses/dias do intervalo; se faltar, a tela mostra "dado incompleto" e o mês faltante.
- Mês de uma série diária só é considerado fechado quando já existe dado do mês seguinte.
- Formatação: % com 2 casas, câmbio com 4, diferenças em p.p., datas e números pt-BR (`lib/formatacao.ts`).

### Insights automáticos (sem IA)
Regras em `services/insights/regras.ts`; limites em `services/insights/config.ts`:

| Regra | Dispara quando |
|---|---|
| IPCA × meta | sempre (alerta fora da banda, com meses seguidos) |
| Surpresa do IPCA | diferença ≥ 0,05 p.p. contra o Focus |
| Juro real | informativo; destaca "maior/menor desde …" (janela de 10 anos, recorde ≥ 12 meses) |
| Dólar no mês | variação mensal ≥ 2% |
| Revisão do Focus | ≥ 3 semanas seguidas ou ≥ 0,2 p.p. em 4 semanas |
| Spread IGP-M − IPCA | ≥ 1 p.p. |
| Ganho real no ano | CDI × IPCA no ano |

## Como usar
Para mudar um limite, altere `services/insights/config.ts` e rode `npm test`.

## Observações
- O ex-ante é uma aproximação (não usa curva de juros); está rotulado assim nas telas.

_Última atualização: 2026-10-06_
