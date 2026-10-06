"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { Periodo, PresetPeriodo } from "@/types/indicadores";
import { PRESETS, periodoParaParametros } from "@/services/periodo";

/** Filtro global de período: grava a escolha na URL (vale para todas as telas e para o assistente). */
export function FiltroPeriodo({ periodo }: { periodo: Periodo }) {
  const router = useRouter();
  const caminho = usePathname();
  const [pendente, iniciar] = useTransition();
  const [preset, setPreset] = useState<PresetPeriodo>(periodo.preset);
  const [de, setDe] = useState(periodo.inicio);
  const [ate, setAte] = useState(periodo.fim);

  function aplicar(novo: PresetPeriodo, inicio = de, fim = ate) {
    const params = periodoParaParametros({ preset: novo, inicio, fim });
    iniciar(() => router.push(`${caminho}?${new URLSearchParams(params)}`));
  }

  return (
    <form
      className="filtro"
      aria-busy={pendente}
      onSubmit={(e) => {
        e.preventDefault();
        aplicar(preset);
      }}
    >
      <label>
        Período
        <select
          value={preset}
          onChange={(e) => {
            const novo = e.target.value as PresetPeriodo;
            setPreset(novo);
            if (novo !== "personalizado") aplicar(novo);
          }}
        >
          {PRESETS.map((p) => (
            <option key={p.valor} value={p.valor}>
              {p.rotulo}
            </option>
          ))}
        </select>
      </label>
      {preset === "personalizado" && (
        <>
          <label>
            De
            <input type="month" value={de} min="2010-01" max={periodo.fim} onChange={(e) => setDe(e.target.value)} required />
          </label>
          <label>
            Até
            <input type="month" value={ate} min="2010-01" max={periodo.fim} onChange={(e) => setAte(e.target.value)} required />
          </label>
          <button type="submit" className="botao botao--secundario">
            Aplicar
          </button>
        </>
      )}
    </form>
  );
}
