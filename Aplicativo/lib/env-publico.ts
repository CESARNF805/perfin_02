/** Variáveis públicas (NEXT_PUBLIC_*). Podem chegar ao navegador. */
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().transform((url) => url.replace(/\/+$/, "")),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(10),
});

export type EnvPublico = z.infer<typeof schema>;

let cache: EnvPublico | null = null;

export function envPublico(): EnvPublico {
  if (cache) return cache;
  // Referências explícitas: o Next.js só embute no bundle as variáveis escritas por extenso.
  const resultado = schema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!resultado.success) {
    const nomes = resultado.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Variáveis de ambiente públicas ausentes ou inválidas: ${nomes}`);
  }
  cache = resultado.data;
  return cache;
}
