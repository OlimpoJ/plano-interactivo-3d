"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCw, Smartphone } from "lucide-react";
import { useLoomLang } from "@/lib/loomI18n";

export default function LoomOrientationWrapper({ children }: { children: React.ReactNode }) {
  const { isEn } = useLoomLang();
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [bypass, setBypass] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Considerar móvil/tablet si el ancho es menor a 1024px
      const mobileDevice = width < 1024;
      setIsMobile(mobileDevice);

      // Es portrait si el alto es mayor al ancho
      const portrait = height > width;
      setIsPortrait(portrait);
    };

    // Validar al montar y en cada redimensión de pantalla
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Si no es móvil/tablet, o no está en vertical, o el usuario decidió continuar, mostrar el contenido normal
  const showPrompt = isMobile && isPortrait && !bypass;

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#070c16]/95 backdrop-blur-xl p-8 text-center text-white select-none"
          >
            {/* Círculos de brillo decorativos detrás */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#dbaa67]/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 max-w-sm w-full flex flex-col items-center space-y-6">
              
              {/* Logo / Brand Header */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-[10px] tracking-[0.3em] text-[#dbaa67] uppercase font-light">
                  Loom Luxury Residence
                </span>
                <div className="h-[1px] w-24 bg-[#dbaa67]/30"></div>
              </div>

              {/* Icono de Teléfono Rotando Premium Animado */}
              <div className="relative flex items-center justify-center w-24 h-24 mt-4">
                <motion.div
                  animate={{ rotate: [0, 90, 90, 0, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut",
                  }}
                  className="relative z-10 text-white/90"
                >
                  <Smartphone className="w-16 h-16 stroke-[1.2]" />
                </motion.div>
                
                {/* Flecha de rotación orbitante */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute inset-0 text-[#dbaa67] opacity-60"
                >
                  <RotateCw className="w-24 h-24 stroke-[1]" />
                </motion.div>
              </div>

              {/* Textos descriptivos */}
              <div className="space-y-3">
                <h3 className="text-xl font-serif text-white tracking-wider uppercase">
                  {isEn ? "LANDSCAPE EXPERIENCE" : "EXPERIENCIA HORIZONTAL"}
                </h3>
                <p className="text-xs text-white/70 leading-relaxed max-w-xs">
                  {isEn
                    ? "To explore the Master Plan and interact with the vector lots with maximum precision, please rotate your device to landscape mode."
                    : "Para poder explorar el Plano de Urbanismo e interactuar con los lotes vectoriales de forma precisa, te sugerimos girar tu dispositivo a modo horizontal."}
                </p>
              </div>

              {/* Botones de acción */}
              <div className="pt-4 w-full flex flex-col space-y-3">
                <div className="text-[9px] uppercase tracking-widest text-[#dbaa67] font-semibold animate-pulse">
                  {isEn ? "Rotate your screen to start" : "Gira tu pantalla para iniciar"}
                </div>
                
                <button
                  onClick={() => setBypass(true)}
                  className="text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-white/80 transition-colors pt-2 border-t border-white/5 w-full"
                >
                  {isEn ? "Continue in portrait" : "Continuar en vertical"}
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Renderizar siempre los hijos para que sigan montados */}
      <div className={`w-full h-full ${showPrompt ? "hidden" : "block"}`}>
        {children}
      </div>
    </>
  );
}
