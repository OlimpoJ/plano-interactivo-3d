import { LoomShowroomApp } from "@/components/LoomShowroomApp";

export const metadata = {
  title: "LOOM Luxury Residence — Maqueta 3D Interactiva & Showroom",
  description:
    "Explora la Maqueta 3D Interactiva de LOOM Luxury Residence en Playa Alma, Cartagena: lotes, villas bioclimáticas 3D, Lago Central y Alma Beach Club.",
};

export default function Loom3DMaquetaPage() {
  return <LoomShowroomApp defaultLang="es" enable3DMaqueta={true} />;
}
