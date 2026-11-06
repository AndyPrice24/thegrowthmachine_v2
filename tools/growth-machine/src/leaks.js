/* ============================================================
   Leaks & opportunities: everything the machine has found, in one ranked list.
   Sources: findings (kind, valueMonthly, basis, partOf, fixId), opportunities, and the
   crossover rule engine (signals spotted automatically by combining data).
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
  if (x.fix) return `<span class="lo-fix" title="${esc(x.fix.title)}">→ ${esc(trunc(x.fix.title, 46))} <span class="chip">${esc(x.fix.status || 'Identified')}</span></span>`;
  if (x.next) return `<span class="lo-next" title="${esc(x.next)}">Next: ${esc(trunc(x.next, 52))}</span>`;
  if (x.src === 'signal') return '<span class="faint small">Spotted automatically</span>';
  return '<span class="chip lo-nofix">No action yet</span>';
}

function viewLeaks(e) {
  const L = ui.lo = Object.assign({ lens: 'all', sort: 'size', signals: true, noFix: false, open: '' }, ui.lo || {});
  const all = leakItems(e, { signals: L.signals });
  const tot = leakTotals(all);
  const count = (k) => all.filter((x) => x.kind === k).length;
  let list = all.filter((x) => L.lens === 'all' || x.kind === L.lens);
  if (L.noFix) list = list.filter((x) => !x.fix && !x.next && x.src !== 'signal');
  if (L.unsized) list = list.filter((x) => !x.value && x.src !== 'signal');
  const rankedAll = rankItems(list, L.sort);
  const tops = rankedAll.filter((x) => !x.nested); const keep = new Set(topN('home', tops).map((x) => x.id));
  const ranked = rankedAll.filter((x) => keep.has(x.nested ? x.partOf : x.id));
  const sv = savingsTracker(e);
  const noFix = all.filter((x) => !x.fix && !x.next && x.src !== 'signal').length, unsized = all.filter((x) => !x.value && x.src !== 'signal').length;
  const kp = (label, v, sub) => kpi(label, v ? fmtMoney(v) + '/mo' : '—', `<div class="k-delta">${sub}</div>`);
  const seg = (on, k, v, label) => `<button class="seg ${on ? 'on' : ''}" data-action="loSet" data-k="${k}" data-id="${v}">${label}</button>`;
  const recOpts = (cur) => `<option value="">— none —</option>${e.recommendations.map((r) => `<option value="${esc(r.id)}" ${cur === r.id ? 'selected' : ''}>${esc(trunc(r.title, 70))}</option>`).join('')}`;
  const parentOpts = (x) => `<option value="">— top level —</option>${all.filter((y) => y.src === 'finding' && y.id !== x.id && !y.partOf).map((y) => `<option value="${esc(y.id)}" ${x.partOf === y.id ? 'selected' : ''}>${esc(trunc(y.title, 70))}</option>`).join('')}`;
  const cell = (x, field, html) => (x.src === 'finding' ? html.replace('<select', `<select data-cell data-coll="findings" data-id="${esc(x.id)}" data-field="${field}"`) : '');
  const editor = (x) => x.src !== 'finding' ? (x.src === 'opportunity' ? '<p class="faint small">Edit this opportunity in Evidence → Market, or in Sources &amp; data.</p>' : '<p class="faint small">Spotted by combining data already in the Studio (crossing finance, people, tools, processes and interviews). Fix the cause, or add a finding if it matters.</p>') : `
      <div class="lo-edit">
        <label>Lens ${cell(x, 'kind', `<select>${LENSES.map(([k, n]) => `<option value="${k}" ${x.kind === k ? 'selected' : ''}>${n}</option>`).join('')}<option value="context">Background only (hide)</option></select>`)}</label>
        <label>Size per month <input type="number" data-cell data-type="num" data-coll="findings" data-id="${esc(x.id)}" data-field="valueMonthly" value="${x.value || ''}" placeholder="R / month"></label>
        <label>Basis ${cell(x, 'basis', `<select><option value=""></option>${BASES.map((b) => `<option ${x.basis === b ? 'selected' : ''}>${b}</option>`).join('')}</select>`)}</label>
        <label>Fix ${cell(x, 'fixId', `<select>${recOpts(x.fix && x.fix.id)}</select>`)}</label>
        <label>Part of ${cell(x, 'partOf', `<select>${parentOpts(x)}</select>`)}</label>
        <label class="lo-wide">Next step (question or data request) <input type="text" data-cell data-coll="findings" data-id="${esc(x.id)}" data-field="nextStep" value="${esc(x.next)}" placeholder="e.g. Ask Natalie: revenue by partner"></label>
      </div>`;
  const row = (x, i) => {
    const open = L.open === x.id;
    return `<div class="lo-row ${x.nested ? 'nested' : ''} ${open ? 'open' : ''}">
      <button class="lo-main" data-action="loOpen" data-id="${esc(x.id)}">
        <span class="lo-rank">${x.nested ? '↳' : i}</span>
        <span class="lo-lens lo-${x.kind}" title="${esc((LENSES.find((l) => l[0] === x.kind) || [])[1] || '')}">${LENS_ICON[x.kind] || ''}</span>
        <span class="lo-title">${x.pinned ? '<span class="chip pin-chip" title="Pinned above the money ranking because the client named it a priority">★ Founder priority</span> ' : ''}${sevChip(x.sev)} ${esc(x.title)}${x.src === 'signal' ? ' <span class="chip lo-auto">auto</span>' : ''}${x.kindSet ? '' : ' <span class="chip lo-auto" title="Lens guessed from the area. Open to set it.">lens?</span>'}</span>
        <span class="lo-val">${x.value ? `<b>${fmtMoney(x.value)}</b>/mo<em>${esc((x.basis || '').toLowerCase())}</em>` : '<span class="faint">Not sized</span>'}</span>
        <span class="lo-fixcol">${leakFixChip(x)}</span>
      </button>
      ${open ? `<div class="lo-detail"><p>${esc(x.detail)}</p>${x.rec && Array.isArray(x.rec.sources) && x.rec.sources.length ? `<div class="lo-srcs"><b class="small">Sources</b><ol>${x.rec.sources.map((r) => `<li class="small">${r.side === 'says' ? '<span class="chip">documents say</span> ' : r.side === 'seen' ? '<span class="chip">evidence</span> ' : ''}${esc(sourceLine(e, r, true))}</li>`).join('')}</ol></div>` : ''}<p class="faint small">${esc(x.area)}${x.partOf ? ` · part of: ${esc((all.find((y) => y.id === x.partOf) || {}).title || x.partOf)}` : ''}${x.fix ? ` · fix: ${esc(x.fix.title)} (${esc(x.fix.horizon || '')})` : ''}${x.next ? ` · next: ${esc(x.next)}` : ''}</p>${editor(x)}</div>` : ''}
    </div>`;
  };
  let n = 0;
  const byLens = LENSES.map(([k, name]) => ({ label: name, value: sum(all.filter((x) => x.kind === k && !x.partOf), (x) => x.value), tip: `${count(k)} items` }));
  return `<div class="page-h"><div><span class="eyebrow">${esc(e.client.name)}</span><h1>Leaks &amp; opportunities</h1><p class="muted">What's leaking, what it's worth, and what needs you today. Ranked by money at stake; each item says what fixes it.</p></div></div>
  <div class="kpis">${e.client.nrr && e.client.nrr.value ? kpi('NRR (indicative)', e.client.nrr.value + '%', `<div class="k-delta ${num(e.client.nrr.value) < num(e.client.nrr.target) ? 'delta-bad' : ''}">target ${esc(e.client.nrr.target)}% · ${esc(e.client.nrr.note || '')}</div>`) : ''}${kp('Leaking now', tot['Leaking'], 'revenue or spend being lost')}${kp('At risk', tot['At risk'], 'could be lost')}${kp('Spend to review', tot['Spend to review'], 'cost base where savings sit')}${kp('Upside', tot['Upside'], 'revenue not yet taken')}${sv.target ? kpi('Savings approved', fmtMoney(sv.approved) + '/mo', `<div class="k-delta">of ${fmtMoney(sv.target)} target · ${fmtMoney(sv.identified)} identified (estimates)</div>`) : ''}</div>
  ${needsInput(e, all)}
  <section class="card">
    <div class="lo-bar">
      <span class="pv-switch sm">${seg(L.lens === 'all', 'lens', 'all', `All (${all.length})`)}${LENSES.map(([k, name]) => seg(L.lens === k, 'lens', k, `${LENS_ICON[k]} ${name} (${count(k)})`)).join('')}</span>
      <span class="pv-switch sm">${seg(L.sort === 'size', 'sort', 'size', 'Biggest first')}${seg(L.sort === 'severity', 'sort', 'severity', 'Most severe first')}</span>
      <label class="small"><input type="checkbox" data-action="loTick" data-k="signals" ${L.signals ? 'checked' : ''}> Include signals spotted automatically</label>
    </div>
    ${L.lens !== 'all' ? `<p class="small muted" style="margin:8px 0 0">${esc((LENSES.find((l) => l[0] === L.lens) || [])[2] || '')}</p>` : ''}
    <div class="lo-head"><span>#</span><span></span><span>What</span><span>At stake</span><span>Fix</span></div>
    <div class="lo-list">${ranked.length ? ranked.map((x) => row(x, x.nested ? 0 : ++n)).join('') : empty('Nothing here yet.')}</div>
    ${showAllBtn('home', tops.length)}
    ${L.noFix || L.unsized ? `<p class="small" style="margin:8px 0 0">Filtered: ${L.noFix ? 'no action yet' : 'not sized'}. <button class="link" data-action="loNeed" data-k="clear">Show everything</button></p>` : ''}
    <p class="faint small" style="margin:10px 0 0">Totals count each item once (parts nested under a bigger item are not added again). Sizes are estimates from the sources named in each item. “Biggest first” counts leaking in full, at risk and upside at half, spend to review at a fifth.</p>
  </section>
  ${card('Where the money is, by lens', hbars(byLens.filter((x) => x.value > 0), { fmt: (v) => fmtMoney(v) + '/mo', color: 'var(--s1)' }), { sub: 'Sized items only, all bases together. Use it to see where the weight sits, not as a single total.' })}`;
}
