import { SQM_TO_SQFT } from "@/lib/loomI18n";

export interface AmenityMediaItem {
  num: string;
  src: string;
  titleEs: string;
  titleEn: string;
  categoryEs: string;
  categoryEn: string;
  descEs: string;
  descEn: string;
}

export interface AmenityGalleryConfig {
  key: "BEACH_CLUB" | "CLUB_HOUSE" | "PORTERIA" | "PARQUES";
  badgeEs: string;
  badgeEn: string;
  summaryEs: string;
  summaryEn: string;
  highlightsEs: string[];
  highlightsEn: string[];
  items: AmenityMediaItem[];
}

export interface ShowroomMediaItem {
  num: string;
  title: string;
  category: string;
  src: string;
  specs?: string;
  description: string;
}

export interface ShowroomTour360Scene {
  id: string;
  label: string;
  category: string;
  url: string;
}

export function translateMediaTitle(title: string, isEn: boolean): string {
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

export const AMENITY_GALLERIES: Record<AmenityGalleryConfig["key"], AmenityGalleryConfig> = {
  BEACH_CLUB: {
    key: "BEACH_CLUB",
    badgeEs: "Alma Beach Club • Salida Directa al Mar",
    badgeEn: "Alma Beach Club • Direct Sea Access",
    summaryEs:
      "Club de playa privado y circuito de zonas comunes de Loom Luxury Residence con salida directa al Mar Caribe en Playa Alma (Zona Norte, Cartagena de Indias). Integra piscinas, Sun Beds, Ocean Lounge, Ocean Dining, Sunset Spa, Sunset Dining, Loom Oasis, Lago Loom, cancha de voleibol y senderos Nature Walk.",
    summaryEn:
      "Private beach club and common area circuit of Loom Luxury Residence with direct access to the Caribbean Sea at Alma Beach (North Zone, Cartagena de Indias). Integrates pools, Sun Beds, Ocean Lounge, Ocean Dining, Sunset Spa, Sunset Dining, Loom Oasis, Loom Lake, beach volleyball court, and Nature Walk trails.",
    highlightsEs: [
      "Salida Directa al Mar",
      "Ocean Lounge & Dining",
      "Sunset Spa & Sun Beds",
      "Loom Oasis & Lago Loom",
    ],
    highlightsEn: [
      "Direct Sea Access",
      "Ocean Lounge & Dining",
      "Sunset Spa & Sun Beds",
      "Loom Oasis & Loom Lake",
    ],
    items: [
      {
        num: "01",
        src: "/loom/renders/amenities/club-de-playa/galeria_03_club_de_playa_vista_2.webp",
        titleEs: "Club de Playa • Vista General 1",
        titleEn: "Beach Club • General View 1",
        categoryEs: "Alma Beach Club",
        categoryEn: "Alma Beach Club",
        descEs: "Vista panorámica del Club de Playa de Loom Luxury Residence con piscinas, terrazas y salida directa al Mar Caribe.",
        descEn: "Panoramic view of the Loom Luxury Residence Beach Club featuring pools, terraces, and direct access to the Caribbean Sea.",
      },
      {
        num: "02",
        src: "/loom/renders/amenities/club-de-playa/galeria_04_club_de_playa_vista_3.webp",
        titleEs: "Club de Playa • Vista General 2",
        titleEn: "Beach Club • General View 2",
        categoryEs: "Alma Beach Club",
        categoryEn: "Alma Beach Club",
        descEs: "Vista general del Club de Playa integrando espejos de agua, arquitectura bioclimática en madera natural y frente costero.",
        descEn: "General view of the Beach Club integrating water mirrors, natural wood bioclimatic architecture, and beachfront.",
      },
      {
        num: "03",
        src: "/loom/renders/amenities/club-de-playa/galeria_05_club_de_playa_vista_4.webp",
        titleEs: "Club de Playa • Perspectiva Costera",
        titleEn: "Beach Club • Coastal Perspective",
        categoryEs: "Alma Beach Club",
        categoryEn: "Alma Beach Club",
        descEs: "Cuarta toma del complejo costero con decks de descanso, pérgolas orgánicas y vegetación tropical frente a la playa.",
        descEn: "Fourth perspective of the coastal complex with lounge decks, organic pergolas, and tropical beachfront landscaping.",
      },
      {
        num: "04",
        src: "/loom/renders/amenities/club-de-playa/galeria_06_club_de_playa_vista_5.webp",
        titleEs: "Club de Playa • Terrazas & Piscina",
        titleEn: "Beach Club • Terraces & Pool",
        categoryEs: "Alma Beach Club",
        categoryEn: "Alma Beach Club",
        descEs: "Quinta toma del Club de Playa destacando la amplitud de las terrazas sociales y la conexión directa con la arena.",
        descEn: "Fifth view of the Beach Club highlighting the spacious social terraces and direct connection to the sand.",
      },
      {
        num: "05",
        src: "/loom/renders/amenities/club-de-playa/galeria_07_sun_bed_vista_1.webp",
        titleEs: "Zona de Sun Beds • Vista 1",
        titleEn: "Sun Beds Zone • View 1",
        categoryEs: "Sun Beds",
        categoryEn: "Sun Beds",
        descEs: "Vista de la zona de camas de sol (Sun Beds) dispuestas frente al agua para el descanso y contemplación del Caribe.",
        descEn: "View of the Sun Beds lounge zone arranged by the water for relaxation and Caribbean contemplation.",
      },
      {
        num: "06",
        src: "/loom/renders/amenities/club-de-playa/galeria_08_sun_bed_vista_2.webp",
        titleEs: "Zona de Sun Beds • Vista 2",
        titleEn: "Sun Beds Zone • View 2",
        categoryEs: "Sun Beds",
        categoryEn: "Sun Beds",
        descEs: "Segunda toma de la zona de camas de sol (Sun Beds) con sombrillas, mobiliario de exterior de lujo y palmeras.",
        descEn: "Second view of the Sun Beds lounge zone with umbrellas, luxury outdoor furniture, and palm trees.",
      },
      {
        num: "07",
        src: "/loom/renders/amenities/club-de-playa/galeria_09_ocean_lounge_vista_1.webp",
        titleEs: "Ocean Lounge • Vista 1",
        titleEn: "Ocean Lounge • View 1",
        categoryEs: "Ocean Lounge",
        categoryEn: "Ocean Lounge",
        descEs: "Vista del Ocean Lounge: espacio social abierto con diseño biofílico y brisa marina frente a la costa.",
        descEn: "View of the Ocean Lounge: open-air social space with biophilic design and sea breeze right by the coast.",
      },
      {
        num: "08",
        src: "/loom/renders/amenities/club-de-playa/galeria_10_ocean_lounge_vista_2.webp",
        titleEs: "Ocean Lounge • Vista 2",
        titleEn: "Ocean Lounge • View 2",
        categoryEs: "Ocean Lounge",
        categoryEn: "Ocean Lounge",
        descEs: "Segunda toma del Ocean Lounge integrando salas de estar exteriores, barra y cubierta artesanal en fibras naturales.",
        descEn: "Second view of the Ocean Lounge integrating outdoor living areas, bar, and handcrafted natural fiber canopy.",
      },
      {
        num: "09",
        src: "/loom/renders/amenities/club-de-playa/galeria_11_ocean_dining_vista_1.webp",
        titleEs: "Ocean Dining • Restaurante Vista 1",
        titleEn: "Ocean Dining • Restaurant View 1",
        categoryEs: "Gastronomía en Alma Beach Club",
        categoryEn: "Beach Club Dining",
        descEs: "Vista del Ocean Dining, zona de restaurante de alta gastronomía con pérgolas cálidas y ambiente costero.",
        descEn: "View of Ocean Dining, fine dining restaurant zone with warm pergolas and coastal ambiance.",
      },
      {
        num: "10",
        src: "/loom/renders/amenities/club-de-playa/galeria_12_ocean_dining_vista_2.webp",
        titleEs: "Ocean Dining • Restaurante Vista 2",
        titleEn: "Ocean Dining • Restaurant View 2",
        categoryEs: "Gastronomía en Alma Beach Club",
        categoryEn: "Beach Club Dining",
        descEs: "Segunda toma de Ocean Dining mostrando las mesas bajo cubierta bioclimática y vistas abiertas al entorno natural.",
        descEn: "Second view of Ocean Dining showing tables under the bioclimatic canopy and open views of the natural surroundings.",
      },
      {
        num: "11",
        src: "/loom/renders/amenities/club-de-playa/galeria_25_sunset_dining_vista_1.webp",
        titleEs: "Sunset Dining al Atardecer",
        titleEn: "Sunset Dining at Dusk",
        categoryEs: "Sunset Dining",
        categoryEn: "Sunset Dining",
        descEs: "Terraza de madera bajo pérgola de bambú y palmeras frente a la playa, con mesas y sillas de fibra natural, comensales y mar al fondo con luz cálida del atardecer.",
        descEn: "Wooden terrace under a bamboo pergola and beachfront palms, featuring natural fiber tables and chairs, diners, and the sea in the background bathed in warm sunset light.",
      },
      {
        num: "12",
        src: "/loom/renders/amenities/club-de-playa/galeria_22_sunset_spa_vista_1.webp",
        titleEs: "Sunset Spa • Bienestar en Alma Beach Club",
        titleEn: "Sunset Spa • Coastal Wellness",
        categoryEs: "Sunset Spa",
        categoryEn: "Sunset Spa",
        descEs: "Vista del Sunset Spa: santuario de relajación, masajes e hidroterapia rodeado de vegetación tropical.",
        descEn: "View of the Sunset Spa: relaxation, massage, and hydrotherapy sanctuary surrounded by tropical greenery.",
      },
      {
        num: "13",
        src: "/loom/renders/amenities/club-de-playa/galeria_13_loom_oasis_vista_1.webp",
        titleEs: "LOOM Oasis • Vista 1",
        titleEn: "LOOM Oasis • View 1",
        categoryEs: "LOOM Oasis",
        categoryEn: "LOOM Oasis",
        descEs: "Primera toma de LOOM Oasis: circuito de espejos de agua, piscinas orgánicas y paisajismo exuberante.",
        descEn: "First view of LOOM Oasis: circuit of water mirrors, organic pools, and lush landscaping.",
      },
      {
        num: "14",
        src: "/loom/renders/amenities/club-de-playa/galeria_14_loom_oasis_vista_2.webp",
        titleEs: "LOOM Oasis • Vista 2",
        titleEn: "LOOM Oasis • View 2",
        categoryEs: "LOOM Oasis",
        categoryEn: "LOOM Oasis",
        descEs: "Segunda toma de LOOM Oasis con zonas de descanso inmersas entre palmeras y senderos sobre el agua.",
        descEn: "Second view of LOOM Oasis featuring relaxation zones immersed among palms and overwater pathways.",
      },
      {
        num: "15",
        src: "/loom/renders/amenities/club-de-playa/galeria_15_loom_oasis_vista_3.webp",
        titleEs: "LOOM Oasis • Vista 3",
        titleEn: "LOOM Oasis • View 3",
        categoryEs: "LOOM Oasis",
        categoryEn: "LOOM Oasis",
        descEs: "Tercera toma de LOOM Oasis destacando las terrazas escalonadas y la arquitectura bioclimática.",
        descEn: "Third view of LOOM Oasis highlighting tiered terraces and bioclimatic architecture.",
      },
      {
        num: "16",
        src: "/loom/renders/amenities/club-de-playa/galeria_16_loom_oasis_vista_4.webp",
        titleEs: "LOOM Oasis • Vista 4",
        titleEn: "LOOM Oasis • View 4",
        categoryEs: "LOOM Oasis",
        categoryEn: "LOOM Oasis",
        descEs: "Cuarta toma de LOOM Oasis con pérgolas de sombra natural y mobiliario de exterior junto a la piscina.",
        descEn: "Fourth view of LOOM Oasis with natural shade pergolas and poolside outdoor lounge furniture.",
      },
      {
        num: "17",
        src: "/loom/renders/amenities/club-de-playa/galeria_17_loom_oasis_vista_5.webp",
        titleEs: "LOOM Oasis • Vista 5",
        titleEn: "LOOM Oasis • View 5",
        categoryEs: "LOOM Oasis",
        categoryEn: "LOOM Oasis",
        descEs: "Quinta toma de LOOM Oasis mostrando la integración armónica entre agua, piedra natural y vegetación.",
        descEn: "Fifth view of LOOM Oasis showcasing the harmonious integration of water, natural stone, and greenery.",
      },
      {
        num: "18",
        src: "/loom/renders/amenities/club-de-playa/galeria_18_loom_oasis_vista_6.webp",
        titleEs: "LOOM Oasis • Vista 6",
        titleEn: "LOOM Oasis • View 6",
        categoryEs: "LOOM Oasis",
        categoryEn: "LOOM Oasis",
        descEs: "Sexta toma de LOOM Oasis con asoleadoras, espejos de agua y ambiente tipo resort privado.",
        descEn: "Sixth view of LOOM Oasis featuring sun loungers, water mirrors, and private resort ambiance.",
      },
      {
        num: "19",
        src: "/loom/renders/amenities/club-de-playa/galeria_19_loom_oasis_vista_7.webp",
        titleEs: "LOOM Oasis • Vista 7",
        titleEn: "LOOM Oasis • View 7",
        categoryEs: "LOOM Oasis",
        categoryEn: "LOOM Oasis",
        descEs: "Séptima toma de LOOM Oasis enmarcada por palmas reales y senderos peatonales.",
        descEn: "Seventh view of LOOM Oasis framed by royal palms and pedestrian pathways.",
      },
      {
        num: "20",
        src: "/loom/renders/amenities/club-de-playa/galeria_20_lago_loom_vista_1.webp",
        titleEs: "Lago LOOM • Espejo de Agua Central",
        titleEn: "LOOM Lake • Central Water Mirror",
        categoryEs: "Lago LOOM",
        categoryEn: "LOOM Lake",
        descEs: "Vista del lago de LOOM rodeado de paisajismo nativo, senderos contemplativos y brisa natural.",
        descEn: "View of LOOM Lake surrounded by native landscaping, contemplative trails, and natural breeze.",
      },
      {
        num: "21",
        src: "/loom/renders/amenities/club-de-playa/galeria_21_voleibol_vista_1.webp",
        titleEs: "Cancha de Voleibol de Playa",
        titleEn: "Beach Volleyball Court",
        categoryEs: "Deportes & Recreación",
        categoryEn: "Sports & Recreation",
        descEs: "Vista de la cancha de voleibol sobre arena rodeada de palmeras y zonas de esparcimiento.",
        descEn: "View of the sand volleyball court surrounded by palm trees and leisure zones.",
      },
      {
        num: "22",
        src: "/loom/renders/amenities/club-de-playa/galeria_23_nature_walk_vista_1.webp",
        titleEs: "Sendero Nature Walk • Vista 1",
        titleEn: "Nature Walk Trail • View 1",
        categoryEs: "Nature Walk",
        categoryEn: "Nature Walk",
        descEs: "Vista del sendero ecológico Nature Walk para caminatas biofílicas bajo sombra de vegetación nativa.",
        descEn: "View of the Nature Walk ecological trail for biophilic walks under the shade of native vegetation.",
      },
      {
        num: "23",
        src: "/loom/renders/amenities/club-de-playa/galeria_24_nature_walk_vista_2.webp",
        titleEs: "Sendero Nature Walk • Vista 2",
        titleEn: "Nature Walk Trail • View 2",
        categoryEs: "Nature Walk",
        categoryEn: "Nature Walk",
        descEs: "Segunda toma del sendero Nature Walk conectando las zonas residenciales con las amenidades costeras.",
        descEn: "Second view of the Nature Walk trail connecting residential zones with coastal amenities.",
      },
    ],
  },
  CLUB_HOUSE: {
    key: "CLUB_HOUSE",
    badgeEs: "Club House • Piscinas, Pádel & Bienestar",
    badgeEn: "Club House • Pools, Padel & Wellness",
    summaryEs:
      "Centro social, deportivo y de bienestar de Loom Luxury Residence. Integra piscinas tipo resort, canchas de pádel y tenis, zonas de yoga y picnic, salones sociales, coworking, gimnasio y conexión con LOOM Oasis.",
    summaryEn:
      "Social, sports, and wellness hub of Loom Luxury Residence. Integrates resort-style pools, padel and tennis courts, yoga and picnic zones, social lounges, coworking, gym, and connection to LOOM Oasis.",
    highlightsEs: [
      "Piscina Club House",
      "Canchas de Pádel & Tenis",
      "Coworking & Gimnasio",
      "Zonas de Yoga & Picnic",
    ],
    highlightsEn: [
      "Club House Pool",
      "Padel & Tennis Courts",
      "Coworking & Gym",
      "Yoga & Picnic Zones",
    ],
    items: [
      {
        num: "01",
        src: "/loom/renders/amenities/club-house/galeria_01_club_house_piscina_vista_1.webp",
        titleEs: "Club House • Piscina Social Principal",
        titleEn: "Club House • Main Social Pool",
        categoryEs: "Club House Piscina",
        categoryEn: "Club House Pool",
        descEs:
          "Vista principal de la piscina del Club House de Loom Luxury Residence, rodeada de decks de asoleadoras, arquitectura bioclimática y vegetación tropical.",
        descEn:
          "Main view of the Loom Luxury Residence Club House pool, surrounded by sunbed decks, bioclimatic architecture, and tropical greenery.",
      },
      {
        num: "02",
        src: "/loom/renders/amenities/club-house/galeria_02_club_house_cancha_padel_vista_1.webp",
        titleEs: "Club House • Cancha de Pádel",
        titleEn: "Club House • Padel Court",
        categoryEs: "Zona Deportiva",
        categoryEn: "Sports Zone",
        descEs:
          "Cancha de pádel reglamentaria integrada al entorno paisajístico del Club House, con cerramiento en cristal templado e iluminación deportiva.",
        descEn:
          "Regulation padel court integrated into the Club House landscape, featuring tempered glass enclosures and sports lighting.",
      },
    ],
  },
  PORTERIA: {
    key: "PORTERIA",
    badgeEs: "Portería Monumental • Acceso Principal 24/7",
    badgeEn: "Monumental Gatehouse • 24/7 Main Access",
    summaryEs:
      "Pórtico arquitectónico de ingreso a Loom Luxury Residence. Diseñado con cubierta plana de madera en voladizo con vegetación colgante, caseta de control con celosía de madera y vidrio, cerramientos de lamas verticales, muro de piedra natural y óvalo adoquinado.",
    summaryEn:
      "Architectural entrance portico to Loom Luxury Residence. Designed with a cantilevered flat wooden canopy with hanging greenery, control booth with wood louver and glass, vertical slat enclosures, natural stone wall, and cobblestone circulation oval.",
    highlightsEs: [
      "Cubierta en Voladizo",
      "Caseta en Celosía & Piedra",
      "Acceso Vehicular & Peatonal",
      "Seguridad Privada 24/7",
    ],
    highlightsEn: [
      "Cantilevered Canopy",
      "Louver & Stone Control Booth",
      "Vehicular & Pedestrian Access",
      "24/7 Private Security",
    ],
    items: [
      {
        num: "01",
        src: "/loom/renders/amenities/porteria/galeria_01_porteria_vista_1.webp",
        titleEs: "Portería Principal • Vista Frontal de Acceso",
        titleEn: "Main Gatehouse • Front Access View",
        categoryEs: "Portería Vista 1",
        categoryEn: "Gatehouse View 1",
        descEs:
          "Vista frontal de la portería desde la vía de acceso adoquinada. Cubierta plana de madera en voladizo con vegetación colgante, caseta de control con celosía de madera y vidrio, cerramientos de lamas verticales y muro de piedra al fondo al atardecer.",
        descEn:
          "Front view of the gatehouse from the cobblestone access road. Cantilevered flat wooden roof with hanging greenery, control booth with wooden louver and glass, vertical slat enclosures, and stone wall in the background at sunset.",
      },
      {
        num: "02",
        src: "/loom/renders/amenities/porteria/galeria_02_porteria_vista_2.webp",
        titleEs: "Portería Principal • Acceso Peatonal & Jardines",
        titleEn: "Main Gatehouse • Pedestrian Access & Gardens",
        categoryEs: "Portería Vista 2",
        categoryEn: "Gatehouse View 2",
        descEs:
          "Vista peatonal desde el jardín, a la altura de los ojos. Andén curvo en concreto lavado que conduce a la caseta bajo la gran cubierta con enredaderas y columna de piedra, con vegetación tropical e iluminación de acento.",
        descEn:
          "Eye-level pedestrian view from the garden. Curved washed-concrete walkway leading to the booth under the grand vine-draped canopy and stone column, with tropical greenery and accent lighting.",
      },
      {
        num: "03",
        src: "/loom/renders/amenities/porteria/galeria_03_porteria_vista_3.webp",
        titleEs: "Portería Principal • Detalle Caseta de Control",
        titleEn: "Main Gatehouse • Control Booth Detail",
        categoryEs: "Portería Vista 3",
        categoryEn: "Gatehouse View 3",
        descEs:
          "Vista de detalle de la caseta de control: volumen de concreto con textura natural, celosía de madera corrediza, carpintería de vidrio, cubierta en voladizo y muro de piedra con vegetación.",
        descEn:
          "Detail view of the control booth: natural-textured concrete volume, sliding wooden louver, glass joinery, cantilevered roof, and stone wall with greenery.",
      },
      {
        num: "04",
        src: "/loom/renders/amenities/porteria/galeria_04_porteria_vista_4.webp",
        titleEs: "Portería Principal • Panorámica al Atardecer",
        titleEn: "Main Gatehouse • Sunset Panoramic View",
        categoryEs: "Portería Vista 4",
        categoryEn: "Gatehouse View 4",
        descEs:
          "Vista general panorámica de la portería al atardecer: muestra la cubierta de madera con vegetación, la caseta central con celosía, las barreras de lamas de madera, el muro de piedra y el óvalo de circulación adoquinado con jardineras.",
        descEn:
          "Panoramic general view of the gatehouse at sunset: showcasing the planted wooden canopy, central louvered booth, wooden slat barriers, stone wall, and cobblestone circulation oval with planters.",
      },
    ],
  },
  PARQUES: {
    key: "PARQUES",
    badgeEs: "Parque Lineal & The Garden Walk • Zonas Verdes",
    badgeEn: "Linear Park & The Garden Walk • Green Zones",
    summaryEs:
      "Corredor ecológico central y parques bioclimáticos de etapa (The Garden Walk & Nature Walk) diseñados para preservar la vegetación nativa, conectar peatonalmente las manzanas residenciales y ofrecer espejos de agua y zonas de contemplación.",
    summaryEn:
      "Central ecological corridor and bioclimatic stage parks (The Garden Walk & Nature Walk) designed to preserve native vegetation, connect residential blocks via pedestrian trails, and offer water mirrors and contemplation zones.",
    highlightsEs: [
      "The Garden Walk",
      "Senderos Nature Walk",
      "Lago LOOM & Paisajismo",
      "Microclima Bioclimático",
    ],
    highlightsEn: [
      "The Garden Walk",
      "Nature Walk Trails",
      "LOOM Lake & Landscaping",
      "Bioclimatic Microclimate",
    ],
    items: [
      {
        num: "01",
        src: "/loom/renders/amenities/parques/galeria_01_parque_lineal_vista_1.webp",
        titleEs: "Parque Lineal • The Garden Walk",
        titleEn: "Linear Park • The Garden Walk",
        categoryEs: "Parque Lineal",
        categoryEn: "Linear Park",
        descEs:
          "Vista principal del Parque Lineal (The Garden Walk): corredor verde peatonal que articula las etapas residenciales de Loom con senderos orgánicos, arborización nativa y zonas de descanso al aire libre.",
        descEn:
          "Main view of the Linear Park (The Garden Walk): pedestrian green corridor articulating Loom's residential stages with organic trails, native trees, and outdoor rest zones.",
      },
      {
        num: "02",
        src: "/loom/renders/amenities/club-de-playa/galeria_23_nature_walk_vista_1.webp",
        titleEs: "Sendero Ecológico • Nature Walk Vista 1",
        titleEn: "Ecological Trail • Nature Walk View 1",
        categoryEs: "Nature Walk",
        categoryEn: "Nature Walk",
        descEs:
          "Sendero peatonal biofílico rodeado de vegetación tropical densa para caminatas, trote suave y conexión con la naturaleza.",
        descEn:
          "Biophilic pedestrian trail surrounded by lush tropical greenery for walking, jogging, and connecting with nature.",
      },
      {
        num: "03",
        src: "/loom/renders/amenities/club-de-playa/galeria_24_nature_walk_vista_2.webp",
        titleEs: "Sendero Ecológico • Nature Walk Vista 2",
        titleEn: "Ecological Trail • Nature Walk View 2",
        categoryEs: "Nature Walk",
        categoryEn: "Nature Walk",
        descEs:
          "Segunda perspectiva del corredor Nature Walk integrando paisajismo costero y mobiliario contemplativo.",
        descEn:
          "Second perspective of the Nature Walk corridor integrating coastal landscaping and contemplative seating.",
      },
      {
        num: "04",
        src: "/loom/renders/amenities/club-de-playa/galeria_20_lago_loom_vista_1.webp",
        titleEs: "Lago LOOM • Paisajismo Acuático",
        titleEn: "LOOM Lake • Aquatic Landscaping",
        categoryEs: "Lago LOOM",
        categoryEn: "LOOM Lake",
        descEs:
          "Espejo de agua naturalizado dentro del circuito de parques y senderos de Loom Luxury Residence.",
        descEn:
          "Naturalized water body within the parks and trails circuit of Loom Luxury Residence.",
      },
    ],
  },
};

export const LOOM_SHARED_GALLERY: ShowroomMediaItem[] = [
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

export const LOOM_SHARED_AXONOMETRICS: ShowroomMediaItem[] = [
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

export const LOOM_LUXURY_PLANS: ShowroomMediaItem[] = [
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

export const LOOM_GARDEN_PLANS: ShowroomMediaItem[] = [
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

export const LOOM_SHARED_ELEVATIONS: ShowroomMediaItem[] = [
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

export function getLoomTour360List(isEn: boolean): ShowroomTour360Scene[] {
  return [
    {
      id: "fachada",
      label: isEn ? "Main Facade" : "Fachada Principal",
      category: "Exterior",
      url: "https://kuula.co/share/collection/7TMZx?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=1",
    },
    {
      id: "sala",
      label: isEn ? "Living & Dining" : "Sala & Comedor",
      category: isEn ? "Indoor Social" : "Interior Social",
      url: "https://kuula.co/share/collection/7TKQ2?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=1",
    },
    {
      id: "habitacion",
      label: isEn ? "Master Suite" : "Suite Principal",
      category: isEn ? "Master Bedroom" : "Dormitorio Master",
      url: "https://kuula.co/share/collection/7TKzy?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=1",
    },
    {
      id: "bano",
      label: isEn ? "Master Bathroom" : "Baño Suite Master",
      category: isEn ? "Indoor Bathroom" : "Interior Baño",
      url: "https://kuula.co/share/collection/7TndH?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=1",
    },
    {
      id: "altillo",
      label: isEn ? "Loft & Rooftop" : "Altillo & Rooftop",
      category: "Rooftop Lounge",
      url: "https://kuula.co/share/collection/7T6Y1?logo=0&info=0&fs=1&vr=0&sd=1&thumbs=1",
    },
  ];
}

