"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Home, Map, Download, MapPin, Phone, Sparkles, Compass, Globe } from "lucide-react";
import Link from "next/link";
import { useLoomLang } from "@/lib/loomI18n";

interface LoomSideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToIntro: () => void;
  onNavigateToMasterplan: () => void;
  onNavigateToShowroom: () => void;
  onOpenLocation: () => void;
  onOpenContact: () => void;
}

export default function LoomSideMenu({
  isOpen,
  onClose,
  onNavigateToIntro,
  onNavigateToMasterplan,
  onNavigateToShowroom,
  onOpenLocation,
  onOpenContact,
}: LoomSideMenuProps) {
  const { lang, isEn, setLang } = useLoomLang();
  if (!isOpen) return null;

  const handleDownloadBrochure = () => {
    const link = document.createElement("a");
    link.href = "/loom/brochure_loom_residence.pdf";
    link.download = "Brochure_Loom_Luxury_Residence.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop desvanecido */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        />

        {/* Cajón Lateral Desplegable (Drawer Desplazable) */}
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 180 }}
          className="relative z-10 w-[88vw] max-w-sm h-full max-h-[100dvh] overflow-y-auto overscroll-contain touch-pan-y bg-[#EDE7E0] text-[#0A0D0B] border-r border-[#0A0D0B]/15 shadow-2xl flex flex-col justify-between p-5 sm:p-8 backdrop-blur-xl"
        >
          {/* Header del Menú */}
          <div>
            <div className="flex justify-between items-center pb-5 border-b border-[#0A0D0B]/10">
              <div>
                <span className="text-[0.5625rem] font-bold uppercase tracking-[0.25em] text-[#B35F27] block">
                  {isEn ? "Showroom Navigation" : "Navegación Showroom"}
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-semibold text-[#0A0D0B] mt-0.5">
                  LOOM Luxury Residence
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 border border-[#0A0D0B]/10 transition-all group cursor-pointer"
              >
                <X className="h-5 w-5 text-[#0A0D0B]/70 group-hover:text-[#0A0D0B]" />
              </button>
            </div>

            {/* Selector de Idioma ES / EN */}
            <div className="mt-4 flex items-center justify-between bg-white/70 border border-[#0A0D0B]/10 rounded-xl px-3.5 py-2">
              <div className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-wider text-[#0A0D0B]/70">
                <Globe className="h-3.5 w-3.5 text-[#B35F27]" />
                <span>{isEn ? "Language" : "Idioma"}</span>
              </div>
              <div className="flex items-center gap-1 bg-[#EDE7E0] p-0.5 rounded-lg border border-[#0A0D0B]/10">
                <button
                  onClick={() => setLang("es")}
                  className={`px-2.5 py-1 rounded-md text-[0.625rem] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    lang === "es"
                      ? "bg-[#B35F27] text-[#EDE7E0] shadow-sm"
                      : "text-[#0A0D0B]/60 hover:text-[#0A0D0B]"
                  }`}
                >
                  ES
                </button>
                <button
                  onClick={() => setLang("en")}
                  className={`px-2.5 py-1 rounded-md text-[0.625rem] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    lang === "en"
                      ? "bg-[#B35F27] text-[#EDE7E0] shadow-sm"
                      : "text-[#0A0D0B]/60 hover:text-[#0A0D0B]"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Lista de Ítems del Menú */}
            <nav className="mt-5 space-y-1.5">
              <button
                onClick={() => {
                  onNavigateToIntro();
                  onClose();
                }}
                className="w-full px-4 py-3 rounded-xl hover:bg-white/80 border border-transparent hover:border-[#0A0D0B]/10 transition-all flex items-center gap-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#0A0D0B] cursor-pointer group"
              >
                <Home className="h-4 w-4 text-[#B35F27] group-hover:scale-110 transition-transform" />
                <span>{isEn ? "1. Intro / Home" : "1. Intro / Inicio"}</span>
              </button>

              <button
                onClick={() => {
                  onNavigateToMasterplan();
                  onClose();
                }}
                className="w-full px-4 py-3 rounded-xl hover:bg-white/80 border border-transparent hover:border-[#0A0D0B]/10 transition-all flex items-center gap-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#0A0D0B] cursor-pointer group"
              >
                <Map className="h-4 w-4 text-[#B35F27] group-hover:scale-110 transition-transform" />
                <span>{isEn ? "2. Master Plan & Stages" : "2. Master Plan & Etapas"}</span>
              </button>

              <button
                onClick={() => {
                  onNavigateToShowroom();
                  onClose();
                }}
                className="w-full px-4 py-3 rounded-xl hover:bg-white/80 border border-transparent hover:border-[#0A0D0B]/10 transition-all flex items-center gap-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#0A0D0B] cursor-pointer group"
              >
                <Sparkles className="h-4 w-4 text-[#B35F27] group-hover:scale-110 transition-transform" />
                <span>{isEn ? "3. 3D Renders & Villa Models" : "3. Renders 3D & Modelos de Villa"}</span>
              </button>

              <button
                onClick={() => {
                  onOpenLocation();
                  onClose();
                }}
                className="w-full px-4 py-3 rounded-xl hover:bg-white/80 border border-transparent hover:border-[#0A0D0B]/10 transition-all flex items-center gap-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#0A0D0B] cursor-pointer group"
              >
                <MapPin className="h-4 w-4 text-[#B35F27] group-hover:scale-110 transition-transform" />
                <span>{isEn ? "4. Location & Google Earth 3D" : "4. Ubicación & Google Earth 3D"}</span>
              </button>

              <button
                onClick={() => {
                  handleDownloadBrochure();
                  onClose();
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/70 hover:bg-white border border-[#B35F27]/30 transition-all flex items-center justify-between text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#B35F27] cursor-pointer group shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <Download className="h-4 w-4 text-[#B35F27] group-hover:translate-y-0.5 transition-transform" />
                  <span>{isEn ? "5. Official Brochure" : "5. Brochure Informativo"}</span>
                </div>
                <span className="text-[0.5625rem] bg-[#B35F27]/10 px-2 py-0.5 rounded font-mono font-bold">PDF</span>
              </button>

              <Link
                href="/"
                onClick={onClose}
                className="w-full px-4 py-3 rounded-xl bg-[#B35F27]/10 hover:bg-[#B35F27]/20 border border-[#B35F27]/30 transition-all flex items-center gap-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#B35F27] cursor-pointer group shadow-sm"
              >
                <Compass className="h-4 w-4 text-[#B35F27] group-hover:rotate-45 transition-transform" />
                <span>{isEn ? "Switch Project" : "Cambiar de Proyecto"}</span>
              </Link>

              <button
                onClick={() => {
                  onOpenContact();
                  onClose();
                }}
                className="w-full px-4 py-3 rounded-xl hover:bg-white/80 border border-transparent hover:border-[#0A0D0B]/10 transition-all flex items-center gap-3.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#0A0D0B] cursor-pointer group"
              >
                <Phone className="h-4 w-4 text-[#B35F27] group-hover:scale-110 transition-transform" />
                <span>{isEn ? "6. Contact & Advisory" : "6. Contacto & Asesoría"}</span>
              </button>
            </nav>
          </div>

          {/* Footer del Menú Lateral */}
          <div className="pt-4 border-t border-[#0A0D0B]/10 space-y-3">
            <div className="bg-[#B35F27]/10 border border-[#B35F27]/25 p-3 rounded-xl text-center">
              <span className="text-[0.5625rem] uppercase font-bold text-[#B35F27] tracking-widest block">
                LOOM Luxury Residence
              </span>
              <span className="text-[0.625rem] text-[#0A0D0B]/70 block mt-0.5">
                by Alma Beach &bull; Cartagena de Indias
              </span>
            </div>

            <p className="text-[0.5625rem] text-[#0A0D0B]/40 text-center uppercase tracking-widest">
              &copy; 2026 Loom Residence &bull; All Rights Reserved
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
