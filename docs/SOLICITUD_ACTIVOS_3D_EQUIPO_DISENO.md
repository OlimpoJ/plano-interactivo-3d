# 📋 Brief Técnico de Solicitud para el Equipo de Diseño, Arquitectura y Visualización 3D
**Proyecto:** Loom Luxury Residence — Playa Alma (Proyecto Alma Beach), Vía al Mar / Zona Norte, Cartagena de Indias  
**Promotora:** Rubik 5 · **Constructora:** ICG · **Arquitectura Bioclimática:** Maadga Group (Gary Michell)  
**Destino Técnico:** Motor WebGL del Plano Interactivo 3D & `earth.patrimofy.com` (Experiencia *"Del Cielo a la Tierra"*)

---

## 🎯 Objetivo del Entregable
Integrar los modelos arquitectónicos 3D reales y las vistas reales de dron dentro de nuestro motor WebGL interactivo en tiempo real (`60 FPS` en celulares, tablets y computadores). Para que el navegador los cargue en menos de **2 segundos** sin congelar dispositivos móviles, los archivos **no pueden ser los archivos pesados de 3ds Max / Lumion / D5 / V-Ray en crudo**, sino versiones optimizadas para WebGL según las especificaciones de este documento.

---

## 1. Modelos 3D de las Villas (`.GLB` Optimizado para WebGL)

Necesitamos los **2 modelos arquitectónicos exteriores** exportados en formato **`.glb` (glTF 2.0 binario con compresión Draco / KTX2)**:

| # | Archivo Solicitado | Modelo Arquitectónico | Peso Máximo | Polígonos Máx. (Triángulos) |
| :--- | :--- | :--- | :--- | :--- |
| **1** | `loom_villa_luxury.glb` | **Villa Luxury (353 m² · 3 Niveles + Altillo Rooftop)** | **<= 4 MB** | **<= 25,000 tris** |
| **2** | `loom_villa_garden.glb` | **Villa Garden (274 m² · Edición Biofílica)** | **<= 4 MB** | **<= 22,000 tris** |

### Reglas Técnicas de Exportación de las Villas (`.glb`):
1. **Solo Volumetría Exterior y Fachadas (Cero Mobiliario Interior Pesado):**
   - **SÍ incluir:** Fachadas en piedra coralina/estuco, paneles de celosía bioclimática en madera teca, ventanales de vidrio, pérgolas superiores, terraza altillo, jacuzzi exterior, deck de madera, espejo de agua de acceso y piscina privada posterior.
   - **NO incluir:** Camas, sofás internos, griferías, vajillas, cojines de alta densidad ni vegetación de millones de polígonos (para los interiores ya tenemos el Showroom 3D con los 33 renders 4K y los 5 recorridos Kuula 360°).
2. **Nomenclatura de Materiales PBR (Para encender luces en Modo Atardecer / Noche):**
   - Nombrar los materiales en Blender / 3ds Max de forma clara para que nuestro motor 3D los reconozca automáticamente:
     - `MAT_VIDRIO_VENTANAL` (vidrios que se iluminarán con luz cálida `2700K` cuando el cliente active el botón **Atardecer**).
     - `MAT_AGUA_PISCINA` (superficie de agua de la piscina privada y jacuzzi en el rooftop).
     - `MAT_CELOSIA_MADERA` (celosías y pérgolas bioclimáticas).
     - `MAT_MURO_PIEDRA` y `MAT_ESTUCO_BLANCO`.
3. **Escala, Punto Pivote y Orientación:**
   - **Escala:** `1 unidad = 1 metro real`.
   - **Pivote (`0, 0, 0`):** Centrado en la base del lote a nivel de piso (`Y = 0`), con la **fachada principal de acceso mirando hacia el eje +Z** (o indicar eje de fachada).
4. **Texturas Integradas (Baked PBR):**
   - Resolución máxima de atlas de textura: **`2048 x 2048 px`** en formato WebP/KTX2 integrado dentro del `.glb` (*BaseColor, Roughness/Metalness, Normal Map y Ambient Occlusion horneado*).

---

## 2. Modelos 3D de Zonas Comunes & Amenidades (`.GLB` Ligero)

Para que la **Maqueta 3D General** luzca como un resort de ultra-lujo vivo, solicitamos las volumetrías exteriores ligeras de los 4 hitos arquitectónicos del urbanismo:

| # | Archivo Solicitado | Hito / Amenidad | Peso Máximo | Polígonos Máx. |
| :--- | :--- | :--- | :--- | :--- |
| **3** | `loom_porteria_monumental.glb` | **Portería Principal 24/7** (Cubierta en voladizo con vegetación colgante, caseta en celosía, muro en piedra y óvalo de acceso) | **<= 3.5 MB** | **<= 20,000 tris** |
| **4** | `loom_club_house.glb` | **Club House & LOOM Oasis** (Volumetrías de salones, piscinas orgánicas, espejos de agua y canchas de pádel/tenis) | **<= 5 MB** | **<= 35,000 tris** |
| **5** | `loom_alma_beach_club.glb` | **Alma Beach Club (Salida Directa al Mar)** (Pérgolas de bambú/madera, Ocean Lounge, Ocean Dining, Sunset Spa, piscinas frente a la playa y zona de Sun Beds) | **<= 5 MB** | **<= 35,000 tris** |
| **6** | `loom_parques_masterplan.glb` | **Terreno Base + Vías + Parques Lineales (The Garden Walk & Lago Loom)** (Malla topográfica del proyecto con andenes, vías adoquinadas y espejos de agua) | **<= 6 MB** | **<= 40,000 tris** |

> **Nota sobre Vegetación y Palmeras 3D:**  
> No exporten miles de palmeras duplicadas dentro del archivo del terreno. En su lugar, entréguennos **1 solo archivo de palmera optimizada (`palmera_caribe_lowpoly.glb`, <= 800 triángulos)** y el plano de ubicación. Nuestro motor 3D las multiplica por `InstancedMesh` en tarjeta gráfica sin consumir memoria.

---

## 3. Plano Maestro Unificado de Todo el Terreno (318 Lotes en 1 Solo SVG Ligero)

Anteriormente dividimos el plano 2D en **5 etapas separadas** (`Etapa 1` a `Etapa 5`) porque los primeros SVGs tenían imágenes pesadas incrustadas adentro y en una vista 2D fija los 318 lotes se veían muy pequeños en celular.

Sin embargo, en la **Maqueta 3D Interactiva WebGL**, la cámara **vuela, orbita y hace zoom libremente por todo el proyecto de punta a punta** (desde la Portería Monumental en la Vía al Mar hasta Alma Beach Club). Además, cuando se exportan **solo los vectores puros** (sin imágenes incrustadas), **los 318 lotes juntos pesan menos de `90 KB`** (actualmente las 5 etapas vectoriales sumadas pesan solo `85.2 KB`).

Por lo tanto, solicitamos **1 Plano Maestro Unificado de todo el terreno completo** dividido en dos archivos separados (Imagen + Vectores) con exactamente el mismo encuadre (`viewBox`):

1. **Imagen Base Cenital (`loom_masterplan_cenital_bg.webp` o `.png` en `4096 x 4096 px` o `8192 x 4096 px`):**
   - Render cenital (`90°` totalmente desde arriba, **Cámara Ortográfica pura sin perspectiva inclinada**) de **todo el urbanismo completo de Loom** (Etapas 1, 2, 3, 4, 5, Parques Lineales, Club House, Portería y Alma Beach Club).
   - **REGLA CRÍTICA PARA EL PISO 3D (Sin techos ni árboles acostados):** Antes de sacar este render cenital del suelo en Lumion / D5 / V-Ray, **APAGAR la capa de las casas/villas y las palmeras altas**. El suelo solo debe mostrar las **vías, andenes, prado verde de los lotes, espejos de agua/lagos, piscinas, playa de arena y mar**. Así, cuando el cliente rote la cámara en 3D, no se verán árboles ni casas "aplastados" en la foto del suelo, sino que las Villas y Palmeras se verán en 3D real (`.glb`) levantadas sobre el terreno.
2. **Archivo Vectorial Completo (`loom_masterplan_completo_318_lotes.svg` — Peso objetivo: `< 100 KB`) — *O incluidos como planos dentro del `.glb` del terreno*:**
   - Exportado desde Illustrator / AutoCAD sobre exactamente el mismo encuadre ortográfico `90°` del render cenital anterior (o incluidos directamente como planos 3D nombrados `LOTE_A-1`, `LOTE_B-22` dentro de `loom_parques_masterplan.glb`).
   - **REGLA DE ORO PARA QUE NO PESE NADA:** Exportar **ÚNICAMENTE los polígonos (`<polygon>` o `<path>`) de los 318 lotes y las zonas de amenidades**, **APAGANDO/ELIMINANDO la capa de imagen de fondo antes de guardar el `.svg`**, y **sin convertir textos a miles de curvas**.
   - Cada polígono debe llevar el ID de su lote (ej: `id="LOTGROUP_A-1"`, `id="LOTGROUP_B-22"`, etc.).

---

## 4. Vistas Aéreas 360° y Georreferenciación (Solución Fácil desde el Motor 3D — Cero Dron Físico Obligatorio)

> **No es necesario enviar un dron físico al terreno si aún está en movimiento de tierras.**  
> Todo esto puede exportarse **directamente desde la escena 3D que el equipo ya tiene armada en Lumion / D5 Render / 3ds Max**, lo cual toma pocos minutos y muestra el resort **100% construido y arborizado**.

1. **Panoramas 360° desde el Motor de Render 3D (Opcional / Recomendado):**
   - En lugar de volar un dron en obra, colocar la cámara en modo **Panorama 360° Equirectangular (`8192 x 4096 px`)** dentro de Lumion / D5 Render a `30 m – 40 m` de altura en 3 puntos clave:
     - **Vista 1:** Sobre las Etapas centrales mirando hacia el **Parque Lineal y el Mar Caribe**.
     - **Vista 2:** Sobre el **Club House & LOOM Oasis**.
     - **Vista 3:** Sobre **Alma Beach Club y la playa de Playa Alma**.
2. **Ubicación en `earth.patrimofy.com` (Nosotros nos encargamos):**
   - No necesitan levantamiento topográfico GPS especial: con el **Render Cenital (`loom_masterplan_cenital_bg.webp`)** del Punto 3, nosotros mismos lo calzamos y georreferenciamos visualmente sobre el mapa satelital HD de Playa Alma en `earth.patrimofy.com`.

---

## ✅ Checklist Rápido de Entrega
- [ ] **1. Villas 3D (`.glb`):** `loom_villa_luxury.glb` y `loom_villa_garden.glb` (<= 4 MB c/u, solo exterior, materiales nombrados).
- [ ] **2. Amenidades 3D (`.glb`):** `loom_porteria_monumental.glb`, `loom_club_house.glb`, `loom_alma_beach_club.glb`, `loom_parques_masterplan.glb` + 1 `palmera_caribe_lowpoly.glb`.
- [ ] **3. Plano Maestro Completo (318 Lotes Unificados):**
  - `loom_masterplan_cenital_bg.webp` (Render cenital 90° de todo el proyecto completo).
  - `loom_masterplan_completo_318_lotes.svg` (**Solo vectores puros sin imagen incrustada**, pesará `< 100 KB`, con los 318 polígonos nombrados por lote).
- [ ] **4. Panoramas 360° Aéreos (desde Lumion/D5):** 3 imágenes equirectangulares 360° renderizadas a `35 m` de altura desde el modelo 3D.
