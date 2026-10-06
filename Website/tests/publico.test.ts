import { describe, expect, it } from "vitest";
import { formatarDataExtenso, formatarMesCurto, formatarMesExtenso, formatarValor, paragrafos } from "@/lib/formatacao";
import { painelPublicoSchema } from "@/types/publico";

describe("formatação do site", () => {
  it("formata valores, meses e datas no padrão da marca", () => {
    expect(formatarValor(4.2214, "pct")).toBe("4,22%");
    expect(formatarValor(5.12345, "brl")).toBe("R$ 5,1235");
    expect(formatarValor(null, "pct")).toBe("—");
    expect(formatarMesCurto("2026-08")).toBe("ago/2026");
    expect(formatarMesExtenso("2026-08-01")).toBe("agosto 2026");
    expect(formatarDataExtenso("2026-10-06T15:00:00Z")).toBe("6 outubro 2026");
  });

  it("separa parágrafos sem interpretar HTML", () => {
    expect(paragrafos("Um.\n\n  Dois <b>x</b>.\n \nTrês.")).toEqual(["Um.", "Dois <b>x</b>.", "Três."]);
    expect(paragrafos("   ")).toEqual([]);
  });
});

describe("snapshot público", () => {
  it("aceita o formato publicado pelo Portal e rejeita formatos desconhecidos", () => {
    const valido = {
      versao: 1, atualizadoEm: "2026-10-06T23:30:00Z", referencia: "2026-10",
      indicadores: [{
        id: "ipca", nome: "IPCA", grafico: "linha", formato: "pct", rotuloSerie: "Acumulado em 12 meses (%)",
        destaque: { rotulo: "IPCA em 12 meses", valor: 4.22, detalhe: "Até ago/2026" },
        serie: [{ mes: "2026-08", valor: 4.22, piso: 1.5, teto: 4.5 }],
      }],
    };
    expect(painelPublicoSchema.safeParse(valido).success).toBe(true);
    expect(painelPublicoSchema.safeParse({ ...valido, versao: 2 }).success).toBe(false);
    expect(painelPublicoSchema.safeParse(null).success).toBe(false);
  });
});
