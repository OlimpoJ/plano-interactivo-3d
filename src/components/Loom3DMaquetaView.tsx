"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  Sun,
  Sunset,
  Home,
  Compass,
  Camera,
  Box,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  X,
  Globe,
  Trees,
  Download,
} from "lucide-react";
import {
  useLoomLang,
  getStageDisplayName,
} from "@/lib/loomI18n";
import {
  AREA_TIERS,
  getAreaTier,
  AreaTierKey,
} from "@/lib/loomLotTelemetry";

export interface MaquetaLot {
  id: string;
  rawId: string;
  area: string;
  areaNumeric: number | null;
  location: string;
  status: string;
  statusRaw: string;
  totalPrice: string;
  downPayment: string;
  financing: string;
  finalPayment: string;
  pricePerM2?: string;
  separation?: string;
}

interface Unified3DLot {
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

interface Landscape3DData {
  palms: [number, number, number, number][];
  trees: [number, number, number, number][];
}

interface CameraPreset {
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

const CAMERA_PRESETS: CameraPreset[] = [
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

// ============================================================================
// GENERADOR DE ETIQUETAS PÍLDORA 3D FLOTANTES (ESTILO IMAGEN DE REFERENCIA)
// Crea badges oscuros translúcidos con borde dorado/blanco ('Alma Beach Club', 'B-22 • 252')
// ============================================================================
function createFloatingPillSprite(
  text: string,
  accentColor: string = "#EBD9AB",
  scaleW: number = 1.35,
  scaleH: number = 0.34
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;

  ctx.clearRect(0, 0, 512, 128);

  // Fondo píldora cristal oscuro
  const padX = 24;
  const padY = 20;
  const w = 512 - padX * 2;
  const h = 128 - padY * 2;
  const r = h / 2;

  ctx.beginPath();
  ctx.roundRect(padX, padY, w, h, r);
  ctx.fillStyle = "rgba(10, 14, 12, 0.84)";
  ctx.fill();

  ctx.lineWidth = 4;
  ctx.strokeStyle = accentColor;
  ctx.stroke();

  // Texto editorial limpio
  ctx.font = "bold 32px sans-serif";
  ctx.fillStyle = "#F8FAFC";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 66, w - 40);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scaleW, scaleH, 1);
  sprite.renderOrder = 20;
  return sprite;
}

const STAGE_CAMERA_TARGETS: Record<
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

const WORLD_W = 38.4;
const WORLD_D = 21.6;

function svgToWorld(svgX: number, svgY: number): [number, number] {
  const wx = (svgX / 3840 - 0.5) * WORLD_W;
  const wz = (svgY / 2160 - 0.5) * WORLD_D;
  return [wx, wz];
}

function glslSmoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Calcula la elevación exacta del terreno 3D (idéntica a TERRAIN_WATER_VERTEX_GLSL)
// para impedir físicamente que la cámara o el pivote atraviesen el suelo o las colinas del Oeste
function getTerrainElevationAt(wx: number, wz: number): number {
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

// ============================================================================
// GENERADOR DE RUIDO FBM ORGÁNICO (PERLIN/VALUE NOISE 512x512 CONTINUO Y SIN COSTURAS)
// Evita por completo las rayas artificiales y genera ondas de agua hiperrealistas
// ============================================================================
function createOrganicWaterAndGrassTexture(): THREE.DataTexture {
  const size = 512;
  const data = new Uint8Array(size * size * 4);

  // Hash 2D periódico (Tileable en bordes 0..period)
  const hash2 = (ix: number, iy: number, period: number) => {
    const px = ((ix % period) + period) % period;
    const py = ((iy % period) + period) % period;
    const h = Math.sin(px * 127.1 + py * 311.7) * 43758.5453123;
    return h - Math.floor(h);
  };

  // Value Noise suave y periódico
  const tileNoise = (u: number, v: number, freq: number) => {
    const x = u * freq;
    const y = v * freq;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3.0 - 2.0 * fx);
    const uy = fy * fy * (3.0 - 2.0 * fy);

    const a = hash2(ix, iy, freq);
    const b = hash2(ix + 1, iy, freq);
    const c = hash2(ix, iy + 1, freq);
    const d = hash2(ix + 1, iy + 1, freq);

    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };

  // FBM de 4 octavas para altura de agua orgánica
  const fbm = (u: number, v: number) => {
    let val = 0;
    val += tileNoise(u, v, 6) * 0.5;
    val += tileNoise(u, v, 14) * 0.28;
    val += tileNoise(u, v, 30) * 0.14;
    val += tileNoise(u, v, 62) * 0.08;
    return val;
  };

  const eps = 1.0 / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const u = x / size;
      const v = y / size;

      const hC = fbm(u, v);
      const hR = fbm(u + eps, v);
      const hU = fbm(u, v + eps);

      // Derivadas espaciales reales (Normales X, Y sin patrones de rejilla)
      const dx = (hR - hC) * 18.0;
      const dy = (hU - hC) * 18.0;

      // Micro-grano orgánico para grama y arena
      const grain = hash2(x, y, size);

      data[idx] = Math.floor(Math.max(0, Math.min(1, dx * 0.5 + 0.5)) * 255);
      data[idx + 1] = Math.floor(Math.max(0, Math.min(1, dy * 0.5 + 0.5)) * 255);
      data[idx + 2] = Math.floor(grain * 255);
      data[idx + 3] = Math.floor(hC * 255);
    }
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

// ============================================================================
// GENERADOR DE CORONA DE PALMERA COCOTERA REALISTA CON PENACHOS PLUMOSOS (CANVAS ALPHA)
// Reemplaza los conos tipo "Roblox" por hojas arqueadas con foliolos tropicales reales
// ============================================================================
function createPalmFrondCrownTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;
  const numFronds = 11;

  for (let f = 0; f < numFronds; f++) {
    const baseAngle = (f / numFronds) * Math.PI * 2 + (f % 2) * 0.14;
    const frondLen = 210 + (f % 3) * 18;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(baseAngle);

    // Raquis central de la penca de palma
    ctx.strokeStyle = "#3f6a26";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(frondLen * 0.5, 10, frondLen, 4);
    ctx.stroke();

    // Foliolos individuales (hojas plumosas a ambos lados del raquis)
    const leaflets = 34;
    for (let l = 3; l < leaflets; l++) {
      const t = l / leaflets;
      const rx = t * frondLen;
      const ry = 4 * t * (1 - t) * 10;
      const leafLen = Math.sin(Math.pow(t, 0.75) * Math.PI) * 52 + 8;

      const greenShade = Math.floor(95 + t * 48 + ((f * 7 + l * 3) % 18));
      const redShade = Math.floor(greenShade * 0.56);
      ctx.strokeStyle = `rgb(${redShade}, ${greenShade}, 34)`;
      ctx.lineWidth = 2.2 * (1.15 - t * 0.5);

      // Foliolo izquierdo y derecho arqueados hacia atrás
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.quadraticCurveTo(
          rx + leafLen * 0.35,
          ry + side * leafLen * 0.65,
          rx - leafLen * 0.15,
          ry + side * leafLen
        );
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // Coco central y corazón de la corona
  const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 26);
  grad.addColorStop(0, "#3b2816");
  grad.addColorStop(0.5, "#2f521e");
  grad.addColorStop(1, "rgba(47,82,30,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// Geometría 3D de Corona de Palmera con pencas arqueadas en domo (3 capas cruzadas en 3D)
function createRealisticPalmCrownGeometry(): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(0.68, 0.68, 6, 6);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    // Las pencas suben ligeramente al salir del tronco y caen con gracia hacia las puntas
    const arch = Math.sin(Math.min(1, r / 0.34) * Math.PI * 0.85) * 0.06 - Math.pow(r / 0.34, 2.1) * 0.14;
    pos.setY(i, arch);
  }
  geo.computeVertexNormals();
  return geo;
}

// ============================================================================
// SHADER GLSL FOTORREALISTA DE AGUA COSTERA + REFRACCIÓN DEL ARRECIFE REAL
// Conserva el arrecife, bancos de arena y espuma real de la fotografía aérea,
// animándolos con refracción óptica FBM, espuma orgánica y destellos de sol reales.
// ============================================================================
function createPerforatedLatticeTexture(isSunset: boolean = false): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d")!;

  // Base de madera teca natural cálida con gradiente vertical de iluminación solar
  const baseGrad = ctx.createLinearGradient(0, 0, 0, 768);
  baseGrad.addColorStop(0, "#9c7450");
  baseGrad.addColorStop(0.5, "#8a6341");
  baseGrad.addColorStop(1, "#755132");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 768);

  // Vetas finas de madera teca
  for (let x = 0; x < 512; x += 3) {
    ctx.fillStyle = x % 6 === 0 ? "rgba(55, 34, 18, 0.14)" : "rgba(225, 185, 140, 0.09)";
    ctx.fillRect(x, 0, 1.5, 768);
  }

  // Marco perimetral y travesaños arquitectónicos en bronce negro (#241b16)
  ctx.fillStyle = "#241b16";
  ctx.fillRect(0, 0, 512, 22);
  ctx.fillRect(0, 746, 512, 22);
  ctx.fillRect(0, 0, 22, 768);
  ctx.fillRect(490, 0, 22, 768);
  // Entrepiso Nivel 2 / Nivel 3 y travesaños de baranda (alzado_01, galeria_33)
  ctx.fillRect(0, 372, 512, 24);
  ctx.fillRect(0, 248, 512, 10);
  ctx.fillRect(0, 620, 512, 10);
  // Sub-montante vertical central sutil
  ctx.fillRect(252, 0, 8, 768);

  // Rejilla de perforaciones cuadradas con profundidad 3D y contraluz cálido interior
  const cols = 16;
  const rows = 26;
  const padX = 28;
  const padY = 28;
  const cellW = (512 - padX * 2) / cols;
  const cellH = (768 - padY * 2) / rows;

  for (let r = 0; r < rows; r++) {
    const cy = padY + r * cellH;
    if (Math.abs(cy - 378) < 18 || Math.abs(cy - 248) < 10 || Math.abs(cy - 620) < 10) continue;
    for (let c = 0; c < cols; c++) {
      const cx = padX + c * cellW;
      if (Math.abs(cx - 252) < 8) continue;
      // Contraluz cálido en habitaciones detrás de la celosía
      const isLit = (r > 3 && r < 10 && c > 2 && c < 13) || (r > 15 && r < 22 && c > 3 && c < 12);
      ctx.fillStyle = isLit
        ? isSunset
          ? "#b87a3d"
          : "#4a3728"
        : "#1e140e";
      ctx.fillRect(cx + 3, cy + 3, cellW - 6, cellH - 6);
      // Bisel inferior e izquierdo iluminado por el sol en el espesor de la madera
      ctx.fillStyle = "#c49a70";
      ctx.fillRect(cx + 3, cy + cellH - 5, cellW - 6, 2);
      ctx.fillRect(cx + cellW - 5, cy + 3, 2, cellH - 6);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createLimestoneFacadeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Gradiente sutil de oclusión ambiental (AO) y caliza coralina arena (#e3d9ca -> #d6cab8)
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#d8ccb9");
  grad.addColorStop(0.08, "#e5dccd");
  grad.addColorStop(0.5, "#e0d6c6");
  grad.addColorStop(0.92, "#dcd1c0");
  grad.addColorStop(1, "#c9bba7");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Grano mineral travertino / piedra coralina apomazada
  for (let i = 0; i < 3800; i++) {
    const x = (i * 73) % 512;
    const y = (i * 137) % 512;
    const w = 2 + (i % 6);
    const h = 1 + (i % 3);
    ctx.fillStyle = i % 2 === 0 ? "rgba(255, 250, 242, 0.14)" : "rgba(135, 118, 96, 0.11)";
    ctx.fillRect(x, y, w, h);
  }

  // Dilataciones arquitectónicas horizontales suaves
  ctx.fillStyle = "rgba(110, 95, 78, 0.18)";
  ctx.fillRect(0, 170, 512, 2);
  ctx.fillRect(0, 340, 512, 2);
  ctx.fillStyle = "rgba(255, 252, 245, 0.22)";
  ctx.fillRect(0, 172, 512, 1.5);
  ctx.fillRect(0, 342, 512, 1.5);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createArchitecturalWindowTexture(isSunset: boolean): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Profundidad interior del espacio arquitectónico con plafón iluminado cálido
  const intGrad = ctx.createLinearGradient(0, 0, 0, 256);
  if (isSunset) {
    intGrad.addColorStop(0, "#ffd88a");
    intGrad.addColorStop(0.35, "#d4944e");
    intGrad.addColorStop(0.8, "#5c4332");
    intGrad.addColorStop(1, "#2b211a");
  } else {
    intGrad.addColorStop(0, "#9ab3bd");
    intGrad.addColorStop(0.25, "#5d737d");
    intGrad.addColorStop(0.65, "#36444a");
    intGrad.addColorStop(1, "#1e2629");
  }
  ctx.fillStyle = intGrad;
  ctx.fillRect(0, 0, 512, 256);

  // Cortinas interiores de velo de lino marfil en los extremos de cada vano
  const drawCurtain = (xStart: number, width: number) => {
    const cGrad = ctx.createLinearGradient(xStart, 0, xStart + width, 0);
    cGrad.addColorStop(0, "rgba(242, 235, 222, 0.65)");
    cGrad.addColorStop(0.5, "rgba(230, 220, 205, 0.42)");
    cGrad.addColorStop(1, "rgba(242, 235, 222, 0.08)");
    ctx.fillStyle = cGrad;
    ctx.fillRect(xStart, 10, width, 236);
    for (let f = xStart; f < xStart + width; f += 6) {
      ctx.fillStyle = "rgba(160, 145, 125, 0.16)";
      ctx.fillRect(f, 10, 2, 236);
    }
  };
  drawCurtain(14, 58);
  drawCurtain(440, 58);

  // Reflejos diagonales de cielo caribeño sobre el cristal templado
  ctx.fillStyle = isSunset ? "rgba(255, 220, 165, 0.18)" : "rgba(215, 240, 252, 0.22)";
  ctx.beginPath();
  ctx.moveTo(60, 256);
  ctx.lineTo(190, 0);
  ctx.lineTo(265, 0);
  ctx.lineTo(135, 256);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(295, 256);
  ctx.lineTo(415, 0);
  ctx.lineTo(450, 0);
  ctx.lineTo(330, 256);
  ctx.closePath();
  ctx.fill();

  // Perfilería de aluminio bronce negro (marco perimetral y 3 hojas corredizas)
  ctx.fillStyle = "#1f1814";
  ctx.fillRect(0, 0, 512, 12);
  ctx.fillRect(0, 244, 512, 12);
  ctx.fillRect(0, 0, 12, 256);
  ctx.fillRect(500, 0, 12, 256);
  ctx.fillRect(168, 0, 8, 256);
  ctx.fillRect(336, 0, 8, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createPoolWaterCausticsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  // Gradiente turquesa piedra Bali (profundidad en bordes + centro iluminado)
  const rad = ctx.createRadialGradient(128, 128, 18, 128, 128, 165);
  rad.addColorStop(0, "#38e2d0");
  rad.addColorStop(0.55, "#14b8a6");
  rad.addColorStop(1, "#0d7a73");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 256, 256);

  // Mosaico vítreo sutil en el fondo de la piscina
  ctx.strokeStyle = "rgba(10, 80, 78, 0.14)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 256; i += 8) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 256);
    ctx.moveTo(0, i);
    ctx.lineTo(256, i);
    ctx.stroke();
  }

  // Redes cáusticas de sol sobre el agua
  ctx.strokeStyle = "rgba(215, 255, 252, 0.34)";
  ctx.lineWidth = 1.6;
  for (let w = 0; w < 14; w++) {
    ctx.beginPath();
    const y0 = 12 + w * 18;
    for (let x = 0; x <= 256; x += 8) {
      const y = y0 + Math.sin(x * 0.07 + w * 1.3) * 7 + Math.cos(x * 0.11 - w) * 4;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Borde interno iluminado de espejo de agua
  ctx.strokeStyle = "rgba(235, 255, 254, 0.55)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 252, 252);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createTropicalFoliageTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#1f3818";
  ctx.fillRect(0, 0, 256, 256);

  const palette = ["#1a3013", "#28471e", "#365e29", "#487836", "#5e9148", "#74a85b"];
  for (let i = 0; i < 520; i++) {
    const cx = (i * 53) % 256;
    const cy = (i * 97) % 256;
    const rx = 5 + (i % 7);
    const ry = 3 + (i % 4);
    const ang = ((i * 29) % 314) / 100;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.fillStyle = palette[i % palette.length];
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.needsUpdate = true;
  return tex;
}

function createCobblestoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#6c6a65";
  ctx.fillRect(0, 0, 256, 256);

  const rows = 16;
  const cols = 8;
  const rh = 256 / rows;
  const cw = 256 / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cw * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * cw + offset;
      const y = r * rh;
      const shade = 146 + ((r * 7 + c * 13) % 24);
      ctx.fillStyle = `rgb(${shade}, ${shade - 2}, ${shade - 6})`;
      ctx.fillRect(x + 1.5, y + 1.5, cw - 3, rh - 3);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(x + 1.5, y + 1.5, cw - 3, 1.5);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.needsUpdate = true;
  return tex;
}

function createTeakDeckTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#9c7a54";
  ctx.fillRect(0, 0, 256, 256);

  const planks = 20;
  const ph = 256 / planks;
  for (let p = 0; p < planks; p++) {
    const y = p * ph;
    const delta = ((p * 11) % 16) - 8;
    ctx.fillStyle = `rgb(${160 + delta}, ${124 + delta}, ${86 + delta})`;
    ctx.fillRect(0, y, 256, ph - 1.5);
    ctx.fillStyle = "rgba(255, 235, 205, 0.12)";
    ctx.fillRect(0, y, 256, 1.2);
    ctx.fillStyle = "#523b24";
    ctx.fillRect(0, y + ph - 1.5, 256, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

interface CanonicalVillaMeshSpec {
  geo: THREE.BufferGeometry;
  mat: THREE.Material | THREE.Material[];
  castShadow: boolean;
}

interface NormalizedBoxSpec {
  sx: number;
  sy: number;
  sz: number;
  px: number;
  py: number;
  pz: number;
  rotY?: number;
  rotZ?: number;
}

function mergeNormalizedBoxes(specs: NormalizedBoxSpec[]): THREE.BufferGeometry {
  const baseBox = new THREE.BoxGeometry(1, 1, 1);
  const basePos = baseBox.attributes.position;
  const baseNorm = baseBox.attributes.normal;
  const baseUv = baseBox.attributes.uv;
  const baseIdx = baseBox.index!;

  const vCount = basePos.count;
  const iCount = baseIdx.count;
  const totalV = vCount * specs.length;
  const totalI = iCount * specs.length;

  const positions = new Float32Array(totalV * 3);
  const normals = new Float32Array(totalV * 3);
  const uvs = new Float32Array(totalV * 2);
  const indices = new Uint16Array(totalI);

  const mat4 = new THREE.Matrix4();
  const normMat = new THREE.Matrix3();
  const posVec = new THREE.Vector3();
  const normVec = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const scaleVec = new THREE.Vector3();
  const transVec = new THREE.Vector3();

  specs.forEach((s, bIdx) => {
    euler.set(0, s.rotY || 0, s.rotZ || 0);
    quat.setFromEuler(euler);
    transVec.set(s.px, s.py, s.pz);
    scaleVec.set(s.sx, s.sy, s.sz);
    mat4.compose(transVec, quat, scaleVec);
    normMat.getNormalMatrix(mat4);

    const vOffset = bIdx * vCount;
    for (let i = 0; i < vCount; i++) {
      posVec.fromBufferAttribute(basePos, i).applyMatrix4(mat4);
      positions[(vOffset + i) * 3] = posVec.x;
      positions[(vOffset + i) * 3 + 1] = posVec.y;
      positions[(vOffset + i) * 3 + 2] = posVec.z;

      normVec.fromBufferAttribute(baseNorm, i).applyMatrix3(normMat).normalize();
      normals[(vOffset + i) * 3] = normVec.x;
      normals[(vOffset + i) * 3 + 1] = normVec.y;
      normals[(vOffset + i) * 3 + 2] = normVec.z;

      uvs[(vOffset + i) * 2] = baseUv.getX(i);
      uvs[(vOffset + i) * 2 + 1] = baseUv.getY(i);
    }

    const iOffset = bIdx * iCount;
    for (let i = 0; i < iCount; i++) {
      indices[iOffset + i] = baseIdx.getX(i) + vOffset;
    }
  });

  baseBox.dispose();
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  merged.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  // Preservar los 6 grupos de caras (+X, -X, +Y Techo, -Y Base, +Z Der, -Z Izq)
  // indispensable en Three.js para que se rendericen los materiales multi-cara V-Ray (Material[])
  for (let bIdx = 0; bIdx < specs.length; bIdx++) {
    const iOffset = bIdx * iCount;
    for (let f = 0; f < 6; f++) {
      merged.addGroup(iOffset + f * 6, 6, f);
    }
  }
  return merged;
}

// ============================================================================
// CONSOLIDADOR DE GEOMETRÍAS POR MATERIAL ÚNICO (OPTIMIZACIÓN 60 FPS)
// Convierte cajas multi-material (6 draw calls por caja) en mallas de 1 solo
// material para renderizar 145-318 villas con ~24 InstancedMesh en total
// ============================================================================
function extractGeometrySlice(
  geo: THREE.BufferGeometry,
  indexStart: number,
  indexCount: number
): THREE.BufferGeometry {
  const posAttr = geo.attributes.position;
  const normAttr = geo.attributes.normal;
  const uvAttr = geo.attributes.uv;
  const idxAttr = geo.index;

  const positions = new Float32Array(indexCount * 3);
  const normals = new Float32Array(indexCount * 3);
  const uvs = new Float32Array(indexCount * 2);
  const indices = new Uint16Array(indexCount);

  for (let i = 0; i < indexCount; i++) {
    const vIdx = idxAttr ? idxAttr.getX(indexStart + i) : indexStart + i;
    positions[i * 3] = posAttr.getX(vIdx);
    positions[i * 3 + 1] = posAttr.getY(vIdx);
    positions[i * 3 + 2] = posAttr.getZ(vIdx);
    if (normAttr) {
      normals[i * 3] = normAttr.getX(vIdx);
      normals[i * 3 + 1] = normAttr.getY(vIdx);
      normals[i * 3 + 2] = normAttr.getZ(vIdx);
    }
    if (uvAttr) {
      uvs[i * 2] = uvAttr.getX(vIdx);
      uvs[i * 2 + 1] = uvAttr.getY(vIdx);
    }
    indices[i] = i;
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  out.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  out.setIndex(new THREE.BufferAttribute(indices, 1));
  return out;
}

function mergeSimpleBufferGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
  if (geos.length === 1) return geos[0];
  let totalV = 0;
  let totalI = 0;
  const hasColor = Boolean(geos[0]?.attributes.color);
  const hasUv = Boolean(geos[0]?.attributes.uv);

  for (const g of geos) {
    const v = g.attributes.position.count;
    totalV += v;
    totalI += g.index ? g.index.count : v;
  }

  const positions = new Float32Array(totalV * 3);
  const normals = new Float32Array(totalV * 3);
  const uvs = hasUv ? new Float32Array(totalV * 2) : null;
  const colors = hasColor ? new Float32Array(totalV * 3) : null;
  const indices = totalV > 65535 ? new Uint32Array(totalI) : new Uint16Array(totalI);

  let vOffset = 0;
  let iOffset = 0;

  for (const g of geos) {
    const pos = g.attributes.position;
    const norm = g.attributes.normal;
    const uv = g.attributes.uv;
    const col = g.attributes.color;
    const vCount = pos.count;

    for (let i = 0; i < vCount; i++) {
      positions[(vOffset + i) * 3] = pos.getX(i);
      positions[(vOffset + i) * 3 + 1] = pos.getY(i);
      positions[(vOffset + i) * 3 + 2] = pos.getZ(i);
      if (norm) {
        normals[(vOffset + i) * 3] = norm.getX(i);
        normals[(vOffset + i) * 3 + 1] = norm.getY(i);
        normals[(vOffset + i) * 3 + 2] = norm.getZ(i);
      }
      if (uvs && uv) {
        uvs[(vOffset + i) * 2] = uv.getX(i);
        uvs[(vOffset + i) * 2 + 1] = uv.getY(i);
      }
      if (colors && col) {
        colors[(vOffset + i) * 3] = col.getX(i);
        colors[(vOffset + i) * 3 + 1] = col.getY(i);
        colors[(vOffset + i) * 3 + 2] = col.getZ(i);
      }
    }

    if (g.index) {
      const idx = g.index;
      for (let i = 0; i < idx.count; i++) {
        indices[iOffset + i] = idx.getX(i) + vOffset;
      }
      iOffset += idx.count;
    } else {
      for (let i = 0; i < vCount; i++) {
        indices[iOffset + i] = vOffset + i;
      }
      iOffset += vCount;
    }
    vOffset += vCount;
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  if (uvs) merged.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  if (colors) merged.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  return merged;
}

function consolidateCanonicalSpecsByMaterial(rawSpecs: CanonicalVillaMeshSpec[]): CanonicalVillaMeshSpec[] {
  const buckets = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; castShadow: boolean }>();

  const addSlice = (mat: THREE.Material, geo: THREE.BufferGeometry, castShadow: boolean) => {
    let b = buckets.get(mat);
    if (!b) {
      b = { geos: [], castShadow: false };
      buckets.set(mat, b);
    }
    b.geos.push(geo);
    if (castShadow) b.castShadow = true;
  };

  for (const spec of rawSpecs) {
    if (Array.isArray(spec.mat)) {
      const groups = spec.geo.groups;
      for (const grp of groups) {
        const faceMat = spec.mat[grp.materialIndex ?? 0];
        if (!faceMat) continue;
        const sliceGeo = extractGeometrySlice(spec.geo, grp.start, grp.count);
        addSlice(faceMat, sliceGeo, spec.castShadow);
      }
      spec.geo.dispose();
    } else {
      const idxCount = spec.geo.index ? spec.geo.index.count : spec.geo.attributes.position.count;
      const sliceGeo = extractGeometrySlice(spec.geo, 0, idxCount);
      addSlice(spec.mat, sliceGeo, spec.castShadow);
      spec.geo.dispose();
    }
  }

  const consolidated: CanonicalVillaMeshSpec[] = [];
  buckets.forEach((b, mat) => {
    const mergedGeo = mergeSimpleBufferGeometries(b.geos);
    if (b.geos.length > 1) {
      b.geos.forEach((g) => g.dispose());
    }
    consolidated.push({
      geo: mergedGeo,
      mat,
      castShadow: b.castShadow,
    });
  });

  return consolidated;
}

// ============================================================================
// GENERADOR DE ÁRBOL TROPICAL ESCULPIDO MULTI-COPA (MAQUETA ARQUITECTÓNICA)
// Reemplaza las esferas rayadas por un follaje orgánico de 6 cúmulos con
// oclusión ambiental por vértice (Vertex Colors) sin costuras ni rayas UV
// ============================================================================
function createSculptedTropicalTreeGeometries(): {
  crownGeo: THREE.BufferGeometry;
  trunkGeo: THREE.BufferGeometry;
} {
  const puffs: { x: number; y: number; z: number; rx: number; ry: number; rz: number; tint: number }[] = [
    { x: 0.0, y: 0.25, z: 0.0, rx: 0.145, ry: 0.105, rz: 0.14, tint: 1.0 },
    { x: -0.075, y: 0.215, z: 0.045, rx: 0.105, ry: 0.082, rz: 0.102, tint: 0.92 },
    { x: 0.082, y: 0.22, z: -0.038, rx: 0.108, ry: 0.084, rz: 0.1, tint: 0.96 },
    { x: 0.025, y: 0.205, z: 0.082, rx: 0.095, ry: 0.075, rz: 0.095, tint: 0.88 },
    { x: -0.035, y: 0.21, z: -0.078, rx: 0.098, ry: 0.076, rz: 0.092, tint: 0.9 },
    { x: 0.012, y: 0.295, z: -0.01, rx: 0.102, ry: 0.072, rz: 0.098, tint: 1.08 },
  ];

  const puffGeos: THREE.BufferGeometry[] = [];
  const cBottom = new THREE.Color("#1f3618");
  const cMid = new THREE.Color("#3b5e2b");
  const cTop = new THREE.Color("#5a823f");
  const tmpCol = new THREE.Color();

  puffs.forEach((p, pIdx) => {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);

      const bump =
        1.0 +
        0.11 * Math.sin(vx * 5.2 + pIdx * 1.7) * Math.cos(vz * 4.8 - vy * 3.5) +
        0.06 * Math.cos(vy * 6.1 + vx * 3.9);

      const fx = vx * p.rx * bump + p.x;
      const fy = vy * p.ry * bump + p.y;
      const fz = vz * p.rz * bump + p.z;
      pos.setXYZ(i, fx, fy, fz);

      const hNorm = Math.max(0, Math.min(1, (vy + 1.0) * 0.5));
      if (hNorm < 0.5) {
        tmpCol.lerpColors(cBottom, cMid, hNorm * 2.0);
      } else {
        tmpCol.lerpColors(cMid, cTop, (hNorm - 0.5) * 2.0);
      }
      const leafVar = 0.94 + 0.12 * Math.sin(vx * 9.0 + vz * 7.0 + pIdx);
      colors[i * 3] = Math.min(1, tmpCol.r * p.tint * leafVar);
      colors[i * 3 + 1] = Math.min(1, tmpCol.g * p.tint * leafVar);
      colors[i * 3 + 2] = Math.min(1, tmpCol.b * p.tint * leafVar);
    }

    g.computeVertexNormals();
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    puffGeos.push(g);
  });

  const crownGeo = mergeSimpleBufferGeometries(puffGeos);
  puffGeos.forEach((g) => g.dispose());

  const mainTrunk = new THREE.CylinderGeometry(0.012, 0.024, 0.19, 6);
  mainTrunk.translate(0, 0.095, 0);

  const branchL = new THREE.CylinderGeometry(0.007, 0.012, 0.09, 5);
  branchL.rotateZ(0.52);
  branchL.translate(-0.025, 0.165, 0.01);

  const branchR = new THREE.CylinderGeometry(0.007, 0.012, 0.085, 5);
  branchR.rotateZ(-0.48);
  branchR.rotateY(0.9);
  branchR.translate(0.022, 0.16, -0.014);

  const trunkGeo = mergeSimpleBufferGeometries([mainTrunk, branchL, branchR]);
  mainTrunk.dispose();
  branchL.dispose();
  branchR.dispose();

  return { crownGeo, trunkGeo };
}

interface VillaReplicaMaterials {
  limestoneStuccoMat: THREE.MeshStandardMaterial;
  limestoneWarmMat: THREE.MeshStandardMaterial;
  perforatedLatticeMat: THREE.MeshStandardMaterial;
  cobblestoneMat: THREE.MeshStandardMaterial;
  teakDeckMat: THREE.MeshStandardMaterial;
  teakSlatsMat: THREE.MeshStandardMaterial;
  darkBronzeMat: THREE.MeshStandardMaterial;
  glassWindowMat: THREE.MeshStandardMaterial;
  balconyGlassMat: THREE.MeshStandardMaterial;
  poolWaterMat: THREE.MeshStandardMaterial;
  roofHedgeMat: THREE.MeshStandardMaterial;
  lawnGrassMat: THREE.MeshStandardMaterial;
  steppingStoneMat: THREE.MeshStandardMaterial;
  creamCushionMat: THREE.MeshStandardMaterial;
  terracottaPillowMat: THREE.MeshStandardMaterial;
  carBodyMat: THREE.MeshStandardMaterial;
  carGlassMat: THREE.MeshStandardMaterial;
  palmTrunkMat: THREE.MeshStandardMaterial;
  palmFrondMat: THREE.MeshStandardMaterial;
  palmCrownTexMat: THREE.MeshStandardMaterial | null;
  palmCrownGeo: THREE.BufferGeometry;
  // Materiales Ortográficos V-Ray Reales (axonometria_01, alzado_01..04, luxury_planta_01..04)
  vrayGroundBoxMats: THREE.MeshStandardMaterial[];
  vrayFrontBlockMats: THREE.MeshStandardMaterial[];
  vrayLatticeBoxMats: THREE.MeshStandardMaterial[];
  vrayRearBlockMats: THREE.MeshStandardMaterial[];
  vrayRooftopFloorMats: THREE.MeshStandardMaterial[];
  vrayPergolaTopMats: THREE.MeshStandardMaterial[];
  vrayRearParapetMats: THREE.MeshStandardMaterial[];
  vrayGatePortalMats: THREE.MeshStandardMaterial[];
  vrayCarBoxMats: THREE.MeshStandardMaterial[];
  vrayHouseSideRightMat: THREE.MeshStandardMaterial;
  vrayHouseSideLeftMat: THREE.MeshStandardMaterial;
  vrayRearFenceMat: THREE.MeshStandardMaterial;
  carPaintPalette: THREE.MeshStandardMaterial[];
  canonicalVillaMeshes: CanonicalVillaMeshSpec[];
}

function createVillaReplicaMaterials(
  isSunset: boolean,
  palmCrownTex?: THREE.CanvasTexture | null
): VillaReplicaMaterials {
  const latticeTex = createPerforatedLatticeTexture(isSunset);
  const limestoneTex = createLimestoneFacadeTexture();
  const windowTex = createArchitecturalWindowTexture(isSunset);
  const poolTex = createPoolWaterCausticsTexture();
  const foliageTex = createTropicalFoliageTexture();
  const cobbleTex = createCobblestoneTexture();
  const deckTex = createTeakDeckTexture();
  const palmCrownGeo = createRealisticPalmCrownGeometry();

  const texLoader = new THREE.TextureLoader();
  const loadVrayTex = (url: string) => {
    const t = texLoader.load(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  };

  const tintColor = isSunset ? "#f2dec4" : "#ffffff";
  const makeVrayMat = (url: string, roughness = 0.55, metalness = 0.04, alphaTest = 0) =>
    new THREE.MeshStandardMaterial({
      map: loadVrayTex(url),
      color: tintColor,
      roughness,
      metalness,
      ...(alphaTest > 0 ? { alphaTest, transparent: true, side: THREE.DoubleSide } : {}),
    });

  const limestoneStuccoMat = new THREE.MeshStandardMaterial({
    map: limestoneTex,
    bumpMap: limestoneTex,
    bumpScale: 0.005,
    color: isSunset ? "#ebd8c0" : "#f7f3eb",
    roughness: 0.72,
    metalness: 0.04,
  });

  const limestoneWarmMat = new THREE.MeshStandardMaterial({
    map: limestoneTex,
    bumpMap: limestoneTex,
    bumpScale: 0.006,
    color: isSunset ? "#dec8ae" : "#ede4d6",
    roughness: 0.78,
    metalness: 0.03,
  });

  const darkBronzeMat = new THREE.MeshStandardMaterial({
    color: "#231c18",
    roughness: 0.32,
    metalness: 0.58,
  });

  const vrayGroundTopMat = makeVrayMat("/loom/vray/vray_ground_plan.webp?v=2", 0.62, 0.04);
  const vrayRoofSlabMat = makeVrayMat("/loom/vray/vray_roof_slab.webp", 0.68, 0.03);
  const vrayRooftopTopMat = makeVrayMat("/loom/vray/vray_rooftop_plan.webp", 0.52, 0.05);
  const vrayPergolaTopMat = makeVrayMat("/loom/vray/vray_pergola_top.webp", 0.55, 0.06);
  const vrayFrontWallMat = makeVrayMat("/loom/vray/vray_front_wall.webp", 0.5, 0.08);
  const vrayFrontSideRightMat = makeVrayMat("/loom/vray/vray_front_side_right.webp", 0.52, 0.06);
  const vrayFrontSideLeftMat = makeVrayMat("/loom/vray/vray_front_side_left.webp", 0.52, 0.06);
  const vrayLatticeFrontMat = makeVrayMat("/loom/vray/vray_lattice_front.webp", 0.46, 0.08);
  const vrayLatticeSideMat = makeVrayMat("/loom/vray/vray_lattice_side.webp", 0.46, 0.08);
  const vrayRearL1L2Mat = makeVrayMat("/loom/vray/vray_rear_l1l2.webp", 0.38, 0.14);
  const vrayRearSideRightMat = makeVrayMat("/loom/vray/vray_rear_side_right.webp", 0.5, 0.08);
  const vrayRearSideLeftMat = makeVrayMat("/loom/vray/vray_rear_side_left.webp", 0.5, 0.08);
  const vrayRearParapetMat = makeVrayMat("/loom/vray/vray_rear_parapet.webp", 0.58, 0.04);
  const vrayGatePortalMat = makeVrayMat("/loom/vray/vray_gate_portal.webp", 0.52, 0.06);
  const vrayCarTopMat = makeVrayMat("/loom/vray/vray_car_top.webp", 0.24, 0.35);
  const vrayHouseSideRightMat = makeVrayMat("/loom/vray/vray_house_side_right.webp", 0.48, 0.06, 0.35);
  const vrayHouseSideLeftMat = makeVrayMat("/loom/vray/vray_house_side_left.webp", 0.48, 0.06, 0.35);
  const vrayRearFenceMat = makeVrayMat("/loom/vray/vray_rear_fence.webp", 0.78, 0.02);
  const vrayPalmCrownMat = makeVrayMat("/loom/vray/vray_palm_crown_alpha.webp", 0.55, 0.02, 0.24);

  const carBodyWhiteMat = new THREE.MeshStandardMaterial({
    color: isSunset ? "#efe2d0" : "#f5f7fa",
    roughness: 0.2,
    metalness: 0.35,
  });

  const carPaintColors = [
    "#f5f7fa", // Blanco Perla (Pearl White)
    "#cbd5e1", // Plata Líquida (Liquid Silver Metallic)
    "#475569", // Gris Grafito Titanio (Titanium Gunmetal)
    "#1e3a5f", // Azul Zafiro Bentley (Sapphire Blue Metallic)
    "#d6cbb5", // Champagne Arena (Champagne Sand Metallic)
    "#1e232b", // Negro Obsidiana (Obsidian Black Metallic)
    "#164e35", // Verde Esmeralda (British Racing Emerald)
    "#8f1d25", // Rojo Carmesí GT (Crimson GT Metallic)
  ];
  const carPaintPalette = carPaintColors.map(
    (hex) =>
      new THREE.MeshStandardMaterial({
        color: hex,
        roughness: 0.16,
        metalness: 0.42,
        envMapIntensity: 1.35,
      })
  );

  // Orden de caras en BoxGeometry: [0: +X (Rear), 1: -X (Front), 2: +Y (Top), 3: -Y (Bottom), 4: +Z (Right), 5: -Z (Left)]
  const vrayGroundBoxMats = [
    limestoneWarmMat,
    limestoneWarmMat,
    vrayGroundTopMat,
    limestoneWarmMat,
    limestoneWarmMat,
    limestoneWarmMat,
  ];

  const vrayFrontBlockMats = [
    vrayFrontWallMat,
    vrayFrontWallMat,
    vrayRoofSlabMat,
    limestoneStuccoMat,
    vrayFrontSideRightMat,
    vrayFrontSideLeftMat,
  ];

  const vrayLatticeBoxMats = [
    vrayLatticeFrontMat,
    vrayLatticeFrontMat,
    vrayRoofSlabMat,
    limestoneStuccoMat,
    vrayLatticeSideMat,
    vrayLatticeSideMat,
  ];

  const vrayRearBlockMats = [
    vrayRearL1L2Mat,
    vrayRearL1L2Mat,
    vrayRooftopTopMat,
    limestoneStuccoMat,
    vrayRearSideRightMat,
    vrayRearSideLeftMat,
  ];

  const vrayRooftopFloorMats = [
    limestoneStuccoMat,
    limestoneStuccoMat,
    vrayRooftopTopMat,
    limestoneStuccoMat,
    limestoneStuccoMat,
    limestoneStuccoMat,
  ];

  const vrayPergolaTopMats = [
    darkBronzeMat,
    darkBronzeMat,
    vrayPergolaTopMat,
    vrayPergolaTopMat,
    darkBronzeMat,
    darkBronzeMat,
  ];

  const vrayRearParapetMats = [
    vrayRearParapetMat,
    vrayRearParapetMat,
    limestoneStuccoMat,
    limestoneStuccoMat,
    vrayRearParapetMat,
    vrayRearParapetMat,
  ];

  const vrayGatePortalMats = [
    vrayGatePortalMat,
    vrayGatePortalMat,
    limestoneStuccoMat,
    limestoneStuccoMat,
    limestoneStuccoMat,
    limestoneStuccoMat,
  ];

  const vrayCarBoxMats = [
    carBodyWhiteMat,
    carBodyWhiteMat,
    vrayCarTopMat,
    carBodyWhiteMat,
    carBodyWhiteMat,
    carBodyWhiteMat,
  ];

  return {
    limestoneStuccoMat,
    limestoneWarmMat,
    perforatedLatticeMat: new THREE.MeshStandardMaterial({
      map: latticeTex,
      bumpMap: latticeTex,
      bumpScale: 0.01,
      color: isSunset ? "#f2d6b3" : "#ffffff",
      roughness: 0.46,
      metalness: 0.08,
    }),
    cobblestoneMat: new THREE.MeshStandardMaterial({
      map: cobbleTex,
      bumpMap: cobbleTex,
      bumpScale: 0.008,
      color: isSunset ? "#dfd0be" : "#ffffff",
      roughness: 0.85,
      metalness: 0.02,
    }),
    teakDeckMat: new THREE.MeshStandardMaterial({
      map: deckTex,
      bumpMap: deckTex,
      bumpScale: 0.006,
      color: isSunset ? "#ebd0b0" : "#ffffff",
      roughness: 0.56,
      metalness: 0.06,
    }),
    teakSlatsMat: new THREE.MeshStandardMaterial({
      map: deckTex,
      color: isSunset ? "#b5835a" : "#c49468",
      roughness: 0.48,
      metalness: 0.08,
    }),
    darkBronzeMat,
    glassWindowMat: new THREE.MeshStandardMaterial({
      map: windowTex,
      emissive: isSunset ? "#f59e0b" : "#fef08a",
      emissiveMap: windowTex,
      emissiveIntensity: isSunset ? 0.55 : 0.18,
      roughness: 0.08,
      metalness: 0.45,
    }),
    balconyGlassMat: new THREE.MeshStandardMaterial({
      color: "#bae6fd",
      transparent: true,
      opacity: 0.46,
      roughness: 0.05,
      metalness: 0.45,
    }),
    poolWaterMat: new THREE.MeshStandardMaterial({
      map: poolTex,
      emissive: "#06b6d4",
      emissiveMap: poolTex,
      emissiveIntensity: isSunset ? 0.5 : 0.32,
      roughness: 0.05,
      metalness: 0.18,
    }),
    roofHedgeMat: new THREE.MeshStandardMaterial({
      map: foliageTex,
      bumpMap: foliageTex,
      bumpScale: 0.012,
      color: isSunset ? "#d9c49e" : "#ffffff",
      roughness: 0.82,
    }),
    lawnGrassMat: new THREE.MeshStandardMaterial({
      map: foliageTex,
      color: isSunset ? "#789658" : "#8cb068",
      roughness: 0.9,
    }),
    steppingStoneMat: new THREE.MeshStandardMaterial({
      map: limestoneTex,
      color: isSunset ? "#bfb6a8" : "#ccc6bc",
      roughness: 0.8,
    }),
    creamCushionMat: new THREE.MeshStandardMaterial({
      color: isSunset ? "#ede0ce" : "#f7f3eb",
      roughness: 0.68,
    }),
    terracottaPillowMat: new THREE.MeshStandardMaterial({
      color: "#b85d38",
      roughness: 0.72,
    }),
    carBodyMat: carBodyWhiteMat,
    carGlassMat: new THREE.MeshStandardMaterial({
      color: "#1b242c",
      roughness: 0.08,
      metalness: 0.82,
    }),
    palmTrunkMat: new THREE.MeshStandardMaterial({
      color: "#6e553e",
      roughness: 0.85,
    }),
    palmFrondMat: new THREE.MeshStandardMaterial({
      color: isSunset ? "#3f6630" : "#497538",
      roughness: 0.65,
      side: THREE.DoubleSide,
    }),
    palmCrownTexMat: vrayPalmCrownMat || (palmCrownTex
      ? new THREE.MeshStandardMaterial({
          map: palmCrownTex,
          alphaTest: 0.26,
          transparent: true,
          side: THREE.DoubleSide,
          roughness: 0.58,
          color: isSunset ? "#dfc8a2" : "#ffffff",
        })
      : null),
    palmCrownGeo,
    vrayGroundBoxMats,
    vrayFrontBlockMats,
    vrayLatticeBoxMats,
    vrayRearBlockMats,
    vrayRooftopFloorMats,
    vrayPergolaTopMats,
    vrayRearParapetMats,
    vrayGatePortalMats,
    vrayCarBoxMats,
    vrayHouseSideRightMat,
    vrayHouseSideLeftMat,
    vrayRearFenceMat,
    carPaintPalette,
    canonicalVillaMeshes: [],
  };
}

function getOrBuildCanonicalVillaMeshes(mats: VillaReplicaMaterials): CanonicalVillaMeshSpec[] {
  if (mats.canonicalVillaMeshes.length > 0) return mats.canonicalVillaMeshes;

  // Espacio Canónico Normalizado: L = 1, H = 1, W = 1 (se escala por [L, H, W] en cada lote)
  const zH = -0.016;
  const wH = 0.653;
  const zP = 0.395;
  const jacX = 0.275;
  const jacZ = zH + wH * 0.22;
  const sofaX = 0.275;
  const sofaZ = zH - wH * 0.22;
  const palmX = 0.005;
  const palmZ = zH + wH * 0.12;
  const rWallH = 0.14;
  const rWallY = 0.755;

  const singleBox = (
    sx: number,
    sy: number,
    sz: number,
    px: number,
    py: number,
    pz: number,
    mat: THREE.Material | THREE.Material[],
    castShadow: boolean
  ): CanonicalVillaMeshSpec => ({
    geo: mergeNormalizedBoxes([{ sx, sy, sz, px, py, pz }]),
    mat,
    castShadow,
  });

  const specs: CanonicalVillaMeshSpec[] = [
    // Cajas multi-material ortográficas V-Ray
    singleBox(1.0, 0.054, 1.0, 0, 0.027, 0, mats.vrayGroundBoxMats, false),
    singleBox(0.032, 0.35, 0.205, -0.222, 0.175, zP, mats.vrayGatePortalMats, false),
    singleBox(0.173, 0.99, wH, -0.1485, 0.495, zH, mats.vrayFrontBlockMats, true),
    singleBox(0.097, 0.63, wH * 0.995, -0.2835, 0.675, zH, mats.vrayLatticeBoxMats, true),
    singleBox(0.676, 1.0, 0.012, 0.006, 0.5, zH + wH * 0.502, mats.vrayHouseSideRightMat, false),
    singleBox(0.676, 1.0, 0.012, 0.006, 0.5, zH - wH * 0.502, mats.vrayHouseSideLeftMat, false),
    singleBox(0.21, 0.68, wH, 0.17, 0.34, zH, mats.vrayRearBlockMats, true),
    singleBox(0.008, 0.11, wH * 0.98, 0.332, 0.41, zH, mats.balconyGlassMat, false),
    singleBox(0.279, 0.025, wH, 0.2045, 0.685, zH, mats.vrayRooftopFloorMats, false),
    singleBox(0.267, 0.026, wH * 0.98, 0.0715, 0.975, zH, mats.vrayPergolaTopMats, true),
    singleBox(0.022, rWallH, wH, 0.333, rWallY, zH, mats.vrayRearParapetMats, false),
    singleBox(0.142, rWallH, 0.022, 0.273, rWallY, zH - wH * 0.485, mats.vrayRearParapetMats, false),
    singleBox(0.142, rWallH, 0.022, 0.273, rWallY, zH + wH * 0.485, mats.vrayRearParapetMats, false),

    // Buffers fusionados por material (reduce 27 draw calls por villa a solo 9 draw calls)
    {
      geo: mergeNormalizedBoxes([
        { sx: 0.54, sy: 0.07, sz: 0.085, px: 0.05, py: 0.035, pz: 0.435 },
        { sx: 0.082, sy: 0.085, sz: 0.88, px: 0.435, py: 0.0425, pz: 0 },
        { sx: 0.078, sy: 0.082, sz: wH * 0.34, px: jacX, py: 0.732, pz: jacZ },
      ]),
      mat: mats.poolWaterMat,
      castShadow: false,
    },
    {
      geo: mergeNormalizedBoxes([
        { sx: 0.055, sy: 0.062, sz: 0.068, px: 0.362, py: 0.07, pz: 0.08 },
        { sx: 0.055, sy: 0.062, sz: 0.068, px: 0.362, py: 0.07, pz: 0.22 },
        { sx: 0.038, sy: 0.038, sz: wH * 0.16, px: sofaX - 0.005, py: 0.71, pz: sofaZ },
      ]),
      mat: mats.teakSlatsMat,
      castShadow: false,
    },
    {
      geo: mergeNormalizedBoxes([
        { sx: 0.04, sy: 0.046, sz: 0.062, px: 0.368, py: 0.101, pz: 0.08 },
        { sx: 0.018, sy: 0.046, sz: 0.062, px: 0.344, py: 0.14, pz: 0.08, rotZ: -0.45 },
        { sx: 0.04, sy: 0.046, sz: 0.062, px: 0.368, py: 0.101, pz: 0.22 },
        { sx: 0.018, sy: 0.046, sz: 0.062, px: 0.344, py: 0.14, pz: 0.22, rotZ: -0.45 },
        { sx: 0.024, sy: 0.058, sz: wH * 0.38, px: sofaX + 0.032, py: 0.72, pz: sofaZ },
        { sx: 0.082, sy: 0.058, sz: 0.028, px: sofaX, py: 0.72, pz: sofaZ - wH * 0.17 },
        { sx: 0.082, sy: 0.058, sz: 0.028, px: sofaX, py: 0.72, pz: sofaZ + wH * 0.17 },
      ]),
      mat: mats.creamCushionMat,
      castShadow: false,
    },
    {
      geo: mergeNormalizedBoxes([
        { sx: 0.495, sy: 0.33, sz: 0.022, px: 0.012, py: 0.165, pz: -0.482 },
        { sx: 0.495, sy: 0.33, sz: 0.022, px: 0.012, py: 0.165, pz: 0.482 },
        { sx: 0.045, sy: 0.105, sz: wH * 0.38, px: 0.135, py: 0.745, pz: zH + wH * 0.14 },
        { sx: 0.095, sy: 0.075, sz: wH * 0.4, px: jacX, py: 0.728, pz: jacZ },
      ]),
      mat: mats.limestoneWarmMat,
      castShadow: false,
    },
    {
      geo: mergeNormalizedBoxes([
        { sx: 0.22, sy: 0.31, sz: 0.026, px: 0.375, py: 0.155, pz: -0.482 },
        { sx: 0.22, sy: 0.31, sz: 0.026, px: 0.375, py: 0.155, pz: 0.482 },
        { sx: 0.026, sy: 0.31, sz: 0.98, px: 0.486, py: 0.155, pz: 0 },
      ]),
      mat: mats.vrayRearFenceMat,
      castShadow: false,
    },
    {
      geo: mergeNormalizedBoxes([
        { sx: 0.075, sy: 0.035, sz: 0.22, px: -0.222, py: 0.355, pz: zP },
        { sx: 0.127, sy: 0.028, sz: wH * 0.34, px: 0.0015, py: 0.34, pz: zH - wH * 0.31 },
        { sx: 0.127, sy: 0.028, sz: wH * 0.34, px: 0.0015, py: 0.675, pz: zH - wH * 0.31 },
        { sx: 0.06, sy: 0.032, sz: wH, px: 0.305, py: 0.34, pz: zH },
      ]),
      mat: mats.limestoneStuccoMat,
      castShadow: false,
    },
    {
      geo: mergeNormalizedBoxes([
        { sx: 0.102, sy: 0.026, sz: wH + 0.011, px: -0.2835, py: 0.355, pz: zH },
        { sx: 0.022, sy: 0.028, sz: wH + 0.016, px: -0.332, py: 0.982, pz: zH },
        { sx: 0.012, sy: 0.014, sz: wH * 0.99, px: 0.332, py: 0.468, pz: zH },
        { sx: 0.267, sy: 0.03, sz: 0.018, px: 0.0715, py: 0.975, pz: zH - wH * 0.485 },
        { sx: 0.267, sy: 0.03, sz: 0.018, px: 0.0715, py: 0.975, pz: zH + wH * 0.485 },
        { sx: 0.016, sy: 0.29, sz: 0.018, px: 0.202, py: 0.83, pz: zH - wH * 0.485 },
        { sx: 0.016, sy: 0.29, sz: 0.018, px: 0.202, py: 0.83, pz: zH + wH * 0.485 },
      ]),
      mat: mats.darkBronzeMat,
      castShadow: false,
    },
    {
      geo: mergeNormalizedBoxes([
        { sx: 0.026, sy: 0.042, sz: wH * 0.96, px: -0.334, py: 0.945, pz: zH },
        { sx: 0.026, sy: 0.04, sz: wH * 0.98, px: 0.338, py: 0.81, pz: zH },
        { sx: 0.14, sy: 0.04, sz: 0.026, px: 0.273, py: 0.81, pz: zH - wH * 0.49 },
        { sx: 0.14, sy: 0.04, sz: 0.026, px: 0.273, py: 0.81, pz: zH + wH * 0.49 },
      ]),
      mat: mats.roofHedgeMat,
      castShadow: false,
    },
    {
      geo: mergeNormalizedBoxes([
        { sx: 0.018, sy: 0.58, sz: 0.018, px: palmX, py: 0.29, pz: palmZ },
        { sx: 0.015, sy: 0.6, sz: 0.015, px: palmX + 0.006, py: 0.86, pz: palmZ + 0.005, rotZ: -0.05 },
      ]),
      mat: mats.palmTrunkMat,
      castShadow: true,
    },
  ];

  const consolidated = consolidateCanonicalSpecsByMaterial(specs);
  mats.canonicalVillaMeshes = consolidated;
  return consolidated;
}

// ============================================================================
// RÉPLICA ARQUITECTÓNICA 3D CON PROYECCIÓN ORTOGRÁFICA V-RAY 1:1 (GEOMETRÍA CANÓNICA FUSIONADA)
// Basada directamente en luxury_planta_01..04.webp, alzado_01..04.webp y axonometria_01.webp
// Escala real V-Ray: Lote 23.64m x 11.10m, Altura 8.47m (H / L = 0.3583)
// ============================================================================
function buildLoomVillaReplica3D(
  villaGrp: THREE.Group,
  L: number,
  W: number,
  mats: VillaReplicaMaterials,
  unitBox: THREE.BoxGeometry,
  lotIndex: number = 0,
  carTemplates: THREE.Group[] = []
) {
  const H = L * 0.3583;
  const zHouse = -W * 0.016;
  const wHouse = W * 0.653;

  // 1. Cuerpo arquitectónico canónico con buffers pre-fusionados (0 nuevas geometrías por villa)
  const canonicalSpecs = getOrBuildCanonicalVillaMeshes(mats);
  const bodyGrp = new THREE.Group();
  bodyGrp.scale.set(L, H, W);
  bodyGrp.matrixAutoUpdate = false;
  bodyGrp.updateMatrix();

  for (let i = 0; i < canonicalSpecs.length; i++) {
    const spec = canonicalSpecs[i];
    const m = new THREE.Mesh(spec.geo, spec.mat);
    m.castShadow = spec.castShadow;
    m.receiveShadow = true;
    m.matrixAutoUpdate = false;
    bodyGrp.add(m);
  }
  villaGrp.add(bodyGrp);

  // 2. Corona de palmera interior en el patio bioclimático central
  if (mats.palmCrownTexMat) {
    const palmX = L * 0.005;
    const palmZ = zHouse + wHouse * 0.12;
    const crownMesh = new THREE.Mesh(mats.palmCrownGeo, mats.palmCrownTexMat);
    crownMesh.position.set(palmX + L * 0.01, H * 1.15, palmZ + W * 0.006);
    crownMesh.scale.set(L * 0.46, L * 0.46, L * 0.46);
    crownMesh.castShadow = true;
    crownMesh.matrixAutoUpdate = false;
    crownMesh.updateMatrix();
    villaGrp.add(crownMesh);
  }

  // 3. Modelos 3D GLB de vehículos reales de distintas formas en el carport frontal
  if (carTemplates.length > 0) {
    const carSlots = [zHouse - wHouse * 0.225, zHouse + wHouse * 0.215];
    const hasSecondCar = (lotIndex * 5 + 1) % 7 !== 0;
    const activeSlots = hasSecondCar ? carSlots : [carSlots[lotIndex % 2]];

    activeSlots.forEach((carZ, slotIdx) => {
      const modelIdx = (lotIndex + slotIdx * 2 + (slotIdx === 1 ? 1 : 0)) % carTemplates.length;
      const paintMat =
        mats.carPaintPalette[(lotIndex * 3 + slotIdx * 5 + modelIdx) % mats.carPaintPalette.length];
      const carClone = carTemplates[modelIdx].clone(true);
      carClone.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          mesh.castShadow = false;
          mesh.receiveShadow = false;
          const mName = (mesh.material as THREE.Material)?.name || "";
          if (mName === "BodyPaint") {
            mesh.material = paintMat;
          } else if ((mesh.material as THREE.MeshStandardMaterial)?.isMeshStandardMaterial) {
            (mesh.material as THREE.MeshStandardMaterial).envMapIntensity = 1.25;
          }
        }
      });

      const shadowMesh = new THREE.Mesh(unitBox, mats.darkBronzeMat);
      shadowMesh.scale.set(L * 0.142, 0.002, W * 0.118);
      shadowMesh.position.set(-L * 0.352, 0.0145, carZ);
      shadowMesh.matrixAutoUpdate = false;
      shadowMesh.updateMatrix();
      villaGrp.add(shadowMesh);

      const carScale = L * 0.0415;
      carClone.scale.set(carScale, carScale, carScale);
      carClone.position.set(-L * 0.352, 0.015, carZ);
      if ((lotIndex + slotIdx) % 2 === 0) {
        carClone.rotation.y = Math.PI;
      }
      carClone.matrixAutoUpdate = false;
      carClone.updateMatrix();
      villaGrp.add(carClone);
    });
  }
}

const SKY_DOME_VERTEX_GLSL = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const SKY_DOME_FRAGMENT_GLSL = /* glsl */ `
  uniform float uIsSunset;
  uniform vec3 uSunDir;
  varying vec3 vWorldPos;

  void main() {
    vec3 dir = normalize(vWorldPos);
    float h = clamp(dir.y, 0.0, 1.0);

    // Cielo Caribeño de Día (Azul Celeste a Bruma Costera Cálida en el Horizonte)
    vec3 dayZenith = vec3(0.18, 0.52, 0.82);
    vec3 dayMid    = vec3(0.48, 0.78, 0.94);
    vec3 dayHoriz  = vec3(0.84, 0.93, 0.97);
    vec3 daySky = mix(dayHoriz, dayMid, smoothstep(0.0, 0.25, h));
    daySky = mix(daySky, dayZenith, smoothstep(0.25, 0.85, h));

    // Cielo Golden Hour Atardecer (Ámbar Dorado -> Coral -> Violeta Profundo)
    vec3 sunZenith = vec3(0.14, 0.12, 0.28);
    vec3 sunMid    = vec3(0.72, 0.36, 0.32);
    vec3 sunHoriz  = vec3(0.98, 0.72, 0.42);
    vec3 sunsetSky = mix(sunHoriz, sunMid, smoothstep(0.0, 0.22, h));
    sunsetSky = mix(sunsetSky, sunZenith, smoothstep(0.22, 0.78, h));

    vec3 skyCol = mix(daySky, sunsetSky, uIsSunset);

    // Halo solar y disco brillante sobre el horizonte del Mar Caribe
    float sunAmt = max(dot(dir, normalize(uSunDir)), 0.0);
    vec3 sunGlowTint = mix(vec3(1.0, 0.98, 0.88), vec3(1.0, 0.65, 0.22), uIsSunset);
    skyCol += sunGlowTint * pow(sunAmt, 12.0) * 0.35;
    skyCol += vec3(1.0, 0.96, 0.85) * pow(sunAmt, 180.0) * 1.2;

    gl_FragColor = vec4(skyCol, 1.0);
  }
`;

const TERRAIN_WATER_VERTEX_GLSL = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vReliefShade;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vec2 mUv = vec2(worldPosition.x / 38.4 + 0.5, 0.5 - worldPosition.z / 21.6);

    // Relieve topográfico 3D suave al Oeste de la Vía al Mar Km 23 - Zona Norte (mUv.x < -0.045)
    // y en las colinas costeras lejanas Norte/Sur, manteniendo 100% planos los lotes, vías y playa
    float westFactor = smoothstep(-0.042, -0.14, mUv.x);
    float northSouthHills = max(smoothstep(1.06, 1.32, mUv.y), smoothstep(-0.06, -0.32, mUv.y)) * (1.0 - smoothstep(0.55, 0.72, mUv.x));
    float reliefMask = clamp(westFactor + northSouthHills * 0.75, 0.0, 1.0);

    float h1 = sin(worldPosition.x * 0.24 + worldPosition.z * 0.19) * cos(worldPosition.z * 0.16 - worldPosition.x * 0.11);
    float h2 = sin(worldPosition.x * 0.58 - worldPosition.z * 0.47) * 0.38;
    float h3 = cos(worldPosition.x * 1.15 + worldPosition.z * 0.92) * 0.16;
    // Meseta aterrazada frente a la Portería (similar al movimiento de tierras de earth.patrimofy)
    float clearingDist = length(vec2((mUv.x + 0.13) * 2.4, (mUv.y - 0.44) * 1.6));
    float terraceMound = (1.0 - smoothstep(0.10, 0.34, clearingDist)) * 0.38;

    float rawElev = max(0.0, (h1 + h2 + h3) * 0.5 + 0.42) * 1.15 + terraceMound;
    worldPosition.y += rawElev * reliefMask;

    // Sombreado direccional sutil por pendiente de las colinas 3D
    float slopeX = cos(worldPosition.x * 0.24 + worldPosition.z * 0.19) * 0.24 + cos(worldPosition.x * 0.58 - worldPosition.z * 0.47) * 0.22;
    vReliefShade = clamp(slopeX * reliefMask * 0.45, -0.18, 0.22);

    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const TERRAIN_WATER_FRAGMENT_GLSL = /* glsl */ `
  uniform sampler2D uMasterTex;
  uniform sampler2D uWestEarthTex;
  uniform sampler2D uMasksTex;
  uniform sampler2D uDetailTex;
  uniform float uTime;
  uniform float uIsSunset;
  uniform vec3 uSunDir;
  uniform vec3 uCameraPos;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vReliefShade;

  // Muestreo FBM multicapa sin costuras ni rayas artificiales
  vec3 sampleWaterFBM(vec2 uv, float t) {
    mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
    vec2 uv1 = uv * vec2(10.0, 7.0) + vec2(t * 0.018, t * 0.011);
    vec2 uv2 = (rot * uv) * vec2(23.0, 18.0) + vec2(-t * 0.026, t * 0.019);
    vec2 uv3 = (rot * (rot * uv)) * vec2(52.0, 42.0) + vec2(t * 0.038, -t * 0.029);

    vec4 s1 = texture2D(uDetailTex, uv1);
    vec4 s2 = texture2D(uDetailTex, uv2);
    vec4 s3 = texture2D(uDetailTex, uv3);

    vec2 norm = (s1.rg * 2.0 - 1.0) * 0.50 +
                (s2.rg * 2.0 - 1.0) * 0.32 +
                (s3.rg * 2.0 - 1.0) * 0.18;
    float heightVal = s1.a * 0.50 + s2.a * 0.32 + s3.a * 0.18;
    return vec3(norm, heightVal);
  }

  void main() {
    // Coordenada UV exacta respecto al masterplan central de 38.4 x 21.6
    vec2 mUv = vec2(vWorldPos.x / 38.4 + 0.5, 0.5 - vWorldPos.z / 21.6);

    // Pertenencia estricta al masterplan central [0..1]
    float inMaster = step(0.0, mUv.x) * step(mUv.x, 1.0) * step(0.0, mUv.y) * step(mUv.y, 1.0);

    // Continuación C0 sin costuras hacia el Norte (mUv.y > 1), Sur (mUv.y < 0),
    // y Mar Caribe profundo al Este (mUv.x > 1).
    float sampleY = clamp(mUv.y, 0.004, 0.996);
    if (mUv.y > 1.0) {
      float dy = mUv.y - 1.0;
      float triY = 1.0 - abs(fract(dy * 1.45) * 2.0 - 1.0);
      sampleY = 0.996 - triY * 0.155;
    } else if (mUv.y < 0.0) {
      float dy = -mUv.y;
      float triY = 1.0 - abs(fract(dy * 1.45) * 2.0 - 1.0);
      sampleY = 0.004 + triY * 0.155;
    }

    float sampleX = clamp(mUv.x, 0.004, 0.996);
    if (mUv.x > 1.0) {
      float dx = mUv.x - 1.0;
      float triX = 1.0 - abs(fract(dx * 1.75) * 2.0 - 1.0);
      sampleX = 0.996 - triX * 0.058;
    }

    // Deformación orgánica FBM únicamente en el bosque exterior Norte/Sur (sampleX < 0.75)
    float outDistY = max(0.0, max(-mUv.y, mUv.y - 1.0));
    float outerForestFactor = clamp(outDistY * 4.0, 0.0, 1.0) * step(0.02, mUv.x) * (1.0 - smoothstep(0.70, 0.78, sampleX));
    vec2 fbmForestWarp = (texture2D(uDetailTex, mUv * 3.2).rg - 0.5) * 0.06 * outerForestFactor;

    vec2 sampleUv = clamp(vec2(sampleX, sampleY) + fbmForestWarp, 0.003, 0.997);

    vec3 baseCol = texture2D(uMasterTex, sampleUv).rgb;
    vec3 masks = texture2D(uMasksTex, sampleUv).rgb;

    // ========================================================================
    // CAPA 0: VÍA AL MAR KM 23 (ZONA NORTE) + TERRENO REAL EARTH.PATRIMOFY AL OESTE
    // Cubre mUv.x <= 0.020833 (desde col +80 de Portería hasta -1400 px al Oeste)
    // y mUv.y desde -0.25 hasta +1.25 con empalme C0 exacto con el Masterplan
    // ========================================================================
    float westBlend = 1.0 - smoothstep(0.0115, 0.0202, mUv.x);
    if (westBlend > 0.001) {
      float rawWestU = (mUv.x * 3840.0 + 1400.0) / 1480.0;
      float rawWestV = (mUv.y + 0.25) / 1.5;

      // Espejo C0 suave en el extremo lejano occidental (rawWestU < 0) y extremos N/S
      float wU = rawWestU;
      if (wU < 0.0) {
        float du = -wU;
        wU = 0.004 + (1.0 - abs(fract(du * 0.85) * 2.0 - 1.0)) * 0.42;
      }
      float wV = rawWestV;
      if (wV > 1.0) {
        float dv = wV - 1.0;
        wV = 0.996 - (1.0 - abs(fract(dv * 1.2) * 2.0 - 1.0)) * 0.14;
      } else if (wV < 0.0) {
        float dv = -wV;
        wV = 0.004 + (1.0 - abs(fract(dv * 1.2) * 2.0 - 1.0)) * 0.14;
      }

      vec3 westCol = texture2D(uWestEarthTex, clamp(vec2(wU, wV), 0.002, 0.998)).rgb;
      // Micro-grano de tierra/vegetación al acercar la cámara y sombreado de relieve 3D
      float microGrain = (texture2D(uDetailTex, mUv * 75.0).b - 0.5) * 0.04;
      westCol = westCol * (1.0 + vReliefShade) + microGrain * (1.0 - smoothstep(4.0, 26.0, length(vWorldPos - uCameraPos)));

      baseCol = mix(baseCol, westCol, westBlend);
      masks *= (1.0 - westBlend);
    }

    // Canales de la máscara PNG sin pérdida (loom_terrain_masks.png):
    // R = Mar Caribe y Piscinas de los Clubs (0 en todos los lotes y vías)
    // G = Césped de lotes y vegetación
    // B = Lago / Laguna Natural de Etapa 5 (ambas cuencas, excluyendo el puente vehicular)
    float sdSea = (mUv.x > 1.0) ? 1.0 : masks.r;
    float grassMask = masks.g;
    float lakeMask = masks.b * inMaster;

    float camDist = length(vWorldPos - uCameraPos);
    float closeFactor = 1.0 - smoothstep(3.5, 22.0, camDist);

    vec3 finalCol = baseCol;

    // ========================================================================
    // CAPA 1: MICRO-DETALLE SUTIL DE GRAMA Y ARENA AL ACERCAR LA CÁMARA
    // ========================================================================
    if (sdSea < 0.035 && lakeMask < 0.04) {
      if (grassMask > 0.1 && closeFactor > 0.005) {
        float diagCoord = vWorldPos.x * 0.78 + vWorldPos.z * 0.62;
        float mowStripe = sin(diagCoord * 18.0) * 0.5 + 0.5;
        float microBlade = texture2D(uDetailTex, mUv * 85.0).b - 0.5;

        vec3 lawnTint = mix(baseCol * 0.96, baseCol * 1.06, mowStripe);
        finalCol = mix(baseCol, lawnTint, grassMask * 0.35 * closeFactor * inMaster);
        finalCol += microBlade * 0.055 * grassMask * closeFactor;
      }

      // Micro-destello de arena coralina en Playa Alma
      float isBeachSand = smoothstep(0.77, 0.81, sampleX) * smoothstep(0.52, 0.68, baseCol.r);
      if (isBeachSand > 0.05 && closeFactor > 0.005) {
        float sandSparkle = texture2D(uDetailTex, mUv * 130.0).b - 0.5;
        finalCol += sandSparkle * 0.042 * isBeachSand * closeFactor;
      }

      // Pavimento arquitectónico de alta definición en las vías internas (elimina tono marrón borroso)
      float isWarmGrayRoad = (1.0 - smoothstep(0.08, 0.22, grassMask))
                           * (1.0 - isBeachSand)
                           * smoothstep(0.08, 0.13, baseCol.r)
                           * (1.0 - smoothstep(0.24, 0.34, baseCol.r))
                           * (1.0 - smoothstep(0.045, 0.095, abs(baseCol.r - baseCol.g - 0.035)))
                           * inMaster;
      if (isWarmGrayRoad > 0.05) {
        float roadGrain1 = texture2D(uDetailTex, mUv * 165.0).b - 0.5;
        float roadGrain2 = texture2D(uDetailTex, mUv * 340.0).a - 0.5;
        vec3 slateAsphalt = mix(baseCol, vec3(0.22, 0.23, 0.245), 0.62);
        slateAsphalt += (roadGrain1 * 0.028 + roadGrain2 * 0.018) * (0.35 + 0.65 * closeFactor);
        finalCol = mix(finalCol, slateAsphalt, isWarmGrayRoad * 0.88);
      }
    }

    // ========================================================================
    // CAPA 2: LAGO / LAGUNA NATURAL DE ETAPA 5 (ACLARADO TURQUESA-ESMERALDA + AGUA VIVA)
    // Transforma el agua oscura del render base en una laguna tropical cristalina en movimiento
    // ========================================================================
    if (lakeMask >= 0.04) {
      vec3 lakeFbm = sampleWaterFBM(mUv * 1.85, uTime * 0.95);
      vec2 lNorm = lakeFbm.xy;
      float lHeight = lakeFbm.z;

      vec2 lakeRefractUv = clamp(sampleUv + lNorm * 0.0022, 0.003, 0.997);
      vec3 lakeBottom = texture2D(uMasterTex, lakeRefractUv).rgb;

      // Aclarado progresivo: Verde Jade Esmeralda en la orilla -> Turquesa Cristalino en el centro
      float lakeDepth = smoothstep(0.08, 0.78, lakeMask);
      vec3 shallowEmerald = vec3(0.14, 0.64, 0.54);
      vec3 deepLagoonTurq = vec3(0.06, 0.52, 0.60);
      vec3 lagoonTint = mix(shallowEmerald, deepLagoonTurq, lakeDepth);

      // Elevar luminosidad del fondo oscuro del render y fundir con agua cristalina
      vec3 brightenedBottom = lakeBottom * 1.85 + vec3(0.04, 0.22, 0.20);
      vec3 lakeCol = mix(brightenedBottom, lagoonTint, 0.76);

      // Ondas suaves y caústicas solares dentro del lago
      float lCaustic1 = texture2D(uDetailTex, mUv * 55.0 + lNorm * 0.07 + vec2(uTime * 0.022, 0.0)).a;
      float lCaustic2 = texture2D(uDetailTex, mUv * 62.0 - lNorm * 0.07 - vec2(0.0, uTime * 0.019)).a;
      float lCaustics = pow(min(lCaustic1, lCaustic2) * 1.7, 2.0);
      lakeCol += vec3(0.18, 0.38, 0.36) * lCaustics * 0.85;

      // Brisa superficial y reflejo solar especular en la laguna
      float rippleCrest = smoothstep(0.54, 0.78, sin(mUv.x * 190.0 - mUv.y * 140.0 + uTime * 2.2 + lHeight * 5.0) * 0.5 + 0.5);
      lakeCol += vec3(0.22, 0.34, 0.35) * rippleCrest * 0.28;

      vec3 N_lake = normalize(vec3(lNorm.x * 0.38, 1.0, lNorm.y * 0.38));
      vec3 V_lake = normalize(uCameraPos - vWorldPos);
      float fresnelLake = pow(1.0 - max(dot(N_lake, V_lake), 0.0), 4.0);
      vec3 skyReflLake = mix(vec3(0.62, 0.88, 0.98), vec3(0.98, 0.62, 0.30), uIsSunset);
      lakeCol = mix(lakeCol, skyReflLake, fresnelLake * 0.34);

      vec3 Rf_lake = reflect(-V_lake, N_lake);
      float lakeGlitter = pow(max(dot(Rf_lake, uSunDir), 0.0), 180.0) * 2.4 + pow(max(dot(Rf_lake, uSunDir), 0.0), 28.0) * 0.32;
      vec3 sunTintLake = mix(vec3(1.0, 0.99, 0.92), vec3(1.0, 0.68, 0.28), uIsSunset);
      lakeCol += sunTintLake * lakeGlitter;

      float lakeEdgeBlend = smoothstep(0.04, 0.24, lakeMask);
      finalCol = mix(finalCol, lakeCol, lakeEdgeBlend);
    }

    // ========================================================================
    // CAPA 3: MAR CARIBE Y PISCINAS POR REFRACCIÓN ÓPTICA + BRILLO DIAMANTE SOLAR
    // ========================================================================
    if (sdSea >= 0.035) {
      vec3 fbmData = sampleWaterFBM(mUv, uTime);
      vec2 waveN = fbmData.xy;
      float waveH = fbmData.z;

      float shoreFade = smoothstep(0.035, 0.11, sdSea);
      vec2 refractOffset = waveN * 0.0032 * (0.35 + 0.65 * shoreFade);
      float swellPush = sin(uTime * 1.45 - sdSea * 24.0 + waveH * 4.5) * 0.0018 * (1.0 - smoothstep(0.02, 0.45, sdSea));

      vec2 waterUv = clamp(sampleUv + refractOffset + vec2(swellPush, 0.0), 0.003, 0.997);
      vec3 refractedSea = texture2D(uMasterTex, waterUv).rgb;

      // En mar abierto profundo (mUv.x > 0.97) transicionar suavemente a Azul Zafiro Caribeño sin rayas
      float deepOceanFactor = smoothstep(0.96, 1.28, mUv.x);
      vec3 openSeaCol = mix(vec3(0.05, 0.42, 0.48), vec3(0.03, 0.19, 0.34), smoothstep(0.96, 1.75, mUv.x));
      refractedSea = mix(refractedSea, openSeaCol, deepOceanFactor * 0.86);

      vec3 turquoiseBoost = mix(vec3(0.08, 0.58, 0.56), vec3(0.04, 0.24, 0.38), smoothstep(0.08, 0.75, sdSea));
      vec3 seaCol = mix(refractedSea, turquoiseBoost, 0.24 * shoreFade);

      // Caústicas solares orgánicas
      float caustic1 = texture2D(uDetailTex, mUv * 42.0 + waveN * 0.06 + vec2(uTime * 0.025, 0.0)).a;
      float caustic2 = texture2D(uDetailTex, mUv * 48.0 - waveN * 0.06 - vec2(0.0, uTime * 0.022)).a;
      float causticPattern = pow(min(caustic1, caustic2) * 1.65, 2.2);
      seaCol += vec3(0.14, 0.32, 0.30) * causticPattern * (1.0 - smoothstep(0.03, 0.50, sdSea)) * shoreFade;

      // Espuma orgánica viva en la rompiente de toda la costa de Playa Alma
      float naturalFoamBase = max(0.0, (refractedSea.r + refractedSea.g + refractedSea.b) / 3.0 - 0.58) * 2.2 * (1.0 - deepOceanFactor);
      float rollingCrest = smoothstep(0.62, 0.88, sin(sdSea * 28.0 + uTime * 1.65 + waveH * 5.2) * 0.5 + 0.5);
      float surfZone = (1.0 - smoothstep(0.04, 0.36, sdSea)) * smoothstep(0.035, 0.075, sdSea) * (1.0 - deepOceanFactor);
      float foamLace = smoothstep(0.38, 0.75, waveH);

      float liveFoam = clamp(
        naturalFoamBase * (0.25 + 0.45 * sin(uTime * 2.1 + waveH * 6.0)) +
        rollingCrest * surfZone * foamLace * 0.52,
        0.0,
        0.85
      );
      vec3 foamColor = mix(vec3(0.95, 0.99, 1.0), vec3(1.0, 0.90, 0.76), uIsSunset * 0.6);
      seaCol = mix(seaCol, foamColor, liveFoam);

      // Iluminación Física: Fresnel + Destellos Diamante/Oro del Sol ("Sun Glitter")
      vec3 N = normalize(vec3(waveN.x * 0.42, 1.0, waveN.y * 0.42));
      vec3 V = normalize(uCameraPos - vWorldPos);
      float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);

      vec3 skyRefl = mix(vec3(0.58, 0.84, 0.96), vec3(0.98, 0.58, 0.28), uIsSunset);
      seaCol = mix(seaCol, skyRefl, fresnel * 0.36);

      vec3 Rf = reflect(-V, N);
      float glitterSharp = pow(max(dot(Rf, uSunDir), 0.0), 260.0) * 3.4;
      float glitterSoft  = pow(max(dot(Rf, uSunDir), 0.0), 32.0) * 0.38;
      vec3 sunTint = mix(vec3(1.0, 0.99, 0.92), vec3(1.0, 0.68, 0.28), uIsSunset);
      seaCol += sunTint * (glitterSharp + glitterSoft) * shoreFade;

      finalCol = mix(baseCol, seaCol, smoothstep(0.035, 0.08, sdSea));
    }

    if (uIsSunset > 0.01 && sdSea < 0.035 && lakeMask < 0.04) {
      finalCol *= mix(vec3(1.0), vec3(1.02, 0.89, 0.76), uIsSunset);
    }

    // Bruma atmosférica costera en el horizonte lejano para fundirse con el Domo de Cielo
    float radialDist = length(vWorldPos.xz);
    float horizonFog = smoothstep(26.0, 78.0, radialDist);
    vec3 horizonColor = mix(vec3(0.84, 0.93, 0.97), vec3(0.98, 0.72, 0.42), uIsSunset);
    finalCol = mix(finalCol, horizonColor, horizonFog);

    gl_FragColor = vec4(finalCol, 1.0);
  }
`;

interface Loom3DMaquetaViewProps {
  stageId: string;
  onChangeStage: (newStageId: string) => void;
  lotsMap: Record<string, MaquetaLot>;
  selectedLot: MaquetaLot | null;
  onSelectLot: (lot: MaquetaLot) => void;
  onExit3D: () => void;
  onOpenLocation?: () => void;
}

export default function Loom3DMaquetaView({
  stageId,
  onChangeStage,
  lotsMap,
  selectedLot,
  onSelectLot,
  onExit3D,
  onOpenLocation,
}: Loom3DMaquetaViewProps) {
  const { isEn } = useLoomLang();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const hoveredLotIdRef = useRef<string | null>(null);
  const radarMarkerRef = useRef<SVGGElement | null>(null);
  const radarYawLabelRef = useRef<HTMLSpanElement | null>(null);
  const villaMatsCacheRef = useRef<{ day: VillaReplicaMaterials | null; sunset: VillaReplicaMaterials | null; unitBox: THREE.BoxGeometry | null }>({
    day: null,
    sunset: null,
    unitBox: null,
  });

  const [isSunset, setIsSunset] = useState<boolean>(false);
  const [villaMode, setVillaMode] = useState<"showcase" | "all" | "off">("showcase");
  const [showTrees3D, setShowTrees3D] = useState<boolean>(true);
  const [showDronePins, setShowDronePins] = useState<boolean>(true);
  const [focusMode, setFocusMode] = useState<"all" | "stage">("all");
  const [colorMode, setColorMode] = useState<"status" | "area" | "typology">("status");
  const [activeAreaFilter, setActiveAreaFilter] = useState<AreaTierKey | "all">("all");
  const [activePreset, setActivePreset] = useState<CameraPreset>(CAMERA_PRESETS[0]);
  const [hoveredLot, setHoveredLot] = useState<{ lot: MaquetaLot; stageId: string; x: number; y: number } | null>(null);
  const [cameraYaw, setCameraYaw] = useState<number>(0);
  const [unifiedLots, setUnifiedLots] = useState<Unified3DLot[]>([]);
  const [landscapeData, setLandscapeData] = useState<Landscape3DData | null>(null);
  const [carTemplates, setCarTemplates] = useState<THREE.Group[]>([]);
  const [droneRenderModal, setDroneRenderModal] = useState<CameraPreset["renderPreview"] | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<"stages" | "options" | null>(null);
  const bottomBarScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/loom/loom_unified_3d_lots.json?v=3")
      .then((r) => r.json())
      .then((data: Unified3DLot[]) => {
        if (isMounted) setUnifiedLots(data);
      })
      .catch((err) => console.error("Error loading unified 3D lots:", err));

    fetch("/loom/loom_landscape_3d.json")
      .then((r) => r.json())
      .then((data: Landscape3DData) => {
        if (isMounted) setLandscapeData(data);
      })
      .catch((err) => console.error("Error loading 3D landscape data:", err));

    const carLoader = new GLTFLoader();
    const carModelUrls = [
      "/loom/models/car_suv_luxury.glb?v=5",
      "/loom/models/car_coupe_gt.glb?v=5",
      "/loom/models/car_sedan_exec.glb?v=5",
      "/loom/models/car_pickup_luxury.glb?v=5",
    ];
    Promise.all(
      carModelUrls.map(
        (url) =>
          new Promise<THREE.Group | null>((resolve) => {
            carLoader.load(
              url,
              (gltf) => {
                gltf.scene.traverse((node) => {
                  if ((node as THREE.Mesh).isMesh) {
                    const m = node as THREE.Mesh;
                    m.castShadow = false;
                    m.receiveShadow = false;
                    m.matrixAutoUpdate = false;
                    m.updateMatrix();
                    if ((m.material as THREE.MeshStandardMaterial)?.isMeshStandardMaterial) {
                      (m.material as THREE.MeshStandardMaterial).envMapIntensity = 1.25;
                    }
                  }
                });
                resolve(gltf.scene);
              },
              undefined,
              () => resolve(null)
            );
          })
      )
    ).then((loadedCars) => {
      if (isMounted) {
        setCarTemplates(loadedCars.filter((g): g is THREE.Group => g !== null));
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const sceneRefs = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    controls: OrbitControls | null;
    renderer: THREE.WebGLRenderer | null;
    ambientLight: THREE.AmbientLight | null;
    dirLight: THREE.DirectionalLight | null;
    hemiLight: THREE.HemisphereLight | null;
    terrainShaderMat: THREE.ShaderMaterial | null;
    skyShaderMat: THREE.ShaderMaterial | null;
    lotsGroup: THREE.Group | null;
    villasGroup: THREE.Group | null;
    landscapeGroup: THREE.Group | null;
    telemetryGroup: THREE.Group | null;
    palmCrownTex: THREE.CanvasTexture | null;
    desiredPos: THREE.Vector3;
    desiredTarget: THREE.Vector3;
    isFlying: boolean;
  }>({
    scene: null,
    camera: null,
    controls: null,
    renderer: null,
    ambientLight: null,
    dirLight: null,
    hemiLight: null,
    terrainShaderMat: null,
    skyShaderMat: null,
    lotsGroup: null,
    villasGroup: null,
    landscapeGroup: null,
    telemetryGroup: null,
    palmCrownTex: null,
    desiredPos: new THREE.Vector3(...CAMERA_PRESETS[0].position),
    desiredTarget: new THREE.Vector3(...CAMERA_PRESETS[0].target),
    isFlying: false,
  });

  const animatedTrafficRef = useRef<
    {
      carObj: THREE.Object3D;
      shadowObj: THREE.Object3D;
      waypoints: [number, number][];
      segLengths: number[];
      totalLength: number;
      speed: number;
      phaseOffset: number;
    }[]
  >([]);

  const lotsMapRef = useRef(lotsMap);
  lotsMapRef.current = lotsMap;
  const unifiedLotsRef = useRef(unifiedLots);
  unifiedLotsRef.current = unifiedLots;
  const onSelectLotRef = useRef(onSelectLot);
  onSelectLotRef.current = onSelectLot;
  const onChangeStageRef = useRef(onChangeStage);
  onChangeStageRef.current = onChangeStage;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#d6eef8");

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 350);
    camera.position.set(...CAMERA_PRESETS[0].position);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    renderer.toneMapping = THREE.NoToneMapping;

    // Mapa de entorno IBL (RoomEnvironment) para reflejos reales en pintura automotriz, cromo, rines y vidrios
    const pmremGen = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    scene.environment = pmremGen.fromScene(roomEnv, 0.04).texture;
    scene.environmentIntensity = 0.45;
    pmremGen.dispose();
    roomEnv.dispose();

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    // Paneo estrictamente horizontal paralelo al suelo (impide hundir el pivote bajo tierra con clic derecho)
    controls.screenSpacePanning = false;
    controls.maxPolarAngle = Math.PI / 2 - 0.085;
    controls.minPolarAngle = 0.05;
    controls.minDistance = 0.65;
    controls.maxDistance = 54;
    controls.addEventListener("start", () => {
      sceneRefs.current.isFlying = false;
    });

    const ambientLight = new THREE.AmbientLight("#f8fafc", 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight("#bae6fd", "#051415", 0.5);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight("#fffbeb", 1.55);
    dirLight.position.set(20, 30, 14);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 95;
    const d = 24;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Domo Atmosférico de Cielo Caribeño (Elimina por completo el vacío negro en el horizonte)
    const skyGeo = new THREE.SphereGeometry(180, 32, 24);
    const skyShaderMat = new THREE.ShaderMaterial({
      vertexShader: SKY_DOME_VERTEX_GLSL,
      fragmentShader: SKY_DOME_FRAGMENT_GLSL,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uIsSunset: { value: 0 },
        uSunDir: { value: new THREE.Vector3(0.65, 0.55, 0.35).normalize() },
      },
    });
    const skyDome = new THREE.Mesh(skyGeo, skyShaderMat);
    scene.add(skyDome);

    const detailTex = createOrganicWaterAndGrassTexture();
    const palmCrownTex = createPalmFrondCrownTexture();
    const loader = new THREE.TextureLoader();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const masterTex = loader.load("/loom/loom_masterplan_bg.webp?v=5", (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = maxAniso;
    });

    const westEarthTex = loader.load("/loom/loom_west_earth_via.webp?v=1", (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = maxAniso;
    });

    const masksTex = loader.load("/loom/loom_terrain_masks.png?v=2", (t) => {
      t.anisotropy = maxAniso;
    });

    // Terreno Costero Extendido (172m x 118m en escala 3D) con subdivisión optimizada 128x128 para 60 FPS
    const terrainGeo = new THREE.PlaneGeometry(WORLD_W * 4.5, WORLD_D * 5.5, 128, 128);
    const terrainShaderMat = new THREE.ShaderMaterial({
      vertexShader: TERRAIN_WATER_VERTEX_GLSL,
      fragmentShader: TERRAIN_WATER_FRAGMENT_GLSL,
      side: THREE.DoubleSide,
      uniforms: {
        uMasterTex: { value: masterTex },
        uWestEarthTex: { value: westEarthTex },
        uMasksTex: { value: masksTex },
        uDetailTex: { value: detailTex },
        uTime: { value: 0 },
        uIsSunset: { value: 0 },
        uSunDir: { value: new THREE.Vector3(0.65, 0.55, 0.35).normalize() },
        uCameraPos: { value: camera.position.clone() },
      },
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainShaderMat);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.y = 0;
    scene.add(terrainMesh);

    const shadowGeo = new THREE.PlaneGeometry(WORLD_W, WORLD_D);
    const shadowCatcherMat = new THREE.ShadowMaterial({ opacity: 0.28 });
    const shadowCatcherMesh = new THREE.Mesh(shadowGeo, shadowCatcherMat);
    shadowCatcherMesh.rotation.x = -Math.PI / 2;
    shadowCatcherMesh.position.y = 0.003;
    shadowCatcherMesh.receiveShadow = true;
    scene.add(shadowCatcherMesh);

    const lotsGroup = new THREE.Group();
    scene.add(lotsGroup);

    const villasGroup = new THREE.Group();
    scene.add(villasGroup);

    const landscapeGroup = new THREE.Group();
    scene.add(landscapeGroup);

    const telemetryGroup = new THREE.Group();
    scene.add(telemetryGroup);

    sceneRefs.current = {
      ...sceneRefs.current,
      scene,
      camera,
      controls,
      renderer,
      ambientLight,
      dirLight,
      hemiLight,
      terrainShaderMat,
      skyShaderMat,
      lotsGroup,
      villasGroup,
      landscapeGroup,
      telemetryGroup,
      palmCrownTex,
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const groundPickPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.012);
    const planeHitVec = new THREE.Vector3();
    let pointerDownPos = { x: 0, y: 0 };
    let isPointerDown = false;
    let hoverRafPending = false;
    let lastClientX = 0;
    let lastClientY = 0;

    // Detección matemática 2D ultra-rápida (0.003 ms vs 4 ms de raycasting 3D sobre 318 ExtrudeGeometry)
    const pickLotOnGroundPlane = (clientX: number, clientY: number): Unified3DLot | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      if (!raycaster.ray.intersectPlane(groundPickPlane, planeHitVec)) return null;

      const svgX = (planeHitVec.x / WORLD_W + 0.5) * 3840;
      const svgY = (planeHitVec.z / WORLD_D + 0.5) * 2160;
      if (svgX < 0 || svgX > 3840 || svgY < 0 || svgY > 2160) return null;

      const lots = unifiedLotsRef.current;
      for (let i = 0; i < lots.length; i++) {
        const pLot = lots[i];
        if (
          Math.abs(svgX - pLot.cx) > pLot.width * 0.65 ||
          Math.abs(svgY - pLot.cy) > pLot.height * 0.65
        ) {
          continue;
        }
        const verts = pLot.vertices;
        if (verts.length < 3) continue;
        let inside = false;
        for (let j = 0, k = verts.length - 1; j < verts.length; k = j++) {
          const xi = verts[j][0],
            yi = verts[j][1];
          const xj = verts[k][0],
            yj = verts[k][1];
          const intersect =
            yi > svgY !== yj > svgY &&
            svgX < ((xj - xi) * (svgY - yi)) / (yj - yi + 0.00001) + xi;
          if (intersect) inside = !inside;
        }
        if (inside) return pLot;
      }
      return null;
    };

    const handlePointerMove = (e: MouseEvent) => {
      lastClientX = e.clientX;
      lastClientY = e.clientY;

      if (tooltipRef.current && hoveredLotIdRef.current) {
        const tx = Math.min(lastClientX + 16, window.innerWidth - 230);
        const ty = Math.max(16, lastClientY - 48);
        tooltipRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      }

      if (isPointerDown && Math.hypot(lastClientX - pointerDownPos.x, lastClientY - pointerDownPos.y) > 5) {
        if (hoveredLotIdRef.current !== null) {
          hoveredLotIdRef.current = null;
          setHoveredLot(null);
        }
        return;
      }

      if (hoverRafPending) return;
      hoverRafPending = true;
      requestAnimationFrame(() => {
        hoverRafPending = false;
        const pickedLot = pickLotOnGroundPlane(lastClientX, lastClientY);
        if (pickedLot) {
          const lotData = lotsMapRef.current[pickedLot.id];
          if (lotData) {
            renderer.domElement.style.cursor = "pointer";
            if (hoveredLotIdRef.current !== pickedLot.id) {
              hoveredLotIdRef.current = pickedLot.id;
              setHoveredLot({
                lot: lotData,
                stageId: pickedLot.stageId || "etapa_1",
                x: lastClientX,
                y: lastClientY,
              });
            }
            return;
          }
        }
        renderer.domElement.style.cursor = "grab";
        if (hoveredLotIdRef.current !== null) {
          hoveredLotIdRef.current = null;
          setHoveredLot(null);
        }
      });
    };

    const handlePointerDown = (e: MouseEvent) => {
      isPointerDown = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: MouseEvent) => {
      isPointerDown = false;
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return;

      const pickedLot = pickLotOnGroundPlane(e.clientX, e.clientY);
      if (pickedLot) {
        const lotData = lotsMapRef.current[pickedLot.id];
        if (lotData) {
          if (pickedLot.stageId) onChangeStageRef.current(pickedLot.stageId);
          onSelectLotRef.current(lotData);
        }
      }
    };

    renderer.domElement.addEventListener("mousemove", handlePointerMove);
    renderer.domElement.addEventListener("mousedown", handlePointerDown);
    renderer.domElement.addEventListener("mouseup", handlePointerUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    let rafId = 0;
    let lastYawUpdate = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      if (sceneRefs.current.terrainShaderMat) {
        sceneRefs.current.terrainShaderMat.uniforms.uTime.value = elapsed;
        sceneRefs.current.terrainShaderMat.uniforms.uCameraPos.value.copy(camera.position);
      }

      if (sceneRefs.current.isFlying) {
        camera.position.lerp(sceneRefs.current.desiredPos, 0.065);
        controls.target.lerp(sceneRefs.current.desiredTarget, 0.065);
        if (
          camera.position.distanceTo(sceneRefs.current.desiredPos) < 0.12 &&
          controls.target.distanceTo(sceneRefs.current.desiredTarget) < 0.12
        ) {
          sceneRefs.current.isFlying = false;
        }
      }

      // Bloqueo físico de suelo y colinas 3D: el pivote y la cámara jamás pueden bajar del terreno
      controls.target.x = THREE.MathUtils.clamp(controls.target.x, -26.0, 26.0);
      controls.target.z = THREE.MathUtils.clamp(controls.target.z, -16.0, 16.0);
      const targetGroundY = getTerrainElevationAt(controls.target.x, controls.target.z);
      controls.target.y = THREE.MathUtils.clamp(controls.target.y, targetGroundY + 0.02, 2.4);

      controls.update();

      const camGroundY = getTerrainElevationAt(camera.position.x, camera.position.z);
      const minSafeCamY = Math.max(0.42, camGroundY + 0.42);
      if (camera.position.y < minSafeCamY) {
        camera.position.y = minSafeCamY;
      }

      // Animación a 60 FPS del tráfico vehicular 3D entrando/saliendo por las avenidas de Loom
      const trafficList = animatedTrafficRef.current;
      for (let i = 0; i < trafficList.length; i++) {
        const item = trafficList[i];
        if (item.totalLength <= 0.001) continue;
        const dist = ((elapsed * item.speed + item.phaseOffset) % item.totalLength + item.totalLength) % item.totalLength;
        let acc = 0;
        let segIdx = 0;
        for (let s = 0; s < item.segLengths.length; s++) {
          if (dist <= acc + item.segLengths[s] || s === item.segLengths.length - 1) {
            segIdx = s;
            break;
          }
          acc += item.segLengths[s];
        }
        const segLen = Math.max(0.0001, item.segLengths[segIdx]);
        const t = Math.max(0, Math.min(1, (dist - acc) / segLen));
        const [x0, z0] = item.waypoints[segIdx];
        const [x1, z1] = item.waypoints[segIdx + 1];
        const cx = x0 + (x1 - x0) * t;
        const cz = z0 + (z1 - z0) * t;
        const headingRad = -Math.atan2(z1 - z0, x1 - x0);

        item.carObj.position.set(cx, 0.005, cz);
        item.carObj.rotation.y = headingRad;
        item.carObj.updateMatrix();

        item.shadowObj.position.set(cx, 0.004, cz);
        item.shadowObj.rotation.y = headingRad;
        item.shadowObj.updateMatrix();
      }

      // Sincronización en tiempo real (60 FPS, 0 re-renders de React) de posición y orientación en el Radar
      const dx = controls.target.x - camera.position.x;
      const dz = controls.target.z - camera.position.z;
      const deg = (Math.atan2(dx, -dz) * 180) / Math.PI;
      if (radarMarkerRef.current) {
        const normX = THREE.MathUtils.clamp(controls.target.x / WORLD_W + 0.5, 0.08, 0.92);
        const normY = THREE.MathUtils.clamp(controls.target.z / WORLD_D + 0.5, 0.16, 0.84);
        const rx = normX * 160;
        const ry = normY * 90;
        radarMarkerRef.current.setAttribute(
          "transform",
          `translate(${rx.toFixed(1)}, ${ry.toFixed(1)}) rotate(${deg.toFixed(1)})`
        );
      }
      if (elapsed - lastYawUpdate > 0.15) {
        lastYawUpdate = elapsed;
        const compassDeg = ((Math.round(deg) % 360) + 360) % 360;
        if (radarYawLabelRef.current) {
          radarYawLabelRef.current.textContent = `${compassDeg}°`;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("mousemove", handlePointerMove);
      renderer.domElement.removeEventListener("mousedown", handlePointerDown);
      renderer.domElement.removeEventListener("mouseup", handlePointerUp);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const {
      scene,
      ambientLight,
      dirLight,
      hemiLight,
      terrainShaderMat,
      skyShaderMat,
    } = sceneRefs.current;
    if (!scene || !ambientLight || !dirLight || !hemiLight) return;

    if (isSunset) {
      scene.background = new THREE.Color("#f9b86b");
      ambientLight.color.set("#fdba74");
      ambientLight.intensity = 0.62;
      dirLight.color.set("#fb923c");
      dirLight.intensity = 1.78;
      dirLight.position.set(28, 12, -8);
      hemiLight.color.set("#f97316");
      const sunVec = new THREE.Vector3(0.82, 0.28, -0.22).normalize();
      if (terrainShaderMat) {
        terrainShaderMat.uniforms.uIsSunset.value = 1.0;
        terrainShaderMat.uniforms.uSunDir.value.copy(sunVec);
      }
      if (skyShaderMat) {
        skyShaderMat.uniforms.uIsSunset.value = 1.0;
        skyShaderMat.uniforms.uSunDir.value.copy(sunVec);
      }
    } else {
      scene.background = new THREE.Color("#d6eef8");
      ambientLight.color.set("#f8fafc");
      ambientLight.intensity = 0.88;
      dirLight.color.set("#fffbeb");
      dirLight.intensity = 1.55;
      dirLight.position.set(20, 30, 14);
      hemiLight.color.set("#bae6fd");
      const sunVec = new THREE.Vector3(0.65, 0.55, 0.35).normalize();
      if (terrainShaderMat) {
        terrainShaderMat.uniforms.uIsSunset.value = 0.0;
        terrainShaderMat.uniforms.uSunDir.value.copy(sunVec);
      }
      if (skyShaderMat) {
        skyShaderMat.uniforms.uIsSunset.value = 0.0;
        skyShaderMat.uniforms.uSunDir.value.copy(sunVec);
      }
    }
    if (sceneRefs.current.renderer) {
      sceneRefs.current.renderer.shadowMap.needsUpdate = true;
    }
  }, [isSunset]);

  // ==========================================================================
  // CAPA 4: PALMERAS COCOTERAS HD DESDE ARCHIVO .GLB + CORONA ORGÁNICA
  // Carga /loom/models/palmera_caribe_hd.glb (tronco anillado + cocos + 15 pencas
  // pinnadas 3D en 3 anillos de filotaxis) e instancia las 165 palmeras a 60 FPS
  // ==========================================================================
  useEffect(() => {
    const { landscapeGroup, palmCrownTex } = sceneRefs.current;
    if (!landscapeGroup) return;

    while (landscapeGroup.children.length > 0) {
      const child = landscapeGroup.children[0] as THREE.Mesh;
      child.geometry?.dispose();
      landscapeGroup.remove(child);
    }

    if (!showTrees3D || !landscapeData) return;

    const dummy = new THREE.Object3D();
    const palmCount = landscapeData.palms.length;
    if (palmCount === 0) return;

    let cancelled = false;
    const loader = new GLTFLoader();

    loader.load(
      "/loom/models/palmera_caribe_hd.glb",
      (gltf) => {
        if (cancelled || !sceneRefs.current.landscapeGroup) return;
        const grp = sceneRefs.current.landscapeGroup;

        // Filtrar palmeras a las zonas del proyecto y frente costero de Alma Beach Club
        const filteredPalms = landscapeData.palms.filter(
          ([sx, sy]) => sx < 2820 || (sy >= 520 && sy <= 1480)
        );
        const activePalmCount = filteredPalms.length;

        if (activePalmCount > 0) {
          gltf.scene.traverse((node) => {
            if ((node as THREE.Mesh).isMesh) {
              const mesh = node as THREE.Mesh;
              const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
              // Corregir tono pálido/menta de las pencas hacia un verde palma caribeña natural y profundo
              if (mat.color.g > mat.color.r * 1.04) {
                mat.color.set(isSunset ? "#8a7a4f" : "#486e30");
                mat.roughness = 0.72;
                mat.metalness = 0.02;
              } else if (isSunset) {
                mat.color.multiply(new THREE.Color("#e8cfa8"));
              }
              const inst = new THREE.InstancedMesh(mesh.geometry, mat, activePalmCount);
              inst.castShadow = true;
              inst.receiveShadow = true;

              filteredPalms.forEach(([sx, sy, sc, rot], i) => {
                const [wx, wz] = svgToWorld(sx, sy);
                const s = sc * 0.96;
                dummy.position.set(wx, 0, wz);
                dummy.rotation.set(0, rot, 0);
                dummy.scale.set(s, s, s);
                dummy.updateMatrix();
                inst.setMatrixAt(i, dummy.matrix);
              });
              inst.instanceMatrix.needsUpdate = true;
              grp.add(inst);
            }
          });
        }

        // Árboles tropicales esculpidos multi-copa (sin esferas rayadas y solo en el borde/parques del proyecto)
        const projectTrees = (landscapeData.trees || []).filter(
          ([sx, sy]) => sy >= 590 && sy <= 1540 && sx >= 140 && sx <= 2900
        );
        if (projectTrees.length > 0) {
          const { crownGeo, trunkGeo } = createSculptedTropicalTreeGeometries();
          const treeCrownMat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            color: isSunset ? "#d9c29e" : "#ffffff",
            roughness: 0.86,
            metalness: 0.02,
          });
          const treeTrunkMat = new THREE.MeshStandardMaterial({
            color: isSunset ? "#4d3826" : "#59422e",
            roughness: 0.9,
          });

          const treeCrownInst = new THREE.InstancedMesh(crownGeo, treeCrownMat, projectTrees.length);
          const treeTrunkInst = new THREE.InstancedMesh(trunkGeo, treeTrunkMat, projectTrees.length);
          treeCrownInst.castShadow = true;
          treeCrownInst.receiveShadow = true;

          projectTrees.forEach(([sx, sy, sc, rot], idx) => {
            const [wx, wz] = svgToWorld(sx, sy);
            const s = sc * 0.64;
            dummy.position.set(wx, 0, wz);
            dummy.rotation.set(0, rot, 0);
            dummy.scale.set(s, s, s);
            dummy.updateMatrix();
            treeCrownInst.setMatrixAt(idx, dummy.matrix);
            treeTrunkInst.setMatrixAt(idx, dummy.matrix);
          });
          treeCrownInst.instanceMatrix.needsUpdate = true;
          treeTrunkInst.instanceMatrix.needsUpdate = true;
          grp.add(treeTrunkInst);
          grp.add(treeCrownInst);
        }

        if (sceneRefs.current.renderer) {
          sceneRefs.current.renderer.shadowMap.needsUpdate = true;
        }
      },
      undefined,
      (err) => console.warn("Fallback palm loader:", err)
    );

    return () => {
      cancelled = true;
    };
  }, [landscapeData, showTrees3D, isSunset]);

  // ==========================================================================
  // CAPAS 3 & 5: LOS 318 LOTES UNIFICADOS + VILLAS ARQUITECTÓNICAS DETALLADAS
  // ==========================================================================
  useEffect(() => {
    const { lotsGroup, villasGroup, telemetryGroup } = sceneRefs.current;
    if (!lotsGroup || !villasGroup || !telemetryGroup) return;

    while (lotsGroup.children.length > 0) {
      const obj = lotsGroup.children[0] as THREE.Mesh;
      obj.geometry?.dispose();
      if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
      else obj.material?.dispose();
      lotsGroup.remove(obj);
    }
    while (villasGroup.children.length > 0) {
      villasGroup.remove(villasGroup.children[0]);
    }
    while (telemetryGroup.children.length > 0) {
      telemetryGroup.remove(telemetryGroup.children[0]);
    }

    // Materiales Arquitectónicos Maadga Group (Concreto Blanco Marfil, Madera Teca, Bronce Negro y Cristal)
    const stuccoWhiteMat = new THREE.MeshStandardMaterial({
      color: isSunset ? "#f2e5d5" : "#fcfaf7",
      roughness: 0.32,
      metalness: 0.05,
    });
    const coralBaseMat = new THREE.MeshStandardMaterial({
      color: isSunset ? "#d6c3ae" : "#e3d7c8",
      roughness: 0.62,
      metalness: 0.05,
    });
    const teakWoodMat = new THREE.MeshStandardMaterial({
      color: "#9e5827",
      roughness: 0.42,
      metalness: 0.08,
    });
    const thatchBambooMat = new THREE.MeshStandardMaterial({
      color: isSunset ? "#c2935a" : "#d4aa72",
      roughness: 0.78,
      metalness: 0.02,
      side: THREE.DoubleSide,
    });
    const roofHedgeMat = new THREE.MeshStandardMaterial({
      color: isSunset ? "#315427" : "#2d5e29",
      roughness: 0.85,
    });
    const darkBronzeMat = new THREE.MeshStandardMaterial({
      color: "#1e1b18",
      roughness: 0.3,
      metalness: 0.6,
    });
    const glassWindowMat = new THREE.MeshStandardMaterial({
      color: isSunset ? "#ffd27d" : "#ffe49e",
      emissive: isSunset ? "#ff9914" : "#f59e0b",
      emissiveIntensity: isSunset ? 1.9 : 0.75,
      roughness: 0.08,
      metalness: 0.5,
    });
    const poolWaterMat = new THREE.MeshStandardMaterial({
      color: "#06b6d4",
      emissive: "#22d3ee",
      emissiveIntensity: isSunset ? 1.15 : 0.78,
      roughness: 0.04,
    });

    // Geometrías y materiales V-Ray cacheados en memoria para no recargar texturas al cambiar filtros
    if (!villaMatsCacheRef.current.unitBox) {
      villaMatsCacheRef.current.unitBox = new THREE.BoxGeometry(1, 1, 1);
    }
    const unitBox = villaMatsCacheRef.current.unitBox;
    const cacheKey = isSunset ? "sunset" : "day";
    if (!villaMatsCacheRef.current[cacheKey]) {
      villaMatsCacheRef.current[cacheKey] = createVillaReplicaMaterials(isSunset, sceneRefs.current.palmCrownTex);
    }
    const villaMats = villaMatsCacheRef.current[cacheKey]!;
    const lotMatPool = new Map<string, THREE.MeshLambertMaterial>();
    const lineMatPool = new Map<string, THREE.LineBasicMaterial>();

    // ========================================================================
    // MALOCAS ORGÁNICAS 3D DE ALMA BEACH CLUB + ETIQUETAS PÍLDORA PRINCIPALES
    // ========================================================================
    const [beachX, beachZ] = svgToWorld(2885, 895);
    const malocaGeo = new THREE.SphereGeometry(0.42, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.48);
    malocaGeo.scale(1.55, 0.38, 0.92);

    const maloca1 = new THREE.Mesh(malocaGeo, thatchBambooMat);
    maloca1.position.set(beachX - 0.36, 0.06, beachZ - 0.18);
    maloca1.rotation.y = -0.52;
    maloca1.castShadow = true;
    // maloca1 removida por solicitud del usuario

    const maloca2 = new THREE.Mesh(malocaGeo, thatchBambooMat);
    maloca2.position.set(beachX + 0.32, 0.055, beachZ + 0.24);
    maloca2.rotation.y = 0.38;
    maloca2.scale.set(0.88, 0.88, 0.88);
    maloca2.castShadow = true;
    // maloca2 removida por solicitud del usuario

    const beachPill = createFloatingPillSprite("Alma Beach Club", "#EBD9AB", 1.55, 0.38);
    beachPill.position.set(beachX + 0.15, 0.56, beachZ - 0.05);
    villasGroup.add(beachPill);

    const [gwX, gwZ] = svgToWorld(2390, 995);
    const gardenWalkPill = createFloatingPillSprite("The Garden Walk", "#10b981", 1.45, 0.36);
    gardenWalkPill.position.set(gwX, 0.52, gwZ);
    // gardenWalkPill removido por solicitud del usuario

    const [chX, chZ] = svgToWorld(2196, 972);
    const clubHousePill = createFloatingPillSprite("Club House & Oasis", "#EBD9AB", 1.55, 0.38);
    clubHousePill.position.set(chX, 0.56, chZ);
    villasGroup.add(clubHousePill);

    const [lakeX, lakeZ] = svgToWorld(2835, 1218);
    const lakePill = createFloatingPillSprite("Lago Central • Oasis", "#22d3ee", 1.48, 0.36);
    lakePill.position.set(lakeX, 0.48, lakeZ);
    villasGroup.add(lakePill);

    const [porteriaX, porteriaZ] = svgToWorld(92, 1095);
    const porteriaPill = createFloatingPillSprite(isEn ? "Loom Gatehouse" : "Portería Loom", "#EBD9AB", 1.38, 0.35);
    porteriaPill.position.set(porteriaX, 0.38, porteriaZ);
    villasGroup.add(porteriaPill);

    const [viaX, viaZ] = svgToWorld(-136, 830);
    const viaPill = createFloatingPillSprite(
      isEn ? "Vía del Mar Kilometer 23" : "Vía del Mar Kilómetro 23",
      "#fbbf24",
      1.95,
      0.38
    );
    viaPill.position.set(viaX, 0.45, viaZ);
    villasGroup.add(viaPill);

    // Vehículos 3D reales en movimiento continuo a 60 FPS entrando y saliendo por las avenidas de Loom
    animatedTrafficRef.current = [];
    if (carTemplates.length > 0) {
      const roadRoutesSpecs: {
        svgPoints: [number, number][];
        modelIdx: number;
        paintIdx: number;
        speed: number;
        phase: number;
      }[] = [
        // 1. Entrando por Portería Loom hacia el Bulevar Principal Norte
        {
          svgPoints: [[18, 1106], [140, 1085], [221, 1074], [340, 882], [920, 848]],
          modelIdx: 0,
          paintIdx: 0,
          speed: 0.34,
          phase: 0.5,
        },
        // 2. Saliendo desde el Bulevar Norte hacia Portería Loom / Vía del Mar Km 23
        {
          svgPoints: [[880, 858], [345, 892], [216, 1080], [125, 1094], [-18, 1112]],
          modelIdx: 3,
          paintIdx: 2,
          speed: 0.32,
          phase: 2.1,
        },
        // 3. Recorriendo el Bulevar Principal Norte (Etapa 1 -> Etapa 4 Club House)
        {
          svgPoints: [[350, 882], [1150, 836], [1955, 790], [2680, 748]],
          modelIdx: 1,
          paintIdx: 4,
          speed: 0.42,
          phase: 1.2,
        },
        // 4. Regresando por el Bulevar Principal Norte (Club House -> Etapa 1)
        {
          svgPoints: [[2650, 758], [1950, 798], [1150, 845], [360, 892]],
          modelIdx: 2,
          paintIdx: 1,
          speed: 0.38,
          phase: 4.8,
        },
        // 5. Avenida Diagonal Club House & Canchas de Tenis (Etapa 4 rumbo Sur)
        {
          svgPoints: [[1962, 795], [2162, 1025], [2385, 1285]],
          modelIdx: 0,
          paintIdx: 5,
          speed: 0.30,
          phase: 1.7,
        },
        // 6. Bulevar Costero frente al Club House hacia Alma Beach Club
        {
          svgPoints: [[1980, 788], [2443, 762], [2840, 738]],
          modelIdx: 1,
          paintIdx: 3,
          speed: 0.36,
          phase: 3.3,
        },
        // 7. Avenida del Lago Central (Etapa 5 saliendo hacia el Bulevar Norte)
        {
          svgPoints: [[2556, 1118], [2531, 998], [2505, 858]],
          modelIdx: 3,
          paintIdx: 0,
          speed: 0.28,
          phase: 0.9,
        },
        // 8. Avenida del Lago Central Oriental (Etapa 5 rumbo al Oasis del Lago)
        {
          svgPoints: [[2690, 842], [2725, 1008], [2762, 1168]],
          modelIdx: 2,
          paintIdx: 6,
          speed: 0.29,
          phase: 2.4,
        },
      ];

      roadRoutesSpecs.forEach((rc) => {
        const waypoints = rc.svgPoints.map(([sx, sy]) => svgToWorld(sx, sy));
        const segLengths: number[] = [];
        let totalLength = 0;
        for (let i = 0; i < waypoints.length - 1; i++) {
          const d = Math.hypot(waypoints[i + 1][0] - waypoints[i][0], waypoints[i + 1][1] - waypoints[i][1]);
          segLengths.push(d);
          totalLength += d;
        }

        const tpl = carTemplates[rc.modelIdx % carTemplates.length];
        const paintMat = villaMats.carPaintPalette[rc.paintIdx % villaMats.carPaintPalette.length];
        const roadCar = tpl.clone(true);
        roadCar.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const m = node as THREE.Mesh;
            m.castShadow = false;
            m.receiveShadow = false;
            if (((m.material as THREE.Material)?.name || "") === "BodyPaint") {
              m.material = paintMat;
            }
          }
        });
        const roadCarScale = 0.0315;
        const [rx0, rz0] = waypoints[0];
        roadCar.scale.set(roadCarScale, roadCarScale, roadCarScale);
        roadCar.position.set(rx0, 0.005, rz0);
        roadCar.matrixAutoUpdate = false;
        roadCar.updateMatrix();
        villasGroup.add(roadCar);

        const shadowMesh = new THREE.Mesh(unitBox, villaMats.darkBronzeMat);
        shadowMesh.scale.set(0.105, 0.002, 0.044);
        shadowMesh.position.set(rx0, 0.004, rz0);
        shadowMesh.matrixAutoUpdate = false;
        shadowMesh.updateMatrix();
        villasGroup.add(shadowMesh);

        animatedTrafficRef.current.push({
          carObj: roadCar,
          shadowObj: shadowMesh,
          waypoints,
          segLengths,
          totalLength,
          speed: rc.speed,
          phaseOffset: rc.phase,
        });
      });
    }

    const batchedBorderSegments = new Map<string, { col: string; op: number; coords: number[] }>();
    const batchedLotGeos = new Map<string, { mat: THREE.MeshLambertMaterial; geos: THREE.BufferGeometry[] }>();

    const instVillaMatrices: THREE.Matrix4[] = [];
    const instPatioPalmMatrices: THREE.Matrix4[] = [];
    const instCarShadows: THREE.Matrix4[] = [];
    const instParkedCarsByModel: { matrix: THREE.Matrix4; paintColor: THREE.Color }[][] = carTemplates.map(() => []);

    const dummyVilla = new THREE.Object3D();
    const dummyChild = new THREE.Object3D();
    const mat4VillaBase = new THREE.Matrix4();

    unifiedLots.forEach((pLot, lotIndex) => {
      const lotData = lotsMap[pLot.id];
      if (!lotData) return;

      const [wx, wz] = svgToWorld(pLot.cx, pLot.cy);
      const ww = (pLot.width / 3840) * WORLD_W;
      const wd = (pLot.height / 2160) * WORLD_D;

      const isSelected = false;
      const isAmenity = pLot.isAmenity || lotData.status === "common";
      const isCurrentStage = focusMode === "all" || pLot.stageId === stageId;

      const isShowcaseVilla =
        villaMode === "all" ||
        (villaMode === "showcase" && (isSelected || (lotIndex * 7 + 3) % 11 < 5));

      let fillColor = "#10b981";
      let dimmed = !isCurrentStage;

      if (isAmenity) {
        fillColor = "#c27838";
      } else if (colorMode === "status") {
        if (lotData.status === "available") fillColor = "#10b981";
        else if (lotData.status === "blocked" || lotData.status === "reserved")
          fillColor = "#f59e0b";
        else fillColor = "#ef4444";
      } else if (colorMode === "area") {
        const tier = getAreaTier(lotData.areaNumeric);
        fillColor = tier.fillHex;
        if (activeAreaFilter !== "all" && tier.key !== activeAreaFilter) {
          dimmed = true;
        }
      } else if (colorMode === "typology") {
        const isCorner = (lotData.location || "").toUpperCase().includes("ESQUINERO");
        fillColor = isCorner ? "#f59e0b" : "#14b8a6";
      }

      const extrudeHeight = isSelected ? 0.045 : 0.014;
      const opacity = dimmed
        ? 0.08
        : isSelected
        ? 0.42
        : isShowcaseVilla
        ? 0.18
        : 0.34;

      let geometry: THREE.BufferGeometry;
      const borderPoints: THREE.Vector3[] = [];
      const worldVerts: [number, number][] = [];

      if (pLot.vertices.length >= 3) {
        const shape = new THREE.Shape();
        pLot.vertices.forEach(([vx, vy], idx) => {
          const [px, pz] = svgToWorld(vx, vy);
          worldVerts.push([px, pz]);
          const localX = px - wx;
          const localY = -(pz - wz);
          if (idx === 0) shape.moveTo(localX, localY);
          else shape.lineTo(localX, localY);
          borderPoints.push(new THREE.Vector3(px, extrudeHeight + 0.005, pz));
        });
        shape.closePath();
        geometry = new THREE.ExtrudeGeometry(shape, {
          depth: extrudeHeight,
          bevelEnabled: false,
        });
      } else {
        geometry = new THREE.BoxGeometry(ww * 0.85, wd * 0.85, extrudeHeight);
      }

      // Transformar geometría del lote al espacio mundial para fusionarla por material (reduce 318 draw calls a ~5)
      geometry.rotateX(-Math.PI / 2);
      geometry.translate(wx, 0.004, wz);

      const matColor = isSelected ? "#f59e0b" : fillColor;
      const emissiveCol = isSelected ? "#fbbf24" : fillColor;
      const emissiveInt = isSelected ? 0.75 : isSunset ? 0.35 : 0.22;
      const matKey = `${matColor}_${emissiveInt}_${opacity}`;
      let mat = lotMatPool.get(matKey);
      if (!mat) {
        mat = new THREE.MeshLambertMaterial({
          color: matColor,
          emissive: emissiveCol,
          emissiveIntensity: emissiveInt,
          transparent: true,
          opacity,
        });
        lotMatPool.set(matKey, mat);
      }

      let lotBatch = batchedLotGeos.get(matKey);
      if (!lotBatch) {
        lotBatch = { mat, geos: [] };
        batchedLotGeos.set(matKey, lotBatch);
      }
      lotBatch.geos.push(geometry);

      if (borderPoints.length >= 3) {
        const lCol = isSelected ? "#fde047" : fillColor;
        const lOp = dimmed ? 0.22 : 0.92;
        const lKey = `${lCol}_${lOp}`;
        let bucket = batchedBorderSegments.get(lKey);
        if (!bucket) {
          bucket = { col: lCol, op: lOp, coords: [] };
          batchedBorderSegments.set(lKey, bucket);
        }
        for (let i = 0; i < borderPoints.length; i++) {
          const pA = borderPoints[i];
          const pB = borderPoints[(i + 1) % borderPoints.length];
          bucket.coords.push(pA.x, pA.y, pA.z, pB.x, pB.y, pB.z);
        }
      }

      // ======================================================================
      // CAPA 5: ARQUITECTURA DE VILLA BIOCLIMÁTICA INSTANCIADA A 60 FPS
      // ======================================================================
      if (isShowcaseVilla && !isAmenity && worldVerts.length >= 3) {
        let bestLen = 0;
        let lotAngle = -0.68;
        for (let i = 0; i < worldVerts.length; i++) {
          const [x1, z1] = worldVerts[i];
          const [x2, z2] = worldVerts[(i + 1) % worldVerts.length];
          const segLen = Math.hypot(x2 - x1, z2 - z1);
          if (segLen > bestLen) {
            bestLen = segLen;
            lotAngle = Math.atan2(z2 - z1, x2 - x1);
          }
        }

        const L = pLot.villaL ? (pLot.villaL / 100) * 0.98 : Math.max(0.52, bestLen * 0.92);
        const W = pLot.villaW ? (pLot.villaW / 100) * 0.98 : L * 0.47;
        const H = L * 0.3583;
        const zHouse = -W * 0.016;
        const wHouse = W * 0.653;

        const [vwx, vwz] =
          pLot.villaCx !== undefined && pLot.villaCy !== undefined
            ? svgToWorld(pLot.villaCx, pLot.villaCy)
            : [wx, wz];
        const rotY = pLot.backAngle !== undefined ? -pLot.backAngle : -lotAngle;

        // Matriz base (sin escala) para posicionar hijos (palmera de patio y vehículos estacionados)
        dummyVilla.position.set(vwx, extrudeHeight + 0.005, vwz);
        dummyVilla.rotation.set(0, rotY, 0);
        dummyVilla.scale.set(1, 1, 1);
        dummyVilla.updateMatrix();
        mat4VillaBase.copy(dummyVilla.matrix);

        // Matriz escalada [L, H, W] para los 24 bloques canónicos de la villa
        dummyVilla.scale.set(L, H, W);
        dummyVilla.updateMatrix();
        instVillaMatrices.push(dummyVilla.matrix.clone());

        // Corona de palmera interior del patio bioclimático
        if (villaMats.palmCrownTexMat) {
          const palmX = L * 0.005;
          const palmZ = zHouse + wHouse * 0.12;
          dummyChild.position.set(palmX + L * 0.01, H * 1.15, palmZ + W * 0.006);
          dummyChild.rotation.set(0, 0, 0);
          dummyChild.scale.set(L * 0.46, L * 0.46, L * 0.46);
          dummyChild.updateMatrix();
          dummyChild.matrix.premultiply(mat4VillaBase);
          instPatioPalmMatrices.push(dummyChild.matrix.clone());
        }

        // Vehículos estacionados en el carport de la villa (InstancedMesh por modelo)
        if (carTemplates.length > 0) {
          const carSlots = [zHouse - wHouse * 0.225, zHouse + wHouse * 0.215];
          const hasSecondCar = (lotIndex * 5 + 1) % 7 !== 0;
          const activeSlots = hasSecondCar ? carSlots : [carSlots[lotIndex % 2]];

          activeSlots.forEach((carZ, slotIdx) => {
            const modelIdx = (lotIndex + slotIdx * 2 + (slotIdx === 1 ? 1 : 0)) % carTemplates.length;
            const paintMat =
              villaMats.carPaintPalette[
                (lotIndex * 3 + slotIdx * 5 + modelIdx) % villaMats.carPaintPalette.length
              ];

            dummyChild.position.set(-L * 0.352, 0.0145, carZ);
            dummyChild.rotation.set(0, 0, 0);
            dummyChild.scale.set(L * 0.142, 0.002, W * 0.118);
            dummyChild.updateMatrix();
            dummyChild.matrix.premultiply(mat4VillaBase);
            instCarShadows.push(dummyChild.matrix.clone());

            const carScale = L * 0.0415;
            dummyChild.position.set(-L * 0.352, 0.015, carZ);
            dummyChild.rotation.set(0, (lotIndex + slotIdx) % 2 === 0 ? Math.PI : 0, 0);
            dummyChild.scale.set(carScale, carScale, carScale);
            dummyChild.updateMatrix();
            dummyChild.matrix.premultiply(mat4VillaBase);
            instParkedCarsByModel[modelIdx].push({
              matrix: dummyChild.matrix.clone(),
              paintColor: paintMat.color,
            });
          });
        }
      }
    });

    // 1. Añadir lotes fusionados por material (4-5 draw calls en lugar de 318)
    batchedLotGeos.forEach((batch) => {
      if (batch.geos.length === 0) return;
      const mergedLotGeo = mergeSimpleBufferGeometries(batch.geos);
      if (batch.geos.length > 1) {
        batch.geos.forEach((g) => g.dispose());
      }
      const batchMesh = new THREE.Mesh(mergedLotGeo, batch.mat);
      batchMesh.matrixAutoUpdate = false;
      lotsGroup.add(batchMesh);
    });

    // 2. Añadir todas las Villas 3D mediante InstancedMesh (~24 draw calls en lugar de ~11,000)
    if (instVillaMatrices.length > 0) {
      const canonicalSpecs = getOrBuildCanonicalVillaMeshes(villaMats);
      const vCount = instVillaMatrices.length;
      for (let s = 0; s < canonicalSpecs.length; s++) {
        const spec = canonicalSpecs[s];
        const instMesh = new THREE.InstancedMesh(spec.geo, spec.mat, vCount);
        instMesh.castShadow = spec.castShadow;
        instMesh.receiveShadow = true;
        for (let i = 0; i < vCount; i++) {
          instMesh.setMatrixAt(i, instVillaMatrices[i]);
        }
        instMesh.instanceMatrix.needsUpdate = true;
        villasGroup.add(instMesh);
      }
    }

    // 3. Añadir coronas de palmera de patio interior en 1 solo InstancedMesh
    if (instPatioPalmMatrices.length > 0 && villaMats.palmCrownTexMat) {
      const palmInst = new THREE.InstancedMesh(
        villaMats.palmCrownGeo,
        villaMats.palmCrownTexMat,
        instPatioPalmMatrices.length
      );
      palmInst.castShadow = true;
      for (let i = 0; i < instPatioPalmMatrices.length; i++) {
        palmInst.setMatrixAt(i, instPatioPalmMatrices[i]);
      }
      palmInst.instanceMatrix.needsUpdate = true;
      villasGroup.add(palmInst);
    }

    // 4. Añadir sombras y vehículos estacionados en las villas mediante InstancedMesh (~20 draw calls en lugar de ~1,700)
    if (instCarShadows.length > 0) {
      const shadowInst = new THREE.InstancedMesh(unitBox, villaMats.darkBronzeMat, instCarShadows.length);
      for (let i = 0; i < instCarShadows.length; i++) {
        shadowInst.setMatrixAt(i, instCarShadows[i]);
      }
      shadowInst.instanceMatrix.needsUpdate = true;
      villasGroup.add(shadowInst);
    }

    const instBodyPaintBaseMat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 0.16,
      metalness: 0.42,
      envMapIntensity: 1.35,
    });

    instParkedCarsByModel.forEach((instances, modelIdx) => {
      if (instances.length === 0 || !carTemplates[modelIdx]) return;
      const tpl = carTemplates[modelIdx];
      tpl.updateMatrixWorld(true);
      const count = instances.length;
      const combinedMat = new THREE.Matrix4();

      tpl.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          const mName = (mesh.material as THREE.Material)?.name || "";
          const isBodyPaint = mName === "BodyPaint";
          const useMat = isBodyPaint ? instBodyPaintBaseMat : mesh.material;
          const inst = new THREE.InstancedMesh(mesh.geometry, useMat, count);
          inst.castShadow = false;
          inst.receiveShadow = false;

          for (let i = 0; i < count; i++) {
            combinedMat.multiplyMatrices(instances[i].matrix, mesh.matrixWorld);
            inst.setMatrixAt(i, combinedMat);
            if (isBodyPaint) {
              inst.setColorAt(i, instances[i].paintColor);
            }
          }
          inst.instanceMatrix.needsUpdate = true;
          if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
          villasGroup.add(inst);
        }
      });
    });

    // 5. Renderizar todos los bordes perimetrales de los 318 lotes en 3-4 llamadas agrupadas (LineSegments)
    batchedBorderSegments.forEach((bucket, lKey) => {
      if (bucket.coords.length === 0) return;
      const segGeo = new THREE.BufferGeometry();
      segGeo.setAttribute("position", new THREE.Float32BufferAttribute(bucket.coords, 3));
      let lineMat = lineMatPool.get(lKey);
      if (!lineMat) {
        lineMat = new THREE.LineBasicMaterial({
          color: bucket.col,
          transparent: true,
          opacity: bucket.op,
        });
        lineMatPool.set(lKey, lineMat);
      }
      const lineSegs = new THREE.LineSegments(segGeo, lineMat);
      lineSegs.matrixAutoUpdate = false;
      villasGroup.add(lineSegs);
    });

    if (sceneRefs.current.renderer) {
      sceneRefs.current.renderer.shadowMap.needsUpdate = true;
    }
  }, [unifiedLots, lotsMap, stageId, focusMode, colorMode, activeAreaFilter, villaMode, isSunset, carTemplates]);

  // Efecto ultra-rápido (< 1ms) exclusivo para el lote seleccionado: no reconstruye las 140 villas ni los 318 lotes
  useEffect(() => {
    const { telemetryGroup } = sceneRefs.current;
    if (!telemetryGroup) return;
    while (telemetryGroup.children.length > 0) {
      telemetryGroup.remove(telemetryGroup.children[0]);
    }
    if (!selectedLot || unifiedLots.length === 0) return;

    const lotIndex = unifiedLots.findIndex((p) => p.id === selectedLot.id);
    if (lotIndex === -1) return;
    const pLot = unifiedLots[lotIndex];
    const lotData = lotsMap[pLot.id];
    if (!lotData) return;

    const [wx, wz] = svgToWorld(pLot.cx, pLot.cy);
    const ww = (pLot.width / 3840) * WORLD_W;
    const wd = (pLot.height / 2160) * WORLD_D;
    const isAmenity = pLot.isAmenity || lotData.status === "common";
    const [beachX, beachZ] = svgToWorld(2885, 895);

    if (pLot.vertices.length >= 3) {
      const selBorderPts = pLot.vertices.map(([vx, vy]) => {
        const [px, pz] = svgToWorld(vx, vy);
        return new THREE.Vector3(px, 0.048, pz);
      });
      const selLineGeo = new THREE.BufferGeometry().setFromPoints(selBorderPts);
      const selLineMat = new THREE.LineBasicMaterial({ color: "#fde047" });
      telemetryGroup.add(new THREE.LineLoop(selLineGeo, selLineMat));
    }

    if (!isAmenity) {
      const labelStr = `${lotData.rawId} • ${lotData.areaNumeric || lotData.area}`;
      const selPill = createFloatingPillSprite(labelStr, "#fde047", 0.95, 0.26);
      selPill.position.set(wx, villaMode !== "off" ? 0.42 : 0.14, wz);
      telemetryGroup.add(selPill);
    }

    // Si en modo "showcase" el lote seleccionado no tenía villa de muestra, renderizar su villa en telemetryGroup
    const alreadyHasVilla =
      villaMode === "all" || (villaMode === "showcase" && (lotIndex * 7 + 3) % 11 < 5);
    if (villaMode === "showcase" && !alreadyHasVilla && !isAmenity && pLot.vertices.length >= 3) {
      const cacheKey = isSunset ? "sunset" : "day";
      const villaMats = villaMatsCacheRef.current[cacheKey];
      const unitBox = villaMatsCacheRef.current.unitBox;
      if (villaMats && unitBox) {
        const L = pLot.villaL ? (pLot.villaL / 100) * 0.98 : 0.72;
        const W = pLot.villaW ? (pLot.villaW / 100) * 0.98 : L * 0.47;
        const villaGrp = new THREE.Group();
        const [vwx, vwz] =
          pLot.villaCx !== undefined && pLot.villaCy !== undefined
            ? svgToWorld(pLot.villaCx, pLot.villaCy)
            : [wx, wz];
        villaGrp.position.set(vwx, 0.05, vwz);
        villaGrp.rotation.y = pLot.backAngle !== undefined ? -pLot.backAngle : 0;
        villaGrp.matrixAutoUpdate = false;
        villaGrp.updateMatrix();
        buildLoomVillaReplica3D(villaGrp, L, W, villaMats, unitBox, lotIndex, carTemplates);
        telemetryGroup.add(villaGrp);
        if (sceneRefs.current.renderer) {
          sceneRefs.current.renderer.shadowMap.needsUpdate = true;
        }
      }
    }

    const solarCurvePts: THREE.Vector3[] = [];
    const radius = Math.max(ww, wd) * 0.95;
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI;
      solarCurvePts.push(
        new THREE.Vector3(
          wx + Math.cos(angle) * radius,
          0.18 + Math.sin(angle) * (radius * 0.85),
          wz - 0.1
        )
      );
    }
    const solarGeo = new THREE.BufferGeometry().setFromPoints(solarCurvePts);
    const solarMat = new THREE.LineBasicMaterial({ color: "#fbbf24" });
    telemetryGroup.add(new THREE.Line(solarGeo, solarMat));

    const sunOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 16, 16),
      new THREE.MeshBasicMaterial({ color: "#fde047" })
    );
    sunOrb.position.set(
      wx + Math.cos(Math.PI * 0.38) * radius,
      0.18 + Math.sin(Math.PI * 0.38) * (radius * 0.85),
      wz - 0.1
    );
    telemetryGroup.add(sunOrb);

    const breezeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(wx + radius * 1.1, 0.42, wz - radius * 0.85),
      new THREE.Vector3(wx + radius * 0.35, 0.34, wz - radius * 0.3),
      new THREE.Vector3(wx - radius * 0.55, 0.26, wz + radius * 0.45),
    ]);
    const breezeGeo = new THREE.TubeGeometry(breezeCurve, 24, 0.02, 8, false);
    const breezeMat = new THREE.MeshBasicMaterial({ color: "#22d3ee" });
    telemetryGroup.add(new THREE.Mesh(breezeGeo, breezeMat));

    if (!isAmenity) {
      const distWorld = Math.hypot(beachX - wx, beachZ - wz);
      const distMeters = Math.max(25, Math.round(distWorld * 22));
      const midX = (wx + beachX) * 0.5;
      const midZ = (wz + beachZ) * 0.5;
      const walkArc = new THREE.CatmullRomCurve3([
        new THREE.Vector3(wx, 0.16, wz),
        new THREE.Vector3(midX, 0.45 + distWorld * 0.04, midZ),
        new THREE.Vector3(beachX, 0.18, beachZ),
      ]);
      const walkGeo = new THREE.BufferGeometry().setFromPoints(walkArc.getPoints(36));
      const walkMat = new THREE.LineBasicMaterial({
        color: "#fde047",
        transparent: true,
        opacity: 0.78,
      });
      telemetryGroup.add(new THREE.Line(walkGeo, walkMat));

      const walkPill = createFloatingPillSprite(
        isEn ? `${distMeters}m to Alma Beach` : `A ~${distMeters}m de Playa Alma`,
        "#22d3ee",
        1.45,
        0.34
      );
      walkPill.position.set(wx, 0.72, wz);
      telemetryGroup.add(walkPill);
    }
  }, [selectedLot, unifiedLots, lotsMap, villaMode, isSunset, isEn, carTemplates]);

  useEffect(() => {
    sceneRefs.current.desiredPos.set(...activePreset.position);
    sceneRefs.current.desiredTarget.set(...activePreset.target);
    sceneRefs.current.isFlying = true;
  }, [activePreset]);

  useEffect(() => {
    if (!selectedLot) return;
    const found = unifiedLots.find((p) => p.id === selectedLot.id);
    if (!found) return;
    const [wx, wz] = svgToWorld(found.cx, found.cy);
    sceneRefs.current.desiredTarget.set(wx, 0.18, wz);
    sceneRefs.current.desiredPos.set(wx + 2.8, 3.8, wz + 4.4);
    sceneRefs.current.isFlying = true;
  }, [selectedLot, unifiedLots]);

  const [isExportingMap, setIsExportingMap] = useState(false);

  const handleDownloadAvailabilityMap = async () => {
    if (isExportingMap || unifiedLots.length === 0) return;
    setIsExportingMap(true);
    try {
      const loadImg = (src: string) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const im = new Image();
          im.crossOrigin = "anonymous";
          im.onload = () => resolve(im);
          im.onerror = reject;
          im.src = src;
        });

      const [bgImg, logoImg] = await Promise.all([
        loadImg("/loom/loom_masterplan_bg.webp"),
        loadImg("/loom/logo_loom.png"),
      ]);

      const W = 2800;
      const HEADER_H = 168;
      const FOOTER_H = 100;
      const PAD_X = 40;
      const MAP_W = W - PAD_X * 2;

      // Recorte panorámico ultra-enfocado al proyecto + encabezados de etapas + Club de Playa
      const SX = 45;
      const SY = 585;
      const SW = 3405;
      const SH = 910;
      const MAP_H = Math.round(MAP_W * (SH / SW));
      const H = HEADER_H + MAP_H + FOOTER_H;

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Fondo general en Marfil Natural & Arena Cálida Oficial Loom (#EDE7E0 -> #E5DDD2)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, "#EFE9E1");
      bgGrad.addColorStop(1, "#E5DCD1");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 2. Viewport del Masterplan con esquinas redondeadas (20px)
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(PAD_X, HEADER_H, MAP_W, MAP_H, 20);
      ctx.clip();

      ctx.drawImage(bgImg, SX, SY, SW, SH, PAD_X, HEADER_H, MAP_W, MAP_H);

      // Viñeta cálida espresso en bordes superior/inferior para resaltar píldoras tipo Brochure Loom
      const topGrad = ctx.createLinearGradient(0, HEADER_H, 0, HEADER_H + 105);
      topGrad.addColorStop(0, "rgba(28, 20, 14, 0.54)");
      topGrad.addColorStop(1, "rgba(28, 20, 14, 0)");
      ctx.fillStyle = topGrad;
      ctx.fillRect(PAD_X, HEADER_H, MAP_W, 105);

      const botGrad = ctx.createLinearGradient(0, HEADER_H + MAP_H - 85, 0, HEADER_H + MAP_H);
      botGrad.addColorStop(0, "rgba(28, 20, 14, 0)");
      botGrad.addColorStop(1, "rgba(28, 20, 14, 0.54)");
      ctx.fillStyle = botGrad;
      ctx.fillRect(PAD_X, HEADER_H + MAP_H - 85, MAP_W, 85);

      let countAvail = 0;
      let countRes = 0;
      let countSold = 0;

      const mapX = (svgX: number) => PAD_X + ((svgX - SX) / SW) * MAP_W;
      const mapY = (svgY: number) => HEADER_H + ((svgY - SY) / SH) * MAP_H;

      // 3. Dibujar polígonos de lotes con la paleta bioclimática oficial de Loom
      unifiedLots.forEach((pLot) => {
        if (!pLot.vertices || pLot.vertices.length < 3) return;
        const lotData = lotsMap[pLot.id];
        const status = lotData?.status || (pLot.isAmenity ? "common" : "available");
        const isAmenity = pLot.isAmenity || status === "common";
        if (isAmenity) return;

        if (status === "available") countAvail++;
        else if (status === "blocked" || status === "reserved") countRes++;
        else if (status === "sold") countSold++;

        const isSel = selectedLot?.id === pLot.id;

        ctx.beginPath();
        pLot.vertices.forEach(([vx, vy], i) => {
          const px = mapX(vx);
          const py = mapY(vy);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();

        if (isSel) {
          ctx.fillStyle = "rgba(235, 217, 171, 0.85)";
          ctx.strokeStyle = "#FFFFFF";
          ctx.lineWidth = 3.2;
        } else if (status === "available") {
          // Salvia Bioclimático Loom (#3E8E76)
          ctx.fillStyle = "rgba(62, 142, 118, 0.64)";
          ctx.strokeStyle = "rgba(212, 245, 233, 0.92)";
          ctx.lineWidth = 1.8;
        } else if (status === "blocked" || status === "reserved") {
          // Ocre Sol Loom (#D48E26)
          ctx.fillStyle = "rgba(212, 142, 38, 0.68)";
          ctx.strokeStyle = "rgba(253, 230, 138, 0.96)";
          ctx.lineWidth = 1.8;
        } else {
          // Cobre Terracota Oficial Loom (#B34E27)
          ctx.fillStyle = "rgba(179, 78, 39, 0.68)";
          ctx.strokeStyle = "rgba(245, 208, 190, 0.90)";
          ctx.lineWidth = 1.8;
        }
        ctx.fill();
        ctx.stroke();

        const rawCode = (lotData?.rawId || pLot.id).replace(/^etapa_\d+_/i, "").toUpperCase();
        const cx = mapX(pLot.cx);
        const cy = mapY(pLot.cy);
        ctx.save();
        ctx.font = isSel
          ? "700 15px 'Galano Grotesque', -apple-system, BlinkMacSystemFont, sans-serif"
          : "700 12.5px 'Galano Grotesque', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(24, 16, 10, 0.72)";
        ctx.shadowBlur = 2.5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = isSel ? "#3B2210" : "#FFFDF9";
        ctx.fillText(rawCode, cx, cy);
        ctx.restore();
      });

      // 4. Píldoras de Etapas y Amenidades estilo Brochure Oficial Loom (Marfil #F5F1EC + Cobre #B35F27 + línea punteada)
      const topCallouts = [
        { title: "ETAPA 1", sub: "MANZANAS A · B · C", svgX: 450, svgY: 692, targetY: 798, copper: false },
        { title: "ETAPA 2", sub: "MANZANAS D · E", svgX: 920, svgY: 678, targetY: 782, copper: false },
        { title: "ETAPA 3", sub: "MANZANAS F · G", svgX: 1390, svgY: 664, targetY: 766, copper: false },
        { title: "ETAPA 4", sub: "MANZANAS H · I", svgX: 1845, svgY: 650, targetY: 748, copper: false },
        { title: "CLUB HOUSE & OASIS", sub: "WELLNESS · PISCINAS", svgX: 2235, svgY: 640, targetY: 742, copper: true },
        { title: "ETAPA 5", sub: "MANZANAS J · K · L", svgX: 2650, svgY: 630, targetY: 722, copper: false },
        { title: "ALMA BEACH CLUB", sub: "SALIDA DIRECTA AL MAR", svgX: 3130, svgY: 622, targetY: 706, copper: true },
      ];

      topCallouts.forEach((c) => {
        const bx = mapX(c.svgX);
        const by = mapY(c.svgY);
        const ty = mapY(c.targetY);
        const pw = c.copper ? 210 : 172;
        const ph = 40;
        const x0 = bx - pw / 2;
        const y0 = by - ph / 2;

        ctx.save();
        ctx.strokeStyle = "rgba(245, 241, 236, 0.9)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(bx, y0 + ph + 2);
        ctx.lineTo(bx, ty - 5);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#B35F27";
        ctx.strokeStyle = "#F5F1EC";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(bx, ty, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = c.copper ? "rgba(179, 95, 39, 0.95)" : "rgba(245, 241, 236, 0.95)";
        ctx.strokeStyle = c.copper ? "rgba(237, 231, 224, 0.96)" : "rgba(179, 95, 39, 0.78)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x0, y0, pw, ph, 20);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "700 13px 'Galano Grotesque', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = c.copper ? "#FFFDF9" : "#3B2210";
        ctx.fillText(c.title, bx, y0 + 13);

        ctx.font = "500 10px 'Galano Grotesque', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = c.copper ? "#EBD9AB" : "#8A5229";
        ctx.fillText(c.sub, bx, y0 + 28);
      });

      // Hitos inferiores en Marfil Natural & Cobre Terracota
      const bottomLandmarks = [
        { label: "PORTERÍA PRINCIPAL · VÍA AL MAR", svgX: 340, svgY: 1445 },
        { label: "THE GARDEN WALK · CORREDOR BIOCLIMÁTICO", svgX: 1380, svgY: 1445 },
        { label: "LAGO LOOM & RESERVA NATURAL", svgX: 2440, svgY: 1445 },
      ];
      bottomLandmarks.forEach((lm) => {
        const bx = mapX(lm.svgX);
        const by = mapY(lm.svgY);
        const pw = 310;
        const ph = 30;
        const x0 = bx - pw / 2;
        const y0 = by - ph / 2;

        ctx.fillStyle = "rgba(245, 241, 236, 0.93)";
        ctx.strokeStyle = "rgba(179, 95, 39, 0.75)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(x0, y0, pw, ph, 15);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#B35F27";
        ctx.beginPath();
        ctx.arc(x0 + 17, by, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "600 10.5px 'Galano Grotesque', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillStyle = "#3B2210";
        ctx.fillText(lm.label, bx + 8, by + 0.5);
      });

      // Rosa de los Vientos en Marfil & Cobre Terracota (Norte orientado hacia la derecha / Playa)
      const compX = PAD_X + 58;
      const compY = HEADER_H + MAP_H - 46;
      ctx.fillStyle = "rgba(245, 241, 236, 0.93)";
      ctx.strokeStyle = "rgba(179, 95, 39, 0.86)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(compX, compY, 27, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#B35F27";
      ctx.beginPath();
      ctx.moveTo(compX + 18, compY);
      ctx.lineTo(compX - 3, compY - 5.5);
      ctx.lineTo(compX + 2, compY);
      ctx.lineTo(compX - 3, compY + 5.5);
      ctx.closePath();
      ctx.fill();

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "700 10.5px 'Galano Grotesque', sans-serif";
      ctx.fillStyle = "#3B2210";
      ctx.fillText("N", compX - 12, compY + 0.5);

      ctx.restore(); // Fin del clip del mapa

      // Doble marco Cobre Terracota alrededor del Masterplan
      ctx.strokeStyle = "rgba(179, 95, 39, 0.82)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(PAD_X, HEADER_H, MAP_W, MAP_H, 20);
      ctx.stroke();

      ctx.strokeStyle = "rgba(179, 95, 39, 0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(PAD_X - 4, HEADER_H - 4, MAP_W + 8, MAP_H + 8, 23);
      ctx.stroke();

      // 5. HEADER EDITORIAL SUPERIOR: Logo Oficial en Espresso/Cobre + Tipografía Branch + 4 Tarjetas KPI
      const logoH = 100;
      const logoW = Math.round(logoImg.width * (logoH / logoImg.height));
      const logoX = PAD_X + 12;
      const logoY = Math.round((HEADER_H - logoH) / 2);

      // Tintar logo_loom.png al tono Espresso/Cobre oficial del Brochure (#733A16) sobre fondo Marfil
      const logoCanvas = document.createElement("canvas");
      logoCanvas.width = logoW;
      logoCanvas.height = logoH;
      const lCtx = logoCanvas.getContext("2d");
      if (lCtx) {
        lCtx.drawImage(logoImg, 0, 0, logoW, logoH);
        lCtx.globalCompositeOperation = "source-in";
        lCtx.fillStyle = "#733A16";
        lCtx.fillRect(0, 0, logoW, logoH);
        ctx.drawImage(logoCanvas, logoX, logoY);
      } else {
        ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
      }

      const divX = logoX + logoW + 34;
      ctx.strokeStyle = "rgba(179, 95, 39, 0.44)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(divX, 34);
      ctx.lineTo(divX, HEADER_H - 34);
      ctx.stroke();

      const tx = divX + 32;
      const nowStr = new Date().toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#B35F27";
      ctx.font = "700 12.5px 'Galano Grotesque', -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("URBANISMO GENERAL   ·   REPORTE DE INVENTARIO EN TIEMPO REAL", tx, 34);

      ctx.fillStyle = "#3B2210";
      ctx.font = "400 35px 'Branch', Georgia, 'Times New Roman', serif";
      ctx.fillText("MAPA OFICIAL DE DISPONIBILIDAD", tx, 56);

      ctx.fillStyle = "#705C4C";
      ctx.font = "400 15px 'Galano Grotesque', -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(
        `Playa Alma · Vía al Mar Km 23, Zona Norte (Cartagena de Indias)   |   Corte: ${nowStr}`,
        tx,
        108
      );

      // 4 Tarjetas KPI en paleta oficial Loom (Marfil #F8F5F0 + Salvia + Ocre + Cobre + Espresso)
      const totalLots = Math.max(1, countAvail + countRes + countSold);
      const pctAvail = Math.round((countAvail / totalLots) * 100);
      const pctRes = Math.round((countRes / totalLots) * 100);
      const pctSold = 100 - pctAvail - pctRes;

      const kpis = [
        {
          num: String(countAvail),
          badge: `${pctAvail}%`,
          label: "LOTES DISPONIBLES",
          accent: "#3E8E76",
          badgeBg: "#E0F2EB",
          border: "rgba(62, 142, 118, 0.56)",
          numCol: "#225848",
          textSub: "#347662",
        },
        {
          num: String(countRes),
          badge: `${pctRes}%`,
          label: "RESERVADOS",
          accent: "#D48E26",
          badgeBg: "#FCF1DA",
          border: "rgba(212, 142, 38, 0.58)",
          numCol: "#925810",
          textSub: "#A86814",
        },
        {
          num: String(countSold),
          badge: `${pctSold}%`,
          label: "LOTES VENDIDOS",
          accent: "#B34E27",
          badgeBg: "#F8E7DE",
          border: "rgba(179, 78, 39, 0.58)",
          numCol: "#883418",
          textSub: "#9E401E",
        },
        {
          num: String(countAvail + countRes + countSold),
          badge: "6 ETAPAS",
          label: "TOTAL UNIDADES",
          accent: "#5C3314",
          badgeBg: "#EDE4D8",
          border: "rgba(140, 102, 72, 0.58)",
          numCol: "#3B2210",
          textSub: "#5C3314",
        },
      ];

      const cardW = 222;
      const cardH = 102;
      const cardGap = 16;
      const startX = W - PAD_X - (cardW * kpis.length + cardGap * (kpis.length - 1));
      const cardY = Math.round((HEADER_H - cardH) / 2);

      kpis.forEach((k, idx) => {
        const cx0 = startX + idx * (cardW + cardGap);
        const cy0 = cardY;

        ctx.fillStyle = "#F8F5F0";
        ctx.strokeStyle = k.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cx0, cy0, cardW, cardH, 14);
        ctx.fill();
        ctx.stroke();

        // Barra superior de acento
        ctx.fillStyle = k.accent;
        ctx.beginPath();
        ctx.roundRect(cx0 + 18, cy0 + 1, cardW - 36, 4, 2);
        ctx.fill();

        // Número principal en Branch
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = k.numCol;
        ctx.font = "400 38px 'Branch', Georgia, serif";
        ctx.fillText(k.num, cx0 + 20, cy0 + 14);

        // Píldora de porcentaje / etapas
        const bw = idx === 3 ? 84 : 54;
        const bh = 26;
        const bx0 = cx0 + cardW - bw - 16;
        const by0 = cy0 + 23;
        ctx.fillStyle = k.badgeBg;
        ctx.strokeStyle = k.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bx0, by0, bw, bh, 13);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = k.textSub;
        ctx.font = "600 12.5px 'Galano Grotesque', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(k.badge, bx0 + bw / 2, by0 + bh / 2 + 0.5);

        // Subtítulo de tarjeta
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillStyle = k.textSub;
        ctx.font = "600 11.5px 'Galano Grotesque', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(k.label, cx0 + 20, cy0 + 70);
      });

      // 6. FOOTER EDITORIAL INFERIOR
      const fy = HEADER_H + MAP_H;
      const cyFoot = fy + FOOTER_H / 2;

      if (selectedLot) {
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#5C3314";
        ctx.font = "700 15.5px 'Galano Grotesque', -apple-system, BlinkMacSystemFont, sans-serif";
        ctx.fillText(
          `★ LOTE DESTACADO EN PLANO: Lote ${selectedLot.rawId} (${getStageDisplayName(stageId, isEn)})   ·   Área: ${selectedLot.area} m²   ·   Precio: ${selectedLot.totalPrice}`,
          PAD_X + 6,
          cyFoot
        );
      } else {
        const legendItems = [
          { label: "Disponible (Salvia)", fill: "#3E8E76", border: "#2A6C58" },
          { label: "Reservado (Ocre Sol)", fill: "#D48E26", border: "#A86814" },
          { label: "Vendido (Cobre Terracota)", fill: "#B34E27", border: "#883418" },
          { label: "Amenidades & Club de Playa", fill: "#5C3314", border: "#B35F27" },
        ];
        let lx = PAD_X + 6;
        legendItems.forEach((item) => {
          ctx.fillStyle = item.fill;
          ctx.strokeStyle = item.border;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(lx, cyFoot - 11, 22, 22, 6);
          ctx.fill();
          ctx.stroke();

          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#3B2210";
          ctx.font = "500 14.5px 'Galano Grotesque', -apple-system, BlinkMacSystemFont, sans-serif";
          ctx.fillText(item.label, lx + 32, cyFoot);
          lx += 32 + ctx.measureText(item.label).width + 32;
        });
      }

      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#733A16";
      ctx.font = "700 14px 'Galano Grotesque', -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(
        "DISEÑO BIOCLIMÁTICO: MAADGA GROUP   ·   CONSTRUYE: ICG   ·   PROMUEVE: RUBIK 5   ·   FINANCIACIÓN HASTA 48 MESES (0% INTERÉS)",
        W - PAD_X - 6,
        cyFoot
      );

      // Marco exterior fino Cobre Terracota alrededor de toda la lámina
      ctx.strokeStyle = "rgba(179, 95, 39, 0.42)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(14, 14, W - 28, H - 28, 26);
      ctx.stroke();

      // Exportar como JPG ligero (~650-900 KB) ideal para WhatsApp y CRM
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), "image/jpeg", 0.88)
      );
      if (!blob) return;

      const dateSlug = new Date().toISOString().slice(0, 10);
      const fileName = selectedLot
        ? `Loom_Disponibilidad_Lote_${selectedLot.rawId}_${dateSlug}.jpg`
        : `Loom_Mapa_Disponibilidad_${dateSlug}.jpg`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) {
      console.error("Error exporting availability map:", e);
    } finally {
      setIsExportingMap(false);
    }
  };

  const handleFlyToStage = (targetStage: string) => {
    if (targetStage === "all") {
      setFocusMode("all");
      const tgt = STAGE_CAMERA_TARGETS.all;
      sceneRefs.current.desiredPos.set(...tgt.pos);
      sceneRefs.current.desiredTarget.set(...tgt.target);
      sceneRefs.current.isFlying = true;
      return;
    }
    setFocusMode("stage");
    onChangeStage(targetStage);
    const tgt = STAGE_CAMERA_TARGETS[targetStage] || STAGE_CAMERA_TARGETS.all;
    sceneRefs.current.desiredPos.set(...tgt.pos);
    sceneRefs.current.desiredTarget.set(...tgt.target);
    sceneRefs.current.isFlying = true;
  };

  return (
    <div className="relative w-full h-dvh bg-[#061112] text-[#EDE7E0] overflow-hidden select-none font-sans">
      <div ref={mountRef} className="w-full h-full" />

      {hoveredLot && (
        <div
          ref={tooltipRef}
          className="pointer-events-none fixed top-0 left-0 z-30 px-3 py-2 rounded-xl bg-[#0A0D0B]/95 border border-[#B35F27]/70 text-[#EDE7E0] shadow-2xl backdrop-blur-md flex items-center gap-2.5 will-change-transform"
          style={{
            transform: `translate3d(${Math.min(hoveredLot.x + 16, (typeof window !== "undefined" ? window.innerWidth : 1200) - 230)}px, ${Math.max(16, hoveredLot.y - 48)}px, 0)`,
          }}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              hoveredLot.lot.status === "available"
                ? "bg-emerald-400"
                : hoveredLot.lot.status === "blocked" || hoveredLot.lot.status === "reserved"
                ? "bg-amber-400"
                : "bg-red-400"
            }`}
          />
          <div>
            <div className="text-xs font-serif font-bold tracking-wider text-white">
              {hoveredLot.lot.status === "common"
                ? hoveredLot.lot.rawId
                : `${isEn ? "Lot" : "Lote"} ${hoveredLot.lot.rawId} • ${getStageDisplayName(hoveredLot.stageId, isEn)}`}
            </div>
            {hoveredLot.lot.status !== "common" && (
              <div className="text-[10px] font-mono text-[#EBD9AB]">
                {hoveredLot.lot.area} m² • {hoveredLot.lot.totalPrice}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* BARRA SUPERIOR MÓVIL (< lg): MENÚS DESPLEGABLES SIN OPCIONES OCULTAS */}
      {/* ==================================================================== */}
      <div className="lg:hidden absolute top-3 left-14 right-3 z-30 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center justify-between gap-1 bg-[#0b1210]/55 backdrop-blur-2xl border border-white/20 p-1 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.22)] pointer-events-auto">
          <button
            onClick={onExit3D}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/12 active:bg-[#B35F27] border border-white/15 text-[#EDE7E0] text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{isEn ? "2D Plan" : "Plano 2D"}</span>
          </button>

          {/* Selector desplegable de Etapas */}
          <button
            onClick={() => setMobileMenuOpen((prev) => (prev === "stages" ? null : "stages"))}
            className="flex-1 flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-xl bg-[#B35F27]/85 border border-[#EBD9AB]/45 text-white text-[10px] font-extrabold uppercase tracking-wider truncate shadow-sm"
          >
            <span className="truncate">
              {focusMode === "all"
                ? isEn
                  ? "All (318)"
                  : "Todo (318)"
                : getStageDisplayName(stageId, isEn)}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#EBD9AB] shrink-0 transition-transform duration-200 ${
                mobileMenuOpen === "stages" ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Menú desplegable de Capas y Opciones */}
          <button
            onClick={() => setMobileMenuOpen((prev) => (prev === "options" ? null : "options"))}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all ${
              mobileMenuOpen === "options"
                ? "bg-white/25 border-[#EBD9AB]/60 text-white"
                : "bg-white/10 border-white/18 text-[#EDE7E0]"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#EBD9AB]" />
            <span>{isEn ? "Options" : "Capas"}</span>
            <ChevronDown
              className={`w-3 h-3 text-[#EBD9AB] transition-transform duration-200 ${
                mobileMenuOpen === "options" ? "rotate-180" : ""
              }`}
            />
          </button>

          {onOpenLocation && (
            <button
              onClick={onOpenLocation}
              title={isEn ? "3D Satellite" : "Satélite 3D"}
              className="flex items-center justify-center p-1.5 rounded-xl bg-white/12 border border-white/18 text-[#EBD9AB] shrink-0"
            >
              <Globe className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Desplegable de Etapas en Celular */}
        {mobileMenuOpen === "stages" && (
          <div className="bg-[#0b1210]/85 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-2xl pointer-events-auto grid grid-cols-2 gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <button
              onClick={() => {
                handleFlyToStage("all");
                setMobileMenuOpen(null);
              }}
              className={`col-span-2 px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider text-center border transition-all ${
                focusMode === "all"
                  ? "bg-[#B35F27] text-white border-[#EBD9AB]/50 shadow"
                  : "bg-white/8 text-[#EDE7E0]/85 border-white/10"
              }`}
            >
              {isEn ? "All Loom Masterplan (318 Lots)" : "Todo Loom • Masterplan (318 Lotes)"}
            </button>
            {["etapa_1", "etapa_2", "etapa_3", "etapa_4", "etapa_5", "etapa_6"].map((st) => {
              const active = focusMode === "stage" && stageId === st;
              return (
                <button
                  key={st}
                  onClick={() => {
                    handleFlyToStage(st);
                    setMobileMenuOpen(null);
                  }}
                  className={`px-2.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
                    active
                      ? "bg-[#B35F27] text-white border-[#EBD9AB]/50 shadow"
                      : "bg-white/8 text-[#EDE7E0]/85 border-white/10"
                  }`}
                >
                  {getStageDisplayName(st, isEn)}
                </button>
              );
            })}
          </div>
        )}

        {/* Desplegable de Capas / Herramientas en Celular */}
        {mobileMenuOpen === "options" && (
          <div className="bg-[#0b1210]/85 backdrop-blur-2xl border border-white/20 rounded-2xl p-3 shadow-2xl pointer-events-auto flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-[#EBD9AB] mb-1">
                {isEn ? "Color Lots By" : "Colorear Lotes Por"}
              </div>
              <div className="grid grid-cols-3 gap-1 bg-white/8 p-1 rounded-xl border border-white/10">
                {(
                  [
                    { id: "status", es: "Estado", en: "Status" },
                    { id: "area", es: "Área m²", en: "Area" },
                    { id: "typology", es: "Tipología", en: "Type" },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setColorMode(mode.id)}
                    className={`py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      colorMode === mode.id
                        ? "bg-[#B35F27] text-white shadow"
                        : "text-white/75"
                    }`}
                  >
                    {isEn ? mode.en : mode.es}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() =>
                  setVillaMode((prev) =>
                    prev === "showcase" ? "all" : prev === "all" ? "off" : "showcase"
                  )
                }
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                  villaMode !== "off"
                    ? "bg-emerald-500/20 border-emerald-400/45 text-emerald-200"
                    : "bg-white/8 border-white/15 text-white/75"
                }`}
              >
                <Home className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {villaMode === "showcase"
                    ? isEn
                      ? "Villas: Sample"
                      : "Villas: Muestra"
                    : villaMode === "all"
                    ? isEn
                      ? "Villas: 318"
                      : "Villas: 318"
                    : isEn
                    ? "Lots Only"
                    : "Solo Lotes"}
                </span>
              </button>

              <button
                onClick={() => setIsSunset(!isSunset)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                  isSunset
                    ? "bg-amber-500/25 border-amber-400/55 text-amber-100"
                    : "bg-sky-500/15 border-sky-400/35 text-sky-100"
                }`}
              >
                {isSunset ? (
                  <Sunset className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                )}
                <span>{isSunset ? (isEn ? "Sunset" : "Atardecer") : (isEn ? "Daylight" : "Día")}</span>
              </button>

              <button
                onClick={() => setShowTrees3D(!showTrees3D)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                  showTrees3D
                    ? "bg-teal-500/20 border-teal-400/45 text-teal-200"
                    : "bg-white/8 border-white/15 text-white/70"
                }`}
              >
                <Trees className="w-3.5 h-3.5 shrink-0" />
                <span>{isEn ? "3D Palms" : "Vegetación 3D"}</span>
              </button>

              <button
                onClick={() => setShowDronePins(!showDronePins)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border ${
                  showDronePins
                    ? "bg-[#B35F27]/25 border-[#B35F27]/55 text-[#EBD9AB]"
                    : "bg-white/8 border-white/15 text-white/65"
                }`}
              >
                <Camera className="w-3.5 h-3.5 shrink-0" />
                <span>{isEn ? "Real Views" : "Vistas Reales"}</span>
              </button>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(null);
                handleDownloadAvailabilityMap();
              }}
              disabled={isExportingMap}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500/35 border border-emerald-300/50 text-emerald-50 text-[10px] font-bold uppercase tracking-wider shadow-md"
            >
              <Download className="w-3.5 h-3.5 text-emerald-200" />
              <span>
                {isExportingMap
                  ? isEn
                    ? "Generating Map..."
                    : "Generando Mapa..."
                  : isEn
                  ? "Download Availability Map (WhatsApp)"
                  : "Descargar Mapa Disponibilidad (WA)"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* BARRA SUPERIOR DESKTOP (lg:flex): GLASSMORPHISM 1 SOLA FILA AJUSTADA */}
      {/* ==================================================================== */}
      <div className="hidden lg:flex absolute top-3 left-16 right-3 z-20 flex-wrap xl:flex-nowrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1 bg-[#0b1210]/45 backdrop-blur-2xl border border-white/20 p-1 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.22)] pointer-events-auto max-w-full overflow-x-auto no-scrollbar">
          <button
            onClick={onExit3D}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/12 hover:bg-[#B35F27]/85 border border-white/15 text-[#EDE7E0] text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{isEn ? "2D Plan" : "Plano 2D"}</span>
          </button>

          <div className="h-4 w-[1px] bg-white/15 shrink-0" />

          <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleFlyToStage("all")}
              className={`px-2 py-1 rounded-xl text-[9.5px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                focusMode === "all"
                  ? "bg-[#B35F27]/85 text-white border border-[#EBD9AB]/40 shadow-sm"
                  : "text-[#EDE7E0]/80 hover:bg-white/10 hover:text-white border border-transparent"
              }`}
            >
              {isEn ? "All (318)" : "Todo (318)"}
            </button>
            {["etapa_1", "etapa_2", "etapa_3", "etapa_4", "etapa_5", "etapa_6"].map((st) => {
              const active = focusMode === "stage" && stageId === st;
              return (
                <button
                  key={st}
                  onClick={() => handleFlyToStage(st)}
                  className={`px-2 py-1 rounded-xl text-[9.5px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-[#B35F27]/85 text-white border border-[#EBD9AB]/40 shadow-sm"
                      : "text-[#EDE7E0]/80 hover:bg-white/10 hover:text-white border border-transparent"
                  }`}
                >
                  {getStageDisplayName(st, isEn)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center flex-nowrap gap-1 bg-[#0b1210]/45 backdrop-blur-2xl border border-white/20 p-1 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.22)] pointer-events-auto max-w-full overflow-x-auto no-scrollbar">
          <div className="flex items-center bg-white/8 rounded-xl p-0.5 border border-white/12 shrink-0">
            <span className="text-[8.5px] uppercase tracking-wider text-[#EBD9AB] font-mono font-bold px-1.5 hidden 2xl:inline">
              {isEn ? "Color:" : "Color:"}
            </span>
            {(
              [
                { id: "status", es: "Estado", en: "Status" },
                { id: "area", es: "Área", en: "Area" },
                { id: "typology", es: "Tipo", en: "Type" },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                onClick={() => setColorMode(mode.id)}
                className={`px-2 py-1 rounded-lg text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  colorMode === mode.id
                    ? "bg-[#B35F27]/85 text-white border border-[#EBD9AB]/35 shadow-sm"
                    : "text-white/75 hover:text-white"
                }`}
              >
                {isEn ? mode.en : mode.es}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              setVillaMode((prev) =>
                prev === "showcase" ? "all" : prev === "all" ? "off" : "showcase"
              )
            }
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[9.5px] font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              villaMode !== "off"
                ? "bg-emerald-500/20 border-emerald-400/45 text-emerald-200"
                : "bg-white/8 border-white/15 text-white/75 hover:text-white"
            }`}
          >
            <Home className="w-3 h-3 shrink-0" />
            <span>
              {villaMode === "showcase"
                ? isEn
                  ? "Villas: Sample"
                  : "Villas: Muestra"
                : villaMode === "all"
                ? isEn
                  ? "Villas: 318"
                  : "Villas: 318"
                : isEn
                ? "Lots Only"
                : "Solo Lotes"}
            </span>
          </button>

          <button
            onClick={() => setShowTrees3D(!showTrees3D)}
            title={isEn ? "Toggle 3D Vegetation" : "Mostrar/Ocultar Vegetación 3D"}
            className={`flex items-center justify-center p-1.5 rounded-xl border transition-all cursor-pointer shrink-0 ${
              showTrees3D
                ? "bg-teal-500/20 border-teal-400/45 text-teal-200"
                : "bg-white/8 border-white/15 text-white/70 hover:text-white"
            }`}
          >
            <Trees className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsSunset(!isSunset)}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[9.5px] font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isSunset
                ? "bg-amber-500/25 border-amber-400/55 text-amber-100"
                : "bg-sky-500/15 border-sky-400/35 text-sky-100 hover:bg-sky-500/25"
            }`}
          >
            {isSunset ? (
              <Sunset className="w-3 h-3 text-amber-300 shrink-0" />
            ) : (
              <Sun className="w-3 h-3 text-sky-300 shrink-0" />
            )}
            <span>{isSunset ? (isEn ? "Sunset" : "Atardecer") : (isEn ? "Day" : "Día")}</span>
          </button>

          <button
            onClick={() => setShowDronePins(!showDronePins)}
            className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[9.5px] font-bold uppercase tracking-wider border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              showDronePins
                ? "bg-[#B35F27]/25 border-[#B35F27]/55 text-[#EBD9AB]"
                : "bg-white/8 border-white/15 text-white/65"
            }`}
          >
            <Camera className="w-3 h-3 shrink-0" />
            <span>{isEn ? "Views" : "Vistas"}</span>
          </button>

          <button
            onClick={handleDownloadAvailabilityMap}
            disabled={isExportingMap}
            title={
              isEn
                ? "Download lightweight HD Availability Map for WhatsApp / CRM"
                : "Descargar Mapa de Disponibilidad oficial para WhatsApp / CRM"
            }
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/45 border border-emerald-300/45 text-emerald-50 text-[9.5px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3 h-3 text-emerald-200 shrink-0" />
            <span>
              {isExportingMap
                ? isEn
                  ? "Exporting..."
                  : "Generando..."
                : isEn
                ? "Download Map"
                : "Descargar Plano"}
            </span>
          </button>

          {onOpenLocation && (
            <button
              onClick={onOpenLocation}
              title={isEn ? "Open 3D Satellite Location" : "Abrir Ubicación Satelital 3D"}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/10 hover:bg-[#B35F27]/80 border border-white/18 text-white text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-[#EBD9AB] shrink-0" />
              <span className="hidden 2xl:inline">{isEn ? "Satellite" : "Satélite"}</span>
            </button>
          )}
        </div>
      </div>

      {colorMode === "area" && (
        <div className="absolute top-20 left-3 z-20 bg-[#0A0D0B]/92 border border-[#B35F27]/40 rounded-2xl p-3 shadow-2xl backdrop-blur-xl max-w-xs pointer-events-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#EBD9AB] font-bold">
              {isEn ? "Filter by Lot Area" : "Filtrar por Rango de Área"}
            </span>
            {activeAreaFilter !== "all" && (
              <button
                onClick={() => setActiveAreaFilter("all")}
                className="text-[9px] text-[#B35F27] hover:underline font-bold uppercase cursor-pointer"
              >
                {isEn ? "Show All" : "Ver Todos"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {AREA_TIERS.map((tier) => {
              const isSelectedTier = activeAreaFilter === tier.key;
              return (
                <button
                  key={tier.key}
                  onClick={() => setActiveAreaFilter(isSelectedTier ? "all" : tier.key)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelectedTier
                      ? "bg-white/15 border-white text-white shadow-md"
                      : "bg-white/5 border-white/10 text-white/75 hover:bg-white/10"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: tier.fillHex }}
                  />
                  <span className="text-[10px] font-bold truncate">
                    {isEn ? tier.labelEn : tier.labelEs}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MINI-MAPA RADAR EQUILIBRADO Y SINCRONIZADO EN TIEMPO REAL (60 FPS) */}
      <div className="hidden md:flex absolute bottom-16 left-4 z-20 flex-col bg-[#0b1210]/45 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-[0_12px_36px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.22)] w-52 pointer-events-auto">
        <div className="flex items-center justify-between mb-1 px-1">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#EBD9AB]" />
            <span className="text-[8.5px] font-mono uppercase tracking-widest text-[#EDE7E0]/90 font-bold">
              {isEn ? "Masterplan Radar" : "Radar Masterplan 3D"}
            </span>
          </div>
          <span ref={radarYawLabelRef} className="text-[8.5px] font-mono text-[#EBD9AB]">
            25°
          </span>
        </div>
        <div
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const u = (e.clientX - rect.left) / rect.width;
            const v = (e.clientY - rect.top) / rect.height;
            const wx = (u - 0.5) * WORLD_W;
            const wz = (v - 0.5) * WORLD_D;
            sceneRefs.current.desiredTarget.set(wx, 0, wz);
            sceneRefs.current.desiredPos.set(wx - 2.5, 7.5, wz + 9.2);
            sceneRefs.current.isFlying = true;
          }}
          title={isEn ? "Click anywhere on radar to fly camera" : "Haz clic en cualquier punto del radar para volar ahí"}
          className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-white/15 bg-[#051415] cursor-crosshair"
        >
          <img
            src="/loom/loom_masterplan_bg.webp?v=5"
            alt="Masterplan Radar"
            className="w-full h-full object-fill opacity-85"
          />
          <svg viewBox="0 0 160 90" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <radialGradient id="radarConeGrad" cx="50%" cy="100%" r="90%">
                <stop offset="0%" stopColor="#B35F27" stopOpacity="0.65" />
                <stop offset="70%" stopColor="#EBD9AB" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#EBD9AB" stopOpacity="0.0" />
              </radialGradient>
            </defs>
            {/* Contorno sutil del polígono de Loom para referencia visual equilibrada */}
            <polygon
              points="7,42 118,30 129,56 12,62"
              fill="rgba(235, 217, 171, 0.05)"
              stroke="rgba(235, 217, 171, 0.45)"
              strokeWidth="0.8"
              strokeDasharray="2 1.5"
            />
            <g ref={radarMarkerRef} transform="translate(112, 42) rotate(25)">
              <path
                d="M 0 0 L -13 -22 A 25 25 0 0 1 13 -22 Z"
                fill="url(#radarConeGrad)"
                stroke="#EBD9AB"
                strokeWidth="0.9"
                strokeOpacity="0.8"
              />
              <circle cx="0" cy="0" r="6" fill="none" stroke="#10b981" strokeOpacity="0.45" strokeWidth="1" />
              <circle cx="0" cy="0" r="3.2" fill="#10b981" stroke="#ffffff" strokeWidth="1.4" />
            </g>
          </svg>
        </div>
        <div className="mt-1 flex items-center justify-between text-[8.5px] text-white/65 px-1">
          <span>{isEn ? "Left click: Orbit" : "Clic izq: Orbitar 360°"}</span>
          <span>{isEn ? "Scroll: Zoom" : "Scroll: Zoom"}</span>
        </div>
      </div>

      {/* BARRA INFERIOR GLASSMORPHISM CON FLECHAS INDICADORAS EN CELULAR */}
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-[#0b1210]/45 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.22)] max-w-[96vw] pointer-events-auto">
        {/* Flecha izquierda en pantallas pequeñas para indicar más opciones */}
        <button
          onClick={() => bottomBarScrollRef.current?.scrollBy({ left: -180, behavior: "smooth" })}
          aria-label="Anterior"
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-xl bg-white/10 active:bg-[#B35F27] border border-white/15 text-[#EBD9AB] shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={bottomBarScrollRef}
          className="flex items-center flex-nowrap gap-1 overflow-x-auto no-scrollbar"
        >
          {CAMERA_PRESETS.map((preset) => {
            const isCurrent = activePreset.id === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setActivePreset(preset);
                  setMobileMenuOpen(null);
                  if (preset.id === "general" || preset.id === "planta") {
                    setFocusMode("all");
                  }
                  if (preset.renderPreview && showDronePins) {
                    setDroneRenderModal(preset.renderPreview);
                  } else {
                    setDroneRenderModal(null);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isCurrent
                    ? "bg-[#B35F27]/85 backdrop-blur-md text-white border border-[#EBD9AB]/45 shadow-[0_4px_14px_rgba(179,95,39,0.4)]"
                    : "text-[#EDE7E0]/85 hover:bg-white/12 hover:text-white border border-transparent"
                }`}
              >
                {preset.renderPreview ? (
                  <Camera className="w-3 h-3 text-[#EBD9AB] shrink-0" />
                ) : (
                  <Box className="w-3 h-3 text-[#EBD9AB] shrink-0" />
                )}
                <span>{isEn ? preset.labelEn : preset.labelEs}</span>
              </button>
            );
          })}
        </div>

        {/* Flecha derecha en pantallas pequeñas para indicar que hay más cámaras */}
        <button
          onClick={() => bottomBarScrollRef.current?.scrollBy({ left: 180, behavior: "smooth" })}
          aria-label="Siguiente"
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-xl bg-[#B35F27]/45 active:bg-[#B35F27] border border-[#EBD9AB]/40 text-[#EBD9AB] shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {droneRenderModal && (
        <div className="absolute top-16 lg:top-20 right-3 sm:right-4 z-20 w-80 sm:w-96 bg-[#0b1210]/65 border border-white/25 rounded-2xl overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur-2xl pointer-events-auto">
          <div className="relative aspect-[16/10] w-full bg-black">
            <img
              src={droneRenderModal.src}
              alt={isEn ? droneRenderModal.titleEn : droneRenderModal.titleEs}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-[#0b1210]/75 backdrop-blur-md border border-[#EBD9AB]/40 text-[9px] font-mono font-bold uppercase tracking-wider text-[#EBD9AB]">
              {isEn ? droneRenderModal.badgeEn : droneRenderModal.badgeEs}
            </div>
            <button
              onClick={() => setDroneRenderModal(null)}
              title={isEn ? "Close preview" : "Cerrar imagen"}
              aria-label={isEn ? "Close preview" : "Cerrar imagen"}
              className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/75 hover:bg-[#B35F27] text-white flex items-center justify-center border border-white/25 backdrop-blur-md shadow-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-3 flex items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-serif font-bold text-white">
                {isEn ? droneRenderModal.titleEn : droneRenderModal.titleEs}
              </h4>
              <p className="text-[10px] text-[#EDE7E0]/75 mt-0.5">
                {isEn
                  ? "Camera synchronized with the 3D Interactive Maqueta"
                  : "Ángulo sincronizado con la cámara de la Maqueta 3D"}
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-[#EBD9AB] shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}
