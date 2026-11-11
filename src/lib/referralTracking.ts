import {
  Advisor,
  findAdvisorBySlug,
  ADVISORS_REGISTRY,
  isInstitutionalAdvisor,
  getAdvisorDisplayLabel,
  getAdvisorRolePrefix,
  getAdvisorPanelPrefix,
} from "@/config/advisors";

export type { Advisor };
export {
  findAdvisorBySlug,
  ADVISORS_REGISTRY,
  isInstitutionalAdvisor,
  getAdvisorDisplayLabel,
  getAdvisorRolePrefix,
  getAdvisorPanelPrefix,
};

const COOKIE_NAME = "patrimofy_advisor_ref";
const COOKIE_DAYS = 180; // 180 días (6 meses de persistencia)
const STORAGE_KEY = "patrimofy_advisor_ref";

function isInstitutionalChannel(slug: string): boolean {
  return slug === "patrimofy" || slug === "patrimofy-rv" || slug === "chichaus";
}

function readStoredAdvisor(): Advisor | null {
  if (typeof window === "undefined") return null;
  try {
    const storedSlug =
      sessionStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(STORAGE_KEY) ||
      getClientCookie(COOKIE_NAME);
    if (storedSlug) {
      return findAdvisorBySlug(storedSlug);
    }
  } catch {}
  return null;
}

function persistAdvisorSlug(slug: string) {
  setClientCookie(COOKIE_NAME, slug, COOKIE_DAYS);
  try {
    localStorage.setItem(STORAGE_KEY, slug);
    sessionStorage.setItem(STORAGE_KEY, slug);
  } catch {}
}

/**
 * Guarda una cookie con duración en días y soporte multi-subdominio
 * (blindada con try/catch para iframes cross-origin en Safari ITP / Brave).
 */
export function setClientCookie(name: string, value: string, days = COOKIE_DAYS) {
  if (typeof document === "undefined") return;
  try {
    const maxAge = days * 24 * 60 * 60;

    let domainAttr = "";
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname.includes("patrimofy.com")) {
        domainAttr = "; domain=.patrimofy.com";
      } else if (hostname.includes("masterplanalmabeach.com")) {
        domainAttr = "; domain=.masterplanalmabeach.com";
      }
    }

    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/${domainAttr}; SameSite=Lax`;
  } catch {}
}

/**
 * Obtiene el valor de una cookie por nombre
 */
export function getClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  } catch {
    return null;
  }
}

/**
 * Inicializa y captura el referido desde la URL actual o almacenamiento previo.
 * - Parámetros explícitos prioritarios: ?asesor=, ?advisor=, ?agente=, ?inmobiliaria=, ?canal=
 * - Parámetro secundario de canal/referido: ?ref=
 *   (Nunca sobreescribe un asesor humano previo con etiquetas de pauta como ?ref=instagram ni con ?ref=patrimofy).
 */
export function initReferralTracking(): Advisor | null {
  if (typeof window === "undefined") return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const explicitAdvisorParam =
      params.get("asesor") ||
      params.get("advisor") ||
      params.get("agente") ||
      params.get("inmobiliaria") ||
      params.get("canal");
    const refParam = params.get("ref");
    const existingStoredAdvisor = readStoredAdvisor();

    // 1. Parámetro explícito (?asesor=... o ?inmobiliaria=...) tiene máxima prioridad en enlaces e iframes dedicados
    if (explicitAdvisorParam) {
      const foundExplicit = findAdvisorBySlug(explicitAdvisorParam);
      if (foundExplicit) {
        persistAdvisorSlug(foundExplicit.slug);
        return foundExplicit;
      }
    }

    // 2. Parámetro ?ref=... solo persiste si coincide con un asesor/canal registrado
    //    y NO pisa a un asesor humano previo cuando ?ref= es un canal institucional genérico
    if (refParam) {
      const foundRef = findAdvisorBySlug(refParam);
      if (foundRef) {
        const hasPriorHumanAdvisor =
          existingStoredAdvisor !== null && !isInstitutionalChannel(existingStoredAdvisor.slug);

        if (!isInstitutionalChannel(foundRef.slug) || !hasPriorHumanAdvisor) {
          persistAdvisorSlug(foundRef.slug);
          return foundRef;
        }
        return existingStoredAdvisor;
      }
      // Si ?ref= es un tag de campaña (ej. instagram, meta, email), conservar intacto el asesor previo
    }

    // 3. Si no vino un nuevo asesor válido en URL, respetar almacenamiento persistente
    if (existingStoredAdvisor) {
      return existingStoredAdvisor;
    }

    // 4. Si está en el dominio patrimofy.com, asignar patrimofy por defecto
    if (window.location.hostname.includes("patrimofy.com")) {
      return ADVISORS_REGISTRY["patrimofy"] || null;
    }
  } catch (e) {
    console.error("Error in initReferralTracking:", e);
  }

  return null;
}

/**
 * Retorna el asesor o inmobiliaria activa (desde URL actual o cookies/storage)
 */
export function getActiveAdvisor(): Advisor | null {
  if (typeof window === "undefined") return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const explicitAdvisorParam =
      params.get("asesor") ||
      params.get("advisor") ||
      params.get("agente") ||
      params.get("inmobiliaria") ||
      params.get("canal");
    const refParam = params.get("ref");
    const existingStoredAdvisor = readStoredAdvisor();

    if (explicitAdvisorParam) {
      const found = findAdvisorBySlug(explicitAdvisorParam);
      if (found) return found;
    }

    if (refParam) {
      const foundRef = findAdvisorBySlug(refParam);
      if (foundRef) {
        const hasPriorHumanAdvisor =
          existingStoredAdvisor !== null && !isInstitutionalChannel(existingStoredAdvisor.slug);
        if (!isInstitutionalChannel(foundRef.slug) || !hasPriorHumanAdvisor) {
          return foundRef;
        }
      }
    }

    if (existingStoredAdvisor) {
      return existingStoredAdvisor;
    }

    if (window.location.hostname.includes("patrimofy.com")) {
      return ADVISORS_REGISTRY["patrimofy"] || null;
    }
  } catch {}

  return null;
}

/**
 * Determina si el clic en "Separar Lote" dentro de un <iframe> debe delegarse exclusivamente
 * al formulario de la página padre (comportamiento de patrimofy.com/es/loom con ?ref=patrimofy&embed=true)
 * o si debe abrir WhatsApp directamente en una pestaña nueva (iframes para Chic Haus, Patrimofy (RV) o ?wa=direct).
 */
export function shouldDelegateSeparateToParentFrame(advisor?: Advisor | null): boolean {
  if (typeof window === "undefined" || window.parent === window) return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("wa") === "direct" || params.has("inmobiliaria") || params.has("canal")) {
      return false;
    }
    const active = advisor || getActiveAdvisor();
    if (active && active.slug !== "patrimofy") {
      return false;
    }
  } catch {}
  return true;
}

export interface LotWhatsAppContext {
  id: string;
  rawId?: string;
  price?: string | number;
  area?: string | number;
  status?: string;
}

function buildAgencyGreetingAndTag(
  targetAdvisor: Advisor | undefined | null,
  projectName: "LOOM Luxury Residence" | "Luwana Beach Residence",
  isLotSpecific: boolean
): { greeting: string; refTag: string } {
  const shortProj = projectName.includes("LOOM") ? "LOOM" : "Luwana";

  if (!targetAdvisor || targetAdvisor.slug === "patrimofy") {
    return {
      greeting: "Hola equipo Patrimofy!",
      refTag: `[Ref: Plano 3D ${projectName}]`,
    };
  }

  if (targetAdvisor.slug === "patrimofy-rv") {
    return {
      greeting: "Hola equipo Patrimofy!",
      refTag: `[Ref: Plano 3D ${shortProj} - Inmobiliaria Patrimofy (RV)]`,
    };
  }

  if (targetAdvisor.slug === "chichaus") {
    return {
      greeting: "Hola equipo Chic Haus!",
      refTag: `[Ref: Plano 3D ${shortProj} - Inmobiliaria Chic Haus]`,
    };
  }

  const firstName = targetAdvisor.name.split(" ")[0] || targetAdvisor.name;
  return {
    greeting: `Hola ${firstName}!`,
    refTag: isLotSpecific
      ? `[Ref: ${shortProj} - Asesor ${targetAdvisor.name}]`
      : `[Ref: Plano 3D - Asesor ${targetAdvisor.name}]`,
  };
}

/**
 * Genera el enlace de WhatsApp con el mensaje pre-armado del lote y del asesor / inmobiliaria
 */
export function buildLotWhatsAppUrl(
  lot: LotWhatsAppContext,
  projectName: "LOOM Luxury Residence" | "Luwana Beach Residence",
  advisor?: Advisor | null
): string {
  const targetAdvisor = advisor || getActiveAdvisor() || ADVISORS_REGISTRY["patrimofy"];
  const phoneNumber = targetAdvisor?.whatsapp?.replace(/\D/g, "") || "573332393784";
  const { greeting, refTag } = buildAgencyGreetingAndTag(targetAdvisor, projectName, true);

  const lotDisplay =
    lot.rawId && lot.rawId.toLowerCase().startsWith("lote")
      ? lot.rawId
      : `Lote ${lot.rawId || lot.id}`;
  const priceDisplay = lot.price
    ? ` (${typeof lot.price === "number" ? `$${lot.price.toLocaleString("es-CO")} COP` : lot.price})`
    : "";
  const cleanArea = lot.area ? String(lot.area).replace(/\s*m²|\s*m2/gi, "").trim() : "";
  const areaDisplay = cleanArea && cleanArea !== "TBD" ? ` con área de ${cleanArea} m²` : "";

  const message = `${greeting} 👋 Estuve explorando el plano interactivo 3D de *${projectName}* y tengo mucho interés en separar el *${lotDisplay}*${areaDisplay}${priceDisplay}. ¿Me pueden asesorar con la disponibilidad y el plan de pagos?\n\n${refTag}`;

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Genera un enlace de WhatsApp para consulta general del proyecto
 */
export function buildGeneralProjectWhatsAppUrl(
  projectName: "LOOM Luxury Residence" | "Luwana Beach Residence",
  advisor?: Advisor | null
): string {
  const targetAdvisor = advisor || getActiveAdvisor() || ADVISORS_REGISTRY["patrimofy"];
  const phoneNumber = targetAdvisor?.whatsapp?.replace(/\D/g, "") || "573332393784";
  const { greeting, refTag } = buildAgencyGreetingAndTag(targetAdvisor, projectName, false);

  const message = `${greeting} 👋 Estuve explorando el plano interactivo 3D de *${projectName}* y me gustaría recibir asesoría personalizada sobre los lotes disponibles y planes de financiación.\n\n${refTag}`;

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
