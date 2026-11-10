import { LoomShowroomApp } from "@/components/LoomShowroomApp";

export const metadata = {
  title: "LOOM Luxury Residence — Maqueta 3D Directa",
  description:
    "Acceso directo a la Maqueta 3D Interactiva de LOOM Luxury Residence en Playa Alma, Cartagena.",
};

export default function LoomDirect3DMaquetaPage() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined') {
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  for (var i = 0; i < regs.length; i++) { regs[i].unregister(); }
                });
              }
              if ('caches' in window) {
                caches.keys().then(function(keys) {
                  for (var j = 0; j < keys.length; j++) { caches.delete(keys[j]); }
                });
              }
            }
          `,
        }}
      />
      <LoomShowroomApp defaultLang="es" initialView="maqueta3d" enable3DMaqueta={true} />
    </>
  );
}
