import "server-only";
import { envServidor } from "@/lib/env";
import type { Resultado } from "@/lib/mensagens-admin";

const WORKFLOW_COLETA = "indicadores.yml";

/** Dispara o workflow de coleta no GitHub Actions (botão "coletar agora" do admin). */
export async function dispararColeta(): Promise<Resultado> {
  const { GITHUB_ACTIONS_TOKEN: token, GITHUB_REPO: repo } = envServidor();
  if (!token || !repo) return { ok: false, erro: "coleta_nao_configurada" };
  const resposta = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${WORKFLOW_COLETA}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ ref: "main" }),
    cache: "no-store",
  });
  return resposta.status === 204 ? { ok: true } : { ok: false, erro: "coleta_recusada" };
}
