"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  CheckCircle, 
  Maximize2, 
  Layers, 
  Image as ImageIcon, 
  Compass, 
  Eye, 
  Phone,
  Info,
  Building2,
  Sparkles,
  Ruler,
  ZoomIn,
  MessageCircle
} from "lucide-react";
import LoomReferralModal from "./LoomReferralModal";
import { 
  ADVISORS_REGISTRY,
  getActiveAdvisor, 
  buildLotWhatsAppUrl, 
  shouldDelegateSeparateToParentFrame,
  isInstitutionalAdvisor,
  getAdvisorDisplayLabel,
  getAdvisorPanelPrefix,
} from "@/lib/referralTracking";
import { useAdvisorAttribution } from "@/hooks/useAdvisorAttribution";
import type { Lot } from "@/types/lots";
import {
  translateMediaTitle,
  LOOM_SHARED_GALLERY,
  LOOM_SHARED_AXONOMETRICS,
  LOOM_LUXURY_PLANS,
  LOOM_GARDEN_PLANS,
  LOOM_SHARED_ELEVATIONS,
  getLoomTour360List,
} from "@/data/loomGalleries";
import {
  useLoomLang,
  translateLocationType,
  translateStatusRaw,
  translateAreaText,
  formatCopOrUsd,
  getStageDisplayName,
} from "@/lib/loomI18n";

interface LoomShowroomViewProps {
  selectedLot: Lot;
  stageId: string;
  onBack: () => void;
}

export default function LoomShowroomView({ selectedLot, stageId, onBack }: LoomShowroomViewProps) {
  const { isEn, trm } = useLoomLang();
  // Panel lateral expandido/colapsado
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);

  // Modelo de Villa activo ("luxury" | "garden")
  const [selectedVilla, setSelectedVilla] = useState<"luxury" | "garden">("luxury");
  
  // Pestaña activa ("gallery" | "axonometric" | "plans" | "elevations" | "tour360")
  const [activeTab, setActiveTab] = useState<"gallery" | "axonometric" | "plans" | "elevations" | "tour360">("gallery");

  // Índice de elemento activo en la pestaña actual (para el Visor Principal)
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Lightbox a pantalla completa real
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lotBlueprintLightboxOpen, setLotBlueprintLightboxOpen] = useState<boolean>(false);

  // Modal de selección de inmobiliaria / asesoría comercial
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);

  // Asesor asignado y referidor para contacto directo y atribución
  const { assignedAdvisor, referrer } = useAdvisorAttribution("loom_ref");

  const sharedGallery = LOOM_SHARED_GALLERY;
  const sharedAxonometrics = LOOM_SHARED_AXONOMETRICS;
  const luxuryPlans = LOOM_LUXURY_PLANS;
  const gardenPlans = LOOM_GARDEN_PLANS;
  const sharedElevations = LOOM_SHARED_ELEVATIONS;
  const tour360List = getLoomTour360List(isEn);

  const formattedStage = stageId
    ? getStageDisplayName(stageId, isEn)
    : isEn ? "Stage 1" : "Etapa 1";

  const locationTypeDisplay = selectedLot.location && !selectedLot.location.toLowerCase().includes("etapa")
    ? translateLocationType(selectedLot.location, isEn)
    : isEn ? "Interior Lot" : "Lote Medianero";

  const lotIdentifier = selectedLot.rawId || selectedLot.id || "";
  const match = lotIdentifier.match(/([A-Za-z])-?(\d+)/);
  const blockLetter = match ? match[1].toUpperCase() : "";
  const lotNumber = match ? match[2].padStart(2, '0') : "";
  const individualLotPlanSrc = blockLetter && lotNumber ? `/loom/lots/${blockLetter}-${lotNumber}.webp?v=2` : `/loom/lots/${lotIdentifier}.webp?v=2`;

  const lotPlanItem = {
    num: "00",
    title: isEn
      ? `Technical Blueprint & Dimensions for Lot ${selectedLot.rawId || selectedLot.id}`
      : `Plano Técnico y Medidas del Lote ${selectedLot.rawId || selectedLot.id}`,
    category: isEn ? "Lot Blueprint" : "Plano del Lote",
    src: individualLotPlanSrc,
    specs: isEn
      ? `Area: ${translateAreaText(selectedLot.area, true)} • Type: ${locationTypeDisplay}`
      : `Área: ${selectedLot.area} m² • Ubicación: ${locationTypeDisplay}`,
    description: isEn
      ? `Official architectural blueprint for Lot ${selectedLot.rawId || selectedLot.id} with exact perimeter dimensions and boundaries (1 m² = 10.76 sq ft).`
      : `Plano arquitectónico oficial del lote ${selectedLot.rawId || selectedLot.id} con cotas y linderos exactos en metros (frente, fondo, laterales).`,
  };

  const currentPlans = selectedVilla === "luxury" 
    ? luxuryPlans 
    : gardenPlans;

  const getActiveMediaList = useCallback(() => {
    if (activeTab === "gallery") return sharedGallery;
    if (activeTab === "axonometric") return sharedAxonometrics;
    if (activeTab === "plans") return currentPlans;
    if (activeTab === "elevations") return sharedElevations;
    return [];
  }, [activeTab, currentPlans]);

  const activeMediaList = getActiveMediaList();

  // Reiniciar índice al cambiar de pestaña
  const handleTabChange = (tab: "gallery" | "axonometric" | "plans" | "elevations" | "tour360") => {
    setActiveTab(tab);
    setActiveIndex(0);
  };

  const handlePrevMedia = useCallback(() => {
    if (activeTab === "tour360") {
      setActiveIndex((prev) => (prev - 1 + tour360List.length) % tour360List.length);
    } else {
      setActiveIndex((prev) => (prev - 1 + activeMediaList.length) % activeMediaList.length);
    }
  }, [activeTab, activeMediaList.length, tour360List.length]);

  const handleNextMedia = useCallback(() => {
    if (activeTab === "tour360") {
      setActiveIndex((prev) => (prev + 1) % tour360List.length);
    } else {
      setActiveIndex((prev) => (prev + 1) % activeMediaList.length);
    }
  }, [activeTab, activeMediaList.length, tour360List.length]);

  // Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevMedia();
      if (e.key === "ArrowRight") handleNextMedia();
      if (e.key === "Escape") {
        setLightboxOpen(false);
        setLotBlueprintLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevMedia, handleNextMedia]);

  // Manejo de la acción "Separar Lote" (atribución y WhatsApp de asesor o inmobiliaria)
  const handleSeparateClick = () => {
    const currentAdvisor = assignedAdvisor || getActiveAdvisor();

    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({
        type: 'LOT_SEPARATE_CLICKED',
        payload: {
          lotId: selectedLot.rawId || selectedLot.id,
          price: selectedLot.totalPrice,
          advisor: currentAdvisor?.slug || null,
        }
      }, '*');

      if (shouldDelegateSeparateToParentFrame(currentAdvisor)) {
        return;
      }
    }

    // 1. Si hay un asesor o canal de inmobiliaria asignado por link / cookie, abrir directo su WhatsApp
    if (currentAdvisor) {
      const waUrl = buildLotWhatsAppUrl(
        {
          id: selectedLot.id,
          rawId: selectedLot.rawId,
          price: selectedLot.totalPrice,
          area: selectedLot.area,
        },
        "LOOM Luxury Residence",
        currentAdvisor
      );
      window.open(waUrl, "_blank");
      return;
    }

    // 2. Si viene de una inmobiliaria general o dominio Patrimofy
    const currentRef = typeof window !== "undefined" 
      ? sessionStorage.getItem("loom_ref") || (window.location.hostname.includes("patrimofy.com") ? "patrimofy" : referrer) 
      : referrer;

    if (currentRef === "patrimofy" || (typeof window !== "undefined" && window.location.hostname.includes("patrimofy.com") && currentRef !== "chichaus")) {
      const waUrl = buildLotWhatsAppUrl(
        {
          id: selectedLot.id,
          rawId: selectedLot.rawId,
          price: selectedLot.totalPrice,
          area: selectedLot.area,
        },
        "LOOM Luxury Residence"
      );
      window.open(waUrl, "_blank");
    } else if (currentRef === "chichaus") {
      const waUrl = buildLotWhatsAppUrl(
        {
          id: selectedLot.id,
          rawId: selectedLot.rawId,
          price: selectedLot.totalPrice,
          area: selectedLot.area,
        },
        "LOOM Luxury Residence",
        ADVISORS_REGISTRY["chichaus"]
      );
      window.open(waUrl, "_blank");
    } else {
      setShowReferralModal(true);
    }
  };

  const currentMediaItem = activeTab !== "tour360" ? activeMediaList[activeIndex] : null;
  const currentTourItem = activeTab === "tour360" ? tour360List[activeIndex] : null;

  return (
    <div className="relative w-full h-dvh bg-[#0A0D0B] text-[#EDE7E0] flex flex-col overflow-hidden font-sans select-none">

      {/* ========================================== */}
      {/* 1. VISOR PRINCIPAL INMERSIVO (SE ADAPTA AL PANEL & 4K) */}
      {/* ========================================== */}
      <div 
        className={`relative flex-1 h-full bg-[#0A0D0B] overflow-hidden flex items-center justify-center transition-all duration-300 ${
          isPanelOpen 
            ? "lg:ml-[22rem] xl:ml-[24rem] w-full lg:w-[calc(100%-22rem)] xl:w-[calc(100%-24rem)]" 
            : "w-full ml-0"
        }`}
      >
        
        {/* Fondo borroso sutil de ambientación */}
        {currentMediaItem && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-3xl scale-110 pointer-events-none transition-all duration-700"
            style={{ backgroundImage: `url(${currentMediaItem.src})` }}
          />
        )}

        {/* Gradiente sutil inferior para controles de fondo */}
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#0A0D0B]/90 via-[#0A0D0B]/40 to-transparent pointer-events-none z-10" />

        {/* Contenido Principal (Imágenes HD a Pantalla Sangrada o Tour 360) */}
        <AnimatePresence mode="wait">
          {activeTab === "tour360" ? (
            <motion.div
              key={`tour-${activeIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full z-10"
            >
              <iframe
                src={currentTourItem?.url}
                title={`Tour 360° ${currentTourItem?.label}`}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking"
                allowFullScreen
              />
            </motion.div>
          ) : (
            currentMediaItem && (
              <motion.div
                key={`img-${activeTab}-${activeIndex}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="relative z-10 w-full h-full flex items-center justify-center p-0"
              >
                <img
                  src={currentMediaItem.src}
                  alt={translateMediaTitle(currentMediaItem.title, isEn)}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={() => setLightboxOpen(true)}
                />
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* Flechas de Navegación Claras & Visibles */}
        <button
          onClick={handlePrevMedia}
          className={`absolute ${
            !isPanelOpen ? "left-3 sm:left-14" : "left-3 sm:left-5"
          } top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-[#EDE7E0] hover:bg-[#B35F27] border border-[#0A0D0B]/20 hover:border-[#B35F27] text-[#0A0D0B] hover:text-white transition-all duration-300 backdrop-blur-md shadow-xl active:scale-95 cursor-pointer group`}
          title={isEn ? "Previous (Left Arrow)" : "Anterior (Flecha Izquierda)"}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={handleNextMedia}
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-[#EDE7E0] hover:bg-[#B35F27] border border-[#0A0D0B]/20 hover:border-[#B35F27] text-[#0A0D0B] hover:text-white transition-all duration-300 backdrop-blur-md shadow-xl active:scale-95 cursor-pointer group"
          title={isEn ? "Next (Right Arrow)" : "Siguiente (Flecha Derecha)"}
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Badge Flotante Inferior de Información del Render */}
        <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 sm:px-5 sm:py-2.5 bg-[#0A0D0B]/88 backdrop-blur-xl border border-white/15 rounded-full shadow-2xl max-w-[90vw] sm:max-w-[65vw]">
          <span className="text-[0.625rem] sm:text-xs font-mono font-bold text-[#EBD9AB] uppercase tracking-wider shrink-0">
            {activeTab === "tour360"
              ? `${activeIndex + 1} / ${tour360List.length}`
              : `${activeIndex + 1} / ${activeMediaList.length}`}
          </span>
          <span className="h-3.5 w-[1px] bg-white/20 shrink-0" />
          <p className="text-[0.625rem] sm:text-xs font-serif font-bold text-white truncate max-w-[12.5rem] sm:max-w-[18rem] md:max-w-[24rem]">
            {activeTab === "tour360"
              ? currentTourItem?.label
              : translateMediaTitle(currentMediaItem?.title || "", isEn)}
          </p>
          {activeTab !== "tour360" && (
            <button
              onClick={() => setLightboxOpen(true)}
              className="p-1 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer ml-0.5 shrink-0"
              title={isEn ? "View fullscreen" : "Ver en pantalla completa"}
            >
              <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* ========================================== */}
      {/* 2. BARRA SUPERIOR DE NAVEGACIÓN FLOTANTE */}
      {/* ========================================== */}
      <header className="absolute top-0 left-0 right-0 z-30 px-3 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-b from-[#0A0D0B]/90 via-[#0A0D0B]/60 to-transparent backdrop-blur-sm flex justify-between items-center pointer-events-none">
        
        {/* Lado Izquierdo: Título o Volver si panel cerrado */}
        <div className={`flex items-center gap-1.5 sm:gap-3 pointer-events-auto transition-all duration-300 ${!isPanelOpen ? "ml-11 sm:ml-14" : ""}`}>
          {!isPanelOpen && (
            <>
              <button
                onClick={onBack}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-[#B35F27] hover:bg-[#964d1d] active:scale-95 border border-[#B35F27] rounded-full text-[0.625rem] sm:text-xs font-bold text-[#EDE7E0] uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer whitespace-nowrap"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{isEn ? "Back to Stage" : "Volver a la Etapa"}</span>
                <span className="sm:hidden">{isEn ? "Back" : "Volver"}</span>
              </button>
              <button
                onClick={() => setIsPanelOpen(true)}
                className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 bg-[#EDE7E0]/95 hover:bg-white text-[#0A0D0B] border border-[#0A0D0B]/15 rounded-full text-[0.625rem] font-bold uppercase tracking-wider shadow-md cursor-pointer whitespace-nowrap"
              >
                <Layers className="w-3.5 h-3.5 text-[#B35F27]" />
                <span>{isEn ? "Lot & Models" : "Lote y Modelos"}</span>
              </button>
            </>
          )}

          <div className="hidden md:block">
            <span className="text-[0.5rem] sm:text-[0.5625rem] uppercase tracking-[0.3em] text-[#EBD9AB] font-mono font-bold block">
              {isEn ? "Master Plan Alma Beach • Loom" : "Master Plan Alma Beach • Loom"}
            </span>
            <h1 className="text-xs sm:text-sm font-serif font-bold text-white tracking-wide">
              {isEn ? "Lot" : "Lote"} <span className="text-[#B35F27]">{selectedLot.rawId}</span> &bull; {formattedStage}
            </h1>
          </div>
        </div>

        {/* Lado Derecho: Estado del Lote & Acciones */}
        <div className="flex items-center gap-3 pointer-events-auto mr-0">
          <div className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-[#699385]/20 border border-[#699385]/40 text-[#699385] text-[0.625rem] sm:text-xs font-bold uppercase tracking-widest rounded-full">
            {translateStatusRaw(selectedLot.statusRaw, isEn, selectedLot.status)}
          </div>
        </div>
      </header>

      {/* Fondo Táctil en Móvil/Tablet para Cerrar el Panel y Ver Renders */}
      {isPanelOpen && (
        <div
          onClick={() => setIsPanelOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px]"
        />
      )}

      {/* ========================================== */}
      {/* 3. PANEL LATERAL COLAPSABLE */}
      {/* ========================================== */}
      <motion.aside
        initial={false}
        animate={{
          x: isPanelOpen ? 0 : "-100%",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 bottom-0 z-40 w-[86vw] max-w-[20.625rem] sm:max-w-none sm:w-[19rem] lg:w-[22rem] xl:w-[24rem] bg-[#EDE7E0] text-[#0A0D0B] shadow-2xl border-r border-[#0A0D0B]/15 flex flex-col justify-between"
      >
        {/* Pestaña Flotante Visible para Ocultar/Mostrar el Panel */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="absolute top-1/2 -right-9 sm:-right-10 transform -translate-y-1/2 z-50 flex items-center justify-center w-9 h-14 sm:w-10 sm:h-16 rounded-r-xl sm:rounded-r-2xl bg-[#EDE7E0] hover:bg-[#B35F27] border-y border-r border-[#0A0D0B]/20 hover:border-[#B35F27] text-[#0A0D0B] hover:text-white shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer"
          title={isPanelOpen ? (isEn ? "Hide side panel" : "Ocultar panel lateral") : (isEn ? "Show side panel" : "Mostrar panel lateral")}
        >
          {isPanelOpen ? (
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* Scrollable Panel Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 lg:p-5 space-y-3.5 lg:space-y-4 scrollbar-hide pt-4 lg:pt-5">
          
          {/* Botones Superiores de Navegación en el Panel (Alineados 50/50 con las tarjetas inferiores en móvil) */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2.5 lg:px-4 lg:py-3.5 bg-[#B35F27] hover:bg-[#964d1d] active:scale-95 border border-[#B35F27] rounded-xl text-[0.625rem] lg:text-xs font-bold text-[#EDE7E0] uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer truncate"
            >
              <ChevronLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
              <span className="lg:hidden truncate">{isEn ? "Back to Stage" : "Volver a Etapa"}</span>
              <span className="hidden lg:inline truncate">{isEn ? "Back to Stage" : "Volver a la Etapa"}</span>
            </button>

            <button
              onClick={() => setIsPanelOpen(false)}
              className="lg:hidden w-full flex items-center justify-center gap-1.5 px-2.5 py-2.5 bg-[#0A0D0B] text-[#EDE7E0] rounded-xl text-[0.625rem] font-bold uppercase tracking-wider shadow-md active:scale-95 cursor-pointer truncate"
              title={isEn ? "View Renders" : "Ver Renders"}
            >
              <Eye className="w-3.5 h-3.5 text-[#EBD9AB] shrink-0" />
              <span className="truncate">{isEn ? "View Renders" : "Ver Renders"}</span>
            </button>
          </div>
          
          {/* Header Specs Card */}
          <div className="bg-white/80 border border-[#0A0D0B]/10 rounded-2xl p-3.5 lg:p-4 shadow-sm space-y-2.5 lg:space-y-3">
            <div className="flex justify-between items-start border-b border-[#0A0D0B]/10 pb-2.5 lg:pb-3">
              <div>
                <span className="text-[0.5625rem] lg:text-[0.625rem] uppercase tracking-[0.2em] text-[#B35F27] font-mono font-bold block">
                  {isEn ? "Technical Sheet" : "Ficha Técnica"}
                </span>
                <h2 className="text-lg lg:text-xl font-serif font-bold text-[#0A0D0B] whitespace-nowrap">
                  {isEn ? "Lot" : "Lote"} {selectedLot.rawId}
                </h2>
              </div>
              <span className="px-2.5 py-1 text-[0.5625rem] font-bold uppercase tracking-widest rounded-full bg-[#699385]/15 text-[#699385] border border-[#699385]/30 whitespace-nowrap">
                {formattedStage}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#EDE7E0]/60 p-2.5 rounded-xl border border-[#0A0D0B]/5 min-w-0">
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#0A0D0B]/60 block font-medium">
                  {isEn ? "Lot Area" : "Área Lote"}
                </span>
                <strong className="text-sm font-serif font-bold text-[#0A0D0B] block truncate">
                  {translateAreaText(selectedLot.area, isEn)}
                </strong>
              </div>
              <div className="bg-[#EDE7E0]/60 p-2.5 rounded-xl border border-[#0A0D0B]/5 min-w-0">
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#0A0D0B]/60 block font-medium">
                  {isEn ? "Location" : "Ubicación"}
                </span>
                <strong className="text-xs font-semibold text-[#0A0D0B] truncate block mt-0.5">
                  {locationTypeDisplay.replace(/^Lote\s+/i, "")}
                </strong>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 📐 SECCIÓN: PLANO ARQUITECTÓNICO & MEDIDAS EN EL SHOWROOM   */}
          {/* ============================================================ */}
          <div className="bg-white/80 border border-[#B35F27]/25 rounded-2xl p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#B35F27]">
                <Ruler className="h-4 w-4" />
                <span className="text-[0.625rem] font-bold uppercase tracking-wider text-[#0A0D0B]">
                  {isEn ? "Lot Blueprint & Dimensions" : "Plano & Medidas del Lote"}
                </span>
              </div>
              {blockLetter && (
                <span className="text-[0.5625rem] font-mono font-bold uppercase tracking-wider bg-[#B35F27]/10 text-[#B35F27] border border-[#B35F27]/20 px-2 py-0.5 rounded-md">
                  {isEn ? `Blk ${blockLetter} • Lot ${lotNumber}` : `Mz ${blockLetter} • Lote ${lotNumber}`}
                </span>
              )}
            </div>

            {/* Contenedor de la Imagen con Click para ampliar en pantalla completa */}
            <div 
              onClick={() => setLotBlueprintLightboxOpen(true)}
              className="relative w-full aspect-square bg-[#0A0D0B]/[0.03] rounded-xl overflow-hidden border border-[#0A0D0B]/10 cursor-pointer group shadow-inner flex items-center justify-center transition-all duration-300 hover:border-[#B35F27]/50"
              title={isEn ? "Expand blueprint and dimensions fullscreen" : "Ampliar plano y medidas a pantalla completa"}
            >
              <img
                src={individualLotPlanSrc}
                alt={isEn ? `Blueprint and dimensions for Lot ${selectedLot.rawId || selectedLot.id}` : `Plano y medidas del Lote ${selectedLot.rawId || selectedLot.id}`}
                className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
              />

              {/* Overlay al pasar el cursor */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-2.5">
                <span className="text-white text-[0.625rem] font-semibold flex items-center gap-1.5 backdrop-blur-md bg-black/50 px-2.5 py-1 rounded-full border border-white/20">
                  <Maximize2 className="h-3 w-3 text-[#EBD9AB]" />
                  {isEn ? "Expand Fullscreen" : "Ampliar Medidas"}
                </span>
                <span className="text-[0.5625rem] text-[#EBD9AB] font-mono font-bold bg-[#B35F27]/80 px-2 py-0.5 rounded">
                  1080p
                </span>
              </div>

              {/* Botón de lupa directo a pantalla completa */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLotBlueprintLightboxOpen(true);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-[#0A0D0B] shadow-md border border-[#0A0D0B]/10 hover:bg-[#B35F27] hover:text-white transition-colors duration-200"
                title={isEn ? "View dimensions fullscreen" : "Ver medidas a pantalla completa"}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="text-[0.5625rem] text-[#0A0D0B]/60 leading-tight italic flex items-center gap-1.5 pt-0.5">
              <Info className="h-3 w-3 text-[#B35F27] shrink-0" />
              <span>
                {isEn
                  ? "Perimeter dimensions and boundaries per official architectural blueprint (1 m² = 10.76 sq ft)."
                  : "Cotas perimetrales y linderos según plano arquitectónico oficial."}
              </span>
            </p>
          </div>

          {/* Villa Model Selector Bar */}
          <div className="bg-white/80 border border-[#0A0D0B]/10 rounded-2xl p-2.5 shadow-sm">
            <span className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B35F27] font-bold block mb-2 px-1.5 pt-0.5">
              {isEn ? "Villa Model" : "Modelo de Villa"}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedVilla("luxury")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-300 cursor-pointer active:scale-95 ${
                  selectedVilla === "luxury"
                    ? "bg-[#B35F27] border-[#B35F27] text-[#EDE7E0] shadow-md shadow-[#B35F27]/20"
                    : "bg-[#EDE7E0]/60 border-[#0A0D0B]/10 text-[#0A0D0B]/70 hover:bg-white hover:text-[#0A0D0B]"
                }`}
              >
                <span className="text-xs font-serif font-bold uppercase tracking-wider">Luxury</span>
                <span className="text-[0.5625rem] mt-0.5 font-mono opacity-90">
                  {isEn ? "3,800 sq ft • 3 Levels" : "353 m² • 3 Niveles"}
                </span>
              </button>

              <button
                onClick={() => setSelectedVilla("garden")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-300 cursor-pointer active:scale-95 ${
                  selectedVilla === "garden"
                    ? "bg-[#B35F27] border-[#B35F27] text-[#EDE7E0] shadow-md shadow-[#B35F27]/20"
                    : "bg-[#EDE7E0]/60 border-[#0A0D0B]/10 text-[#0A0D0B]/70 hover:bg-white hover:text-[#0A0D0B]"
                }`}
              >
                <span className="text-xs font-serif font-bold uppercase tracking-wider">Garden</span>
                <span className="text-[0.5625rem] mt-0.5 font-mono opacity-90">
                  {isEn ? "2,949 sq ft • Biophilic" : "274 m² • Biofílico"}
                </span>
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs List */}
          <div className="space-y-2">
            <span className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B35F27] font-bold block px-1">
              {isEn ? "Explore Showroom Media" : "Explorar Medios del Showroom"}
            </span>

            <div className="grid grid-cols-1 gap-1.5">
              {(
                [
                  {
                    id: "gallery" as const,
                    label: isEn ? "1. Rendered Gallery (33 Renders)" : "1. Galería Renderizada (33 Renders)",
                    icon: ImageIcon,
                    count: 33,
                  },
                  {
                    id: "axonometric" as const,
                    label: isEn ? "2. Axonometric View (2 Isometrics)" : "2. Vista Axonométrica (2 Isométricas)",
                    icon: Layers,
                    count: 2,
                  },
                  {
                    id: "plans" as const,
                    label: isEn ? "3. Architectural Plans (4 Levels)" : "3. Plantas Arquitectónicas (4 Niveles)",
                    icon: Building2,
                    count: 4,
                  },
                  {
                    id: "elevations" as const,
                    label: isEn ? "4. Elevations & Sections (4 Plans)" : "4. Alzados & Cortes (4 Planos)",
                    icon: Compass,
                    count: 4,
                  },
                  {
                    id: "tour360" as const,
                    label: isEn ? "5. 360° Virtual Tour (5 Scenes)" : "5. Recorrido 360° (5 Escenarios)",
                    icon: Eye,
                    count: 5,
                  },
                ]
              ).map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer text-left ${
                      isActive
                        ? "bg-[#B35F27] text-[#EDE7E0] shadow-md shadow-[#B35F27]/20"
                        : "bg-white/80 border border-[#0A0D0B]/10 text-[#0A0D0B]/80 hover:bg-white hover:text-[#0A0D0B]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thumbnails Grid for Active Tab Items */}
          <div className="space-y-2 pt-1">
            <span className="text-[0.625rem] uppercase tracking-wider text-[#0A0D0B]/60 font-mono font-bold block px-1">
              {isEn ? "Direct View Selection (Tap to View)" : "Selección Directa de Vista (Toca para Ver)"}
            </span>

            {activeTab === "tour360" ? (
              <div className="grid grid-cols-1 gap-2">
                {tour360List.map((scene, idx) => (
                  <button
                    key={scene.id}
                    onClick={() => {
                      setActiveIndex(idx);
                      if (typeof window !== "undefined" && window.innerWidth < 1024) {
                        setIsPanelOpen(false);
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all duration-300 cursor-pointer ${
                      activeIndex === idx
                        ? "bg-[#0A0D0B] text-white border-[#0A0D0B] shadow-md"
                        : "bg-white/80 border-[#0A0D0B]/10 text-[#0A0D0B]/80 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-[#B35F27]" />
                      <span className="font-semibold truncate">{scene.label}</span>
                    </div>
                    <span className="text-[0.5625rem] font-mono opacity-70 uppercase">{scene.category}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {activeMediaList.map((media, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveIndex(idx);
                      if (typeof window !== "undefined" && window.innerWidth < 1024) {
                        setIsPanelOpen(false);
                      }
                    }}
                    className={`relative rounded-lg overflow-hidden border aspect-[4/3] cursor-pointer transition-all duration-300 group ${
                      activeIndex === idx
                        ? "border-[#B35F27] ring-2 ring-[#B35F27]/50 shadow-md"
                        : "border-[#0A0D0B]/10 hover:border-[#B35F27]/50 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img src={media.src} alt={translateMediaTitle(media.title, isEn)} loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-1">
                      <span className="text-[0.5rem] font-mono text-white font-bold">{media.num}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Financial Breakdown Card */}
          <div className="bg-[#0A0D0B] text-[#EDE7E0] rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
            <div className="flex justify-between items-baseline border-b border-white/10 pb-2.5">
              <span className="text-[0.625rem] uppercase tracking-wider text-[#EBD9AB] font-mono">
                {isEn ? "Total Investment Value (USD)" : "Valor Total Inversión"}
              </span>
              <span className="text-lg font-serif font-bold text-[#EDE7E0]">
                {formatCopOrUsd(selectedLot.totalPrice, isEn, trm, isEn)}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
              <div>
                <span className="text-[0.5rem] uppercase tracking-wider text-white/50 block">
                  {isEn ? "Down Payment" : "Cuota Inicial"}
                </span>
                <span className="font-semibold text-white/90 text-[0.6875rem]">
                  {formatCopOrUsd(selectedLot.downPayment, isEn, trm)}
                </span>
              </div>
              <div>
                <span className="text-[0.5rem] uppercase tracking-wider text-white/50 block">
                  {isEn ? "Financing" : "Financiación"}
                </span>
                <span className="font-semibold text-white/90 text-[0.6875rem]">
                  {formatCopOrUsd(selectedLot.financing, isEn, trm)}
                </span>
              </div>
              <div>
                <span className="text-[0.5rem] uppercase tracking-wider text-white/50 block">
                  {isEn ? "Upon Delivery" : "Contraentrega"}
                </span>
                <span className="font-semibold text-white/90 text-[0.6875rem]">
                  {formatCopOrUsd(selectedLot.finalPayment, isEn, trm)}
                </span>
              </div>
            </div>

            {isEn && (
              <div className="pt-1.5 border-t border-white/10 text-[0.5625rem] font-mono text-[#EBD9AB]/75 flex items-center justify-between">
                <span>Live Daily TRM (Colombia)</span>
                <span>1 USD = ${Math.round(trm).toLocaleString("en-US")} COP</span>
              </div>
            )}
          </div>

        </div>

        {/* Sticky Action Footer */}
        <div className="p-3.5 lg:p-4 max-lg:landscape:p-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/90 border-t border-[#0A0D0B]/10 backdrop-blur-md space-y-2 max-lg:landscape:space-y-0 shrink-0">
          {assignedAdvisor && (
            <div className="max-lg:landscape:hidden bg-[#B35F27]/15 border border-[#B35F27]/35 rounded-xl p-2 text-[0.59375rem] lg:text-[0.625rem] text-[#0A0D0B] uppercase tracking-wider text-center font-semibold flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
              <span className="truncate">
                {getAdvisorPanelPrefix(assignedAdvisor, isEn)}{" "}
                <strong>{assignedAdvisor.name}</strong>
                {!isInstitutionalAdvisor(assignedAdvisor) && (
                  <> &bull; {assignedAdvisor.agency}</>
                )}
              </span>
            </div>
          )}
          <button
            onClick={handleSeparateClick}
            className="w-full py-2.5 lg:py-3 max-lg:landscape:py-2.5 bg-[#B35F27] hover:bg-[#964d1d] active:scale-95 text-[#EDE7E0] font-semibold rounded-xl uppercase tracking-wider text-[0.6875rem] lg:text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#B35F27]/25 cursor-pointer truncate px-3"
          >
            {assignedAdvisor ? (
              <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
            ) : (
              <Phone className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">
              {assignedAdvisor
                ? isEn
                  ? `Reserve via WhatsApp (${getAdvisorDisplayLabel(assignedAdvisor)})`
                  : `Separar por WhatsApp (${getAdvisorDisplayLabel(assignedAdvisor)})`
                : isEn
                ? `Reserve Lot ${selectedLot.rawId}`
                : `Separar Lote ${selectedLot.rawId}`}
            </span>
          </button>
        </div>
      </motion.aside>

      {/* ========================================== */}
      {/* 4. MODAL LIGHTBOX COMPLETO (FULLSCREEN IMAGES) */}
      {/* ========================================== */}
      <AnimatePresence>
        {(lotBlueprintLightboxOpen || (lightboxOpen && currentMediaItem)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6"
          >
            <div className="flex justify-between items-center max-w-7xl mx-auto w-full border-b border-white/10 pb-3">
              <span className="text-xs font-mono text-[#EBD9AB] uppercase tracking-widest font-bold">
                {lotBlueprintLightboxOpen
                  ? lotPlanItem.title
                  : translateMediaTitle(currentMediaItem?.title || "", isEn)}
              </span>
              <button
                onClick={() => {
                  setLightboxOpen(false);
                  setLotBlueprintLightboxOpen(false);
                }}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
              <img
                src={lotBlueprintLightboxOpen ? lotPlanItem.src : currentMediaItem?.src}
                alt={
                  lotBlueprintLightboxOpen
                    ? lotPlanItem.title
                    : translateMediaTitle(currentMediaItem?.title || "", isEn)
                }
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            <div className="max-w-4xl mx-auto w-full bg-white/10 backdrop-blur-md p-4 rounded-xl text-center">
              <p className="text-xs text-white/90 leading-relaxed font-sans">
                {lotBlueprintLightboxOpen ? lotPlanItem.description : currentMediaItem?.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Selección de Inmobiliaria / Asesoría Comercial */}
      <LoomReferralModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        lotRawId={selectedLot.rawId}
        lotContext={{
          id: selectedLot.id,
          rawId: selectedLot.rawId,
          price: selectedLot.totalPrice,
          area: selectedLot.area,
        }}
      />

    </div>
  );
}
