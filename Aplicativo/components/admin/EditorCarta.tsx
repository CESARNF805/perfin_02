import { gravarCarta } from "@/app/(portal)/admin/actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import type { Carta } from "@/services/cartas";

/** Formulário da carta mensal (texto simples; parágrafos separados por linha em branco). */
export function EditorCarta({ carta, mesPadrao }: { carta?: Carta; mesPadrao: string }) {
  const prefixo = carta ? `carta-${carta.id}` : "carta-nova";
  return (
    <details open={!carta}>
      <summary>{carta ? "Editar" : "Escrever nova carta"}</summary>
      <form action={gravarCarta} className="formulario" style={{ maxWidth: 760 }}>
        {carta ? (
          <input type="hidden" name="id" value={carta.id} />
        ) : (
          <>
            <label htmlFor={`${prefixo}-mes`}>Mês de referência</label>
            <input id={`${prefixo}-mes`} name="mes" type="month" defaultValue={mesPadrao} required />
          </>
        )}
        <label htmlFor={`${prefixo}-titulo`}>Título</label>
        <input id={`${prefixo}-titulo`} name="titulo" defaultValue={carta?.titulo} required minLength={3} maxLength={200} />
        <label htmlFor={`${prefixo}-corpo`}>Texto</label>
        <textarea id={`${prefixo}-corpo`} name="corpo" defaultValue={carta?.corpo} required minLength={20} maxLength={20000} rows={12} />
        <div className="acoes-linha">
          <BotaoEnviar variante="secundario" nome="status" valor="rascunho" rotuloEnviando="Salvando…">
            {carta?.status === "publicada" ? "Despublicar (voltar a rascunho)" : "Salvar rascunho"}
          </BotaoEnviar>
          <BotaoEnviar nome="status" valor="publicada" rotuloEnviando="Publicando…">
            {carta?.status === "publicada" ? "Salvar e manter publicada" : "Publicar no site"}
          </BotaoEnviar>
        </div>
      </form>
    </details>
  );
}
