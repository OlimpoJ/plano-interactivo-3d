import { NextResponse } from "next/server";

export const revalidate = 1800; // Actualización automática cada 30 minutos con la TRM oficial del día

const FALLBACK_TRM = 4200;

export async function GET() {
  // 1. Fuente Primaria: Datos Abiertos de Colombia (Superintendencia Financiera de Colombia - TRM Oficial)
  try {
    const res = await fetch(
      "https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1&$order=vigenciadesde%20DESC",
      { next: { revalidate: 1800 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0].valor) {
        const parsed = parseFloat(String(data[0].valor));
        if (!isNaN(parsed) && parsed > 2500 && parsed < 10000) {
          return NextResponse.json({
            success: true,
            trm: parsed,
            source: "Superfinanciera (Datos Abiertos Colombia)",
            updatedAt: data[0].vigenciadesde || new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.warn("Primary TRM fetch (datos.gov.co) failed, trying secondary:", err);
  }

  // 2. Fuente Secundaria: DolarApi Colombia (TRM Oficial del Día)
  try {
    const res = await fetch("https://co.dolarapi.com/v1/trm", {
      next: { revalidate: 1800 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.valor) {
        const parsed = parseFloat(String(data.valor));
        if (!isNaN(parsed) && parsed > 2500 && parsed < 10000) {
          return NextResponse.json({
            success: true,
            trm: parsed,
            source: "DolarApi Colombia (TRM Oficial)",
            updatedAt: data.fechaActualizacion || new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.warn("Secondary TRM fetch (co.dolarapi.com) failed, trying tertiary:", err);
  }

  // 3. Fuente Terciaria: Open Exchange Rates API (USD -> COP)
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 1800 },
    });
    if (res.ok) {
      const data = await res.json();
      const copRate = data?.rates?.COP;
      if (copRate) {
        const parsed = parseFloat(String(copRate));
        if (!isNaN(parsed) && parsed > 2500 && parsed < 10000) {
          return NextResponse.json({
            success: true,
            trm: parsed,
            source: "ExchangeRate-API",
            updatedAt: data.time_last_update_utc || new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.warn("Tertiary TRM fetch (open.er-api.com) failed:", err);
  }

  // Fallback seguro si no hay conexión externa
  return NextResponse.json({
    success: true,
    trm: FALLBACK_TRM,
    source: "Fallback",
    updatedAt: new Date().toISOString(),
  });
}
