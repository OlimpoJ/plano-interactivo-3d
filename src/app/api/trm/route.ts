import { NextResponse } from "next/server";

const FALLBACK_TRM = 4200;
const FRESH_TTL_MS = 30 * 60 * 1000; // 30 minutos fresco
const STALE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas SWR
const PROVIDER_TIMEOUT_MS = 2_500; // Máx 2.5s por proveedor (evita bloqueos de 17s+ en datos.gov.co)

interface TrmPayload {
  trm: number;
  source: string;
  updatedAt: string;
  fetchedAt: number;
}

let cachedTrm: TrmPayload | null = null;
let inFlightTrm: Promise<TrmPayload> | null = null;

async function fetchLiveTrm(): Promise<TrmPayload> {
  if (inFlightTrm) return inFlightTrm;

  inFlightTrm = (async () => {
    // 1. Fuente Primaria: Datos Abiertos de Colombia (Superintendencia Financiera de Colombia)
    try {
      const res = await fetch(
        "https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1&$order=vigenciadesde%20DESC",
        {
          signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
          next: { revalidate: 1800 },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].valor) {
          const parsed = parseFloat(String(data[0].valor));
          if (!isNaN(parsed) && parsed > 2500 && parsed < 10000) {
            const payload: TrmPayload = {
              trm: parsed,
              source: "Superfinanciera (Datos Abiertos Colombia)",
              updatedAt: data[0].vigenciadesde || new Date().toISOString(),
              fetchedAt: Date.now(),
            };
            cachedTrm = payload;
            return payload;
          }
        }
      }
    } catch (err) {
      console.warn("Primary TRM fetch (datos.gov.co) timed out or failed, trying secondary:", err);
    }

    // 2. Fuente Secundaria: DolarApi Colombia (TRM Oficial del Día)
    try {
      const res = await fetch("https://co.dolarapi.com/v1/trm", {
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        next: { revalidate: 1800 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.valor) {
          const parsed = parseFloat(String(data.valor));
          if (!isNaN(parsed) && parsed > 2500 && parsed < 10000) {
            const payload: TrmPayload = {
              trm: parsed,
              source: "DolarApi Colombia (TRM Oficial)",
              updatedAt: data.fechaActualizacion || new Date().toISOString(),
              fetchedAt: Date.now(),
            };
            cachedTrm = payload;
            return payload;
          }
        }
      }
    } catch (err) {
      console.warn("Secondary TRM fetch (co.dolarapi.com) timed out or failed, trying tertiary:", err);
    }

    // 3. Fuente Terciaria: Open Exchange Rates API (USD -> COP)
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD", {
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
        next: { revalidate: 1800 },
      });
      if (res.ok) {
        const data = await res.json();
        const copRate = data?.rates?.COP;
        if (copRate) {
          const parsed = parseFloat(String(copRate));
          if (!isNaN(parsed) && parsed > 2500 && parsed < 10000) {
            const payload: TrmPayload = {
              trm: parsed,
              source: "ExchangeRate-API",
              updatedAt: data.time_last_update_utc || new Date().toISOString(),
              fetchedAt: Date.now(),
            };
            cachedTrm = payload;
            return payload;
          }
        }
      }
    } catch (err) {
      console.warn("Tertiary TRM fetch (open.er-api.com) timed out or failed:", err);
    }

    // Si ya teníamos una TRM real previa en memoria, conservarla antes que caer a un valor fijo
    if (cachedTrm) {
      return { ...cachedTrm, fetchedAt: Date.now() };
    }

    return {
      trm: FALLBACK_TRM,
      source: "Fallback",
      updatedAt: new Date().toISOString(),
      fetchedAt: Date.now(),
    };
  })();

  try {
    return await inFlightTrm;
  } finally {
    inFlightTrm = null;
  }
}

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
};

export async function GET() {
  const now = Date.now();

  if (cachedTrm) {
    const age = now - cachedTrm.fetchedAt;
    if (age <= FRESH_TTL_MS) {
      return NextResponse.json(
        {
          success: true,
          trm: cachedTrm.trm,
          source: cachedTrm.source,
          updatedAt: cachedTrm.updatedAt,
          cached: "HIT",
        },
        { headers: CACHE_HEADERS }
      );
    }
    if (age <= STALE_TTL_MS) {
      void fetchLiveTrm().catch(() => {});
      return NextResponse.json(
        {
          success: true,
          trm: cachedTrm.trm,
          source: cachedTrm.source,
          updatedAt: cachedTrm.updatedAt,
          cached: "STALE",
        },
        { headers: CACHE_HEADERS }
      );
    }
  }

  const result = await fetchLiveTrm();
  return NextResponse.json(
    {
      success: true,
      trm: result.trm,
      source: result.source,
      updatedAt: result.updatedAt,
      cached: "MISS",
    },
    { headers: CACHE_HEADERS }
  );
}
