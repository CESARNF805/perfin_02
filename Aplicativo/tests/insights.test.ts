import { describe, expect, it } from "vitest";
import { gerarInsights } from "@/services/insights";
import { recordeDesde } from "@/services/insights/regras";
import { somarMeses } from "@/services/calculos/meses";
import { dados, diaria, mensalConstante } from "./ajudantes";

describe("recordeDesde", () => {
  const serie = (valores: Record<string, number>) => (m: string) => valores[m] ?? null;

  it("retorna o último mês que superou o valor atual", () => {
    const valores: Record<string, number> = { "2026-08": 7 };
    for (let i = 1; i <= 30; i++) valores[somarMeses("2026-08", -i)] = i === 20 ? 8 : 5;
    expect(recordeDesde(serie(valores), "2026-08", "max")).toBe(somarMeses("2026-08", -20));
  });

  it("recorde recente (menos de 12 meses) não é relevante", () => {
    const valores: Record<string, number> = { "2026-08": 7, "2026-05": 9 };
    expect(recordeDesde(serie(valores), "2026-08", "max")).toBeUndefined();
  });

  it("null quando é o maior da janela inteira", () => {
    expect(recordeDesde(serie({ "2026-08": 7, "2026-01": 1 }), "2026-08", "max")).toBeNull();
  });

  it("undefined quando não há valor no mês", () => {
    expect(recordeDesde(serie({}), "2026-08", "max")).toBeUndefined();
  });
});

describe("gerarInsights", () => {
  it("alerta IPCA acima do teto e informa meses seguidos", () => {
    const d = dados({ ipca: mensalConstante("2024-01", "2026-08", 0.5) }); // ~6,2% a.a.
    const insights = gerarInsights(d, "2026-10");
    const meta = insights.find((i) => i.id === "ipca_meta");
    expect(meta?.severidade).toBe("alerta");
    expect(meta?.titulo).toContain("acima do teto");
    expect(meta?.texto).toMatch(/pelo \d+º mês seguido/);
    expect(insights[0]?.severidade).toBe("alerta");
  });

  it("inflação dentro da banda é informativa", () => {
    const d = dados({ ipca: mensalConstante("2025-01", "2026-08", 0.25) });
    expect(gerarInsights(d, "2026-10").find((i) => i.id === "ipca_meta")?.severidade).toBe("informativo");
  });

  it("ganho real do ano compara CDI e IPCA do mesmo intervalo", () => {
    const d = dados({
      ipca: mensalConstante("2025-01", "2026-08", 0.3),
      cdi: diaria("2025-01-01", "2026-09-05", 0.05),
    });
    const ganho = gerarInsights(d, "2026-10").find((i) => i.id === "ganho_real_ano");
    expect(ganho?.titulo).toContain("ganhou");
  });

  it("sem dados não quebra e não gera insights", () => {
    expect(gerarInsights(dados({}), "2026-10")).toEqual([]);
  });

  it("dólar com alta forte vira insight de atenção", () => {
    const dolar = diaria("2026-07-01", "2026-10-03", (data) => (data >= "2026-09-01" ? 5.5 : 5));
    const i = gerarInsights(dados({ dolar }), "2026-10").find((x) => x.id === "dolar_mes");
    expect(i?.titulo).toContain("subiu");
  });
});
