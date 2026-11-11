"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, ArrowUpRight, Box, Layers, Waves } from "lucide-react";
import { useAdvisorAttribution } from "@/hooks/useAdvisorAttribution";
import { isInstitutionalAdvisor } from "@/lib/referralTracking";

export default function RootShowroomPage() {
  const [luwanaStats, setLuwanaStats] = useState({ available: 21, total: 122 });
  const [loomStats, setLoomStats] = useState({ available: 278, total: 318 });
  const { assignedAdvisor, isPatrimofy } = useAdvisorAttribution("loom_ref");

  useEffect(() => {
    async function fetchStats() {
      try {
        const [resLuwana, resLoom] = await Promise.all([
          fetch("/api/lots?project=luwana")
            .then((r) => r.json())
            .catch(() => null),
          fetch("/api/lots?project=loom")
            .then((r) => r.json())
            .catch(() => null),
        ]);

        if (resLuwana?.success && resLuwana.lots) {
          const avail = resLuwana.lots.filter(
            (l: { status: string }) => l.status === "available"
          ).length;
          setLuwanaStats({ available: avail, total: resLuwana.lots.length || 122 });
        }

        if (resLoom?.success && resLoom.lots) {
          const avail = resLoom.lots.filter(
            (l: { status: string }) => l.status === "available"
          ).length;
          setLoomStats({ available: avail, total: resLoom.lots.length || 318 });
        }
      } catch (e) {
        console.error("Error fetching project stats:", e);
      }
    }
    fetchStats();
  }, []);

  const querySuffix = assignedAdvisor
    ? isInstitutionalAdvisor(assignedAdvisor)
      ? assignedAdvisor.slug === "patrimofy"
        ? "?ref=patrimofy"
        : `?inmobiliaria=${encodeURIComponent(assignedAdvisor.slug)}`
      : `?asesor=${encodeURIComponent(assignedAdvisor.slug)}`
    : isPatrimofy
    ? "?ref=patrimofy"
    : "";

  const luwanaHref = `/luwana${querySuffix}`;
  const loomHref = `/loom${querySuffix}`;
  const loom3DHref = `/loom-maqueta${querySuffix}`;

  const totalAvailable = luwanaStats.available + loomStats.available;

  return (
    <main className="relative w-full min-h-[100dvh] bg-[#0A0D0B] text-[#EDE7E0] flex flex-col overflow-x-hidden select-none">
      {/* Textura atmosférica cálida y sobria (cero manchas neón) */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-60"
        style={{
          background:
            "radial-gradient(90% 60% at 50% 0%, rgba(179, 95, 39, 0.10) 0%, rgba(10, 13, 11, 0) 70%)",
        }}
      />

      {/* Masthead Editorial Superior */}
      <header className="relative z-10 w-full max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 py-4 sm:py-5 border-b border-[#EDE7E0]/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-block w-2 h-2 rounded-full bg-[#B35F27]" />
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
            <span className="font-serif text-sm sm:text-base font-semibold tracking-wide text-[#EDE7E0]">
              Playa Alma &bull; Master Plans
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#EDE7E0]/50">
              {assignedAdvisor
                ? isInstitutionalAdvisor(assignedAdvisor)
                  ? `Inmobiliaria: ${assignedAdvisor.name}`
                  : `Asesor: ${assignedAdvisor.name} (${assignedAdvisor.agency})`
                : isPatrimofy
                ? "Inmobiliaria: Patrimofy"
                : "Patrimofy & Chic Haus"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div className="hidden md:flex items-center gap-1.5 text-[#EDE7E0]/60">
            <MapPin className="w-3.5 h-3.5 text-[#CBAA85]" />
            <span>Zona Norte, Cartagena de Indias</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE7E0]/[0.05] border border-[#EDE7E0]/12 font-mono text-[10px] uppercase tracking-[0.16em] text-[#EDE7E0]/85 tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{totalAvailable} Lotes en Vivo</span>
          </div>
        </div>
      </header>

      {/* Cuerpo Editorial Principal */}
      <section className="relative z-10 flex-1 w-full max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 py-6 sm:py-9 lg:py-10 flex flex-col justify-center">
        {/* Encabezado Asimétrico de Estudio */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.26em] text-[#CBAA85] mb-2">
              Cartagena de Indias &mdash; Desarrollos Costeros
            </p>
            <h1 className="font-serif text-2xl sm:text-4xl lg:text-[2.75rem] text-[#EDE7E0] font-normal tracking-tight leading-[1.1]">
              Explora nuestros proyectos en tiempo real.
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#EDE7E0]/65 max-w-md leading-relaxed lg:text-right">
            Consulta disponibilidad actualizada al instante, simulador financiero sin intereses y recorridos interactivos con salida directa al mar.
          </p>
        </div>

        {/* Dos Paneles Arquitectónicos con Fotografía Real */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          {/* PANEL 01 — LOOM LUXURY RESIDENCE (7 columnas en desktop por incluir Maqueta 3D + Showroom) */}
          <article className="group relative lg:col-span-7 min-h-[430px] sm:min-h-[490px] rounded-2xl overflow-hidden border border-[#EDE7E0]/15 hover:border-[#B35F27]/80 bg-[#121614] transition-colors duration-500 flex flex-col justify-between shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
            {/* Fotografía Aérea Real de Loom + Alma Beach */}
            <img
              src="/loom/hero_poster.webp"
              alt="Vista aérea de Loom Luxury Residence y Alma Beach Club con salida directa al mar"
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.035]"
            />
            {/* Veladura Editorial Multicapa para Legibilidad Perfecta */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,13,11,0.58) 0%, rgba(10,13,11,0.18) 38%, rgba(10,13,11,0.82) 74%, rgba(10,13,11,0.96) 100%)",
              }}
            />

            {/* Cinta Superior del Panel */}
            <div className="relative z-10 p-5 sm:p-7 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] px-2.5 py-1 rounded-md bg-[#0A0D0B]/75 border border-[#EDE7E0]/15 text-[#EBD9AB] backdrop-blur-md">
                  01 &bull; Villas &amp; Lotes
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] px-2.5 py-1 rounded-md bg-[#B35F27]/85 text-[#EDE7E0] backdrop-blur-md">
                  <Box className="w-3 h-3" />
                  Maqueta 3D WebGL
                </span>
              </div>

              <div className="px-3 py-1.5 rounded-full bg-[#0A0D0B]/80 border border-emerald-400/35 backdrop-blur-md font-mono text-[11px] text-emerald-300 tabular-nums flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>
                  <strong>{loomStats.available}</strong> / {loomStats.total} disp.
                </span>
              </div>
            </div>

            {/* Contenido Inferior Editorial */}
            <div className="relative z-10 p-5 sm:p-7 pt-12 space-y-4">
              <div className="space-y-2.5">
                <img
                  src="/loom/logo_loom.png"
                  alt="LOOM Luxury Residence by Alma Beach"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
                <p className="text-xs sm:text-sm text-[#EDE7E0]/82 max-w-xl leading-relaxed">
                  Macroproyecto bioclimático de 6 etapas con Alma Beach Club privado, salida directa al mar, Lago Central, modelos de Villa Luxury &amp; Garden y financiación directa hasta 48 meses con 0% de interés.
                </p>
              </div>

              {/* Ficha Técnica Compacta */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EDE7E0]/12 text-left">
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-[#EDE7E0]/45">
                    Urbanismo
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-[#EDE7E0]">
                    6 Etapas + Lago
                  </span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-[#EDE7E0]/45">
                    Amenidad Ancla
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-[#EDE7E0]">
                    Alma Beach Club
                  </span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-[#EDE7E0]/45">
                    Financiación
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-[#EBD9AB] tabular-nums">
                    Hasta 48m &bull; 0% Int.
                  </span>
                </div>
              </div>

              {/* Acciones Directas: Showroom Completo + Acceso Directo Maqueta 3D */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <Link
                  href={loomHref}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-[#B35F27] hover:bg-[#9c511f] text-[#EDE7E0] font-semibold text-xs uppercase tracking-[0.16em] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#B35F27]/25 cursor-pointer"
                >
                  <span>Ingresar al Showroom</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <Link
                  href={loom3DHref}
                  className="py-3.5 px-4 rounded-xl bg-[#EDE7E0]/10 hover:bg-[#EDE7E0]/18 border border-[#EDE7E0]/25 text-[#EDE7E0] font-semibold text-xs uppercase tracking-[0.14em] backdrop-blur-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Box className="w-3.5 h-3.5 text-[#EBD9AB]" />
                  <span>Ir a Maqueta 3D</span>
                </Link>
              </div>
            </div>
          </article>

          {/* PANEL 02 — LUWANA BEACH RESIDENCE (5 columnas en desktop) */}
          <article className="group relative lg:col-span-5 min-h-[430px] sm:min-h-[490px] rounded-2xl overflow-hidden border border-[#EDE7E0]/15 hover:border-[#CBAA85]/80 bg-[#0E1A1C] transition-colors duration-500 flex flex-col justify-between shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
            {/* Fotografía Real del Club de Playa y Lagunas de Luwana */}
            <img
              src="/luwana_hero_cover.webp"
              alt="Vista aérea del Club de Playa de Luwana Beach Residence con salida directa al mar"
              className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-[1.035]"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(11,22,24,0.60) 0%, rgba(11,22,24,0.20) 38%, rgba(11,22,24,0.85) 74%, rgba(10,15,16,0.97) 100%)",
              }}
            />

            {/* Cinta Superior del Panel */}
            <div className="relative z-10 p-5 sm:p-7 flex items-start justify-between gap-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] px-2.5 py-1 rounded-md bg-[#0A0D0B]/75 border border-[#EDE7E0]/15 text-[#CBAA85] backdrop-blur-md inline-flex items-center gap-1.5">
                <Waves className="w-3 h-3" />
                02 &bull; Beach Residence
              </span>

              <div className="px-3 py-1.5 rounded-full bg-[#0A0D0B]/80 border border-[#CBAA85]/45 backdrop-blur-md font-mono text-[11px] text-[#EFE9E1] tabular-nums flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CBAA85]" />
                <span>
                  <strong>{luwanaStats.available}</strong> / {luwanaStats.total} disp.
                </span>
              </div>
            </div>

            {/* Contenido Inferior Editorial */}
            <div className="relative z-10 p-5 sm:p-7 pt-12 space-y-4">
              <div className="space-y-2.5">
                <img
                  src="/LOGO LUWANA BLANCO01.png"
                  alt="Luwana Alma Beach"
                  className="h-11 sm:h-13 w-auto object-contain"
                />
                <p className="text-xs sm:text-sm text-[#EDE7E0]/82 leading-relaxed">
                  Condominio exclusivo de playa con 122 lotes urbanizados, piscinas orgánicas tipo laguna, Club House deportivo y salida directa al mar Caribe.
                </p>
              </div>

              {/* Ficha Técnica Compacta */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EDE7E0]/12 text-left">
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-[#EDE7E0]/45">
                    Inventario
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-[#EDE7E0] tabular-nums">
                    Últimos {luwanaStats.available} lotes
                  </span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-[#EDE7E0]/45">
                     Acceso
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-[#EDE7E0]">
                    Salida al Mar
                  </span>
                </div>
                <div>
                  <span className="block font-mono text-[9px] uppercase tracking-[0.18em] text-[#EDE7E0]/45">
                    Plazo Directo
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-[#CBAA85] tabular-nums">
                    Hasta 36 meses
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href={luwanaHref}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#CBAA85] hover:bg-[#b8956e] text-[#0A0D0B] font-bold text-xs uppercase tracking-[0.16em] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#CBAA85]/20 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Explorar Luwana</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
