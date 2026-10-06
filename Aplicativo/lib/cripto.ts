import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** Cifra simétrica AES-256-GCM para guardar tokens. Formato: v1.<iv>.<tag>.<conteúdo> (base64url). */
const VERSAO = "v1";
const ALGORITMO = "aes-256-gcm";

function chaveDe(chaveBase64: string): Buffer {
  const chave = Buffer.from(chaveBase64, "base64");
  if (chave.length !== 32) throw new Error("Chave de criptografia inválida.");
  return chave;
}

export function cifrar(texto: string, chaveBase64: string): string {
  const iv = randomBytes(12);
  const cifra = createCipheriv(ALGORITMO, chaveDe(chaveBase64), iv);
  const conteudo = Buffer.concat([cifra.update(texto, "utf8"), cifra.final()]);
  return [VERSAO, iv.toString("base64url"), cifra.getAuthTag().toString("base64url"), conteudo.toString("base64url")].join(".");
}

export function decifrar(pacote: string, chaveBase64: string): string {
  const [versao, iv, tag, conteudo] = pacote.split(".");
  if (versao !== VERSAO || !iv || !tag || !conteudo) throw new Error("Formato de dado cifrado inválido.");
  const decifra = createDecipheriv(ALGORITMO, chaveDe(chaveBase64), Buffer.from(iv, "base64url"));
  decifra.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decifra.update(Buffer.from(conteudo, "base64url")), decifra.final()]).toString("utf8");
}
