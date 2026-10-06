import { criarRascunhoGmail } from "@/app/(portal)/relatorios/actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { formatarDataHora, formatarMes } from "@/lib/formatacao";
import type { Relatorio } from "@/types/google";

export function ListaRelatorios({ relatorios }: { relatorios: Relatorio[] }) {
  if (relatorios.length === 0) return <p className="texto-apoio">Nenhum relatório gerado ainda.</p>;
  return (
    <ul className="lista-simples">
      {relatorios.map((r) => (
        <li key={r.id}>
          <h3>{formatarMes(r.mes_referencia.slice(0, 7))}</h3>
          <p className="texto-legal">
            Gerado em {formatarDataHora(r.criado_em)}
            {r.rascunho_gmail_id ? " · rascunho criado" : ""}
          </p>
          <div className="acoes-linha">
            <a href={r.planilha_url} target="_blank" rel="noopener noreferrer">Abrir planilha</a>
            <a href={`/api/relatorios/${r.id}/xlsx`} download>Baixar Excel (.xlsx)</a>
            <form action={criarRascunhoGmail}>
              <input type="hidden" name="id" value={r.id} />
              <BotaoEnviar variante="secundario" rotuloEnviando="Criando rascunho…">Criar rascunho no Gmail</BotaoEnviar>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
