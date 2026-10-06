/** Regras puras de acesso (testáveis sem servidor). */

export interface ClaimsSessao {
  sub: string;
  email?: string;
  aal?: string;
  amr?: { method: string; timestamp?: number }[];
}

export function normalizarEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/** E-mail pertence exatamente ao domínio permitido (sem aceitar subdomínios ou sufixos parecidos). */
export function emailDoDominio(email: string | null | undefined, dominio: string): boolean {
  const normalizado = normalizarEmail(email);
  const partes = normalizado.split("@");
  return partes.length === 2 && partes[0]!.length > 0 && partes[1] === dominio.toLowerCase();
}

export function ehEmailAdmin(email: string | null | undefined, adminUser: string): boolean {
  return normalizarEmail(email) !== "" && normalizarEmail(email) === normalizarEmail(adminUser);
}

/** Sessão de admin = login por senha + segundo fator (aal2). Login Google nunca conta. */
export function sessaoComSenhaEMfa(claims: ClaimsSessao): boolean {
  const usouSenha = (claims.amr ?? []).some((m) => m.method === "password");
  return claims.aal === "aal2" && usouSenha;
}

export function sessaoComSenha(claims: ClaimsSessao): boolean {
  return (claims.amr ?? []).some((m) => m.method === "password");
}

export interface IdentidadeGoogle {
  email: string | null | undefined;
  emailVerificado: boolean;
  dominioHospedado?: string | null;
}

/**
 * Login Google aceito: e-mail verificado do domínio E conta do Workspace (claim `hd`).
 * Sem `hd` é conta Google pessoal criada com o endereço corporativo — recusada.
 */
export function googleAutorizado(identidade: IdentidadeGoogle, dominio: string): boolean {
  if (!identidade.emailVerificado || !emailDoDominio(identidade.email, dominio)) return false;
  return (identidade.dominioHospedado ?? "").toLowerCase() === dominio.toLowerCase();
}
