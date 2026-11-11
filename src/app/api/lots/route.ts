import { NextResponse } from 'next/server';
import { createSign } from 'node:crypto';

interface LotItem {
  id: string;
  rawId: string;
  area: string;
  location: string;
  statusRaw: string;
  status: string;
  pricePerM2: string;
  separation: string;
  totalPrice: string;
  downPayment: string;
  financing: string;
  finalPayment: string;
}

interface LotsCacheEntry {
  lots: LotItem[];
  updatedAt: number;
}

const FRESH_TTL_MS = 15_000; // 15s fresco en RAM (< 1ms de respuesta)
const STALE_TTL_MS = 300_000; // 5 min stale-while-revalidate en segundo plano
const FETCH_TIMEOUT_MS = 4_500;

const lotsMemoryCache = new Map<string, LotsCacheEntry>();
const inFlightRequests = new Map<string, Promise<LotItem[]>>();
const resolvedSheetTitleCache = new Map<string, string>();

let cachedGoogleToken: { accessToken: string; expiresAt: number } | null = null;

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getGoogleSheetsAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  if (cachedGoogleToken && cachedGoogleToken.expiresAt - 60 > nowSec) {
    return cachedGoogleToken.accessToken;
  }

  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claimSet = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: nowSec + 3600,
      iat: nowSec,
    })
  );

  const unsignedJwt = `${header}.${claimSet}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsignedJwt);
  signer.end();
  const signature = base64UrlEncode(signer.sign(privateKey));
  const assertion = `${unsignedJwt}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: 'no-store',
  });

  if (!tokenRes.ok) {
    throw new Error(`Google OAuth token status ${tokenRes.status}`);
  }

  const tokenData = (await tokenRes.json()) as { access_token?: string; expires_in?: number };
  if (!tokenData.access_token) {
    throw new Error('Missing access_token in Google OAuth response');
  }

  cachedGoogleToken = {
    accessToken: tokenData.access_token,
    expiresAt: nowSec + (tokenData.expires_in || 3600),
  };

  return tokenData.access_token;
}

async function fetchGoogleSheetViaRestApi(
  spreadsheetId: string,
  targetSheetName: string,
  targetGid: string,
  clientEmail: string,
  privateKey: string
): Promise<string[][] | null> {
  const accessToken = await getGoogleSheetsAccessToken(clientEmail, privateKey);
  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  let sheetName = targetSheetName;
  if (!sheetName) {
    const cacheKey = `${spreadsheetId}:${targetGid || 'default'}`;
    sheetName = resolvedSheetTitleCache.get(cacheKey) || '';

    if (!sheetName) {
      if (targetGid) {
        const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
          spreadsheetId
        )}?fields=sheets.properties(sheetId,title)`;
        const metaRes = await fetch(metaUrl, {
          headers: authHeaders,
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          cache: 'no-store',
        });
        if (metaRes.ok) {
          const meta = (await metaRes.json()) as {
            sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
          };
          const matched = meta.sheets?.find(
            (s) => String(s.properties?.sheetId) === String(targetGid)
          );
          sheetName = matched?.properties?.title || meta.sheets?.[0]?.properties?.title || '';
          if (sheetName) {
            resolvedSheetTitleCache.set(cacheKey, sheetName);
          }
        }
      }
    }
  }

  // Si no hay nombre de pestaña específico, consultar 'A1:Z1000' toma automáticamente la primera hoja visible
  const escapedSheet = sheetName ? `'${sheetName.replace(/'/g, "''")}'!A1:Z1000` : 'A1:Z1000';
  const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(escapedSheet)}`;

  const valuesRes = await fetch(valuesUrl, {
    headers: authHeaders,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: 'no-store',
  });

  if (!valuesRes.ok) {
    throw new Error(`Google Sheets REST status ${valuesRes.status}`);
  }

  const data = (await valuesRes.json()) as { values?: string[][] };
  return data.values || null;
}

async function fetchGoogleSheetViaCsv(spreadsheetId: string, gid?: string): Promise<string[][] | null> {
  const gidParam = gid ? `&gid=${gid}` : '';
  const urls = [
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv${gidParam}`,
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gidParam}`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        cache: 'no-store',
      });
      if (res.ok) {
        const text = await res.text();
        const rows = parseCsvText(text);
        if (rows && rows.length >= 2) {
          return rows;
        }
      }
    } catch (e) {
      console.warn(`CSV fetch error for ${url}:`, e);
    }
  }
  return null;
}

function parseCsvText(csvText: string): string[][] {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentVal.trim());
      if (currentRow.some((c) => c !== '')) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal !== '' || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c !== '')) {
      lines.push(currentRow);
    }
  }

  return lines;
}

function parseSheetRowsToLots(rows: string[][], project: 'loom' | 'luwana'): LotItem[] {
  let headerRowIdx = rows.findIndex((r) =>
    r.some((c) => c && c.toString().toUpperCase().includes('ESTADO'))
  );
  if (headerRowIdx === -1) headerRowIdx = 0;

  const headers = (rows[headerRowIdx] || []).map((h) =>
    h ? h.toString().trim().toUpperCase() : ''
  );

  const getColIdx = (names: string[]) => headers.findIndex((h) => names.some((n) => h.includes(n)));

  const idxId = getColIdx(['Nº LOTE', 'LOTE', 'NO LOTE', 'N° LOTE']);
  const idxArea = getColIdx(['AREA M2', 'AREA']);
  const idxLocation = getColIdx(['UBICACIÓN', 'UBICACION']);
  const idxStatus = getColIdx(['ESTADO']);
  const idxPriceM2 = getColIdx(['VALOR X M2', 'VALOR M2', 'VALOR/M2']);
  const idxSeparation = getColIdx(['SEPARACIÓN', 'SEPARACION']);
  const idxTotalPrice = getColIdx(['VALOR LOTE', 'VALOR TOTAL']);
  const idxDownPayment = getColIdx(['CUOTA INICIAL']);
  const idxFinancing = getColIdx(['FINANCIACIÓN', 'FINANCIACION']);
  const idxFinalPayment = getColIdx(['CUOTA FINAL', 'SALDO FINAL']);

  const idColIdx = idxId !== -1 ? idxId : 1;
  const statusColIdx = idxStatus !== -1 ? idxStatus : 4;

  return rows
    .slice(headerRowIdx + 1)
    .filter((row) => {
      return (
        row[idColIdx] &&
        row[idColIdx].trim() !== '' &&
        !row[idColIdx].trim().toUpperCase().includes('LOTE')
      );
    })
    .map((row) => {
      const rawId = row[idColIdx].trim();
      let parsedId = rawId;

      if (project === 'loom') {
        const parts = rawId.split('-');
        if (parts.length === 2) {
          const numMatch = parts[1].match(/\d+/);
          if (numMatch) {
            parsedId = `${parts[0].trim().toUpperCase()}-${parseInt(numMatch[0], 10)}`;
          }
        }
      } else {
        const match = rawId.match(/\d+/);
        parsedId = match ? parseInt(match[0], 10).toString() : rawId;
      }

      const rawStatus = (row[statusColIdx] || '').trim();
      const upperStatus = rawStatus.toUpperCase();

      let status = 'available';
      if (upperStatus.includes('VENDIDO')) status = 'sold';
      else if (upperStatus.includes('RESERVADO') || upperStatus.includes('SEPARADO')) status = 'reserved';
      else if (upperStatus.includes('BLOQUEADO')) status = 'blocked';

      return {
        id: parsedId,
        rawId,
        area: idxArea !== -1 ? row[idxArea] || '' : '',
        location: idxLocation !== -1 ? row[idxLocation] || '' : '',
        statusRaw: rawStatus,
        status,
        pricePerM2: idxPriceM2 !== -1 ? row[idxPriceM2] || '' : '',
        separation: idxSeparation !== -1 ? row[idxSeparation] || '' : '',
        totalPrice: idxTotalPrice !== -1 ? row[idxTotalPrice] || '' : '',
        downPayment: idxDownPayment !== -1 ? row[idxDownPayment] || '' : '',
        financing: idxFinancing !== -1 ? row[idxFinancing] || '' : '',
        finalPayment: idxFinalPayment !== -1 ? row[idxFinalPayment] || '' : '',
      };
    });
}

async function fetchAndCacheProjectLots(project: 'loom' | 'luwana'): Promise<LotItem[]> {
  const existingPromise = inFlightRequests.get(project);
  if (existingPromise) {
    return existingPromise;
  }

  const loadPromise = (async () => {
    let spreadsheetId = '';
    let targetSheetName = '';
    let targetGid = '';

    if (project === 'loom') {
      spreadsheetId = (process.env.GOOGLE_SHEET_ID_LOOM || '1IDsSyLELPYdV6eZFTt6d0Q5C5iWl3bm1ukUgbE-rJoA').replace(/^"|"$/g, '');
      targetSheetName = (process.env.GOOGLE_SHEET_NAME_LOOM || 'LISTA DE PRECIO Ver2.').replace(/^"|"$/g, '');
      targetGid = (process.env.GOOGLE_SHEET_GID_LOOM || '1415488116').replace(/^"|"$/g, '');
    } else {
      spreadsheetId = (process.env.GOOGLE_SHEET_ID_LUWANA || process.env.GOOGLE_SHEET_ID || '1e_dxwIK6cjfLmMQqzzlt56-NomUDLX8NZe2WaLnOmto').replace(/^"|"$/g, '');
    }

    if (!spreadsheetId) {
      throw new Error('Missing spreadsheet configuration');
    }

    let rows: string[][] | null = null;
    const clientEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').replace(/^"|"$/g, '');
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^"|"$/g, '');

    if (clientEmail && privateKey) {
      try {
        rows = await fetchGoogleSheetViaRestApi(
          spreadsheetId,
          targetSheetName,
          targetGid,
          clientEmail,
          privateKey
        );
      } catch (apiErr) {
        console.warn(`[api/lots] REST v4 fallback to CSV for ${project}:`, apiErr);
      }
    }

    if (!rows || rows.length < 2) {
      rows = await fetchGoogleSheetViaCsv(spreadsheetId, targetGid);
    }

    if (!rows || rows.length < 2) {
      throw new Error('No rows returned from Google Sheet');
    }

    const parsedLots = parseSheetRowsToLots(rows, project);
    lotsMemoryCache.set(project, {
      lots: parsedLots,
      updatedAt: Date.now(),
    });
    return parsedLots;
  })();

  inFlightRequests.set(project, loadPromise);
  try {
    return await loadPromise;
  } finally {
    inFlightRequests.delete(project);
  }
}

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=300',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawProject = (searchParams.get('project') || 'luwana').toLowerCase();
  const project: 'loom' | 'luwana' = rawProject === 'loom' ? 'loom' : 'luwana';

  const cached = lotsMemoryCache.get(project);
  const now = Date.now();

  if (cached) {
    const age = now - cached.updatedAt;
    if (age <= FRESH_TTL_MS) {
      return NextResponse.json(
        {
          success: true,
          totalLots: cached.lots.length,
          lots: cached.lots,
          cached: 'HIT',
        },
        { headers: CACHE_HEADERS }
      );
    }

    if (age <= STALE_TTL_MS) {
      // Respuesta instantánea (< 1ms) mientras actualiza Google Sheets en segundo plano
      void fetchAndCacheProjectLots(project).catch((err) =>
        console.warn(`[api/lots] Background SWR refresh failed for ${project}:`, err)
      );
      return NextResponse.json(
        {
          success: true,
          totalLots: cached.lots.length,
          lots: cached.lots,
          cached: 'STALE',
        },
        { headers: CACHE_HEADERS }
      );
    }
  }

  try {
    const lots = await fetchAndCacheProjectLots(project);
    return NextResponse.json(
      {
        success: true,
        totalLots: lots.length,
        lots,
        cached: 'MISS',
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error: unknown) {
    console.error(`[api/lots] Error loading project ${project}:`, error);

    // Resiliencia: si hubo un corte temporal de red pero existe último inventario válido en memoria, entregarlo
    if (cached && cached.lots.length > 0) {
      return NextResponse.json(
        {
          success: true,
          totalLots: cached.lots.length,
          lots: cached.lots,
          cached: 'FALLBACK_STALE',
        },
        { headers: CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error temporal al consultar disponibilidad de lotes' },
      { status: 500 }
    );
  }
}
