import { LoomShowroomApp } from "@/components/LoomShowroomApp";

export const metadata = {
  title: "LOOM Luxury Residence — Maqueta 3D Directa",
  description:
    "Acceso directo a la Maqueta 3D Interactiva de LOOM Luxury Residence en Playa Alma, Cartagena.",
};

export default function LoomDirect3DMaquetaPage() {
  return (
    <>
      {/* Precarga temprana en paralelo de la cartografía 4K y geometría base de lotes */}
      <link rel="preload" as="image" href="/loom/hero_poster.webp" />
      <link rel="preload" as="image" href="/loom/loom_masterplan_bg.webp?v=8" />
      <link rel="preload" as="image" href="/loom/loom_terrain_masks.png?v=2" />
      <link
        rel="preload"
        as="fetch"
        href="/loom/loom_unified_3d_lots.json?v=4"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        as="fetch"
        href="/loom/loom_landscape_3d.json"
        crossOrigin="anonymous"
      />
      <LoomShowroomApp defaultLang="es" initialView="maqueta3d" enable3DMaqueta={true} />
    </>
  );
}
