"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import styles from "@/app/loom/Loom.module.css";
import dynamic from "next/dynamic";
import LoomMasterplanSelector from "@/components/LoomMasterplanSelector";
import LoomStageViewer from "@/components/LoomStageViewer";
import LoomLotPanel from "@/components/LoomLotPanel";
import LoomShowroomView from "@/components/LoomShowroomView";
import type { MaquetaLot } from "@/components/Loom3DMaquetaView";

const Loom3DMaquetaView = dynamic(() => import("@/components/Loom3DMaquetaView"), {
  ssr: false,
});
import LoomOrientationWrapper from "@/components/LoomOrientationWrapper";
import LoomSideMenu from "@/components/LoomSideMenu";
import LoomLocationModal from "@/components/LoomLocationModal";
import LoomReferralModal from "@/components/LoomReferralModal";
import { AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Menu, Maximize2, Minimize2, ArrowLeft, MessageCircle, Globe, Eye, EyeOff } from "lucide-react";
import { 
  initReferralTracking, 
  getActiveAdvisor, 
  buildGeneralProjectWhatsAppUrl, 
  Advisor 
} from "@/lib/referralTracking";
import { LoomLanguageProvider, useLoomLang, LoomLang, parseSquareMeters, inferStageFromLotId } from "@/lib/loomI18n";

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

// Intervalo exacto en milisegundos donde el video nativo muestra su propio logo en la toma aérea (5,080 ms a 9,960 ms)
// Iniciamos el fade-out a los 4,750 ms para que a los 5,080 ms ya esté limpio, y reaparece con fade progresivo a los 9,970 ms.
const VIDEO_LOGO_FADE_OUT_MS = 4750;
const VIDEO_LOGO_END_MS = 9970;

function LoomShowroomInner({
  initialView = "hero",
  enable3DMaqueta = true,
}: {
  initialView?: "hero" | "map" | "stage" | "maqueta3d" | "showroom";
  enable3DMaqueta?: boolean;
}) {
  const { lang, setLang, isEn } = useLoomLang();
  const [view, setView] = useState<"hero" | "map" | "stage" | "maqueta3d" | "showroom">(initialView);
  const [selectedStage, setSelectedStage] = useState<string | null>(
    initialView === "maqueta3d" || initialView === "stage" ? "etapa_1" : null
  );
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [stats, setStats] = useState({
    total: 318,
    sold: 26,
    available: 292
  });
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const [hideHeroOverlayForVideoLogo, setHideHeroOverlayForVideoLogo] = useState(false);
  const [isCleanVideoView, setIsCleanVideoView] = useState(false);

  // Monitoreo a 60fps del currentTime del video en la Hero para ocultar logo y contadores entre 4,750 ms y 9,970 ms
  useEffect(() => {
    if (view !== "hero") return;
    let rafId: number;

    const checkVideoTime = () => {
      const video = heroVideoRef.current;
      if (video && !video.paused) {
        const currentMs = video.currentTime * 1000;
        const shouldHide = currentMs >= VIDEO_LOGO_FADE_OUT_MS && currentMs < VIDEO_LOGO_END_MS;
        setHideHeroOverlayForVideoLogo((prev) => (prev !== shouldHide ? shouldHide : prev));
      }
      rafId = requestAnimationFrame(checkVideoTime);
    };

    rafId = requestAnimationFrame(checkVideoTime);
    return () => cancelAnimationFrame(rafId);
  }, [view]);

  // Check embed & deep linking parameters from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const stageParam = params.get("stage");
      const lotParam = params.get("lot");
      
      if (stageParam) {
        let normalizedStage = stageParam.toLowerCase();
        if (!normalizedStage.startsWith("etapa_")) {
          normalizedStage = `etapa_${normalizedStage}`;
        }
        queueMicrotask(() => {
          setSelectedStage(normalizedStage);
          setView("stage");
        });
      } else if (lotParam) {
        const block = lotParam.trim().charAt(0).toUpperCase();
        const inferredStage =
          ["A", "B", "C"].includes(block) ? "etapa_1" :
          ["D", "E"].includes(block) ? "etapa_2" :
          ["F", "G"].includes(block) ? "etapa_3" :
          ["H", "I"].includes(block) ? "etapa_4" :
          ["J", "K", "L"].includes(block) ? "etapa_5" : "etapa_1";
        queueMicrotask(() => {
          setSelectedStage(inferredStage);
          setView("stage");
        });
      } else if (params.get("embed") === "true" || params.get("view") === "map") {
        queueMicrotask(() => {
          setView("map");
        });
      }
    }
  }, []);

  // Global Overlay UI States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle Pantalla Completa
  const toggleFullscreen = () => {
    if (typeof window === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error al activar pantalla completa:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch((err) => {
          console.error("Error al salir de pantalla completa:", err);
        });
      }
    }
  };

  // Listener para sync de cambios de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Asesor asignado para contacto directo y atribución
  const [assignedAdvisor, setAssignedAdvisor] = useState<Advisor | null>(null);
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
          const stored = sessionStorage.getItem("loom_ref");
          if (stored) {
            setReferrer(stored);
          } else if (window.location.hostname.includes("patrimofy.com")) {
            sessionStorage.setItem("loom_ref", "patrimofy");
            setReferrer("patrimofy");
          }
        }
      }
    }
  }, []);

  // Cargar lotes y estadísticas
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/lots?project=loom');
        const data = await response.json();
        
        if (data.success && data.lots) {
          setLots(data.lots);
          const total = data.lots.length;
          const available = data.lots.filter((l: { status: string }) => l.status === 'available').length;
          const sold = data.lots.filter((l: { status: string }) => l.status === 'sold').length;

          setStats({
            total: total > 0 ? total : 318,
            sold: total > 0 ? sold : 26,
            available: total > 0 ? available : 292
          });
        }
      } catch (error) {
        console.error("Error fetching live stats for Loom:", error);
      }
    }
    fetchStats();
  }, []);

  const handleOpenContact = () => {
    const currentAdvisor = assignedAdvisor || getActiveAdvisor();

    // 1. Si hay un asesor asignado por link / cookie, abrir directo su WhatsApp
    if (currentAdvisor) {
      const waUrl = buildGeneralProjectWhatsAppUrl("LOOM Luxury Residence", currentAdvisor);
      window.open(waUrl, "_blank");
      return;
    }

    const currentRef = typeof window !== "undefined"
      ? sessionStorage.getItem("loom_ref") || (window.location.hostname.includes("patrimofy.com") ? "patrimofy" : referrer)
      : referrer;

    if (currentRef === "patrimofy" || (typeof window !== "undefined" && window.location.hostname.includes("patrimofy.com") && currentRef !== "chichaus")) {
      const waUrl = buildGeneralProjectWhatsAppUrl("LOOM Luxury Residence");
      window.open(waUrl, "_blank");
    } else if (currentRef === "chichaus") {
      window.open("https://www.loomalmabeach.com/#contacto", "_blank");
    } else {
      setIsReferralModalOpen(true);
    }
  };

  const handleCloseLotPanel = () => {
    setSelectedLot(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("lot")) {
        url.searchParams.delete("lot");
        window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
      }
    }
  };

  const handleNavigateToShowroom = () => {
    if (!selectedLot) {
      const sampleLot = lots.find((l) => l.status === "available") || {
        id: "B-22",
        rawId: "B-22",
        area: "252.79",
        location: "ESQUINERO",
        status: "available",
        statusRaw: "DISPONIBLE",
        totalPrice: "$267,957,400",
        downPayment: "$53,591,480",
        financing: "$3,907,712",
        finalPayment: "$26,795,740",
      };
      setSelectedLot(sampleLot as Lot);
    }
    setView("showroom");
  };

  const handleEnter3DMaqueta = () => {
    if (!selectedStage) {
      setSelectedStage("etapa_1");
    }
    setView("maqueta3d");
  };

  // Mapa indexado de lotes con área numérica para la Maqueta 3D y navegación por colindancias
  const maquetaLotsMap = useMemo<Record<string, MaquetaLot>>(() => {
    const map: Record<string, MaquetaLot> = {};
    lots.forEach((l) => {
      const cleanId = (l.id || "").toUpperCase().replace(/[^A-Z0-9_]/g, "");
      const item: MaquetaLot = {
        ...l,
        areaNumeric: parseSquareMeters(l.area),
      };
      map[l.id.toUpperCase()] = item;
      map[cleanId] = item;
    });
    return map;
  }, [lots]);

  const handleSelectNeighborLot = (neighborId: string) => {
    const clean = neighborId.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const found =
      lots.find(
        (l) =>
          l.id.toUpperCase().replace(/[^A-Z0-9]/g, "") === clean ||
          (l.rawId || "").toUpperCase().replace(/[^A-Z0-9]/g, "") === clean
      ) || null;
    if (found) {
      const targetStage = inferStageFromLotId(found.id);
      if (targetStage !== selectedStage) {
        setSelectedStage(targetStage);
      }
      setSelectedLot(found);
    }
  };

  return (
    <LoomOrientationWrapper>
      
      {/* Controles Flotantes Globales (Menú Hamburguesa & Regresar al Master Plan en Hero) */}
      <div className="fixed top-2.5 left-3 sm:top-3 sm:left-3.5 lg:top-4 lg:left-4 z-40 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="p-2 lg:p-3 rounded-full bg-[#EDE7E0]/90 text-[#0A0D0B] border border-[#0A0D0B]/15 shadow-xl backdrop-blur-md hover:bg-[#EDE7E0] hover:text-[#B35F27] transition-all duration-300 group cursor-pointer"
          title={isEn ? "Navigation Menu" : "Menú de Navegación"}
        >
          <Menu className="h-4 w-4 lg:h-5 lg:w-5 group-hover:scale-110 transition-transform" />
        </button>

        {view === "hero" && (
          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3.5 lg:py-2 rounded-full bg-[#EDE7E0]/90 text-[#0A0D0B] border border-[#0A0D0B]/15 shadow-xl backdrop-blur-md hover:bg-[#EDE7E0] hover:text-[#B35F27] text-[0.625rem] lg:text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span>
              <span className="hidden sm:inline">{isEn ? "Back to " : "Regresar al "}</span>
              Master Plan
            </span>
          </Link>
        )}
      </div>

      {view !== "showroom" && view !== "maqueta3d" && !(view === "stage" && selectedLot) && (
        <div className="fixed top-2.5 right-3 sm:top-3 sm:right-3.5 lg:top-4 lg:right-4 z-40 flex items-center gap-1.5 lg:gap-2 pointer-events-auto">
          {/* Botón Elegante de Vista Limpia (Solo en la Hero para apreciar el video) */}
          {view === "hero" && (
            <button
              onClick={() => setIsCleanVideoView((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3.5 lg:py-2 rounded-full border shadow-xl backdrop-blur-md text-[0.625rem] lg:text-[0.6875rem] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                isCleanVideoView
                  ? "bg-[#B35F27] text-[#EDE7E0] border-[#B35F27] hover:bg-[#964d1d]"
                  : "bg-[#EDE7E0]/92 text-[#0A0D0B] border-[#0A0D0B]/15 hover:bg-[#EDE7E0] hover:text-[#B35F27]"
              }`}
              title={
                isCleanVideoView
                  ? isEn
                    ? "Show Logo & Lot Counters"
                    : "Mostrar Logo y Contadores"
                  : isEn
                  ? "Clean Video View (Hide Logo & Counters)"
                  : "Vista Limpia (Ocultar Logo y Contadores)"
              }
            >
              {isCleanVideoView ? (
                <>
                  <Eye className="h-3.5 w-3.5 lg:h-4 lg:w-4 shrink-0" />
                  <span className="sm:hidden">{isEn ? "Info" : "Info"}</span>
                  <span className="hidden sm:inline">{isEn ? "Show Info" : "Mostrar Info"}</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-[#B35F27] shrink-0" />
                  <span className="sm:hidden">{isEn ? "Clean" : "Limpia"}</span>
                  <span className="hidden sm:inline">{isEn ? "Clean View" : "Vista Limpia"}</span>
                </>
              )}
            </button>
          )}

          {/* Selector de Idioma Ultra-Compacto y Discreto (ES / EN) */}
          <button
            onClick={() => setLang(lang === "es" ? "en" : "es")}
            className="flex items-center px-2 py-1 rounded-full bg-[#0A0D0B]/55 hover:bg-[#0A0D0B]/85 border border-white/15 backdrop-blur-md text-[0.53125rem] lg:text-[0.5625rem] font-mono uppercase tracking-wider transition-all cursor-pointer shadow-sm"
            title={isEn ? "Switch Language (ES / EN)" : "Cambiar Idioma (ES / EN)"}
          >
            <span className={lang === "es" ? "text-[#EDE7E0] font-bold" : "text-[#EDE7E0]/40"}>
              ES
            </span>
            <span className="text-[#EDE7E0]/25 mx-1">/</span>
            <span className={lang === "en" ? "text-[#EDE7E0] font-bold" : "text-[#EDE7E0]/40"}>
              EN
            </span>
          </button>

          {assignedAdvisor && (
            <button
              onClick={handleOpenContact}
              className="hidden sm:flex items-center gap-1.5 lg:gap-2 px-2.5 py-1.5 lg:px-3.5 lg:py-2 rounded-full bg-[#EDE7E0]/95 text-[#0A0D0B] border border-[#B35F27]/35 shadow-xl backdrop-blur-md text-[0.59375rem] lg:text-[0.6875rem] font-semibold uppercase tracking-wider transition-all duration-300 hover:scale-105 cursor-pointer"
              title={
                isEn
                  ? `Contact your advisor ${assignedAdvisor.name} via WhatsApp`
                  : `Contactar a tu asesor ${assignedAdvisor.name} por WhatsApp`
              }
            >
              <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>
                <span className="hidden xl:inline">{isEn ? "Advisor:" : "Asesor:"} </span>
                <strong className="text-[#B35F27]">{assignedAdvisor.name.split(" ")[0]}</strong>
              </span>
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="p-2 lg:p-3 rounded-full bg-[#EDE7E0]/90 text-[#0A0D0B] border border-[#0A0D0B]/15 shadow-xl backdrop-blur-md hover:bg-[#EDE7E0] hover:text-[#B35F27] transition-all duration-300 group cursor-pointer"
            title={
              isFullscreen
                ? isEn ? "Exit Fullscreen" : "Salir de Pantalla Completa"
                : isEn ? "Pantalla Completa" : "Pantalla Completa"
            }
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4 lg:h-5 lg:w-5 group-hover:scale-110 transition-transform" />
            ) : (
              <Maximize2 className="h-4 w-4 lg:h-5 lg:w-5 group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>
      )}

      {/* Menú Lateral Desplegable */}
      <LoomSideMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigateToIntro={() => setView("hero")}
        onNavigateToMasterplan={() => setView("map")}
        onNavigateToShowroom={handleNavigateToShowroom}
        onNavigateTo3DMaqueta={enable3DMaqueta ? handleEnter3DMaqueta : undefined}
        onOpenLocation={() => setIsLocationOpen(true)}
        onOpenContact={handleOpenContact}
      />

      {/* Modal de Ubicación (Google Earth & Cartagena) */}
      <LoomLocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        onJumpTo3DMaqueta={enable3DMaqueta ? handleEnter3DMaqueta : undefined}
        onSelectLotFromEarth={
          enable3DMaqueta
            ? (lotId, stageIdFromEarth) => {
                const clean = lotId.toUpperCase().replace(/[^A-Z0-9_]/g, "");
                const found =
                  lots.find(
                    (l) =>
                      l.id.toUpperCase().replace(/[^A-Z0-9_]/g, "") === clean ||
                      (l.rawId || "").toUpperCase().replace(/[^A-Z0-9_]/g, "") === clean
                  ) || null;
                if (stageIdFromEarth) {
                  setSelectedStage(stageIdFromEarth);
                } else if (found) {
                  setSelectedStage(inferStageFromLotId(found.id));
                } else if (!selectedStage) {
                  setSelectedStage("etapa_1");
                }
                if (found) {
                  setSelectedLot(found);
                }
                setView("maqueta3d");
              }
            : undefined
        }
      />

      {/* Modal de Selección de Firma Comercializadora */}
      <LoomReferralModal
        isOpen={isReferralModalOpen}
        onClose={() => setIsReferralModalOpen(false)}
      />

      {/* Vistas Principales del Showroom */}
      {view === "showroom" && selectedLot ? (
        /* Vista del Showroom Interactivo de la Villa */
        <LoomShowroomView
          selectedLot={selectedLot}
          stageId={selectedStage || "etapa_1"}
          onBack={() => setView("stage")}
        />
      ) : view === "maqueta3d" ? (
        /* Vista de Maqueta 3D Interactiva (WebGL Three.js + Villas Bioclimáticas 3D + Atardecer) */
        <div className="relative w-full min-h-dvh bg-[#061112] overflow-hidden flex flex-col">
          <Loom3DMaquetaView
            stageId={selectedStage || "etapa_1"}
            onChangeStage={(newStageId) => {
              setSelectedStage(newStageId);
              setSelectedLot(null);
            }}
            lotsMap={maquetaLotsMap}
            selectedLot={
              selectedLot
                ? {
                    ...selectedLot,
                    areaNumeric: parseSquareMeters(selectedLot.area),
                  }
                : null
            }
            onSelectLot={(mLot) => setSelectedLot(mLot)}
            onExit3D={() => {
              if (!selectedStage) setSelectedStage("etapa_1");
              setView("stage");
            }}
            onOpenLocation={() => setIsLocationOpen(true)}
          />

          <AnimatePresence>
            {selectedLot && (
              <LoomLotPanel
                lot={selectedLot}
                onClose={handleCloseLotPanel}
                onEnterShowroom={() => setView("showroom")}
                onSelectNeighborLot={handleSelectNeighborLot}
                stageLotIds={lots.map((l) => l.id)}
              />
            )}
          </AnimatePresence>
        </div>
      ) : view === "stage" && selectedStage ? (
        /* Vista de Lotes por Etapa */
        <div className="relative w-full min-h-dvh bg-[#070c16] overflow-hidden flex flex-col">
          <LoomStageViewer
            stageId={selectedStage}
            lots={lots}
            selectedLot={selectedLot}
            onSelectLot={(lot) => setSelectedLot(lot)}
            onBack={() => {
              setView("map");
              setSelectedLot(null);
            }}
            onChangeStage={(newStageId) => {
              setSelectedStage(newStageId);
              setSelectedLot(null);
            }}
            onEnter3DMaqueta={enable3DMaqueta ? () => setView("maqueta3d") : undefined}
          />

          {/* Panel Lateral con transición Framer Motion */}
          <AnimatePresence>
            {selectedLot && (
              <LoomLotPanel
                lot={selectedLot}
                onClose={handleCloseLotPanel}
                onEnterShowroom={() => setView("showroom")}
                onSelectNeighborLot={enable3DMaqueta ? handleSelectNeighborLot : undefined}
                stageLotIds={enable3DMaqueta ? lots.map((l) => l.id) : undefined}
              />
            )}
          </AnimatePresence>
        </div>
      ) : view === "map" ? (
        /* Vista de Plano de Urbanismo (Master Plan) */
        <LoomMasterplanSelector
          lots={lots}
          onSelectStage={(stageId) => {
            setSelectedStage(stageId);
            setView("stage");
          }}
          onBack={() => setView("hero")}
          onEnter3DMaqueta={enable3DMaqueta ? handleEnter3DMaqueta : undefined}
        />
      ) : (
        /* Pantalla Hero de Entrada */
        <main className="loom-theme relative w-full min-h-dvh bg-black overflow-hidden flex flex-col text-white select-none">
          <section className={styles.heroContainer}>
            {/* Video de Fondo de Loom */}
            <video
              ref={heroVideoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster="/loom/hero_poster_loom.webp"
              className={styles.backgroundVideo}
            >
              <source src="https://pub-4740e3c376864a1b9b475fcaa0294417.r2.dev/INICIO%20PAGINA.mp4" type="video/mp4" />
            </video>

            {/* Overlay con Gradientes Premium (se atenúa en modo Vista Limpia) */}
            <div
              className={`${styles.gradientOverlay} transition-opacity duration-700 ${
                isCleanVideoView ? "opacity-25" : "opacity-100"
              }`}
            ></div>

            <div className={styles.heroContentCentrado}>
              {/* Contenedor con Fade Progresivo (se oculta en modo Vista Limpia o entre 4,750 ms y 9,970 ms cuando aparece el logo nativo del video) */}
              <div
                className={`flex flex-col items-center transition-all ease-out ${
                  isCleanVideoView || hideHeroOverlayForVideoLogo
                    ? "opacity-0 scale-95 translate-y-2 duration-500 pointer-events-none"
                    : "opacity-100 scale-100 translate-y-0 duration-1000"
                }`}
              >
                {/* Logo de Loom en el Centro */}
                <div className={styles.centerLogoContainer}>
                  <img 
                    src="/loom/logo_loom.png" 
                    alt="Loom Luxury Residence" 
                    className={styles.logoCentrado}
                  />
                </div>

                {/* Estadísticas de Disponibilidad (Visibles en Celular Vertical / Ocultas en Celular Horizontal por Altura Reducida) */}
                <div className={`flex gap-2 sm:gap-4 justify-center my-3 sm:my-6 text-center relative z-10 px-2 ${styles.heroStatsContainer}`}>
                  {/* Lotes Totales */}
                  <div className="px-2.5 py-1.5 sm:px-6 sm:py-3.5 bg-white/10 hover:bg-white/20 border border-white/35 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all duration-300 flex-1 sm:flex-initial min-w-[4.7rem] sm:min-w-[7.8rem]">
                    <span className="text-[#F3E5AB] font-bold text-sm sm:text-2xl md:text-3xl block font-serif tracking-wider [text-shadow:_0_1.5px_6px_rgba(0,0,0,0.9)]">
                      <AnimatedCounter endValue={stats.total} />
                    </span>
                    <span className="text-white font-bold text-[0.4375rem] sm:text-[0.5625rem] md:text-[0.625rem] uppercase tracking-[0.15em] block mt-0.5 [text-shadow:_0_1px_3px_rgba(0,0,0,0.9)]">
                      {isEn ? "Total Lots" : "Lotes Totales"}
                    </span>
                  </div>

                  {/* Disponibles */}
                  <div className="px-2.5 py-1.5 sm:px-6 sm:py-3.5 bg-white/10 hover:bg-white/20 border border-[#7EF3D0]/60 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all duration-300 flex-1 sm:flex-initial min-w-[4.7rem] sm:min-w-[7.8rem]">
                    <span className="text-[#7EF3D0] font-bold text-sm sm:text-2xl md:text-3xl block font-serif tracking-wider [text-shadow:_0_1.5px_6px_rgba(0,0,0,0.9)]">
                      <AnimatedCounter endValue={stats.available} />
                    </span>
                    <span className="text-[#7EF3D0] font-bold text-[0.4375rem] sm:text-[0.5625rem] md:text-[0.625rem] uppercase tracking-[0.15em] block mt-0.5 [text-shadow:_0_1px_3px_rgba(0,0,0,0.9)]">
                      {isEn ? "Available" : "Disponibles"}
                    </span>
                  </div>

                  {/* Vendidos */}
                  <div className="px-2.5 py-1.5 sm:px-6 sm:py-3.5 bg-white/10 hover:bg-white/20 border border-white/35 rounded-xl sm:rounded-2xl backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.35)] transition-all duration-300 flex-1 sm:flex-initial min-w-[4.7rem] sm:min-w-[7.8rem]">
                    <span className="text-white font-bold text-sm sm:text-2xl md:text-3xl block font-serif tracking-wider [text-shadow:_0_1.5px_6px_rgba(0,0,0,0.9)]">
                      <AnimatedCounter endValue={stats.sold} />
                    </span>
                    <span className="text-white/90 font-bold text-[0.4375rem] sm:text-[0.5625rem] md:text-[0.625rem] uppercase tracking-[0.15em] block mt-0.5 [text-shadow:_0_1px_3px_rgba(0,0,0,0.9)]">
                      {isEn ? "Sold" : "Vendidos"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de Entrar Centrado (Estilo Glassmorphism de Loom) */}
              <button 
                onClick={() => setView("map")}
                className={styles.entrarBtn}
              >
                {isEn ? "Enter Showroom" : "Ingresar al Showroom"}
              </button>
            </div>
          </section>
        </main>
      )}
    </LoomOrientationWrapper>
  );
}

export function LoomShowroomApp({
  defaultLang,
  initialView = "hero",
  enable3DMaqueta = true,
}: {
  defaultLang?: LoomLang;
  initialView?: "hero" | "map" | "stage" | "maqueta3d" | "showroom";
  enable3DMaqueta?: boolean;
}) {
  return (
    <LoomLanguageProvider defaultLang={defaultLang}>
      <LoomShowroomInner initialView={initialView} enable3DMaqueta={enable3DMaqueta} />
    </LoomLanguageProvider>
  );
}

export default function LoomShowroom() {
  return <LoomShowroomApp defaultLang="es" />;
}


