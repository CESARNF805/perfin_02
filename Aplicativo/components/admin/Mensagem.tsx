import { textoMensagem } from "@/lib/mensagens-admin";

/** Mensagem de retorno das ações do admin: só exibe textos fixos conhecidos (a URL traz apenas o código). */
export function Mensagem({ ok, erro }: { ok?: string; erro?: string }) {
  const textoErro = textoMensagem(erro);
  if (textoErro) return <p className="alerta" role="alert">{textoErro}</p>;
  const textoOk = textoMensagem(ok);
  if (textoOk) return <p className="sucesso" role="status">{textoOk}</p>;
  return null;
}
