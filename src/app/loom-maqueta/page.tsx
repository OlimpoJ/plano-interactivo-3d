import { LoomShowroomApp } from "@/components/LoomShowroomApp";

export const metadata = {
  title: "LOOM Luxury Residence — Maqueta 3D Directa",
  description:
    "Acceso directo a la Maqueta 3D Interactiva de LOOM Luxury Residence en Playa Alma, Cartagena.",
};

export default function LoomDirect3DMaquetaPage() {
  return <LoomShowroomApp defaultLang="es" initialView="maqueta3d" enable3DMaqueta={true} />;
}
