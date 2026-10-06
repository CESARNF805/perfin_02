import { describe, expect, it } from "vitest";
import { periodoParaParametros, resolverPeriodo } from "@/services/periodo";

const HOJE = "2026-10";

describe("filtro de período", () => {
  it("padrão é 12 meses", () => {
    expect(resolverPeriodo({}, HOJE)).toEqual({ preset: "12m", inicio: "2025-11", fim: HOJE });
  });

  it("presets", () => {
    expect(resolverPeriodo({ periodo: "mes" }, HOJE)).toMatchObject({ inicio: HOJE, fim: HOJE });
    expect(resolverPeriodo({ periodo: "24m" }, HOJE).inicio).toBe("2024-11");
    expect(resolverPeriodo({ periodo: "5a" }, HOJE).inicio).toBe("2021-11");
    expect(resolverPeriodo({ periodo: "ano" }, HOJE).inicio).toBe("2026-01");
  });

  it("valor inválido cai no padrão", () => {
    expect(resolverPeriodo({ periodo: "<script>" }, HOJE).preset).toBe("12m");
    expect(resolverPeriodo({ periodo: ["24m", "5a"] }, HOJE).preset).toBe("24m");
  });

  it("personalizado: inverte datas trocadas e limita ao intervalo permitido", () => {
    expect(resolverPeriodo({ periodo: "personalizado", de: "2026-05", ate: "2026-01" }, HOJE)).toEqual({
      preset: "personalizado", inicio: "2026-01", fim: "2026-05",
    });
    expect(resolverPeriodo({ periodo: "personalizado", de: "2001-01", ate: "2030-12" }, HOJE)).toEqual({
      preset: "personalizado", inicio: "2010-01", fim: HOJE,
    });
  });

  it("personalizado sem datas ou com mês inválido cai no padrão", () => {
    expect(resolverPeriodo({ periodo: "personalizado" }, HOJE).preset).toBe("12m");
    expect(resolverPeriodo({ periodo: "personalizado", de: "2026-13", ate: "2026-01" }, HOJE).preset).toBe("12m");
  });

  it("ida e volta pelos parâmetros de URL", () => {
    const p = resolverPeriodo({ periodo: "personalizado", de: "2025-02", ate: "2025-09" }, HOJE);
    expect(resolverPeriodo(periodoParaParametros(p), HOJE)).toEqual(p);
  });
});
