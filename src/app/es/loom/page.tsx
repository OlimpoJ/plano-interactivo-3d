import { LoomShowroomApp } from "@/app/loom/page";

export const metadata = {
  title: "LOOM Luxury Residence — Masterplan Interactivo 3D & Showroom",
  description: "Explora los 318 lotes residenciales de lujo, etapas, recorridos virtuales 360° y simulador financiero sin intereses de LOOM Luxury Residence en Cartagena.",
};

export default function LoomSpanishPage() {
  return <LoomShowroomApp defaultLang="es" />;
}
