"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { useLoomLang } from "@/lib/loomI18n";

interface LoomLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoomLocationModal({ isOpen, onClose }: LoomLocationModalProps) {
  const { lang, isEn } = useLoomLang();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Listen for postMessage from Patrimofy Earth (e.g., "Volver al Plano Interactivo 3D") and Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "PATRIMOFY_EARTH_RETURN_SHOWROOM") {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Synchronize language dynamically if changed from parent context
  useEffect(() => {
    if (!isOpen || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: "PATRIMOFY_EARTH_SET_LANG", lang },
      "*"
    );
  }, [isOpen, lang]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-50 w-screen h-dvh bg-[#07090e] overflow-hidden"
        >
          {/* Fullscreen Patrimofy Earth 3D Geospatial Viewer */}
          <iframe
            ref={iframeRef}
            title={
              isEn
                ? "Patrimofy Earth 3D • Loom Luxury Residence"
                : "Patrimofy Earth 3D • Loom Luxury Residence"
            }
            src={`/earth/index.html?project=loom&embed=true&lang=${lang}`}
            className="w-full h-full border-0 block bg-[#07090e]"
            allow="fullscreen; geolocation"
          />

          {/* Discrete Floating Return Button (always accessible even if Dossier Drawer is minimized) */}
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? "Return to 3D Interactive Plan" : "Volver al Plano Interactivo 3D"}
            className="fixed top-[6.5rem] md:top-[5.375rem] left-3 md:left-[1.625rem] z-[60] inline-flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl bg-[#0b0f17]/90 hover:bg-[#121826]/95 text-[#f8fafc] border border-[#d4af37]/45 hover:border-[#d4af37] shadow-[0_10px_30px_rgba(0,0,0,0.65)] hover:shadow-[0_0_18px_rgba(212,175,55,0.35)] backdrop-blur-xl transition-all duration-200 cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#d4af37] group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[0.65625rem] sm:text-xs font-medium tracking-wide">
              {isEn ? "Return to 3D Plan" : "Volver al Plano 3D"}
            </span>
            <span className="hidden md:inline-flex items-center px-1.5 py-0.5 ml-0.5 rounded bg-white/5 border border-white/10 text-[0.5625rem] font-mono text-[#94a3b8] uppercase">
              ESC
            </span>
            <X className="w-3 h-3 text-[#94a3b8] group-hover:text-white md:hidden ml-0.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

