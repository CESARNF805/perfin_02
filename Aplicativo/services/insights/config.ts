/** Limites das regras de insights (ajuste aqui, sem mexer nas regras). */
export const CONFIG_INSIGHTS = {
  /** Janela, em meses, para frases do tipo "maior nível desde …". */
  janelaHistoricaMeses: 120,
  /** Mínimo de meses para considerar um recorde relevante. */
  recordeMinimoMeses: 12,
  /** Variação mensal do dólar (%) a partir da qual vira insight. */
  variacaoDolarRelevante: 2,
  /** Surpresa do IPCA (p.p.) a partir da qual vira insight. */
  surpresaIpcaRelevante: 0.05,
  /** Revisão do Focus em 4 semanas (p.p.) a partir da qual vira insight. */
  revisaoFocusRelevante: 0.2,
  /** Semanas seguidas de revisão na mesma direção para virar insight. */
  sequenciaFocusRelevante: 3,
  /** Spread IGP-M − IPCA 12m (p.p.) a partir do qual vira insight. */
  spreadIgpmRelevante: 1,
} as const;
