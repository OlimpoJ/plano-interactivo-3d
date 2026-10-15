"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type LoomLang = "es" | "en";

export const SQM_TO_SQFT = 10.7639104;
export const DEFAULT_TRM = 4200;

interface LoomI18nContextType {
  lang: LoomLang;
  isEn: boolean;
  trm: number;
  trmSource: string;
  setLang: (newLang: LoomLang) => void;
  toggleLang: () => void;
}

const LoomI18nContext = createContext<LoomI18nContextType>({
  lang: "es",
  isEn: false,
  trm: DEFAULT_TRM,
  trmSource: "Official TRM",
  setLang: () => {},
  toggleLang: () => {},
});

export function LoomLanguageProvider({
  defaultLang,
  children,
}: {
  defaultLang?: LoomLang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<LoomLang>(defaultLang || "es");
  const [trm, setTrm] = useState<number>(DEFAULT_TRM);
  const [trmSource, setTrmSource] = useState<string>("TRM Oficial");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Limpiar cualquier valor previo en localStorage que contaminaba entre pestañas
    localStorage.removeItem("loom_lang");

    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get("lang")?.toLowerCase();
    if (urlLang === "en" || urlLang === "es") {
      setLangState(urlLang);
      return;
    }
    if (defaultLang) {
      setLangState(defaultLang);
      return;
    }
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith("/en/") || path.endsWith("/en")) {
      setLangState("en");
    } else {
      setLangState("es");
    }
  }, [defaultLang]);

  // Obtener la TRM oficial del día automáticamente (Servidor /api/trm + Fallback directo Superfinanciera / DolarApi)
  useEffect(() => {
    if (typeof window === "undefined") return;
    let isMounted = true;

    async function loadDailyTrm() {
      try {
        const res = await fetch("/api/trm");
        if (res.ok) {
          const data = await res.json();
          if (data?.trm && data.trm > 2500 && data.trm < 10000) {
            if (isMounted) {
              setTrm(Number(data.trm));
              setTrmSource(data.source || "TRM Oficial");
            }
            return;
          }
        }
      } catch {
        // Continúa a consulta directa desde el navegador si falla la ruta interna
      }

      try {
        const directRes = await fetch("https://co.dolarapi.com/v1/trm");
        if (directRes.ok) {
          const directData = await directRes.json();
          if (directData?.valor && Number(directData.valor) > 2500) {
            if (isMounted) {
              setTrm(Number(directData.valor));
              setTrmSource("Superfinanciera TRM");
            }
          }
        }
      } catch {
        // Mantiene DEFAULT_TRM si está offline
      }
    }

    loadDailyTrm();
    return () => {
      isMounted = false;
    };
  }, []);

  const setLang = (newLang: LoomLang) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("lang", newLang);
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  };

  const toggleLang = () => {
    setLang(lang === "es" ? "en" : "es");
  };

  return (
    <LoomI18nContext.Provider
      value={{ lang, isEn: lang === "en", trm, trmSource, setLang, toggleLang }}
    >
      {children}
    </LoomI18nContext.Provider>
  );
}

export function useLoomLang() {
  return useContext(LoomI18nContext);
}

export function translateLocationType(location: string, isEn: boolean): string {
  if (!location) return isEn ? "INTERIOR LOT" : "MEDIANERO";
  if (!isEn) return location;
  const u = location.toUpperCase();
  if (u.includes("ESQUINERO")) return "CORNER LOT";
  if (u.includes("MEDIANERO")) return "INTERIOR LOT";
  if (u.includes("FRENTE A PARQUE") || u.includes("PARQUE")) return "PARK FRONT";
  if (u.includes("ACCESO PRINCIPAL")) return "24/7 Main Gatehouse";
  if (u.includes("ZONA VERDE")) return "Linear Park & Walking Trails";
  if (u.includes("SALIDA DIRECTA AL MAR")) return "Private Beach Club with Direct Beach Access";
  if (u.includes("PISCINAS")) return "Pools, Courts & Social Lounge";
  return location;
}

export function translateStatusRaw(
  statusRaw: string,
  arg2?: string | boolean,
  arg3?: string | boolean
): string {
  const isEn = typeof arg2 === "boolean" ? arg2 : typeof arg3 === "boolean" ? arg3 : false;
  const status = typeof arg2 === "string" ? arg2 : typeof arg3 === "string" ? arg3 : "";
  const s = (status || "").toLowerCase();
  const sr = (statusRaw || "").toUpperCase();

  if (s === "common" || sr === "AMENIDAD") return isEn ? "AMENITY" : "AMENIDAD";
  if (s === "available" || sr.includes("DISPONIBLE")) return isEn ? "AVAILABLE" : "DISPONIBLE";
  if (
    s === "blocked" ||
    s === "reserved" ||
    sr.includes("BLOQUEADO") ||
    sr.includes("RESERVADO") ||
    sr.includes("SEPARADO")
  ) {
    return isEn ? "BLOCKED" : "BLOQUEADO";
  }
  if (s === "sold" || sr.includes("VENDIDO")) return isEn ? "SOLD" : "VENDIDO";
  return isEn ? "AVAILABLE" : statusRaw || "DISPONIBLE";
}

/**
 * Extrae el valor numérico en m² a partir de un texto como "252.79", "252,79 m²" o "686 m²"
 */
export function parseSquareMeters(areaStr: string | number | undefined | null): number | null {
  if (areaStr === undefined || areaStr === null) return null;
  const raw = String(areaStr).replace(/m²|m2|sq\s*ft/gi, "").trim();
  if (!raw) return null;
  // Soportar decimales con coma o punto (ej: "252,79" o "252.79")
  const normalized =
    raw.includes(",") && !raw.includes(".")
      ? raw.replace(",", ".")
      : raw.replace(/,/g, "");
  const match = normalized.match(/[-+]?\d*\.?\d+/);
  if (!match) return null;
  const val = parseFloat(match[0]);
  return isNaN(val) || val <= 0 ? null : val;
}

/**
 * Convierte y formatea el área según el idioma:
 * - Español (isEn = false): "252.79 m²"
 * - Inglés (isEn = true): "2,721 sq ft" (1 m² = 10.7639 sq ft)
 */
export function translateAreaText(area: string, isEn: boolean): string {
  if (!area) return "";
  if (area.includes("Área Común")) return isEn ? "Common Area" : "Área Común";
  if (area.includes("Área Social")) return isEn ? "Social Area" : "Área Social";
  if (area.includes("Club de Playa")) return isEn ? "Beach Club" : "Club de Playa";
  if (area.includes("Amenidad")) return isEn ? "Amenity" : "Amenidad";

  if (!isEn) {
    return area.includes("m²") ? area : `${area} m²`;
  }

  const sqm = parseSquareMeters(area);
  if (sqm !== null) {
    const sqft = Math.round(sqm * SQM_TO_SQFT);
    return `${sqft.toLocaleString("en-US")} sq ft`;
  }

  return area.replace(/m²|m2/gi, "sq ft");
}

/**
 * Extrae el monto numérico en COP desde un string formateado (ej. "$267,957,400")
 */
export function parseCopAmount(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === "number") return val;
  const digits = String(val).replace(/[^\d]/g, "");
  return parseInt(digits, 10) || 0;
}

/**
 * Formatea un monto en COP (español) o lo convierte dinámicamente a USD con la TRM del día (inglés)
 */
export function formatCopOrUsd(
  copVal: string | number | undefined | null,
  isEn: boolean,
  trm: number = DEFAULT_TRM,
  includeCurrencySuffix: boolean = false
): string {
  if (copVal === undefined || copVal === null || copVal === "") {
    return isEn ? "Inquire" : "Consultar";
  }

  const strVal = String(copVal).trim();
  if (strVal === "-") return "-";
  if (strVal.includes("Área Común")) return isEn ? "Common Area" : "Área Común";

  const copNum = parseCopAmount(copVal);
  if (copNum <= 0) {
    return isEn ? "Inquire" : strVal || "Consultar";
  }

  if (!isEn) {
    if (typeof copVal === "string" && strVal.startsWith("$")) {
      return includeCurrencySuffix && !strVal.includes("COP") ? `${strVal} COP` : strVal;
    }
    return `$${copNum.toLocaleString("es-CO")}${includeCurrencySuffix ? " COP" : ""}`;
  }

  const safeTrm = trm > 0 ? trm : DEFAULT_TRM;
  const usdAmount = Math.round(copNum / safeTrm);
  return `$${usdAmount.toLocaleString("en-US")}${includeCurrencySuffix ? " USD" : ""}`;
}

/**
 * Convierte el valor por m² (COP/m²) a USD por pie cuadrado (USD/sq ft) en inglés
 */
export function formatPricePerAreaUnit(
  pricePerM2: string | number | undefined | null,
  isEn: boolean,
  trm: number = DEFAULT_TRM
): string {
  if (!pricePerM2) return "";
  const copPerSqm = parseCopAmount(pricePerM2);
  if (copPerSqm <= 0) return String(pricePerM2);

  if (!isEn) {
    const str = String(pricePerM2).trim();
    return str.startsWith("$") ? str : `$${copPerSqm.toLocaleString("es-CO")}`;
  }

  const safeTrm = trm > 0 ? trm : DEFAULT_TRM;
  const usdPerSqFt = copPerSqm / safeTrm / SQM_TO_SQFT;
  return `$${Math.round(usdPerSqFt).toLocaleString("en-US")} USD / sq ft`;
}

export function getStageDisplayName(stageIdOrZona: string, isEn: boolean): string {
  const clean = stageIdOrZona.toUpperCase();
  if (clean.includes("6") || clean.includes("ALMA")) return "Alma Beach";
  const numMatch = clean.match(/(\d+)/);
  const num = numMatch ? numMatch[1] : "1";
  return isEn ? `Stage ${num}` : `Etapa ${num}`;
}

export function inferStageFromLotId(lotId: string): string {
  const block = (lotId || "").trim().charAt(0).toUpperCase();
  if (["A", "B", "C"].includes(block)) return "etapa_1";
  if (["D", "E"].includes(block)) return "etapa_2";
  if (["F", "G"].includes(block)) return "etapa_3";
  if (["H", "I"].includes(block)) return "etapa_4";
  if (["J", "K", "L"].includes(block)) return "etapa_5";
  return "etapa_1";
}
