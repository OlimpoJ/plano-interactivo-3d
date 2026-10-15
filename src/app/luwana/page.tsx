"use client";

import { useState, useEffect } from "react";
import { MapPin, Compass, ArrowLeft } from "lucide-react";
import MasterplanSelector from "@/components/MasterplanSelector";
import StageView from "@/components/StageView";
import styles from "../Hero.module.css";
import { getMediaUrl } from "@/utils/media";
import Link from "next/link";
import { initReferralTracking } from "@/lib/referralTracking";

function AnimatedCounter({ endValue, duration = 2000 }: { endValue: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (endValue === 0) return;
    let startTime: number;
    let animationFrameId: number;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = time - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      const easeOut = progressRatio === 1 ? 1 : 1 - Math.pow(2, -10 * progressRatio);
      
      setCount(Math.floor(easeOut * endValue));

      if (progress < duration) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [endValue, duration]);

  return <>{count}</>;
}

export default function LuwanaPage() {
  const [view, setView] = useState<"hero" | "map" | "stage">("hero");
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 122,
    sold: 101,
    available: 21
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/lots?project=luwana');
        const data = await response.json();
        
        if (data.success && data.lots) {
          const total = data.lots.length;
          const available = data.lots.filter((l: { status: string }) => l.status === 'available').length;
          const sold = total - available;

          setStats({
            total: total > 0 ? total : 122,
            sold: total > 0 ? sold : 101,
            available: total > 0 ? available : 21
          });
        }
      } catch (error) {
        console.error("Error fetching live stats for Luwana:", error);
      }
    }
    fetchStats();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      initReferralTracking();
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        sessionStorage.setItem("luwana_ref", ref.toLowerCase());
      } else if (window.location.hostname.includes("patrimofy.com")) {
        sessionStorage.setItem("luwana_ref", "patrimofy");
      }

      const stageParam = params.get('stage');
      const lotParam = params.get('lot');
      if (stageParam) {
        const normalizedStage = stageParam.startsWith('etapa-') ? stageParam : `etapa-${stageParam.replace(/\D/g, '') || '1'}`;
        queueMicrotask(() => {
          setSelectedStage(normalizedStage);
          setView("stage");
        });
      } else if (lotParam) {
        const lotNum = parseInt(lotParam.replace(/\D/g, ''), 10);
        const inferredStage = lotNum >= 61 ? "etapa-2" : "etapa-1";
        queueMicrotask(() => {
          setSelectedStage(inferredStage);
          setView("stage");
        });
      } else if (params.get('embed') === 'true' || params.get('view') === 'map') {
        queueMicrotask(() => {
          setView("map");
        });
      }
    }
  }, []);

  if (view === "stage" && selectedStage) {
    const handleNext = () => {
      if (selectedStage === "etapa-1") setSelectedStage("etapa-2");
      else if (selectedStage === "etapa-2") setSelectedStage("etapa-3");
      else if (selectedStage === "etapa-3") setSelectedStage("etapa-1");
    };
    return (
      <StageView
        stageId={selectedStage}
        onBack={() => setView("map")}
        onNext={handleNext}
        onChangeStage={(newStageId) => setSelectedStage(newStageId)}
      />
    );
  }

  if (view === "map") {
    return (
      <MasterplanSelector 
        onSelectZone={(zoneId) => {
          setSelectedStage(zoneId);
          setView("stage");
        }} 
      />
    );
  }

  return (
    <main className="relative w-full min-h-screen bg-black overflow-hidden flex flex-col text-white">
      {/* Botón Volver al Showroom Principal */}
      <div className="absolute top-4 left-4 z-40">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/20 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-all duration-300 shadow-lg cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Volver al Showroom</span>
        </Link>
      </div>

      <section className={styles.heroContainer}>
        {/* Video de Fondo */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className={styles.backgroundVideo}
        >
          <source src={getMediaUrl('/showroom loop.mp4')} type="video/mp4" />
        </video>

        {/* Overlay con Gradientes Premium */}
        <div className={styles.gradientOverlay}></div>

        {/* Estructura Izquierda / Derecha */}
        <div className={styles.heroContent}>
          <div className={styles.leftColumn}>
            <h1 className={styles.heroTitle}>
              Exclusividad Inmobiliaria con Salida Directa al Mar Caribe
            </h1>
            <p className={styles.heroSubtitle}>
              Adquiere tu lote con salida directa al mar en la zona con más desarrollo de Cartagena y construye tu Residencia Boutique con nuestros diseños de autor. Lujo para tu hogar y alta rentabilidad para tu negocio de rentas cortas.
            </p>
            
            <div className={styles.buttons}>
              <button 
                onClick={() => setView("map")}
                className={styles.primaryBtn}
                style={{ backgroundColor: "#A58E74", color: "#EFE9E1" }}
              >
                <Compass size={16} />
                Ingresa al Plano Interactivo Luwana
              </button>
            </div>
          </div>
 
          <div className={styles.rightColumn}>
            {/* Logo en la columna derecha */}
            <div className={styles.rightLogoContainer}>
              <img 
                src="/LOGO LUWANA BLANCO01.png" 
                alt="Luwana Alma Beach" 
                className={styles.logo}
                onError={(e) => {
                   (e.target as HTMLImageElement).src = "/LOGO SVG.svg";
                }}
              />
            </div>

            <div className={styles.statsContainer}>
              <div className={styles.statBox}>
                <span className={styles.statValue}><AnimatedCounter endValue={stats.total} /></span>
                <span className={styles.statLabel}>Lotes Totales</span>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statBox}>
                <span className={styles.statValue}><AnimatedCounter endValue={stats.sold} /></span>
                <span className={styles.statLabel}>Vendidos</span>
              </div>
              <div className={styles.statDivider}></div>
              <div className={styles.statBox}>
                <span className={styles.statValue}><AnimatedCounter endValue={stats.available} /></span>
                <span className={styles.statLabel}>Disponibles</span>
              </div>
            </div>
            <div className={styles.locationSmall}>
              <MapPin size={16} color="#A58E74" /> Zona Norte, Cartagena
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
