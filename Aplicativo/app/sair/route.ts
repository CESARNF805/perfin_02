import { NextResponse } from "next/server";
import { envPublico } from "@/lib/env-publico";
import { clienteSupabase } from "@/lib/supabase/servidor";

/** Encerra a sessão (POST, para não ser disparado por links ou pré-carregamento). */
export async function POST() {
  const db = await clienteSupabase();
  await db.auth.signOut();
  return NextResponse.redirect(`${envPublico().NEXT_PUBLIC_SITE_URL}/login`, { status: 303 });
}
