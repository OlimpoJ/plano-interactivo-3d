"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass } from "lucide-react";
import { useLoomLang } from "@/lib/loomI18n";

interface Lot {
  id: string;
  rawId: string;
  area: string;
  location: string;
  status: string;
  statusRaw: string;
  totalPrice: string;
  downPayment: string;
  financing: string;
  finalPayment: string;
}

const stagesData = [
  {
    id: "ZONA_1",
    stageKey: "etapa_1",
    nameEs: "Etapa 1",
    nameEn: "Stage 1",
    active: true,
    cx: 508,
    cy: 1146,
    points: "1017.98,1445.32 14.45,1454.13 15.9,1444.36 21.97,1388.42 27.41,1276.1 27.96,1189.33 21.14,1045.23 5.28,911.6 -2.18,868.48 490.2,837.93",
  },
  {
    id: "ZONA_2",
    stageKey: "etapa_2",
    nameEs: "Etapa 2",
    nameEn: "Stage 2",
    active: true,
    cx: 1003,
    cy: 1127,
    points: "965.47,808.43 490.2,837.93 1017.98,1445.32 1515.09,1440.95",
  },
  {
    id: "ZONA_3",
    stageKey: "etapa_3",
    nameEs: "Etapa 3",
    nameEn: "Stage 3",
    active: true,
    cx: 1484,
    cy: 1116,
    points: "965.47,808.43 1440.74,778.94 2012.2,1436.58 1515.09,1440.95",
  },
  {
    id: "ZONA_4",
    stageKey: "etapa_4",
    nameEs: "Etapa 4",
    nameEn: "Stage 4",
    active: true,
    cx: 1941,
    cy: 1098,
    points: "1440.74,778.94 2012.2,1436.58 2437.44,1446.29 2399.42,1302.73 1916.19,754.8",
  },
  {
    id: "ZONA_5",
    stageKey: "etapa_5",
    nameEs: "Etapa 5",
    nameEn: "Stage 5",
    active: true,
    cx: 2507,
    cy: 1081,
    points: "1916.19,754.8 2755.25,717.93 2919.9,1452.31 2437.44,1446.29 2399.42,1302.73",
  },
  {
    id: "ZONA_6",
    stageKey: "etapa_6",
    nameEs: "Alma Beach",
    nameEn: "Alma Beach",
    active: true,
    cx: 3339,
    cy: 1040,
    points: "2755.25,717.93 3840,636.2 3839.79,1420.08 2919.9,1452.31",
  },
];

interface LoomMasterplanSelectorProps {
  lots: Lot[];
  onSelectStage: (stageId: string) => void;
  onBack: () => void;
}

export default function LoomMasterplanSelector({ lots, onSelectStage, onBack }: LoomMasterplanSelectorProps) {
  const { isEn } = useLoomLang();
  const [hoveredStage, setHoveredStage] = useState<{
    id: string;
    name: string;
    total: number;
    available: number;
    active: boolean;
  } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, isRightHalf: false });
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px) and (orientation: portrait)");
    const update = () => setIsMobilePortrait(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const activeViewBox = isMobilePortrait ? "0 550 3840 1060" : "0 0 3840 2160";

  // Estadísticas globales de las etapas calculadas dinámicamente desde el Sheet
  const stageStats = useMemo(() => {
    const stats: Record<string, { total: number; available: number; active: boolean; name: string }> = {
      "ZONA_1": { total: 0, available: 0, active: true, name: isEn ? "Stage 1" : "Etapa 1" },
      "ZONA_2": { total: 0, available: 0, active: true, name: isEn ? "Stage 2" : "Etapa 2" },
      "ZONA_3": { total: 0, available: 0, active: true, name: isEn ? "Stage 3" : "Etapa 3" },
      "ZONA_4": { total: 0, available: 0, active: true, name: isEn ? "Stage 4" : "Etapa 4" },
      "ZONA_5": { total: 0, available: 0, active: true, name: isEn ? "Stage 5" : "Etapa 5" },
      "ZONA_6": { total: 0, available: 0, active: true, name: "Alma Beach" },
    };

    // Procesar disponibilidad de lotes del Sheet
    lots.forEach((lot) => {
      const lotId = (lot.rawId || lot.id).toUpperCase();
      let zone = "";

      if (lotId.startsWith("A-") || lotId.startsWith("B-") || lotId.startsWith("C-")) {
        zone = "ZONA_1";
      } else if (lotId.startsWith("D-") || lotId.startsWith("E-")) {
        zone = "ZONA_2";
      } else if (lotId.startsWith("F-") || lotId.startsWith("G-")) {
        zone = "ZONA_3";
      } else if (lotId.startsWith("H-") || lotId.startsWith("I-")) {
        zone = "ZONA_4";
      } else if (lotId.startsWith("J-") || lotId.startsWith("K-") || lotId.startsWith("L-")) {
        zone = "ZONA_5";
      }

      if (zone && stats[zone]) {
        stats[zone].total += 1;
        if (lot.status === "available") {
          stats[zone].available += 1;
        }
      }
    });

    // Fallbacks si el API aún no carga o está vacía
    if (stats["ZONA_1"].total === 0) { stats["ZONA_1"].total = 62; stats["ZONA_1"].available = 56; }
    if (stats["ZONA_2"].total === 0) { stats["ZONA_2"].total = 54; stats["ZONA_2"].available = 48; }
    if (stats["ZONA_3"].total === 0) { stats["ZONA_3"].total = 62; stats["ZONA_3"].available = 62; }
    if (stats["ZONA_4"].total === 0) { stats["ZONA_4"].total = 73; stats["ZONA_4"].available = 73; }
    if (stats["ZONA_5"].total === 0) { stats["ZONA_5"].total = 67; stats["ZONA_5"].available = 66; }
    if (stats["ZONA_6"].total === 0) stats["ZONA_6"].total = 7;
    stats["ZONA_6"].available = 7;

    return stats;
  }, [lots, isEn]);

  // Trackear posición del cursor
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({
      x,
      y,
      isRightHalf: x > rect.width / 2,
    });
  };

  return (
    <div className="h-[100dvh] w-full bg-[#051415] text-white relative overflow-hidden select-none">
      
      {/* Fondo difuminado esmerilado */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/loom/loom_masterplan_bg.webp"
          alt="Blur background"
          className="w-full h-full object-cover opacity-25 blur-3xl scale-110 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#051415]/80 via-[#0b2426]/60 to-[#051415]/80 pointer-events-none" />
      </div>

      {/* Botón Flotante Volver al Inicio (Sobre la imagen, desplazado para no colisionar con el menú) */}
      <div className="absolute top-2.5 left-13 sm:top-3 sm:left-16 lg:top-4 lg:left-18 z-30 pointer-events-auto flex items-center gap-2">
        <button 
          onClick={onBack}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 bg-[#0A0D0B]/80 hover:bg-[#0A0D0B] active:scale-95 border border-[#EDE7E0]/20 rounded-full text-[0.59375rem] lg:text-[0.625rem] uppercase tracking-wider text-[#EDE7E0] hover:text-[#B35F27] font-bold backdrop-blur-md transition-all duration-300 shadow-lg cursor-pointer"
        >
          ← {isEn ? "Home" : "Inicio"}
        </button>
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 bg-[#EDE7E0]/90 border border-[#0A0D0B]/15 rounded-full text-[0.625rem] uppercase tracking-widest text-[#0A0D0B] font-bold backdrop-blur-md shadow-md">
          <span className="h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
          <span>{isEn ? "Master Plan • Select a Stage" : "Master Plan • Selecciona una Etapa"}</span>
        </div>
      </div>

      {/* Indicador de exploración táctil en móvil vertical */}
      <div className="md:hidden portrait:flex hidden absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A0D0B]/75 border border-[#EDE7E0]/15 backdrop-blur-md text-[9px] uppercase tracking-widest text-[#EDE7E0]/85 font-semibold whitespace-nowrap shadow-md">
        <span className="h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
        <span>{isEn ? "Swipe map or select a stage below" : "Desliza el mapa o elige una etapa abajo"}</span>
      </div>

      <div 
        ref={containerRef}
        className="absolute inset-0 w-full h-full overflow-hidden max-md:portrait:overflow-x-auto max-md:portrait:overflow-y-hidden z-10 touch-pan-x"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredStage(null)}
      >
            {/* Estilos CSS Nativos para Hitbox Vectorial */}
            <style dangerouslySetInnerHTML={{ __html: `
              svg polygon[id^="ZONA_"] {
                fill: transparent !important;
                stroke: transparent !important;
                cursor: pointer !important;
                pointer-events: all !important;
              }
            `}} />

            {/* Wrapper del Mapa: En Desktop ocupa toda la pantalla; en Móvil Vertical ofrece vista panorámica deslizable */}
            <div className="w-full h-full max-md:portrait:w-[235vw] max-md:portrait:min-w-[860px] max-md:portrait:h-[46dvh] max-md:portrait:mt-[9dvh] relative">

              {/* SVG Visual Overlay (Glassmorphism & Zoom) */}
              <svg 
                viewBox={activeViewBox} 
                preserveAspectRatio="xMidYMid meet"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
              >
              <defs>
                {stagesData.map((stage) => (
                  <clipPath 
                    key={stage.id} 
                    id={`clip-${stage.id.toLowerCase().replace('_', '-')}`}
                  >
                    <polygon points={stage.points} />
                  </clipPath>
                ))}
              </defs>

              {/* Imagen de Fondo del Masterplan Base */}
              <image
                href="/loom/loom_masterplan_bg.webp"
                x="0"
                y="0"
                width="3840"
                height="2160"
                pointerEvents="none"
              />


              {stagesData.map((stage) => {
                const isHovered = hoveredStage?.id === stage.id;
                const isActive = stage.active;
                return (
                  <g 
                    key={stage.id}
                    clipPath={`url(#clip-${stage.id.toLowerCase().replace('_', '-')})`}
                    style={{
                      opacity: isHovered ? 1 : 0,
                      transition: "opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    {/* Imagen de Fondo Duplicada con Zoom y Filtros */}
                    <image
                      href="/loom/loom_masterplan_bg.webp"
                      x="0"
                      y="0"
                      width="3840"
                      height="2160"
                      style={{
                        transform: isHovered ? "scale(1.045)" : "scale(1)",
                        transformOrigin: `${stage.cx}px ${stage.cy}px`,
                        transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                        filter: isHovered 
                          ? (isActive ? "blur(1.5px) brightness(1.15) saturate(1.2)" : "blur(1.5px) brightness(0.8) saturate(0.85)") 
                          : "none",
                      }}
                    />

                    {/* Tinte de Vidrio Glassmorphic */}
                    <polygon
                      points={stage.points}
                      fill={isActive ? "#dbaa67" : "#ffffff"}
                      fillOpacity={isActive ? 0.14 : 0.06}
                      stroke={isActive ? "#dbaa67" : "rgba(255,255,255,0.2)"}
                      strokeWidth={isActive ? 14 : 6}
                      style={{
                        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  </g>
                );
              })}
            </svg>

              {/* SVG Vectorial Overlay (Rótulos Nativos e Hitboxes) */}
              <div className="absolute inset-0 w-full h-full z-20 pointer-events-none">
                <svg 
                  viewBox={activeViewBox} 
                  preserveAspectRatio="xMidYMid meet"
                  className="w-full h-full object-contain pointer-events-auto"
                >
                {/* 1. Rótulos Nativos de Etapa (100% Escala Vectorial, con Disponibilidad En Vivo) */}
                <g id="ROTULOS" className="pointer-events-none">
                  {stagesData.map((stage) => {
                    const isHovered = hoveredStage?.id === stage.id;
                    const isActive = stage.active;
                    const stats = stageStats[stage.id];
                    const isAlma = stage.id === "ZONA_6";
                    const stageLabel = isEn ? stage.nameEn : stage.nameEs;
                    const subLabel = isAlma
                      ? isEn
                        ? "BEACH CLUB"
                        : "CLUB DE PLAYA"
                      : `${stats?.available ?? 0} ${isEn ? "AVAIL." : "DISP."} / ${stats?.total ?? 0}`;

                    const pillWidth = isAlma ? 410 : 360;
                    const pillHalf = pillWidth / 2;
                    const dotX = stage.cx - pillHalf + 52;
                    const textX = stage.cx - pillHalf + 84;

                    return (
                      <g 
                        key={`rotulo-${stage.id}`} 
                        style={{ transition: "all 0.3s ease" }}
                      >
                        {/* Fondo del Rótulo (Glassmorphic Marfil) */}
                        <rect
                          x={stage.cx - pillHalf}
                          y={stage.cy - 52}
                          width={pillWidth}
                          height={104}
                          rx={52}
                          fill={isHovered ? "rgba(237, 231, 224, 0.99)" : "rgba(237, 231, 224, 0.93)"}
                          stroke={isHovered ? "#B35F27" : "rgba(179, 95, 39, 0.55)"}
                          strokeWidth={isHovered ? 5 : 3.5}
                          style={{
                            transform: isHovered ? "scale(1.08)" : "scale(1)",
                            transformOrigin: `${stage.cx}px ${stage.cy}px`,
                            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        />

                        {/* Indicador Circular de Disponibilidad */}
                        <circle
                          cx={dotX}
                          cy={stage.cy}
                          r={12}
                          fill={isAlma ? "#B35F27" : "#10b981"}
                          style={{
                            transform: isHovered ? "scale(1.08)" : "scale(1)",
                            transformOrigin: `${stage.cx}px ${stage.cy}px`,
                            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        />
                        {isActive && (
                          <circle
                            cx={dotX}
                            cy={stage.cy}
                            r="12"
                            fill="none"
                            stroke={isAlma ? "#B35F27" : "#10b981"}
                            strokeWidth="3"
                            className="animate-ping"
                            style={{
                              transformOrigin: `${stage.cx}px ${stage.cy}px`,
                            }}
                          />
                        )}

                        {/* Título Principal del Rótulo */}
                        <text
                          x={textX}
                          y={stage.cy - 12}
                          fill="#0A0D0B"
                          fontSize={isAlma ? 26 : 28}
                          fontWeight="800"
                          letterSpacing={isAlma ? "2.5" : "3.5"}
                          textAnchor="start"
                          dominantBaseline="central"
                          style={{
                            transform: isHovered ? "scale(1.08)" : "scale(1)",
                            transformOrigin: `${stage.cx}px ${stage.cy}px`,
                            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        >
                          {stageLabel.toUpperCase()}
                        </text>

                        {/* Subtítulo con Disponibilidad en Vivo */}
                        <text
                          x={textX}
                          y={stage.cy + 20}
                          fill={isAlma ? "#B35F27" : "#0f766e"}
                          fontSize={17}
                          fontWeight="700"
                          letterSpacing="2"
                          textAnchor="start"
                          dominantBaseline="central"
                          style={{
                            transform: isHovered ? "scale(1.08)" : "scale(1)",
                            transformOrigin: `${stage.cx}px ${stage.cy}px`,
                            transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        >
                          {subLabel}
                        </text>
                      </g>
                    );
                  })}
                </g>

                {/* 2. Polígonos Hitbox Invisibles para Clic y Hover (A la cabeza del z-index del SVG) */}
                <g id="HITBOXES">
                  {stagesData.map((stage) => {
                    const stats = stageStats[stage.id];
                    const isActive = stage.active;
                    return (
                      <polygon
                        key={`hit-${stage.id}`}
                        points={stage.points}
                        fill="rgba(0,0,0,0)"
                        stroke="rgba(0,0,0,0)"
                        pointerEvents="all"
                        style={{ cursor: isActive ? "pointer" : "not-allowed" }}
                        onMouseEnter={() => {
                          if (stats) {
                            setHoveredStage({
                              id: stage.id,
                              name: stats.name,
                              total: stats.total,
                              available: stats.available,
                              active: stats.active,
                            });
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredStage((prev) => (prev?.id === stage.id ? null : prev));
                        }}
                        onClick={() => {
                          if (isActive) {
                            onSelectStage(stage.stageKey);
                          }
                        }}
                        onTouchStart={(e) => {
                          const touch = e.touches[0];
                          if (touch && containerRef.current) {
                            const rect = containerRef.current.getBoundingClientRect();
                            const touchX = touch.clientX - rect.left;
                            const touchY = touch.clientY - rect.top;
                            setMousePos({
                              x: touchX,
                              y: touchY,
                              isRightHalf: touchX > rect.width / 2,
                            });
                          }
                          if (stats) {
                            setHoveredStage({
                              id: stage.id,
                              name: stats.name,
                              total: stats.total,
                              available: stats.available,
                              active: stats.active,
                            });
                          }
                        }}
                      />
                    );
                  })}
                </g>
                </svg>
              </div>
            </div>

            {/* Tooltip Flotante */}
            <AnimatePresence>
              {hoveredStage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="hidden md:block absolute z-40 pointer-events-none p-3.5 rounded-xl border bg-[#0A0D0B]/92 border-[#B35F27]/50 shadow-2xl backdrop-blur-md min-w-[13.5rem]"
                  style={{
                    left: mousePos.x,
                    top: mousePos.y,
                    transform: mousePos.isRightHalf
                      ? "translate(calc(-100% - 1.25rem), -50%)"
                      : "translate(1.25rem, -50%)",
                  }}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <h3 className="font-serif text-[#EDE7E0] text-sm font-semibold tracking-wide">
                      {hoveredStage.name}
                    </h3>
                    <span 
                      className={`text-[0.5rem] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                        hoveredStage.active 
                          ? "bg-[#10b981]/25 text-[#10b981] border border-[#10b981]/40" 
                          : "bg-white/10 text-white/50 border border-white/20"
                      }`}
                    >
                      {hoveredStage.active ? (isEn ? "Active" : "Activo") : (isEn ? "Coming Soon" : "Próximamente")}
                    </span>
                  </div>
                  {hoveredStage.active ? (
                    <div className="space-y-1 text-xs text-[#EDE7E0]/80">
                      {hoveredStage.id === "ZONA_6" ? (
                        <p className="flex justify-between">
                          <span>{isEn ? "Amenities:" : "Amenidades:"}</span>
                          <span className="font-semibold text-[#EDE7E0]">{hoveredStage.total}</span>
                        </p>
                      ) : (
                        <>
                          <p className="flex justify-between">
                            <span>{isEn ? "Total Lots:" : "Lotes Totales:"}</span>
                            <span className="font-semibold text-[#EDE7E0]">{hoveredStage.total}</span>
                          </p>
                          <p className="flex justify-between">
                            <span>{isEn ? "Available:" : "Disponibles:"}</span>
                            <span className="font-semibold text-[#10b981]">{hoveredStage.available}</span>
                          </p>
                        </>
                      )}
                      <div className="pt-1.5 mt-1.5 border-t border-white/10 text-[0.625rem] text-[#B35F27] font-bold uppercase tracking-wider flex items-center justify-between">
                        <span>{isEn ? "Click to explore stage" : "Clic para explorar etapa"}</span>
                        <span>→</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-white/40 text-[0.625rem] uppercase tracking-wider font-light mt-1">
                      {isEn ? "This stage will be available soon." : "Esta etapa estará disponible pronto."}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

        {/* Leyenda de Brújula (Flotante a la Derecha) */}
        <div className="absolute bottom-5 right-5 z-20 hidden xl:flex items-center gap-2 text-[#0A0D0B]/80 text-[0.5625rem] uppercase tracking-widest font-semibold bg-[#EDE7E0]/90 border border-[#0A0D0B]/10 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-sm">
          <Compass className="h-3.5 w-3.5 text-[#B35F27] rotate-[45deg]" />
          {isEn ? "North oriented towards the sea (Right / Beach)" : "Norte orientado hacia el mar (Derecha / Playa)"}
        </div>
      </div>

      {/* Selector Rápido de Etapas para Móvil (Grid 2x3 en Vertical / Dock Compacto en Horizontal) */}
      <div className="md:hidden absolute bottom-0 inset-x-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-[#051415] via-[#051415]/95 to-transparent pointer-events-auto">
        <div className="max-w-md mx-auto">
          <p className="portrait:block landscape:hidden text-center text-[9px] uppercase tracking-[0.2em] text-[#EDE7E0]/70 font-bold mb-2">
            {isEn ? "Tap a Stage to Explore Lots & Pricing" : "Toca una Etapa para Explorar Lotes y Precios"}
          </p>
          <div className="grid grid-cols-2 gap-2 landscape:flex landscape:items-center landscape:justify-center landscape:gap-1.5 landscape:overflow-x-auto">
            {stagesData.map((stage) => {
              const stats = stageStats[stage.id];
              const isAlma = stage.id === "ZONA_6";
              const label = isEn ? stage.nameEn : stage.nameEs;
              return (
                <button
                  key={`mobile-stage-${stage.id}`}
                  onClick={() => onSelectStage(stage.stageKey)}
                  className={`flex items-center justify-between px-3 py-2.5 landscape:px-2.5 landscape:py-1.5 rounded-xl border backdrop-blur-md transition-all active:scale-95 text-left cursor-pointer ${
                    isAlma
                      ? "bg-[#B35F27]/25 border-[#B35F27]/60 text-[#EDE7E0]"
                      : "bg-[#EDE7E0]/92 border-[#0A0D0B]/15 text-[#0A0D0B]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isAlma ? "bg-[#F3E5AB]" : "bg-[#10b981]"
                        }`}
                      />
                      <span className="text-[11px] landscape:text-[10px] font-extrabold uppercase tracking-wider truncate">
                        {label}
                      </span>
                    </div>
                    <span
                      className={`block text-[9px] landscape:hidden font-bold uppercase tracking-wider mt-0.5 pl-3.5 ${
                        isAlma ? "text-[#F3E5AB]" : "text-[#0f766e]"
                      }`}
                    >
                      {isAlma
                        ? isEn
                          ? "Beach Club • 23 Renders"
                          : "Club de Playa • 23 Renders"
                        : `${stats?.available ?? 0} ${isEn ? "Avail." : "Disp."} / ${stats?.total ?? 0}`}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold ml-1.5 landscape:hidden ${
                      isAlma ? "text-[#F3E5AB]" : "text-[#B35F27]"
                    }`}
                  >
                    →
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
