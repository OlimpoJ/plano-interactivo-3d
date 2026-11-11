export interface Unified3DLot {
  id: string;
  uniqueKey: string;
  stageId: string;
  cx: number;
  cy: number;
  width: number;
  height: number;
  vertices: [number, number][];
  isAmenity: boolean;
  backAngle?: number;
  villaCx?: number;
  villaCy?: number;
  villaL?: number;
  villaW?: number;
}

export interface Landscape3DData {
  palms: [number, number, number, number][];
  trees: [number, number, number, number][];
}

export interface CameraPreset {
  id: string;
  labelEs: string;
  labelEn: string;
  position: [number, number, number];
  target: [number, number, number];
  renderPreview?: {
    titleEs: string;
    titleEn: string;
    src: string;
    badgeEs: string;
    badgeEn: string;
  };
}

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: "referencia",
    labelEs: "Playa & Villas",
    labelEn: "Beach & Villas",
    position: [4.2, 5.4, 7.2],
    target: [7.8, 0.0, -0.6],
  },
  {
    id: "general",
    labelEs: "Masterplan (318)",
    labelEn: "Masterplan (318)",
    position: [0, 21, 27],
    target: [0, 0, 0],
  },
  {
    id: "mar",
    labelEs: "Playa Alma",
    labelEn: "Playa Alma",
    position: [15.5, 6.2, 8.5],
    target: [10.2, 0, -0.8],
    renderPreview: {
      titleEs: "Alma Beach Club • Salida Directa al Mar Caribe",
      titleEn: "Alma Beach Club • Direct Caribbean Sea Access",
      src: "/loom/renders/amenities/club-de-playa/galeria_03_club_de_playa_vista_2.webp",
      badgeEs: "Vista Dron Costera",
      badgeEn: "Coastal Drone View",
    },
  },
  {
    id: "porteria",
    labelEs: "Portería Km 23",
    labelEn: "Gatehouse Km 23",
    position: [-14.2, 6.4, 8.6],
    target: [-19.4, 0, 0.2],
    renderPreview: {
      titleEs: "Portería Loom • Vía del Mar Kilómetro 23",
      titleEn: "Loom Gatehouse • Vía del Mar Kilometer 23",
      src: "/loom/renders/amenities/porteria/galeria_04_porteria_vista_4.webp",
      badgeEs: "Vía del Mar Kilómetro 23",
      badgeEn: "Vía del Mar Kilometer 23",
    },
  },
  {
    id: "clubhouse",
    labelEs: "Club House & Oasis",
    labelEn: "Club House & Oasis",
    position: [2.2, 5.6, 7.4],
    target: [3.2, 0, -0.5],
    renderPreview: {
      titleEs: "Club House • Piscina Resort & Canchas de Pádel",
      titleEn: "Club House • Resort Pool & Padel Courts",
      src: "/loom/renders/amenities/club-house/galeria_01_club_house_piscina_vista_1.webp",
      badgeEs: "Zona Social Central",
      badgeEn: "Central Social Hub",
    },
  },
  {
    id: "parques",
    labelEs: "Parque Lineal",
    labelEn: "Linear Park",
    position: [-3.8, 5.5, 7.2],
    target: [-3.5, 0, 0.2],
    renderPreview: {
      titleEs: "Parque Lineal • Corredor Bioclimático Central",
      titleEn: "Linear Park • Central Bioclimatic Corridor",
      src: "/loom/renders/amenities/parques/galeria_01_parque_lineal_vista_1.webp",
      badgeEs: "Corredor Ecológico",
      badgeEn: "Ecological Corridor",
    },
  },
  {
    id: "planta",
    labelEs: "Planta 90°",
    labelEn: "Top Plan 90°",
    position: [0, 34, 0.05],
    target: [0, 0, 0],
  },
];

export const STAGE_CAMERA_TARGETS: Record<
  string,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  all: { pos: [0, 21, 27], target: [0, 0, 0] },
  etapa_1: { pos: [-13.0, 9.2, 11.5], target: [-13.0, 0, 0.6] },
  etapa_2: { pos: [-8.2, 9.2, 11.5], target: [-8.2, 0, 0.5] },
  etapa_3: { pos: [-3.6, 9.2, 11.5], target: [-3.6, 0, 0.4] },
  etapa_4: { pos: [0.8, 9.2, 11.5], target: [0.8, 0, 0.3] },
  etapa_5: { pos: [6.8, 9.2, 11.5], target: [6.8, 0, 0.2] },
  etapa_6: { pos: [19.5, 8.2, 10.8], target: [11.8, 0, 0.0] },
};

export const WORLD_W = 38.4;
export const WORLD_D = 21.6;

export function svgToWorld(svgX: number, svgY: number): [number, number] {
  const wx = (svgX / 3840 - 0.5) * WORLD_W;
  const wz = (svgY / 2160 - 0.5) * WORLD_D;
  return [wx, wz];
}

export function glslSmoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Calcula la elevación exacta del terreno 3D (idéntica a TERRAIN_WATER_VERTEX_GLSL)
// para impedir físicamente que la cámara o el pivote atraviesen el suelo o las colinas del Oeste
export function getTerrainElevationAt(wx: number, wz: number): number {
  const mUvX = wx / 38.4 + 0.5;
  const mUvY = 0.5 - wz / 21.6;
  const westFactor = glslSmoothstep(-0.042, -0.14, mUvX);
  const northSouthHills =
    Math.max(glslSmoothstep(1.06, 1.32, mUvY), glslSmoothstep(-0.06, -0.32, mUvY)) *
    (1.0 - glslSmoothstep(0.55, 0.72, mUvX));
  const reliefMask = Math.max(0.0, Math.min(1.0, westFactor + northSouthHills * 0.75));
  if (reliefMask <= 0.0001) return 0.0;

  const h1 = Math.sin(wx * 0.24 + wz * 0.19) * Math.cos(wz * 0.16 - wx * 0.11);
  const h2 = Math.sin(wx * 0.58 - wz * 0.47) * 0.38;
  const h3 = Math.cos(wx * 1.15 + wz * 0.92) * 0.16;
  const clearingDist = Math.hypot((mUvX + 0.13) * 2.4, (mUvY - 0.44) * 1.6);
  const terraceMound = (1.0 - glslSmoothstep(0.10, 0.34, clearingDist)) * 0.38;
  const rawElev = Math.max(0.0, (h1 + h2 + h3) * 0.5 + 0.42) * 1.15 + terraceMound;
  return rawElev * reliefMask;
}

