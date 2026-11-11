"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ShieldCheck, MessageCircle } from "lucide-react";
import {
  ADVISORS_REGISTRY,
  buildGeneralProjectWhatsAppUrl,
  buildLotWhatsAppUrl,
  LotWhatsAppContext,
} from "@/lib/referralTracking";

interface LuwanaReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  lotRawId?: string;
  lotContext?: LotWhatsAppContext;
}

export default function LuwanaReferralModal({
  isOpen,
  onClose,
  lotRawId,
  lotContext,
}: LuwanaReferralModalProps) {
  if (!isOpen) return null;

  const effectiveLot: LotWhatsAppContext | null = lotContext
    ? lotContext
    : lotRawId
    ? { id: lotRawId, rawId: lotRawId }
    : null;

  const selectAgency = (agency: "patrimofy" | "chichaus") => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("luwana_ref", agency);
      const targetChannel = ADVISORS_REGISTRY[agency];
      const waUrl = effectiveLot
        ? buildLotWhatsAppUrl(effectiveLot, "Luwana Beach Residence", targetChannel)
        : buildGeneralProjectWhatsAppUrl("Luwana Beach Residence", targetChannel);
      window.open(waUrl, "_blank");
    }
    onClose();
  };

  const displayLotLabel = lotContext?.rawId || lotRawId;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-[#EFE9E1] border border-[#A58E74]/40 p-6 sm:p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-2xl relative text-[#152A2D]"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-[#152A2D]/50 hover:text-[#152A2D] rounded-full hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#A58E74]/15 border border-[#A58E74]/30 text-[#A58E74] text-[10px] font-bold uppercase tracking-widest rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Únicas Firmas Comercializadoras</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif text-[#152A2D] font-bold">
              Selecciona tu Firma Asesora
            </h3>
            <p className="text-xs text-[#152A2D]/75 leading-relaxed font-sans">
              {displayLotLabel ? (
                <>
                  Para brindarte asesoría personalizada y directa en la separación del{" "}
                  <strong>{displayLotLabel.toLowerCase().startsWith("lote") ? displayLotLabel : `Lote ${displayLotLabel}`}</strong>, por favor elige una de nuestras 2 únicas firmas comercializadoras autorizadas:
                </>
              ) : (
                <>
                  Para brindarte atención inmediata sobre el proyecto{" "}
                  <strong>Luwana Beach Residence Cartagena</strong>, elige tu firma de preferencia entre nuestras 2 únicas firmas comercializadoras autorizadas:
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-1">
            {/* Patrimofy — Línea Oficial WhatsApp CRM (+57 333 239 3784) con Lote Prellenado */}
            <button
              onClick={() => selectAgency("patrimofy")}
              className="w-full py-3.5 bg-[#25D366] hover:bg-[#1fb858] text-[#152A2D] font-extrabold rounded-xl uppercase tracking-wider text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/25 cursor-pointer hover:scale-[1.02]"
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span>WhatsApp Asesoría Patrimofy</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Chic Haus */}
            <button
              onClick={() => selectAgency("chichaus")}
              className="w-full py-3.5 bg-white hover:bg-white/80 border border-[#152A2D]/15 text-[#152A2D] font-bold rounded-xl uppercase tracking-wider text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:scale-[1.01]"
            >
              <MessageCircle className="h-4 w-4 text-[#25D366] shrink-0" />
              <span>WhatsApp Chic Haus</span>
              <ArrowRight className="h-4 w-4 text-[#A58E74]" />
            </button>
          </div>

          <div className="pt-2 border-t border-[#152A2D]/10 flex items-center justify-center gap-1.5 text-[9px] text-[#152A2D]/60 uppercase tracking-wider font-semibold">
            <ShieldCheck className="h-3 w-3 text-[#A58E74]" />
            <span>Patrimofy &amp; Chichaus &bull; Únicas firmas comercializadoras autorizadas</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
