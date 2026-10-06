import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CadastroMfa } from "@/components/admin/CadastroMfa";
import { FormCodigoMfa } from "@/components/admin/FormCodigoMfa";
import { obterSessao } from "@/lib/auth/sessao";
import { clienteSupabase } from "@/lib/supabase/servidor";

export const metadata: Metadata = { title: "Verificação em duas etapas" };

export default async function PaginaMfa() {
  const sessao = await obterSessao();
  if (!sessao) redirect("/admin/login");
  if (sessao.ehAdmin) redirect("/admin");
  if (!sessao.sessaoSenha || sessao.papel !== "admin") redirect("/acesso-negado?motivo=admin");

  const db = await clienteSupabase();
  const { data } = await db.auth.mfa.listFactors();
  const fator = data?.totp.find((f) => f.status === "verified");

  return (
    <main className="tela-entrada">
      <section className="tela-entrada__caixa" aria-labelledby="titulo-mfa">
        <p className="marca">Perfin</p>
        <h1 id="titulo-mfa">Verificação em duas etapas</h1>
        {fator ? (
          <>
            <p className="texto-apoio">Digite o código de 6 dígitos do seu aplicativo autenticador.</p>
            <FormCodigoMfa factorId={fator.id} />
          </>
        ) : (
          <CadastroMfa />
        )}
      </section>
    </main>
  );
}
