import { describe, expect, it } from "vitest";
import type { ExpectativaFocus } from "@/types/indicadores";
import { estatisticas, variacaoNoPeriodo, volatilidadeAnualizada } from "@/services/calculos/cambio";
import { amostraSemanal, esperadoRealizado, surpresaMensal, tendenciaRevisao } from "@/services/calculos/focus";
import { mapaMensal } from "@/services/calculos/series";
import { IPCA_SET25_AGO26, mensal } from "./ajudantes";

describe("câmbio", () => {
  const pontos = [
    { data: "2026-06-30", valor: 5.0 },
    { data: "2026-07-01", valor: 5.2 },
    { data: "2026-07-15", valor: 4.9 },
    { data: "2026-07-31", valor: 5.5 },
  ];

  it("variação no período usa a última PTAX antes do início", () => {
    const r = variacaoNoPeriodo(pontos, "2026-07", "2026-07");
    expect(r.ok && r.valor).toBeCloseTo(10, 10);
  });

  it("sem base anterior ao período é incompleto", () => {
    expect(variacaoNoPeriodo(pontos, "2026-06", "2026-07").ok).toBe(false);
  });

  it("estatísticas do período", () => {
    const e = estatisticas(pontos, "2026-07", "2026-07");
    expect(e?.minimo.valor).toBe(4.9);
    expect(e?.maximo.valor).toBe(5.5);
    expect(e?.ultimo.data).toBe("2026-07-31");
    expect(e?.media).toBeCloseTo((5.2 + 4.9 + 5.5) / 3, 10);
    expect(estatisticas(pontos, "2025-01", "2025-02")).toBeNull();
  });

  it("volatilidade: série constante = 0; poucos pontos = null", () => {
    expect(volatilidadeAnualizada([{ data: "2026-01-01", valor: 5 }, { data: "2026-01-02", valor: 5 }])).toBeNull();
    const constante = [1, 2, 3, 4].map((d) => ({ data: `2026-01-0${d}`, valor: 5 }));
    expect(volatilidadeAnualizada(constante)).toBe(0);
  });

  it("volatilidade anualizada = desvio dos retornos log × √252", () => {
    const serie = [5, 5.05, 5, 5.05].map((valor, i) => ({ data: `2026-01-0${i + 1}`, valor }));
    const r1 = Math.log(5.05 / 5);
    const retornos = [r1, -r1, r1];
    const media = r1 / 3;
    const desvio = Math.sqrt(retornos.reduce((a, r) => a + (r - media) ** 2, 0) / 2);
    expect(volatilidadeAnualizada(serie)).toBeCloseTo(desvio * Math.sqrt(252) * 100, 10);
  });
});

function exp(data: string, mediana: number, extra: Partial<ExpectativaFocus> = {}): ExpectativaFocus {
  return { indicador: "ipca", tipo: "anual", referencia: "2026", data, mediana, ...extra };
}

describe("Focus", () => {
  it("amostra semanal pega o último valor de cada semana", () => {
    const s = amostraSemanal([
      { data: "2026-09-28", valor: 1 }, // segunda
      { data: "2026-10-02", valor: 2 }, // sexta, mesma semana
      { data: "2026-10-05", valor: 3 }, // segunda seguinte
    ]);
    expect(s.map((p) => p.valor)).toEqual([2, 3]);
  });

  it("tendência conta semanas seguidas de alta e a variação em 4 semanas", () => {
    const serie = ["2026-08-28", "2026-09-04", "2026-09-11", "2026-09-18", "2026-09-25", "2026-10-02"].map((data, i) => ({
      data, valor: [5, 4.8, 4.85, 4.9, 4.95, 5.0][i]!,
    }));
    const t = tendenciaRevisao(serie);
    expect(t?.atual).toBe(5);
    expect(t?.sequencia).toBe(4);
    expect(t?.variacao4Semanas).toBeCloseTo(0.2, 10);
  });

  it("tendência vazia é null", () => {
    expect(tendenciaRevisao([])).toBeNull();
  });

  it("surpresa usa a última pesquisa até o dia 7 do mês seguinte", () => {
    const focus = [
      exp("2026-08-28", 0.1, { tipo: "mensal", referencia: "2026-08" }),
      exp("2026-09-04", -0.2, { tipo: "mensal", referencia: "2026-08" }),
      exp("2026-09-11", 0.5, { tipo: "mensal", referencia: "2026-08" }), // depois da divulgação: ignorada
    ];
    const s = surpresaMensal(focus, mapaMensal(mensal(IPCA_SET25_AGO26)), "2026-08");
    expect(s?.esperado).toBe(-0.2);
    expect(s?.diferenca).toBeCloseTo(-0.12, 10);
  });

  it("esperado × realizado usa a primeira pesquisa do ano", () => {
    const focus = [exp("2025-12-20", 9), exp("2026-01-02", 4.1), exp("2026-06-01", 5)];
    const r = esperadoRealizado(focus, mapaMensal(mensal(IPCA_SET25_AGO26)), "2026-08");
    expect(r?.esperadoInicioAno).toBe(4.1);
    expect(r?.mesesRealizados).toBe(8);
  });
});
