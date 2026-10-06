import { gravarSelecaoPublica } from "@/app/(portal)/admin/actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import type { Indicador } from "@/types/indicadores";
import type { SelecaoPublica } from "@/types/publicacao";

/** Escolha dos indicadores do painel público (visível, ordem e tipo de gráfico). */
export function TabelaSelecaoPublica({ catalogo, selecao }: { catalogo: Indicador[]; selecao: SelecaoPublica[] }) {
  const porId = new Map(selecao.map((s) => [s.indicador_id, s]));
  return (
    <form action={gravarSelecaoPublica}>
      <div className="tabela-rolagem">
        <table className="tabela tabela--cartoes">
          <thead>
            <tr>
              <th scope="col">Indicador</th>
              <th scope="col">Público</th>
              <th scope="col">Ordem</th>
              <th scope="col">Gráfico</th>
            </tr>
          </thead>
          <tbody>
            {catalogo.map((i) => {
              const atual = porId.get(i.id);
              return (
                <tr key={i.id}>
                  <td data-rotulo="Indicador">
                    {i.nome}
                    <input type="hidden" name="indicador_id" value={i.id} />
                  </td>
                  <td data-rotulo="Público">
                    <input type="checkbox" name={`visivel_${i.id}`} defaultChecked={Boolean(atual?.visivel)} aria-label={`Publicar ${i.nome}`} />
                  </td>
                  <td data-rotulo="Ordem">
                    <input type="number" name={`ordem_${i.id}`} defaultValue={atual?.ordem ?? i.ordem} min={0} max={10000} style={{ width: 80 }} aria-label={`Ordem de ${i.nome}`} />
                  </td>
                  <td data-rotulo="Gráfico">
                    <select name={`grafico_${i.id}`} defaultValue={atual?.grafico ?? "linha"} aria-label={`Gráfico de ${i.nome}`}>
                      <option value="linha">Linha (acumulado 12m / nível)</option>
                      <option value="barra">Barras (valor do mês)</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <BotaoEnviar rotuloEnviando="Publicando…">Salvar e publicar</BotaoEnviar>
    </form>
  );
}
