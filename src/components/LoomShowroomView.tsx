"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  CheckCircle, 
  Maximize2, 
  Layers, 
  Image as ImageIcon, 
  Compass, 
  Eye, 
  Phone,
  Info,
  Building2,
  Sparkles,
  Ruler,
  ZoomIn,
  MessageCircle
} from "lucide-react";
import LoomReferralModal from "./LoomReferralModal";
import { 
  initReferralTracking, 
  getActiveAdvisor, 
  buildLotWhatsAppUrl, 
  Advisor 
} from "@/lib/referralTracking";
import {
  useLoomLang,
  translateLocationType,
  translateStatusRaw,
  translateAreaText,
  formatCopOrUsd,
  SQM_TO_SQFT,
  getStageDisplayName,
} from "@/lib/loomI18n";

function translateMediaTitle(title: string, isEn: boolean): string {
  if (!isEn) return title;
  return title
    .replace(/GALERÍA/g, "GALLERY")
    .replace(/FACHADA VISTA POSTERIOR/g, "REAR FACADE VIEW")
    .replace(/FACHADA VISTA/g, "FACADE VIEW")
    .replace(/HABITACIÓN VISTA/g, "BEDROOM VIEW")
    .replace(/BAÑO VISTA/g, "BATHROOM VIEW")
    .replace(/COCINA VISTA/g, "KITCHEN VIEW")
    .replace(/PASILLO EXTERIOR VISTA/g, "EXTERIOR CORRIDOR VIEW")
    .replace(/SALA EXTERIOR VISTA/g, "OUTDOOR LOUNGE VIEW")
    .replace(/SALA INTERIOR VISTA/g, "INDOOR LIVING VIEW")
    .replace(/ALTILLO VISTA/g, "ROOFTOP LOFT VIEW")
    .replace(/Axonometría 3D - Isometría Nivel 1 & 2/g, "3D Axonometric - Level 1 & 2 Isometric")
    .replace(/Axonometría 3D - Isometría Rooftop & Altillo/g, "3D Axonometric - Rooftop & Loft Isometric")
    .replace(/Planta Arquitectónica - Nivel/g, "Architectural Floor Plan - Level")
    .replace(/Jardín Biofílico/g, "Biophilic Garden")
    .replace(/Altillo/g, "Loft")
    .replace(/Planta de Cubierta/g, "Roof Plan")
    .replace(/Alzado 01 - Fachada Principal \(Vista Calle\)/g, "Elevation 01 - Main Facade (Street View)")
    .replace(/Alzado 02 - Fachada Posterior \(Vista Piscina\)/g, "Elevation 02 - Rear Facade (Pool View)")
    .replace(/Alzado 03 - Corte Longitudinal L1/g, "Section 03 - Longitudinal Section L1")
    .replace(/Alzado 04 - Corte Transversal L2/g, "Section 04 - Cross Section L2")
    .replace(/(\d+(?:\.\d+)?)\s*m²/gi, (_, numStr) => {
      const sqft = Math.round(parseFloat(numStr) * SQM_TO_SQFT);
      return `${sqft.toLocaleString("en-US")} sq ft`;
    });
}

interface Lot {
  id: string;
  rawId: string;
  area: string;
  location: string;
  status: string;
  statusRaw: string;
  totalPrice: string;
  downPayment: string;
  financing: string;
  finalPayment: string;
}

interface LoomShowroomViewProps {
  selectedLot: Lot;
  stageId: string;
  onBack: () => void;
}

export default function LoomShowroomView({ selectedLot, stageId, onBack }: LoomShowroomViewProps) {
  const { isEn, trm } = useLoomLang();
  // Panel lateral expandido/colapsado
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);

  // Modelo de Villa activo ("luxury" | "garden")
  const [selectedVilla, setSelectedVilla] = useState<"luxury" | "garden">("luxury");
  
  // Pestaña activa ("gallery" | "axonometric" | "plans" | "elevations" | "tour360")
  const [activeTab, setActiveTab] = useState<"gallery" | "axonometric" | "plans" | "elevations" | "tour360">("gallery");

  // Índice de elemento activo en la pestaña actual (para el Visor Principal)
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Lightbox a pantalla completa real
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [lotBlueprintLightboxOpen, setLotBlueprintLightboxOpen] = useState<boolean>(false);

  // Modal de selección de inmobiliaria / asesoría comercial
  const [showReferralModal, setShowReferralModal] = useState<boolean>(false);

  // Asesor asignado para contacto directo y atribución
  const [assignedAdvisor, setAssignedAdvisor] = useState<Advisor | null>(null);

  // Referidor para atribución
  const [referrer, setReferrer] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const adv = initReferralTracking();
      if (adv) {
        setAssignedAdvisor(adv);
        setReferrer(adv.agency.toLowerCase());
      } else {
        const active = getActiveAdvisor();
        if (active) {
          setAssignedAdvisor(active);
          setReferrer(active.agency.toLowerCase());
        } else {
          const stored = sessionStorage.getItem("loom_ref");
          if (stored) {
            setReferrer(stored);
          } else if (window.location.hostname.includes("patrimofy.com")) {
            sessionStorage.setItem("loom_ref", "patrimofy");
            setReferrer("patrimofy");
          }
        }
      }
    }
  }, []);

  // Galería de Fotos Compartida (33 Renders HD Oficiales)
  const sharedGallery = [
    {
      num: "01",
      title: "GALERÍA 01 - FACHADA VISTA 1",
      category: "Exterior Fachada",
      src: "/loom/renders/luxury/galeria_01_fachada_vista_1.webp",
      description: "Vista frontal directa de dos residencias. Destaca el diseño modular con celosías de apariencia de madera en el nivel superior, que crean un sombreamiento natural; muros de acabado pétreo en la planta baja; vegetación abundante; y zonas de parqueo al frente.",
    },
    {
      num: "02",
      title: "GALERÍA 02 - FACHADA VISTA 2",
      category: "Exterior Fachada",
      src: "/loom/renders/luxury/galeria_02_fachada_vista_2.webp",
      description: "Perspectiva frontal simétrica de tres módulos residenciales alineados. Se aprecian las cajas de celosía superior con elementos efecto madera para filtrar la luz natural, una cubierta vegetal que cae por los bordes, vegetación integrada y vehículos estacionados a nivel de calle.",
    },
    {
      num: "03",
      title: "GALERÍA 03 - FACHADA VISTA 3",
      category: "Exterior Fachada",
      src: "/loom/renders/luxury/galeria_03_fachada_vista_3.webp",
      description: "Toma angular a nivel de peatón del conjunto residencial. Enfatiza la volumetría en voladizo, la textura de las celosías símil madera, que genera un sombreamiento natural, y la integración de la vegetación a lo largo del sendero vehicular.",
    },
    {
      num: "04",
      title: "GALERÍA 04 - FACHADA VISTA 4",
      category: "Exterior Fachada",
      src: "/loom/renders/luxury/galeria_04_fachada_vista_4.webp",
      description: "Vista dinámica en perspectiva que muestra la continuidad de la fachada a lo largo de la calle. Resalta el juego de luces y sombras creado por los paneles con acabado tipo madera perforada bajo luz natural y el marco de vegetación circundante.",
    },
    {
      num: "05",
      title: "GALERÍA 05 - FACHADA VISTA 5",
      category: "Exterior Fachada",
      src: "/loom/renders/luxury/galeria_05_fachada_vista_5.webp",
      description: "Enfoque desde un ángulo bajo que resalta la escala de las estructuras. Muestra en detalle la entrada peatonal con portones en estilo madera calada, los acabados pétreos y muros con cubierta vegetal integrados con la vegetación del entorno.",
    },
    {
      num: "06",
      title: "GALERÍA 06 - FACHADA VISTA 6",
      category: "Exterior Fachada",
      src: "/loom/renders/luxury/galeria_06_fachada_vista_6.webp",
      description: "Detalle en primer plano de los paneles de celosía con textura tipo madera. Muestra el diseño calado geométrico que genera un elegante sombreamiento natural al filtrar la luz, complementado con una cubierta de vegetación colgante en la parte superior.",
    },
    {
      num: "07",
      title: "GALERÍA 07 - FACHADA VISTA 7",
      category: "Exterior Fachada",
      src: "/loom/renders/luxury/galeria_07_fachada_vista_7.webp",
      description: "Vista frontal de dos módulos residenciales con cajas superiores de celosía perforada de apariencia madera y vegetación colgante en los bordes. En planta baja, muros de acabado pétreo con enredaderas, portones de acceso en celosía, numeración de vivienda, vehículo estacionado y peatones sobre la vía adoquinada.",
    },
    {
      num: "08",
      title: "GALERÍA 08 - FACHADA VISTA 8",
      category: "Exterior Fachada",
      src: "/loom/renders/luxury/galeria_08_fachada_vista_8.webp",
      description: "Perspectiva frontal a nivel de calle de los dos módulos con celosías tipo madera y cubierta vegetal colgante en la parte superior. Se aprecia el acceso peatonal con portón calado, muros de acabado cálido con vegetación, palmas al fondo, un vehículo estacionado y personas caminando, con figuras desenfocadas en primer plano.",
    },
    {
      num: "09",
      title: "GALERÍA 09 - FACHADA VISTA POSTERIOR",
      category: "Exterior Posterior",
      src: "/loom/renders/luxury/galeria_09_fachada_vista_posterior.webp",
      description: "Vista trasera de tres niveles hacia la piscina privada y con proyección a la vista al mar Caribe. Muestra la amplia terraza cubierta del primer nivel, un balcón superior con barandilla de cristal adornado con cubierta de vegetación colgante y ventanales corredizos que maximizan la entrada de luz natural.",
    },
    {
      num: "10",
      title: "GALERÍA 10 - HABITACIÓN VISTA 1",
      category: "Dormitorio Principal",
      src: "/loom/renders/luxury/galeria_10_habitacion_vista_1.webp",
      description: "Vista frontal simétrica del dormitorio principal. Resalta la cama con diseño aparente madera, mesas de noche a juego, luminarias tejidas suspendidas y el gran ventanal corredizo que aprovecha la luz natural e integra un patio privado con vegetación.",
    },
    {
      num: "11",
      title: "GALERÍA 11 - HABITACIÓN VISTA 2",
      category: "Dormitorio Principal",
      src: "/loom/renders/luxury/galeria_11_habitacion_vista_2.webp",
      description: "Dormitorio principal de estilo biofílico e introspectivo. Cuenta con una cama de plataforma con acabado tipo madera, lámparas colgantes de fibra tejida, paredes de estuco cálido bajo iluminación natural y un gran ventanal de piso a techo con vista a un patio interior enriquecido con vegetación.",
    },
    {
      num: "12",
      title: "GALERÍA 12 - HABITACIÓN VISTA 3",
      category: "Dormitorio Principal",
      src: "/loom/renders/luxury/galeria_12_habitacion_vista_3.webp",
      description: "Dormitorio principal de ambiente cálido y sereno. Cama de plataforma con acabado madera, mesas de noche a juego, luminarias colgantes de fibra tejida, muros de estuco y cortinas de lino translúcidas que filtran la luz natural; el ventanal corredizo abre hacia un patio con vegetación colgante y sillas de fibra tejida.",
    },
    {
      num: "13",
      title: "GALERÍA 13 - HABITACIÓN VISTA 4",
      category: "Dormitorio Principal",
      src: "/loom/renders/luxury/galeria_13_habitacion_vista_4.webp",
      description: "Detalle en primer plano de las cortinas de lino del dormitorio, abiertas para dar paso a la luz natural. Al fondo, el patio privado con muros cubiertos de vegetación, silla de fibra tejida y mesa de centro en madera.",
    },
    {
      num: "14",
      title: "GALERÍA 14 - BAÑO VISTA 1",
      category: "Interior Baño",
      src: "/loom/renders/luxury/galeria_14_bano_vista_1.webp",
      description: "Baño de diseño minimalista con muros y pisos de acabado pétreo. Incluye lavabo sobre encimera flotante símil madera, ducha con mampara de cristal transparente y grifería negra moderna junto a una ventana que aporta luz natural directa y vistas a la vegetación.",
    },
    {
      num: "15",
      title: "GALERÍA 15 - BAÑO VISTA 2",
      category: "Interior Baño",
      src: "/loom/renders/luxury/galeria_15_bano_vista_2.webp",
      description: "Perspectiva alternativa del baño que resalta la amplitud del espacio. Destaca la combinación de acabados pétreos y detalles en tonos y textura tipo madera, la entrada de luz natural a la zona de ducha y detalles de integración de vegetación exterior.",
    },
    {
      num: "16",
      title: "GALERÍA 16 - BAÑO VISTA 3",
      category: "Interior Baño",
      src: "/loom/renders/luxury/galeria_16_bano_vista_3.webp",
      description: "Baño en tonos tierra con muros de acabado pétreo. Lavamanos sobre encimera flotante en acabado madera con repisa inferior y canastas de fibra, espejo de marco negro, ducha con mampara de vidrio y grifería negra, inodoro suspendido y ventana de marco negro con vista a palmas.",
    },
    {
      num: "17",
      title: "GALERÍA 17 - COCINA VISTA 1",
      category: "Interior Cocina",
      src: "/loom/renders/luxury/galeria_17_cocina_vista_1.webp",
      description: "Vista integral de la zona social de planta abierta. Integra una cocina con muebles de acabado tipo madera, iluminación artesanal, sala de estar aprovechando la luz natural, escalera flotante con vegetación en su base y amplias mamparas correderas hacia la terraza.",
    },
    {
      num: "18",
      title: "GALERÍA 18 - COCINA VISTA 2",
      category: "Interior Cocina",
      src: "/loom/renders/luxury/galeria_18_cocina_vista_2.webp",
      description: "Cocina con muebles altos y bajos en acabado madera oscura, encimera y salpicadero de acabado pétreo, lavaplatos con grifería negra y ventanal corrido con vista a la vegetación. Los muebles altos, con las puertas abiertas, dejan ver la vajilla, bajo un remate de celosía de apariencia madera.",
    },
    {
      num: "19",
      title: "GALERÍA 19 - COCINA VISTA 3",
      category: "Interior Cocina",
      src: "/loom/renders/luxury/galeria_19_cocina_vista_3.webp",
      description: "Cocina con muebles altos y bajos en acabado madera, mesón y salpicadero en piedra de tono arena, lavaplatos con grifería negra y ventanal corrido con vista a las palmas del patio interior. En primer plano, un cajón abierto y objetos decorativos en cerámica.",
    },
    {
      num: "20",
      title: "GALERÍA 20 - COCINA VISTA 4",
      category: "Interior Cocina",
      src: "/loom/renders/luxury/galeria_20_cocina_vista_4.webp",
      description: "Detalle del mesón de la cocina en piedra de acabado pétreo tono arena, con borde en escalón que se prolonga como barra con banquetas de fibra tejida. Al fondo, el lavaplatos con grifería negra, el ventanal y la estufa empotrada.",
    },
    {
      num: "21",
      title: "GALERÍA 21 - PASILLO EXTERIOR VISTA 1",
      category: "Pasillo Exterior",
      src: "/loom/renders/luxury/galeria_21_pasillo_exterior_vista_1.webp",
      description: "Pasillo exterior cubierto con cielorraso en acabado madera y luminarias empotradas, celosía de apariencia madera, sillas de fibra tejida sobre deck y sendero de losas pétreas con canal de agua. Al fondo, la piscina privada enmarcada por vegetación y muros con enredaderas.",
    },
    {
      num: "22",
      title: "GALERÍA 22 - PASILLO EXTERIOR VISTA 2",
      category: "Pasillo Exterior",
      src: "/loom/renders/luxury/galeria_22_pasillo_exterior_vista_2.webp",
      description: "Vista alterna del pasillo exterior cubierto: deck de madera con sillas de fibra tejida, sendero de losas pétreas con canal de agua, muro con enredaderas y, al fondo, la piscina privada rodeada de vegetación y palmas.",
    },
    {
      num: "23",
      title: "GALERÍA 23 - SALA EXTERIOR VISTA 1",
      category: "Área Social Exterior",
      src: "/loom/renders/luxury/galeria_23_sala_exterior_vista_1.webp",
      description: "Área social abierta que conecta el interior con la piscina. Incluye un espacio bajo techo que brinda un fresco sombreamiento natural, sala lounge, barra de bar, escalera flotante con peldaños de efecto madera, tumbonas sobre un deck al aire libre y abundante vegetación.",
    },
    {
      num: "24",
      title: "GALERÍA 24 - SALA EXTERIOR VISTA 2",
      category: "Área Social Exterior",
      src: "/loom/renders/luxury/galeria_24_sala_exterior_vista_2.webp",
      description: "Zona social abierta que conecta la sala con el deck y la piscina. Incluye barra con banquetas de fibra, sofá y butaca sobre alfombra tejida, escalera flotante frente a un muro de listones verticales con platos decorativos, ventilador de techo, cubierta en madera y celosía corrediza; sobre el deck, un segundo estar frente a la piscina.",
    },
    {
      num: "25",
      title: "GALERÍA 25 - SALA EXTERIOR VISTA 3",
      category: "Área Social Exterior",
      src: "/loom/renders/luxury/galeria_25_sala_exterior_vista_3.webp",
      description: "Zona de estar exterior sobre deck de madera, con sillas de fibra tejida y mesa de centro redonda en madera. Celosías de apariencia madera filtran la luz natural; al fondo, cerramiento con vegetación y el borde de la piscina.",
    },
    {
      num: "26",
      title: "GALERÍA 26 - SALA INTERIOR VISTA 1",
      category: "Interior Social",
      src: "/loom/renders/luxury/galeria_26_sala_interior_vista_1.webp",
      description: "Espacio de sala interior orientado hacia el área social y la piscina. Cuenta con mobiliario en tonos neutros, alfombra tejida, puertas correderas de celosía con apariencia madera para proporcionar un agradable sombreamiento natural, luz natural y vistas a la vegetación.",
    },
    {
      num: "27",
      title: "GALERÍA 27 - SALA INTERIOR VISTA 2",
      category: "Interior Social",
      src: "/loom/renders/luxury/galeria_27_sala_interior_vista_2.webp",
      description: "Sala interior con sofá y mesa de centro sobre alfombra tejida. Al fondo, muro de listones verticales con platos decorativos de fibra, escalera flotante con vegetación, barra con banquetas y celosía corrediza de apariencia madera hacia la terraza.",
    },
    {
      num: "28",
      title: "GALERÍA 28 - SALA INTERIOR VISTA 3",
      category: "Interior Social",
      src: "/loom/renders/luxury/galeria_28_sala_interior_vista_3.webp",
      description: "Sala interior abierta hacia la piscina, con sofá y butaca en tonos neutros, escalera flotante con vegetación en su base, ventilador de techo, cielorraso en madera y paneles corredizos de celosía que enmarcan la vista al deck y a la vegetación.",
    },
    {
      num: "29",
      title: "GALERÍA 29 - SALA INTERIOR VISTA 4",
      category: "Interior Social",
      src: "/loom/renders/luxury/galeria_29_sala_interior_vista_4.webp",
      description: "Vista amplia de la sala y la barra integradas a la terraza cubierta. Muestra ventilador de techo, cubierta en listones de madera con voladizo, celosías corredizas, deck junto a la piscina y vegetación colgante en el borde.",
    },
    {
      num: "30",
      title: "GALERÍA 30 - ALTILLO VISTA 1",
      category: "Rooftop & Altillo",
      src: "/loom/renders/luxury/galeria_30_altillo_vista_1.webp",
      description: "Exclusiva terraza en el altillo con pérgola de apariencia madera ofreciendo sombreamiento natural. Cuenta con un área lounge, bancas integradas en acabado pétreo, bases efecto madera, jacuzzi elevable, vegetación integrada y una espectacular vista panorámica al mar Caribe.",
    },
    {
      num: "31",
      title: "GALERÍA 31 - ALTILLO VISTA 2",
      category: "Rooftop & Altillo",
      src: "/loom/renders/luxury/galeria_31_altillo_vista_2.webp",
      description: "Terraza del altillo bajo pérgola de madera, con jacuzzi integrado al pretil, sofá en L con cojines y mesa de centro, barra con banquetas de fibra tejida y jardineras con vegetación. Vista abierta al mar Caribe y a la playa al atardecer.",
    },
    {
      num: "32",
      title: "GALERÍA 32 - ALTILLO VISTA 3",
      category: "Rooftop & Altillo",
      src: "/loom/renders/luxury/galeria_32_altillo_vista_3.webp",
      description: "Vista alterna de la terraza del altillo con jacuzzi, zona de estar y barra, con la puesta de sol sobre el mar y los quioscos de playa al fondo.",
    },
    {
      num: "33",
      title: "GALERÍA 33 - FACHADA VISTA 9",
      category: "Exterior Fachada",
      src: "/loom/renders/luxury/galeria_33_fachada_vista_9.webp",
      description: "Detalle en primer plano de paneles de celosía de apariencia madera con perforaciones cuadradas de tamaño variable, que generan sombreamiento natural y juegos de luz, con vegetación colgante en la parte superior.",
    },
  ];

  // Axonometrías 3D Compartidas
  const sharedAxonometrics = [
    {
      num: "01",
      title: "Axonometría 3D - Isometría Nivel 1 & 2",
      category: "Axonometría 3D",
      src: "/loom/renders/axonometrics/axonometria_01.webp",
      description: "Vista isométrica 3D en perspectiva general que destaca la volumetría de la residencia, la integración del espejo de agua, áreas sociales en primer nivel y la celosía biofílica en niveles superiores.",
    },
    {
      num: "02",
      title: "Axonometría 3D - Isometría Rooftop & Altillo",
      category: "Axonometría 3D",
      src: "/loom/renders/axonometrics/axonometria_02.webp",
      description: "Desglose isométrico 3D de la cubierta y la zona del altillo lounge. Muestra la distribución de la pérgola en acabado madera, jacuzzi elevable y terraza panorámica.",
    },
  ];

  // Plantas Arquitectónicas Luxury
  const luxuryPlans = [
    {
      num: "01",
      title: "Planta Arquitectónica - Nivel 1 (198.00 m²)",
      category: "Planta Arquitectónica",
      src: "/loom/renders/plans/luxury_planta_01.webp",
      specs: "Acceso, Parqueadero, Espejo de Agua, Alcoba, Baño, Cocina, Sala, Deck, Piscina",
      description: "Distribución completa del primer nivel. Incluye zona de estacionamiento frontal, vestíbulo de entrada con espejo de agua, amplia zona social integrada (sala y comedor), cocina tipo americana, deck exterior y piscina privada.",
    },
    {
      num: "02",
      title: "Planta Arquitectónica - Nivel 2 (76.04 m²)",
      category: "Planta Arquitectónica",
      src: "/loom/renders/plans/luxury_planta_02.webp",
      specs: "Escalera Interna, Alcobas Secundarias, Baños Privados, Balcones",
      description: "Distribución del segundo nivel. Alberga dormitorios secundarios con baños en suite y vestidores privados, aprovechando los ventanales hacia las fachadas principal y posterior.",
    },
    {
      num: "03",
      title: "Planta Arquitectónica - Nivel 3 - Altillo (79.13 m²)",
      category: "Planta Arquitectónica",
      src: "/loom/renders/plans/luxury_planta_03.webp",
      specs: "Habitación Master, Jacuzzi, Terraza Sunbed, Bar Exclusivo",
      description: "Planta del tercer nivel o altillo master suite. Espacio privado con habitación principal, jacuzzi hidromasaje exterior y terraza privada con vista al mar.",
    },
    {
      num: "04",
      title: "Planta de Cubierta",
      category: "Planta Arquitectónica",
      src: "/loom/renders/plans/luxury_planta_04_cubierta.webp",
      specs: "Pérgola, Cubiertas Vegetales, Colectores y Remates",
      description: "Planta superior de cubierta que muestra la disposición de pérgolas de sombreado biofílico, vegetación integrada en bordes y acabados arquitectónicos.",
    },
  ];

  // Plantas Arquitectónicas Garden
  const gardenPlans = [
    {
      num: "01",
      title: "Planta Arquitectónica - Nivel 1 - Jardín Biofílico (150.00 m²)",
      category: "Planta Arquitectónica",
      src: "/loom/renders/plans/garden_nivel_01.webp",
      specs: "Acceso Peatonal, Parqueadero, Jardín Privado Extendido, Sala, Cocina, Ducha Externa",
      description: "Planta del primer nivel de la versión Garden Edition. Destaca la expansión de jardines interiores y patio privado envolvente con vegetación nativa.",
    },
    {
      num: "02",
      title: "Planta Arquitectónica - Nivel 2 (65.00 m²)",
      category: "Planta Arquitectónica",
      src: "/loom/renders/plans/garden_nivel_02.webp",
      specs: "Dormitorio de Huéspedes, Estudio/Estar, Baño Privado, Balcón Verde",
      description: "Distribución del segundo nivel optimizada para privacidad y frescura biofílica con vistas al jardín central.",
    },
    {
      num: "03",
      title: "Planta Arquitectónica - Nivel 3 (59.04 m²)",
      category: "Planta Arquitectónica",
      src: "/loom/renders/plans/garden_nivel_03.webp",
      specs: "Suite Principal, Vestidor, Baño Master, Terraza Biofílica",
      description: "Planta de la suite principal en el tercer nivel con balcón rodeado de paneles de madera perforada y jardineras integradas.",
    },
    {
      num: "04",
      title: "Planta de Cubierta",
      category: "Planta Arquitectónica",
      src: "/loom/renders/plans/garden_nivel_04_cubierta.webp",
      specs: "Pérgola de Sombra Natural, Cubierta Vegetal",
      description: "Planta de techos y cubiertas verdes para Garden Edition con aislamiento térmico natural.",
    },
  ];

  // Alzados y Elevaciones
  const sharedElevations = [
    {
      num: "01",
      title: "Alzado 01 - Fachada Principal (Vista Calle)",
      category: "Alzado / Elevación",
      src: "/loom/renders/elevations/alzado_01.webp",
      description: "Elevación arquitectónica de la fachada frontal. Detalla la altura total de los tres niveles, los paneles de celosía superior de apariencia madera, acabados de estuco y vegetación colgante.",
    },
    {
      num: "02",
      title: "Alzado 02 - Fachada Posterior (Vista Piscina)",
      category: "Alzado / Elevación",
      src: "/loom/renders/elevations/alzado_02.webp",
      description: "Elevación arquitectónica posterior orientada hacia la zona social y piscina privada. Muestra los ventanales correderos de piso a techo y balcones superiores.",
    },
    {
      num: "03",
      title: "Alzado 03 - Corte Longitudinal L1",
      category: "Corte Arquitectónico",
      src: "/loom/renders/elevations/alzado_03.webp",
      description: "Corte arquitectónico longitudinal que revela la circulación vertical (escalera flotante), alturas libres de entrepiso y la conexión fluida entre sala interior y deck de piscina.",
    },
    {
      num: "04",
      title: "Alzado 04 - Corte Transversal L2",
      category: "Corte Arquitectónico",
      src: "/loom/renders/elevations/alzado_04.webp",
      description: "Corte arquitectónico transversal mostrando el perfil estructural, el altillo master en nivel 3 y la integración con el patio exterior.",
    },
  ];

  // Escenarios 360° VR
  const tour360List = [
    { id: "fachada", label: isEn ? "Main Facade" : "Fachada Principal", category: "Exterior", url: "https://kuula.co/share/collection/7TMZx?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=1" },
    { id: "sala", label: isEn ? "Living & Dining" : "Sala & Comedor", category: isEn ? "Indoor Social" : "Interior Social", url: "https://kuula.co/share/collection/7TKQ2?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=1" },
    { id: "habitacion", label: isEn ? "Master Suite" : "Suite Principal", category: isEn ? "Master Bedroom" : "Dormitorio Master", url: "https://kuula.co/share/collection/7TKzy?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=1" },
    { id: "bano", label: isEn ? "Master Bathroom" : "Baño Suite Master", category: isEn ? "Indoor Bathroom" : "Interior Baño", url: "https://kuula.co/share/collection/7TndH?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=1" },
    { id: "altillo", label: isEn ? "Loft & Rooftop" : "Altillo & Rooftop", category: "Rooftop Lounge", url: "https://kuula.co/share/collection/7T6Y1?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=1" },
  ];

  const formattedStage = stageId
    ? getStageDisplayName(stageId, isEn)
    : isEn ? "Stage 1" : "Etapa 1";

  const locationTypeDisplay = selectedLot.location && !selectedLot.location.toLowerCase().includes("etapa")
    ? translateLocationType(selectedLot.location, isEn)
    : isEn ? "Interior Lot" : "Lote Medianero";

  const lotIdentifier = selectedLot.rawId || selectedLot.id || "";
  const match = lotIdentifier.match(/([A-Za-z])-?(\d+)/);
  const blockLetter = match ? match[1].toUpperCase() : "";
  const lotNumber = match ? match[2].padStart(2, '0') : "";
  const individualLotPlanSrc = blockLetter && lotNumber ? `/loom/lots/${blockLetter}-${lotNumber}.webp?v=2` : `/loom/lots/${lotIdentifier}.webp?v=2`;

  const lotPlanItem = {
    num: "00",
    title: isEn
      ? `Technical Blueprint & Dimensions for Lot ${selectedLot.rawId || selectedLot.id}`
      : `Plano Técnico y Medidas del Lote ${selectedLot.rawId || selectedLot.id}`,
    category: isEn ? "Lot Blueprint" : "Plano del Lote",
    src: individualLotPlanSrc,
    specs: isEn
      ? `Area: ${translateAreaText(selectedLot.area, true)} • Type: ${locationTypeDisplay}`
      : `Área: ${selectedLot.area} m² • Ubicación: ${locationTypeDisplay}`,
    description: isEn
      ? `Official architectural blueprint for Lot ${selectedLot.rawId || selectedLot.id} with exact perimeter dimensions and boundaries (1 m² = 10.76 sq ft).`
      : `Plano arquitectónico oficial del lote ${selectedLot.rawId || selectedLot.id} con cotas y linderos exactos en metros (frente, fondo, laterales).`,
  };

  const currentPlans = selectedVilla === "luxury" 
    ? luxuryPlans 
    : gardenPlans;

  const getActiveMediaList = useCallback(() => {
    if (activeTab === "gallery") return sharedGallery;
    if (activeTab === "axonometric") return sharedAxonometrics;
    if (activeTab === "plans") return currentPlans;
    if (activeTab === "elevations") return sharedElevations;
    return [];
  }, [activeTab, currentPlans]);

  const activeMediaList = getActiveMediaList();

  // Reiniciar índice al cambiar de pestaña
  const handleTabChange = (tab: "gallery" | "axonometric" | "plans" | "elevations" | "tour360") => {
    setActiveTab(tab);
    setActiveIndex(0);
  };

  const handlePrevMedia = useCallback(() => {
    if (activeTab === "tour360") {
      setActiveIndex((prev) => (prev - 1 + tour360List.length) % tour360List.length);
    } else {
      setActiveIndex((prev) => (prev - 1 + activeMediaList.length) % activeMediaList.length);
    }
  }, [activeTab, activeMediaList.length, tour360List.length]);

  const handleNextMedia = useCallback(() => {
    if (activeTab === "tour360") {
      setActiveIndex((prev) => (prev + 1) % tour360List.length);
    } else {
      setActiveIndex((prev) => (prev + 1) % activeMediaList.length);
    }
  }, [activeTab, activeMediaList.length, tour360List.length]);

  // Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrevMedia();
      if (e.key === "ArrowRight") handleNextMedia();
      if (e.key === "Escape") {
        setLightboxOpen(false);
        setLotBlueprintLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevMedia, handleNextMedia]);

  // Manejo de la acción "Separar Lote" (atribución y WhatsApp de asesor)
  const handleSeparateClick = () => {
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({
        type: 'LOT_SEPARATE_CLICKED',
        payload: {
          lotId: selectedLot.rawId || selectedLot.id,
          price: selectedLot.totalPrice,
          advisor: assignedAdvisor?.slug || null,
        }
      }, '*');
      return;
    }

    const currentAdvisor = assignedAdvisor || getActiveAdvisor();

    // 1. Si hay un asesor asignado por link / cookie, abrir directo su WhatsApp
    if (currentAdvisor) {
      const waUrl = buildLotWhatsAppUrl(
        {
          id: selectedLot.id,
          rawId: selectedLot.rawId,
          price: selectedLot.totalPrice,
          area: selectedLot.area,
        },
        "LOOM Luxury Residence",
        currentAdvisor
      );
      window.open(waUrl, "_blank");
      return;
    }

    // 2. Si viene de una inmobiliaria general o dominio Patrimofy
    const currentRef = typeof window !== "undefined" 
      ? sessionStorage.getItem("loom_ref") || (window.location.hostname.includes("patrimofy.com") ? "patrimofy" : referrer) 
      : referrer;

    if (currentRef === "patrimofy" || (typeof window !== "undefined" && window.location.hostname.includes("patrimofy.com") && currentRef !== "chichaus")) {
      const waUrl = buildLotWhatsAppUrl(
        {
          id: selectedLot.id,
          rawId: selectedLot.rawId,
          price: selectedLot.totalPrice,
          area: selectedLot.area,
        },
        "LOOM Luxury Residence"
      );
      window.open(waUrl, "_blank");
    } else if (currentRef === "chichaus") {
      window.open("https://www.loomalmabeach.com/#contacto", "_blank");
    } else {
      setShowReferralModal(true);
    }
  };

  const currentMediaItem = activeTab !== "tour360" ? activeMediaList[activeIndex] : null;
  const currentTourItem = activeTab === "tour360" ? tour360List[activeIndex] : null;

  return (
    <div className="relative w-full h-dvh bg-[#0A0D0B] text-[#EDE7E0] flex flex-col overflow-hidden font-sans select-none">

      {/* ========================================== */}
      {/* 1. VISOR PRINCIPAL INMERSIVO (SE ADAPTA AL PANEL & 4K) */}
      {/* ========================================== */}
      <div 
        className={`relative flex-1 h-full bg-[#0A0D0B] overflow-hidden flex items-center justify-center transition-all duration-300 ${
          isPanelOpen 
            ? "lg:ml-[22rem] xl:ml-[24rem] w-full lg:w-[calc(100%-22rem)] xl:w-[calc(100%-24rem)]" 
            : "w-full ml-0"
        }`}
      >
        
        {/* Fondo borroso sutil de ambientación */}
        {currentMediaItem && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-3xl scale-110 pointer-events-none transition-all duration-700"
            style={{ backgroundImage: `url(${currentMediaItem.src})` }}
          />
        )}

        {/* Gradiente sutil inferior para controles de fondo */}
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#0A0D0B]/90 via-[#0A0D0B]/40 to-transparent pointer-events-none z-10" />

        {/* Contenido Principal (Imágenes HD a Pantalla Sangrada o Tour 360) */}
        <AnimatePresence mode="wait">
          {activeTab === "tour360" ? (
            <motion.div
              key={`tour-${activeIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full z-10"
            >
              <iframe
                src={currentTourItem?.url}
                title={`Tour 360° ${currentTourItem?.label}`}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking"
                allowFullScreen
              />
            </motion.div>
          ) : (
            currentMediaItem && (
              <motion.div
                key={`img-${activeTab}-${activeIndex}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="relative z-10 w-full h-full flex items-center justify-center p-0"
              >
                <img
                  src={currentMediaItem.src}
                  alt={translateMediaTitle(currentMediaItem.title, isEn)}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={() => setLightboxOpen(true)}
                />
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* Flechas de Navegación Claras & Visibles */}
        <button
          onClick={handlePrevMedia}
          className={`absolute ${
            !isPanelOpen ? "left-3 sm:left-14" : "left-3 sm:left-5"
          } top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-[#EDE7E0] hover:bg-[#B35F27] border border-[#0A0D0B]/20 hover:border-[#B35F27] text-[#0A0D0B] hover:text-white transition-all duration-300 backdrop-blur-md shadow-xl active:scale-95 cursor-pointer group`}
          title={isEn ? "Previous (Left Arrow)" : "Anterior (Flecha Izquierda)"}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:-translate-x-0.5 transition-transform" />
        </button>

        <button
          onClick={handleNextMedia}
          className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 p-2 sm:p-3 rounded-full bg-[#EDE7E0] hover:bg-[#B35F27] border border-[#0A0D0B]/20 hover:border-[#B35F27] text-[#0A0D0B] hover:text-white transition-all duration-300 backdrop-blur-md shadow-xl active:scale-95 cursor-pointer group"
          title={isEn ? "Next (Right Arrow)" : "Siguiente (Flecha Derecha)"}
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Badge Flotante Inferior de Información del Render */}
        <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 sm:px-5 sm:py-2.5 bg-[#0A0D0B]/88 backdrop-blur-xl border border-white/15 rounded-full shadow-2xl max-w-[90vw] sm:max-w-[65vw]">
          <span className="text-[0.625rem] sm:text-xs font-mono font-bold text-[#EBD9AB] uppercase tracking-wider shrink-0">
            {activeTab === "tour360"
              ? `${activeIndex + 1} / ${tour360List.length}`
              : `${activeIndex + 1} / ${activeMediaList.length}`}
          </span>
          <span className="h-3.5 w-[1px] bg-white/20 shrink-0" />
          <p className="text-[0.625rem] sm:text-xs font-serif font-bold text-white truncate max-w-[12.5rem] sm:max-w-[18rem] md:max-w-[24rem]">
            {activeTab === "tour360"
              ? currentTourItem?.label
              : translateMediaTitle(currentMediaItem?.title || "", isEn)}
          </p>
          {activeTab !== "tour360" && (
            <button
              onClick={() => setLightboxOpen(true)}
              className="p-1 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer ml-0.5 shrink-0"
              title={isEn ? "View fullscreen" : "Ver en pantalla completa"}
            >
              <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* ========================================== */}
      {/* 2. BARRA SUPERIOR DE NAVEGACIÓN FLOTANTE */}
      {/* ========================================== */}
      <header className="absolute top-0 left-0 right-0 z-30 px-3 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-b from-[#0A0D0B]/90 via-[#0A0D0B]/60 to-transparent backdrop-blur-sm flex justify-between items-center pointer-events-none">
        
        {/* Lado Izquierdo: Título o Volver si panel cerrado */}
        <div className={`flex items-center gap-1.5 sm:gap-3 pointer-events-auto transition-all duration-300 ${!isPanelOpen ? "ml-11 sm:ml-14" : ""}`}>
          {!isPanelOpen && (
            <>
              <button
                onClick={onBack}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 bg-[#B35F27] hover:bg-[#964d1d] active:scale-95 border border-[#B35F27] rounded-full text-[0.625rem] sm:text-xs font-bold text-[#EDE7E0] uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer whitespace-nowrap"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{isEn ? "Back to Stage" : "Volver a la Etapa"}</span>
                <span className="sm:hidden">{isEn ? "Back" : "Volver"}</span>
              </button>
              <button
                onClick={() => setIsPanelOpen(true)}
                className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 bg-[#EDE7E0]/95 hover:bg-white text-[#0A0D0B] border border-[#0A0D0B]/15 rounded-full text-[0.625rem] font-bold uppercase tracking-wider shadow-md cursor-pointer whitespace-nowrap"
              >
                <Layers className="w-3.5 h-3.5 text-[#B35F27]" />
                <span>{isEn ? "Lot & Models" : "Lote y Modelos"}</span>
              </button>
            </>
          )}

          <div className="hidden md:block">
            <span className="text-[0.5rem] sm:text-[0.5625rem] uppercase tracking-[0.3em] text-[#EBD9AB] font-mono font-bold block">
              {isEn ? "Master Plan Alma Beach • Loom" : "Master Plan Alma Beach • Loom"}
            </span>
            <h1 className="text-xs sm:text-sm font-serif font-bold text-white tracking-wide">
              {isEn ? "Lot" : "Lote"} <span className="text-[#B35F27]">{selectedLot.rawId}</span> &bull; {formattedStage}
            </h1>
          </div>
        </div>

        {/* Lado Derecho: Estado del Lote & Acciones */}
        <div className="flex items-center gap-3 pointer-events-auto mr-0">
          <div className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-[#699385]/20 border border-[#699385]/40 text-[#699385] text-[0.625rem] sm:text-xs font-bold uppercase tracking-widest rounded-full">
            {translateStatusRaw(selectedLot.statusRaw, isEn, selectedLot.status)}
          </div>
        </div>
      </header>

      {/* Fondo Táctil en Móvil/Tablet para Cerrar el Panel y Ver Renders */}
      {isPanelOpen && (
        <div
          onClick={() => setIsPanelOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px]"
        />
      )}

      {/* ========================================== */}
      {/* 3. PANEL LATERAL COLAPSABLE */}
      {/* ========================================== */}
      <motion.aside
        initial={false}
        animate={{
          x: isPanelOpen ? 0 : "-100%",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 bottom-0 z-40 w-[86vw] max-w-[20.625rem] sm:max-w-none sm:w-[19rem] lg:w-[22rem] xl:w-[24rem] bg-[#EDE7E0] text-[#0A0D0B] shadow-2xl border-r border-[#0A0D0B]/15 flex flex-col justify-between"
      >
        {/* Pestaña Flotante Visible para Ocultar/Mostrar el Panel */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="absolute top-1/2 -right-9 sm:-right-10 transform -translate-y-1/2 z-50 flex items-center justify-center w-9 h-14 sm:w-10 sm:h-16 rounded-r-xl sm:rounded-r-2xl bg-[#EDE7E0] hover:bg-[#B35F27] border-y border-r border-[#0A0D0B]/20 hover:border-[#B35F27] text-[#0A0D0B] hover:text-white shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer"
          title={isPanelOpen ? (isEn ? "Hide side panel" : "Ocultar panel lateral") : (isEn ? "Show side panel" : "Mostrar panel lateral")}
        >
          {isPanelOpen ? (
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* Scrollable Panel Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 lg:p-5 space-y-3.5 lg:space-y-4 scrollbar-hide pt-4 lg:pt-5">
          
          {/* Botones Superiores de Navegación en el Panel (Alineados 50/50 con las tarjetas inferiores en móvil) */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2.5 lg:px-4 lg:py-3.5 bg-[#B35F27] hover:bg-[#964d1d] active:scale-95 border border-[#B35F27] rounded-xl text-[0.625rem] lg:text-xs font-bold text-[#EDE7E0] uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer truncate"
            >
              <ChevronLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4 shrink-0" />
              <span className="lg:hidden truncate">{isEn ? "Back to Stage" : "Volver a Etapa"}</span>
              <span className="hidden lg:inline truncate">{isEn ? "Back to Stage" : "Volver a la Etapa"}</span>
            </button>

            <button
              onClick={() => setIsPanelOpen(false)}
              className="lg:hidden w-full flex items-center justify-center gap-1.5 px-2.5 py-2.5 bg-[#0A0D0B] text-[#EDE7E0] rounded-xl text-[0.625rem] font-bold uppercase tracking-wider shadow-md active:scale-95 cursor-pointer truncate"
              title={isEn ? "View Renders" : "Ver Renders"}
            >
              <Eye className="w-3.5 h-3.5 text-[#EBD9AB] shrink-0" />
              <span className="truncate">{isEn ? "View Renders" : "Ver Renders"}</span>
            </button>
          </div>
          
          {/* Header Specs Card */}
          <div className="bg-white/80 border border-[#0A0D0B]/10 rounded-2xl p-3.5 lg:p-4 shadow-sm space-y-2.5 lg:space-y-3">
            <div className="flex justify-between items-start border-b border-[#0A0D0B]/10 pb-2.5 lg:pb-3">
              <div>
                <span className="text-[0.5625rem] lg:text-[0.625rem] uppercase tracking-[0.2em] text-[#B35F27] font-mono font-bold block">
                  {isEn ? "Technical Sheet" : "Ficha Técnica"}
                </span>
                <h2 className="text-lg lg:text-xl font-serif font-bold text-[#0A0D0B] whitespace-nowrap">
                  {isEn ? "Lot" : "Lote"} {selectedLot.rawId}
                </h2>
              </div>
              <span className="px-2.5 py-1 text-[0.5625rem] font-bold uppercase tracking-widest rounded-full bg-[#699385]/15 text-[#699385] border border-[#699385]/30 whitespace-nowrap">
                {formattedStage}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#EDE7E0]/60 p-2.5 rounded-xl border border-[#0A0D0B]/5 min-w-0">
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#0A0D0B]/60 block font-medium">
                  {isEn ? "Lot Area" : "Área Lote"}
                </span>
                <strong className="text-sm font-serif font-bold text-[#0A0D0B] block truncate">
                  {translateAreaText(selectedLot.area, isEn)}
                </strong>
              </div>
              <div className="bg-[#EDE7E0]/60 p-2.5 rounded-xl border border-[#0A0D0B]/5 min-w-0">
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#0A0D0B]/60 block font-medium">
                  {isEn ? "Location" : "Ubicación"}
                </span>
                <strong className="text-xs font-semibold text-[#0A0D0B] truncate block mt-0.5">
                  {locationTypeDisplay.replace(/^Lote\s+/i, "")}
                </strong>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 📐 SECCIÓN: PLANO ARQUITECTÓNICO & MEDIDAS EN EL SHOWROOM   */}
          {/* ============================================================ */}
          <div className="bg-white/80 border border-[#B35F27]/25 rounded-2xl p-3.5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[#B35F27]">
                <Ruler className="h-4 w-4" />
                <span className="text-[0.625rem] font-bold uppercase tracking-wider text-[#0A0D0B]">
                  {isEn ? "Lot Blueprint & Dimensions" : "Plano & Medidas del Lote"}
                </span>
              </div>
              {blockLetter && (
                <span className="text-[0.5625rem] font-mono font-bold uppercase tracking-wider bg-[#B35F27]/10 text-[#B35F27] border border-[#B35F27]/20 px-2 py-0.5 rounded-md">
                  {isEn ? `Blk ${blockLetter} • Lot ${lotNumber}` : `Mz ${blockLetter} • Lote ${lotNumber}`}
                </span>
              )}
            </div>

            {/* Contenedor de la Imagen con Click para ampliar en pantalla completa */}
            <div 
              onClick={() => setLotBlueprintLightboxOpen(true)}
              className="relative w-full aspect-square bg-[#0A0D0B]/[0.03] rounded-xl overflow-hidden border border-[#0A0D0B]/10 cursor-pointer group shadow-inner flex items-center justify-center transition-all duration-300 hover:border-[#B35F27]/50"
              title={isEn ? "Expand blueprint and dimensions fullscreen" : "Ampliar plano y medidas a pantalla completa"}
            >
              <img
                src={individualLotPlanSrc}
                alt={isEn ? `Blueprint and dimensions for Lot ${selectedLot.rawId || selectedLot.id}` : `Plano y medidas del Lote ${selectedLot.rawId || selectedLot.id}`}
                className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
              />

              {/* Overlay al pasar el cursor */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-2.5">
                <span className="text-white text-[0.625rem] font-semibold flex items-center gap-1.5 backdrop-blur-md bg-black/50 px-2.5 py-1 rounded-full border border-white/20">
                  <Maximize2 className="h-3 w-3 text-[#EBD9AB]" />
                  {isEn ? "Expand Fullscreen" : "Ampliar Medidas"}
                </span>
                <span className="text-[0.5625rem] text-[#EBD9AB] font-mono font-bold bg-[#B35F27]/80 px-2 py-0.5 rounded">
                  1080p
                </span>
              </div>

              {/* Botón de lupa directo a pantalla completa */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setLotBlueprintLightboxOpen(true);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-[#0A0D0B] shadow-md border border-[#0A0D0B]/10 hover:bg-[#B35F27] hover:text-white transition-colors duration-200"
                title={isEn ? "View dimensions fullscreen" : "Ver medidas a pantalla completa"}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="text-[0.5625rem] text-[#0A0D0B]/60 leading-tight italic flex items-center gap-1.5 pt-0.5">
              <Info className="h-3 w-3 text-[#B35F27] shrink-0" />
              <span>
                {isEn
                  ? "Perimeter dimensions and boundaries per official architectural blueprint (1 m² = 10.76 sq ft)."
                  : "Cotas perimetrales y linderos según plano arquitectónico oficial."}
              </span>
            </p>
          </div>

          {/* Villa Model Selector Bar */}
          <div className="bg-white/80 border border-[#0A0D0B]/10 rounded-2xl p-2.5 shadow-sm">
            <span className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B35F27] font-bold block mb-2 px-1.5 pt-0.5">
              {isEn ? "Villa Model" : "Modelo de Villa"}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedVilla("luxury")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-300 cursor-pointer active:scale-95 ${
                  selectedVilla === "luxury"
                    ? "bg-[#B35F27] border-[#B35F27] text-[#EDE7E0] shadow-md shadow-[#B35F27]/20"
                    : "bg-[#EDE7E0]/60 border-[#0A0D0B]/10 text-[#0A0D0B]/70 hover:bg-white hover:text-[#0A0D0B]"
                }`}
              >
                <span className="text-xs font-serif font-bold uppercase tracking-wider">Luxury</span>
                <span className="text-[0.5625rem] mt-0.5 font-mono opacity-90">
                  {isEn ? "3,800 sq ft • 3 Levels" : "353 m² • 3 Niveles"}
                </span>
              </button>

              <button
                onClick={() => setSelectedVilla("garden")}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all duration-300 cursor-pointer active:scale-95 ${
                  selectedVilla === "garden"
                    ? "bg-[#B35F27] border-[#B35F27] text-[#EDE7E0] shadow-md shadow-[#B35F27]/20"
                    : "bg-[#EDE7E0]/60 border-[#0A0D0B]/10 text-[#0A0D0B]/70 hover:bg-white hover:text-[#0A0D0B]"
                }`}
              >
                <span className="text-xs font-serif font-bold uppercase tracking-wider">Garden</span>
                <span className="text-[0.5625rem] mt-0.5 font-mono opacity-90">
                  {isEn ? "2,949 sq ft • Biophilic" : "274 m² • Biofílico"}
                </span>
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs List */}
          <div className="space-y-2">
            <span className="text-[0.625rem] uppercase tracking-[0.2em] text-[#B35F27] font-bold block px-1">
              {isEn ? "Explore Showroom Media" : "Explorar Medios del Showroom"}
            </span>

            <div className="grid grid-cols-1 gap-1.5">
              {(
                [
                  {
                    id: "gallery" as const,
                    label: isEn ? "1. Rendered Gallery (33 Renders)" : "1. Galería Renderizada (33 Renders)",
                    icon: ImageIcon,
                    count: 33,
                  },
                  {
                    id: "axonometric" as const,
                    label: isEn ? "2. Axonometric View (2 Isometrics)" : "2. Vista Axonométrica (2 Isométricas)",
                    icon: Layers,
                    count: 2,
                  },
                  {
                    id: "plans" as const,
                    label: isEn ? "3. Architectural Plans (4 Levels)" : "3. Plantas Arquitectónicas (4 Niveles)",
                    icon: Building2,
                    count: 4,
                  },
                  {
                    id: "elevations" as const,
                    label: isEn ? "4. Elevations & Sections (4 Plans)" : "4. Alzados & Cortes (4 Planos)",
                    icon: Compass,
                    count: 4,
                  },
                  {
                    id: "tour360" as const,
                    label: isEn ? "5. 360° Virtual Tour (5 Scenes)" : "5. Recorrido 360° (5 Escenarios)",
                    icon: Eye,
                    count: 5,
                  },
                ]
              ).map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer text-left ${
                      isActive
                        ? "bg-[#B35F27] text-[#EDE7E0] shadow-md shadow-[#B35F27]/20"
                        : "bg-white/80 border border-[#0A0D0B]/10 text-[#0A0D0B]/80 hover:bg-white hover:text-[#0A0D0B]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thumbnails Grid for Active Tab Items */}
          <div className="space-y-2 pt-1">
            <span className="text-[0.625rem] uppercase tracking-wider text-[#0A0D0B]/60 font-mono font-bold block px-1">
              {isEn ? "Direct View Selection (Tap to View)" : "Selección Directa de Vista (Toca para Ver)"}
            </span>

            {activeTab === "tour360" ? (
              <div className="grid grid-cols-1 gap-2">
                {tour360List.map((scene, idx) => (
                  <button
                    key={scene.id}
                    onClick={() => {
                      setActiveIndex(idx);
                      if (typeof window !== "undefined" && window.innerWidth < 1024) {
                        setIsPanelOpen(false);
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs text-left transition-all duration-300 cursor-pointer ${
                      activeIndex === idx
                        ? "bg-[#0A0D0B] text-white border-[#0A0D0B] shadow-md"
                        : "bg-white/80 border-[#0A0D0B]/10 text-[#0A0D0B]/80 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-[#B35F27]" />
                      <span className="font-semibold truncate">{scene.label}</span>
                    </div>
                    <span className="text-[0.5625rem] font-mono opacity-70 uppercase">{scene.category}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {activeMediaList.map((media, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveIndex(idx);
                      if (typeof window !== "undefined" && window.innerWidth < 1024) {
                        setIsPanelOpen(false);
                      }
                    }}
                    className={`relative rounded-lg overflow-hidden border aspect-[4/3] cursor-pointer transition-all duration-300 group ${
                      activeIndex === idx
                        ? "border-[#B35F27] ring-2 ring-[#B35F27]/50 shadow-md"
                        : "border-[#0A0D0B]/10 hover:border-[#B35F27]/50 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img src={media.src} alt={translateMediaTitle(media.title, isEn)} loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-1">
                      <span className="text-[0.5rem] font-mono text-white font-bold">{media.num}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Financial Breakdown Card */}
          <div className="bg-[#0A0D0B] text-[#EDE7E0] rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
            <div className="flex justify-between items-baseline border-b border-white/10 pb-2.5">
              <span className="text-[0.625rem] uppercase tracking-wider text-[#EBD9AB] font-mono">
                {isEn ? "Total Investment Value (USD)" : "Valor Total Inversión"}
              </span>
              <span className="text-lg font-serif font-bold text-[#EDE7E0]">
                {formatCopOrUsd(selectedLot.totalPrice, isEn, trm, isEn)}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs pt-1">
              <div>
                <span className="text-[0.5rem] uppercase tracking-wider text-white/50 block">
                  {isEn ? "Down Payment" : "Cuota Inicial"}
                </span>
                <span className="font-semibold text-white/90 text-[0.6875rem]">
                  {formatCopOrUsd(selectedLot.downPayment, isEn, trm)}
                </span>
              </div>
              <div>
                <span className="text-[0.5rem] uppercase tracking-wider text-white/50 block">
                  {isEn ? "Financing" : "Financiación"}
                </span>
                <span className="font-semibold text-white/90 text-[0.6875rem]">
                  {formatCopOrUsd(selectedLot.financing, isEn, trm)}
                </span>
              </div>
              <div>
                <span className="text-[0.5rem] uppercase tracking-wider text-white/50 block">
                  {isEn ? "Upon Delivery" : "Contraentrega"}
                </span>
                <span className="font-semibold text-white/90 text-[0.6875rem]">
                  {formatCopOrUsd(selectedLot.finalPayment, isEn, trm)}
                </span>
              </div>
            </div>

            {isEn && (
              <div className="pt-1.5 border-t border-white/10 text-[0.5625rem] font-mono text-[#EBD9AB]/75 flex items-center justify-between">
                <span>Live Daily TRM (Colombia)</span>
                <span>1 USD = ${Math.round(trm).toLocaleString("en-US")} COP</span>
              </div>
            )}
          </div>

        </div>

        {/* Sticky Action Footer */}
        <div className="p-3.5 lg:p-4 max-lg:landscape:p-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/90 border-t border-[#0A0D0B]/10 backdrop-blur-md space-y-2 max-lg:landscape:space-y-0 shrink-0">
          {assignedAdvisor && (
            <div className="max-lg:landscape:hidden bg-[#B35F27]/15 border border-[#B35F27]/35 rounded-xl p-2 text-[0.59375rem] lg:text-[0.625rem] text-[#0A0D0B] uppercase tracking-wider text-center font-semibold flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
              <span className="truncate">
                {isEn ? "Your Advisor:" : "Tu Asesor:"} <strong>{assignedAdvisor.name}</strong> &bull; {assignedAdvisor.agency}
              </span>
            </div>
          )}
          <button
            onClick={handleSeparateClick}
            className="w-full py-2.5 lg:py-3 max-lg:landscape:py-2.5 bg-[#B35F27] hover:bg-[#964d1d] active:scale-95 text-[#EDE7E0] font-semibold rounded-xl uppercase tracking-wider text-[0.6875rem] lg:text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#B35F27]/25 cursor-pointer truncate px-3"
          >
            {assignedAdvisor ? (
              <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
            ) : (
              <Phone className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">
              {assignedAdvisor
                ? isEn
                  ? `Reserve via WhatsApp (${assignedAdvisor.name.split(" ")[0]})`
                  : `Separar por WhatsApp (${assignedAdvisor.name.split(" ")[0]})`
                : isEn
                ? `Reserve Lot ${selectedLot.rawId}`
                : `Separar Lote ${selectedLot.rawId}`}
            </span>
          </button>
        </div>
      </motion.aside>

      {/* ========================================== */}
      {/* 4. MODAL LIGHTBOX COMPLETO (FULLSCREEN IMAGES) */}
      {/* ========================================== */}
      <AnimatePresence>
        {(lotBlueprintLightboxOpen || (lightboxOpen && currentMediaItem)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6"
          >
            <div className="flex justify-between items-center max-w-7xl mx-auto w-full border-b border-white/10 pb-3">
              <span className="text-xs font-mono text-[#EBD9AB] uppercase tracking-widest font-bold">
                {lotBlueprintLightboxOpen
                  ? lotPlanItem.title
                  : translateMediaTitle(currentMediaItem?.title || "", isEn)}
              </span>
              <button
                onClick={() => {
                  setLightboxOpen(false);
                  setLotBlueprintLightboxOpen(false);
                }}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
              <img
                src={lotBlueprintLightboxOpen ? lotPlanItem.src : currentMediaItem?.src}
                alt={
                  lotBlueprintLightboxOpen
                    ? lotPlanItem.title
                    : translateMediaTitle(currentMediaItem?.title || "", isEn)
                }
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            <div className="max-w-4xl mx-auto w-full bg-white/10 backdrop-blur-md p-4 rounded-xl text-center">
              <p className="text-xs text-white/90 leading-relaxed font-sans">
                {lotBlueprintLightboxOpen ? lotPlanItem.description : currentMediaItem?.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Selección de Inmobiliaria / Asesoría Comercial */}
      <LoomReferralModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        lotRawId={selectedLot.rawId}
      />

    </div>
  );
}
