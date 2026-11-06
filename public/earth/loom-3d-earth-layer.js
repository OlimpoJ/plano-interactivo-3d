/**
 * PATRIMOFY EARTH 3D — CAPA DE MASTERPLAN GEORREFERENCIADO DE LOOM LUXURY RESIDENCE
 * Proyecta únicamente el recorte arquitectónico limpio del proyecto Loom + Alma Beach Club
 * y sus sombrillas/malocas ajustado al 100% dentro del polígono amarillo oficial en Playa Alma
 * (Vía al Mar Km 23, Zona Norte — Cartagena de Indias), sin selector de lotes superpuesto.
 */
(function () {
  // 4 esquinas GPS del polígono amarillo oficial de Loom Luxury Residence
  const P2_INLAND_SW = [-75.4200115501268, 10.63497076657517]; // (u=0, v=0) Portería SW
  const P4_INLAND_NE = [-75.4183919079239, 10.63581247299853]; // (u=0, v=1) Portería NE
  const P1_BEACH_SW  = [-75.42282349014033, 10.64166326065572]; // (u=1, v=0) Playa Alma SW
  const P0_BEACH_NE  = [-75.42078501356846, 10.64260401040842]; // (u=1, v=1) Playa Alma NE

  function uvToLngLat(u, v) {
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

  function injectSubtleGlassStyles() {
    if (document.getElementById("patrimofy-subtle-glass-styles")) return;
    const style = document.createElement("style");
    style.id = "patrimofy-subtle-glass-styles";
    style.textContent = `
      @keyframes glassFloatSlow {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-3px); }
      }
      @keyframes calloutPulseSlow {
        0% { transform: scale(0.75); opacity: 0.55; }
        70% { transform: scale(2.1); opacity: 0; }
        100% { transform: scale(2.1); opacity: 0; }
      }
      /* Tarjetas de proyecto minimalistas en Glassmorphism */
      .luxury-callout-marker {
        transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease !important;
      }
      .callout-card {
        background: rgba(14, 20, 26, 0.26) !important;
        border: 1px solid rgba(255, 255, 255, 0.22) !important;
        border-radius: 999px !important;
        padding: 4px 11px !important;
        -webkit-backdrop-filter: blur(16px) saturate(140%) !important;
        backdrop-filter: blur(16px) saturate(140%) !important;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.16) !important;
        gap: 1px !important;
        animation: glassFloatSlow 7.5s ease-in-out infinite !important;
        transition: all 0.55s cubic-bezier(0.16, 1, 0.3, 1) !important;
      }
      .luxury-callout-marker:hover .callout-card {
        background: rgba(14, 20, 26, 0.48) !important;
        border-color: rgba(255, 255, 255, 0.42) !important;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
      }
      .callout-header {
        gap: 6px !important;
      }
      .callout-dot {
        width: 5px !important;
        height: 5px !important;
        box-shadow: 0 0 5px var(--marker-color) !important;
      }
      .callout-name {
        font-family: var(--font-sans) !important;
        font-size: 10px !important;
        font-weight: 600 !important;
        letter-spacing: 0.8px !important;
        color: rgba(255, 255, 255, 0.92) !important;
      }
      .callout-sub {
        display: none !important;
      }
      .callout-stem-v {
        width: 1px !important;
        height: 26px !important;
        background: linear-gradient(to top, rgba(255,255,255,0.45), rgba(255,255,255,0.08)) !important;
        box-shadow: none !important;
      }
      .callout-stem-h {
        height: 1px !important;
        width: 26px !important;
        background: linear-gradient(to right, rgba(255,255,255,0.45), rgba(255,255,255,0.08)) !important;
        box-shadow: none !important;
      }
      .arrow-down, .arrow-up, .arrow-left, .arrow-right {
        display: none !important;
      }
      .callout-target {
        width: 12px !important;
        height: 12px !important;
      }
      .callout-target-dot {
        width: 5px !important;
        height: 5px !important;
        border: 1px solid rgba(255, 255, 255, 0.85) !important;
        box-shadow: 0 0 6px var(--marker-color) !important;
      }
      .callout-target-pulse {
        width: 12px !important;
        height: 12px !important;
        border-width: 1px !important;
        animation: calloutPulseSlow 5.5s cubic-bezier(0.25, 1, 0.5, 1) infinite !important;
      }

      /* Puntos de referencia (Alma Beach Club, etc.) en Glassmorphism ultra-sutil */
      .ref-point-marker {
        gap: 6px !important;
        transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease !important;
      }
      .ref-point-marker:hover {
        transform: scale(1.03) !important;
      }
      .ref-point-dot {
        width: 6px !important;
        height: 6px !important;
        background: rgba(255, 255, 255, 0.9) !important;
        border: 1px solid rgba(255, 255, 255, 0.6) !important;
        box-shadow: 0 0 6px rgba(255, 255, 255, 0.5) !important;
      }
      .ref-point-card {
        background: rgba(14, 20, 26, 0.24) !important;
        border: 1px solid rgba(255, 255, 255, 0.20) !important;
        border-radius: 999px !important;
        padding: 3.5px 10px !important;
        -webkit-backdrop-filter: blur(16px) saturate(140%) !important;
        backdrop-filter: blur(16px) saturate(140%) !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.14) !important;
        animation: glassFloatSlow 8.5s ease-in-out infinite !important;
      }
      .ref-point-title {
        font-family: var(--font-sans) !important;
        font-size: 9.5px !important;
        font-weight: 500 !important;
        color: rgba(255, 255, 255, 0.9) !important;
        letter-spacing: 0.5px !important;
      }
      .ref-point-desc {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function initLoom3DEarthLayer(map) {
    try {
      injectSubtleGlassStyles();

      // Suavizar la velocidad de vuelo de cámara (flyTo) para transiciones cinematográficas más lentas
      if (!map.__subtleFlyPatched) {
        map.__subtleFlyPatched = true;
        const origFlyTo = map.flyTo.bind(map);
        map.flyTo = function (opts) {
          return origFlyTo({
            ...opts,
            speed: opts && opts.speed ? Math.min(opts.speed, 0.65) : 0.6,
            curve: opts && opts.curve ? opts.curve : 1.25,
          });
        };
      }
      // Coordenadas exactas del recorte rectificado (u: -0.015..1.120, v: -0.025..1.025)
      // donde u in [0, 1] y v in [0, 1] encajan al 100% con el polígono amarillo de Loom
      // y u in [1.0, 1.12] proyecta las sombrillas y malocas del Alma Beach Club sobre la playa real
      const U_MIN = -0.015;
      const U_MAX = 1.120;
      const V_MIN = -0.025;
      const V_MAX = 1.025;

      const imgCoordinates = [
        uvToLngLat(U_MIN, V_MIN), // Top-Left
        uvToLngLat(U_MAX, V_MIN), // Top-Right
        uvToLngLat(U_MAX, V_MAX), // Bottom-Right
        uvToLngLat(U_MIN, V_MAX), // Bottom-Left
      ];

      if (!map.getSource("loom-masterplan-hd-src")) {
        map.addSource("loom-masterplan-hd-src", {
          type: "image",
          url: "/loom/loom_earth_cutout.webp?v=4",
          coordinates: imgCoordinates,
        });

        map.addLayer(
          {
            id: "loom-masterplan-hd-layer",
            type: "raster",
            source: "loom-masterplan-hd-src",
            minzoom: 13.5,
            paint: {
              "raster-opacity": [
                "interpolate",
                ["linear"],
                ["zoom"],
                13.5, 0.0,
                14.5, 0.96,
                18.5, 1.0,
              ],
              "raster-fade-duration": 300,
            },
          },
          map.getLayer("lots-line") ? "lots-line" : undefined
        );
      }

      // Reducir el relleno amarillo semitransparente sobre Loom para que el masterplan se vea 100% nítido,
      // conservando el borde dorado ("lots-line") que enmarca el polígono amarillo del proyecto.
      if (map.getLayer("lots-fill")) {
        map.setPaintProperty("lots-fill", "fill-opacity", [
          "match",
          ["get", "id"],
          "loom",
          ["case", ["boolean", ["feature-state", "hover"], false], 0.12, 0.0],
          ["case", ["boolean", ["feature-state", "hover"], false], 0.52, 0.28],
        ]);
      }
    } catch (err) {
      console.error("Error initializing Loom Georeferenced Masterplan Layer:", err);
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
