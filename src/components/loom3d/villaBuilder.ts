import * as THREE from "three";

// ============================================================================
// GENERADOR DE CORONA DE PALMERA COCOTERA REALISTA CON PENACHOS PLUMOSOS (CANVAS ALPHA)
// Reemplaza los conos tipo "Roblox" por hojas arqueadas con foliolos tropicales reales
// ============================================================================
export function createPalmFrondCrownTexture(): THREE.CanvasTexture {
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
export function createRealisticPalmCrownGeometry(): THREE.BufferGeometry {
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

export function createPerforatedLatticeTexture(isSunset: boolean = false): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext("2d")!;

  const baseGrad = ctx.createLinearGradient(0, 0, 0, 768);
  baseGrad.addColorStop(0, "#9c7450");
  baseGrad.addColorStop(0.5, "#8a6341");
  baseGrad.addColorStop(1, "#755132");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 768);

  for (let x = 0; x < 512; x += 3) {
    ctx.fillStyle = x % 6 === 0 ? "rgba(55, 34, 18, 0.14)" : "rgba(225, 185, 140, 0.09)";
    ctx.fillRect(x, 0, 1.5, 768);
  }

  ctx.fillStyle = "#241b16";
  ctx.fillRect(0, 0, 512, 22);
  ctx.fillRect(0, 746, 512, 22);
  ctx.fillRect(0, 0, 22, 768);
  ctx.fillRect(490, 0, 22, 768);
  ctx.fillRect(0, 372, 512, 24);
  ctx.fillRect(0, 248, 512, 10);
  ctx.fillRect(0, 620, 512, 10);
  ctx.fillRect(252, 0, 8, 768);

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
      const isLit = (r > 3 && r < 10 && c > 2 && c < 13) || (r > 15 && r < 22 && c > 3 && c < 12);
      ctx.fillStyle = isLit
        ? isSunset
          ? "#b87a3d"
          : "#4a3728"
        : "#1e140e";
      ctx.fillRect(cx + 3, cy + 3, cellW - 6, cellH - 6);
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

export function createLimestoneFacadeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, "#d8ccb9");
  grad.addColorStop(0.08, "#e5dccd");
  grad.addColorStop(0.5, "#e0d6c6");
  grad.addColorStop(0.92, "#dcd1c0");
  grad.addColorStop(1, "#c9bba7");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 3800; i++) {
    const x = (i * 73) % 512;
    const y = (i * 137) % 512;
    const w = 2 + (i % 6);
    const h = 1 + (i % 3);
    ctx.fillStyle = i % 2 === 0 ? "rgba(255, 250, 242, 0.14)" : "rgba(135, 118, 96, 0.11)";
    ctx.fillRect(x, y, w, h);
  }

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

export function createArchitecturalWindowTexture(isSunset: boolean): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

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

export function createPoolWaterCausticsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  const rad = ctx.createRadialGradient(128, 128, 18, 128, 128, 165);
  rad.addColorStop(0, "#38e2d0");
  rad.addColorStop(0.55, "#14b8a6");
  rad.addColorStop(1, "#0d7a73");
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, 256, 256);

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

  ctx.strokeStyle = "rgba(235, 255, 254, 0.55)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 252, 252);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createTropicalFoliageTexture(): THREE.CanvasTexture {
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

export function createCobblestoneTexture(): THREE.CanvasTexture {
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

export function createTeakDeckTexture(): THREE.CanvasTexture {
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

export interface CanonicalVillaMeshSpec {
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

export function mergeSimpleBufferGeometries(geos: THREE.BufferGeometry[]): THREE.BufferGeometry {
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
// ============================================================================
export function createSculptedTropicalTreeGeometries(): {
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

export interface VillaReplicaMaterials {
  limestoneStuccoMat: THREE.MeshStandardMaterial;
  limestoneWarmMat: THREE.MeshStandardMaterial;
  teakDeckMat: THREE.MeshStandardMaterial;
  teakSlatsMat: THREE.MeshStandardMaterial;
  darkBronzeMat: THREE.MeshStandardMaterial;
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
  vrayGroundBoxMats: THREE.MeshStandardMaterial[];
  vrayGroundGardenBoxMats: THREE.MeshStandardMaterial[];
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
  canonicalGardenVillaMeshes: CanonicalVillaMeshSpec[];
  splitInstancedVillaMeshes?: {
    sharedSpecs: CanonicalVillaMeshSpec[];
    luxuryOnlySpecs: CanonicalVillaMeshSpec[];
    gardenOnlySpecs: CanonicalVillaMeshSpec[];
  };
}

let sharedVillaTextureAssets: {
  limestoneTex: THREE.CanvasTexture;
  poolTex: THREE.CanvasTexture;
  foliageTex: THREE.CanvasTexture;
  deckTex: THREE.CanvasTexture;
  palmCrownGeo: THREE.BufferGeometry;
  vrayTexMap: Map<string, THREE.Texture>;
  texLoader: THREE.TextureLoader;
} | null = null;

function getSharedVillaTextureAssets() {
  if (!sharedVillaTextureAssets) {
    sharedVillaTextureAssets = {
      limestoneTex: createLimestoneFacadeTexture(),
      poolTex: createPoolWaterCausticsTexture(),
      foliageTex: createTropicalFoliageTexture(),
      deckTex: createTeakDeckTexture(),
      palmCrownGeo: createRealisticPalmCrownGeometry(),
      vrayTexMap: new Map<string, THREE.Texture>(),
      texLoader: new THREE.TextureLoader(),
    };
  }
  return sharedVillaTextureAssets;
}

export function createVillaReplicaMaterials(isSunset: boolean): VillaReplicaMaterials {
  const shared = getSharedVillaTextureAssets();
  const { limestoneTex, poolTex, foliageTex, deckTex, palmCrownGeo, vrayTexMap, texLoader } = shared;

  const loadVrayTex = (url: string) => {
    let t = vrayTexMap.get(url);
    if (!t) {
      t = texLoader.load(url);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      vrayTexMap.set(url, t);
    }
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
  const vrayGroundGardenTopMat = makeVrayMat("/loom/vray/vray_ground_plan_garden.webp?v=1", 0.68, 0.03);
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
    "#f5f7fa",
    "#cbd5e1",
    "#475569",
    "#1e3a5f",
    "#d6cbb5",
    "#1e232b",
    "#164e35",
    "#8f1d25",
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

  const vrayGroundBoxMats = [
    limestoneWarmMat,
    limestoneWarmMat,
    vrayGroundTopMat,
    limestoneWarmMat,
    limestoneWarmMat,
    limestoneWarmMat,
  ];

  const vrayGroundGardenBoxMats = [
    limestoneWarmMat,
    limestoneWarmMat,
    vrayGroundGardenTopMat,
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
    palmCrownTexMat: vrayPalmCrownMat,
    palmCrownGeo,
    vrayGroundBoxMats,
    vrayGroundGardenBoxMats,
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
    canonicalGardenVillaMeshes: [],
  };
}

// ============================================================================
// CONSOLIDACIÓN DE INSTANCIAS COMPARTIDAS (95% COMÚN ENTRE LUXURY Y GARDEN)
// ============================================================================
export function getOrBuildSplitInstancedVillaMeshes(mats: VillaReplicaMaterials) {
  if (mats.splitInstancedVillaMeshes) return mats.splitInstancedVillaMeshes;

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

  const rawSharedSpecs: CanonicalVillaMeshSpec[] = [
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
    {
      geo: mergeNormalizedBoxes([
        { sx: 0.54, sy: 0.07, sz: 0.085, px: 0.05, py: 0.035, pz: 0.435 },
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

  const rawLuxuryOnlySpecs: CanonicalVillaMeshSpec[] = [
    singleBox(1.0, 0.054, 1.0, 0, 0.027, 0, mats.vrayGroundBoxMats, false),
    {
      geo: mergeNormalizedBoxes([
        { sx: 0.082, sy: 0.085, sz: 0.88, px: 0.435, py: 0.0425, pz: 0 },
      ]),
      mat: mats.poolWaterMat,
      castShadow: false,
    },
  ];

  const rawGardenOnlySpecs: CanonicalVillaMeshSpec[] = [
    singleBox(1.0, 0.054, 1.0, 0, 0.027, 0, mats.vrayGroundGardenBoxMats, false),
    {
      geo: mergeNormalizedBoxes([
        { sx: 0.094, sy: 0.062, sz: 0.90, px: 0.432, py: 0.031, pz: 0 },
      ]),
      mat: mats.lawnGrassMat,
      castShadow: false,
    },
    {
      geo: mergeNormalizedBoxes([
        { sx: 0.042, sy: 0.115, sz: 0.92, px: 0.460, py: 0.058, pz: 0 },
        { sx: 0.088, sy: 0.105, sz: 0.044, px: 0.432, py: 0.052, pz: -0.44 },
        { sx: 0.088, sy: 0.105, sz: 0.044, px: 0.432, py: 0.052, pz: 0.44 },
      ]),
      mat: mats.roofHedgeMat,
      castShadow: false,
    },
  ];

  const result = {
    sharedSpecs: consolidateCanonicalSpecsByMaterial(rawSharedSpecs),
    luxuryOnlySpecs: consolidateCanonicalSpecsByMaterial(rawLuxuryOnlySpecs),
    gardenOnlySpecs: consolidateCanonicalSpecsByMaterial(rawGardenOnlySpecs),
  };
  mats.splitInstancedVillaMeshes = result;
  return result;
}

function getOrBuildCanonicalVillaMeshes(mats: VillaReplicaMaterials): CanonicalVillaMeshSpec[] {
  if (mats.canonicalVillaMeshes.length > 0) return mats.canonicalVillaMeshes;
  const split = getOrBuildSplitInstancedVillaMeshes(mats);
  mats.canonicalVillaMeshes = [...split.sharedSpecs, ...split.luxuryOnlySpecs];
  return mats.canonicalVillaMeshes;
}

function getOrBuildCanonicalGardenVillaMeshes(mats: VillaReplicaMaterials): CanonicalVillaMeshSpec[] {
  if (mats.canonicalGardenVillaMeshes.length > 0) return mats.canonicalGardenVillaMeshes;
  const split = getOrBuildSplitInstancedVillaMeshes(mats);
  mats.canonicalGardenVillaMeshes = [...split.sharedSpecs, ...split.gardenOnlySpecs];
  return mats.canonicalGardenVillaMeshes;
}

// ============================================================================
// RÉPLICA ARQUITECTÓNICA 3D CON PROYECCIÓN ORTOGRÁFICA V-RAY 1:1 (GEOMETRÍA CANÓNICA FUSIONADA)
// ============================================================================
export function buildLoomVillaReplica3D(
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

  const isGardenEdition = lotIndex % 2 === 1;
  const canonicalSpecs = isGardenEdition
    ? getOrBuildCanonicalGardenVillaMeshes(mats)
    : getOrBuildCanonicalVillaMeshes(mats);
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

  if (carTemplates.length > 0) {
    const carSlots = [zHouse - wHouse * 0.225, zHouse + wHouse * 0.215];
    const hasSecondCar = (lotIndex * 13 + 5) % 10 === 9;
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

