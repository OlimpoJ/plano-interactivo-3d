"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smartphone, X } from "lucide-react";
import { useLoomLang } from "@/lib/loomI18n";

const DISMISS_STORAGE_KEY = "loom_landscape_hint_dismissed";

export default function LoomOrientationWrapper({ children }: { children: React.ReactNode }) {
  const { isEn } = useLoomLang();
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_STORAGE_KEY) === "1") {
        setDismissed(true);
      }
    } catch {}

    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsPortraitMobile(width < 1024 && height > width);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation, { passive: true });
    window.addEventListener("orientationchange", checkOrientation, { passive: true });

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_STORAGE_KEY, "1");
    } catch {}
  };

  const showHint = isPortraitMobile && !dismissed;

  return (
    <div className="relative w-full h-full">
      {/* Los hijos se renderizan SIEMPRE visibles (sin display:none) para que WebGL y SVGs inicialicen con medidas reales */}
      {children}

      {/* Recordatorio flotante no bloqueante para sugerir modo horizontal en móviles */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-14 sm:top-16 inset-x-3 mx-auto max-w-sm z-[85] pointer-events-auto select-none"
          >
            <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-[#0A0D0B]/92 border border-[#B35F27]/55 shadow-[0_14px_34px_rgba(0,0,0,0.65)] backdrop-blur-xl text-[#EDE7E0]">
              {/* Ícono animado girando a horizontal */}
              <div className="w-9 h-9 rounded-xl bg-[#B35F27]/20 border border-[#B35F27]/40 flex items-center justify-center shrink-0">
                <motion.div
                  animate={{ rotate: [0, -90, -90, 0] }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    repeatDelay: 1.2,
                    ease: "easeInOut",
                  }}
                >
                  <Smartphone className="w-4 h-4 text-[#EBD9AB]" />
                </motion.div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[0.625rem] font-extrabold uppercase tracking-[0.16em] text-[#EBD9AB] leading-tight">
                  {isEn ? "Best Viewed in Landscape" : "Mejor en Horizontal"}
                </p>
                <p className="text-[0.6875rem] text-[#EDE7E0]/80 leading-snug mt-0.5">
                  {isEn
                    ? "Rotate your phone for the full panoramic 3D & Master Plan view."
                    : "Gira tu celular para ver el plano y la maqueta 3D en pantalla panorámica."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label={isEn ? "Dismiss tip" : "Cerrar sugerencia"}
                className="p-1.5 rounded-full text-[#EDE7E0]/55 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
