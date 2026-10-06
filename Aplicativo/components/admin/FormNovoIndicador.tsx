import { novoIndicador } from "@/app/(portal)/admin/actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";

export const UNIDADES = { pct_am: "% ao mês", pct_ad: "% ao dia", pct_aa: "% ao ano", brl: "R$" } as const;

/** Cadastro de nova série do SGS (validada também no servidor). */
export function FormNovoIndicador() {
  return (
    <form action={novoIndicador} className="formulario">
      <label htmlFor="id">Identificador (ex.: ibc_br)</label>
      <input id="id" name="id" required pattern="[a-z0-9_]{2,40}" />
      <label htmlFor="nome">Nome</label>
      <input id="nome" name="nome" required maxLength={80} />
      <label htmlFor="serie_sgs">Código SGS</label>
      <input id="serie_sgs" name="serie_sgs" type="number" min={1} required />
      <label htmlFor="grupo">Grupo</label>
      <select id="grupo" name="grupo" defaultValue="outros">
        <option value="inflacao">Inflação</option>
        <option value="juros">Juros</option>
        <option value="cambio">Câmbio</option>
        <option value="atividade">Atividade</option>
        <option value="outros">Outros</option>
      </select>
      <label htmlFor="unidade">Unidade</label>
      <select id="unidade" name="unidade" defaultValue="pct_am">
        {Object.entries(UNIDADES).map(([valor, rotulo]) => (
          <option key={valor} value={valor}>{rotulo}</option>
        ))}
      </select>
      <label htmlFor="periodicidade">Periodicidade</label>
      <select id="periodicidade" name="periodicidade" defaultValue="mensal">
        <option value="mensal">Mensal</option>
        <option value="diaria">Diária</option>
      </select>
      <BotaoEnviar rotuloEnviando="Salvando…">Cadastrar</BotaoEnviar>
    </form>
  );
}
