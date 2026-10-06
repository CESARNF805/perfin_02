import type { Metadata } from "next";
import { BotaoEnviar } from "@/components/BotaoEnviar";
import { Mensagem } from "@/components/admin/Mensagem";
import { formatarDataHora } from "@/lib/formatacao";
import { clienteSupabase } from "@/lib/supabase/servidor";
import { listarPerfis } from "@/services/admin";
import { alterarBloqueio } from "../actions";

export const metadata: Metadata = { title: "Usuários" };

export default async function PaginaUsuarios({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const [perfis, params] = await Promise.all([listarPerfis(await clienteSupabase()), searchParams]);
  return (
    <>
      <div className="cabecalho-pagina">
        <div>
          <h1>Usuários</h1>
          <p className="texto-apoio">Quem acessa o portal. Contas Google @perfin.com.br entram automaticamente; bloqueie quem não deve acessar.</p>
        </div>
      </div>
      <Mensagem {...params} />
      <section className="cartao">
        <div className="tabela-rolagem">
          <table className="tabela tabela--cartoes">
            <thead>
              <tr>
                <th scope="col">Usuário</th>
                <th scope="col">Papel</th>
                <th scope="col">Último acesso</th>
                <th scope="col">Situação</th>
                <th scope="col"><span className="visualmente-oculto">Ação</span></th>
              </tr>
            </thead>
            <tbody>
              {perfis.map((p) => (
                <tr key={p.user_id}>
                  <td data-rotulo="Usuário">{p.nome ? `${p.nome} · ${p.email}` : p.email}</td>
                  <td data-rotulo="Papel">{p.papel === "admin" ? "Administrador" : "Usuário"}</td>
                  <td data-rotulo="Último acesso">{p.ultimo_acesso ? formatarDataHora(p.ultimo_acesso) : "—"}</td>
                  <td data-rotulo="Situação">{p.bloqueado ? "Bloqueado" : "Ativo"}</td>
                  <td>
                    {p.papel === "usuario" && (
                      <form action={alterarBloqueio}>
                        <input type="hidden" name="userId" value={p.user_id} />
                        <input type="hidden" name="bloquear" value={p.bloqueado ? "nao" : "sim"} />
                        <BotaoEnviar variante="secundario">{p.bloqueado ? "Liberar" : "Bloquear"}</BotaoEnviar>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
