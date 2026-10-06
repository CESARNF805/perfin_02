/** Montagem de e-mail MIME (multipart com anexo) para a API do Gmail. Funções puras. */

export interface Anexo {
  nome: string;
  tipo: string;
  conteudo: Uint8Array;
}

export interface Mensagem {
  assunto: string;
  corpo: string;
  anexo?: Anexo;
}

/** Cabeçalho com acentos (RFC 2047). */
export function codificarCabecalho(texto: string): string {
  return /^[\x20-\x7e]*$/.test(texto) ? texto : `=?UTF-8?B?${Buffer.from(texto, "utf8").toString("base64")}?=`;
}

function base64EmLinhas(dados: Uint8Array): string {
  return (Buffer.from(dados).toString("base64").match(/.{1,76}/g) ?? []).join("\r\n");
}

export function montarMime({ assunto, corpo, anexo }: Mensagem, fronteira = `perfin_${Date.now().toString(36)}`): string {
  const nomeSeguro = anexo?.nome.replace(/["\r\n]/g, "");
  const partes = [
    "MIME-Version: 1.0",
    `Subject: ${codificarCabecalho(assunto.replace(/[\r\n]/g, " "))}`,
    `Content-Type: multipart/mixed; boundary="${fronteira}"`,
    "",
    `--${fronteira}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    base64EmLinhas(new TextEncoder().encode(corpo)),
  ];
  if (anexo && nomeSeguro) {
    partes.push(
      `--${fronteira}`,
      `Content-Type: ${anexo.tipo}; name="${codificarCabecalho(nomeSeguro)}"`,
      `Content-Disposition: attachment; filename="${codificarCabecalho(nomeSeguro)}"`,
      "Content-Transfer-Encoding: base64",
      "",
      base64EmLinhas(anexo.conteudo),
    );
  }
  partes.push(`--${fronteira}--`, "");
  return partes.join("\r\n");
}

export function paraBase64Url(texto: string): string {
  return Buffer.from(texto, "utf8").toString("base64url");
}
