export interface Advisor {
  slug: string;        // Identificador principal en la URL (?asesor=slug o ?ref=slug)
  name: string;        // Nombre comercial del asesor
  agency: string;      // Inmobiliaria (Patrimofy, Chichaus, etc.)
  whatsapp: string;    // Número con código internacional sin símbolos (ej. 573332394160)
  aliases?: string[];  // Formas cortas o alternativas del link (ej. ["ana", "anabernate"])
  role?: string;       // Cargo o especialidad (opcional)
  active: boolean;     // Estado activo
}

/**
 * Directorio Oficial de Asesores e Inmobiliarias (Patrimofy Real Estate & Chichaus)
 */
export const ADVISORS_REGISTRY: Record<string, Advisor> = {
  // ==========================================
  // CANALES INSTITUCIONALES GENERALES
  // ==========================================
  patrimofy: {
    slug: "patrimofy",
    name: "Patrimofy Real Estate",
    agency: "Patrimofy",
    whatsapp: "573332393784",
    aliases: ["oficina", "general", "patrimofy-real-estate"],
    role: "Línea Comercial Directa",
    active: true,
  },
  chichaus: {
    slug: "chichaus",
    name: "Chichaus Inmobiliaria",
    agency: "Chichaus",
    whatsapp: "573013474836",
    aliases: ["chichaus-inmobiliaria", "oficina-chichaus"],
    role: "Firma Comercializadora Aliada",
    active: true,
  },

  // ==========================================
  // EQUIPO COMERCIAL PATRIMOFY REAL ESTATE
  // ==========================================
  "ana-bernate": {
    slug: "ana-bernate",
    name: "Ana Bernate",
    agency: "Patrimofy",
    whatsapp: "573332394160",
    aliases: ["ana", "anabernate"],
    role: "Asesora Comercial",
    active: true,
  },
  "stefanny-angel": {
    slug: "stefanny-angel",
    name: "Stefanny Ángel",
    agency: "Patrimofy",
    whatsapp: "573332394142",
    aliases: ["stefanny", "stefannyangel", "steffany", "steffany-angel"],
    role: "Asesora Comercial",
    active: true,
  },
  "david-mejia": {
    slug: "david-mejia",
    name: "David Mejía",
    agency: "Patrimofy",
    whatsapp: "573226390426",
    aliases: ["david", "davidmejia"],
    role: "Asesor Comercial",
    active: true,
  },
  "valentina-montes": {
    slug: "valentina-montes",
    name: "Valentina Montes",
    agency: "Patrimofy",
    whatsapp: "573332394129",
    aliases: ["valentinamontes", "valentinam", "valentina-m"],
    role: "Asesora Comercial",
    active: true,
  },
  "valentina-gomez": {
    slug: "valentina-gomez",
    name: "Valentina Gómez",
    agency: "Patrimofy",
    whatsapp: "573126969624",
    aliases: ["valentinagomez", "valentinag", "valentina-g"],
    role: "Asesora Comercial",
    active: true,
  },
  "jessica-diaz": {
    slug: "jessica-diaz",
    name: "Jessica Díaz",
    agency: "Patrimofy",
    whatsapp: "573044587850",
    aliases: ["jessica", "jessicadiaz"],
    role: "Asesora Comercial",
    active: true,
  },
  "milagro-cantillo": {
    slug: "milagro-cantillo",
    name: "Milagro Cantillo",
    agency: "Patrimofy",
    whatsapp: "573332394126",
    aliases: ["milagro", "milagrocantillo"],
    role: "Asesora Comercial",
    active: true,
  },
  "luisa-cortina": {
    slug: "luisa-cortina",
    name: "Luisa Cortina",
    agency: "Patrimofy",
    whatsapp: "573332394150",
    aliases: ["luisa", "luisacortina"],
    role: "Asesora Comercial",
    active: true,
  },
  "yeniferth-zapata": {
    slug: "yeniferth-zapata",
    name: "Yeniferth Zapata",
    agency: "Patrimofy",
    whatsapp: "573207344910",
    aliases: ["yeniferth", "yeniferthzapata", "yenifer", "yenifer-zapata"],
    role: "Asesora Comercial",
    active: true,
  },

  // ==========================================
  // EQUIPO COMERCIAL CHICHAUS
  // ==========================================
  "karen-jimenez": {
    slug: "karen-jimenez",
    name: "Karen Jimenez",
    agency: "Chichaus",
    whatsapp: "573151522453",
    aliases: ["karen", "karenjimenez", "karen-chichaus"],
    role: "Asesora Comercial",
    active: true,
  },
  "jessica-chacon": {
    slug: "jessica-chacon",
    name: "Jessica Chacon",
    agency: "Chichaus",
    whatsapp: "573013475714",
    aliases: ["jessicachacon", "jessica-c", "jessicac"],
    role: "Asesora Comercial",
    active: true,
  },
  "unildo-suarez": {
    slug: "unildo-suarez",
    name: "Unildo Suarez",
    agency: "Chichaus",
    whatsapp: "573013477587",
    aliases: ["unildo", "unildosuarez"],
    role: "Asesor Comercial",
    active: true,
  },
  "juan-guardo": {
    slug: "juan-guardo",
    name: "Juan Guardo",
    agency: "Chichaus",
    whatsapp: "573151708278",
    aliases: ["juan", "juanguardo", "juan-g"],
    role: "Asesor Comercial",
    active: true,
  },
  "maria-gonzalez": {
    slug: "maria-gonzalez",
    name: "Maria Gonzalez",
    agency: "Chichaus",
    whatsapp: "573013476907",
    aliases: ["mariagonzalez", "maria-gonzalez-chichaus"],
    role: "Asesora Comercial",
    active: true,
  },
  "marlyn-norena": {
    slug: "marlyn-norena",
    name: "Marlyn Noreña",
    agency: "Chichaus",
    whatsapp: "573013477197",
    aliases: ["marlyn", "marlynnorena", "marlyn-norena", "marilyn", "marilynnorena", "marilyn-norena"],
    role: "Asesora Comercial",
    active: true,
  },
  "carolina-gaviria": {
    slug: "carolina-gaviria",
    name: "Carolina Gaviria",
    agency: "Chichaus",
    whatsapp: "573013474836",
    aliases: ["carolina", "carolinagaviria"],
    role: "Asesora Comercial",
    active: true,
  },
  "mailyn-wilchez": {
    slug: "mailyn-wilchez",
    name: "Mailyn Wilchez",
    agency: "Chichaus",
    whatsapp: "573013474626",
    aliases: ["mailyn", "mailynwilchez"],
    role: "Asesora Comercial",
    active: true,
  },
  "diana-sanchez": {
    slug: "diana-sanchez",
    name: "Diana Sanchez",
    agency: "Chichaus",
    whatsapp: "573013482859",
    aliases: ["diana", "dianasanchez"],
    role: "Asesora Comercial",
    active: true,
  },
  "elsie-romero": {
    slug: "elsie-romero",
    name: "Elsie Romero",
    agency: "Chichaus",
    whatsapp: "573013482159",
    aliases: ["elsie", "elsieromero"],
    role: "Asesora Comercial",
    active: true,
  },
  "cindy-lara": {
    slug: "cindy-lara",
    name: "Cindy Lara",
    agency: "Chichaus",
    whatsapp: "573159027040",
    aliases: ["cindy", "cindylara"],
    role: "Asesora Comercial",
    active: true,
  },
  "graciela-bossa": {
    slug: "graciela-bossa",
    name: "Graciela Bossa",
    agency: "Chichaus",
    whatsapp: "573173580453",
    aliases: ["graciela", "gracielabossa"],
    role: "Asesora Comercial",
    active: true,
  },
  "marilayne-lopez": {
    slug: "marilayne-lopez",
    name: "Marilayne Lopez",
    agency: "Chichaus",
    whatsapp: "573180392853",
    aliases: ["marilayne", "marilaynelopez"],
    role: "Asesora Comercial",
    active: true,
  },
  "maria-guerra": {
    slug: "maria-guerra",
    name: "Maria Guerra",
    agency: "Chichaus",
    whatsapp: "573151630101",
    aliases: ["mariaguerra", "maria-guerra-chichaus"],
    role: "Asesora Comercial",
    active: true,
  },
  "alvaro-mendoza": {
    slug: "alvaro-mendoza",
    name: "Alvaro Mendoza",
    agency: "Chichaus",
    whatsapp: "573159353109",
    aliases: ["alvaro", "alvaromendoza"],
    role: "Asesor Comercial",
    active: true,
  },
  "camila-gonzalez": {
    slug: "camila-gonzalez",
    name: "Camila Gonzalez",
    agency: "Chichaus",
    whatsapp: "573171832341", // 3171832341
    aliases: ["camila", "camilagonzalez"],
    role: "Asesora Comercial",
    active: true,
  },
  "vannesa-ferrer": {
    slug: "vannesa-ferrer",
    name: "Vannesa Ferrer",
    agency: "Chichaus",
    whatsapp: "573151345685",
    aliases: ["vannesa", "vannesaferrer", "vanessa", "vanessaferrer"],
    role: "Asesora Comercial",
    active: true,
  },
  "nataly-romero": {
    slug: "nataly-romero",
    name: "Nataly Romero",
    agency: "Chichaus",
    whatsapp: "573150965269",
    aliases: ["nataly", "natalyromero", "nataliaromero"],
    role: "Asesora Comercial",
    active: true,
  },
  "oscar-gonzalez": {
    slug: "oscar-gonzalez",
    name: "Oscar Gonzalez",
    agency: "Chichaus",
    whatsapp: "573171814824",
    aliases: ["oscar", "oscargonzalez"],
    role: "Asesor Comercial",
    active: true,
  },
  "sandra-almanza": {
    slug: "sandra-almanza",
    name: "Sandra Almanza",
    agency: "Chichaus",
    whatsapp: "573008898761",
    aliases: ["sandra", "sandraalmanza"],
    role: "Asesora Comercial",
    active: true,
  },
  "edwin-sierra": {
    slug: "edwin-sierra",
    name: "Edwin Sierra Rojas",
    agency: "Chichaus",
    whatsapp: "573159868732", // 3159868732
    aliases: ["edwin", "edwinsierra", "edwin-sierra-rojas", "edwinsierrarojas"],
    role: "Asesor Comercial",
    active: true,
  },
};

/**
 * Busca un asesor por slug o alias normalizado (ignora mayúsculas, tildes y espacios)
 */
export function findAdvisorBySlug(slugOrName: string | null | undefined): Advisor | null {
  if (!slugOrName) return null;

  const normalized = slugOrName
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

  // 1. Coincidencia directa por llave en el registro
  if (ADVISORS_REGISTRY[normalized] && ADVISORS_REGISTRY[normalized].active) {
    return ADVISORS_REGISTRY[normalized];
  }

  // 2. Coincidencia por slug, alias o nombre
  const found = Object.values(ADVISORS_REGISTRY).find((adv) => {
    if (!adv.active) return false;

    // Coincidencia exacta de slug
    if (adv.slug === normalized) return true;

    // Coincidencia con alias
    if (adv.aliases && adv.aliases.some((alias) => alias.toLowerCase() === normalized)) {
      return true;
    }

    // Coincidencia por nombre normalizado
    const advNameNorm = adv.name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-");

    return advNameNorm === normalized || advNameNorm.includes(normalized);
  });

  return found || null;
}
