import type { ReactNode } from "react";
import { exigirAdmin } from "@/lib/auth/sessao";

export default async function LayoutAdmin({ children }: { children: ReactNode }) {
  await exigirAdmin();
  return children;
}
