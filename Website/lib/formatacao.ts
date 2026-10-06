/** Formatação pt-BR do site (função única para todo o projeto Website). */
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MESES_ABREV = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function formatarNumero(valor: number | null | undefined, casas = 2): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return "—";
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(valor);
}

export function formatarValor(valor: number | null | undefined, formato: "pct" | "brl"): string {
  const texto = formatarNumero(valor, formato === "brl" ? 4 : 2);
  if (texto === "—") return texto;
  return formato === "brl" ? `R$ ${texto}` : `${texto}%`;
}

/** "2026-08" → "ago/2026" */
export function formatarMesCurto(mes: string): string {
  const [ano, m] = mes.split("-");
  return `${MESES_ABREV[Number(m) - 1] ?? m}/${ano}`;
}

/** "2026-08-01" → "agosto 2026" */
export function formatarMesExtenso(data: string): string {
  const [ano, m] = data.split("-");
  return `${MESES[Number(m) - 1] ?? m} ${ano}`;
}

/** Instante → "6 outubro 2026" (padrão de datas da marca Perfin). */
export function formatarDataExtenso(instante: string): string {
  const partes = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "numeric", month: "long", year: "numeric" })
    .formatToParts(new Date(instante));
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${valor("day")} ${valor("month")} ${valor("year")}`;
}

/** Texto simples → parágrafos (separados por linha em branco). Nunca interpreta HTML. */
export function paragrafos(texto: string): string[] {
  return texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
