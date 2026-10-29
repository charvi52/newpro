export type ParsedBarcode = {
  raw: string;
  format: string;
  gtin: string | null;
  batch: string | null;
  expiry: string | null;
  serial: string | null;
};

const gtin14 = (value: string) => value.length <= 14 ? value.padStart(14, '0') : null;

function yymmdd(value: string) {
  if (!/^\d{6}$/.test(value)) return null;
  const year = Number(value.slice(0, 2));
  const month = Number(value.slice(2, 4));
  const day = Number(value.slice(4, 6));
  if (month < 1 || month > 12 || day > 31) return null;
  return `${year >= 50 ? 1900 + year : 2000 + year}-${value.slice(2, 4)}-${day === 0 ? 'last day' : value.slice(4, 6)}`;
}

function parseDigitalLink(raw: string) {
  try {
    const url = new URL(raw);
    const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean);
    const values: Record<string, string> = {};
    for (let i = 0; i + 1 < parts.length; i += 2) {
      if (['01', '10', '17', '21'].includes(parts[i])) values[parts[i]] = parts[i + 1];
    }
    return values;
  } catch {
    return null;
  }
}

/** Parse common retail codes and GS1 element strings / Digital Link payloads. */
export function parseMedicineBarcode(rawValue: string, format = 'UNKNOWN'): ParsedBarcode {
  const raw = rawValue.trim();
  const values: Record<string, string> = {};
  const link = parseDigitalLink(raw);
  if (link) Object.assign(values, link);

  const clean = raw.replace(/^\](?:C1|d2)/i, '');
  const parenthesized = [...clean.matchAll(/\((01|10|17|21)\)([^()]+)/g)];
  for (const match of parenthesized) values[match[1]] = match[2].trim();

  // GS1 element strings encode fixed-length fields directly and terminate
  // variable-length fields with ASCII GS (or at the end of the symbol).
  if (!values['01'] && /^01\d{14}/.test(clean)) {
    values['01'] = clean.slice(2, 16);
    let rest = clean.slice(16);
    while (rest.length) {
      rest = rest.replace(/^\u001d+/, '');
      const ai = rest.slice(0, 2);
      if (ai === '17' && rest.length >= 8) {
        values['17'] = rest.slice(2, 8);
        rest = rest.slice(8);
      } else if (ai === '10' || ai === '21') {
        const end = rest.indexOf('\u001d', 2);
        values[ai] = rest.slice(2, end < 0 ? undefined : end);
        rest = end < 0 ? '' : rest.slice(end + 1);
      } else break;
    }
  }

  let gtin = values['01'] || null;
  if (!gtin && /^\d{8}$|^\d{12,14}$/.test(raw)) gtin = gtin14(raw);
  if (gtin && !/^\d{14}$/.test(gtin)) gtin = null;

  return {
    raw,
    format,
    gtin,
    batch: values['10'] || null,
    expiry: values['17'] ? yymmdd(values['17']) : null,
    serial: values['21'] || null,
  };
}
