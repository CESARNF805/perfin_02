import "server-only";
import { z } from "zod";

/** Variáveis exclusivas do servidor. Nunca importar este módulo em componentes de cliente. */
const schema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(20),
  GOOGLE_CLIENT_ID: z.string().min(10),
  GOOGLE_CLIENT_SECRET: z.string().min(10),
  ADMIN_USER: z.email().transform((e) => e.toLowerCase()),
  ALLOWED_GOOGLE_DOMAIN: z
    .string()
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i)
    .transform((d) => d.toLowerCase()),
  GEMINI_API_KEY: z.string().min(10),
  GEMINI_MODEL: z.string().min(3).default("gemini-flash-latest"),
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .refine((v) => Buffer.from(v, "base64").length === 32, "precisa ter 32 bytes em base64"),
  CRON_SECRET: z.string().min(16),
  GITHUB_ACTIONS_TOKEN: z.string().min(10).optional(),
  GITHUB_REPO: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/)
    .optional(),
});

export type EnvServidor = z.infer<typeof schema>;

let cache: EnvServidor | null = null;

export function envServidor(): EnvServidor {
  if (cache) return cache;
  const resultado = schema.safeParse(process.env);
  if (!resultado.success) {
    // Só os NOMES das variáveis aparecem na mensagem, nunca os valores.
    const nomes = resultado.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Variáveis de ambiente do servidor ausentes ou inválidas: ${nomes}`);
  }
  cache = resultado.data;
  return cache;
}
