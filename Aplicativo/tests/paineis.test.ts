import { describe, expect, it } from "vitest";
import { pedidoAssistenteSchema, montarContexto } from "@/services/assistente";
import { painelComparador } from "@/services/painel/comparador";
import { ordemReuniao } from "@/services/painel/expectativas";
import { painelInflacao, spreadIgpmIpca } from "@/services/painel/inflacao";
import { derivar } from "@/services/calculos/derivadas";
import { montarSnapshot } from "@/services/publicacao";
import { mesDoRelatorio, montarAbas } from "@/services/relatorio";
import { formatarMes, formatarMoeda, formatarPercentual, formatarPontosPercentuais } from "@/lib/formatacao";
import { dados, diaria, mensalConstante } from "./ajudantes";

const base = dados({
  ipca: mensalConstante("2024-01", "2026-08", 0.4),
  igpm: mensalConstante("2024-01", "2026-09", 0.6),
  cdi: diaria("2024-01-01", "2026-10-05", 0.05),
  selic_meta: diaria("2024-01-01", "2026-10-05", 15),
  dolar: diaria("2024-01-01", "2026-10-05", (_d, i) => 5 + i * 0.001),
  euro: diaria("2024-01-01", "2026-10-05", 6),
});

describe("juro real com período passado", () => {
  it("bug do review: último mês de um período passado tem CDI e juro real", () => {
    const passado = dados({
      ipca: mensalConstante("2024-01", "2025-09", 0.4),
      cdi: diaria("2024-01-01", "2025-09-30", 0.05),
    });
    const s = derivar(passado);
    expect(s.cdiMensal.has("2025-09")).toBe(true);
  });
});

describe("formatação pt-BR", () => {
  it("formata percentuais, p.p., moeda e meses", () => {
    expect(formatarPercentual(4.2214)).toBe("4,22%");
    expect(formatarPontosPercentuais(0.12)).toBe("+0,12 p.p.");
    expect(formatarPontosPercentuais(-0.12)).toBe("-0,12 p.p.");
    expect(formatarMoeda(5.12345)).toBe("R$ 5,1235");
    expect(formatarMes("2026-08")).toBe("ago/2026");
    expect(formatarPercentual(null)).toBe("—");
    expect(formatarPercentual(Number.NaN)).toBe("—");
  });
});

describe("painel de inflação", () => {
  it("spread IGP-M − IPCA em p.p.", () => {
    const s = derivar(base);
    expect(spreadIgpmIpca(s, "2026-08")).toBeCloseTo((1.006 ** 12 - 1.004 ** 12) * 100, 8);
  });

  it("avisa até quando o IPCA foi divulgado e marca alerta acima do teto", () => {
    const p = painelInflacao(base, { preset: "12m", inicio: "2025-11", fim: "2026-10" });
    expect(p.avisos[0]).toContain("ago/2026");
    expect(p.destaques.find((d) => d.id === "ipca_12m")?.tom).toBe("alerta");
    expect(p.tabela?.linhas[0]?.id).toBe("2026-10");
  });

  it("sem IPCA mostra aviso e nenhum gráfico", () => {
    const p = painelInflacao(dados({}), { preset: "12m", inicio: "2025-11", fim: "2026-10" });
    expect(p.graficos).toEqual([]);
    expect(p.avisos.length).toBe(1);
  });
});

describe("comparador R$ 100", () => {
  it("usa só meses fechados com todos os dados e calcula o real pelo IPCA", () => {
    const p = painelComparador(base, { preset: "12m", inicio: "2025-11", fim: "2026-10" });
    expect(p.avisos[0]).toContain("ago/2026");
    const ipca = p.tabela?.linhas.find((l) => l.id === "ipca");
    expect(ipca?.real).toBeCloseTo(0, 10);
    const cdi = p.tabela?.linhas.find((l) => l.id === "cdi");
    expect(Number(cdi?.final)).toBeGreaterThan(100);
  });
});

describe("relatório do mês", () => {
  it("usa o último mês fechado com IPCA e IGP-M", () => {
    expect(mesDoRelatorio(base, "2026-10")).toEqual({ ok: true, mes: "2026-08" });
    expect(mesDoRelatorio(dados({}), "2026-10").ok).toBe(false);
  });

  it("monta as abas previstas com cabeçalhos", () => {
    const abas = montarAbas(base, "2026-08");
    expect(abas.map((a) => a.titulo)).toEqual(["Resumo", "Inflação", "Juros", "Câmbio", "Focus", "Insights", "Dados"]);
    expect(abas[0]?.linhas[1]?.[0]).toBe("Indicador");
    expect(abas[1]?.linhas).toHaveLength(14);
  });
});

describe("snapshot público", () => {
  it("publica só os indicadores visíveis, na ordem, com destaque calculado", () => {
    const snap = montarSnapshot(base, [
      { indicador_id: "dolar", visivel: true, ordem: 2, grafico: "linha" },
      { indicador_id: "ipca", visivel: true, ordem: 1, grafico: "linha" },
      { indicador_id: "igpm", visivel: false, ordem: 0, grafico: "barra" },
      { indicador_id: "nao_existe", visivel: true, ordem: 0, grafico: "linha" },
    ], "2026-10", new Date("2026-10-06T12:00:00Z"));
    expect(snap.indicadores.map((i) => i.id)).toEqual(["ipca", "dolar"]);
    expect(snap.indicadores[0]?.serie).toHaveLength(24);
    expect(snap.indicadores[0]?.serie.at(-1)?.teto).toBe(4.5);
    expect(snap.atualizadoEm).toBe("2026-10-06T12:00:00.000Z");
  });
});

describe("assistente", () => {
  it("valida o pedido e limita tamanhos", () => {
    const periodo = { preset: "12m", inicio: "2025-11", fim: "2026-10" };
    expect(pedidoAssistenteSchema.safeParse({ pergunta: "Como está o IPCA?", periodo }).success).toBe(true);
    expect(pedidoAssistenteSchema.safeParse({ pergunta: "x".repeat(1001), periodo }).success).toBe(false);
    expect(pedidoAssistenteSchema.safeParse({ pergunta: "oi?", periodo: { ...periodo, inicio: "2025-13" } }).success).toBe(false);
    const historico = Array.from({ length: 11 }, () => ({ papel: "usuario", texto: "a" }));
    expect(pedidoAssistenteSchema.safeParse({ pergunta: "oi?", periodo, historico }).success).toBe(false);
  });

  it("contexto traz só o período filtrado", () => {
    const ctx = montarContexto(base, { preset: "personalizado", inicio: "2026-01", fim: "2026-03" }, []);
    expect(ctx).toContain("jan/2026 a mar/2026");
    expect(ctx).toContain("mar/2026 |");
    expect(ctx).not.toContain("abr/2026 |");
  });

  it("ordena reuniões do Copom", () => {
    expect(["R1/2027", "R6/2026", "R5/2026"].sort((a, b) => ordemReuniao(a) - ordemReuniao(b))).toEqual(["R5/2026", "R6/2026", "R1/2027"]);
  });
});
