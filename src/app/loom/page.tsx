import type { Metadata } from "next";
import { LoomShowroomApp } from "@/components/LoomShowroomApp";

export const metadata: Metadata = {
  title: "LOOM Luxury Residence | Showroom & Plano Interactivo 3D",
  description:
    "Explora los 318 lotes, villas bioclimáticas Luxury & Garden, Alma Beach Club con salida directa al mar y simulador a 48 meses sin intereses en Cartagena.",
};

export default function LoomShowroom() {
  return <LoomShowroomApp defaultLang="es" />;
}
