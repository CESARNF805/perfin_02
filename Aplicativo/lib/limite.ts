/**
 * Limite simples de requisições por chave (ex.: usuário) dentro de uma janela de tempo.
 * Em memória: vale por instância do servidor — contém abusos óbvios, não é um limite global.
 */
export function criarLimitador(maximo: number, janelaMs: number) {
  const registros = new Map<string, number[]>();
  return function permitir(chave: string, agora: number = Date.now()): boolean {
    const recentes = (registros.get(chave) ?? []).filter((t) => agora - t < janelaMs);
    if (recentes.length >= maximo) {
      registros.set(chave, recentes);
      return false;
    }
    recentes.push(agora);
    registros.set(chave, recentes);
    return true;
  };
}
