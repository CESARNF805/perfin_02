import { reunioesDoUsuario } from "@/lib/google/servico";
import { ListaReunioes } from "./ListaReunioes";
import { ReconectarGoogle } from "./ReconectarGoogle";

/** Bloco assíncrono (usado dentro de Suspense) com as próximas reuniões do usuário. */
export async function ProximasReunioes({ userId, dias = 7, limite = 10 }: { userId: string; dias?: number; limite?: number }) {
  const resultado = await reunioesDoUsuario(userId, dias, limite);
  if (!resultado.ok) return <ReconectarGoogle motivo={resultado.motivo} />;
  return <ListaReunioes reunioes={resultado.dados} />;
}
