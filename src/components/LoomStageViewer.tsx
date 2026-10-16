"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, ChevronDown } from "lucide-react";
import {
  useLoomLang,
  translateLocationType,
  translateStatusRaw,
  translateAreaText,
  formatCopOrUsd,
  getStageDisplayName,
  inferStageFromLotId,
} from "@/lib/loomI18n";

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

function decodeSvgNumber(g: HTMLElement): number | null {
  const paths = Array.from(g.querySelectorAll("path"));
  if (paths.length === 0) return null;
  
  let numberStr = "";
  
  paths.forEach((p) => {
    const d = p.getAttribute("d") || "";
    const noWhitespace = d.replace(/\s+/g, '');
    const clean = noWhitespace.replace(/^M\s*[-+]?[0-9]*\.?[0-9]+[\s,]+[-+]?[0-9]*\.?[0-9]+/i, '').trim();
    
    const cmds = clean.split(/[a-df-z]/i).length;
    const startsWith = clean.substring(0, 5).toLowerCase();

    let digit = "";
    if ((cmds === 20 || cmds === 21) && startsWith.startsWith("c-")) digit = "0";
    else if ((cmds === 11 || cmds === 12) && startsWith.startsWith("h-")) digit = "1";
    else if ((cmds === 31 || cmds === 32) && startsWith.startsWith("v-")) digit = "2";
    else if ((cmds === 32 || cmds === 33) && startsWith.startsWith("l0")) digit = "3";
    else if (cmds === 24 && startsWith.startsWith("v")) digit = "4";
    else if (cmds === 24 && startsWith.startsWith("l")) digit = "5";
    else if (cmds === 34 && startsWith.startsWith("c")) digit = "6";
    else if (cmds === 11 && startsWith.startsWith("c-")) digit = "7";
    else if (cmds === 38 && startsWith.startsWith("c0")) digit = "8";
    else if (cmds === 30 && startsWith.startsWith("c0")) digit = "9";
    
    if (digit) {
      numberStr += digit;
    }
  });
  
  if (!numberStr) return null;
  
  if (numberStr.startsWith("0") && numberStr.length > 1) {
    numberStr = numberStr.substring(1);
  }
  
  const parsed = parseInt(numberStr, 10);
  return isNaN(parsed) ? null : parsed;
}

function getShapeCentroid(shape: Element): { x: number; y: number } | null {
  const tagName = shape.tagName.toLowerCase();
  
  if (tagName === "rect") {
    const rx = parseFloat(shape.getAttribute("x") || "0");
    const ry = parseFloat(shape.getAttribute("y") || "0");
    const rw = parseFloat(shape.getAttribute("width") || "0");
    const rh = parseFloat(shape.getAttribute("height") || "0");
    let cx = rx + rw / 2;
    let cy = ry + rh / 2;

    const transform = shape.getAttribute("transform") || "";
    const matrixMatch = transform.match(/matrix\(([^)]+)\)/);
    if (matrixMatch) {
      const [a, b, c, d, e, f] = matrixMatch[1].split(/[\s,]+/).map(Number);
      if (!isNaN(a) && !isNaN(f)) {
        cx = a * cx + c * cy + e;
        cy = b * cx + d * cy + f;
      }
    }
    return { x: cx, y: cy };
  }
  
  if (tagName === "polygon" || tagName === "polyline") {
    const pointsAttr = shape.getAttribute("points") || "";
    const coords = pointsAttr.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (coords.length < 2) return null;
    let sumX = 0, sumY = 0, count = 0;
    for (let i = 0; i < coords.length; i += 2) {
      if (coords[i] !== undefined && coords[i+1] !== undefined) {
        sumX += coords[i];
        sumY += coords[i+1];
        count++;
      }
    }
    return count > 0 ? { x: sumX / count, y: sumY / count } : null;
  }
  
  if (tagName === "path") {
    const d = shape.getAttribute("d") || "";
    const absCoords: { x: number; y: number }[] = [];
    const cmdRegex = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
    let cmdMatch: RegExpExecArray | null;
    let currX = 0, currY = 0;
    
    while ((cmdMatch = cmdRegex.exec(d)) !== null) {
      const cmd = cmdMatch[1];
      const nums = cmdMatch[2].trim().split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
      
      if (cmd === 'M' || cmd === 'L') {
        for (let i = 0; i < nums.length; i += 2) {
          if (nums[i] !== undefined && nums[i+1] !== undefined) {
            currX = nums[i]; currY = nums[i+1];
            absCoords.push({ x: currX, y: currY });
          }
        }
      } else if (cmd === 'm' || cmd === 'l') {
        for (let i = 0; i < nums.length; i += 2) {
          if (nums[i] !== undefined && nums[i+1] !== undefined) {
            currX += nums[i]; currY += nums[i+1];
            absCoords.push({ x: currX, y: currY });
          }
        }
      } else if (cmd === 'H') {
        if (nums[0] !== undefined) { currX = nums[0]; absCoords.push({ x: currX, y: currY }); }
      } else if (cmd === 'h') {
        if (nums[0] !== undefined) { currX += nums[0]; absCoords.push({ x: currX, y: currY }); }
      } else if (cmd === 'V') {
        if (nums[0] !== undefined) { currY = nums[0]; absCoords.push({ x: currX, y: currY }); }
      } else if (cmd === 'v') {
        if (nums[0] !== undefined) { currY += nums[0]; absCoords.push({ x: currX, y: currY }); }
      } else if (cmd === 'C') {
        for (let i = 0; i < nums.length; i += 6) {
          if (nums[i+4] !== undefined && nums[i+5] !== undefined) {
            currX = nums[i+4]; currY = nums[i+5];
            absCoords.push({ x: currX, y: currY });
          }
        }
      } else if (cmd === 'c') {
        for (let i = 0; i < nums.length; i += 6) {
          if (nums[i+4] !== undefined && nums[i+5] !== undefined) {
            currX += nums[i+4]; currY += nums[i+5];
            absCoords.push({ x: currX, y: currY });
          }
        }
      }
    }
    
    if (absCoords.length === 0) return null;
    let sumX = 0, sumY = 0;
    absCoords.forEach((pt) => { sumX += pt.x; sumY += pt.y; });
    return { x: sumX / absCoords.length, y: sumY / absCoords.length };
  }
  
  return null;
}

interface LoomStageViewerProps {
  stageId: string; // "etapa_1" .. "etapa_6"
  lots: Lot[];
  selectedLot: Lot | null;
  onSelectLot: (lot: Lot) => void;
  onBack: () => void;
  onChangeStage?: (newStageId: string) => void;
}

interface ParsedPin {
  cx: number;
  cy: number;
  manzana: string;
  lotId: string;
  xPercent: number;
  yPercent: number;
  lotData: Lot;
}

export default function LoomStageViewer({ stageId, lots, selectedLot, onSelectLot, onBack, onChangeStage }: LoomStageViewerProps) {
  const { isEn, trm } = useLoomLang();
  const [svgText, setSvgText] = useState<string>("");
  const [pins, setPins] = useState<ParsedPin[]>([]);
  const [hoveredPin, setHoveredPin] = useState<ParsedPin | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isStageMenuOpen, setIsStageMenuOpen] = useState<boolean>(false);
  const stageMenuRef = useRef<HTMLDivElement>(null);
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [mapPan, setMapPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const panDragRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  }>({ active: false, moved: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  const [activeFilters, setActiveFilters] = useState({
    available: true,
    reserved: true,
    blocked: true,
    sold: true,
  });

  const hasAutoSelectedRef = useRef<boolean>(false);

  // Reset zoom, pan and close stage menu when switching stages
  useEffect(() => {
    setMapZoom(1);
    setMapPan({ x: 0, y: 0 });
    setIsStageMenuOpen(false);
  }, [stageId]);

  // Close stage dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (stageMenuRef.current && !stageMenuRef.current.contains(e.target as Node)) {
        setIsStageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mapZoom <= 1) {
      setMapPan({ x: 0, y: 0 });
    }
  }, [mapZoom]);

  // Deep linking: auto-seleccionar lote si viene en ?lot= en URL (solo una vez al cargar)
  useEffect(() => {
    if (typeof window !== "undefined" && pins.length > 0 && !hasAutoSelectedRef.current) {
      const params = new URLSearchParams(window.location.search);
      const lotParam = params.get("lot");
      if (lotParam) {
        const found = pins.find(
          (p) =>
            p.lotId.toUpperCase() === lotParam.toUpperCase() ||
            p.lotData.rawId.toUpperCase() === lotParam.toUpperCase()
        );
        if (found) {
          hasAutoSelectedRef.current = true;
          onSelectLot(found.lotData);
        }
      }
    }
  }, [pins, onSelectLot]);

  // Búsqueda Global (busca en la etapa actual y también en las 5 etapas completas)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const normalizedQ = q.replace(/\s+/g, "");

    const results: { lotId: string; stageKey: string; lotData: Lot }[] = [];
    const seen = new Set<string>();

    // Primero coincidencias en la etapa actual
    pins.forEach((p) => {
      const idClean = p.lotId.toLowerCase();
      const rawClean = p.lotData.rawId.toLowerCase();
      const noDash = idClean.replace("-", "");
      if (idClean.includes(normalizedQ) || rawClean.includes(normalizedQ) || noDash.includes(normalizedQ)) {
        seen.add(p.lotId.toUpperCase());
        results.push({ lotId: p.lotId, stageKey: stageId, lotData: p.lotData });
      }
    });

    // Luego coincidencias en el resto del inventario global (318 lotes)
    lots.forEach((l) => {
      const idUpper = l.id.toUpperCase();
      if (seen.has(idUpper)) return;
      const idClean = l.id.toLowerCase();
      const rawClean = (l.rawId || l.id).toLowerCase();
      const noDash = idClean.replace("-", "");
      if (idClean.includes(normalizedQ) || rawClean.includes(normalizedQ) || noDash.includes(normalizedQ)) {
        seen.add(idUpper);
        results.push({
          lotId: l.id,
          stageKey: inferStageFromLotId(l.id),
          lotData: l,
        });
      }
    });

    return results.slice(0, 6);
  }, [searchQuery, pins, lots, stageId]);

  const STAGE_CONFIGS: Record<string, { name: string; svgUrl: string; bgImage: string }> = {
    etapa_1: { name: isEn ? "Stage 1" : "Etapa 1", svgUrl: "/loom/loom_stage_1.svg", bgImage: "/loom/loom_stage_1_bg.webp" },
    etapa_2: { name: isEn ? "Stage 2" : "Etapa 2", svgUrl: "/loom/loom_stage_2.svg", bgImage: "/loom/loom_stage_2_bg.webp" },
    etapa_3: { name: isEn ? "Stage 3" : "Etapa 3", svgUrl: "/loom/loom_stage_3.svg", bgImage: "/loom/loom_stage_3_bg.webp" },
    etapa_4: { name: isEn ? "Stage 4" : "Etapa 4", svgUrl: "/loom/loom_stage_4.svg", bgImage: "/loom/loom_stage_4_bg.webp" },
    etapa_5: { name: isEn ? "Stage 5" : "Etapa 5", svgUrl: "/loom/loom_stage_5.svg", bgImage: "/loom/loom_stage_5_bg.webp" },
    etapa_6: { name: "Alma Beach", svgUrl: "/loom/loom_stage_6.svg", bgImage: "/loom/loom_stage_6_bg.webp" },
  };

  const currentConfig = STAGE_CONFIGS[stageId] || STAGE_CONFIGS["etapa_1"];
  const isAmenities = stageId === "etapa_6";
  const containerWidthClass = selectedLot 
    ? "w-full max-lg:landscape:w-[54vw]" 
    : "w-full";
  const svgUrl = currentConfig.svgUrl;
  const bgImage = currentConfig.bgImage;
  const stageName = currentConfig.name;

  // Navegación de etapas activas (Etapas 1 a 5 y Alma Beach)
  const activeStages = ["etapa_1", "etapa_2", "etapa_3", "etapa_4", "etapa_5", "etapa_6"];
  const currentStageIndex = activeStages.indexOf(stageId);
  const prevStageId = currentStageIndex > 0 ? activeStages[currentStageIndex - 1] : null;
  const nextStageId = currentStageIndex < activeStages.length - 1 ? activeStages[currentStageIndex + 1] : null;

  // Cache en memoria RAM para cargar todas las etapas instantáneamente (0ms de retraso)
  const svgCacheRef = useRef<Record<string, { svgText: string; pins: ParsedPin[] }>>({});

  // Pre-cargar todas las imágenes WebP de todas las etapas en segundo plano al montar el componente
  useEffect(() => {
    activeStages.forEach((stId) => {
      const cfg = STAGE_CONFIGS[stId];
      if (cfg) {
        const img = new Image();
        img.src = cfg.bgImage;
      }
    });
  }, []);

  // Cargar y procesar el SVG de la etapa (usando caché RAM si ya fue procesado)
  useEffect(() => {
    if (!svgUrl) {
      queueMicrotask(() => {
        setSvgText("");
        setPins([]);
      });
      return;
    }

    const cacheKey = `${svgUrl}_${isEn ? "en" : "es"}`;
    const cached = svgCacheRef.current[cacheKey];
    if (cached && cached.svgText && cached.pins.length > 0) {
      const refreshedPins = cached.pins.map((p) => {
        const latestLot = lots.find((l) => l.id.toUpperCase() === p.lotId.toUpperCase());
        return latestLot ? { ...p, lotData: latestLot } : p;
      });
      setSvgText(cached.svgText);
      setPins(refreshedPins);
      return;
    }

    fetch(svgUrl)
      .then((res) => res.text())
      .then((text) => {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "image/svg+xml");
          
          doc.documentElement.setAttribute("preserveAspectRatio", "xMidYMid meet");
          const viewBoxAttr = doc.documentElement.getAttribute("viewBox") || "0 0 3840 2160";
          const viewBoxParts = viewBoxAttr.split(" ").map(Number);
          const viewBoxWidth = viewBoxParts[2] || 3840;
          const viewBoxHeight = viewBoxParts[3] || 2160;

          const interactiveContainer = doc.querySelector("#INTERACTIVE_LOT_GROUPS");
          const circleElements = Array.from(
            interactiveContainer ? interactiveContainer.querySelectorAll("circle") : doc.querySelectorAll("circle")
          );
          const parsedCircles = circleElements.map((c) => {
            let parent: HTMLElement | null = c.parentElement;
            let manzana = "";
            let manzanaGroup: HTMLElement | null = null;

            while (parent) {
              const id = (parent.getAttribute("id") || "").toUpperCase();
              if (id.includes("PORTERIA") || id.includes("PORTERÍA")) { manzana = "PORTERIA"; manzanaGroup = parent; break; }
              if (id.includes("PARQUE_1")) { manzana = "PARQUE_1"; manzanaGroup = parent; break; }
              if (id.includes("PARQUE_2")) { manzana = "PARQUE_2"; manzanaGroup = parent; break; }
              if (id.includes("PARQUE")) { manzana = "PARQUE"; manzanaGroup = parent; break; }
              if (id.includes("CLUB") || id.includes("HOUSE") || id.includes("CASA_CLUB")) { manzana = "CLUB_HOUSE"; manzanaGroup = parent; break; }
              
              const mzMatch = id.match(/(?:MANZANA|MANZONA|LOTES|TEXTOS|LOTGROUP)_?([A-L])/i);
              if (mzMatch) {
                manzana = mzMatch[1].toUpperCase();
                manzanaGroup = parent;
                break;
              }
              parent = parent.parentElement;
            }
            const cx = parseFloat(c.getAttribute("cx") || "0");
            const cy = parseFloat(c.getAttribute("cy") || "0");
            return { element: c, manzana, manzanaGroup, cx, cy };
          });

          const finalPins: ParsedPin[] = [];
          const counters: Record<string, number> = {};

          interface CircleItem {
            element: Element;
            manzana: string;
            manzanaGroup: HTMLElement | null;
            cx: number;
            cy: number;
            lotId: string;
            xPercent: number;
            yPercent: number;
            lotData: Lot;
            lotGroup: HTMLElement;
          }

          const circleItems: CircleItem[] = [];

          parsedCircles.forEach((sc) => {
            const c = sc.element;
            const manzana = sc.manzana;
            const manzanaGroup = sc.manzanaGroup;
            const cx = sc.cx;
            const cy = sc.cy;

            if (manzana && c.parentElement) {
              const circleParent = c.parentElement;
              const dataLot = c.getAttribute("data-lot") || circleParent.getAttribute("data-lot") || circleParent.getAttribute("id") || "";
              let decodedNum: number | null = null;

              const idNumMatch = dataLot.match(/(?:[A-L]|g)[-_]?(\d+)/i);
              if (idNumMatch) {
                decodedNum = parseInt(idNumMatch[1], 10);
              } else {
                decodedNum = decodeSvgNumber(circleParent);
              }

              let num = 0;
              if (decodedNum !== null && decodedNum > 0) {
                num = decodedNum;
              } else {
                if (!counters[manzana]) counters[manzana] = 0;
                counters[manzana] += 1;
                num = counters[manzana];
              }

              let lotId = `${manzana}-${num}`;
              if (manzana === "PORTERIA") lotId = "PORTERIA";
              if (manzana === "PARQUE_1") lotId = "PARQUE_1";
              if (manzana === "PARQUE_2") lotId = "PARQUE_2";
              if (manzana === "CLUB_HOUSE") lotId = "CLUB_HOUSE";

              const xPercent = (cx / viewBoxWidth) * 100;
              const yPercent = (cy / viewBoxHeight) * 100;

              let lotData = lots.find((l) => l.id.toUpperCase() === lotId.toUpperCase());
              if (!lotData) {
                if (lotId === "PORTERIA") {
                  lotData = {
                    id: "PORTERIA",
                    rawId: "Portería",
                    area: "Área Común",
                    location: "Acceso Principal 24/7",
                    status: "common",
                    statusRaw: "AMENIDAD",
                    totalPrice: "Área Común",
                    downPayment: "-",
                    financing: "-",
                    finalPayment: "-",
                  };
                } else if (lotId.includes("PARQUE")) {
                  const pNum = lotId === "PARQUE_1" ? "1" : "2";
                  lotData = {
                    id: lotId,
                    rawId: `Parque ${pNum}`,
                    area: "686 m²",
                    location: "Zona Verde & Senderos",
                    status: "common",
                    statusRaw: "AMENIDAD",
                    totalPrice: "Área Común",
                    downPayment: "-",
                    financing: "-",
                    finalPayment: "-",
                  };
                } else if (lotId.includes("CLUB") || lotId.includes("HOUSE") || lotId === "CLUB_HOUSE") {
                  const isAlmaBeach = svgUrl.includes("stage_6");
                  lotData = {
                    id: "CLUB_HOUSE",
                    rawId: isAlmaBeach ? "Alma Beach Club" : "Club House",
                    area: isAlmaBeach ? "Club de Playa" : "Área Social",
                    location: isAlmaBeach ? "Club de Playa con Salida Directa al Mar" : "Zona de Piscinas, Canchas & Social",
                    status: "common",
                    statusRaw: "AMENIDAD",
                    totalPrice: "Área Común",
                    downPayment: "-",
                    financing: "-",
                    finalPayment: "-",
                  };
                } else {
                  lotData = {
                    id: lotId,
                    rawId: lotId,
                    area: "250.00",
                    location: "MEDIANERO",
                    status: "available",
                    statusRaw: "DISPONIBLE",
                    totalPrice: "$250,000,000",
                    downPayment: "$50,000,000",
                    financing: "$3,650,000",
                    finalPayment: "$25,000,000",
                  };
                }
              }

              let lotGroup: HTMLElement = c.parentElement as HTMLElement;
              if (lotGroup.querySelectorAll("circle").length > 1) {
                const newG = doc.createElementNS("http://www.w3.org/2000/svg", "g") as unknown as HTMLElement;
                c.parentElement.insertBefore(newG, c);
                newG.appendChild(c);
                lotGroup = newG;
              }
              lotGroup.setAttribute("id", `LOTGROUP_${lotId}`);
              lotGroup.setAttribute("class", "lot-group-interactive");

              circleItems.push({
                element: c,
                manzana,
                manzanaGroup,
                cx,
                cy,
                lotId,
                xPercent,
                yPercent,
                lotData,
                lotGroup,
              });

              finalPins.push({
                cx,
                cy,
                manzana,
                lotId,
                xPercent,
                yPercent,
                lotData,
              });
            }
          });

          // 2. Si algún grupo aún no tiene su .lot-polygon pre-construido, emparejar por distancia mínima
          const allPrePaired = circleItems.length > 0 && circleItems.every((c) => Boolean(c.lotGroup.querySelector(".lot-polygon")));
          if (!allPrePaired) {
            const candidateShapes: { element: Element; centroid: { x: number; y: number } }[] = [];
            const allShapes = doc.querySelectorAll("rect, path, polygon, polyline");

            allShapes.forEach((shape) => {
              const pGroup = shape.closest("g");
              const pGroupId = (pGroup?.getAttribute("id") || "").toUpperCase();
              if (pGroupId.includes("TEXTOS") || pGroupId.includes("TEXTO")) {
                return;
              }
              if (pGroup && pGroup.querySelector("circle") && pGroup.children.length === 1) {
                return;
              }
              const shapeClass = shape.getAttribute("class") || "";
              if (shapeClass.includes("st2") || shapeClass.includes("svg-pin")) {
                return;
              }
              const centroid = getShapeCentroid(shape);
              if (centroid) {
                candidateShapes.push({ element: shape, centroid });
              }
            });

            interface Pair {
              circle: CircleItem;
              shape: Element;
              dist: number;
            }
            const allPairs: Pair[] = [];

            circleItems.forEach((c) => {
              candidateShapes.forEach((s) => {
                const dist = Math.sqrt((s.centroid.x - c.cx) ** 2 + (s.centroid.y - c.cy) ** 2);
                if (dist < 450) {
                  allPairs.push({ circle: c, shape: s.element, dist });
                }
              });
            });

            allPairs.sort((a, b) => a.dist - b.dist);

            const assignedCircleLotIds = new Set<string>();
            const assignedShapeElements = new Set<Element>();

            allPairs.forEach((pair) => {
              if (assignedCircleLotIds.has(pair.circle.lotId) || assignedShapeElements.has(pair.shape)) {
                return;
              }
              assignedCircleLotIds.add(pair.circle.lotId);
              assignedShapeElements.add(pair.shape);

              const existingPolygon = pair.circle.lotGroup.querySelector(".lot-polygon");
              if (!existingPolygon) {
                pair.circle.lotGroup.insertBefore(pair.shape, pair.circle.lotGroup.firstChild);
              }
            });
          }

          // Crear una capa dedicada al final del SVG para TODOS los pines
          let pinsLayer = doc.querySelector("#ALL_PINS_LAYER");
          if (!pinsLayer) {
            pinsLayer = doc.createElementNS("http://www.w3.org/2000/svg", "g");
            pinsLayer.setAttribute("id", "ALL_PINS_LAYER");
            pinsLayer.setAttribute("style", "pointer-events: none;");
            doc.querySelector("svg")?.appendChild(pinsLayer);
          }

          // 5. Inyectar pins visuales glassmorphic en la capa superior #ALL_PINS_LAYER
          circleItems.forEach((item) => {
            const { cx, cy, lotId, lotGroup, element: c } = item;

            const lotShapes = Array.from(lotGroup.children).filter((child) => {
              const tag = child.tagName.toLowerCase();
              return ["path", "polygon", "rect", "polyline"].includes(tag) && !(child as Element).classList.contains("svg-pin-rect");
            });

            if (lotShapes.length > 1) {
              lotShapes.slice(1).forEach((extra) => extra.remove());
            }

            c.remove();

            let displayLabel = lotId.replace("-", "");
            if (lotId === "PORTERIA") displayLabel = isEn ? "GATEHOUSE" : "PORTERÍA";
            if (lotId === "PARQUE_1") displayLabel = isEn ? "PARK 1" : "PARQUE 1";
            if (lotId === "PARQUE_2") displayLabel = isEn ? "PARK 2" : "PARQUE 2";
            if (lotId === "CLUB_HOUSE" || lotId.includes("CLUB")) {
              displayLabel = svgUrl.includes("stage_6") ? "ALMA BEACH" : "CLUB HOUSE";
            }

            const isLongLabel = displayLabel.length > 5;
            const fontSize = isLongLabel ? "22" : "28";
            const badgeWidth = isLongLabel ? Math.max(170, displayLabel.length * 18 + 36) : 115;

            const pinGroup = doc.createElementNS("http://www.w3.org/2000/svg", "g");
            pinGroup.setAttribute("id", `PINGROUP_${lotId}`);
            pinGroup.setAttribute("class", "svg-pin-group");
            pinGroup.setAttribute("style", "pointer-events: none;");

            const pinText = doc.createElementNS("http://www.w3.org/2000/svg", "text");
            pinText.setAttribute("x", cx.toString());
            pinText.setAttribute("y", cy.toString());
            pinText.setAttribute("text-anchor", "middle");
            pinText.setAttribute("dominant-baseline", "central");
            pinText.setAttribute("class", "svg-pin-text");
            pinText.setAttribute("id", `PIN_${lotId}`);
            pinText.setAttribute("font-size", fontSize);
            pinText.setAttribute("font-weight", "800");
            pinText.setAttribute("style", "transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); pointer-events: none;");
            pinText.textContent = displayLabel;

            const pinRect = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
            pinRect.setAttribute("x", (cx - badgeWidth / 2).toString());
            pinRect.setAttribute("y", (cy - 33).toString());
            pinRect.setAttribute("width", badgeWidth.toString());
            pinRect.setAttribute("height", "66");
            pinRect.setAttribute("rx", "33");
            pinRect.setAttribute("class", "svg-pin-rect");
            pinRect.setAttribute("id", `PIN_RECT_${lotId}`);
            pinRect.setAttribute("style", "transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); pointer-events: none;");

            pinGroup.appendChild(pinRect);
            pinGroup.appendChild(pinText);
            pinsLayer?.appendChild(pinGroup);
          });

          const serializer = new XMLSerializer();
          let modifiedSvgText = serializer.serializeToString(doc);
          
          modifiedSvgText = modifiedSvgText
            .replace(/<\?xml[^>]*\?>/gi, "")
            .replace(/ns0:/g, "")
            .replace(/:ns0/g, "")
            .replace(/xmlns:ns0="[^"]*"/g, "")
            .trim();
          
          svgCacheRef.current[cacheKey] = { svgText: modifiedSvgText, pins: finalPins };

          setSvgText(modifiedSvgText);
          setPins(finalPins);
        } catch (e) {
          console.error("Error al procesar el SVG de la etapa:", e);
        }
      })
      .catch((err) => console.error("Error al cargar SVG de la etapa:", err));
  }, [svgUrl, lots, isEn]);

  // Estadísticas rápidas de la etapa (excluyendo amenidades comunes): 3 estados (Disponible, Bloqueado, Vendido)
  const stats = useMemo(() => {
    const residentialPins = pins.filter(
      (p) =>
        p.lotData.status !== "common" &&
        !p.lotId.includes("PARQUE") &&
        !p.lotId.includes("PORTERIA") &&
        !p.lotId.includes("CLUB")
    );
    const total = residentialPins.length;
    const available = residentialPins.filter((p) => p.lotData.status === "available").length;
    const blocked = residentialPins.filter(
      (p) => p.lotData.status === "blocked" || p.lotData.status === "reserved"
    ).length;
    const sold = residentialPins.filter((p) => p.lotData.status === "sold").length;
    return { total, available, blocked, sold };
  }, [pins]);

  // Generar reglas CSS dinámicas por cada lote usando selectores de atributos ultra-robustos
  const dynamicLotStyles = useMemo(() => {
    return pins
      .map((pin) => {
        const lotId = pin.lotId;
        const status = pin.lotData.status;
        const isSelected = selectedLot?.id === lotId;
        const isHovered = hoveredPin?.lotId === lotId;
        const isAmenity =
          lotId === "PORTERIA" ||
          lotId === "PARQUE_1" ||
          lotId === "PARQUE_2" ||
          lotId.includes("PARQUE") ||
          lotId.includes("PORTERIA") ||
          status === "common";

        const isFilteredOut =
          !isAmenity &&
          ((status === "available" && !activeFilters.available) ||
            ((status === "blocked" || status === "reserved") && !activeFilters.blocked) ||
            (status === "sold" && !activeFilters.sold));

        if (isFilteredOut) {
          return `
            g[id="LOTGROUP_${lotId}"], g[id="PINGROUP_${lotId}"] {
              display: none !important;
            }
          `;
        }

        let baseColor = "#10b981"; // Verde para Disponibles
        let strokeColorHover = "#059669";
        let cursor = "pointer";

        if (isAmenity) {
          baseColor = "#B35F27"; // Cobre Terracota para Amenidades
          strokeColorHover = "#8D4619";
          cursor = "pointer";
        } else if (status === "blocked" || status === "reserved") {
          baseColor = "#3b82f6"; // Azul Cobalto para Bloqueados
          strokeColorHover = "#2563eb";
          cursor = "not-allowed";
        } else if (status === "sold") {
          baseColor = "#ef4444"; // Rojo para Vendidos
          strokeColorHover = "#dc2626";
          cursor = "not-allowed";
        }

        const pinDisplay = "block";
        const pinScale = isHovered || isSelected ? "scale(1.14)" : "scale(1)";
        const pinFill = isSelected ? "#0A0D0B" : isHovered ? "#FFFFFF" : "rgba(255, 255, 255, 0.96)";
        const pinStroke = isSelected ? "#B35F27" : isHovered ? baseColor : "rgba(10, 13, 11, 0.35)";
        const pinStrokeWidth = isSelected ? "4px" : isHovered ? "3px" : "1.8px";

        const polyFillOpacity = isSelected || isHovered ? "0.48" : isAmenity ? "0.35" : "0.22";
        const polyStroke = isSelected ? "#FFFFFF" : isHovered ? strokeColorHover : baseColor;
        const polyStrokeWidth = isSelected || isHovered ? "3.8px" : "2px";

        return `
        /* Polígono del lote o amenidad (capa inferior): controlado de forma única por estado JS */
        g[id="LOTGROUP_${lotId}"] path,
        g[id="LOTGROUP_${lotId}"] polyline,
        g[id="LOTGROUP_${lotId}"] polygon,
        g[id="LOTGROUP_${lotId}"] rect:not(.svg-pin-rect) {
          fill: ${baseColor} !important;
          fill-opacity: ${polyFillOpacity} !important;
          stroke: ${polyStroke} !important;
          stroke-width: ${polyStrokeWidth} !important;
          transition: all 0.25s ease !important;
          cursor: ${cursor} !important;
          ${isHovered || isSelected ? `filter: drop-shadow(0 0 8px ${baseColor}) !important;` : ""}
        }

        /* Ocultar círculo nativo de Illustrator */
        g[id="LOTGROUP_${lotId}"] circle.st2,
        g[id="LOTGROUP_${lotId}"] circle {
          display: none !important;
        }

        /* Ocultar capas estáticas de texto del SVG nativo */
        g[id="LOTGROUP_${lotId}"] text:not(.svg-pin-text) {
          display: none !important;
        }

        /* Estilos del rect de fondo (pin de lote) en la capa superior #ALL_PINS_LAYER */
        g[id="PINGROUP_${lotId}"] rect.svg-pin-rect {
          display: ${pinDisplay} !important;
          fill: ${pinFill} !important;
          stroke: ${pinStroke} !important;
          stroke-width: ${pinStrokeWidth} !important;
          transform: ${pinScale} !important;
          transform-origin: ${pin.cx}px ${pin.cy}px !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          pointer-events: none !important;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.22)) !important;
        }

        /* Texto vectorial inyectado (número / nombre) en la capa superior #ALL_PINS_LAYER */
        g[id="PINGROUP_${lotId}"] text.svg-pin-text {
          display: ${pinDisplay} !important;
          font-size: ${isSelected || isHovered ? "28px" : "26px"} !important;
          font-weight: ${isSelected || isHovered ? "900" : "800"} !important;
          fill: ${isSelected ? "#EDE7E0" : "#0A0D0B"} !important;
          stroke: ${isSelected ? "#0A0D0B" : "#FFFFFF"} !important;
          stroke-width: 1.5px !important;
          paint-order: stroke fill !important;
          transform: ${pinScale} !important;
          transform-origin: ${pin.cx}px ${pin.cy}px !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          pointer-events: none !important;
        }
      `;
      })
      .join("");
  }, [pins, selectedLot, activeFilters, hoveredPin]);

  const toggleFilter = (key: "available" | "blocked" | "sold") => {
    setActiveFilters((prev) => {
      if (key === "blocked") {
        const nextVal = !prev.blocked;
        return { ...prev, blocked: nextVal, reserved: nextVal };
      }
      return { ...prev, [key]: !prev[key] };
    });
  };

  return (
    <div className={`relative h-[100dvh] ${containerWidthClass} bg-[#070c16] text-[#0A0D0B] select-none overflow-hidden transition-all duration-500 ease-in-out`}>
      
      {/* Estilos dinámicos inyectados */}
      <style dangerouslySetInnerHTML={{ __html: dynamicLotStyles }} />

      {/* Fondo difuminado inmersivo (extiende orgánicamente el render aéreo en pantallas 20:9 y ultrawide) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={bgImage}
          alt="Blur background"
          className="w-full h-full object-cover opacity-60 blur-2xl scale-110 pointer-events-none"
        />
        <div className="absolute inset-0 bg-[#070c16]/45 pointer-events-none" />
      </div>

      {/* Barra Superior Flotante de Controles (Master Plan + Selector de Etapa + Búsqueda Global + Filtros de Estado) */}
      <div className="absolute top-2.5 left-13 right-24 sm:top-3 sm:left-15 sm:right-40 lg:top-4 lg:left-18 lg:right-56 z-30 flex items-center justify-start gap-1.5 sm:gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto min-w-0">
          <button 
            onClick={onBack}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 lg:px-3.5 lg:py-2 bg-[#B35F27] hover:bg-[#964d1d] active:scale-95 border border-[#B35F27] rounded-full text-[9.5px] lg:text-[10px] uppercase tracking-wider text-[#EDE7E0] font-bold backdrop-blur-md transition-all duration-300 shadow-lg cursor-pointer shrink-0"
            title={isEn ? "Back to Master Plan" : "Volver al Master Plan"}
          >
            <svg className="w-3.5 h-3.5 text-[#EDE7E0] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            <span className="hidden sm:inline xl:hidden">{isEn ? "Map" : "Mapa"}</span>
            <span className="hidden xl:inline">Master Plan</span>
          </button>

          {/* Selector Desplegable Compacto de Etapa (En la Barra Superior) */}
          <div ref={stageMenuRef} className="relative shrink-0">
            <button
              onClick={() => setIsStageMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 lg:px-3 lg:py-2 bg-[#0A0D0B]/90 hover:bg-[#0A0D0B] text-[#EDE7E0] border border-[#B35F27]/55 rounded-full text-[9.5px] lg:text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-lg transition-all cursor-pointer active:scale-95"
              title={isEn ? "Switch Stage" : "Cambiar de Etapa"}
            >
              <span className="h-2 w-2 rounded-full bg-[#B35F27] shrink-0" />
              <span className="whitespace-nowrap">{stageName}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#dbaa67] transition-transform duration-200 shrink-0 ${
                  isStageMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {isStageMenuOpen && onChangeStage && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                  className="absolute top-full left-0 mt-1.5 w-48 bg-[#0A0D0B]/95 border border-[#B35F27]/45 rounded-2xl p-1.5 shadow-2xl backdrop-blur-xl z-50 space-y-0.5"
                >
                  <div className="px-2.5 py-1 text-[8px] font-mono uppercase tracking-[0.2em] text-[#dbaa67]/75 border-b border-white/10 mb-1">
                    {isEn ? "Select Stage" : "Seleccionar Etapa"}
                  </div>
                  {activeStages.map((stKey) => {
                    const isCurrent = stKey === stageId;
                    const label = getStageDisplayName(stKey, isEn);
                    return (
                      <button
                        key={stKey}
                        onClick={() => {
                          onChangeStage(stKey);
                          setIsStageMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-[#B35F27] text-[#EDE7E0] shadow-md"
                            : "text-[#EDE7E0]/80 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              isCurrent ? "bg-[#EDE7E0]" : "bg-[#B35F27]/70"
                            }`}
                          />
                          <span className="whitespace-nowrap">{label}</span>
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] text-[#EDE7E0] font-bold">✓</span>
                        )}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Buscador Rápido Global de Lotes (318 Lotes) */}
          {!isAmenities && (
            <div className="relative min-w-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 border border-[#0A0D0B]/15 rounded-full shadow-md backdrop-blur-md">
                <svg className="w-3.5 h-3.5 text-[#B35F27] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder={isEn ? "Search lot..." : "Buscar lote..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-[10px] lg:text-[11px] text-[#0A0D0B] placeholder-[#0A0D0B]/50 focus:outline-none w-16 focus:w-24 sm:w-20 sm:focus:w-28 lg:w-32 xl:w-40 transition-all font-semibold"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-[#0A0D0B]/40 hover:text-[#0A0D0B] text-xs cursor-pointer shrink-0">
                    &times;
                  </button>
                )}
              </div>

              {/* Resultados de Búsqueda Global */}
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 mt-1.5 w-60 bg-[#EDE7E0] border border-[#B35F27]/40 rounded-xl p-1.5 shadow-2xl backdrop-blur-xl z-50 space-y-1">
                  {searchResults.map((item) => {
                    const isOtherStage = item.stageKey !== stageId;
                    return (
                      <button
                        key={`${item.stageKey}-${item.lotId}`}
                        onClick={() => {
                          if (isOtherStage && onChangeStage) {
                            onChangeStage(item.stageKey);
                          }
                          onSelectLot(item.lotData);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white text-left transition-colors text-[11px] cursor-pointer"
                      >
                        <div>
                          <span className="font-serif font-bold text-[#0A0D0B] block">
                            {isEn ? "Lot" : "Lote"} {item.lotData.rawId || item.lotId}
                          </span>
                          <span className="text-[9px] text-[#0A0D0B]/60 font-medium">
                            {getStageDisplayName(item.stageKey, isEn)} &bull; {translateAreaText(item.lotData.area, isEn)}
                          </span>
                        </div>
                        <span
                          className={`text-[8px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            item.lotData.status === "available"
                              ? "text-[#10b981] bg-[#10b981]/15"
                              : item.lotData.status === "blocked" || item.lotData.status === "reserved"
                              ? "text-[#3b82f6] bg-[#3b82f6]/15"
                              : "text-[#ef4444] bg-[#ef4444]/15"
                          }`}
                        >
                          {translateStatusRaw(item.lotData.statusRaw, isEn, item.lotData.status)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Filtros de Estado en Línea (sm+ en Móvil Horizontal, Tablet y Desktop): Cero solapamiento con la esquina derecha */}
          {!isAmenities && (
            <div className="hidden sm:flex items-center gap-1 lg:gap-1.5 bg-[#0A0D0B]/88 border border-[#EDE7E0]/15 p-1 rounded-full backdrop-blur-md shadow-lg shrink-0">
              <button
                onClick={() => toggleFilter("available")}
                className={`flex items-center gap-1 lg:gap-1.5 px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full text-[8.5px] lg:text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeFilters.available
                    ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40"
                    : "text-white/40 hover:text-white/70 border border-transparent"
                }`}
                title={isEn ? "Toggle Available Lots" : "Mostrar/Ocultar Lotes Disponibles"}
              >
                <span className="h-1.5 w-1.5 lg:h-2 lg:w-2 rounded-full bg-[#10b981]" />
                <span className="xl:hidden">{isEn ? "Avail." : "Disp."} ({stats.available})</span>
                <span className="hidden xl:inline">{isEn ? "Available" : "Disponibles"} ({stats.available})</span>
              </button>

              <button
                onClick={() => toggleFilter("blocked")}
                className={`flex items-center gap-1 lg:gap-1.5 px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full text-[8.5px] lg:text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeFilters.blocked
                    ? "bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/40"
                    : "text-white/40 hover:text-white/70 border border-transparent"
                }`}
                title={isEn ? "Toggle Blocked Lots" : "Mostrar/Ocultar Lotes Bloqueados"}
              >
                <span className="h-1.5 w-1.5 lg:h-2 lg:w-2 rounded-full bg-[#3b82f6]" />
                <span className="xl:hidden">{isEn ? "Blk." : "Bloq."} ({stats.blocked})</span>
                <span className="hidden xl:inline">{isEn ? "Blocked" : "Bloqueados"} ({stats.blocked})</span>
              </button>

              <button
                onClick={() => toggleFilter("sold")}
                className={`flex items-center gap-1 lg:gap-1.5 px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full text-[8.5px] lg:text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeFilters.sold
                    ? "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40"
                    : "text-white/40 hover:text-white/70 border border-transparent"
                }`}
                title={isEn ? "Toggle Sold Lots" : "Mostrar/Ocultar Lotes Vendidos"}
              >
                <span className="h-1.5 w-1.5 lg:h-2 lg:w-2 rounded-full bg-[#ef4444]" />
                <span className="xl:hidden">{isEn ? "Sold" : "Vend."} ({stats.sold})</span>
                <span className="hidden xl:inline">{isEn ? "Sold" : "Vendidos"} ({stats.sold})</span>
              </button>
            </div>
          )}

          {/* Botón Integrado de Galería para Alma Beach Club */}
          {isAmenities && (
            <button
              onClick={() => {
                const almaPin = pins.find((p) => p.lotId === "CLUB_HOUSE" || p.lotData.status === "common");
                if (almaPin) {
                  onSelectLot(almaPin.lotData);
                } else {
                  onSelectLot({
                    id: "CLUB_HOUSE",
                    rawId: "Alma Beach Club",
                    area: "Club de Playa",
                    location: "Club de Playa con Salida Directa al Mar",
                    status: "common",
                    statusRaw: "AMENIDAD",
                    totalPrice: "Área Común",
                    downPayment: "-",
                    financing: "-",
                    finalPayment: "-",
                  });
                }
              }}
              className="bg-[#0A0D0B]/90 hover:bg-[#B35F27] border border-[#B35F27]/60 px-3 py-1.5 rounded-full text-[8.5px] sm:text-[9px] font-bold text-[#EDE7E0] tracking-wider uppercase backdrop-blur-md flex items-center gap-1.5 shadow-lg transition-all cursor-pointer shrink-0"
            >
              <span className="h-2 w-2 rounded-full bg-[#B35F27] animate-pulse shrink-0"></span>
              <span className="truncate max-w-[165px] sm:max-w-none">
                {isEn
                  ? "Alma Beach Club • View Gallery (23 Renders)"
                  : "Alma Beach Club • Ver Galería (23 Renders)"}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Píldoras Interactivas de Filtro por Estado SOLO en Móvil Vertical estrecho (<640px) */}
      {!isAmenities && (
        <div className="sm:hidden absolute top-13 inset-x-0 z-30 flex justify-center px-3 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1 bg-[#0A0D0B]/88 border border-[#EDE7E0]/15 p-1 rounded-full backdrop-blur-md shadow-lg max-w-full overflow-x-auto no-scrollbar">
            <button
              onClick={() => toggleFilter("available")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                activeFilters.available
                  ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40"
                  : "text-white/40 border border-transparent"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
              <span>{isEn ? "Avail." : "Disp."} ({stats.available})</span>
            </button>

            <button
              onClick={() => toggleFilter("blocked")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                activeFilters.blocked
                  ? "bg-[#3b82f6]/20 text-[#60a5fa] border border-[#3b82f6]/40"
                  : "text-white/40 border border-transparent"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]" />
              <span>{isEn ? "Blocked" : "Bloq."} ({stats.blocked})</span>
            </button>

            <button
              onClick={() => toggleFilter("sold")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-bold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                activeFilters.sold
                  ? "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40"
                  : "text-white/40 border border-transparent"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />
              <span>{isEn ? "Sold" : "Vend."} ({stats.sold})</span>
            </button>
          </div>
        </div>
      )}

      {/* Área del Plano */}
      <div
        className={`absolute inset-0 w-full h-full overflow-hidden bg-transparent z-10 ${
          mapZoom > 1 ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        onMouseDown={(e) => {
          if (mapZoom <= 1) return;
          panDragRef.current = {
            active: true,
            moved: false,
            startX: e.clientX,
            startY: e.clientY,
            originX: mapPan.x,
            originY: mapPan.y,
          };
        }}
        onMouseMove={(e) => {
          if (!panDragRef.current.active || mapZoom <= 1) return;
          const dx = e.clientX - panDragRef.current.startX;
          const dy = e.clientY - panDragRef.current.startY;
          if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
            panDragRef.current.moved = true;
          }
          const maxPan = (mapZoom - 1) * 420;
          setMapPan({
            x: Math.max(-maxPan, Math.min(maxPan, panDragRef.current.originX + dx)),
            y: Math.max(-maxPan, Math.min(maxPan, panDragRef.current.originY + dy)),
          });
        }}
        onMouseUp={() => {
          panDragRef.current.active = false;
        }}
        onMouseLeave={() => {
          panDragRef.current.active = false;
        }}
        onTouchStart={(e) => {
          if (mapZoom <= 1 || e.touches.length !== 1) return;
          const t = e.touches[0];
          panDragRef.current = {
            active: true,
            moved: false,
            startX: t.clientX,
            startY: t.clientY,
            originX: mapPan.x,
            originY: mapPan.y,
          };
        }}
        onTouchMove={(e) => {
          if (!panDragRef.current.active || mapZoom <= 1 || e.touches.length !== 1) return;
          const t = e.touches[0];
          const dx = t.clientX - panDragRef.current.startX;
          const dy = t.clientY - panDragRef.current.startY;
          if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
            panDragRef.current.moved = true;
          }
          const maxPan = (mapZoom - 1) * 320;
          setMapPan({
            x: Math.max(-maxPan, Math.min(maxPan, panDragRef.current.originX + dx)),
            y: Math.max(-maxPan, Math.min(maxPan, panDragRef.current.originY + dy)),
          });
        }}
        onTouchEnd={() => {
          panDragRef.current.active = false;
        }}
      >
          {/* Ocultar textos nativos y líneas perimetrales CAD fuera de los lotes SOLO en el SVG del mapa */}
          <style dangerouslySetInnerHTML={{ __html: `
            .loom-stage-map-svg svg text:not(.svg-pin-text) {
              display: none !important;
            }

            /* Ocultar polígonos y líneas perimetrales (CAD/Illustrator) que no corresponden a lotes en el mapa */
            .loom-stage-map-svg svg path:not(g[id^='LOTGROUP_'] *),
            .loom-stage-map-svg svg polyline:not(g[id^='LOTGROUP_'] *),
            .loom-stage-map-svg svg polygon:not(g[id^='LOTGROUP_'] *),
            .loom-stage-map-svg svg line:not(g[id^='LOTGROUP_'] *) {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              stroke: transparent !important;
            }
          `}} />

          {/* Wrapper del Mapa con Zoom y Paneo Suave */}
          <div
            className="w-full h-full relative transition-transform duration-150 ease-out"
            style={{
              transform: `translate3d(${mapPan.x}px, ${mapPan.y}px, 0) scale(${mapZoom})`,
              transformOrigin: "center center",
            }}
          >
            
            {/* Fondo de Render de la Etapa */}
            <img
              src={bgImage}
              alt={`Fondo ${stageName}`}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              draggable={false}
            />

            <>
              {/* SVG Vectorial Overlay (Capa interactiva de lotes y trazados) */}
              {svgText && (
                <div
                  className="loom-stage-map-svg absolute inset-0 w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain z-10 pointer-events-auto"
                  dangerouslySetInnerHTML={{ __html: svgText }}
                  onMouseOver={(e) => {
                    const target = e.target as SVGElement;
                    const group = target.closest("g[id^='LOTGROUP_']");
                    if (group) {
                      const id = group.getAttribute("id")?.replace("LOTGROUP_", "");
                      const pin = pins.find((p) => p.lotId === id);
                      if (pin) setHoveredPin(pin);
                    }
                  }}
                  onMouseOut={() => {
                    setHoveredPin(null);
                  }}
                  onClick={(e) => {
                    if (panDragRef.current.moved) {
                      panDragRef.current.moved = false;
                      return;
                    }
                    const target = e.target as SVGElement;
                    const group = target.closest("g[id^='LOTGROUP_']");
                    if (group) {
                      const id = group.getAttribute("id")?.replace("LOTGROUP_", "");
                      const pin = pins.find((p) => p.lotId === id);
                      if (pin) {
                        onSelectLot(pin.lotData);
                        
                        // Ocultar el tooltip flotante tras 3 segundos en móviles/tabletas
                        if (typeof window !== "undefined" && window.innerWidth < 1024) {
                          setTimeout(() => {
                            setHoveredPin((prev) => (prev?.lotId === id ? null : prev));
                          }, 3000);
                        }
                      }
                    }
                  }}
                />
              )}

              {/* Tooltip Enriquecido de Lote */}
              <AnimatePresence>
                {hoveredPin && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 4 }}
                    className="absolute z-50 pointer-events-none p-3 rounded-xl border border-[#B35F27]/45 bg-[#0A0D0B]/92 shadow-2xl backdrop-blur-xl text-[11px] text-[#EDE7E0] min-w-[165px]"
                    style={{
                      left: `${hoveredPin.xPercent}%`,
                      top: `${Math.max(8, hoveredPin.yPercent - 11)}%`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5 mb-1.5">
                      <span className="font-bold tracking-wider text-[#dbaa67] uppercase">
                        {hoveredPin.lotId === "PORTERIA" || hoveredPin.lotData.rawId.toLowerCase().includes("porteria")
                          ? isEn ? "MAIN GATEHOUSE" : "PORTERÍA"
                          : hoveredPin.lotId === "PARQUE_1"
                          ? isEn ? "PARK 1" : "PARQUE 1"
                          : hoveredPin.lotId === "PARQUE_2"
                          ? isEn ? "PARK 2" : "PARQUE 2"
                          : hoveredPin.lotId === "CLUB_HOUSE" || hoveredPin.lotId.includes("CLUB")
                          ? hoveredPin.lotData.rawId.toUpperCase()
                          : hoveredPin.lotId.includes("PARQUE")
                          ? hoveredPin.lotData.rawId.replace("_", " ").toUpperCase()
                          : `${isEn ? "LOT" : "LOTE"} ${hoveredPin.lotData.rawId}`}
                      </span>
                      <span
                        className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          hoveredPin.lotData.status === "available"
                            ? "bg-[#10b981]/25 text-[#10b981]"
                            : hoveredPin.lotData.status === "blocked" || hoveredPin.lotData.status === "reserved"
                            ? "bg-[#3b82f6]/25 text-[#60a5fa]"
                            : hoveredPin.lotData.status === "common"
                            ? "bg-[#B35F27]/30 text-[#dbaa67]"
                            : "bg-[#ef4444]/25 text-[#ef4444]"
                        }`}
                      >
                        {translateStatusRaw(hoveredPin.lotData.statusRaw, isEn, hoveredPin.lotData.status)}
                      </span>
                    </div>
                    <div className="space-y-1 text-[10px]">
                      <p className="flex justify-between gap-4">
                        <span className="text-[#EDE7E0]/60">{isEn ? "Area:" : "Área:"}</span>
                        <span className="font-semibold text-[#EDE7E0]">
                          {translateAreaText(hoveredPin.lotData.area, isEn)}
                        </span>
                      </p>
                      {hoveredPin.lotData.location && (
                        <p className="flex justify-between gap-4">
                          <span className="text-[#EDE7E0]/60">{isEn ? "Type:" : "Ubicación:"}</span>
                          <span className="font-semibold text-[#EDE7E0]">
                            {translateLocationType(hoveredPin.lotData.location, isEn)}
                          </span>
                        </p>
                      )}
                      {hoveredPin.lotData.status === "common" && (
                        <p className="pt-1 border-t border-white/10 text-[9px] font-bold uppercase tracking-wider text-[#dbaa67] text-center">
                          {isEn ? "Click to open photo gallery →" : "Clic para ver galería de fotos →"}
                        </p>
                      )}
                      {hoveredPin.lotData.totalPrice &&
                        hoveredPin.lotData.totalPrice !== "Área Común" &&
                        hoveredPin.lotData.status === "available" && (
                          <p className="flex justify-between gap-4 pt-0.5 border-t border-white/10">
                            <span className="text-[#EDE7E0]/60">{isEn ? "Price:" : "Precio:"}</span>
                            <span className="font-bold text-[#10b981]">
                              {formatCopOrUsd(hoveredPin.lotData.totalPrice, isEn, trm, isEn)}
                            </span>
                          </p>
                        )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>

          </div>

          {/* Flecha Lateral Izquierda (Etapa Anterior) */}
          {prevStageId && onChangeStage && (
            <button
              onClick={() => onChangeStage(prevStageId)}
              className="group absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 bg-[#EDE7E0] hover:bg-[#B35F27] active:scale-95 border border-[#0A0D0B]/20 rounded-full text-[#0A0D0B] hover:text-[#EDE7E0] backdrop-blur-md transition-all duration-300 shadow-xl cursor-pointer"
              title={isEn ? "Previous Stage" : "Etapa Anterior"}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-[#0A0D0B] group-hover:stroke-[#EDE7E0] transition-colors" fill="none" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
          )}

          {/* Flecha Lateral Derecha (Etapa Siguiente) */}
          {nextStageId && onChangeStage && (
            <button
              onClick={() => onChangeStage(nextStageId)}
              className="group absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 bg-[#EDE7E0] hover:bg-[#B35F27] active:scale-95 border border-[#0A0D0B]/20 rounded-full text-[#0A0D0B] hover:text-[#EDE7E0] backdrop-blur-md transition-all duration-300 shadow-xl cursor-pointer"
              title={isEn ? "Next Stage" : "Etapa Siguiente"}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 stroke-[#0A0D0B] group-hover:stroke-[#EDE7E0] transition-colors" fill="none" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          )}
      </div>

      {/* Controles Flotantes de Zoom del Mapa */}
      <div className="absolute bottom-3 left-3 lg:bottom-5 lg:left-4 z-30 flex items-center gap-1 p-1 bg-[#0A0D0B]/88 border border-[#EDE7E0]/15 rounded-full backdrop-blur-md shadow-xl pointer-events-auto">
        <button
          onClick={() => setMapZoom((z) => Math.min(2.75, +(z + 0.35).toFixed(2)))}
          className="p-1.5 text-[#EDE7E0]/85 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          title={isEn ? "Zoom In (+)" : "Acercar Mapa (+)"}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => setMapZoom((z) => Math.max(1, +(z - 0.35).toFixed(2)))}
          className="p-1.5 text-[#EDE7E0]/85 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          title={isEn ? "Zoom Out (-)" : "Alejar Mapa (-)"}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
          </svg>
        </button>
        {mapZoom > 1 && (
          <button
            onClick={() => {
              setMapZoom(1);
              setMapPan({ x: 0, y: 0 });
            }}
            className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#dbaa67] hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            {mapZoom}x
          </button>
        )}
      </div>

      {/* Leyenda de Brújula (Flotante a la Derecha) */}
      <div className="absolute bottom-5 right-5 z-20 hidden xl:flex items-center gap-2 text-[#0A0D0B]/75 text-[9px] uppercase tracking-widest font-semibold bg-[#EDE7E0]/90 border border-[#0A0D0B]/10 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-sm">
        <Compass className="h-3.5 w-3.5 text-[#B35F27] rotate-[45deg]" />
        {isEn ? "North oriented towards the sea (Right / Beach)" : "Norte orientado hacia el mar (Derecha / Playa)"}
      </div>

    </div>
  );
}
