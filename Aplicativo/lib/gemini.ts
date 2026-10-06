import "server-only";
import { GoogleGenAI } from "@google/genai";
import { envServidor } from "@/lib/env";

export interface MensagemChat {
  papel: "usuario" | "assistente";
  texto: string;
}

interface Pedido {
  sistema: string;
  mensagens: MensagemChat[];
  maxTokens?: number;
}

function cliente() {
  return new GoogleGenAI({ apiKey: envServidor().GEMINI_API_KEY });
}

function montarRequisicao({ sistema, mensagens, maxTokens = 1500 }: Pedido) {
  return {
    model: envServidor().GEMINI_MODEL,
    contents: mensagens.map((m) => ({ role: m.papel === "usuario" ? "user" : "model", parts: [{ text: m.texto }] })),
    config: { systemInstruction: sistema, temperature: 0.2, maxOutputTokens: maxTokens },
  };
}

/** Resposta do Gemini em partes (streaming). */
export async function* gerarTextoStream(pedido: Pedido): AsyncGenerator<string> {
  const stream = await cliente().models.generateContentStream(montarRequisicao(pedido));
  for await (const parte of stream) {
    if (parte.text) yield parte.text;
  }
}

/** Resposta completa do Gemini. */
export async function gerarTexto(pedido: Pedido): Promise<string> {
  const resposta = await cliente().models.generateContent(montarRequisicao(pedido));
  return resposta.text ?? "";
}
