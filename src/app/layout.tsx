import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.masterplanalmabeach.com"),
  title: "Showroom Master Plan Alma Beach | Real Estate Colombia",
  description:
    "Explora nuestros proyectos inmobiliarios de lujo en Cartagena. Visualiza los lotes y villas en nuestro Showroom interactivo 3D.",
  openGraph: {
    title: "Showroom Master Plan Alma Beach | Real Estate Colombia",
    description:
      "Explora nuestros proyectos inmobiliarios de lujo en Cartagena. Visualiza los lotes y villas en nuestro Showroom interactivo 3D.",
    images: [
      {
        url: "/loom/hero_poster_loom.webp",
        width: 1200,
        height: 630,
        alt: "Showroom Master Plan Alma Beach | Loom Luxury Residence",
      },
    ],
  },
};

import LegalFooter from "@/components/LegalFooter";
import CookieBanner from "@/components/CookieBanner";
import ClientScripts from "@/components/ClientScripts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${playfair.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning className="antialiased">
        <ClientScripts />
        {children}
        <LegalFooter />
        <CookieBanner />
      </body>
    </html>
  );
}
