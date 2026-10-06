import { describe, expect, it } from "vitest";
import { listarMeses, somarMeses } from "@/services/calculos/meses";
import {
  acumulado12m,
  acumuladoAno,
  acumularMeses,
  compostoDiarioPorMes,
  indiceBase100,
  mapaMensal,
  ultimoPorMes,
  variacaoMensal,
} from "@/services/calculos/series";
import { compor, juroReal } from "@/services/calculos/taxas";
import { IPCA_SET25_AGO26, diaria, mensal } from "./ajudantes";

describe("taxas", () => {
  it("compõe taxas em vez de somar", () => {
    expect(compor([1, 1])).toBeCloseTo(2.01, 10);
    expect(compor([])).toBe(0);
    expect(compor([10, -10])).toBeCloseTo(-1, 10);
  });

  it("juro real usa Fisher, não subtração", () => {
    expect(juroReal(15, 5)).toBeCloseTo(9.5238, 4);
    expect(juroReal(15, 5)).not.toBeCloseTo(10, 2);
    expect(juroReal(5, 5)).toBeCloseTo(0, 10);
  });
});

describe("meses", () => {
  it("soma meses atravessando anos", () => {
    expect(somarMeses("2026-01", -1)).toBe("2025-12");
    expect(somarMeses("2025-12", 1)).toBe("2026-01");
    expect(somarMeses("2026-08", -11)).toBe("2025-09");
    expect(somarMeses("2026-03", -27)).toBe("2023-12");
  });

  it("lista meses inclusivos e vazio quando invertido", () => {
    expect(listarMeses("2025-11", "2026-02")).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    expect(listarMeses("2026-02", "2026-01")).toEqual([]);
  });
});

describe("acumulados mensais", () => {
  const ipca = mapaMensal(mensal(IPCA_SET25_AGO26));

  it("IPCA 12m de ago/2026 bate com o oficial do BCB (SGS 13522 = 4,22%)", () => {
    const r = acumulado12m(ipca, "2026-08");
    expect(r.ok).toBe(true);
    if (r.ok) expect(Number(r.valor.toFixed(2))).toBe(4.22);
  });

  it("acumulado no ano vai de janeiro ao mês", () => {
    const r = acumuladoAno(ipca, "2026-03");
    expect(r.ok && r.valor).toBeCloseTo(compor([0.33, 0.7, 0.88]), 10);
  });

  it("não calcula com buraco e informa o mês faltante", () => {
    const comBuraco = new Map(ipca);
    comBuraco.delete("2026-02");
    expect(acumulado12m(comBuraco, "2026-08")).toEqual({ ok: false, faltando: ["2026-02"] });
  });

  it("intervalo invertido é incompleto", () => {
    expect(acumularMeses(ipca, "2026-05", "2026-01").ok).toBe(false);
  });

  it("índice base 100 vira null depois de um mês sem dado", () => {
    const mapa = new Map([["2026-01", 10], ["2026-03", 10]]);
    const [jan, fev, mar] = indiceBase100(mapa, ["2026-01", "2026-02", "2026-03"]);
    expect(jan).toBeCloseTo(110, 10);
    expect([fev, mar]).toEqual([null, null]);
  });
});

describe("séries diárias", () => {
  it("CDI do mês = composição dos dias úteis; mês corrente (parcial) fica de fora", () => {
    const pontos = diaria("2026-08-01", "2026-09-10", 0.05);
    const mapa = compostoDiarioPorMes(pontos, "2026-09");
    expect(mapa.has("2026-09")).toBe(false);
    expect(mapa.get("2026-08")).toBeCloseTo(((1.0005 ** 21) - 1) * 100, 10);
  });

  it("bug do review: período que termina num mês passado mantém o CDI desse mês", () => {
    // Dados carregados só até set/2025 (filtro personalizado); hoje é out/2026.
    const pontos = diaria("2025-08-01", "2025-09-30", 0.05);
    const mapa = compostoDiarioPorMes(pontos, "2026-10");
    expect(mapa.has("2025-09")).toBe(true);
  });

  it("variação mensal usa o fechamento do mês anterior", () => {
    const ultimos = ultimoPorMes([
      { data: "2026-07-31", valor: 5 },
      { data: "2026-08-15", valor: 9 },
      { data: "2026-08-31", valor: 5.5 },
    ]);
    expect(ultimos.get("2026-08")).toBe(5.5);
    expect(variacaoMensal(ultimos).get("2026-08")).toBeCloseTo(10, 10);
    expect(variacaoMensal(ultimos).has("2026-07")).toBe(false);
  });
});
