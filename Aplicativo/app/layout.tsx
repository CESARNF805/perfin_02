import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Poppins } from "next/font/google";
import type { ReactNode } from "react";
import { RegistrarServiceWorker } from "@/components/pwa/RegistrarServiceWorker";
import "./globals.css";
import "./estilos/portal.css";
import "./estilos/componentes.css";

const titulo = Poppins({ subsets: ["latin"], weight: ["400", "700"], variable: "--fonte-titulo", display: "swap" });
const corpo = Nunito_Sans({ subsets: ["latin"], weight: ["400", "500", "800"], variable: "--fonte-corpo", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Portal Perfin", template: "%s · Portal Perfin" },
  description: "Central de análise econômica do time Perfin.",
  applicationName: "Portal Perfin",
  appleWebApp: { capable: true, title: "Portal Perfin", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icone-192.png", apple: "/icons/apple-touch-icon.png" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#101B2A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function LayoutRaiz({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${titulo.variable} ${corpo.variable}`}>
      <body>
        {children}
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
