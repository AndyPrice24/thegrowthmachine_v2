/* ============================================================
   Leaks, weaknesses, holes and opportunities: the lenses, ranking and the crossover rule engine (signals spotted by
   combining data). Used by the founder portal, the reports and Sources & data; the Studio page that listed them was
   replaced by Home and the board (clean-up, 24 Nov).
   Sources: findings (kind, valueMonthly, basis, partOf, fixId), opportunities.
   ============================================================ */
const LENSES = [
  ['leak', 'Leaks', 'Money, time or customers being lost'],
  ['weakness', 'Weaknesses', 'Processes, people, structure or decisions that hold the business back'],
  ['hole', 'Holes', 'Things that should exist and don\'t'],
  ['opportunity', 'Opportunities', 'Revenue or advantage not yet taken'],
  ['tool', 'Tools', 'Systems and vendors to replace, consolidate or cut'],
];
const LENS_ICON = { leak: '💧', weakness: '⚠', hole: '◌', opportunity: '★', tool: '⚙' };
const BASES = ['Leaking', 'At risk', 'Spend to review', 'Upside'];
const SEV_W = { high: 3, medium: 2, low: 1 };
/* Ranking weight per basis: money leaking counts in full; at risk and upside at half; spend to review at a fifth,
   because only part of a cost base is a realistic saving. Shown on the page so the ranking is transparent. */
const BASIS_W = { 'Leaking': 1, 'At risk': 0.5, 'Upside': 0.5, 'Spend to review': 0.2 };
const stake = (x) => x.value * (BASIS_W[x.basis] != null ? BASIS_W[x.basis] : 1);

/** Best guess at a lens when a finding has none set (the page lets you change it). */
function guessLens(f) {
  const a = String(f.area || '').toLowerCase(), t = String(f.title || '').toLowerCase();
  if (/opportunit|upsell|win-back/.test(t)) return 'opportunity';
  if (a === 'tools') return 'tool';
  if (/^no |missing|not defined|no agreed|nobody/.test(t) || a === 'data') return 'hole';
  if (a === 'revenue' || a === 'cost' || /leak|lost|churn|spend|cost/.test(t)) return 'leak';
  return 'weakness';
}
function signalLens(area) {
  if (/^Tools/.test(area)) return 'tool';
  if (/Cost|Finance|Customers|Price/.test(area)) return 'leak';
  if (/Competition/.test(area)) return 'opportunity';
  return 'weakness';
}

/** One flat list of items from every source. Findings with kind 'context' are background, not issues. */
function leakItems(e, { signals = true } = {}) {
  const recs = byId(e.recommendations);
  const items = [];
  e.findings.forEach((f) => {
    const kind = f.kind || guessLens(f); if (kind === 'context') return;
    items.push({ src: 'finding', pinned: !!f.pinned, id: f.id, kind, kindSet: !!f.kind, sev: f.severity || 'low', title: f.title || f.id, detail: f.evidence || '', area: f.area || '',
      value: num(f.valueMonthly), basis: f.basis || (num(f.valueMonthly) ? 'Leaking' : ''), partOf: f.partOf || '', fix: recs[f.fixId] || null, next: f.nextStep || '', rec: f });
  });
  e.opportunities.forEach((o) => {
    if (o.status === 'Recommendation' && !o.recommendationId) return;
    items.push({ src: 'opportunity', id: o.id, kind: 'opportunity', kindSet: true, sev: ({ High: 'high', Medium: 'medium', Low: 'low' })[o.impact] || 'low', title: o.title, detail: o.description || '', area: o.area || '',
      value: num(o.valueMonthly), basis: num(o.valueMonthly) ? 'Upside' : '', partOf: '', fix: recs[o.recommendationId] || null, next: o.nextStep || '', rec: o });
  });
  if (signals) insights(e, fmtMoney, ui.anon).filter((x) => x.severity !== 'low').forEach((x, i) => items.push({ src: 'signal', id: 'sig_' + i, kind: signalLens(x.area), kindSet: true, sev: x.severity, title: x.title, detail: x.detail, area: x.area, value: 0, basis: '', partOf: '', fix: null }));
  const ids = new Set(items.map((x) => x.id)); items.forEach((x) => { if (x.partOf && !ids.has(x.partOf)) x.partOf = ''; });
  return items;
}

/** Totals per basis, counting only top-level items so nested parts are never double counted. */
function leakTotals(items) {
  const t = {}; BASES.forEach((b) => { t[b] = 0; });
  items.filter((x) => !x.partOf && x.value > 0 && t[x.basis] != null).forEach((x) => { t[x.basis] += x.value; });
  return t;
}
function rankItems(items, sort) {
  const cmp = sort === 'severity' ? (a, b) => (SEV_W[b.sev] || 0) - (SEV_W[a.sev] || 0) || b.value - a.value
    : (a, b) => stake(b) - stake(a) || (SEV_W[b.sev] || 0) - (SEV_W[a.sev] || 0);
  const top = items.filter((x) => !x.partOf).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || cmp(a, b));
  const kids = (id) => items.filter((x) => x.partOf === id).sort(cmp);
  const out = []; top.forEach((x) => { out.push(x); kids(x.id).forEach((k) => out.push(Object.assign(k, { nested: true }))); });
  items.filter((x) => x.partOf && !out.includes(x)).forEach((x) => out.push(x));
  return out;
}

function leakFixChip(x) {
  if (x.fix) { const n = autosFor(E(), x.fix.id).length; return `<span class="lo-fix" title="${esc(x.fix.title)}">→ ${esc(trunc(x.fix.title, 46))} <span class="chip">${esc(x.fix.status || 'Identified')}</span>${n ? ` <span class="chip" title="${n} part${n > 1 ? 's' : ''} of this fix can run itself: see Automation opportunities">⚙ ${n}</span>` : ''}</span>`; }
  if (x.next) return `<span class="lo-next" title="${esc(x.next)}">Next: ${esc(trunc(x.next, 52))}</span>`;
  if (x.src === 'signal') return '<span class="faint small">Spotted automatically</span>';
  return '<span class="chip lo-nofix">No action yet</span>';
}

