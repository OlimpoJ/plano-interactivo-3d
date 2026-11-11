import * as THREE from "three";

// ============================================================================
// GENERADOR DE ETIQUETAS PÍLDORA 3D FLOTANTES (ESTILO IMAGEN DE REFERENCIA)
// Crea badges oscuros translúcidos con borde dorado/blanco ('Alma Beach Club', 'B-22 • 252')
// ============================================================================
export function createFloatingPillSprite(
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

// ============================================================================
// GENERADORES DE TELEMETRÍA BIOCLIMÁTICA PRO (SOL VOLUMÉTRICO + BRISA ANIMADA)
// ============================================================================
export function createAnimatedWindFlowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 512, 64);

  // Ráfaga aerodinámica principal con cola suave translúcida y frente brillante
  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0.0, "rgba(14, 165, 233, 0.02)");
  grad.addColorStop(0.25, "rgba(34, 211, 238, 0.14)");
  grad.addColorStop(0.62, "rgba(56, 189, 248, 0.58)");
  grad.addColorStop(0.84, "rgba(186, 230, 253, 0.95)");
  grad.addColorStop(0.92, "rgba(255, 255, 255, 1.0)");
  grad.addColorStop(1.0, "rgba(14, 165, 233, 0.04)");

  // Perfil transversal suave para que el tubo luzca como una estela de aire sedosa
  for (let y = 0; y < 64; y++) {
    const vNorm = 1.0 - Math.abs((y - 31.5) / 31.5);
    const alphaProfile = Math.pow(Math.max(0, vNorm), 0.7);
    ctx.globalAlpha = alphaProfile;
    ctx.fillStyle = grad;
    ctx.fillRect(0, y, 512, 1);
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(1.6, 1);
  tex.needsUpdate = true;
  return tex;
}

export function createSunCoronaFlareSprite(isSunset: boolean): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const cx = 128;
  const cy = 128;

  // Halo solar volumétrico multicapa
  const rad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 122);
  rad.addColorStop(0.0, "rgba(255, 255, 250, 1.0)");
  rad.addColorStop(0.14, isSunset ? "rgba(255, 224, 130, 0.95)" : "rgba(254, 240, 138, 0.95)");
  rad.addColorStop(0.34, isSunset ? "rgba(251, 146, 60, 0.58)" : "rgba(251, 191, 36, 0.52)");
  rad.addColorStop(0.65, isSunset ? "rgba(234, 88, 12, 0.18)" : "rgba(245, 158, 11, 0.16)");
  rad.addColorStop(1.0, "rgba(245, 158, 11, 0.0)");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 256, 256);

  // Destellos ópticos sutiles (8 rayos solares finos)
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    const rayLen = i % 2 === 0 ? 112 : 76;
    const rayW = i % 2 === 0 ? 3.2 : 2.0;
    const rGrad = ctx.createLinearGradient(0, -rayLen, 0, rayLen);
    rGrad.addColorStop(0, "rgba(255, 250, 220, 0)");
    rGrad.addColorStop(0.5, "rgba(255, 252, 235, 0.65)");
    rGrad.addColorStop(1, "rgba(255, 250, 220, 0)");
    ctx.fillStyle = rGrad;
    ctx.fillRect(-rayW * 0.5, -rayLen, rayW, rayLen * 2);
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;

  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.38, 0.38, 1);
  sprite.renderOrder = 19;
  return sprite;
}

// ============================================================================
// NUBES CUMULUS ATMOSFÉRICAS 3D (SOLO PARA EL DESCENSO INICIAL DESDE EL CIELO)
// Textura procedural ligera (0 KB de red) que se libera de VRAM al terminar el vuelo
// ============================================================================
export function createAtmosphericCloudWispTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 512, 256);

  const puffs: [number, number, number, number, number][] = [
    [256, 132, 165, 88, 0.78],
    [168, 144, 132, 74, 0.68],
    [346, 142, 138, 76, 0.68],
    [224, 102, 118, 66, 0.62],
    [298, 106, 112, 64, 0.58],
    [112, 156, 94, 54, 0.44],
    [402, 156, 96, 54, 0.44],
  ];

  for (const [cx, cy, rx, ry, alpha] of puffs) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    const grad = ctx.createRadialGradient(0, -rx * 0.14, rx * 0.06, 0, 0, rx);
    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    grad.addColorStop(0.48, `rgba(244, 250, 254, ${(alpha * 0.65).toFixed(3)})`);
    grad.addColorStop(0.78, `rgba(214, 238, 248, ${(alpha * 0.24).toFixed(3)})`);
    grad.addColorStop(1, "rgba(214, 238, 248, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

// ============================================================================
// GENERADOR DE RUIDO FBM ORGÁNICO (PERLIN/VALUE NOISE 512x512 CONTINUO Y SIN COSTURAS)
// Optimizado (Paso 1): Precalcula tablas hash periódicas y evalúa FBM en 1 sola pasada
// usando diferencias finitas sobre el buffer de alturas (0 llamadas a Math.sin en FBM)
// ============================================================================
export function createOrganicWaterAndGrassTexture(): THREE.DataTexture {
  const size = 512;
  const mask = size - 1;
  const data = new Uint8Array(size * size * 4);

  // Hash 2D periódico (Tileable en bordes 0..period)
  const hash2 = (ix: number, iy: number, period: number) => {
    const px = ((ix % period) + period) % period;
    const py = ((iy % period) + period) % period;
    const h = Math.sin(px * 127.1 + py * 311.7) * 43758.5453123;
    return h - Math.floor(h);
  };

  const freqs = [6, 14, 30, 62] as const;
  const weights = [0.5, 0.28, 0.14, 0.08] as const;

  // Precalcular grillas de ruido y coordenadas de interpolación 1D para las 4 octavas
  const octaveTables = freqs.map((freq) => {
    const table = new Float32Array(freq * freq);
    for (let iy = 0; iy < freq; iy++) {
      for (let ix = 0; ix < freq; ix++) {
        table[iy * freq + ix] = hash2(ix, iy, freq);
      }
    }
    const i0 = new Int32Array(size);
    const i1 = new Int32Array(size);
    const uSmooth = new Float32Array(size);
    for (let s = 0; s < size; s++) {
      const coord = (s / size) * freq;
      const idx0 = Math.floor(coord);
      const frac = coord - idx0;
      i0[s] = ((idx0 % freq) + freq) % freq;
      i1[s] = (i0[s] + 1) % freq;
      uSmooth[s] = frac * frac * (3.0 - 2.0 * frac);
    }
    return { freq, table, i0, i1, uSmooth };
  });

  // Pasada 1: Evaluar altura FBM una sola vez por píxel (3x menos evaluaciones)
  const hBuffer = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const rowOffset = y * size;
    for (let x = 0; x < size; x++) {
      let val = 0;
      for (let o = 0; o < 4; o++) {
        const oct = octaveTables[o];
        const f = oct.freq;
        const ix0 = oct.i0[x];
        const ix1 = oct.i1[x];
        const iy0 = oct.i0[y] * f;
        const iy1 = oct.i1[y] * f;
        const ux = oct.uSmooth[x];
        const uy = oct.uSmooth[y];

        const a = oct.table[iy0 + ix0];
        const b = oct.table[iy0 + ix1];
        const c = oct.table[iy1 + ix0];
        const d = oct.table[iy1 + ix1];

        val += (a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy) * weights[o];
      }
      hBuffer[rowOffset + x] = val;
    }
  }

  // Pasada 2: Derivadas espaciales exactas desde hBuffer y empaquetado RGBA
  for (let y = 0; y < size; y++) {
    const rowOffset = y * size;
    const nextRowOffset = ((y + 1) & mask) * size;
    for (let x = 0; x < size; x++) {
      const idx = (rowOffset + x) * 4;
      const hC = hBuffer[rowOffset + x];
      const hR = hBuffer[rowOffset + ((x + 1) & mask)];
      const hU = hBuffer[nextRowOffset + x];

      const dx = (hR - hC) * 18.0;
      const dy = (hU - hC) * 18.0;
      const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
      const grain = h - Math.floor(h);

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

export const SKY_DOME_VERTEX_GLSL = /* glsl */ `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const SKY_DOME_FRAGMENT_GLSL = /* glsl */ `
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

export const TERRAIN_WATER_VERTEX_GLSL = /* glsl */ `
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

export const TERRAIN_WATER_FRAGMENT_GLSL = /* glsl */ `
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

    // Curva costera analítica + orgánica continua de Playa Alma (0.930 al Sur -> 0.870 al Norte)
    // Elimina por completo cualquier efecto espejo, puntos repetidos o costuras en el Mar Caribe
    float yClamped = clamp(mUv.y, 0.0, 1.0);
    float baseShoreX = 0.930 - 0.074 * yClamped + 0.014 * yClamped * yClamped;
    float outNorth = max(0.0, mUv.y - 1.0);
    float outSouth = max(0.0, -mUv.y);
    float outDistY = outNorth + outSouth;

    // Paso 6: Evaluar FBM costero y de bosque únicamente fuera del masterplan central (ahorra 3 lookups/píxel en todo el proyecto)
    float extShoreX = baseShoreX;
    vec2 fbmForestWarp = vec2(0.0);
    if (outDistY > 0.0005) {
      float fbmCoast = (texture2D(uDetailTex, vec2(mUv.y * 0.37, 0.23)).r - 0.5) * 0.015
                     + (texture2D(uDetailTex, vec2(mUv.y * 1.13, 0.71)).g - 0.5) * 0.008;
      float waveCoast = sin(mUv.y * 2.15) * 0.007 + sin(mUv.y * 5.35 + 1.3) * 0.0035;
      extShoreX = baseShoreX
                - smoothstep(0.0, 0.45, outNorth) * 0.010
                + smoothstep(0.0, 0.45, outSouth) * 0.008
                + (fbmCoast + waveCoast) * smoothstep(0.0, 0.16, outDistY);

      float outerForestFactor = clamp(outDistY * 4.0, 0.0, 1.0) * step(0.02, mUv.x) * (1.0 - smoothstep(0.76, 0.84, mUv.x));
      if (outerForestFactor > 0.001) {
        fbmForestWarp = (texture2D(uDetailTex, mUv * 3.2).rg - 0.5) * 0.06 * outerForestFactor;
      }
    }

    // Continuación exacta sin escalones ni contacto con los bordes blancos de la imagen (yMin=0.018, yMax=0.982)
    float yBand = mix(0.155, 0.042, smoothstep(0.74, 0.83, mUv.x));
    float yMin = 0.018;
    float yMax = 0.982;
    float sampleY = mUv.y;
    if (sampleY > yMax) {
      float dy = sampleY - yMax;
      float triY = 1.0 - abs(fract(dy * 1.35) * 2.0 - 1.0);
      sampleY = yMax - triY * yBand;
    } else if (sampleY < yMin) {
      float dy = yMin - sampleY;
      float triY = 1.0 - abs(fract(dy * 1.35) * 2.0 - 1.0);
      sampleY = yMin + triY * yBand;
    }

    float sampleX = clamp(mUv.x, 0.008, 0.985);
    if (outDistY > 0.0 && mUv.x > 0.76) {
      float shoreSampleY = 0.930 - 0.074 * sampleY + 0.014 * sampleY * sampleY;
      float coastAlign = smoothstep(0.0, 0.08, outDistY) * smoothstep(0.76, 0.84, mUv.x);
      sampleX = clamp(mUv.x + (shoreSampleY - extShoreX) * coastAlign, 0.008, 0.985);
    }

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
    float isClubPool = inMaster * (1.0 - smoothstep(0.845, 0.860, mUv.x));
    float analyticSea = max(0.0, (mUv.x - extShoreX) * 8.2);
    // Dentro de Playa Alma central manda la máscara exacta; hacia bordes N/S/Este funde C1 sin costuras con analyticSea
    float masterCoastBlend = smoothstep(0.03, 0.12, mUv.y)
                           * (1.0 - smoothstep(0.88, 0.97, mUv.y))
                           * (1.0 - smoothstep(0.90, 0.96, mUv.x));
    float coastalSeaDist = mix(analyticSea, masks.r, masterCoastBlend);
    float nonSandInCoast = smoothstep(0.865, 0.885, mUv.x) * smoothstep(-0.015, 0.025, baseCol.b - baseCol.r);
    float sdSea = (isClubPool > 0.5)
      ? masks.r
      : ((mUv.x > 0.845) ? max(coastalSeaDist, nonSandInCoast * 0.14) : 0.0);
    float grassMask = masks.g * (1.0 - smoothstep(0.01, 0.06, sdSea));
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
    // CAPA 3: MAR CARIBE BATIMÉTRICO 100% ORGÁNICO (CERO REPETICIÓN) Y PISCINAS
    // ========================================================================
    if (sdSea >= 0.025) {
      vec3 fbmData = sampleWaterFBM(mUv, uTime);
      vec2 waveN = fbmData.xy;
      float waveH = fbmData.z;

      if (isClubPool > 0.5) {
        // Piscinas de Alma Beach Club y Club House: refracción cristalina sobre el render base
        float poolFade = smoothstep(0.035, 0.11, sdSea);
        vec2 waterUv = clamp(sampleUv + waveN * 0.0028 * poolFade, 0.003, 0.997);
        vec3 refractedPool = texture2D(uMasterTex, waterUv).rgb;
        vec3 poolCol = mix(refractedPool, vec3(0.08, 0.62, 0.64), 0.28 * poolFade);

        float c1 = texture2D(uDetailTex, mUv * 48.0 + waveN * 0.06 + vec2(uTime * 0.025, 0.0)).a;
        float c2 = texture2D(uDetailTex, mUv * 54.0 - waveN * 0.06 - vec2(0.0, uTime * 0.022)).a;
        poolCol += vec3(0.16, 0.36, 0.34) * pow(min(c1, c2) * 1.65, 2.2) * poolFade;

        vec3 Np = normalize(vec3(waveN.x * 0.35, 1.0, waveN.y * 0.35));
        vec3 Vp = normalize(uCameraPos - vWorldPos);
        vec3 Rfp = reflect(-Vp, Np);
        float pGlitter = pow(max(dot(Rfp, uSunDir), 0.0), 220.0) * 2.6;
        vec3 sunTintP = mix(vec3(1.0, 0.99, 0.92), vec3(1.0, 0.68, 0.28), uIsSunset);
        poolCol += sunTintP * pGlitter * poolFade;

        finalCol = mix(baseCol, poolCol, smoothstep(0.035, 0.085, sdSea));
      } else {
        // MAR CARIBE REAL: Preserva el banco de arena dorada somera real de Playa Alma (R > G >= B)
        // y reemplaza 100% el agua estática (manchas grises y puntos blancos repetidos) por océano procedural vivo
        float shoreFade = smoothstep(0.025, 0.09, sdSea);
        vec2 refractOffset = waveN * 0.0026 * (0.35 + 0.65 * shoreFade);
        vec2 waterUv = clamp(sampleUv + refractOffset, 0.003, 0.997);
        vec3 refractedSample = texture2D(uMasterTex, waterUv).rgb;

        // Detector físico de arena dorada/arrecife somero (R > B y R >= G) vs agua/manchas/puntos blancos (B >= R)
        float sandWarmth = (refractedSample.r - refractedSample.b) + min(0.0, refractedSample.r - refractedSample.g);
        float isGoldenSandbar = smoothstep(0.016, 0.068, sandWarmth)
                              * (1.0 - smoothstep(0.932, 0.958, mUv.x))
                              * (1.0 - smoothstep(0.32, 0.58, sdSea));

        // Distancia efectiva desde el borde del banco de arena hacia mar abierto
        float waterDepth = max(0.0, sdSea * (1.0 - isGoldenSandbar * 0.72));

        // Variación orgánica submarina (arrecifes coralinos y bancos de arena a gran escala en coordenadas mundiales)
        mat2 reefRot = mat2(0.866, -0.50, 0.50, 0.866);
        float reefNoise1 = texture2D(uDetailTex, mUv * vec2(2.4, 1.6)).r;
        float reefNoise2 = texture2D(uDetailTex, (reefRot * mUv) * vec2(5.8, 3.9) + vec2(0.37, 0.61)).g;
        float reefNoise3 = texture2D(uDetailTex, mUv * vec2(13.5, 9.2) - vec2(0.19, 0.83)).b;
        float reefMottle = clamp(reefNoise1 * 0.52 + reefNoise2 * 0.33 + reefNoise3 * 0.15, 0.0, 1.0);

        // Gradiente batimétrico Caribeño limpio (Turquesa Cristalino -> Azul Arrecifal -> Zafiro Profundo)
        vec3 turquoiseReef = mix(vec3(0.09, 0.58, 0.57), vec3(0.04, 0.33, 0.43), smoothstep(0.25, 0.75, reefMottle));
        vec3 openOceanBase = mix(turquoiseReef, vec3(0.03, 0.25, 0.39), smoothstep(0.16, 0.78, waterDepth));
        openOceanBase = mix(openOceanBase, vec3(0.02, 0.15, 0.28), smoothstep(0.75, 2.80, waterDepth));

        // Fundir suavemente el banco de arena dorada real con el océano procedural libre de artefactos
        vec3 shallowSandbarTint = mix(refractedSample, vec3(0.12, 0.58, 0.56), 0.22 * shoreFade);
        vec3 seaCol = mix(openOceanBase, shallowSandbarTint, isGoldenSandbar);

        // Tren de olas oceánicas de largo período (Swells del Mar Caribe viajando hacia la costa)
        float swellPhase1 = waterDepth * 22.0 + uTime * 1.55 + waveH * 3.8 + sin(mUv.y * 9.5) * 1.1;
        float swellPhase2 = waterDepth * 36.0 - mUv.y * 7.5 + uTime * 2.10 + waveN.x * 3.0;
        float oceanSwell = sin(swellPhase1) * 0.62 + sin(swellPhase2) * 0.38;
        seaCol *= 1.0 + oceanSwell * 0.06 * smoothstep(0.05, 0.25, waterDepth);

        // Caústicas solares doradas/turquesa en la zona somera y media
        float caustic1 = texture2D(uDetailTex, mUv * 40.0 + waveN * 0.06 + vec2(uTime * 0.024, 0.0)).a;
        float caustic2 = texture2D(uDetailTex, mUv * 46.0 - waveN * 0.06 - vec2(0.0, uTime * 0.021)).a;
        float causticPattern = pow(min(caustic1, caustic2) * 1.65, 2.15);
        seaCol += vec3(0.14, 0.32, 0.30) * causticPattern * (1.0 - smoothstep(0.12, 0.75, waterDepth)) * shoreFade;

        // Rompiente viva multicapa siguiendo el contorno real del banco de arena (0 puntos fijos en mar abierto)
        float foamCells1 = texture2D(uDetailTex, mUv * vec2(52.0, 34.0) + waveN * 0.08 + vec2(uTime * 0.015, -uTime * 0.01)).a;
        float foamCells2 = texture2D(uDetailTex, (reefRot * mUv) * vec2(84.0, 58.0) - vec2(uTime * 0.018, 0.0)).b;
        float organicLace = smoothstep(0.36, 0.74, foamCells1 * 0.6 + foamCells2 * 0.4);

        // Espuma rompiendo exactamente en la transición del banco de arena al mar turquesa
        float sandbarDropEdge = smoothstep(0.05, 0.45, isGoldenSandbar) * (1.0 - smoothstep(0.55, 0.92, isGoldenSandbar));
        float rollingWave1 = smoothstep(0.58, 0.90, sin(waterDepth * 30.0 + uTime * 1.75 + waveH * 5.0) * 0.5 + 0.5);
        float rollingWave2 = smoothstep(0.64, 0.93, sin(sdSea * 26.0 - uTime * 1.40 + waveH * 5.4 - mUv.y * 5.0) * 0.5 + 0.5);
        float surfZone = smoothstep(0.03, 0.08, sdSea) * (1.0 - smoothstep(0.14, 0.42, waterDepth));

        float liveFoam = clamp(
          sandbarDropEdge * (0.28 + 0.52 * organicLace) * (0.55 + 0.45 * rollingWave1) +
          rollingWave1 * surfZone * organicLace * 0.52 +
          rollingWave2 * surfZone * organicLace * 0.34,
          0.0,
          0.85
        );

        vec3 foamColor = mix(vec3(0.95, 0.99, 1.0), vec3(1.0, 0.90, 0.76), uIsSunset * 0.6);
        seaCol = mix(seaCol, foamColor, liveFoam);

        // Iluminación Física: Normales de Olas + Fresnel + Destellos Diamante/Oro del Sol
        vec2 swellGrad = vec2(cos(swellPhase1) * 0.13 + cos(swellPhase2) * 0.08, sin(swellPhase2) * 0.05);
        vec3 N = normalize(vec3(waveN.x * 0.42 + swellGrad.x, 1.0, waveN.y * 0.42 + swellGrad.y));
        vec3 V = normalize(uCameraPos - vWorldPos);
        float fresnel = pow(1.0 - max(dot(N, V), 0.0), 4.0);

        vec3 skyRefl = mix(vec3(0.58, 0.84, 0.96), vec3(0.98, 0.58, 0.28), uIsSunset);
        seaCol = mix(seaCol, skyRefl, fresnel * 0.36 * shoreFade);

        vec3 Rf = reflect(-V, N);
        float glitterSharp = pow(max(dot(Rf, uSunDir), 0.0), 260.0) * 3.3;
        float glitterSoft  = pow(max(dot(Rf, uSunDir), 0.0), 32.0) * 0.36;
        vec3 sunTint = mix(vec3(1.0, 0.99, 0.92), vec3(1.0, 0.68, 0.28), uIsSunset);
        seaCol += sunTint * (glitterSharp + glitterSoft) * shoreFade;

        // Evitar que manchas frías de uMasterTex asomen donde sdSea es muy bajo (0.025..0.07)
        vec3 safeShoreBase = mix(vec3(0.76, 0.69, 0.56), baseCol, isGoldenSandbar);
        finalCol = mix(safeShoreBase, seaCol, smoothstep(0.025, 0.075, sdSea));
      }
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

