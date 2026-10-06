import { describe, expect, it } from "vitest";
import { converterEvento } from "@/lib/google/agenda";
import { codificarCabecalho, montarMime } from "@/lib/google/mime";

describe("MIME do rascunho", () => {
  const mime = montarMime(
    {
      assunto: "Indicadores de ago/2026 — relatório",
      corpo: "Olá,\nsegue o relatório.",
      anexo: { nome: "portal-perfin-2026-08.xlsx", tipo: "application/vnd.ms-excel", conteudo: new Uint8Array([1, 2, 3]) },
    },
    "fronteira",
  );

  it("assunto com acento é codificado (RFC 2047)", () => {
    expect(mime).toContain(`Subject: =?UTF-8?B?${Buffer.from("Indicadores de ago/2026 — relatório").toString("base64")}?=`);
    expect(codificarCabecalho("simples")).toBe("simples");
  });

  it("tem corpo e anexo em partes separadas", () => {
    expect(mime).toContain('Content-Type: multipart/mixed; boundary="fronteira"');
    expect(mime).toContain(`Content-Disposition: attachment; filename="portal-perfin-2026-08.xlsx"`);
    expect(mime).toContain(Buffer.from([1, 2, 3]).toString("base64"));
    expect(mime.trim().endsWith("--fronteira--")).toBe(true);
  });

  it("impede injeção de cabeçalhos pelo assunto", () => {
    const m = montarMime({ assunto: "Oi\r\nBcc: alguem@x.com", corpo: "x" }, "f");
    expect(m).not.toMatch(/\r\nBcc:/);
  });

  it("não tem destinatário (o usuário escolhe no Gmail)", () => {
    expect(mime).not.toMatch(/^To:/m);
  });
});

describe("Agenda", () => {
  it("converte evento com horário e link do Meet", () => {
    const r = converterEvento({
      id: "1", summary: " Comitê ", start: { dateTime: "2026-10-07T14:00:00-03:00" }, end: { dateTime: "2026-10-07T15:00:00-03:00" },
      hangoutLink: "https://meet.google.com/abc", htmlLink: "https://calendar.google.com/x",
    });
    expect(r).toMatchObject({ titulo: "Comitê", diaInteiro: false, linkReuniao: "https://meet.google.com/abc" });
  });

  it("evento de dia inteiro, sem título e links não-https", () => {
    const r = converterEvento({ id: "2", start: { date: "2026-10-08" }, hangoutLink: "javascript:alert(1)" });
    expect(r).toMatchObject({ titulo: "(sem título)", diaInteiro: true, linkReuniao: null });
  });

  it("ignora cancelados e eventos sem início", () => {
    expect(converterEvento({ id: "3", status: "cancelled", start: { date: "2026-10-08" } })).toBeNull();
    expect(converterEvento({ id: "4" })).toBeNull();
  });
});
