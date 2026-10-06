"use client";

import { Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { IndicadorPublico } from "@/types/publico";
import { formatarMesCurto, formatarNumero, formatarValor } from "@/lib/formatacao";

const EIXO = { fontSize: 12, fill: "#6D6E71" };

/** Gráfico de um indicador público (dados já calculados pelo Portal). */
export function GraficoPublico({ indicador }: { indicador: IndicadorPublico }) {
  const linhas = indicador.serie.map((p) => ({
    x: formatarMesCurto(p.mes),
    valor: p.valor,
    faixa: typeof p.piso === "number" && typeof p.teto === "number" ? [p.piso, p.teto] : null,
  }));
  const temFaixa = linhas.some((l) => l.faixa);
  return (
    <div className="grafico" role="img" aria-label={`${indicador.nome}: ${indicador.rotuloSerie}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={linhas} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="#E6E7E8" />
          <XAxis dataKey="x" tick={EIXO} tickLine={false} axisLine={{ stroke: "#E6E7E8" }} minTickGap={24} />
          <YAxis tick={EIXO} tickLine={false} axisLine={false} width={52} domain={["auto", "auto"]}
            tickFormatter={(v: number) => formatarNumero(v, indicador.formato === "brl" ? 2 : 1)} />
          <Tooltip formatter={(v) => (typeof v === "number" ? formatarValor(v, indicador.formato) : "—")} contentStyle={{ borderRadius: 0 }} />
          {temFaixa && <Area dataKey="faixa" name="Banda da meta" fill="#C9D3D9" fillOpacity={0.5} stroke="none" isAnimationActive={false} />}
          {indicador.grafico === "barra" ? (
            <Bar dataKey="valor" name={indicador.rotuloSerie} fill="#415765" isAnimationActive={false} />
          ) : (
            <Line dataKey="valor" name={indicador.rotuloSerie} stroke="#101B2A" strokeWidth={2} dot={false} isAnimationActive={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
