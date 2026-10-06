import { NextResponse } from "next/server";
import { obterSessao } from "@/lib/auth/sessao";
import { gerarTextoStream } from "@/lib/gemini";
import { criarLimitador } from "@/lib/limite";
import { clienteSupabase } from "@/lib/supabase/servidor";
import { INSTRUCAO_SISTEMA, montarContexto, pedidoAssistenteSchema } from "@/services/assistente";
import { carregarDados } from "@/services/indicadores";
import { gerarInsights } from "@/services/insights";
import { inicioVisaoGeral } from "@/services/painel/visaoGeral";
import { periodoParaParametros, resolverPeriodo } from "@/services/periodo";

export const maxDuration = 60;

/** Até 20 perguntas a cada 10 minutos por usuário (por instância). */
const permitir = criarLimitador(20, 10 * 60 * 1000);

/** Chat com o Gemini. Os dados são recarregados no servidor com o período pedido (nada vem do navegador). */
export async function POST(request: Request) {
  const sessao = await obterSessao();
  if (!sessao?.membro) return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  if (!permitir(sessao.userId)) return NextResponse.json({ erro: "Muitas perguntas seguidas. Aguarde alguns minutos." }, { status: 429 });

  const corpo = await request.json().catch(() => null);
  const pedido = pedidoAssistenteSchema.safeParse(corpo);
  if (!pedido.success) return NextResponse.json({ erro: "Pergunta inválida." }, { status: 400 });

  const periodo = resolverPeriodo(periodoParaParametros(pedido.data.periodo));
  const inicioCarga = periodo.inicio < inicioVisaoGeral(periodo.fim) ? periodo.inicio : inicioVisaoGeral(periodo.fim);
  const dados = await carregarDados(await clienteSupabase(), inicioCarga, periodo.fim);
  const contexto = montarContexto(dados, periodo, gerarInsights(dados, periodo.fim));

  const codificador = new TextEncoder();
  const fluxo = new ReadableStream<Uint8Array>({
    async start(controle) {
      try {
        for await (const parte of gerarTextoStream({
          sistema: `${INSTRUCAO_SISTEMA}\n\n${contexto}`,
          mensagens: [...pedido.data.historico, { papel: "usuario", texto: pedido.data.pergunta }],
        })) {
          controle.enqueue(codificador.encode(parte));
        }
      } catch {
        controle.enqueue(codificador.encode("\n\nNão foi possível concluir a resposta agora. Tente novamente."));
      } finally {
        controle.close();
      }
    },
  });
  return new Response(fluxo, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
