import { getStageDisplayName } from "@/lib/loomI18n";
import { LOOM_NORTH_MAP_ANGLE_RAD } from "@/lib/loomGeoOrientation";
import type { MaquetaLot } from "@/types/lots";
import type { Unified3DLot } from "./presets";

export interface ExportAvailabilityMapOptions {
  unifiedLots: Unified3DLot[];
  lotsMap: Record<string, MaquetaLot>;
  selectedLot: MaquetaLot | null;
  stageId: string;
  isEn: boolean;
}

export async function exportLoomAvailabilityMapPng({
  unifiedLots,
  lotsMap,
  selectedLot,
  stageId,
  isEn,
}: ExportAvailabilityMapOptions): Promise<void> {
  if (unifiedLots.length === 0) return;

  const loadImg = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.crossOrigin = "anonymous";
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = src;
    });

  const [bgImg, logoImg] = await Promise.all([
    loadImg("/loom/loom_masterplan_bg.webp?v=8"),
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
      ctx.fillStyle = "rgba(62, 142, 118, 0.64)";
      ctx.strokeStyle = "rgba(212, 245, 233, 0.92)";
      ctx.lineWidth = 1.8;
    } else if (status === "blocked" || status === "reserved") {
      ctx.fillStyle = "rgba(212, 142, 38, 0.68)";
      ctx.strokeStyle = "rgba(253, 230, 138, 0.96)";
      ctx.lineWidth = 1.8;
    } else {
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

  // 4. Píldoras de Etapas y Amenidades estilo Brochure Oficial Loom
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

  // Rosa de los Vientos en Marfil & Cobre Terracota (calibrada al ángulo exacto 28.38° del Plano A001)
  const compX = PAD_X + 58;
  const compY = HEADER_H + MAP_H - 46;
  ctx.fillStyle = "rgba(245, 241, 236, 0.93)";
  ctx.strokeStyle = "rgba(179, 95, 39, 0.86)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(compX, compY, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.translate(compX, compY);
  ctx.rotate(LOOM_NORTH_MAP_ANGLE_RAD);
  ctx.fillStyle = "#B35F27";
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(-4, -5.5);
  ctx.lineTo(1, 0);
  ctx.lineTo(-4, 5.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 9.5px 'Galano Grotesque', sans-serif";
  ctx.fillStyle = "#3B2210";
  ctx.fillText(
    "N",
    compX + Math.cos(LOOM_NORTH_MAP_ANGLE_RAD) * 20.5,
    compY + Math.sin(LOOM_NORTH_MAP_ANGLE_RAD) * 20.5
  );

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

  // 4 Tarjetas KPI en paleta oficial Loom
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

    ctx.fillStyle = k.accent;
    ctx.beginPath();
    ctx.roundRect(cx0 + 18, cy0 + 1, cardW - 36, 4, 2);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = k.numCol;
    ctx.font = "400 38px 'Branch', Georgia, serif";
    ctx.fillText(k.num, cx0 + 20, cy0 + 14);

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
}

