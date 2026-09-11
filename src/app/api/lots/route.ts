import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const revalidate = 10; // Auto-sincronización en tiempo real cada 10 segundos desde Google Sheets

async function fetchGoogleSheetViaCsv(spreadsheetId: string, gid?: string): Promise<string[][] | null> {
  const gidParam = gid ? `&gid=${gid}` : '';
  const urls = [
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv${gidParam}`,
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${gidParam}`
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { next: { revalidate: 10 } });
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
      if (currentRow.some(c => c !== '')) {
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
    if (currentRow.some(c => c !== '')) {
      lines.push(currentRow);
    }
  }

  return lines;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const project = searchParams.get('project') || 'luwana';

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
      return NextResponse.json({ success: false, error: 'GOOGLE_SHEET_ID variable is missing' }, { status: 500 });
    }

    let rows: string[][] | null = null;

    // Intentar primero vía Google Sheets API oficial
    try {
      const clientEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'real-estate-sheets-bot@real-estate-app-master.iam.gserviceaccount.com').replace(/^"|"$/g, '');
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/^"|"$/g, '');

      if (clientEmail && privateKey) {
        const auth = new google.auth.GoogleAuth({
          credentials: { client_email: clientEmail, private_key: privateKey },
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        const sheets = google.sheets({ version: 'v4', auth });
        let sheetName = targetSheetName;
        if (!sheetName) {
          const info = await sheets.spreadsheets.get({ spreadsheetId });
          if (targetGid) {
            const matched = info.data.sheets?.find(s => String(s.properties?.sheetId) === String(targetGid));
            if (matched?.properties?.title) {
              sheetName = matched.properties.title;
            }
          }
          if (!sheetName) {
            sheetName = info.data.sheets?.[0]?.properties?.title || 'Hoja 1';
          }
        }
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A1:Z1000`,
        });
        rows = (response.data.values || []) as string[][];
      }
    } catch (apiErr) {
      console.warn("Google API Auth error, switching to direct CSV fetch fallback:", apiErr);
    }

    // Fallback a exportación CSV directa (Ultra-rápido y 100% público)
    if (!rows || rows.length < 2) {
      rows = await fetchGoogleSheetViaCsv(spreadsheetId, targetGid);
    }

    if (!rows || rows.length < 2) {
      return NextResponse.json({ success: false, error: 'No data found in Google Sheet' }, { status: 404 });
    }

    // Encontrar fila de encabezados dinámicamente
    let headerRowIdx = rows.findIndex(r => r.some(c => c && c.toString().toUpperCase().includes('ESTADO')));
    if (headerRowIdx === -1) headerRowIdx = 0;

    const headers = (rows[headerRowIdx] || []).map(h => h ? h.toString().trim().toUpperCase() : '');

    const getColIdx = (names: string[]) => {
      return headers.findIndex(h => names.some(n => h.includes(n)));
    };

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

    const lots = rows.slice(headerRowIdx + 1).filter(row => {
      return row[idColIdx] && row[idColIdx].trim() !== '' && !row[idColIdx].trim().toUpperCase().includes('LOTE');
    }).map(row => {
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
        rawId: rawId,
        area: idxArea !== -1 ? (row[idxArea] || '') : '',
        location: idxLocation !== -1 ? (row[idxLocation] || '') : '',
        statusRaw: rawStatus,
        status: status,
        pricePerM2: idxPriceM2 !== -1 ? (row[idxPriceM2] || '') : '',
        separation: idxSeparation !== -1 ? (row[idxSeparation] || '') : '',
        totalPrice: idxTotalPrice !== -1 ? (row[idxTotalPrice] || '') : '',
        downPayment: idxDownPayment !== -1 ? (row[idxDownPayment] || '') : '',
        financing: idxFinancing !== -1 ? (row[idxFinancing] || '') : '',
        finalPayment: idxFinalPayment !== -1 ? (row[idxFinalPayment] || '') : ''
      };
    });

    return NextResponse.json({
      success: true,
      totalLots: lots.length,
      lots,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown API Error';
    console.error('API Error:', errorMsg);
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 }
    );
  }
}
