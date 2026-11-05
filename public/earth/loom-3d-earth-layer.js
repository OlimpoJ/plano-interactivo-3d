/**
 * PATRIMOFY EARTH 3D — CAPA DE MAQUETA 3D GEORREFERENCIADA DE LOOM LUXURY RESIDENCE
 * Monta los 318 lotes interactivos, las Villas 3D (con jacuzzi en rooftop y pérgola de teca),
 * las malocas de Alma Beach Club y las 165 palmeras 3D directamente sobre las coordenadas GPS
 * reales de Loom en Playa Alma (Vía al Mar Km 23, Zona Norte — Cartagena de Indias).
 */
(function () {
  // 4 esquinas GPS del corredor urbano de Loom (svgX: 100..3180, svgY: 620..1550)
  const P2_INLAND_SW = [-75.4200115501268, 10.63497076657517]; // (u=0, v=0) Portería SW
  const P4_INLAND_NE = [-75.4183919079239, 10.63581247299853]; // (u=0, v=1) Portería NE
  const P1_BEACH_SW  = [-75.42282349014033, 10.64166326065572]; // (u=1, v=0) Playa Alma SW
  const P0_BEACH_NE  = [-75.42078501356846, 10.64260401040842]; // (u=1, v=1) Playa Alma NE

  function svgToLngLat(svgX, svgY) {
    const u = (svgX - 100.0) / 3080.0;
    const v = (svgY - 620.0) / 930.0;
    const lng =
      (1 - u) * (1 - v) * P2_INLAND_SW[0] +
      (1 - u) * v * P4_INLAND_NE[0] +
      u * (1 - v) * P1_BEACH_SW[0] +
      u * v * P0_BEACH_NE[0];
    const lat =
      (1 - u) * (1 - v) * P2_INLAND_SW[1] +
      (1 - u) * v * P4_INLAND_NE[1] +
      u * (1 - v) * P1_BEACH_SW[1] +
      u * v * P0_BEACH_NE[1];
    return [lng, lat];
  }

  // Crea un rectángulo orientado en el espacio SVG y lo proyecta a un polígono GeoJSON [lng, lat]
  function makeOrientedRectRing(cx, cy, angleRad, halfL, halfW) {
    const ca = Math.cos(angleRad);
    const sa = Math.sin(angleRad);
    const corners = [
      [-halfL, -halfW],
      [halfL, -halfW],
      [halfL, halfW],
      [-halfL, halfW],
      [-halfL, -halfW],
    ];
    return corners.map(([lx, ly]) => {
      const sx = cx + lx * ca - ly * sa;
      const sy = cy + lx * sa + ly * ca;
      return svgToLngLat(sx, sy);
    });
  }

  function makeOctagonRing(cx, cy, radiusSvg) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      pts.push(svgToLngLat(cx + Math.cos(ang) * radiusSvg, cy + Math.sin(ang) * radiusSvg));
    }
    return pts;
  }

  async function initLoom3DEarthLayer(map) {
    try {
      const [lotsRes, landscapeRes, sheetRes] = await Promise.all([
        fetch("/loom/loom_unified_3d_lots.json?v=2").then((r) => r.json()),
        fetch("/loom/loom_landscape_3d.json").then((r) => r.json()),
        fetch("/api/lots?project=loom")
          .then((r) => r.json())
          .catch(() => ({ lots: [] })),
      ]);

      const statusMap = {};
      if (sheetRes && Array.isArray(sheetRes.lots)) {
        sheetRes.lots.forEach((l) => {
          statusMap[String(l.id || "").toUpperCase()] = l;
        });
      }

      // 1. Capa de Terreno Masterplan HD Georreferenciado (Corredor Urbano de Loom 100..3240, 580..1580)
      // Recortado a los bordes exactos del condominio para no tapar el bosque ni el mar satelital vecino
      const imgCoordinates = [
        svgToLngLat(0, 0),       // Top-Left
        svgToLngLat(3840, 0),    // Top-Right
        svgToLngLat(3840, 2160), // Bottom-Right
        svgToLngLat(0, 2160),    // Bottom-Left
      ];

      if (!map.getSource("loom-masterplan-hd-src")) {
        map.addSource("loom-masterplan-hd-src", {
          type: "image",
          url: "/loom/loom_masterplan_bg.webp",
          coordinates: imgCoordinates,
        });

        map.addLayer(
          {
            id: "loom-masterplan-hd-layer",
            type: "raster",
            source: "loom-masterplan-hd-src",
            minzoom: 14.2,
            paint: {
              "raster-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                14.2, 0.0,
                15.2, 0.78,
                16.5, 0.92,
              ],
              "raster-fade-duration": 300,
            },
          },
          map.getLayer("lots-fill") ? "lots-fill" : undefined
        );
      }

      // 2. Construir GeoJSON de los 318 Lotes Interactivos + Villas 3D Multicapa + Palmeras 3D
      const lotFeatures = [];
      const archFeatures = [];

      lotsRes.forEach((pLot, idx) => {
        if (!pLot.vertices || pLot.vertices.length < 3) return;
        const liveLot = statusMap[String(pLot.id).toUpperCase()] || {};
        const status = liveLot.status || (pLot.isAmenity ? "common" : "available");
        const isAmenity = pLot.isAmenity || status === "common";

        let color = "#10b981";
        if (isAmenity) color = "#c27838";
        else if (status === "blocked" || status === "reserved") color = "#f59e0b";
        else if (status === "sold") color = "#ef4444";

        const ring = pLot.vertices.map(([vx, vy]) => svgToLngLat(vx, vy));
        ring.push(ring[0]);

        lotFeatures.push({
          type: "Feature",
          id: idx + 1,
          geometry: {
            type: "Polygon",
            coordinates: [ring],
          },
          properties: {
            lotId: pLot.id,
            rawId: liveLot.rawId || pLot.id,
            stageId: pLot.stageId,
            area: liveLot.area || "252",
            totalPrice: liveLot.totalPrice || "Consultar",
            status: status,
            color: color,
            base: 0,
            height: isAmenity ? 0.6 : 1.1,
          },
        });

        // Alternación Estilo Referencia (~45% de lotes con Villa 3D en Tierra)
        const isShowcase = !isAmenity && (idx * 7 + 3) % 11 < 5;
        if (isShowcase && pLot.vertices.length >= 4) {
          let bestLen = 0;
          let angle = -0.68;
          for (let i = 0; i < pLot.vertices.length; i++) {
            const [x1, y1] = pLot.vertices[i];
            const [x2, y2] = pLot.vertices[(i + 1) % pLot.vertices.length];
            const d = Math.hypot(x2 - x1, y2 - y1);
            if (d > bestLen) {
              bestLen = d;
              angle = Math.atan2(y2 - y1, x2 - x1);
            }
          }

          if (pLot.backAngle !== undefined) angle = pLot.backAngle;
          const vcx = pLot.villaCx !== undefined ? pLot.villaCx : pLot.cx;
          const vcy = pLot.villaCy !== undefined ? pLot.villaCy : pLot.cy;
          const hL = pLot.villaL ? pLot.villaL * 0.48 : Math.min(20, Math.max(12, bestLen * 0.34));
          const hW = pLot.villaW ? pLot.villaW * 0.48 : hL * 0.68;
          const ca = Math.cos(angle);
          const sa = Math.sin(angle);

          const pa = angle + Math.PI / 2;
          const cpa = Math.cos(pa);
          const spa = Math.sin(pa);
          const zHouseOff = -hW * 0.25;
          const hx = vcx + cpa * zHouseOff;
          const hy = vcy + spa * zHouseOff;
          const wH = hW * 0.67;

          // 1. Carport Frontal en Adoquín Gris (-X)
          archFeatures.push({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [makeOrientedRectRing(hx - ca * (hL * 0.67), hy - sa * (hL * 0.67), angle, hL * 0.29, wH)],
            },
            properties: { color: "#989690", base: 1.0, height: 1.35 },
          });

          // 2. Bloque Frontal 3 Niveles en Estuco Calizo Arena (#e2d8c9) + Celosía en Voladizo (#8c6747)
          archFeatures.push({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [makeOrientedRectRing(hx - ca * (hL * 0.19), hy - sa * (hL * 0.19), angle, hL * 0.21, wH)],
            },
            properties: { color: "#e2d8c9", base: 1.1, height: 9.8 },
          });
          archFeatures.push({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [makeOrientedRectRing(hx - ca * (hL * 0.49), hy - sa * (hL * 0.49), angle, hL * 0.10, wH)],
            },
            properties: { color: "#8c6747", base: 3.8, height: 9.6 },
          });

          // 3. Bloque Posterior Niveles 1 y 2 en Estuco Calizo Arena (#e2d8c9) + Pérgola y Antepecho Rooftop
          archFeatures.push({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [makeOrientedRectRing(hx + ca * (hL * 0.45), hy + sa * (hL * 0.45), angle, hL * 0.19, wH)],
            },
            properties: { color: "#dfd5c5", base: 1.1, height: 8.0 },
          });
          archFeatures.push({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [makeOrientedRectRing(hx + ca * (hL * 0.26), hy + sa * (hL * 0.26), angle, hL * 0.20, wH * 0.94)],
            },
            properties: { color: "#966946", base: 8.0, height: 9.7 },
          });
          // Jacuzzi en Azotea (+Z del Rooftop posterior)
          archFeatures.push({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [makeOrientedRectRing(hx + ca * (hL * 0.58) + cpa * (wH * 0.46), hy + sa * (hL * 0.58) + spa * (wH * 0.46), angle, hL * 0.09, wH * 0.38)],
            },
            properties: { color: "#14b8a6", base: 8.0, height: 8.45 },
          });

          // 4. Deck de Teca Posterior + Piscina Posterior a Todo el Ancho del Lote (+X)
          archFeatures.push({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [makeOrientedRectRing(vcx + ca * (hL * 0.72), vcy + sa * (hL * 0.72), angle, hL * 0.09, hW * 0.90)],
            },
            properties: { color: "#9c7a54", base: 1.05, height: 1.45 },
          });
          archFeatures.push({
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [makeOrientedRectRing(vcx + ca * (hL * 0.86), vcy + sa * (hL * 0.86), angle, hL * 0.075, hW * 0.88)],
            },
            properties: { color: "#14b8a6", base: 1.05, height: 1.55 },
          });
        }
      });

      // 3. Malocas Orgánicas de Alma Beach Club en la Playa
      archFeatures.push({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [makeOctagonRing(2860, 875, 42)] },
        properties: { color: "#d4aa72", base: 0.0, height: 0.0 },
      });
      archFeatures.push({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [makeOctagonRing(2925, 925, 36)] },
        properties: { color: "#c2935a", base: 0.0, height: 0.0 },
      });

      // 4. Las 165 Palmeras Cocoteras 3D (Tronco + Corona Tropical)
      if (landscapeRes && Array.isArray(landscapeRes.palms)) {
        landscapeRes.palms.forEach(([sx, sy, sc]) => {
          const h = 9.5 * (sc || 1.0);
          archFeatures.push({
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [makeOctagonRing(sx, sy, 2.2)] },
            properties: { color: "#6e543b", base: 0, height: h },
          });
          archFeatures.push({
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [makeOctagonRing(sx, sy, 12.5 * (sc || 1.0))] },
            properties: { color: "#2e6f2c", base: h * 0.86, height: h * 1.12 },
          });
        });
      }

      map.addSource("loom-earth-3d-lots-src", {
        type: "geojson",
        data: { type: "FeatureCollection", features: lotFeatures },
      });

      map.addSource("loom-earth-3d-arch-src", {
        type: "geojson",
        data: { type: "FeatureCollection", features: archFeatures },
      });

      map.addLayer({
        id: "loom-earth-3d-lots-layer",
        type: "fill-extrusion",
        source: "loom-earth-3d-lots-src",
        minzoom: 14.5,
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-base": ["get", "base"],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-opacity": 0.62,
        },
      });

      map.addLayer({
        id: "loom-earth-3d-arch-layer",
        type: "fill-extrusion",
        source: "loom-earth-3d-arch-src",
        minzoom: 14.8,
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-base": ["get", "base"],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-opacity": 0.94,
        },
      });

      // Tooltip Flotante al pasar el mouse por cualquier lote 3D sobre el satélite
      const tooltip = document.createElement("div");
      tooltip.style.cssText =
        "position:fixed;z-index:9999;pointer-events:none;display:none;background:rgba(10,14,12,0.94);border:1px solid rgba(212,175,55,0.65);border-radius:12px;padding:8px 12px;color:#f8fafc;font-family:sans-serif;box-shadow:0 12px 28px rgba(0,0,0,0.65);backdrop-filter:blur(10px);";
      document.body.appendChild(tooltip);

      map.on("mousemove", "loom-earth-3d-lots-layer", (e) => {
        if (!e.features || e.features.length === 0) return;
        const p = e.features[0].properties;
        map.getCanvas().style.cursor = "pointer";
        tooltip.style.display = "block";
        tooltip.style.left = Math.min(window.innerWidth - 240, e.originalEvent.clientX + 14) + "px";
        tooltip.style.top = Math.max(12, e.originalEvent.clientY - 52) + "px";
        tooltip.innerHTML =
          '<div style="font-size:12px;font-weight:700;color:#ebd9ab;">Lote ' +
          p.rawId +
          " • " +
          p.area +
          ' m²</div><div style="font-size:11px;color:#cbd5e1;margin-top:2px;">' +
          p.totalPrice +
          ' · <span style="color:#34d399;font-weight:700;">Clic para abrir Villa 3D</span></div>';
      });

      map.on("mouseleave", "loom-earth-3d-lots-layer", () => {
        map.getCanvas().style.cursor = "";
        tooltip.style.display = "none";
      });

      map.on("click", "loom-earth-3d-lots-layer", (e) => {
        if (!e.features || e.features.length === 0) return;
        const p = e.features[0].properties;
        if (window.parent && window.parent !== window) {
          window.parent.postMessage(
            {
              type: "PATRIMOFY_EARTH_SELECT_LOT",
              lotId: p.lotId,
              stageId: p.stageId,
            },
            "*"
          );
        }
      });

      // Botón Táctico en la Barra Superior de Patrimofy Earth: "Acercar a Maqueta 3D en Tierra"
      const headerActions = document.querySelector(".header-actions");
      if (headerActions && !document.getElementById("btn-earth-zoom-maqueta")) {
        const btn = document.createElement("button");
        btn.className = "btn-tactical";
        btn.id = "btn-earth-zoom-maqueta";
        btn.style.cssText =
          "border-color:rgba(212,175,55,0.65);background:rgba(179,95,39,0.28);color:#ebd9ab;";
        btn.innerHTML = "<span>🏠 Villas 3D en Tierra</span>";
        btn.addEventListener("click", () => {
          map.flyTo({
            center: [-75.42125, 10.64085],
            zoom: 17.65,
            pitch: 66,
            bearing: -32,
            duration: 1800,
          });
        });
        headerActions.prepend(btn);
      }
    } catch (err) {
      console.error("Error initializing Loom 3D Earth Layer:", err);
    }
  }

  function boot() {
    const map = window.__PATRIMOFY_EARTH_MAP__;
    if (map) {
      if (map.loaded()) initLoom3DEarthLayer(map);
      else map.on("load", () => initLoom3DEarthLayer(map));
    } else {
      window.addEventListener("patrimofy-earth-ready", (ev) => {
        const m = ev.detail.map;
        if (m.loaded()) initLoom3DEarthLayer(m);
        else m.on("load", () => initLoom3DEarthLayer(m));
      });
    }
  }

  boot();
})();
