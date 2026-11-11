"use client";

import React, { useEffect, useRef, useState } from "react";

export interface LoomMaquetaLoaderProps {
  progress: number;
  isReady?: boolean;
  isEn?: boolean;
  statusText?: string;
}

function getDescentStatusText(progress: number, isEn: boolean): string {
  if (progress < 32) {
    return isEn
      ? "Overflying North Zone, Cartagena..."
      : "Sobrevolando Zona Norte, Cartagena...";
  }
  if (progress < 72) {
    return isEn
      ? "Descending through clouds toward Playa Alma..."
      : "Descendiendo entre nubes hacia Playa Alma...";
  }
  if (progress < 98) {
    return isEn
      ? "Approaching Caribbean Sea & 3D Villas..."
      : "Aproximación al Mar Caribe y Villas 3D...";
  }
  return isEn ? "Entering Playa Alma" : "Entrando por el Mar Caribe";
}

export default function LoomMaquetaLoader({
  progress,
  isReady = false,
  isEn = false,
  statusText,
}: LoomMaquetaLoaderProps) {
  const [unmounted, setUnmounted] = useState(false);
  const [visualProgress, setVisualProgress] = useState(() =>
    Math.max(8, Math.min(100, progress))
  );
  const targetRef = useRef(progress);
  targetRef.current = isReady ? 100 : Math.max(8, Math.min(99, progress));

  // Interpolación continua a 60 FPS del altímetro y porcentaje para evitar saltos bruscos
  useEffect(() => {
    if (unmounted) return;
    let raf = 0;
    const tick = () => {
      setVisualProgress((prev) => {
        const target = targetRef.current;
        const diff = target - prev;
        if (Math.abs(diff) < 0.25) return target;
        return prev + diff * (target === 100 ? 0.28 : 0.12);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [unmounted]);

  useEffect(() => {
    if (!isReady) {
      setUnmounted(false);
      return;
    }
    const timer = setTimeout(() => {
      setUnmounted(true);
    }, 1150);
    return () => clearTimeout(timer);
  }, [isReady]);

  if (unmounted) return null;

  const displayPct = isReady ? 100 : Math.min(99, Math.round(visualProgress));
  // Altímetro sincronizado con el descenso aéreo (780 m -> 85 m)
  const altitudeMeters = Math.round(780 - (displayPct / 100) * 695);
  const activeLabel = statusText || getDescentStatusText(displayPct, isEn);

  return (
    <div
      aria-live="polite"
      aria-busy={!isReady}
      className={`fixed inset-0 z-[65] flex flex-col items-center justify-center px-5 select-none overflow-hidden ${
        isReady ? "pointer-events-none" : "pointer-events-auto"
      }`}
    >
      <style>{`
        @keyframes loomCloudDriftBack {
          0% { transform: translate3d(-1.8%, 1.8%, 0) scale3d(1, 1, 1); }
          50% { transform: translate3d(1.8%, -1.8%, 0) scale3d(1.08, 1.08, 1); }
          100% { transform: translate3d(-1.8%, 1.8%, 0) scale3d(1, 1, 1); }
        }
        @keyframes loomCloudDriftLeft {
          0% { transform: translate3d(1.5%, 2.2%, 0) scale3d(0.98, 0.98, 1); }
          50% { transform: translate3d(-1.8%, -2.0%, 0) scale3d(1.10, 1.10, 1); }
          100% { transform: translate3d(1.5%, 2.2%, 0) scale3d(0.98, 0.98, 1); }
        }
        @keyframes loomCloudDriftRight {
          0% { transform: translate3d(-1.5%, -1.8%, 0) scale3d(1.06, 1.06, 1); }
          50% { transform: translate3d(1.8%, 2.0%, 0) scale3d(0.97, 0.97, 1); }
          100% { transform: translate3d(-1.5%, -1.8%, 0) scale3d(1.06, 1.06, 1); }
        }
        @keyframes loomCloudWispFront {
          0% { transform: translate3d(0, 5%, 0) scale3d(0.96, 0.96, 1); opacity: 0.62; }
          50% { transform: translate3d(0, -3%, 0) scale3d(1.10, 1.10, 1); opacity: 0.90; }
          100% { transform: translate3d(0, 5%, 0) scale3d(0.96, 0.96, 1); opacity: 0.62; }
        }
      `}</style>

      {/* 1. Cielo Caribeño Base + Brillo Solar (0 blur CSS -> 60 FPS clavados en compositor GPU) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 will-change-[opacity]"
        style={{
          opacity: isReady ? 0 : 1,
          transition: "opacity 420ms cubic-bezier(0.22, 1, 0.36, 1)",
          background: [
            "radial-gradient(56% 48% at 76% 18%, rgba(255, 251, 236, 0.90) 0%, rgba(255, 245, 218, 0.34) 40%, rgba(214, 238, 248, 0) 74%)",
            "linear-gradient(180deg, #5296C2 0%, #86C0E2 38%, #C7E7F6 72%, #D6EEF8 88%, #9AD8DC 100%)",
          ].join(", "),
        }}
      />

      {/* 2. Banco de Nubes Altas de Fondo (Contenedor externo anima salida sin cortar el drift interno) */}
      <div
        aria-hidden="true"
        className="absolute -inset-[10%] will-change-[transform,opacity]"
        style={{
          opacity: isReady ? 0 : 0.96,
          transform: isReady
            ? "translate3d(0, -6%, 0) scale3d(1.48, 1.48, 1)"
            : "translate3d(0, 0, 0) scale3d(1, 1, 1)",
          transition:
            "transform 920ms cubic-bezier(0.22, 1, 0.36, 1), opacity 680ms ease-out",
        }}
      >
        <div
          className="w-full h-full will-change-transform"
          style={{
            animation: "loomCloudDriftBack 9s ease-in-out infinite",
            background: [
              "radial-gradient(42% 32% at 22% 28%, rgba(255,255,255,0.95) 0%, rgba(242,249,254,0.68) 36%, rgba(224,241,250,0.24) 62%, transparent 82%)",
              "radial-gradient(46% 34% at 78% 30%, rgba(255,253,248,0.95) 0%, rgba(240,248,253,0.66) 38%, rgba(220,239,249,0.22) 64%, transparent 84%)",
              "radial-gradient(54% 36% at 50% 74%, rgba(255,255,255,0.92) 0%, rgba(226,243,251,0.64) 40%, rgba(198,228,243,0.22) 66%, transparent 86%)",
            ].join(", "),
          }}
        />
      </div>

      {/* 3A. Cortina de Cúmulos Izquierda (Se abre limpia hacia la izquierda revelando el Mar Caribe 3D) */}
      <div
        aria-hidden="true"
        className="absolute -inset-[12%] will-change-[transform,opacity]"
        style={{
          opacity: isReady ? 0 : 1,
          transform: isReady
            ? "translate3d(-38%, -8%, 0) scale3d(1.62, 1.62, 1)"
            : "translate3d(0, 0, 0) scale3d(1, 1, 1)",
          transition:
            "transform 1060ms cubic-bezier(0.16, 1, 0.3, 1), opacity 860ms ease-out",
        }}
      >
        <div
          className="w-full h-full will-change-transform"
          style={{
            animation: "loomCloudDriftLeft 7.6s ease-in-out infinite",
            background: [
              "radial-gradient(40% 34% at 18% 46%, rgba(255,255,255,0.97) 0%, rgba(245,251,254,0.78) 36%, rgba(212,235,247,0.32) 62%, transparent 84%)",
              "radial-gradient(36% 28% at 34% 66%, rgba(255,255,255,0.94) 0%, rgba(232,245,252,0.66) 40%, rgba(206,232,246,0.22) 66%, transparent 84%)",
              "radial-gradient(32% 26% at 28% 24%, rgba(255,255,255,0.90) 0%, rgba(238,248,253,0.54) 42%, transparent 78%)",
            ].join(", "),
          }}
        />
      </div>

      {/* 3B. Cortina de Cúmulos Derecha (Se abre limpia hacia la derecha) */}
      <div
        aria-hidden="true"
        className="absolute -inset-[12%] will-change-[transform,opacity]"
        style={{
          opacity: isReady ? 0 : 1,
          transform: isReady
            ? "translate3d(38%, 7%, 0) scale3d(1.62, 1.62, 1)"
            : "translate3d(0, 0, 0) scale3d(1, 1, 1)",
          transition:
            "transform 1060ms cubic-bezier(0.16, 1, 0.3, 1), opacity 860ms ease-out",
        }}
      >
        <div
          className="w-full h-full will-change-transform"
          style={{
            animation: "loomCloudDriftRight 8.2s ease-in-out infinite",
            background: [
              "radial-gradient(42% 34% at 82% 48%, rgba(255,254,250,0.97) 0%, rgba(245,251,254,0.78) 36%, rgba(210,234,247,0.32) 62%, transparent 84%)",
              "radial-gradient(38% 28% at 68% 68%, rgba(255,255,255,0.94) 0%, rgba(230,244,252,0.66) 40%, rgba(204,231,246,0.22) 66%, transparent 84%)",
              "radial-gradient(34% 26% at 72% 26%, rgba(255,253,247,0.92) 0%, rgba(240,248,253,0.54) 42%, transparent 78%)",
            ].join(", "),
          }}
        />
      </div>

      {/* 3C. Velo de Bruma Frontal Cercana al Lente */}
      <div
        aria-hidden="true"
        className="absolute -inset-[8%] will-change-[transform,opacity]"
        style={{
          opacity: isReady ? 0 : 0.9,
          transform: isReady
            ? "translate3d(0, 22%, 0) scale3d(1.5, 1.5, 1)"
            : "translate3d(0, 0, 0) scale3d(1, 1, 1)",
          transition:
            "transform 820ms cubic-bezier(0.22, 1, 0.36, 1), opacity 620ms ease-out",
        }}
      >
        <div
          className="w-full h-full will-change-[transform,opacity]"
          style={{
            animation: "loomCloudWispFront 5.8s ease-in-out infinite",
            background: [
              "radial-gradient(50% 28% at 50% 84%, rgba(255,255,255,0.94) 0%, rgba(238,248,253,0.60) 42%, transparent 80%)",
              "radial-gradient(44% 24% at 50% 16%, rgba(255,255,255,0.82) 0%, rgba(238,248,253,0.40) 44%, transparent 78%)",
            ].join(", "),
          }}
        />
      </div>

      {/* 4. Cápsula Editorial Flotante (Sin backdrop-blur pesado sobre nubes móviles -> 0 lag en GPU) */}
      <div
        className="relative z-10 w-full max-w-[380px] rounded-3xl border border-white/30 px-7 py-6 sm:px-9 sm:py-7 shadow-[0_24px_64px_rgba(6,28,38,0.26)] text-[#EDE7E0] flex flex-col items-center text-center space-y-5 will-change-[transform,opacity]"
        style={{
          background:
            "linear-gradient(180deg, rgba(8, 30, 39, 0.90) 0%, rgba(6, 22, 29, 0.94) 100%)",
          opacity: isReady ? 0 : 1,
          transform: isReady
            ? "translate3d(0, -10px, 0) scale3d(0.96, 0.96, 1)"
            : "translate3d(0, 0, 0) scale3d(1, 1, 1)",
          transition:
            "opacity 260ms ease-out, transform 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className="w-full flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.22em] text-[#EDE7E0]/72 border-b border-white/12 pb-2.5">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Playa Alma • 3D</span>
          </span>
          <span className="text-[#EBD9AB] tabular-nums">
            ALT {altitudeMeters}m &bull; N 28°
          </span>
        </div>

        <div className="py-1 flex flex-col items-center space-y-2">
          <img
            src="/loom/logo_loom.png"
            alt="LOOM Luxury Residence"
            className="h-11 sm:h-12 w-auto object-contain"
          />
          <p className="font-mono text-[9px] uppercase tracking-[0.26em] text-[#EBD9AB]/80">
            Cartagena de Indias
          </p>
        </div>

        <div className="w-full space-y-2">
          <div className="flex items-baseline justify-between gap-3 text-[11px]">
            <span className="text-[#EDE7E0]/88 truncate text-left">{activeLabel}</span>
            <span className="font-mono text-[11px] font-semibold text-[#EBD9AB] tabular-nums shrink-0">
              {displayPct}%
            </span>
          </div>

          <div className="relative h-[2.5px] w-full bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#B35F27] via-[#d98448] to-[#EBD9AB] rounded-full will-change-[transform] origin-left"
              style={{
                transform: `scaleX(${Math.max(0.06, displayPct / 100)})`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
