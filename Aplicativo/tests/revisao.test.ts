/** Testes que reproduzem os achados do code review (06/10/2026). */
import { describe, expect, it } from "vitest";
import { textoMensagem } from "@/lib/mensagens-admin";
import { criarLimitador } from "@/lib/limite";
import { direcaoRevisao } from "@/services/calculos/focus";
import { pedidoAssistenteSchema } from "@/services/assistente";
import { dataPublicacao } from "@/services/cartas";

describe("insight do Focus: direção da revisão", () => {
  it("bug: última semana parada mas queda em 4 semanas não pode virar 'elevou'", () => {
    expect(direcaoRevisao({ atual: 4.8, variacao4Semanas: -0.3, sequencia: 0 })).toBe(-1);
  });

  it("usa a sequência semanal quando existe", () => {
    expect(direcaoRevisao({ atual: 5, variacao4Semanas: -0.1, sequencia: 2 })).toBe(1);
    expect(direcaoRevisao({ atual: 5, variacao4Semanas: 0, sequencia: 0 })).toBe(0);
  });
});

describe("assistente: histórico com resposta longa", () => {
  it("bug: resposta > 4000 caracteres no histórico era rejeitada; agora é truncada", () => {
    const periodo = { preset: "12m", inicio: "2025-11", fim: "2026-10" };
    const r = pedidoAssistenteSchema.safeParse({
      pergunta: "E o dólar?", periodo, historico: [{ papel: "assistente", texto: "x".repeat(6000) }],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.historico[0]?.texto).toHaveLength(4000);
  });
});

describe("carta mensal: data de publicação", () => {
  const agora = "2026-10-06T20:00:00.000Z";
  it("bug: republicar não pode trocar a data original", () => {
    expect(dataPublicacao("publicada", "2026-09-10T12:00:00.000Z", agora)).toBe("2026-09-10T12:00:00.000Z");
  });
  it("primeira publicação usa agora; rascunho limpa", () => {
    expect(dataPublicacao("publicada", null, agora)).toBe(agora);
    expect(dataPublicacao("rascunho", "2026-09-10T12:00:00.000Z", agora)).toBeNull();
  });
});

describe("mensagens do admin", () => {
  it("bug: texto vindo da URL não é exibido; só códigos conhecidos", () => {
    expect(textoMensagem("meta_salva")).toBe("Meta salva.");
    expect(textoMensagem("Sua senha expirou, clique aqui")).toBeNull();
    expect(textoMensagem("toString")).toBeNull();
    expect(textoMensagem(undefined)).toBeNull();
  });
});

describe("limite de uso do assistente", () => {
  it("bloqueia acima do máximo na janela e libera depois", () => {
    const permitir = criarLimitador(2, 1000);
    expect(permitir("u", 0)).toBe(true);
    expect(permitir("u", 10)).toBe(true);
    expect(permitir("u", 20)).toBe(false);
    expect(permitir("outro", 20)).toBe(true);
    expect(permitir("u", 1500)).toBe(true);
  });
});
