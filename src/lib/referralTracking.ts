import { Advisor, findAdvisorBySlug, ADVISORS_REGISTRY } from "@/config/advisors";
export type { Advisor };
export { findAdvisorBySlug, ADVISORS_REGISTRY };

const COOKIE_NAME = "patrimofy_advisor_ref";
const COOKIE_DAYS = 180; // 180 días (6 meses de persistencia)
const STORAGE_KEY = "patrimofy_advisor_ref";

/**
 * Guarda una cookie con duración en días y soporte multi-subdominio
 */
export function setClientCookie(name: string, value: string, days = COOKIE_DAYS) {
  if (typeof document === "undefined") return;
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
}

/**
 * Obtiene el valor de una cookie por nombre
 */
export function getClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Inicializa y captura el referido desde la URL actual o almacenamiento previo.
 * Busca parámetros: ?asesor=, ?advisor=, ?agente=, ?ref=
 * Retorna el Asesor activo detectado.
 */
export function initReferralTracking(): Advisor | null {
  if (typeof window === "undefined") return null;

  try {
    const params = new URLSearchParams(window.location.search);
    const urlAdvisorSlug =
      params.get("asesor") ||
      params.get("advisor") ||
      params.get("agente") ||
      params.get("ref");

    if (urlAdvisorSlug) {
      const found = findAdvisorBySlug(urlAdvisorSlug);
      const slugToStore = found ? found.slug : urlAdvisorSlug.toLowerCase().trim();

      // Guardar en Cookie de 90 días + LocalStorage + SessionStorage
      setClientCookie(COOKIE_NAME, slugToStore, COOKIE_DAYS);
      try {
        localStorage.setItem(STORAGE_KEY, slugToStore);
        sessionStorage.setItem(STORAGE_KEY, slugToStore);
      } catch {}

      return found;
    }

    // Si no viene en URL, buscar en SessionStorage -> LocalStorage -> Cookie
    const storedSlug =
      sessionStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(STORAGE_KEY) ||
      getClientCookie(COOKIE_NAME);

    if (storedSlug) {
      return findAdvisorBySlug(storedSlug);
    }

    // Si está en el dominio patrimofy.com, asignar patrimofy por defecto
    if (window.location.hostname.includes("patrimofy.com")) {
      return ADVISORS_REGISTRY["patrimofy"] || null;
    }
  } catch (e) {
    console.error("Error in initReferralTracking:", e);
  }

  return null;
}

/**
 * Retorna el asesor activo almacenado (o busca en cookies/storage)
 */
export function getActiveAdvisor(): Advisor | null {
  if (typeof window === "undefined") return null;

  // 1. Revisar URL primero
  const params = new URLSearchParams(window.location.search);
  const urlAdvisorSlug =
    params.get("asesor") ||
    params.get("advisor") ||
    params.get("agente") ||
    params.get("ref");

  if (urlAdvisorSlug) {
    const found = findAdvisorBySlug(urlAdvisorSlug);
    if (found) return found;
  }

  // 2. Revisar almacenamiento persistente
  const storedSlug =
    sessionStorage.getItem(STORAGE_KEY) ||
    localStorage.getItem(STORAGE_KEY) ||
    getClientCookie(COOKIE_NAME);

  if (storedSlug) {
    const found = findAdvisorBySlug(storedSlug);
    if (found) return found;
  }

  if (window.location.hostname.includes("patrimofy.com")) {
    return ADVISORS_REGISTRY["patrimofy"] || null;
  }

  return null;
}

export interface LotWhatsAppContext {
  id: string;
  rawId?: string;
  price?: string | number;
  area?: string | number;
  status?: string;
}

/**
 * Genera el enlace de WhatsApp con el mensaje pre-armado del lote y del asesor
 */
export function buildLotWhatsAppUrl(
  lot: LotWhatsAppContext,
  projectName: "LOOM Luxury Residence" | "Luwana Beach Residence",
  advisor?: Advisor | null
): string {
  const targetAdvisor = advisor || getActiveAdvisor() || ADVISORS_REGISTRY["patrimofy"];
  const phoneNumber = targetAdvisor?.whatsapp?.replace(/\D/g, "") || "573332393784";
  const advisorName = targetAdvisor?.name ? `Hola ${targetAdvisor.name.split(" ")[0]}!` : "Hola!";

  const lotDisplay = lot.rawId || `Lote ${lot.id}`;
  const priceDisplay = lot.price ? ` (${typeof lot.price === "number" ? `$${lot.price.toLocaleString("es-CO")} COP` : lot.price})` : "";
  const areaDisplay = lot.area ? ` con área de ${lot.area} m²` : "";
  const refTag = targetAdvisor ? `[Ref: ${projectName.includes("LOOM") ? "Loom" : "Luwana"} - Asesor ${targetAdvisor.name}]` : `[Ref: ${projectName}]`;

  const message = `${advisorName} 👋 Estuve explorando el plano interactivo 3D de *${projectName}* y tengo mucho interés en separar el *${lotDisplay}*${areaDisplay}${priceDisplay}. ¿Me puedes asesorar con la disponibilidad y el plan de pagos?\n\n${refTag}`;

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
  const advisorName = targetAdvisor?.name ? `Hola ${targetAdvisor.name.split(" ")[0]}!` : "Hola!";
  const refTag = targetAdvisor ? `[Ref: Plano 3D - Asesor ${targetAdvisor.name}]` : `[Ref: Plano 3D ${projectName}]`;

  const message = `${advisorName} 👋 Estuve explorando el plano interactivo 3D de *${projectName}* y me gustaría recibir asesoría personalizada sobre los lotes disponibles y formas de financiación.\n\n${refTag}`;

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}
