import "server-only";
import type { Aba } from "@/services/relatorio";
import { googleFetch, googleJson } from "./http";

const PASTA_RELATORIOS = "Portal Perfin – Relatórios";
const MIME_PASTA = "application/vnd.google-apps.folder";
export const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/** Pasta do app no Drive (com drive.file o app só enxerga o que ele mesmo criou). */
async function obterPasta(token: string): Promise<string> {
  const q = `name = '${PASTA_RELATORIOS}' and mimeType = '${MIME_PASTA}' and trashed = false`;
  const busca = await googleJson<{ files?: { id: string }[] }>(
    "Drive", token, `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({ q, fields: "files(id)", pageSize: "1" })}`,
  );
  const existente = busca.files?.[0]?.id;
  if (existente) return existente;
  const criada = await googleJson<{ id: string }>("Drive", token, "https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    body: JSON.stringify({ name: PASTA_RELATORIOS, mimeType: MIME_PASTA }),
  });
  return criada.id;
}

function formatacaoCabecalho(sheetId: number) {
  return [
    { repeatCell: { range: { sheetId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: "userEnteredFormat.textFormat.bold" } },
    { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1 } }, fields: "gridProperties.frozenRowCount" } },
    { autoResizeDimensions: { dimensions: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 10 } } },
  ];
}

/** Cria a planilha com as abas do relatório, formata e move para a pasta do app. */
export async function criarPlanilha(token: string, titulo: string, abas: Aba[]): Promise<{ id: string; url: string }> {
  const criada = await googleJson<{ spreadsheetId: string; spreadsheetUrl: string; sheets: { properties: { sheetId: number } }[] }>(
    "Planilhas", token, "https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      body: JSON.stringify({
        properties: { title: titulo, locale: "pt_BR", timeZone: "America/Sao_Paulo" },
        sheets: abas.map((a, i) => ({ properties: { title: a.titulo, index: i } })),
      }),
    },
  );
  const id = criada.spreadsheetId;
  await googleJson("Planilhas", token, `https://sheets.googleapis.com/v4/spreadsheets/${id}/values:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: abas.map((a) => ({ range: `'${a.titulo}'!A1`, values: a.linhas.map((l) => l.map((c) => c ?? "")) })),
    }),
  });
  await googleJson("Planilhas", token, `https://sheets.googleapis.com/v4/spreadsheets/${id}:batchUpdate`, {
    method: "POST",
    body: JSON.stringify({ requests: criada.sheets.flatMap((s) => formatacaoCabecalho(s.properties.sheetId)) }),
  });
  const pasta = await obterPasta(token);
  await googleFetch("Drive", token, `https://www.googleapis.com/drive/v3/files/${id}?addParents=${pasta}&removeParents=root&fields=id`, {
    method: "PATCH",
  });
  return { id, url: criada.spreadsheetUrl };
}

/** Exporta a planilha como .xlsx pelo próprio Drive (sem biblioteca de Excel). */
export async function exportarXlsx(token: string, planilhaId: string): Promise<ArrayBuffer> {
  if (!/^[\w-]{10,}$/.test(planilhaId)) throw new Error("Identificador de planilha inválido.");
  const resposta = await googleFetch(
    "Drive", token, `https://www.googleapis.com/drive/v3/files/${planilhaId}/export?mimeType=${encodeURIComponent(MIME_XLSX)}`,
  );
  return resposta.arrayBuffer();
}
