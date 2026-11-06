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

  function initLoom3DEarthLayer(map) {
    try {
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
