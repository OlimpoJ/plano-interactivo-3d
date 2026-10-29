"use client";

import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  Sun,
  Sunset,
  Home,
  Compass,
  Camera,
  Box,
  Sparkles,
  ChevronLeft,
  Globe,
  Trees,
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
    labelEs: "Vista Referencia • Playa & Villas",
    labelEn: "Reference View • Beach & Villas",
    position: [4.2, 5.4, 7.2],
    target: [7.8, 0.0, -0.6],
  },
  {
    id: "general",
    labelEs: "Masterplan Completo (318)",
    labelEn: "Full Masterplan (318)",
    position: [0, 21, 27],
    target: [0, 0, 0],
  },
  {
    id: "mar",
    labelEs: "Playa Alma • Mar Caribe",
    labelEn: "Playa Alma • Caribbean Sea",
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
    labelEs: "Portería • Etapa 1",
    labelEn: "Gatehouse • Stage 1",
    position: [-16.5, 5.8, 7.8],
    target: [-12.5, 0, 0.5],
    renderPreview: {
      titleEs: "Portería Monumental 24/7 • Acceso Principal",
      titleEn: "Monumental 24/7 Gatehouse • Main Access",
      src: "/loom/renders/amenities/porteria/galeria_04_porteria_vista_4.webp",
      badgeEs: "Vista Acceso Vial",
      badgeEn: "Road Access View",
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
    labelEs: "Parque Lineal • Garden Walk",
    labelEn: "Linear Park • Garden Walk",
    position: [-3.8, 5.5, 7.2],
    target: [-3.5, 0, 0.2],
    renderPreview: {
      titleEs: "Parque Lineal • Corredor Bioclimático The Garden Walk",
      titleEn: "Linear Park • The Garden Walk Bioclimatic Corridor",
      src: "/loom/renders/amenities/parques/galeria_01_parque_lineal_vista_1.webp",
      badgeEs: "Corredor Ecológico",
      badgeEn: "Ecological Corridor",
    },
  },
  {
    id: "planta",
    labelEs: "Vista Planta 90°",
    labelEn: "Top-Down Plan 90°",
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
  ctx.font = "bold 36px sans-serif";
  ctx.fillStyle = "#F8FAFC";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 66);

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

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const TERRAIN_WATER_FRAGMENT_GLSL = /* glsl */ `
  uniform sampler2D uMasterTex;
  uniform sampler2D uMasksTex;
  uniform sampler2D uDetailTex;
  uniform float uTime;
  uniform float uIsSunset;
  uniform vec3 uSunDir;
  uniform vec3 uCameraPos;

  varying vec2 vUv;
  varying vec3 vWorldPos;

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
    // Oeste interior (mUv.x < 0) y Mar Caribe profundo al Este (mUv.x > 1).
    // Muestrea exclusivamente las franjas naturales vírgenes (bosque + playa + rompiente + mar)
    // de los extremos Norte [0.84..0.996] y Sur [0.004..0.16] del propio Masterplan.
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
    if (mUv.x < 0.0) {
      float dx = -mUv.x;
      float triX = 1.0 - abs(fract(dx * 2.1) * 2.0 - 1.0);
      sampleX = 0.004 + triX * 0.075;
    } else if (mUv.x > 1.0) {
      float dx = mUv.x - 1.0;
      float triX = 1.0 - abs(fract(dx * 1.75) * 2.0 - 1.0);
      sampleX = 0.996 - triX * 0.058;
    }

    // Deformación orgánica FBM únicamente en el bosque exterior (sampleX < 0.75)
    // para que la playa (sampleX >= 0.75) mantenga alineación milimétrica con el Masterplan
    float outDistY = max(0.0, max(-mUv.y, mUv.y - 1.0));
    float outDistX = max(0.0, -mUv.x);
    float outerForestFactor = clamp((outDistY + outDistX) * 4.0, 0.0, 1.0) * (1.0 - smoothstep(0.70, 0.78, sampleX));
    vec2 fbmForestWarp = (texture2D(uDetailTex, mUv * 3.2).rg - 0.5) * 0.06 * outerForestFactor;

    vec2 sampleUv = clamp(vec2(sampleX, sampleY) + fbmForestWarp, 0.003, 0.997);

    vec3 baseCol = texture2D(uMasterTex, sampleUv).rgb;
    vec3 masks = texture2D(uMasksTex, sampleUv).rgb;

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
      if (grassMask > 0.1) {
        float diagCoord = vWorldPos.x * 0.78 + vWorldPos.z * 0.62;
        float mowStripe = sin(diagCoord * 18.0) * 0.5 + 0.5;
        float microBlade = texture2D(uDetailTex, mUv * 85.0).b - 0.5;

        vec3 lawnTint = mix(baseCol * 0.96, baseCol * 1.06, mowStripe);
        finalCol = mix(baseCol, lawnTint, grassMask * 0.35 * closeFactor * inMaster);
        finalCol += microBlade * 0.055 * grassMask * closeFactor;
      }

      // Micro-destello de arena coralina en Playa Alma
      float isBeachSand = smoothstep(0.77, 0.81, sampleX) * smoothstep(0.52, 0.68, baseCol.r);
      if (isBeachSand > 0.05) {
        float sandSparkle = texture2D(uDetailTex, mUv * 130.0).b - 0.5;
        finalCol += sandSparkle * 0.042 * isBeachSand * closeFactor;
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
  const [droneRenderModal, setDroneRenderModal] = useState<CameraPreset["renderPreview"] | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/loom/loom_unified_3d_lots.json")
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

  const lotsMapRef = useRef(lotsMap);
  lotsMapRef.current = lotsMap;
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.NoToneMapping;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.maxPolarAngle = Math.PI / 2 - 0.04;
    controls.minDistance = 2.2;
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

    const masterTex = loader.load("/loom/loom_masterplan_bg.webp", (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = maxAniso;
    });

    const masksTex = loader.load("/loom/loom_terrain_masks.png?v=2", (t) => {
      t.anisotropy = maxAniso;
    });

    // Terreno Costero Extendido (172m x 118m en escala 3D) para conectar Mar Caribe, Playa Alma y Bosque hasta el horizonte
    const terrainGeo = new THREE.PlaneGeometry(WORLD_W * 4.5, WORLD_D * 5.5);
    const terrainShaderMat = new THREE.ShaderMaterial({
      vertexShader: TERRAIN_WATER_VERTEX_GLSL,
      fragmentShader: TERRAIN_WATER_FRAGMENT_GLSL,
      uniforms: {
        uMasterTex: { value: masterTex },
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
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(lotsGroup.children, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const lotId = hit.userData?.lotId;
        const lotStage = hit.userData?.stageId || "etapa_1";
        const lotData = lotId ? lotsMapRef.current[lotId] : null;
        if (lotData) {
          renderer.domElement.style.cursor = "pointer";
          setHoveredLot({
            lot: lotData,
            stageId: lotStage,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
          return;
        }
      }
      renderer.domElement.style.cursor = "grab";
      setHoveredLot(null);
    };

    const handlePointerDown = (e: MouseEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: MouseEvent) => {
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (dist > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(lotsGroup.children, false);
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const lotId = hit.userData?.lotId;
        const lotStage = hit.userData?.stageId;
        const lotData = lotId ? lotsMapRef.current[lotId] : null;
        if (lotData) {
          if (lotStage) onChangeStageRef.current(lotStage);
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

      controls.update();

      if (elapsed - lastYawUpdate > 0.12) {
        lastYawUpdate = elapsed;
        const dx = controls.target.x - camera.position.x;
        const dz = controls.target.z - camera.position.z;
        const deg = Math.round((Math.atan2(dx, -dz) * 180) / Math.PI);
        setCameraYaw((prev) => (Math.abs(prev - deg) >= 2 ? deg : prev));
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

        gltf.scene.traverse((node) => {
          if ((node as THREE.Mesh).isMesh) {
            const mesh = node as THREE.Mesh;
            const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
            if (isSunset) {
              mat.color.multiply(new THREE.Color("#e8cfa8"));
            }
            const inst = new THREE.InstancedMesh(mesh.geometry, mat, palmCount);
            inst.castShadow = true;
            inst.receiveShadow = true;

            landscapeData.palms.forEach(([sx, sy, sc, rot], i) => {
              const [wx, wz] = svgToWorld(sx, sy);
              dummy.position.set(wx, 0, wz);
              dummy.rotation.set(0, rot, 0);
              dummy.scale.set(sc * 1.12, sc * 1.12, sc * 1.12);
              dummy.updateMatrix();
              inst.setMatrixAt(i, dummy.matrix);
            });
            inst.instanceMatrix.needsUpdate = true;
            grp.add(inst);
          }
        });

        // Capa adicional de pencas plumosas con transparencia Alpha para follaje denso
        if (palmCrownTex) {
          const crownGeo = createRealisticPalmCrownGeometry();
          crownGeo.translate(0.055, 0.48, 0);
          const crownMat = new THREE.MeshStandardMaterial({
            map: palmCrownTex,
            alphaTest: 0.28,
            transparent: true,
            side: THREE.DoubleSide,
            roughness: 0.6,
            color: isSunset ? "#d9c29c" : "#ffffff",
          });
          const crownInst = new THREE.InstancedMesh(crownGeo, crownMat, palmCount);
          crownInst.castShadow = true;
          landscapeData.palms.forEach(([sx, sy, sc, rot], i) => {
            const [wx, wz] = svgToWorld(sx, sy);
            dummy.position.set(wx, 0, wz);
            dummy.rotation.set(0, rot + 0.35, 0);
            dummy.scale.set(sc, sc, sc);
            dummy.updateMatrix();
            crownInst.setMatrixAt(i, dummy.matrix);
          });
          crownInst.instanceMatrix.needsUpdate = true;
          grp.add(crownInst);
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

    // Geometrías modulares compartidas en memoria para que las 318 Villas corran a 60 FPS
    const unitBox = new THREE.BoxGeometry(1, 1, 1);

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
    villasGroup.add(maloca1);

    const maloca2 = new THREE.Mesh(malocaGeo, thatchBambooMat);
    maloca2.position.set(beachX + 0.32, 0.055, beachZ + 0.24);
    maloca2.rotation.y = 0.38;
    maloca2.scale.set(0.88, 0.88, 0.88);
    maloca2.castShadow = true;
    villasGroup.add(maloca2);

    const beachPill = createFloatingPillSprite("'Alma Beach Club'", "#EBD9AB", 1.55, 0.38);
    beachPill.position.set(beachX + 0.15, 0.56, beachZ - 0.05);
    villasGroup.add(beachPill);

    const [gwX, gwZ] = svgToWorld(2390, 995);
    const gardenWalkPill = createFloatingPillSprite("The Garden Walk", "#10b981", 1.45, 0.36);
    gardenWalkPill.position.set(gwX, 0.52, gwZ);
    villasGroup.add(gardenWalkPill);

    const [chX, chZ] = svgToWorld(2196, 972);
    const clubHousePill = createFloatingPillSprite("Club House & Oasis", "#EBD9AB", 1.55, 0.38);
    clubHousePill.position.set(chX, 0.56, chZ);
    villasGroup.add(clubHousePill);

    const [lakeX, lakeZ] = svgToWorld(2835, 1218);
    const lakePill = createFloatingPillSprite("Lago Central • Oasis", "#22d3ee", 1.48, 0.36);
    lakePill.position.set(lakeX, 0.48, lakeZ);
    villasGroup.add(lakePill);

    unifiedLots.forEach((pLot, lotIndex) => {
      const lotData = lotsMap[pLot.id];
      if (!lotData) return;

      const [wx, wz] = svgToWorld(pLot.cx, pLot.cy);
      const ww = (pLot.width / 3840) * WORLD_W;
      const wd = (pLot.height / 2160) * WORLD_D;

      const isSelected = selectedLot?.id === pLot.id;
      const isAmenity = pLot.isAmenity || lotData.status === "common";
      const isCurrentStage = focusMode === "all" || pLot.stageId === stageId;

      // En modo "showcase" (Estilo Referencia), alternamos ~44% de lotes con Villa 3D
      // y ~56% de lotes abiertos con césped iluminado y código de lote, más el lote seleccionado
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
      // Lotes abiertos sin casa lucen su césped esmeralda/ámbar iluminado como en la referencia
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

      const mat = new THREE.MeshStandardMaterial({
        color: isSelected ? "#f59e0b" : fillColor,
        emissive: isSelected ? "#fbbf24" : fillColor,
        emissiveIntensity: isSelected ? 0.75 : isSunset ? 0.35 : 0.22,
        transparent: true,
        opacity,
        roughness: 0.25,
      });

      const mesh = new THREE.Mesh(geometry, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(wx, 0.004, wz);
      mesh.userData = { lotId: pLot.id, stageId: pLot.stageId };
      lotsGroup.add(mesh);

      if (borderPoints.length >= 3) {
        const lineGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
        const lineMat = new THREE.LineBasicMaterial({
          color: isSelected ? "#fde047" : fillColor,
          transparent: true,
          opacity: dimmed ? 0.22 : 0.92,
        });
        const borderLoop = new THREE.LineLoop(lineGeo, lineMat);
        villasGroup.add(borderLoop);
      }

      // Etiqueta píldora en el lote seleccionado (ej. 'B-22 • 252') o en lotes abiertos destacados
      if (!isAmenity && (isSelected || (!isShowcaseVilla && lotIndex % 6 === 0 && !dimmed))) {
        const labelStr = isSelected
          ? `${lotData.rawId} • ${lotData.areaNumeric || lotData.area}`
          : lotData.rawId;
        const lotPill = createFloatingPillSprite(
          labelStr,
          isSelected ? "#fde047" : fillColor,
          isSelected ? 0.95 : 0.58,
          isSelected ? 0.26 : 0.18
        );
        lotPill.position.set(wx, isShowcaseVilla ? 0.42 : 0.11, wz);
        villasGroup.add(lotPill);
      }

      // ======================================================================
      // CAPA 5: ARQUITECTURA DE VILLA BIOCLIMÁTICA (ESTILO IMAGEN DE REFERENCIA)
      // Con Jacuzzi iluminado en el Rooftop, Pérgola de vigas de teca, Jardinera
      // perimetral en azotea, Celosías de madera en 2do piso y Piscina en jardín
      // ======================================================================
      if (isShowcaseVilla && !isAmenity && worldVerts.length >= 4) {
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

        const L = Math.min(0.45, Math.max(0.26, bestLen * 0.72));
        const W = L * 0.68;

        const villaGrp = new THREE.Group();
        villaGrp.position.set(wx, extrudeHeight + 0.005, wz);
        villaGrp.rotation.y = -lotAngle;

        // 1. Plataforma / Deck de Piedra Coralina & Madera (Terraza Social)
        const deck = new THREE.Mesh(unitBox, coralBaseMat);
        deck.scale.set(L * 0.94, 0.016, W * 0.9);
        deck.position.set(0, 0.008, 0);
        deck.receiveShadow = true;
        villaGrp.add(deck);

        // 2. Piscina Privada Turquesa en el Patio Posterior + Solárium de Teca
        const pool = new THREE.Mesh(unitBox, poolWaterMat);
        pool.scale.set(L * 0.30, 0.022, W * 0.62);
        pool.position.set(L * 0.27, 0.013, W * 0.04);
        villaGrp.add(pool);

        const sundeck = new THREE.Mesh(unitBox, teakWoodMat);
        sundeck.scale.set(L * 0.14, 0.018, W * 0.62);
        sundeck.position.set(L * 0.06, 0.011, W * 0.04);
        villaGrp.add(sundeck);

        // 3. Nivel 1: Volumen de Cristal Cálido + Muros en Piedra Coralina
        const gfGlass = new THREE.Mesh(unitBox, glassWindowMat);
        gfGlass.scale.set(L * 0.52, 0.105, W * 0.72);
        gfGlass.position.set(-L * 0.12, 0.062, 0);
        villaGrp.add(gfGlass);

        const gfWall = new THREE.Mesh(unitBox, coralBaseMat);
        gfWall.scale.set(L * 0.22, 0.11, W * 0.76);
        gfWall.position.set(-L * 0.27, 0.065, 0);
        gfWall.castShadow = true;
        gfWall.receiveShadow = true;
        villaGrp.add(gfWall);

        // 4. Nivel 2: Volumen en Voladizo con Celosías de Madera Teca + Ventanales Iluminados
        const ufBody = new THREE.Mesh(unitBox, stuccoWhiteMat);
        ufBody.scale.set(L * 0.64, 0.115, W * 0.82);
        ufBody.position.set(-L * 0.08, 0.175, 0);
        ufBody.castShadow = true;
        ufBody.receiveShadow = true;
        villaGrp.add(ufBody);

        const ufGlass = new THREE.Mesh(unitBox, glassWindowMat);
        ufGlass.scale.set(L * 0.65, 0.082, W * 0.76);
        ufGlass.position.set(-L * 0.08, 0.175, 0);
        villaGrp.add(ufGlass);

        // Fachada envolvente de Celosías Bioclimáticas en Madera Teca (como en la imagen de referencia)
        const louverFront = new THREE.Mesh(unitBox, teakWoodMat);
        louverFront.scale.set(L * 0.66, 0.095, W * 0.84);
        louverFront.position.set(-L * 0.08, 0.175, 0);
        louverFront.castShadow = true;
        villaGrp.add(louverFront);

        // Losa blanca superior del Rooftop (Nivel 3 Azotea)
        const roofSlab = new THREE.Mesh(unitBox, stuccoWhiteMat);
        roofSlab.scale.set(L * 0.68, 0.022, W * 0.86);
        roofSlab.position.set(-L * 0.08, 0.24, 0);
        roofSlab.castShadow = true;
        roofSlab.receiveShadow = true;
        villaGrp.add(roofSlab);

        // 5. AZOTEA / ROOFTOP DE LUJO (Idéntico a la imagen de referencia):
        // 5a. Jardinera verde perimetral en el borde de la azotea
        const roofHedge = new THREE.Mesh(unitBox, roofHedgeMat);
        roofHedge.scale.set(L * 0.64, 0.024, W * 0.82);
        roofHedge.position.set(-L * 0.08, 0.256, 0);
        villaGrp.add(roofHedge);

        const roofInnerFloor = new THREE.Mesh(unitBox, stuccoWhiteMat);
        roofInnerFloor.scale.set(L * 0.56, 0.026, W * 0.72);
        roofInnerFloor.position.set(-L * 0.08, 0.257, 0);
        villaGrp.add(roofInnerFloor);

        // 5b. Jacuzzi / Piscina Iluminada Turquesa en el Rooftop (mitad derecha de la azotea)
        const roofPoolCoping = new THREE.Mesh(unitBox, stuccoWhiteMat);
        roofPoolCoping.scale.set(L * 0.24, 0.032, W * 0.38);
        roofPoolCoping.position.set(L * 0.05, 0.262, W * 0.11);
        villaGrp.add(roofPoolCoping);

        const roofJacuzzi = new THREE.Mesh(unitBox, poolWaterMat);
        roofJacuzzi.scale.set(L * 0.20, 0.035, W * 0.32);
        roofJacuzzi.position.set(L * 0.05, 0.264, W * 0.11);
        villaGrp.add(roofJacuzzi);

        // 5c. Pérgola de Vigas de Madera Teca en el Rooftop (mitad izquierda de la azotea)
        const pergolaFrame = new THREE.Mesh(unitBox, darkBronzeMat);
        pergolaFrame.scale.set(L * 0.28, 0.065, W * 0.54);
        pergolaFrame.position.set(-L * 0.20, 0.282, -W * 0.04);
        villaGrp.add(pergolaFrame);

        for (let b = -2; b <= 2; b++) {
          const beam = new THREE.Mesh(unitBox, teakWoodMat);
          beam.scale.set(L * 0.30, 0.012, W * 0.065);
          beam.position.set(-L * 0.20, 0.318, -W * 0.04 + b * (W * 0.11));
          beam.castShadow = true;
          villaGrp.add(beam);
        }

        villasGroup.add(villaGrp);
      }

      // ======================================================================
      // TELEMETRÍA 3D FLOTANTE EN EL LOTE SELECCIONADO (ARCO SOLAR + BRISA + RUTA A PLAYA ALMA)
      // ======================================================================
      if (isSelected) {
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
        const solarLine = new THREE.Line(solarGeo, solarMat);
        telemetryGroup.add(solarLine);

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
        const breezeMesh = new THREE.Mesh(breezeGeo, breezeMat);
        telemetryGroup.add(breezeMesh);

        // Línea de conexión dorada y distancia real caminando hasta Alma Beach Club
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
      }
    });
  }, [unifiedLots, lotsMap, stageId, focusMode, colorMode, activeAreaFilter, villaMode, isSunset, selectedLot]);

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
          className="pointer-events-none fixed z-30 px-3 py-2 rounded-xl bg-[#0A0D0B]/95 border border-[#B35F27]/70 text-[#EDE7E0] shadow-2xl backdrop-blur-md flex items-center gap-2.5"
          style={{
            left: Math.min(hoveredLot.x + 16, (typeof window !== "undefined" ? window.innerWidth : 1200) - 230),
            top: Math.max(16, hoveredLot.y - 48),
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

      {/* BARRA SUPERIOR */}
      <div className="absolute top-3 left-14 sm:left-16 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-[#EDE7E0]/95 border border-[#0A0D0B]/15 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-auto">
          <button
            onClick={onExit3D}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0A0D0B] hover:bg-[#B35F27] text-[#EDE7E0] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isEn ? "2D Vector Plan" : "Plano 2D HD"}</span>
          </button>

          <div className="h-5 w-[1px] bg-[#0A0D0B]/15" />

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleFlyToStage("all")}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                focusMode === "all"
                  ? "bg-[#0A0D0B] text-[#EBD9AB] shadow-sm"
                  : "text-[#0A0D0B]/70 hover:bg-black/5 hover:text-[#0A0D0B]"
              }`}
            >
              {isEn ? "All 318 Lots" : "Todo Loom (318)"}
            </button>
            {["etapa_1", "etapa_2", "etapa_3", "etapa_4", "etapa_5", "etapa_6"].map((st) => {
              const active = focusMode === "stage" && stageId === st;
              return (
                <button
                  key={st}
                  onClick={() => handleFlyToStage(st)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-[#B35F27] text-white shadow-sm"
                      : "text-[#0A0D0B]/70 hover:bg-black/5 hover:text-[#0A0D0B]"
                  }`}
                >
                  {getStageDisplayName(st, isEn)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#0A0D0B]/90 border border-white/15 p-1.5 rounded-2xl shadow-2xl backdrop-blur-xl pointer-events-auto">
          <div className="flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
            <span className="text-[9px] uppercase tracking-wider text-[#EBD9AB] font-mono font-bold px-2 hidden sm:inline">
              {isEn ? "Color by:" : "Colorear:"}
            </span>
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
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  colorMode === mode.id
                    ? "bg-[#B35F27] text-white shadow"
                    : "text-white/70 hover:text-white"
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
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              villaMode !== "off"
                ? "bg-emerald-500/20 border-emerald-400/50 text-emerald-300"
                : "bg-white/5 border-white/15 text-white/70 hover:text-white"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>
              {villaMode === "showcase"
                ? isEn
                  ? "Villas: Showcase"
                  : "Villas: Muestra"
                : villaMode === "all"
                ? isEn
                  ? "Villas: All 318"
                  : "Villas: Todas"
                : isEn
                ? "Villas: Off"
                : "Solo Lotes"}
            </span>
          </button>

          <button
            onClick={() => setShowTrees3D(!showTrees3D)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              showTrees3D
                ? "bg-teal-500/20 border-teal-400/50 text-teal-200"
                : "bg-white/5 border-white/15 text-white/70 hover:text-white"
            }`}
          >
            <Trees className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{isEn ? "3D Palms" : "Palmeras 3D"}</span>
          </button>

          <button
            onClick={() => setIsSunset(!isSunset)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              isSunset
                ? "bg-amber-500/25 border-amber-400/60 text-amber-200 shadow-lg shadow-amber-500/10"
                : "bg-sky-500/15 border-sky-400/35 text-sky-200 hover:bg-sky-500/25"
            }`}
          >
            {isSunset ? (
              <Sunset className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-sky-300" />
            )}
            <span>{isSunset ? (isEn ? "Sunset" : "Atardecer") : (isEn ? "Daylight" : "Día")}</span>
          </button>

          <button
            onClick={() => setShowDronePins(!showDronePins)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              showDronePins
                ? "bg-[#B35F27]/25 border-[#B35F27]/60 text-[#EBD9AB]"
                : "bg-white/5 border-white/15 text-white/60"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isEn ? "Real Views" : "Vistas Reales"}</span>
          </button>

          {onOpenLocation && (
            <button
              onClick={onOpenLocation}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#B35F27] border border-white/15 text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#EBD9AB]" />
              <span className="hidden xl:inline">{isEn ? "Earth 3D" : "Satélite 3D"}</span>
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

      {/* MINI-MAPA RADAR */}
      <div className="hidden md:flex absolute bottom-20 left-4 z-20 flex-col bg-[#0A0D0B]/90 border border-white/15 rounded-2xl p-2.5 shadow-2xl backdrop-blur-xl w-56 pointer-events-auto">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#B35F27]" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#EBD9AB] font-bold">
              {isEn ? "Masterplan Radar" : "Radar Masterplan 3D"}
            </span>
          </div>
          <span className="text-[9px] font-mono text-white/60">{cameraYaw}°</span>
        </div>
        <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-white/10 bg-[#051415]">
          <img
            src="/loom/loom_masterplan_bg.webp"
            alt="Masterplan Radar"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-20 h-20 transition-transform duration-150 ease-out flex items-center justify-center"
              style={{ transform: `rotate(${cameraYaw}deg)` }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                <path
                  d="M 50 50 L 18 8 A 55 55 0 0 1 82 8 Z"
                  fill="rgba(179, 95, 39, 0.38)"
                  stroke="#EBD9AB"
                  strokeWidth="1.5"
                />
                <circle cx="50" cy="50" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[9px] text-white/60 px-1">
          <span>{isEn ? "Left click: Orbit" : "Clic izq: Orbitar 360°"}</span>
          <span>{isEn ? "Scroll: Zoom" : "Scroll: Zoom"}</span>
        </div>
      </div>

      {/* BARRA INFERIOR */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 bg-[#0A0D0B]/92 border border-[#B35F27]/45 rounded-2xl shadow-2xl backdrop-blur-xl max-w-[95vw] overflow-x-auto no-scrollbar pointer-events-auto">
        {CAMERA_PRESETS.map((preset) => {
          const isCurrent = activePreset.id === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => {
                setActivePreset(preset);
                if (preset.id === "general" || preset.id === "planta") {
                  setFocusMode("all");
                }
                if (preset.renderPreview && showDronePins) {
                  setDroneRenderModal(preset.renderPreview);
                } else {
                  setDroneRenderModal(null);
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                isCurrent
                  ? "bg-[#B35F27] text-white shadow-lg shadow-[#B35F27]/30"
                  : "text-[#EDE7E0]/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              {preset.renderPreview ? (
                <Camera className="w-3.5 h-3.5 text-[#EBD9AB] shrink-0" />
              ) : (
                <Box className="w-3.5 h-3.5 text-[#EBD9AB] shrink-0" />
              )}
              <span>{isEn ? preset.labelEn : preset.labelEs}</span>
            </button>
          );
        })}
      </div>

      {droneRenderModal && (
        <div className="absolute top-20 right-4 z-20 w-80 sm:w-96 bg-[#0A0D0B]/95 border border-[#B35F27]/60 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl pointer-events-auto">
          <div className="relative aspect-[16/10] w-full bg-black">
            <img
              src={droneRenderModal.src}
              alt={isEn ? droneRenderModal.titleEn : droneRenderModal.titleEs}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-[#0A0D0B]/80 border border-[#EBD9AB]/40 text-[9px] font-mono font-bold uppercase tracking-wider text-[#EBD9AB]">
              {isEn ? droneRenderModal.badgeEn : droneRenderModal.badgeEs}
            </div>
            <button
              onClick={() => setDroneRenderModal(null)}
              className="absolute top-2.5 right-2.5 py-1 px-2.5 rounded-full bg-black/75 hover:bg-[#B35F27] text-white text-[10px] font-bold uppercase tracking-wider border border-white/20 transition-all cursor-pointer"
            >
              {isEn ? "Close" : "Ver Maqueta 3D"}
            </button>
          </div>
          <div className="p-3 flex items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-serif font-bold text-white">
                {isEn ? droneRenderModal.titleEn : droneRenderModal.titleEs}
              </h4>
              <p className="text-[10px] text-[#EDE7E0]/65 mt-0.5">
                {isEn
                  ? "Camera synchronized with the 3D Interactive Maqueta"
                  : "Ángulo sincronizado con la cámara de la Maqueta 3D"}
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-[#B35F27] shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
}
