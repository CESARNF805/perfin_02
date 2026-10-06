import "server-only";
import { googleJson } from "./http";
import { montarMime, paraBase64Url, type Mensagem } from "./mime";

/**
 * Cria SOMENTE um rascunho no Gmail do usuário. Este módulo nunca envia e-mails:
 * não existe chamada a endpoints de envio (há teste automatizado garantindo isso).
 */
export async function criarRascunho(token: string, mensagem: Mensagem): Promise<string> {
  const corpo = await googleJson<{ id: string }>("Gmail", token, "https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
    method: "POST",
    body: JSON.stringify({ message: { raw: paraBase64Url(montarMime(mensagem)) } }),
  });
  return corpo.id;
}
