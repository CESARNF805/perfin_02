import { entrarComGoogle } from "@/app/(auth)/login/actions";
import { BotaoEnviar } from "@/components/BotaoEnviar";

export function ReconectarGoogle({ motivo }: { motivo: "desconectado" | "falha" }) {
  if (motivo === "falha") {
    return <p className="texto-apoio">O Google não respondeu agora. Tente novamente em instantes.</p>;
  }
  return (
    <div className="acoes-linha">
      <p className="texto-apoio" style={{ margin: 0 }}>
        Conecte sua conta Google da Perfin para usar Agenda, Planilhas e Gmail.
      </p>
      <form action={entrarComGoogle}>
        <BotaoEnviar variante="secundario" rotuloEnviando="Redirecionando…">
          Conectar Google
        </BotaoEnviar>
      </form>
    </div>
  );
}
