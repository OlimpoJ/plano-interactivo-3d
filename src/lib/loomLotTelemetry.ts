export interface LotNeighbor {
  id: string;
  rawId: string;
  relationEs: string;
  relationEn: string;
}

export interface AmenityDistance {
  key: "ALMA_BEACH" | "CLUB_HOUSE" | "PARQUE_LINEAL" | "PORTERIA";
  labelEs: string;
  labelEn: string;
  meters: number;
  walkMinutes: number;
}

export interface LotTelemetry {
  lotId: string;
  block: string;
  number: number;
  stageKey: string;
  solarOrientationEs: string;
  solarOrientationEn: string;
  breezeVectorEs: string;
  breezeVectorEn: string;
  frontMeters: number;
  depthMeters: number;
  compatibleVillas: {
    luxury: boolean;
    garden: boolean;
    recommendedEs: string;
    recommendedEn: string;
    footprintPct: number;
  };
  neighbors: LotNeighbor[];
  distances: AmenityDistance[];
}

/**
 * Extrae las coordenadas [x, y] de un string SVG points="x1,y1 x2,y2 ..."
 */
export function parseSvgPolygonPoints(pointsStr: string): [number, number][] {
  if (!pointsStr) return [];
  const nums = pointsStr
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter((n) => !isNaN(n));
  const coords: [number, number][] = [];
  for (let i = 0; i < nums.length - 1; i += 2) {
    coords.push([nums[i], nums[i + 1]]);
  }
  return coords;
}

/**
 * Calcula el centroide geométrico [cx, cy] y bounding box de un polígono SVG
 */
export function computePolygonGeometry(pointsStr: string): {
  cx: number;
  cy: number;
  width: number;
  height: number;
  vertices: [number, number][];
} {
  const vertices = parseSvgPolygonPoints(pointsStr);
  if (vertices.length === 0) {
    return { cx: 1920, cy: 1080, width: 80, height: 80, vertices: [] };
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let sumX = 0;
  let sumY = 0;

  for (const [x, y] of vertices) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    sumX += x;
    sumY += y;
  }

  return {
    cx: sumX / vertices.length,
    cy: sumY / vertices.length,
    width: Math.max(20, maxX - minX),
    height: Math.max(20, maxY - minY),
    vertices,
  };
}

/**
 * Calcula telemetría arquitectónica, orientación bioclimática, colindancias y distancias a zonas comunes
 */
export function computeLotTelemetry(
  lotId: string,
  areaNumeric: number | null,
  locationStr: string,
  allStageLotIds: string[] = [],
  polygonCentroids?: Record<string, { cx: number; cy: number }>
): LotTelemetry {
  const cleanId = (lotId || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = cleanId.match(/^([A-L])(\d+)$/);
  const block = match ? match[1] : "A";
  const number = match ? parseInt(match[2], 10) : 1;

  const stageKey = ["A", "B", "C"].includes(block)
    ? "etapa_1"
    : ["D", "E"].includes(block)
    ? "etapa_2"
    : ["F", "G"].includes(block)
    ? "etapa_3"
    : ["H", "I"].includes(block)
    ? "etapa_4"
    : "etapa_5";

  const sqm = areaNumeric && areaNumeric > 50 ? areaNumeric : 252.79;
  const isCorner = (locationStr || "").toUpperCase().includes("ESQUINERO");

  // Dimensiones aproximadas basadas en la proporción de los lotes de Loom (~12m a 14.5m de frente x 18m a 22m de fondo)
  const aspect = isCorner ? 0.68 : 0.62;
  const frontMeters = Math.round(Math.sqrt(sqm * aspect) * 10) / 10;
  const depthMeters = Math.round((sqm / frontMeters) * 10) / 10;

  // Orientación solar y brisa según manzana y paridad
  const isEven = number % 2 === 0;
  const solarOrientationEs = isEven
    ? "Noreste – Suroeste • Sol de Mañana en Terraza"
    : "Noroccidente – Suroriente • Sombra Bioclimática de Tarde";
  const solarOrientationEn = isEven
    ? "NE – SW • Morning Sun on Pool Terrace"
    : "NW – SE • Afternoon Bioclimatic Shade";

  const breezeVectorEs = "Alisios del Caribe (NNE) • Ventilación Cruzada Natural";
  const breezeVectorEn = "Caribbean Trade Winds (NNE) • Natural Cross-Ventilation";

  // Vecinos / Colindancias
  const neighbors: LotNeighbor[] = [];
  const stageSet = new Set(allStageLotIds.map((id) => id.toUpperCase().replace(/[^A-Z0-9]/g, "")));

  // 1. Si tenemos centroides del SVG, detectar los lotes más cercanos geométricamente
  if (polygonCentroids && polygonCentroids[cleanId]) {
    const origin = polygonCentroids[cleanId];
    const candidates = Object.entries(polygonCentroids)
      .filter(([k]) => k !== cleanId && /^[A-L]\d+$/.test(k))
      .map(([k, pt]) => {
        const dx = pt.cx - origin.cx;
        const dy = pt.cy - origin.cy;
        const dist = Math.hypot(dx, dy);
        return { id: k, dist, dx, dy };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3);

    candidates.forEach((cand, idx) => {
      const m = cand.id.match(/^([A-L])(\d+)$/);
      const formattedRaw = m ? `${m[1]}-${m[2]}` : cand.id;
      const sameBlock = cand.id.startsWith(block);
      neighbors.push({
        id: cand.id,
        rawId: formattedRaw,
        relationEs: sameBlock
          ? idx === 0
            ? "Lindero Lateral"
            : "Lindero Contiguo"
          : "Lindero Posterior / Frente",
        relationEn: sameBlock
          ? idx === 0
            ? "Side Boundary"
            : "Adjacent Boundary"
          : "Rear / Front Boundary",
      });
    });
  }

  // 2. Fallback determinístico por numeración de manzana si no hay centroides aún
  if (neighbors.length === 0) {
    if (number > 1) {
      const prevId = `${block}${number - 1}`;
      if (stageSet.size === 0 || stageSet.has(prevId)) {
        neighbors.push({
          id: prevId,
          rawId: `${block}-${number - 1}`,
          relationEs: "Lindero Izquierdo",
          relationEn: "Left Boundary",
        });
      }
    }
    const nextId = `${block}${number + 1}`;
    if (stageSet.size === 0 || stageSet.has(nextId)) {
      neighbors.push({
        id: nextId,
        rawId: `${block}-${number + 1}`,
        relationEs: "Lindero Derecho",
        relationEn: "Right Boundary",
      });
    }
  }

  // Distancias reales aproximadas a las amenidades según la etapa y manzana
  const stageDistanceConfig: Record<
    string,
    { beach: number; club: number; park: number; gate: number }
  > = {
    etapa_1: { beach: 340, club: 140, park: 45, gate: 95 },
    etapa_2: { beach: 280, club: 110, park: 40, gate: 165 },
    etapa_3: { beach: 210, club: 85, park: 35, gate: 230 },
    etapa_4: { beach: 150, club: 120, park: 38, gate: 290 },
    etapa_5: { beach: 95, club: 160, park: 42, gate: 350 },
  };

  const baseDist = stageDistanceConfig[stageKey] || stageDistanceConfig.etapa_1;
  const offset = (number % 7) * 8;

  const distances: AmenityDistance[] = [
    {
      key: "ALMA_BEACH",
      labelEs: "Alma Beach Club (Salida Directa al Mar)",
      labelEn: "Alma Beach Club (Direct Sea Access)",
      meters: baseDist.beach + offset,
      walkMinutes: Math.max(1, Math.round((baseDist.beach + offset) / 75)),
    },
    {
      key: "CLUB_HOUSE",
      labelEs: "Club House & LOOM Oasis",
      labelEn: "Club House & LOOM Oasis",
      meters: baseDist.club + Math.round(offset * 0.6),
      walkMinutes: Math.max(1, Math.round((baseDist.club + offset * 0.6) / 75)),
    },
    {
      key: "PARQUE_LINEAL",
      labelEs: "Parque Lineal • The Garden Walk",
      labelEn: "Linear Park • The Garden Walk",
      meters: baseDist.park + (number % 4) * 5,
      walkMinutes: 1,
    },
    {
      key: "PORTERIA",
      labelEs: "Portería Monumental 24/7",
      labelEn: "24/7 Monumental Gatehouse",
      meters: baseDist.gate + offset,
      walkMinutes: Math.max(1, Math.round((baseDist.gate + offset) / 75)),
    },
  ];

  // Compatibilidad con Villa Luxury (353 m² en 3 niveles, huella de 1er piso ~150-198 m²) y Villa Garden (274 m²)
  const footprintPct = Math.min(58, Math.max(34, Math.round((138 / sqm) * 100)));
  const recommendedEs =
    sqm >= 255 || isCorner
      ? "Villa Luxury (353 m²) o Villa Garden (274 m²)"
      : "Villa Garden (274 m²) o Villa Luxury Compacta";
  const recommendedEn =
    sqm >= 255 || isCorner
      ? "Villa Luxury (3,800 sq ft) or Villa Garden (2,949 sq ft)"
      : "Villa Garden (2,949 sq ft) or Villa Luxury";

  return {
    lotId: cleanId,
    block,
    number,
    stageKey,
    solarOrientationEs,
    solarOrientationEn,
    breezeVectorEs,
    breezeVectorEn,
    frontMeters,
    depthMeters,
    compatibleVillas: {
      luxury: true,
      garden: true,
      recommendedEs,
      recommendedEn,
      footprintPct,
    },
    neighbors,
    distances,
  };
}

/**
 * Clasifica el área en m² en 4 rangos de color para el modo "Colorear por Área"
 */
export type AreaTierKey = "tier1" | "tier2" | "tier3" | "tier4";

export interface AreaTierInfo {
  key: AreaTierKey;
  labelEs: string;
  labelEn: string;
  minSqm: number;
  maxSqm: number;
  fillHex: string;
  strokeHex: string;
  badgeBg: string;
}

export const AREA_TIERS: AreaTierInfo[] = [
  {
    key: "tier1",
    labelEs: "200 – 235 m²",
    labelEn: "2,150 – 2,530 sq ft",
    minSqm: 0,
    maxSqm: 235,
    fillHex: "#38bdf8",
    strokeHex: "#0284c7",
    badgeBg: "bg-sky-500",
  },
  {
    key: "tier2",
    labelEs: "236 – 265 m²",
    labelEn: "2,540 – 2,850 sq ft",
    minSqm: 235.01,
    maxSqm: 265,
    fillHex: "#10b981",
    strokeHex: "#059669",
    badgeBg: "bg-emerald-500",
  },
  {
    key: "tier3",
    labelEs: "266 – 310 m²",
    labelEn: "2,860 – 3,340 sq ft",
    minSqm: 265.01,
    maxSqm: 310,
    fillHex: "#f59e0b",
    strokeHex: "#d97706",
    badgeBg: "bg-amber-500",
  },
  {
    key: "tier4",
    labelEs: "+310 m² (Grand)",
    labelEn: "+3,340 sq ft (Grand)",
    minSqm: 310.01,
    maxSqm: 99999,
    fillHex: "#c084fc",
    strokeHex: "#9333ea",
    badgeBg: "bg-purple-500",
  },
];

export function getAreaTier(sqm: number | null): AreaTierInfo {
  const val = sqm || 250;
  for (const tier of AREA_TIERS) {
    if (val >= tier.minSqm && val <= tier.maxSqm) {
      return tier;
    }
  }
  return AREA_TIERS[1];
}
