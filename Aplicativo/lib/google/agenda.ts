import "server-only";
import type { Reuniao } from "@/types/google";
import { googleJson } from "./http";

const URL_EVENTOS = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

interface EventoGoogle {
  id: string;
  summary?: string;
  status?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  hangoutLink?: string;
  location?: string;
  htmlLink?: string;
}

export function converterEvento(e: EventoGoogle): Reuniao | null {
  const inicio = e.start?.dateTime ?? e.start?.date;
  if (!inicio || e.status === "cancelled") return null;
  return {
    id: e.id,
    titulo: e.summary?.trim() || "(sem título)",
    inicio,
    fim: e.end?.dateTime ?? e.end?.date ?? null,
    diaInteiro: !e.start?.dateTime,
    linkReuniao: e.hangoutLink?.startsWith("https://") ? e.hangoutLink : null,
    linkAgenda: e.htmlLink?.startsWith("https://") ? e.htmlLink : null,
    local: e.location ?? null,
  };
}

/** Próximas reuniões da agenda principal do usuário logado. */
export async function listarProximasReunioes(token: string, dias = 7, limite = 10): Promise<Reuniao[]> {
  const agora = new Date();
  const ate = new Date(agora.getTime() + dias * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    timeMin: agora.toISOString(),
    timeMax: ate.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: String(limite),
  });
  const corpo = await googleJson<{ items?: EventoGoogle[] }>("Agenda", token, `${URL_EVENTOS}?${params}`);
  return (corpo.items ?? []).map(converterEvento).filter((r): r is Reuniao => r !== null);
}
