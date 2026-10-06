import { alterarIndicador } from "@/app/(portal)/admin/actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { formatarDataHora } from "@/lib/formatacao";
import type { Indicador } from "@/types/indicadores";
import { UNIDADES } from "./FormNovoIndicador";

export function TabelaIndicadores({ catalogo }: { catalogo: Indicador[] }) {
  return (
    <div className="tabela-rolagem">
      <table className="tabela tabela--cartoes">
        <thead>
          <tr>
            <th scope="col">Indicador</th>
            <th scope="col">Série SGS</th>
            <th scope="col">Unidade</th>
            <th scope="col">Última coleta</th>
            <th scope="col"><span className="visualmente-oculto">Ação</span></th>
          </tr>
        </thead>
        <tbody>
          {catalogo.map((i) => (
            <tr key={i.id}>
              <td data-rotulo="Indicador">{i.nome}{i.ativo ? "" : " (inativo)"}</td>
              <td data-rotulo="Série SGS">{i.serie_sgs ?? "—"}</td>
              <td data-rotulo="Unidade">{UNIDADES[i.unidade]}</td>
              <td data-rotulo="Última coleta" title={i.ultima_coleta_mensagem ?? undefined}>
                {i.ultima_coleta_em ? `${formatarDataHora(i.ultima_coleta_em)} · ${i.ultima_coleta_status === "ok" ? "ok" : "erro"}` : "—"}
              </td>
              <td>
                <form action={alterarIndicador}>
                  <input type="hidden" name="id" value={i.id} />
                  <input type="hidden" name="ativo" value={i.ativo ? "nao" : "sim"} />
                  <BotaoEnviar variante="secundario">{i.ativo ? "Desativar" : "Ativar"}</BotaoEnviar>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
