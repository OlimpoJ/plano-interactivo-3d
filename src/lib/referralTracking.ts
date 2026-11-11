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
  return Boolean(
    ADVISORS_REGISTRY[slug]?.isAgencyChannel ||
      slug === "patrimofy" ||
      slug === "patrimofy-rv" ||
      slug === "chichaus" ||
      slug === "chichaus-ja"
  );
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

  if (targetAdvisor.slug === "chichaus-ja") {
    return {
      greeting: "Hola equipo Chic Haus!",
      refTag: `[Ref: Plano 3D ${shortProj} - Inmobiliaria Chic Haus (J&A)]`,
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

export interface LoomFinancingContext {
  totalPriceNum?: number;
  monthlyAmount?: number;
  months?: number;
  downPaymentPct?: number;
}

function parseCopNumber(val?: string | number | null): number {
  if (typeof val === "number") return Number.isFinite(val) ? Math.round(val) : 0;
  if (!val) return 0;
  const digits = String(val).replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function inferLoomStageNumber(lotCode: string): number {
  const clean = (lotCode || "").trim().toUpperCase().replace(/^LOTE\s+/i, "");
  const letter = clean.charAt(0);
  if (letter === "A" || letter === "B" || letter === "C") return 1;
  if (letter === "D" || letter === "E") return 2;
  if (letter === "F" || letter === "G") return 3;
  if (letter === "H" || letter === "I") return 4;
  if (letter === "J" || letter === "K" || letter === "L") return 5;
  return 1;
}

const LOOM_ALMABEACH_SUBPAGE_ANCHORS: Record<string, string> = {
  "/lista-cero/": "formulario",
  "/lista-cero": "formulario",
  "/lista-cero-form/": "formulario",
  "/lista-cero-form": "formulario",
  "/separa-tu-lote/": "formulario",
  "/separa-tu-lote": "formulario",
  "/separa-tu-lote-form/": "formulario",
  "/separa-tu-lote-form": "formulario",
  "/lanzamiento/": "registro",
  "/lanzamiento": "registro",
};

/**
 * Resuelve la URL exacta de la landing oficial (con #ancla) para cualquiera de las 4 rutas
 * institucionales de LOOM: Patrimofy, Chic Haus (+ subpáginas RegiaVia), Patrimofy (RV) y Chic Haus (J&A).
 */
export function getLoomAgencyLandingUrl(
  channelOrSlug: Advisor | string,
  isEn = false
): string {
  const channel =
    typeof channelOrSlug === "string"
      ? findAdvisorBySlug(channelOrSlug) || ADVISORS_REGISTRY["patrimofy"]
      : channelOrSlug;

  const base =
    isEn && channel.landingUrlEn
      ? channel.landingUrlEn
      : channel.landingUrl || "https://loomluxuryresidence.com/#contacto";

  try {
    const target = new URL(base);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const rawSubpage = params.get("pagina") || params.get("subpagina");
      const rawAnchor = params.get("ancla") || params.get("anchor");

      // Soporte seguro de subpágina dentro del mismo dominio oficial (ej. /lista-cero-form/, /lanzamiento/)
      if (rawSubpage && /^\/[a-zA-Z0-9/_-]*$/.test(rawSubpage) && !rawSubpage.startsWith("//")) {
        target.pathname = rawSubpage;
        const knownSubAnchor = LOOM_ALMABEACH_SUBPAGE_ANCHORS[rawSubpage];
        if (knownSubAnchor && !rawAnchor) {
          target.hash = `#${knownSubAnchor}`;
        }
      }

      if (rawAnchor) {
        if (rawAnchor === "none") {
          target.hash = "";
        } else if (/^[a-zA-Z0-9_-]+$/.test(rawAnchor)) {
          target.hash = `#${rawAnchor}`;
        }
      }

      // Si el navegador reporta el referrer completo del mismo dominio, preservar subpágina y UTMs (?utm_source, fbclid, gclid)
      if (document.referrer) {
        try {
          const refUrl = new URL(document.referrer);
          if (refUrl.hostname === target.hostname) {
            if (!rawSubpage && refUrl.pathname && refUrl.pathname !== "/") {
              const autoAnchor = LOOM_ALMABEACH_SUBPAGE_ANCHORS[refUrl.pathname];
              if (autoAnchor) {
                target.pathname = refUrl.pathname;
                if (!rawAnchor) target.hash = `#${autoAnchor}`;
              }
            }
            if (refUrl.search && (refUrl.pathname === target.pathname || !rawSubpage)) {
              target.search = refUrl.search;
            }
          }
        } catch {}
      }
    }

    return target.toString();
  } catch {
    return base;
  }
}

/**
 * Ejecuta la acción de conversión unificada de LOOM ("Separar Lote", píldora de atribución o "Contacto"):
 * - Asesores individuales (?asesor=...): abren su WhatsApp personal directo con el lote prellenado.
 * - Las 4 rutas de inmobiliaria (patrimofy, chichaus, patrimofy-rv, chichaus-ja):
 *   • Dentro de <iframe>: emiten postMessage (LOT_SEPARATE_CLICKED + masterplan-separar) y bajan al formulario en la misma pestaña (window.top) sin duplicar pestañas.
 *   • En pestaña suelta (masterplanalmabeach.com): abren la landing en pestaña nueva (_blank) directo en su #ancla.
 */
export function openLoomConversionDestination(options: {
  advisor?: Advisor | null;
  fallbackRef?: string | null;
  lot?: LotWhatsAppContext | null;
  financing?: LoomFinancingContext | null;
  isEn?: boolean;
  onRequireModal?: () => void;
}): void {
  if (typeof window === "undefined") return;

  let active: Advisor | null = options.advisor || getActiveAdvisor();

  if (!active) {
    const storedRef =
      sessionStorage.getItem("loom_ref") ||
      (window.location.hostname.includes("patrimofy.com") ? "patrimofy" : options.fallbackRef || null);

    if (storedRef) {
      const matched = findAdvisorBySlug(storedRef);
      if (matched) {
        active = matched;
      } else if (window.location.hostname.includes("patrimofy.com")) {
        active = ADVISORS_REGISTRY["patrimofy"];
      }
    }
  }

  if (!active) {
    options.onRequireModal?.();
    return;
  }

  // 1. Asesor humano individual -> abre siempre su WhatsApp directo
  if (!isInstitutionalAdvisor(active)) {
    if (window.parent !== window && options.lot) {
      window.parent.postMessage(
        {
          type: "LOT_SEPARATE_CLICKED",
          payload: {
            lotId: options.lot.rawId || options.lot.id,
            price: options.lot.price,
            advisor: active.slug,
          },
        },
        "*"
      );
    }

    const waUrl = options.lot
      ? buildLotWhatsAppUrl(options.lot, "LOOM Luxury Residence", active)
      : buildGeneralProjectWhatsAppUrl("LOOM Luxury Residence", active);
    window.open(waUrl, "_blank", "noopener,noreferrer");
    return;
  }

  // 2. Ruta institucional (Patrimofy, Chic Haus, Patrimofy RV, Chic Haus J&A) -> al formulario de su landing
  const targetUrl = getLoomAgencyLandingUrl(active, Boolean(options.isEn));
  let targetAnchor = "";
  try {
    targetAnchor = new URL(targetUrl).hash.replace(/^#/, "");
  } catch {}

  const isInsideIframe = window.parent !== window;

  // Fuera de iframe -> abrir en pestaña nueva directo al #ancla
  if (!isInsideIframe) {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    return;
  }

  // Dentro de iframe -> emitir postMessage + navegación en la misma pestaña (window.top)
  let parentHandled = false;
  const onAck = (ev: MessageEvent) => {
    if (ev.data?.type === "LOOM_PARENT_HANDLED") {
      parentHandled = true;
    }
  };
  window.addEventListener("message", onAck);

  window.parent.postMessage(
    {
      type: "LOT_SEPARATE_CLICKED",
      payload: {
        lotId: options.lot ? options.lot.rawId || options.lot.id : null,
        price: options.lot?.price || null,
        area: options.lot?.area || null,
        advisor: active.slug,
        targetAnchor: targetAnchor || null,
      },
    },
    "*"
  );

  if (options.lot) {
    const rawCode = options.lot.rawId || options.lot.id;
    const totalVal = options.financing?.totalPriceNum || parseCopNumber(options.lot.price);
    const downPct = options.financing?.downPaymentPct ?? 20;
    const months = options.financing?.months ?? 48;
    const monthlyVal =
      options.financing?.monthlyAmount ||
      (totalVal > 0 ? Math.round(((totalVal * Math.max(0, 90 - downPct)) / 100) / months) : 0);

    window.parent.postMessage(
      {
        type: "masterplan-separar",
        lote: rawCode,
        etapa: inferLoomStageNumber(rawCode),
        valor: totalVal,
        cuotaMensual: monthlyVal,
        plazo: months,
        cuotaInicialPct: downPct,
      },
      "*"
    );
  }

  let refHost = "";
  try {
    if (document.referrer) {
      refHost = new URL(document.referrer).hostname.toLowerCase();
    }
  } catch {}

  const isPatrimofyMainParent =
    active.slug === "patrimofy" &&
    (refHost.includes("loomluxuryresidence.com") ||
      (refHost.includes("patrimofy.com") && !refHost.includes("lotes.patrimofy.com")) ||
      shouldDelegateSeparateToParentFrame(active));

  const isRegiaViaPatrimofyLotHandled =
    refHost.includes("lotes.patrimofy.com") && Boolean(options.lot);

  if (isPatrimofyMainParent || isRegiaViaPatrimofyLotHandled) {
    window.removeEventListener("message", onAck);
    return;
  }

  setTimeout(() => {
    window.removeEventListener("message", onAck);
    if (parentHandled) return;
    try {
      if (window.top) {
        window.top.location.href = targetUrl;
      } else {
        window.open(targetUrl, "_top");
      }
    } catch {
      window.open(targetUrl, "_top");
    }
  }, 90);
}
