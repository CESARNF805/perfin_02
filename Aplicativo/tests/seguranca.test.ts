import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cifrar, decifrar } from "@/lib/cripto";
import { ehEmailAdmin, emailDoDominio, googleAutorizado, sessaoComSenhaEMfa } from "@/lib/auth/regras";
import { rotaPublica } from "@/lib/supabase/proxy";

const CHAVE = Buffer.alloc(32, 7).toString("base64");

describe("criptografia de tokens", () => {
  it("cifra e decifra", () => {
    const pacote = cifrar("token-secreto", CHAVE);
    expect(pacote).not.toContain("token-secreto");
    expect(decifrar(pacote, CHAVE)).toBe("token-secreto");
  });

  it("cada cifragem usa IV novo", () => {
    expect(cifrar("x", CHAVE)).not.toBe(cifrar("x", CHAVE));
  });

  it("detecta adulteração e chave errada", () => {
    const pacote = cifrar("token", CHAVE);
    const partes = pacote.split(".");
    partes[3] = Buffer.from("outro").toString("base64url");
    expect(() => decifrar(partes.join("."), CHAVE)).toThrow();
    expect(() => decifrar(pacote, Buffer.alloc(32, 8).toString("base64"))).toThrow();
    expect(() => decifrar("lixo", CHAVE)).toThrow();
  });

  it("rejeita chave de tamanho errado", () => {
    expect(() => cifrar("x", Buffer.alloc(16).toString("base64"))).toThrow();
  });
});

describe("regras de acesso", () => {
  it("domínio exato, sem sufixos parecidos", () => {
    expect(emailDoDominio("Ana@Perfin.com.br", "perfin.com.br")).toBe(true);
    expect(emailDoDominio("ana@perfin.com.br.evil.com", "perfin.com.br")).toBe(false);
    expect(emailDoDominio("ana@sub.perfin.com.br", "perfin.com.br")).toBe(false);
    expect(emailDoDominio("ana@evilperfin.com.br", "perfin.com.br")).toBe(false);
    expect(emailDoDominio("a@b@perfin.com.br", "perfin.com.br")).toBe(false);
    expect(emailDoDominio("@perfin.com.br", "perfin.com.br")).toBe(false);
    expect(emailDoDominio(null, "perfin.com.br")).toBe(false);
  });

  it("Google exige e-mail verificado e conta do Workspace (hd)", () => {
    expect(googleAutorizado({ email: "a@perfin.com.br", emailVerificado: true, dominioHospedado: "perfin.com.br" }, "perfin.com.br")).toBe(true);
    expect(googleAutorizado({ email: "a@perfin.com.br", emailVerificado: false, dominioHospedado: "perfin.com.br" }, "perfin.com.br")).toBe(false);
    // Bug do review: conta Google pessoal criada com e-mail @perfin (sem hd) era aceita.
    expect(googleAutorizado({ email: "ex@perfin.com.br", emailVerificado: true, dominioHospedado: null }, "perfin.com.br")).toBe(false);
    expect(googleAutorizado({ email: "ex@perfin.com.br", emailVerificado: true }, "perfin.com.br")).toBe(false);
    expect(googleAutorizado({ email: "a@perfin.com.br", emailVerificado: true, dominioHospedado: "outra.com" }, "perfin.com.br")).toBe(false);
    expect(googleAutorizado({ email: "a@gmail.com", emailVerificado: true }, "perfin.com.br")).toBe(false);
  });

  it("e-mail do admin: comparação exata sem diferenciar maiúsculas", () => {
    expect(ehEmailAdmin(" Admin@Perfin.com.br ", "admin@perfin.com.br")).toBe(true);
    expect(ehEmailAdmin("", "")).toBe(false);
    expect(ehEmailAdmin("outro@perfin.com.br", "admin@perfin.com.br")).toBe(false);
  });

  it("poder de admin só com senha + MFA (aal2); Google nunca conta", () => {
    expect(sessaoComSenhaEMfa({ sub: "1", aal: "aal2", amr: [{ method: "password" }, { method: "totp" }] })).toBe(true);
    expect(sessaoComSenhaEMfa({ sub: "1", aal: "aal1", amr: [{ method: "password" }] })).toBe(false);
    expect(sessaoComSenhaEMfa({ sub: "1", aal: "aal2", amr: [{ method: "oauth" }, { method: "totp" }] })).toBe(false);
    expect(sessaoComSenhaEMfa({ sub: "1" })).toBe(false);
  });

  it("rotas públicas do proxy", () => {
    expect(rotaPublica("/login")).toBe(true);
    expect(rotaPublica("/admin/login")).toBe(true);
    expect(rotaPublica("/api/cron/painel-publico")).toBe(true);
    expect(rotaPublica("/loginx")).toBe(false);
    expect(rotaPublica("/admin/usuarios")).toBe(false);
    expect(rotaPublica("/api/assistente")).toBe(false);
    expect(rotaPublica("/")).toBe(false);
  });
});

function arquivosFonte(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return ["node_modules", ".next"].includes(nome) ? [] : arquivosFonte(caminho);
    return /\.(ts|tsx)$/.test(nome) ? [caminho] : [];
  });
}

describe("Gmail: o portal nunca envia e-mails", () => {
  it("nenhum código chama endpoints de envio do Gmail", () => {
    const raiz = join(__dirname, "..");
    const codigo = ["app", "lib", "services", "components"]
      .flatMap((p) => arquivosFonte(join(raiz, p)))
      .map((arquivo) => readFileSync(arquivo, "utf8"));
    for (const texto of codigo) {
      expect(texto).not.toMatch(/messages\/send|drafts\/send|messages\.send|drafts\.send/i);
    }
  });
});
