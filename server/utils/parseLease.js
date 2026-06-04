/**
 * parseLease(buffer) — extract key fields from a tenancy/lease agreement PDF.
 * Returns a partial tenant object with any fields it could find.
 * Fields not found are omitted (caller merges only what exists).
 */
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

// Parse a GHS amount string like "GHS 2,000" or "GH¢ 2,000" → number
function parseGHS(str) {
  const m = str.replace(/,/g, '').match(/[\d]+(?:\.\d+)?/);
  return m ? Math.round(Number(m[0])) : null;
}

// Parse a date phrase like "1st April 2025", "April 1, 2025", "01/04/2025" → ISO string
function parseDate(str) {
  const months = {
    january:1,february:2,march:3,april:4,may:5,june:6,
    july:7,august:8,september:9,october:10,november:11,december:12,
    jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12,
  };
  // "1st April 2025" / "31st March 2026"
  let m = str.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})/i);
  if (m) {
    const mo = months[m[2].toLowerCase()];
    if (mo) return `${m[3]}-${String(mo).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
  }
  // "April 1, 2025"
  m = str.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/i);
  if (m) {
    const mo = months[m[1].toLowerCase()];
    if (mo) return `${m[3]}-${String(mo).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`;
  }
  // "01/04/2025" or "01-04-2025" (DD/MM/YYYY)
  m = str.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return null;
}

export async function parseLease(buffer) {
  let text;
  try {
    const data = await pdfParse(buffer);
    text = data.text || '';
  } catch {
    return {};
  }

  const result = {};

  // ── Monthly rent ────────────────────────────────────────────────────────────
  // "Rent Amount: GHS 2,000 per month" / "GHS 2,000 per month" / "GH¢2,000/month"
  const rentRx = /(?:rent\s+amount|monthly\s+rent)[^\n\d]*(?:GHS|GH[C¢])\s?([\d,]+)/i;
  let m = text.match(rentRx);
  if (!m) m = text.match(/(?:GHS|GH[C¢])\s?([\d,]+)\s*(?:per|\/)\s*month/i);
  if (m) {
    const r = parseGHS(m[1]);
    if (r && r < 1_000_000) result.monthlyRent = r;
  }

  // ── Advance months ──────────────────────────────────────────────────────────
  // "pay 12 months' rent upfront" / "12 months advance"
  m = text.match(/(?:pay\s+)?(\d+)\s*months['\u2019]?\s*rent\s*(?:up\s*front|upfront|in\s*advance)/i);
  if (!m) m = text.match(/(\d+)\s*months\s*(?:advance|upfront)/i);
  if (!m) m = text.match(/advance\s*(?:payment)?[^:]*:\s*\w+\s+(?:shall\s+pay\s+)?(\d+)\s*months/i);
  if (m) {
    const adv = parseInt(m[1]);
    if (adv > 0 && adv <= 36) result.advanceMonths = adv;
  }

  // ── Lease start / end ───────────────────────────────────────────────────────
  // "commence on 1st April 2025 and terminate on 31st March 2026"
  m = text.match(/commence\s+on\s+(.{5,25?})\s+and\s+terminate\s+on\s+(.{5,25?})(?=[,.\n])/i);
  if (m) {
    const start = parseDate(m[1]);
    const end   = parseDate(m[2]);
    if (start) result.leaseStart = start;
    if (end)   result.leaseEnd   = end;
  } else {
    // Fallback — look for "from ... to ..." or separate lines
    const startM = text.match(/(?:commencement|start)\s*(?:date)?[:\s]+(.{5,25?})(?=[,.\n])/i);
    const endM   = text.match(/(?:termination|end)\s*(?:date)?[:\s]+(.{5,25?})(?=[,.\n])/i);
    if (startM) { const d = parseDate(startM[1]); if (d) result.leaseStart = d; }
    if (endM)   { const d = parseDate(endM[1]);   if (d) result.leaseEnd   = d; }
  }

  // ── Security deposit ────────────────────────────────────────────────────────
  // "Amount: GHS 2,000 (equal to one month's rent)"
  m = text.match(/(?:security\s+deposit[\s\S]{0,80}?amount|deposit\s+amount)[^\n\d]*(?:GHS|GH[C¢])\s?([\d,]+)/i);
  if (!m) m = text.match(/(?:GHS|GH[C¢])\s?([\d,]+)\s*\(equal\s+to\s+one\s+month/i);
  if (m) {
    const dep = parseGHS(m[1]);
    if (dep && dep < 1_000_000) { result.depositAmount = dep; result.depositPaid = true; }
  }

  // ── Auto-calc derived fields ─────────────────────────────────────────────────
  const rent = result.monthlyRent || 0;
  const adv  = result.advanceMonths || 0;
  if (rent > 0 && adv > 0) result.advanceAmount = rent * adv;
  // If no explicit deposit found but we have monthly rent, default to 1 month
  if (rent > 0 && !result.depositAmount) { result.depositAmount = rent; result.depositPaid = true; }

  return result;
}
