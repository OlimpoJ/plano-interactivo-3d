"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Compass, MapPin, Sparkles, ArrowRight, ShieldCheck, Waves, Building2 } from "lucide-react";
import { initReferralTracking, getActiveAdvisor, Advisor } from "@/lib/referralTracking";

export default function RootShowroomPage() {
  const [luwanaStats, setLuwanaStats] = useState({ available: 21, total: 122 });
  const [loomStats, setLoomStats] = useState({ available: 278, total: 326 });
  const [assignedAdvisor, setAssignedAdvisor] = useState<Advisor | null>(null);
  const [isPatrimofy, setIsPatrimofy] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const adv = initReferralTracking();
      if (adv) {
        setAssignedAdvisor(adv);
        if (adv.agency.toLowerCase() === "patrimofy") setIsPatrimofy(true);
      } else {
        const active = getActiveAdvisor();
        if (active) {
          setAssignedAdvisor(active);
          if (active.agency.toLowerCase() === "patrimofy") setIsPatrimofy(true);
        } else if (window.location.hostname.includes("patrimofy.com")) {
          setIsPatrimofy(true);
        }
      }
    }
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [resLuwana, resLoom] = await Promise.all([
          fetch('/api/lots?project=luwana').then(r => r.json()).catch(() => null),
          fetch('/api/lots?project=loom').then(r => r.json()).catch(() => null),
        ]);

        if (resLuwana?.success && resLuwana.lots) {
          const avail = resLuwana.lots.filter((l: { status: string }) => l.status === 'available').length;
          setLuwanaStats({ available: avail, total: resLuwana.lots.length || 122 });
        }

        if (resLoom?.success && resLoom.lots) {
          const avail = resLoom.lots.filter((l: { status: string }) => l.status === 'available').length;
          setLoomStats({ available: avail, total: resLoom.lots.length || 326 });
        }
      } catch (e) {
        console.error("Error fetching project stats:", e);
      }
    }
    fetchStats();
  }, []);

  return (
    <main className="relative w-full min-h-[100dvh] bg-[#0A0D0B] text-white flex flex-col justify-between overflow-x-hidden select-none">
      
      {/* Fondo de Estrellas & Resplandor Glassmorphic */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-[#CBAA85]/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[35rem] h-[35rem] bg-[#B35F27]/15 rounded-full blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[30rem] h-[30rem] bg-[#699385]/15 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0A0D0B]/60 to-[#0A0D0B]" />
      </div>

      {/* Cabecera Superior (Header) */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 sm:py-8 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#B35F27]/20 border border-[#B35F27]/40 flex items-center justify-center">
            <Compass className="h-5 w-5 text-[#CBAA85] animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#CBAA85] font-bold block flex items-center gap-1.5">
              {assignedAdvisor ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Tu Asesor: {assignedAdvisor.name} &bull; {assignedAdvisor.agency}</span>
                </>
              ) : isPatrimofy ? (
                "Comercializador Oficial: Patrimofy"
              ) : (
                "Patrimofy & Chichaus"
              )}
            </span>
            <span className="text-sm font-serif font-semibold text-white tracking-wide">
              Showroom Inmobiliario de Lujo
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs text-white/70 backdrop-blur-md">
          <MapPin size={14} className="text-[#CBAA85]" />
          <span>Zona Norte, Cartagena de Indias</span>
        </div>
      </header>

      {/* Hero Central / Selector de Proyectos */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10 sm:py-14 flex-1 flex flex-col justify-center items-center text-center">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/15 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#CBAA85] backdrop-blur-md mb-4 shadow-lg">
          <Sparkles size={13} className="text-[#CBAA85]" />
          <span>Portafolio de Proyectos Exclusivos</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif text-white tracking-tight leading-tight max-w-3xl mb-4">
          Selecciona tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#CBAA85] via-[#EDE7E0] to-[#B35F27]">Proyecto Exclusivo</span>
        </h1>

        <p className="text-sm sm:text-base text-white/70 font-sans max-w-2xl leading-relaxed mb-10">
          Explora nuestros desarrollos inmobiliarios con salida directa al mar en Cartagena. Visualiza planos 3D interactivos, disponibilidad de lotes en tiempo real y arquitectura de autor.
        </p>

        {/* Grid de Tarjetas de Proyectos (Luwana vs Loom) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          
          {/* Tarjeta 1: LUWANA ALMA BEACH */}
          <div className="group relative bg-[#131915]/80 hover:bg-[#18201b] border border-[#CBAA85]/30 hover:border-[#CBAA85] rounded-2xl overflow-hidden backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_20px_50px_rgba(203,170,133,0.18)] flex flex-col justify-between text-left transform hover:-translate-y-1.5">
            
            {/* Contenido Superior */}
            <div className="relative p-6 sm:p-8 space-y-4">
              
              <div className="flex justify-between items-start">
                <span className="px-3 py-1 bg-[#CBAA85]/15 text-[#CBAA85] border border-[#CBAA85]/30 rounded-full text-[9px] font-bold uppercase tracking-widest">
                  Salida Directa al Mar
                </span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {luwanaStats.available} Disponibles
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 block font-semibold">Proyecto 01</span>
                <h2 className="text-2xl sm:text-3xl font-serif text-white font-semibold mt-0.5 group-hover:text-[#CBAA85] transition-colors">
                  Luwana Beach Residence
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
                Condominio boutique exclusivo con salida directa al mar en Manzanillo del Mar, Zona Norte de Cartagena. Lotes urbanizados de alta valorización y rentabilidad.
              </p>

              {/* Tags de características */}
              <div className="pt-2 flex flex-wrap gap-2 text-[10px] text-white/60">
                <span className="bg-white/5 px-2.5 py-1 rounded border border-white/10 flex items-center gap-1">
                  <Waves size={12} className="text-[#CBAA85]" /> Acceso Directo a Playa
                </span>
                <span className="bg-white/5 px-2.5 py-1 rounded border border-white/10 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-[#CBAA85]" /> 122 Lotes Totales
                </span>
              </div>

            </div>

            {/* Pie de tarjeta con Botón */}
            <div className="p-6 sm:p-8 pt-0">
              <Link
                href={
                  assignedAdvisor && assignedAdvisor.slug !== "patrimofy" && assignedAdvisor.slug !== "chichaus"
                    ? `/luwana?asesor=${assignedAdvisor.slug}`
                    : isPatrimofy
                    ? "/luwana?ref=patrimofy"
                    : "/luwana"
                }
                className="w-full py-3.5 px-6 bg-[#CBAA85] hover:bg-[#b8956e] text-black font-bold uppercase tracking-widest text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#CBAA85]/20 group-hover:scale-[1.02] cursor-pointer"
              >
                <span>Explorar Luwana</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

          </div>

          {/* Tarjeta 2: LOOM ALMA BEACH */}
          <div className="group relative bg-[#1c1410]/80 hover:bg-[#241a14] border border-[#B35F27]/40 hover:border-[#B35F27] rounded-2xl overflow-hidden backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_20px_50px_rgba(179,95,39,0.22)] flex flex-col justify-between text-left transform hover:-translate-y-1.5">
            
            {/* Contenido Superior */}
            <div className="relative p-6 sm:p-8 space-y-4">
              
              <div className="flex justify-between items-start">
                <span className="px-3 py-1 bg-[#B35F27]/20 text-[#B35F27] border border-[#B35F27]/40 rounded-full text-[9px] font-bold uppercase tracking-widest">
                  Beach Club &amp; Country
                </span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  {loomStats.available} Disponibles
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 block font-semibold">Proyecto 02</span>
                <h2 className="text-2xl sm:text-3xl font-serif text-white font-semibold mt-0.5 group-hover:text-[#B35F27] transition-colors">
                  Loom Luxury Residence
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-sans">
                Macroproyecto residencial de lujo con 6 etapas exclusivas, Beach Club privado sobre el mar, canchas de tenis, restaurante y senderos ecológicos.
              </p>

              {/* Tags de características */}
              <div className="pt-2 flex flex-wrap gap-2 text-[10px] text-white/60">
                <span className="bg-white/5 px-2.5 py-1 rounded border border-white/10 flex items-center gap-1">
                  <Building2 size={12} className="text-[#B35F27]" /> 6 Etapas Urbanísticas
                </span>
                <span className="bg-white/5 px-2.5 py-1 rounded border border-white/10 flex items-center gap-1">
                  <Sparkles size={12} className="text-[#B35F27]" /> Beach Club Privado
                </span>
              </div>

            </div>

            {/* Pie de tarjeta con Botón */}
            <div className="p-6 sm:p-8 pt-0">
              <Link
                href={
                  assignedAdvisor && assignedAdvisor.slug !== "patrimofy" && assignedAdvisor.slug !== "chichaus"
                    ? `/loom?asesor=${assignedAdvisor.slug}`
                    : isPatrimofy
                    ? "/loom?ref=patrimofy"
                    : "/loom"
                }
                className="w-full py-3.5 px-6 bg-[#B35F27] hover:bg-[#964d1d] text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#B35F27]/25 group-hover:scale-[1.02] cursor-pointer"
              >
                <span>Explorar Loom</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

          </div>

        </div>

      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-white/10 text-center text-xs text-white/40 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p>&copy; {new Date().getFullYear()} {isPatrimofy ? "Patrimofy Real Estate" : "Patrimofy & Chichaus"} &bull; Showroom Inmobiliario de Lujo</p>
        <p className="text-[10px] uppercase tracking-wider text-white/30">Cartagena de Indias, Colombia</p>
      </footer>

    </main>
  );
}
