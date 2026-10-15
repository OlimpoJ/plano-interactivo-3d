"use client";

import React, { useEffect, useRef, useState, useCallback, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Search, CheckCircle, AlertCircle, Phone, Calculator, X, MessageCircle } from "lucide-react";
import LuwanaReferralModal from "./LuwanaReferralModal";
import { 
  initReferralTracking, 
  getActiveAdvisor, 
  buildLotWhatsAppUrl, 
  Advisor 
} from "@/lib/referralTracking";

export interface StageLotData {
  id: string;
  rawId: string;
  area: string;
  location?: string;
  status: "available" | "reserved" | "sold" | "blocked" | "common";
  statusRaw?: string;
  pricePerM2?: string;
  totalPrice?: string;
  separation?: string;
  downPayment?: string;
  financing?: string;
  finalPayment?: string;
}

interface SvgMapProps {
  svgContent: string;
  liveLots: StageLotData[];
  selectedLotId?: string | null;
  onLotClick: (lotData: StageLotData | null, lotNumStrRaw: string) => void;
  stageNumber: string;
  filterStatus: "all" | "available" | "reserved" | "sold";
}

const SvgMap = memo(({ svgContent, liveLots, selectedLotId, onLotClick, stageNumber, filterStatus }: SvgMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current || !svgContent) return;

    const svg = containerRef.current.querySelector("svg");
    if (!svg) return;

    svg.setAttribute("preserveAspectRatio", "none");

    const embeddedImages = svg.querySelectorAll("image");
    embeddedImages.forEach((img) => img.remove());

    // Disable pointer events on text nodes so they don't intercept polygon clicks or get filled
    const allTexts = svg.querySelectorAll("text, tspan");
    allTexts.forEach((t) => {
      (t as SVGElement).style.pointerEvents = "none";
    });

    const allShapes = svg.querySelectorAll("path, polygon, rect, polyline, circle, ellipse");
    allShapes.forEach((shape) => {
      const el = shape as SVGElement & { cleanup?: () => void };
      if (el.cleanup) el.cleanup();
      
      const lotIdRaw = el.getAttribute("id") || el.parentElement?.getAttribute("id") || "";
      const decodedIdRaw = lotIdRaw.replace(/_x([0-9a-fA-F]{2,})_/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      
      const specialZones = ['ZONA_A', 'ZONA_B', 'ZONA_C', 'ZONA_D', 'ZONA_E', 'ZONA_F', 'ZONA_G', 'ZONA_H', 'SERVIDUMBRE', 'VÍA'];
      let isSpecialZone = false;
      let specialZoneId = "";
      const upperDecoded = decodedIdRaw.toUpperCase();
      const upperRawId = lotIdRaw.toUpperCase();
      
      for (const zone of specialZones) {
        if (upperDecoded.startsWith(zone.toUpperCase()) || upperRawId.startsWith(zone.toUpperCase())) {
          isSpecialZone = true;
          specialZoneId = zone;
          break;
        }
      }

      const matchDigits = decodedIdRaw.match(/\d+/);
      const lotNumStrRaw = matchDigits ? matchDigits[0] : '';
      const parsedLotNum = parseInt(lotNumStrRaw, 10);
      
      // Ensure we ignore background elements but allow special zones
      if (!isSpecialZone && (!lotNumStrRaw || isNaN(parsedLotNum) || parsedLotNum > 500)) {
        el.style.pointerEvents = "none";
        return;
      }
      
      // Robust lot matching: compare extracted digits against Sheet data IDs
      const lotData = isSpecialZone 
        ? null 
        : liveLots.find((l) => {
            const sheetDigits = l.id.match(/\d+/);
            const sheetNum = sheetDigits ? parseInt(sheetDigits[0], 10) : parseInt(l.id, 10);
            return sheetNum === parsedLotNum;
          });

      const status = isSpecialZone ? "common" : (lotData?.status || "available");
      const effectiveFilterStatus = status === "blocked" ? "sold" : status;

      // Filter check
      if (filterStatus !== "all" && status !== "common" && effectiveFilterStatus !== filterStatus) {
        el.style.setProperty('opacity', '0.15', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
        return;
      }

      let baseFill = "rgba(57, 104, 102, 0.4)";
      let baseStroke = "rgba(165, 142, 116, 0.85)";
      let hoverFill = "rgba(165, 142, 116, 0.6)";
      let hoverStroke = "#ffffff";
      
      if (status === "sold") {
        baseFill = "rgba(239, 68, 68, 0.35)";
        baseStroke = "rgba(239, 68, 68, 0.8)";
        hoverFill = "rgba(239, 68, 68, 0.6)";
        hoverStroke = "#ffffff";
      } else if (status === "blocked") {
        baseFill = "rgba(59, 130, 246, 0.35)";
        baseStroke = "rgba(59, 130, 246, 0.85)";
        hoverFill = "rgba(59, 130, 246, 0.6)";
        hoverStroke = "#ffffff";
      } else if (status === "reserved") {
        baseFill = "rgba(234, 179, 8, 0.35)";
        baseStroke = "rgba(234, 179, 8, 0.8)";
        hoverFill = "rgba(234, 179, 8, 0.6)";
        hoverStroke = "#ffffff";
      } else if (status === "common") {
        baseFill = "transparent";
        baseStroke = "rgba(239, 233, 225, 0.35)";
        hoverFill = "rgba(239, 233, 225, 0.15)";
        hoverStroke = "#ffffff";
      }

      const isSelected = selectedLotId != null && (
        (isSpecialZone && selectedLotId === specialZoneId) ||
        (!isSpecialZone && (selectedLotId === lotData?.id || selectedLotId === lotNumStrRaw))
      );

      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('fill', isSelected ? hoverFill : baseFill, 'important');
      el.style.setProperty('stroke', isSelected ? hoverStroke : baseStroke, 'important');
      el.style.setProperty('stroke-width', isSelected ? '2.5px' : '1px', 'important');
      el.style.setProperty('cursor', 'pointer', 'important');
      el.style.setProperty('pointer-events', 'all', 'important');
      el.style.setProperty('transition', 'all 0.3s ease', 'important');

      const handleEnter = () => {
        el.style.setProperty('fill', hoverFill, 'important');
        el.style.setProperty('stroke', hoverStroke, 'important');
        el.style.setProperty('stroke-width', '2.5px', 'important');
      };

      const handleLeave = () => {
        el.style.setProperty('fill', isSelected ? hoverFill : baseFill, 'important');
        el.style.setProperty('stroke', isSelected ? hoverStroke : baseStroke, 'important');
        el.style.setProperty('stroke-width', isSelected ? '2.5px' : '1px', 'important');
      };

      const handleClick = () => {
        if (isSpecialZone) {
          const nameMap: Record<string, string> = {
            'ZONA_A': 'Portería',
            'ZONA_B': 'Zona de Mascotas',
            'ZONA_C': 'Club House',
            'ZONA_D': 'Zona Deportiva',
            'ZONA_E': 'Corredor Playero',
            'ZONA_F': 'Club de Playa Luwana',
            'ZONA_G': 'Club de Playa Anaiwa',
            'ZONA_H': 'Alma Beach',
            'SERVIDUMBRE': 'Servidumbre',
            'VÍA': 'Vía Principal'
          };
          onLotClick({
            id: specialZoneId,
            rawId: nameMap[specialZoneId] || specialZoneId,
            area: "Área Común",
            statusRaw: "Zona Común",
            status: "common",
            pricePerM2: "N/A",
            totalPrice: "Área Común",
            separation: "N/A",
            downPayment: "N/A",
            financing: "N/A"
          }, specialZoneId);
        } else {
          onLotClick(lotData || null, lotNumStrRaw);
        }
      };

      el.addEventListener("mouseenter", handleEnter);
      el.addEventListener("mouseleave", handleLeave);
      el.addEventListener("click", handleClick);
      el.addEventListener("touchstart", handleEnter, { passive: true });
      el.addEventListener("touchend", handleLeave, { passive: true });

      el.cleanup = () => {
        el.removeEventListener("mouseenter", handleEnter);
        el.removeEventListener("mouseleave", handleLeave);
        el.removeEventListener("click", handleClick);
        el.removeEventListener("touchstart", handleEnter);
        el.removeEventListener("touchend", handleLeave);
      };
    });

    return () => {
      allShapes.forEach((shape) => {
        const el = shape as unknown as { cleanup?: () => void };
        if (el.cleanup) el.cleanup();
      });
    };
  }, [svgContent, liveLots, selectedLotId, onLotClick, filterStatus]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#152A2D] shadow-2xl rounded-xl sm:rounded-2xl"
    >
      <img
        src={`/LUWANA_${stageNumber}_bg.jpg`}
        alt={`Masterplan Luwana Etapa ${stageNumber}`}
        className="w-full h-auto block pointer-events-none"
      />
      {svgContent && (
        <div
          className="absolute inset-0 z-20 [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
});

SvgMap.displayName = "SvgMap";

interface StageViewProps {
  stageId: string;
  onBack: () => void;
  onNext?: () => void;
  onChangeStage?: (newStageId: string) => void;
}

export default function StageView({ stageId, onBack, onNext, onChangeStage }: StageViewProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [liveLots, setLiveLots] = useState<StageLotData[]>([]);
  const [selectedLotData, setSelectedLotData] = useState<StageLotData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "reserved" | "sold">("all");
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);
  
  // Asesor asignado para contacto directo por WhatsApp y atribución
  const [assignedAdvisor, setAssignedAdvisor] = useState<Advisor | null>(null);

  // Referidor para atribución comercial en Luwana
  const [referrer, setReferrer] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const adv = initReferralTracking();
      if (adv) {
        setAssignedAdvisor(adv);
        setReferrer(adv.agency.toLowerCase());
      } else {
        const active = getActiveAdvisor();
        if (active) {
          setAssignedAdvisor(active);
          setReferrer(active.agency.toLowerCase());
        } else {
          const stored = sessionStorage.getItem("luwana_ref");
          if (stored) {
            setReferrer(stored);
          } else if (window.location.hostname.includes("patrimofy.com")) {
            sessionStorage.setItem("luwana_ref", "patrimofy");
            setReferrer("patrimofy");
          }
        }
      }
    }
  }, []);

  // Simulador de Pagos (12, 24 y 36 meses según requerimiento)
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [financingMonths, setFinancingMonths] = useState<number>(24);

  const stageNumber = stageId.split('-')[1];

  let stageTitle = "";
  if (stageNumber === "1") stageTitle = "LOTES DEL 1 AL 60";
  else if (stageNumber === "2") stageTitle = "LOTES DEL 61 AL 122";
  else if (stageNumber === "3") stageTitle = "CLUB DE PLAYA Y AMENIDADES";

  useEffect(() => {
    fetch(`/LUWANA ${stageNumber}.svg`)
      .then((res) => res.text())
      .then((data) => setSvgContent(data))
      .catch((err) => console.error("Error loading SVG:", err));

    fetch('/api/lots?project=luwana')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.lots) {
          setLiveLots(data.lots);
        }
      })
      .catch(err => console.error("Error fetching live lots data:", err));
  }, [stageNumber]);

  const hasAutoSelectedRef = useRef<boolean>(false);

  // Deep linking: support ?lot=71 in URL (solo una vez al cargar)
  useEffect(() => {
    if (typeof window !== "undefined" && liveLots.length > 0 && !hasAutoSelectedRef.current) {
      const params = new URLSearchParams(window.location.search);
      const lotParam = params.get("lot");
      if (lotParam) {
        const found = liveLots.find(l => l.id === lotParam || l.rawId.includes(lotParam));
        if (found) {
          hasAutoSelectedRef.current = true;
          queueMicrotask(() => {
            setSelectedLotData(found);
          });
        }
      }
    }
  }, [liveLots]);

  const handleLotClick = useCallback((lotData: StageLotData | null, lotNumStrRaw: string) => {
    if (lotData) {
      setSelectedLotData(lotData);
    } else {
      setSelectedLotData({
        id: lotNumStrRaw,
        rawId: `Lote ${lotNumStrRaw}`,
        area: "TBD",
        statusRaw: "Disponible",
        status: "available",
        pricePerM2: "TBD",
        totalPrice: "TBD",
        separation: "TBD",
        downPayment: "TBD",
        financing: "TBD"
      });
    }
  }, []);

  // Lógica de separación de lote con soporte de atribución, WhatsApp de asesor y modal
  const handleSeparateClick = () => {
    if (!selectedLotData) return;

    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({
        type: 'LOT_SEPARATE_CLICKED',
        payload: {
          lotId: selectedLotData.rawId,
          price: selectedLotData.totalPrice,
          advisor: assignedAdvisor?.slug || null,
        }
      }, '*');
      return;
    }

    const currentAdvisor = assignedAdvisor || getActiveAdvisor();

    // 1. Si hay un asesor asignado por link / cookie, abrir directo su WhatsApp
    if (currentAdvisor) {
      const waUrl = buildLotWhatsAppUrl(
        {
          id: selectedLotData.id,
          rawId: selectedLotData.rawId,
          price: selectedLotData.totalPrice,
          area: selectedLotData.area,
        },
        "Luwana Beach Residence",
        currentAdvisor
      );
      window.open(waUrl, "_blank");
      return;
    }

    // 2. Si viene de una inmobiliaria general o dominio Patrimofy
    const currentRef = typeof window !== "undefined" 
      ? sessionStorage.getItem("luwana_ref") || (window.location.hostname.includes("patrimofy.com") ? "patrimofy" : referrer) 
      : referrer;

    if (currentRef === "patrimofy" || (typeof window !== "undefined" && window.location.hostname.includes("patrimofy.com") && currentRef !== "chichaus")) {
      const waUrl = buildLotWhatsAppUrl(
        {
          id: selectedLotData.id,
          rawId: selectedLotData.rawId,
          price: selectedLotData.totalPrice,
          area: selectedLotData.area,
        },
        "Luwana Beach Residence"
      );
      window.open(waUrl, "_blank");
    } else if (currentRef === "chichaus") {
      window.open("https://chichaus.com/", "_blank");
    } else {
      setShowReferralModal(true);
    }
  };

  // Filtrado de lotes para búsqueda rápida
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return liveLots.filter(l => 
      l.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.rawId.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [searchQuery, liveLots]);

  // Cálculos dinámicos del simulador de cuotas
  const parsedPriceNum = useMemo(() => {
    if (!selectedLotData?.totalPrice) return 0;
    const digits = selectedLotData.totalPrice.replace(/[^\d]/g, '');
    return parseInt(digits, 10) || 0;
  }, [selectedLotData]);

  const calculatedFinancing = useMemo(() => {
    if (!parsedPriceNum) return null;
    const downAmount = Math.round(parsedPriceNum * (downPaymentPct / 100));
    const finalAmount = Math.round(parsedPriceNum * 0.20);
    const financeTotal = parsedPriceNum - downAmount - finalAmount;
    const monthlyAmount = financeTotal > 0 ? Math.round(financeTotal / financingMonths) : 0;
    return {
      downAmount,
      finalAmount,
      financeTotal,
      monthlyAmount,
    };
  }, [parsedPriceNum, downPaymentPct, financingMonths]);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start pt-20 sm:pt-24 pb-10 px-2 sm:px-6 bg-[#152A2D] text-[#EFE9E1] select-none">
      
      {/* Background blurred image for ambiance */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={`/LUWANA_${stageNumber}_bg.jpg`}
          alt="Background blur"
          className="w-full h-full object-cover opacity-25 blur-2xl scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#152A2D]/90 via-[#152A2D]/75 to-[#152A2D]" />
      </div>

      {/* Header & Controls */}
      <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 sm:mb-6 relative z-20">
        <div>
          <span className="text-[9px] sm:text-xs text-[#A58E74] uppercase tracking-[0.25em] font-mono font-bold block">
            Luwana Beach Residence &bull; Zona Norte
          </span>
          <h1 className="text-2xl sm:text-4xl font-serif text-white font-bold mt-0.5" style={{ textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>
            {stageTitle}
          </h1>
        </div>

        {/* Buscador & Filtros de Estado */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Buscador */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-[#A58E74]/30 backdrop-blur-md">
              <Search size={14} className="text-[#A58E74]" />
              <input
                type="text"
                placeholder="Buscar lote (ej: 71)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-white/50 focus:outline-none w-32 sm:w-40"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-white/40 hover:text-white">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Dropdown de resultados de búsqueda */}
            {searchResults.length > 0 && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#152A2D]/95 border border-[#A58E74]/40 rounded-xl p-2 shadow-2xl backdrop-blur-xl z-50 space-y-1">
                {searchResults.map((lot) => (
                  <button
                    key={lot.id}
                    onClick={() => {
                      const numMatch = lot.id.match(/\d+/);
                      const lotNum = numMatch ? parseInt(numMatch[0], 10) : 0;
                      const targetStage = lotNum >= 61 ? "etapa-2" : "etapa-1";
                      if (lotNum > 0 && targetStage !== stageId && onChangeStage) {
                        onChangeStage(targetStage);
                      }
                      setSelectedLotData(lot);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/10 text-xs transition-colors text-left"
                  >
                    <span className="font-serif font-bold text-white">Lote {lot.rawId}</span>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      lot.status === 'available'
                        ? 'bg-[#396866]/40 text-[#A58E74] border border-[#A58E74]/40'
                        : lot.status === 'reserved'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : lot.status === 'blocked'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {lot.statusRaw || lot.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtros de disponibilidad */}
          <div className="flex items-center gap-1 bg-white/5 border border-[#A58E74]/20 p-1 rounded-full backdrop-blur-md">
            {(["all", "available", "reserved", "sold"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filterStatus === st
                    ? "bg-[#A58E74] text-[#EFE9E1] shadow-md font-bold"
                    : "text-[#EFE9E1]/70 hover:text-[#EFE9E1]"
                }`}
              >
                {st === "all" ? "Todos" : st === "available" ? "Disponibles" : st === "reserved" ? "Reservados" : "Vendidos"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Vector Map Viewer */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex-grow bg-[#152A2D]/80 border border-[#A58E74]/30 rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
        
        {/* Top Left Navigation Button */}
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 z-40 flex items-center gap-2 text-[#EFE9E1] hover:text-white transition-all bg-[#152A2D]/80 backdrop-blur-md px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#A58E74]/40 hover:border-[#A58E74] text-xs font-semibold uppercase tracking-wider shadow-lg cursor-pointer"
        >
          <ArrowLeft size={14} /> <span>Master Plan</span>
        </button>

        {/* Top Right Navigation Button */}
        {onNext && (
          <button 
            onClick={onNext}
            className="absolute top-4 right-4 z-40 flex items-center gap-2 text-[#A58E74] hover:text-[#EFE9E1] transition-all bg-[#152A2D]/80 backdrop-blur-md px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-[#A58E74]/40 hover:border-[#A58E74] text-xs font-semibold uppercase tracking-wider shadow-lg cursor-pointer"
          >
            <span>Siguiente Etapa</span> <ArrowRight size={14} />
          </button>
        )}

        <SvgMap 
          svgContent={svgContent} 
          liveLots={liveLots} 
          selectedLotId={selectedLotData?.id}
          onLotClick={handleLotClick} 
          stageNumber={stageNumber}
          filterStatus={filterStatus}
        />
      </div>

      {/* Lot Information Sidebar (With Luwana Brand Colors & Interactive Payment Simulator) */}
      <AnimatePresence>
        {selectedLotData && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] md:w-[460px] z-[100] bg-[#EFE9E1] text-[#152A2D] border-l border-[#A58E74]/30 p-6 sm:p-8 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] overflow-y-auto flex flex-col justify-between"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Close & Header */}
            <div>
              <div className="flex justify-between items-start pb-4 border-b border-[#152A2D]/10">
                <div>
                  <span className="text-[10px] text-[#A58E74] tracking-[0.25em] uppercase font-bold block">Luwana Beach Residence</span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#152A2D] mt-0.5">{selectedLotData.rawId}</h2>
                </div>
                
                <button
                  onClick={() => setSelectedLotData(null)}
                  className="p-1.5 rounded-full hover:bg-black/5 border border-[#152A2D]/10 text-[#152A2D] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mt-4 flex items-center gap-2">
                <div className={`px-3.5 py-1 rounded-full text-xs font-bold tracking-widest uppercase inline-flex items-center gap-1.5 ${
                  selectedLotData.status === 'available' ? 'bg-[#396866]/20 text-[#396866] border border-[#396866]/40' :
                  selectedLotData.status === 'reserved' ? 'bg-amber-500/15 text-amber-800 border border-amber-500/30' :
                  selectedLotData.status === 'blocked' ? 'bg-blue-500/15 text-blue-800 border border-blue-500/30' :
                  selectedLotData.status === 'common' ? 'bg-[#899984]/20 text-[#152A2D] border border-[#899984]/40' :
                  'bg-red-500/15 text-red-700 border border-red-500/30'
                }`}>
                  {selectedLotData.status === 'available' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                  <span>{selectedLotData.statusRaw || selectedLotData.status}</span>
                </div>
              </div>

              {selectedLotData.status !== 'common' ? (
                <div className="space-y-4 mt-5">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-white/80 border border-[#152A2D]/10 p-3.5 rounded-xl shadow-sm">
                    <div>
                      <p className="text-[#152A2D]/50 text-[10px] uppercase tracking-wider font-bold">Área Total</p>
                      <p className="text-[#152A2D] font-serif font-bold text-lg">{selectedLotData.area} m²</p>
                    </div>
                    <div>
                      <p className="text-[#152A2D]/50 text-[10px] uppercase tracking-wider font-bold">Ubicación</p>
                      <p className="text-[#152A2D] font-semibold text-sm capitalize">{selectedLotData.location || 'Medianero'}</p>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  {(selectedLotData.status === 'available' || selectedLotData.status === 'reserved') && (
                    <>
                      <div className="bg-[#152A2D] text-[#EFE9E1] p-4 sm:p-5 rounded-2xl shadow-md space-y-1">
                        <p className="text-[#A58E74] text-[10px] uppercase tracking-wider font-mono font-bold">Valor Total de Inversión</p>
                        <p className="text-2xl sm:text-3xl font-serif font-bold text-[#EFE9E1]">{selectedLotData.totalPrice || 'Consultar'}</p>
                        {selectedLotData.pricePerM2 && (
                          <p className="text-[#EFE9E1]/60 text-xs">Valor por m²: {selectedLotData.pricePerM2}</p>
                        )}
                      </div>

                      {/* Simulador Interactivo de Pagos (12, 24 y 36 meses) */}
                      {calculatedFinancing && (
                        <div className="bg-white/90 border border-[#A58E74]/40 p-4 rounded-xl space-y-3 shadow-sm">
                          <div className="flex items-center gap-2 text-[#A58E74] text-xs font-bold uppercase tracking-wider">
                            <Calculator size={14} />
                            <span>Simulador de Financiación en Obra</span>
                          </div>

                          {/* Slider Cuota Inicial */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-[#152A2D]/70">Cuota Inicial ({downPaymentPct}%):</span>
                              <span className="text-[#A58E74] font-bold">${calculatedFinancing.downAmount.toLocaleString("es-CO")}</span>
                            </div>
                            <input
                              type="range"
                              min="20"
                              max="50"
                              step="5"
                              value={downPaymentPct}
                              onChange={(e) => setDownPaymentPct(parseInt(e.target.value, 10))}
                              className="w-full accent-[#A58E74] cursor-pointer"
                            />
                          </div>

                          {/* Selector de Plazo (12, 24, 36 Meses) */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-[#152A2D]/70">Plazo de Financiación:</span>
                              <span className="text-[#A58E74] font-bold">{financingMonths} meses</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              {[12, 24, 36].map((m) => (
                                <button
                                  key={m}
                                  onClick={() => setFinancingMonths(m)}
                                  className={`py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                                    financingMonths === m
                                      ? "bg-[#A58E74] text-[#EFE9E1] shadow-sm font-bold"
                                      : "bg-[#EFE9E1]/80 text-[#152A2D]/70 hover:bg-white"
                                  }`}
                                >
                                  {m} meses
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Resumen de Cuota Mensual Estimada */}
                          <div className="pt-2 border-t border-[#152A2D]/10 flex justify-between items-baseline">
                            <span className="text-xs text-[#152A2D]/70 font-semibold">Cuota Mensual ({financingMonths}x):</span>
                            <span className="text-base font-serif font-bold text-[#396866]">
                              ${calculatedFinancing.monthlyAmount.toLocaleString("es-CO")}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-white/80 border border-[#152A2D]/10 p-5 rounded-xl mt-6 space-y-2">
                  <h4 className="font-serif font-bold text-base text-[#152A2D]">Espacio Común del Proyecto</h4>
                  <p className="text-xs text-[#152A2D]/70 leading-relaxed font-sans">
                    Zona social y equipamiento urbanístico diseñado para el disfrute y confort de los propietarios de Luwana Beach Residence.
                  </p>
                </div>
              )}

              {/* Alerta de Atribución si viene con link referido o dominio */}
              {assignedAdvisor ? (
                <div className="mt-4 bg-[#A58E74]/20 border border-[#A58E74]/40 rounded-xl p-2.5 text-[10px] text-[#152A2D] leading-relaxed uppercase tracking-wider text-center font-semibold flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
                  <span>Tu Asesor: <strong>{assignedAdvisor.name}</strong> &bull; {assignedAdvisor.agency}</span>
                </div>
              ) : referrer ? (
                <div className="mt-4 bg-[#A58E74]/15 border border-[#A58E74]/40 rounded-xl p-2.5 text-[9px] sm:text-[10px] text-[#152A2D]/80 leading-relaxed uppercase tracking-wider text-center font-medium">
                  Asesoría comercializada por <strong className="text-[#152A2D] font-bold">{referrer === "patrimofy" ? "Patrimofy" : "Chichaus"}</strong>
                </div>
              ) : null}
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 space-y-2 border-t border-[#152A2D]/10 mt-6">
              {selectedLotData.status === 'available' && (
                <button 
                  onClick={handleSeparateClick}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#A58E74] hover:bg-[#8e785f] text-[#EFE9E1] font-bold uppercase tracking-wider text-xs transition-all shadow-lg shadow-[#A58E74]/25 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
                >
                  {assignedAdvisor ? <MessageCircle size={15} className="text-[#25D366]" /> : <Phone size={14} />}
                  <span>{assignedAdvisor ? `Separar por WhatsApp (${assignedAdvisor.name.split(" ")[0]})` : `Separar Lote ${selectedLotData.rawId}`}</span>
                </button>
              )}
              <button 
                onClick={() => setSelectedLotData(null)}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-white/80 border border-[#152A2D]/15 text-[#152A2D] font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Cerrar Panel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Selección de Inmobiliaria para Luwana */}
      <LuwanaReferralModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        lotRawId={selectedLotData?.rawId}
      />
    </div>
  );
}
