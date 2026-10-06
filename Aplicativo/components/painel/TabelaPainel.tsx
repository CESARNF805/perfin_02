import type { TabelaDados } from "@/types/visualizacao";
import { formatarValor } from "@/lib/formatacao";

export function TabelaPainel({ titulo, tabela }: { titulo: string; tabela: TabelaDados }) {
  return (
    <section className="cartao" aria-labelledby="titulo-tabela">
      <h2 id="titulo-tabela">{titulo}</h2>
      {tabela.linhas.length === 0 ? (
        <p className="texto-apoio">Sem dados.</p>
      ) : (
        <div className="tabela-rolagem">
          <table className="tabela tabela--cartoes">
            <thead>
              <tr>
                {tabela.colunas.map((c) => (
                  <th key={c.chave} scope="col" className={c.formato ? "numero" : undefined}>
                    {c.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabela.linhas.map((linha) => (
                <tr key={linha.id}>
                  {tabela.colunas.map((c) => {
                    const valor = linha[c.chave];
                    return (
                      <td key={c.chave} data-rotulo={c.titulo} className={c.formato ? "numero" : undefined}>
                        {c.formato ? formatarValor(typeof valor === "number" ? valor : null, c.formato) : (valor ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
