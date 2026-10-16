"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Phone, 
  Layout, 
  Calculator, 
  Ruler, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Info,
  Share2,
  Check,
  Sparkles,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Trees
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
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
  translateAreaText,
  formatCopOrUsd,
  formatPricePerAreaUnit,
  inferStageFromLotId,
} from "@/lib/loomI18n";

interface AmenityMediaItem {
  num: string;
  src: string;
  titleEs: string;
  titleEn: string;
  categoryEs: string;
  categoryEn: string;
  descEs: string;
  descEn: string;
}

interface AmenityGalleryConfig {
  key: "BEACH_CLUB" | "CLUB_HOUSE" | "PORTERIA" | "PARQUES";
  badgeEs: string;
  badgeEn: string;
  summaryEs: string;
  summaryEn: string;
  highlightsEs: string[];
  highlightsEn: string[];
  items: AmenityMediaItem[];
}

const AMENITY_GALLERIES: Record<AmenityGalleryConfig["key"], AmenityGalleryConfig> = {
  BEACH_CLUB: {
    key: "BEACH_CLUB",
    badgeEs: "Alma Beach Club • Salida Directa al Mar",
    badgeEn: "Alma Beach Club • Direct Sea Access",
    summaryEs:
      "Club de playa privado y circuito de zonas comunes de Loom Luxury Residence con salida directa al Mar Caribe en Punta Canoa. Integra piscinas frente al mar, Sun Beds, Ocean Lounge, Ocean Dining, Sunset Spa, Sunset Dining, Loom Oasis, Lago Loom, cancha de voleibol y senderos Nature Walk.",
    summaryEn:
      "Private beach club and common area circuit of Loom Luxury Residence with direct access to the Caribbean Sea in Punta Canoa. Integrates beachfront pools, Sun Beds, Ocean Lounge, Ocean Dining, Sunset Spa, Sunset Dining, Loom Oasis, Loom Lake, beach volleyball court, and Nature Walk trails.",
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
        categoryEs: "Gastronomía Frente al Mar",
        categoryEn: "Beachfront Dining",
        descEs: "Vista del Ocean Dining, zona de restaurante de alta gastronomía con pérgolas cálidas y ambiente costero.",
        descEn: "View of Ocean Dining, fine dining restaurant zone with warm pergolas and coastal ambiance.",
      },
      {
        num: "10",
        src: "/loom/renders/amenities/club-de-playa/galeria_12_ocean_dining_vista_2.webp",
        titleEs: "Ocean Dining • Restaurante Vista 2",
        titleEn: "Ocean Dining • Restaurant View 2",
        categoryEs: "Gastronomía Frente al Mar",
        categoryEn: "Beachfront Dining",
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
        titleEs: "Sunset Spa • Bienestar Frente al Mar",
        titleEn: "Sunset Spa • Beachfront Wellness",
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
      {
        num: "03",
        src: "/loom/renders/amenities/urbanismo/galeria_01_urbanismo_implantacion_vista_1.webp",
        titleEs: "Implantación General Urbanismo • Vista 1",
        titleEn: "Masterplan Urban Layout • View 1",
        categoryEs: "Urbanismo LOOM",
        categoryEn: "LOOM Masterplan",
        descEs:
          "Vista aérea cenital de la implantación del proyecto: manzanas de lotes con trazado diagonal, vías internas con retornos, zona de amenidades con piscinas y jardines, y el Club de Playa al oriente.",
        descEn:
          "Top-down aerial view of the project layout: diagonal lot blocks, internal roads with turnarounds, amenity zone with pools and gardens, and the Beach Club to the east.",
      },
      {
        num: "04",
        src: "/loom/renders/amenities/urbanismo/galeria_02_urbanismo_implantacion_vista_2.webp",
        titleEs: "Implantación Numerada & Ejes Viales • Vista 2",
        titleEn: "Numbered Masterplan & Road Axes • View 2",
        categoryEs: "Urbanismo LOOM",
        categoryEn: "LOOM Masterplan",
        descEs:
          "Vista aérea cenital con lotes numerados por manzana y ejes viales de la A a la L: al occidente la portería de acceso, en el sector central el parque lineal, y al oriente el Club House y el Beach Club.",
        descEn:
          "Top-down aerial view with numbered lots by block and road axes A through L: main gatehouse to the west, linear park in the center, and Club House and Beach Club to the east.",
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
  pricePerM2?: string;
  separation?: string;
}

interface LoomLotPanelProps {
  lot: Lot | null;
  onClose: () => void;
  onEnterShowroom: (lot: Lot) => void;
}

export default function LoomLotPanel({ lot, onClose, onEnterShowroom }: LoomLotPanelProps) {
  const { isEn, trm } = useLoomLang();
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
  const [financingMonths, setFinancingMonths] = useState<number>(48);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Lightbox Modal para el plano arquitectónico o galería de zonas comunes en alta resolución
  const [isPlanLightboxOpen, setIsPlanLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState<number>(1);
  const [imgLoadError, setImgLoadError] = useState<boolean>(false);
  const [amenitySlideIdx, setAmenitySlideIdx] = useState<number>(0);

  const [assignedAdvisor, setAssignedAdvisor] = useState<Advisor | null>(null);
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

  // Reset zoom, slide y error cuando cambia el lote o amenidad
  useEffect(() => {
    setLightboxZoom(1);
    setImgLoadError(false);
    setCopiedLink(false);
    setAmenitySlideIdx(0);
  }, [lot?.id, lot?.rawId]);

  // Desglose de Manzana, Número de Lote y Galería de Zona Común
  const lotDetails = useMemo(() => {
    if (!lot) return { block: "", number: "", isAmenity: true, imageSrc: "", amenityGallery: null as AmenityGalleryConfig | null };
    const isAmenity = lot.status === "common" || 
                      lot.statusRaw === "AMENIDAD" || 
                      lot.id?.includes("PARQUE") || 
                      lot.id?.includes("PORTERIA") || 
                      lot.id?.includes("CLUB");

    const identifier = lot.rawId || lot.id || "";
    const match = identifier.match(/([A-Za-z])-?(\d+)/);
    let block = "";
    let number = "";
    let imageSrc = "";

    if (match && !isAmenity) {
      block = match[1].toUpperCase();
      number = match[2].padStart(2, '0');
      imageSrc = `/loom/lots/${block}-${number}.webp`;
    } else if (!isAmenity) {
      imageSrc = `/loom/lots/${identifier}.webp`;
    }

    let amenityGallery: AmenityGalleryConfig | null = null;
    if (isAmenity) {
      const rawLower = (lot.rawId || "").toLowerCase();
      const idUpper = (lot.id || "").toUpperCase();
      const locLower = (lot.location || "").toLowerCase();

      if (rawLower.includes("alma") || rawLower.includes("playa") || locLower.includes("playa") || idUpper.includes("ALMA")) {
        amenityGallery = AMENITY_GALLERIES.BEACH_CLUB;
      } else if (idUpper.includes("CLUB") || rawLower.includes("club")) {
        amenityGallery = AMENITY_GALLERIES.CLUB_HOUSE;
      } else if (idUpper.includes("PORTERIA") || rawLower.includes("porter")) {
        amenityGallery = AMENITY_GALLERIES.PORTERIA;
      } else if (idUpper.includes("PARQUE") || rawLower.includes("parque")) {
        amenityGallery = AMENITY_GALLERIES.PARQUES;
      } else {
        amenityGallery = AMENITY_GALLERIES.CLUB_HOUSE;
      }
    }

    return { block, number, isAmenity, imageSrc, amenityGallery };
  }, [lot]);

  const amenityItems = lotDetails.amenityGallery?.items || [];
  const activeAmenityItem = amenityItems[amenitySlideIdx] || amenityItems[0] || null;

  const handlePrevAmenitySlide = useCallback(() => {
    if (amenityItems.length <= 1) return;
    setAmenitySlideIdx((prev) => (prev - 1 + amenityItems.length) % amenityItems.length);
    setLightboxZoom(1);
  }, [amenityItems.length]);

  const handleNextAmenitySlide = useCallback(() => {
    if (amenityItems.length <= 1) return;
    setAmenitySlideIdx((prev) => (prev + 1) % amenityItems.length);
    setLightboxZoom(1);
  }, [amenityItems.length]);

  // Manejador teclas Escape, Flecha Izquierda y Flecha Derecha para Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsPlanLightboxOpen(false);
      } else if (isPlanLightboxOpen && lotDetails.isAmenity && amenityItems.length > 1) {
        if (e.key === "ArrowLeft") handlePrevAmenitySlide();
        if (e.key === "ArrowRight") handleNextAmenitySlide();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlanLightboxOpen, lotDetails.isAmenity, amenityItems.length, handlePrevAmenitySlide, handleNextAmenitySlide]);

  // Notificar iframe parent si aplica
  useEffect(() => {
    if (typeof window !== "undefined" && lot && window.parent !== window) {
      window.parent.postMessage({
        type: 'LOT_SELECTED',
        payload: {
          lotId: lot.id,
          price: lot.totalPrice
        }
      }, '*');
    }
  }, [lot]);

  // Cálculos dinámicos del simulador oficial Loom (20% Inicial / 70% Financiado a 48m 0% interés / 10% Contraentrega)
  const parsedPriceNum = useMemo(() => {
    if (!lot?.totalPrice) return 0;
    const digits = lot.totalPrice.replace(/[^\d]/g, '');
    return parseInt(digits, 10) || 0;
  }, [lot]);

  const calculatedFinancing = useMemo(() => {
    if (!parsedPriceNum) return null;
    const finalPct = 10; // 10% Contraentrega oficial Loom
    const financePct = Math.max(0, 100 - downPaymentPct - finalPct);
    const downAmount = Math.round(parsedPriceNum * (downPaymentPct / 100));
    const finalAmount = Math.round(parsedPriceNum * (finalPct / 100));
    const financeTotal = parsedPriceNum - downAmount - finalAmount;
    const monthlyAmount = financeTotal > 0 ? Math.round(financeTotal / financingMonths) : 0;
    return {
      downAmount,
      finalAmount,
      financePct,
      financeTotal,
      monthlyAmount,
    };
  }, [parsedPriceNum, downPaymentPct, financingMonths]);

  if (!lot) return null;

  const handleShareLot = () => {
    if (typeof window === "undefined") return;
    const stageKey = inferStageFromLotId(lot.id);
    const url = new URL(window.location.href);
    url.searchParams.set("stage", stageKey);
    url.searchParams.set("lot", lot.id);
    if (isEn) {
      url.searchParams.set("lang", "en");
    }
    navigator.clipboard?.writeText(url.toString()).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Lógica del botón de separar lote (atribución y WhatsApp de asesor)
  const handleSeparateClick = () => {
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({
        type: 'LOT_SEPARATE_CLICKED',
        payload: {
          lotId: lot.rawId || lot.id,
          price: lot.totalPrice,
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
          id: lot.id,
          rawId: lot.rawId,
          price: lot.totalPrice,
          area: lot.area,
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
          id: lot.id,
          rawId: lot.rawId,
          price: lot.totalPrice,
          area: lot.area,
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

  const getStatusBadge = (status: string) => {
    if (lotDetails.isAmenity) {
      return (
        <div className="flex items-center gap-1 bg-[#B35F27]/15 text-[#B35F27] border border-[#B35F27]/40 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          {isEn ? "Amenity / Common Area" : "Amenidad / Zona Común"}
        </div>
      );
    }
    switch (status) {
      case "available":
        return (
          <div className="flex items-center gap-1 bg-emerald-500/15 text-emerald-800 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600" />
            {isEn ? "Available" : "Disponible"}
          </div>
        );
      case "reserved":
      case "blocked":
        return (
          <div className="flex items-center gap-1 bg-[#3b82f6]/15 text-[#1e40af] border border-[#3b82f6]/30 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600" />
            {isEn ? "Blocked" : "Bloqueado"}
          </div>
        );
      case "sold":
        return (
          <div className="flex items-center gap-1 bg-red-500/15 text-red-700 border border-red-500/30 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-600" />
            {isEn ? "Sold" : "Vendido"}
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 bg-black/10 text-[#0A0D0B]/60 border border-[#0A0D0B]/10 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
            <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {status.toUpperCase()}
          </div>
        );
    }
  };

  return (
    <>
      {/* Contenedor Principal (Panel Lateral) */}
      <motion.div
        initial={{ x: "100%", opacity: 0.8 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0.8 }}
        transition={{ type: "spring", damping: 25, stiffness: 150 }}
        className="fixed top-0 right-0 z-40 h-[100dvh] w-[85vw] max-md:landscape:w-[48vw] md:w-[24rem] lg:w-[28rem] bg-[#EDE7E0]/95 border-l border-[#0A0D0B]/15 shadow-2xl backdrop-blur-xl flex flex-col text-[#0A0D0B] justify-between"
      >
        {/* Cabecera del Panel */}
        <div className="p-4 sm:p-5 border-b border-[#0A0D0B]/10 flex justify-between items-center relative z-10 bg-[#EDE7E0]/80">
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <div>
              <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-[#B35F27] font-bold block">LOOM Luxury Residence</span>
              <h2 className="text-lg sm:text-2xl font-serif text-[#0A0D0B] font-bold tracking-wide mt-0.5">
                {lotDetails.isAmenity ? translateAreaText(lot.rawId, isEn) : `${isEn ? "Lot" : "Lote"} ${lot.rawId}`}
              </h2>
            </div>
            <div>
              {getStatusBadge(lot.status)}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {!lotDetails.isAmenity && (
              <button
                onClick={handleShareLot}
                className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-black/5 border border-[#0A0D0B]/15 rounded-full text-[9px] font-bold uppercase tracking-wider text-[#0A0D0B]/80 hover:text-[#B35F27] transition-all cursor-pointer"
                title={isEn ? "Copy direct link to this lot" : "Copiar enlace directo a este lote"}
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">{isEn ? "Copied!" : "¡Copiado!"}</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5 text-[#B35F27]" />
                    <span className="hidden sm:inline">{isEn ? "Share" : "Compartir"}</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-black/5 border border-[#0A0D0B]/10 hover:border-[#0A0D0B]/20 rounded-full transition-all duration-300 group cursor-pointer"
              title={isEn ? "Close lot details" : "Cerrar detalles del lote"}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-[#0A0D0B]/70 group-hover:text-[#0A0D0B]" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4 relative z-10">
          
          {/* Cinta Compacta de Dimensiones */}
          <div className="grid grid-cols-2 bg-white/80 border border-[#0A0D0B]/10 p-2.5 sm:p-3.5 rounded-xl text-center items-center shadow-sm">
            <div className="border-r border-[#0A0D0B]/10 pr-2">
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-[#0A0D0B]/50 block font-bold">
                {lotDetails.isAmenity ? (isEn ? "Category" : "Categoría") : (isEn ? "Total Area" : "Área Total")}
              </span>
              <span className="text-xs sm:text-base font-serif text-[#0A0D0B] font-bold mt-0.5 block">
                {translateAreaText(lot.area, isEn)}
              </span>
            </div>
            <div className="pl-2">
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-[#0A0D0B]/50 block font-bold">
                {lotDetails.isAmenity ? (isEn ? "Zone & Function" : "Vocación") : (isEn ? "Location Type" : "Tipología")}
              </span>
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#0A0D0B] mt-0.5 block">
                {translateLocationType(lot.location || "MEDIANERO", isEn)}
              </span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 🖼️ SECCIÓN: GALERÍA INTERACTIVA DE ZONAS COMUNES (AMENIDADES) */}
          {/* ============================================================ */}
          {lotDetails.isAmenity && lotDetails.amenityGallery && (
            <div className="bg-white/95 border border-[#B35F27]/30 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
              {/* Header de la Galería */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[#B35F27]">
                  <ImageIcon className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#0A0D0B]">
                    {isEn ? "Official Renders Gallery" : "Galería de Renders Oficiales"}
                  </span>
                </div>
                {amenityItems.length > 0 ? (
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-[#B35F27]/12 text-[#B35F27] border border-[#B35F27]/25 px-2 py-0.5 rounded-md shrink-0">
                    {String(amenitySlideIdx + 1).padStart(2, "0")} / {String(amenityItems.length).padStart(2, "0")}
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-[#B35F27] border border-[#B35F27]/30 px-2 py-0.5 rounded-md shrink-0">
                    {isEn ? "Coming Soon" : "Próximamente"}
                  </span>
                )}
              </div>

              {amenityItems.length > 0 && activeAmenityItem ? (
                <>
                  {/* Visor Principal del Render */}
                  <div
                    onClick={() => setIsPlanLightboxOpen(true)}
                    className="relative w-full aspect-[16/10] bg-[#0A0D0B] rounded-xl overflow-hidden border border-[#0A0D0B]/15 cursor-pointer group shadow-md"
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeAmenityItem.src}
                        src={activeAmenityItem.src}
                        alt={isEn ? activeAmenityItem.titleEn : activeAmenityItem.titleEs}
                        initial={{ opacity: 0.4, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0.4 }}
                        transition={{ duration: 0.25 }}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </AnimatePresence>

                    {/* Etiqueta superior de categoría */}
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-[#0A0D0B]/75 backdrop-blur-md border border-white/15 text-[9px] font-bold uppercase tracking-wider text-[#EBD9AB]">
                      {isEn ? activeAmenityItem.categoryEn : activeAmenityItem.categoryEs}
                    </div>

                    {/* Botón de Pantalla Completa */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPlanLightboxOpen(true);
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-[#0A0D0B]/75 text-white shadow-md border border-white/20 hover:bg-[#B35F27] transition-colors duration-200 cursor-pointer"
                      title={isEn ? "Expand HD Gallery" : "Ampliar Galería HD"}
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Flechas de navegación Prev / Next */}
                    {amenityItems.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrevAmenitySlide();
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#0A0D0B]/70 hover:bg-[#B35F27] text-white border border-white/20 transition-all cursor-pointer shadow-lg"
                          title={isEn ? "Previous render" : "Render anterior"}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNextAmenitySlide();
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#0A0D0B]/70 hover:bg-[#B35F27] text-white border border-white/20 transition-all cursor-pointer shadow-lg"
                          title={isEn ? "Next render" : "Siguiente render"}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {/* Barra inferior sobre la imagen */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 pt-6 flex items-end justify-between">
                      <span className="text-white text-[11px] font-serif font-bold leading-tight drop-shadow">
                        {isEn ? activeAmenityItem.titleEn : activeAmenityItem.titleEs}
                      </span>
                      <span className="text-[9px] text-[#EBD9AB] font-mono font-bold bg-[#B35F27]/85 px-2 py-0.5 rounded shrink-0 ml-2">
                        HD
                      </span>
                    </div>
                  </div>

                  {/* Miniaturas (Thumbnails) Interactivas */}
                  {amenityItems.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      {amenityItems.map((item, idx) => {
                        const isCurrent = idx === amenitySlideIdx;
                        return (
                          <button
                            key={item.src}
                            onClick={() => setAmenitySlideIdx(idx)}
                            className={`relative h-12 w-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                              isCurrent
                                ? "border-[#B35F27] scale-[1.03] shadow-sm"
                                : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={item.src}
                              alt={isEn ? item.titleEn : item.titleEs}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Descripción del render activo */}
                  <p className="text-[11px] text-[#0A0D0B]/75 leading-relaxed bg-[#EDE7E0]/60 p-2.5 rounded-xl border border-[#0A0D0B]/5">
                    {isEn ? activeAmenityItem.descEn : activeAmenityItem.descEs}
                  </p>
                </>
              ) : (
                /* Estado preparado para Los Parques de cada etapa (Próximamente Renders) */
                <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-[#0A0D0B] via-[#141A16] to-[#1E2620] rounded-xl overflow-hidden border border-[#B35F27]/35 p-4 flex flex-col items-center justify-center text-center shadow-inner">
                  <div className="w-11 h-11 rounded-full bg-[#B35F27]/20 border border-[#B35F27]/40 flex items-center justify-center text-[#EBD9AB] mb-2.5">
                    <Trees className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.22em] text-[#EBD9AB] font-mono font-bold">
                    {isEn ? "BIOCLIMATIC PARKS • 7,384 SQ FT" : "PARQUES BIOCLIMÁTICOS • 686 M²"}
                  </span>
                  <h4 className="text-sm sm:text-base font-serif font-bold text-white mt-1">
                    {isEn ? "Official Renders Coming Soon" : "Renders Oficiales Próximamente"}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-white/70 max-w-xs mt-1 leading-relaxed">
                    {isEn
                      ? "3D landscape visualizations for each stage park are currently in post-production and will be available in this gallery soon."
                      : "Las visualizaciones 3D de paisajismo para los parques de cada etapa se encuentran en post-producción y estarán habilitadas muy pronto."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* 📐 SECCIÓN: PLANO ARQUITECTÓNICO & MEDIDAS INDIVIDUALES      */}
          {/* ============================================================ */}
          {!lotDetails.isAmenity && !imgLoadError && (
            <div className="bg-white/90 border border-[#B35F27]/25 rounded-2xl p-3 sm:p-4 shadow-sm space-y-2.5">
              {/* Header de la tarjeta */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#B35F27]">
                  <Ruler className="h-4 w-4" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#0A0D0B]">
                    {isEn ? "Lot Blueprint & Dimensions" : "Plano & Medidas del Lote"}
                  </span>
                </div>
                {lotDetails.block && (
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-[#B35F27]/10 text-[#B35F27] border border-[#B35F27]/20 px-2 py-0.5 rounded-md">
                    {isEn ? `Blk ${lotDetails.block} • Lot ${lotDetails.number}` : `Mz ${lotDetails.block} • Lote ${lotDetails.number}`}
                  </span>
                )}
              </div>

              {/* Contenedor Interactivo de la Imagen del Lote */}
              <div 
                onClick={() => setIsPlanLightboxOpen(true)}
                className="relative w-full aspect-square bg-[#0A0D0B]/[0.03] rounded-xl overflow-hidden border border-[#0A0D0B]/10 cursor-pointer group shadow-inner flex items-center justify-center transition-all duration-300 hover:border-[#B35F27]/50"
              >
                <img
                  src={lotDetails.imageSrc}
                  alt={isEn ? `Blueprint and dimensions for Lot ${lot.rawId || lot.id}` : `Plano y medidas del Lote ${lot.rawId || lot.id}`}
                  className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                  onError={() => setImgLoadError(true)}
                />

                {/* Overlay flotante al pasar el cursor */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-2.5">
                  <span className="text-white text-[10px] font-semibold flex items-center gap-1.5 backdrop-blur-md bg-black/50 px-2.5 py-1 rounded-full border border-white/20">
                    <Maximize2 className="h-3 w-3 text-[#EBD9AB]" />
                    {isEn ? "Expand dimensions (HD)" : "Ampliar medidas (HD)"}
                  </span>
                  <span className="text-[9px] text-[#EBD9AB] font-mono font-bold bg-[#B35F27]/80 px-2 py-0.5 rounded">
                    1080p
                  </span>
                </div>

                {/* Botón de lupa permanente en esquina */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlanLightboxOpen(true);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-[#0A0D0B] shadow-md border border-[#0A0D0B]/10 hover:bg-[#B35F27] hover:text-white transition-colors duration-200"
                  title={isEn ? "View fullscreen" : "Ver en pantalla completa"}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Parámetros dimensionales y nota de cotas */}
              <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] pt-0.5">
                <div className="bg-[#EDE7E0]/60 p-2 rounded-lg border border-[#0A0D0B]/5">
                  <span className="text-[8px] uppercase tracking-wider text-[#0A0D0B]/50 font-bold block">
                    {isEn ? "Registered Area" : "Área Registrada"}
                  </span>
                  <span className="font-serif font-bold text-[#0A0D0B] text-xs block mt-0.5">
                    {translateAreaText(lot.area, isEn)}
                  </span>
                </div>
                <div className="bg-[#EDE7E0]/60 p-2 rounded-lg border border-[#0A0D0B]/5">
                  <span className="text-[8px] uppercase tracking-wider text-[#0A0D0B]/50 font-bold block">
                    {isEn ? "Location Type" : "Tipología"}
                  </span>
                  <span className="font-semibold text-[#0A0D0B] text-xs capitalize truncate block mt-0.5">
                    {translateLocationType(lot.location || "Medianero", isEn)}
                  </span>
                </div>
              </div>

              <p className="text-[9px] text-[#0A0D0B]/60 leading-tight italic flex items-center gap-1.5 pt-0.5">
                <Info className="h-3 w-3 text-[#B35F27] shrink-0" />
                <span>
                  {isEn
                    ? "Exact perimeter dimensions per architectural blueprint (1 m² = 10.76 sq ft)."
                    : "Cotas perimetrales y linderos exactos en metros según plano arquitectónico."}
                </span>
              </p>
            </div>
          )}

          {/* Sección Financiera solo para Lotes Disponibles y Reservados */}
          {(lot.status === "available" || lot.status === "reserved") && !lotDetails.isAmenity ? (
            <div className="space-y-3">
              {/* Tarjeta de Valor Total */}
              <div className="bg-[#0A0D0B] text-[#EDE7E0] rounded-2xl p-4 sm:p-5 shadow-md space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-[#EBD9AB] font-mono block">
                    {isEn ? "Total Investment Value (USD)" : "Valor Total de Inversión (COP)"}
                  </span>
                  <span className="text-[8px] uppercase tracking-wider font-bold bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/35 px-2 py-0.5 rounded-full">
                    {isEn ? "0% Interest" : "0% Interés"}
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-serif font-bold text-white tracking-wide">
                  {formatCopOrUsd(lot.totalPrice, isEn, trm, isEn)}
                </p>
                {lot.pricePerM2 && (
                  <p className="text-white/50 text-[11px]">
                    {isEn
                      ? `Price per sq ft: ${formatPricePerAreaUnit(lot.pricePerM2, true, trm)}`
                      : `Valor por m²: ${lot.pricePerM2}`}
                  </p>
                )}
                {isEn && (
                  <p className="text-[#EBD9AB]/75 text-[9px] font-mono pt-0.5">
                    Live Daily TRM: 1 USD = ${Math.round(trm).toLocaleString("en-US")} COP
                  </p>
                )}
              </div>

              {/* Simulador Interactivo Oficial Loom (20% Inicial / 70% Financiado hasta 48m / 10% Contraentrega) */}
              {calculatedFinancing && (
                <div className="bg-white/90 border border-[#B35F27]/30 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[#B35F27] text-xs font-bold uppercase tracking-wider">
                      <Calculator size={14} />
                      <span>{isEn ? "Payment Plan Simulator (USD)" : "Simulador de Plan de Pagos"}</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-500/15 px-2 py-0.5 rounded-md">
                      {downPaymentPct}% / {calculatedFinancing.financePct}% / 10%
                    </span>
                  </div>

                  {/* Slider Cuota Inicial */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#0A0D0B]/70">
                        {isEn ? `Down Payment (${downPaymentPct}%):` : `Cuota Inicial (${downPaymentPct}%):`}
                      </span>
                      <span className="text-[#B35F27] font-bold">
                        {formatCopOrUsd(calculatedFinancing.downAmount, isEn, trm, isEn)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="60"
                      step="5"
                      value={downPaymentPct}
                      onChange={(e) => setDownPaymentPct(parseInt(e.target.value, 10))}
                      className="w-full accent-[#B35F27] cursor-pointer"
                    />
                  </div>

                  {/* Selector de Plazo (Hasta 48 meses sin intereses) */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[#0A0D0B]/70">
                        {isEn ? `Direct Financing (${calculatedFinancing.financePct}%):` : `Financiación Directa (${calculatedFinancing.financePct}%):`}
                      </span>
                      <span className="text-[#B35F27] font-bold">
                        {financingMonths} {isEn ? "months (0% Int.)" : "meses (0% Int.)"}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      {[12, 24, 36, 48].map((m) => (
                        <button
                          key={m}
                          onClick={() => setFinancingMonths(m)}
                          className={`py-1.5 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                            financingMonths === m
                              ? "bg-[#B35F27] text-white shadow-sm"
                              : "bg-[#EDE7E0]/80 text-[#0A0D0B]/70 hover:bg-white"
                          }`}
                        >
                          {m} {isEn ? "mo" : "meses"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resumen de Cuota Mensual Estimada + Contraentrega */}
                  <div className="pt-2 border-t border-[#0A0D0B]/10 space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-[#0A0D0B]/70 font-semibold">
                        {isEn ? `Monthly Installment (${financingMonths}x):` : `Cuota Mensual (${financingMonths}x):`}
                      </span>
                      <span className="text-base font-serif font-bold text-emerald-700">
                        {formatCopOrUsd(calculatedFinancing.monthlyAmount, isEn, trm, isEn)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline text-[11px]">
                      <span className="text-[#0A0D0B]/60">
                        {isEn ? "Final Payment Upon Delivery (10%):" : "Pago Contraentrega (10%):"}
                      </span>
                      <span className="font-semibold text-[#0A0D0B]">
                        {formatCopOrUsd(calculatedFinancing.finalAmount, isEn, trm, isEn)}
                      </span>
                    </div>
                  </div>

                  {/* Nota de Descuento Pronto Pago / Capital Inicial Fuerte */}
                  <div className="bg-[#EDE7E0]/80 border border-[#B35F27]/25 rounded-lg p-2 flex items-start gap-2 text-[10px] text-[#0A0D0B]/80 leading-snug">
                    <Sparkles className="h-3.5 w-3.5 text-[#B35F27] shrink-0 mt-0.5" />
                    <span>
                      {isEn
                        ? `Direct financing with 0% interest (no banks). Ask about exclusive discounts for cash or initial down payments from ${formatCopOrUsd(100000000, true, trm, true)}.`
                        : "Financiación directa con 0% de interés (sin bancos). Consulta descuentos exclusivos por pago de contado o cuota inicial desde $100M COP."}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/90 border border-[#B35F27]/25 rounded-xl p-4 space-y-2.5 shadow-sm">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-[#B35F27] border-b border-[#B35F27]/20 pb-1 font-bold">
                {lot.status === "blocked"
                  ? isEn ? "Reservation Information" : "Información de Reserva"
                  : lot.status === "sold"
                  ? isEn ? "Lot Status" : "Estado del Lote"
                  : lotDetails.amenityGallery
                  ? isEn ? lotDetails.amenityGallery.badgeEn : lotDetails.amenityGallery.badgeEs
                  : isEn ? "Amenity Details" : "Detalles de la Amenidad"}
              </h3>
              <p className="text-xs text-[#0A0D0B]/80 leading-relaxed font-sans pt-0.5">
                {lot.status === "blocked"
                  ? isEn
                    ? "This lot is currently under Administrative Hold / Blocked by the developer."
                    : "Este lote se encuentra en estado de Reserva Administrativa / Bloqueado por la promotora."
                  : lot.status === "sold"
                  ? isEn
                    ? "This lot has already been allocated and sold in full."
                    : "Este lote ya ha sido adjudicado y vendido en su totalidad."
                  : lotDetails.amenityGallery
                  ? isEn
                    ? lotDetails.amenityGallery.summaryEn
                    : lotDetails.amenityGallery.summaryEs
                  : isEn
                  ? "Fully equipped common space designed for the comfort, leisure, and security of all Loom Luxury Residence owners."
                  : "Espacio común equipado diseñado para el confort, esparcimiento y seguridad de todos los propietarios de Loom Luxury Residence."}
              </p>

              {/* Chips de Equipamiento de la Zona Común */}
              {lotDetails.isAmenity && lotDetails.amenityGallery && (
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {(isEn ? lotDetails.amenityGallery.highlightsEn : lotDetails.amenityGallery.highlightsEs).map((feat) => (
                    <div
                      key={feat}
                      className="flex items-center gap-1.5 bg-[#EDE7E0]/75 border border-[#B35F27]/20 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-[#0A0D0B]"
                    >
                      <CheckCircle className="h-3 w-3 text-[#B35F27] shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Alerta de Atribución */}
          {assignedAdvisor ? (
            <div className="bg-[#B35F27]/15 border border-[#B35F27]/35 rounded-xl p-2.5 text-[10px] text-[#0A0D0B] leading-relaxed uppercase tracking-wider text-center font-semibold flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse shrink-0" />
              <span>
                {isEn ? "Your Advisor:" : "Tu Asesor:"} <strong>{assignedAdvisor.name}</strong> &bull; {assignedAdvisor.agency}
              </span>
            </div>
          ) : referrer ? (
            <div className="bg-[#B35F27]/10 border border-[#B35F27]/30 rounded-xl p-2.5 text-[9px] sm:text-[10px] text-[#0A0D0B]/80 leading-relaxed uppercase tracking-wider text-center font-medium">
              {isEn ? "Official advisory by " : "Asesoría comercializada por "}
              <strong className="text-[#0A0D0B] font-bold">{referrer === "patrimofy" ? "Patrimofy" : "Chichaus"}</strong>
            </div>
          ) : null}
        </div>

        {/* Botones de Acción Fijos Inferiores */}
        <div className="p-4 sm:p-5 border-t border-[#0A0D0B]/10 bg-[#EDE7E0] space-y-2">
          {lotDetails.isAmenity ? (
            amenityItems.length > 0 ? (
              <button
                onClick={() => setIsPlanLightboxOpen(true)}
                className="w-full py-3.5 bg-[#B35F27] hover:bg-[#964d1d] text-white font-bold rounded-xl uppercase tracking-[0.14em] text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#B35F27]/25 cursor-pointer hover:scale-[1.01]"
              >
                <Maximize2 className="h-4 w-4" />
                <span>
                  {isEn
                    ? `Fullscreen Gallery (${amenityItems.length} Renders)`
                    : `Ver Galería en Pantalla Completa (${amenityItems.length} Renders)`}
                </span>
              </button>
            ) : (
              <div className="w-full py-3 text-center text-[#B35F27] font-bold uppercase tracking-widest text-[10px] border border-[#B35F27]/30 rounded-xl bg-[#B35F27]/10 shadow-sm">
                {isEn ? "Official Park Renders • Coming Soon" : "Renders de Parques • Próximamente"}
              </div>
            )
          ) : lot.status === "sold" ? (
            <div className="w-full py-3 text-center text-red-600 font-bold uppercase tracking-widest text-[10px] border border-red-500/30 rounded-xl bg-red-500/10 shadow-sm">
              {isEn ? "Lot Sold • Not Available" : "Lote Vendido • No disponible"}
            </div>
          ) : lot.status === "blocked" ? (
            <div className="w-full py-3 text-center text-blue-700 font-bold uppercase tracking-widest text-[10px] border border-blue-500/30 rounded-xl bg-blue-500/10 shadow-sm">
              {isEn ? "Lot Blocked • Administrative Hold" : "Lote Bloqueado • Reserva Administrativa"}
            </div>
          ) : (
            <>
              <button
                onClick={() => onEnterShowroom(lot)}
                className="w-full py-3.5 bg-[#B35F27] hover:bg-[#964d1d] text-white font-bold rounded-xl uppercase tracking-[0.15em] text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#B35F27]/25 cursor-pointer hover:scale-[1.01]"
              >
                <Layout className="h-4 w-4" />
                <span>{isEn ? "Enter 3D Showroom" : "Ingresar al Showroom"}</span>
              </button>
              <button
                onClick={handleSeparateClick}
                className="w-full py-3 bg-white hover:bg-white/80 border border-[#0A0D0B]/15 text-[#0A0D0B] font-bold rounded-xl uppercase tracking-[0.15em] text-xs transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {assignedAdvisor ? <MessageCircle className="h-4 w-4 text-[#25D366]" /> : <Phone className="h-4 w-4 text-[#B35F27]" />}
                <span>
                  {assignedAdvisor
                    ? isEn
                      ? `Reserve via WhatsApp (${assignedAdvisor.name.split(" ")[0]})`
                      : `Separar por WhatsApp (${assignedAdvisor.name.split(" ")[0]})`
                    : isEn
                    ? "Reserve Lot"
                    : "Separar Lote"}
                </span>
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* 🔍 LIGHTBOX MODAL: PLANO DE LOTE O GALERÍA DE ZONA COMÚN HD   */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isPlanLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0A0D0B]/95 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6"
            onClick={() => setIsPlanLightboxOpen(false)}
          >
            {/* Header del Lightbox */}
            <div 
              className="flex justify-between items-center w-full max-w-6xl mx-auto z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#B35F27]/20 border border-[#B35F27]/40 text-[#EBD9AB]">
                  {lotDetails.isAmenity ? <ImageIcon className="h-5 w-5" /> : <Ruler className="h-5 w-5" />}
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-[0.25em] text-[#EBD9AB] font-mono font-bold block">
                    {lotDetails.isAmenity
                      ? isEn
                        ? `LOOM LUXURY RESIDENCE • ${lotDetails.amenityGallery?.badgeEn || "COMMON AREA GALLERY"}`
                        : `LOOM LUXURY RESIDENCE • ${lotDetails.amenityGallery?.badgeEs || "GALERÍA DE ZONA COMÚN"}`
                      : isEn
                      ? "LOOM LUXURY RESIDENCE • OFFICIAL TECHNICAL BLUEPRINT"
                      : "LOOM LUXURY RESIDENCE • PLANO TÉCNICO OFICIAL"}
                  </span>
                  <h3 className="text-base sm:text-xl font-serif font-bold text-white tracking-wide">
                    {lotDetails.isAmenity && activeAmenityItem ? (
                      <>
                        <span className="text-[#B35F27] mr-2">{activeAmenityItem.num}</span>
                        {isEn ? activeAmenityItem.titleEn : activeAmenityItem.titleEs}
                      </>
                    ) : (
                      <>
                        {isEn ? "Lot" : "Lote"} <span className="text-[#B35F27]">{lot.rawId || lot.id}</span> &bull; {translateAreaText(lot.area, isEn)}
                      </>
                    )}
                  </h3>
                </div>
              </div>

              {/* Botones de Control de Zoom & Cerrar */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/15">
                  <button
                    onClick={() => setLightboxZoom(prev => Math.max(0.75, prev - 0.25))}
                    className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
                    title={isEn ? "Zoom out" : "Reducir zoom"}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-[#EBD9AB] px-2">
                    {Math.round(lightboxZoom * 100)}%
                  </span>
                  <button
                    onClick={() => setLightboxZoom(prev => Math.min(3, prev + 0.25))}
                    className="p-1.5 hover:bg-white/20 rounded-lg text-white transition-colors cursor-pointer"
                    title={isEn ? "Zoom in" : "Aumentar zoom"}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setLightboxZoom(1)}
                    className="p-1.5 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer"
                    title={isEn ? "Reset zoom" : "Restablecer zoom"}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => setIsPlanLightboxOpen(false)}
                  className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-[#B35F27] border border-white/20 text-white transition-all cursor-pointer"
                  title={isEn ? "Close (Esc)" : "Cerrar (Esc)"}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Contenedor Central de la Imagen con Zoom y Navegación */}
            <div 
              className="relative flex-1 flex items-center justify-center overflow-hidden my-3 w-full max-w-6xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {lotDetails.isAmenity && amenityItems.length > 1 && (
                <button
                  onClick={handlePrevAmenitySlide}
                  className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-black/65 hover:bg-[#B35F27] text-white border border-white/20 transition-all cursor-pointer shadow-2xl"
                  title={isEn ? "Previous (Left Arrow)" : "Anterior (Flecha Izquierda)"}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              <motion.div
                animate={{ scale: lightboxZoom }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className={`max-w-5xl max-h-[72vh] rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex items-center justify-center ${
                  lotDetails.isAmenity ? "bg-black/60 p-1" : "bg-white p-2"
                }`}
              >
                <img
                  src={lotDetails.isAmenity && activeAmenityItem ? activeAmenityItem.src : lotDetails.imageSrc}
                  alt={lotDetails.isAmenity && activeAmenityItem ? (isEn ? activeAmenityItem.titleEn : activeAmenityItem.titleEs) : `Plano Lote ${lot.rawId}`}
                  className="max-w-full max-h-[70vh] object-contain select-none rounded-xl"
                />
              </motion.div>

              {lotDetails.isAmenity && amenityItems.length > 1 && (
                <button
                  onClick={handleNextAmenitySlide}
                  className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-black/65 hover:bg-[#B35F27] text-white border border-white/20 transition-all cursor-pointer shadow-2xl"
                  title={isEn ? "Next (Right Arrow)" : "Siguiente (Flecha Derecha)"}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>

            {/* Footer Informativo & Tira de Miniaturas del Lightbox */}
            <div 
              className="w-full max-w-5xl mx-auto flex flex-col gap-3 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {lotDetails.isAmenity && activeAmenityItem ? (
                <>
                  <p className="text-center text-white/85 text-xs sm:text-sm max-w-3xl mx-auto leading-relaxed">
                    {isEn ? activeAmenityItem.descEn : activeAmenityItem.descEs}
                  </p>
                  {amenityItems.length > 1 && (
                    <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 no-scrollbar">
                      {amenityItems.map((item, idx) => {
                        const isCurrent = idx === amenitySlideIdx;
                        return (
                          <button
                            key={item.src}
                            onClick={() => {
                              setAmenitySlideIdx(idx);
                              setLightboxZoom(1);
                            }}
                            className={`relative h-12 sm:h-14 w-20 sm:w-24 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                              isCurrent
                                ? "border-[#B35F27] scale-105 shadow-lg"
                                : "border-white/15 opacity-55 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={item.src}
                              alt={isEn ? item.titleEn : item.titleEs}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-white/70 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#B35F27]/20 border border-[#B35F27]/40 text-[#EBD9AB] font-bold text-[10px] uppercase">
                      {isEn ? "Type:" : "Tipología:"} {translateLocationType(lot.location || "Medianero", isEn)}
                    </span>
                    <span className="text-[11px] text-white/80">
                      {isEn
                        ? "Boundary, depth, and frontage dimensions expressed in linear meters (m)."
                        : "Medidas de linderos, fondos y frentes expresadas en metros lineales (m)."}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/50">
                    {isEn ? "Press Esc to close" : "Presiona Esc para cerrar"}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Selección de Inmobiliaria */}
      <LoomReferralModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        lotRawId={lot.rawId}
      />
    </>
  );
}
