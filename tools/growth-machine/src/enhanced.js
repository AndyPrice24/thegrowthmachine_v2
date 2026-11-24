/* ============================================================
   Enhanced data: views that join what the Studio already holds, so the numbers explain each other.
   Each record in e.enhanced names a view kind and carries the takeaway (title), the "so what", sources and coverage;
   the chart is computed from the engagement's own data each time (revenue movements, finance periods, the client
   register), so it stays current. A record's `data` holds figures we keep nowhere else (e.g. one partner's share).
   Shown in Evidence → Insights (Studio) and the founder portal's Insights section (records with portal !== false).
   ============================================================ */
const ED_KINDS = {
  nrrBridge: 'NRR bridge', movementCauses: 'Movements by cause', adoptionMatrix: 'Adoption matrix',
  renewalCalendar: 'Renewal calendar', concentration: 'Concentration', indexedLines: 'Indexed trends'
};
const ED_WIDE = new Set(['nrrBridge', 'renewalCalendar']);
const edP = (x) => (x && typeof x.params === 'object' && x.params) || {};
function edList(e, { portal = false } = {}) {
  return live(e.enhanced).filter((x) => ED_KINDS[x.kind] && (!portal || String(x.portal) !== 'false')).sort((a, b) => num(a.order) - num(b.order));
}
function edMoney(v) {
  v = num(v); const sym = (fmtShort(0).replace(/[\d.,\s]/g, '') || 'R'); const a = Math.abs(v);
  const s = a >= 1e6 ? (a / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'm' : a >= 1e3 ? Math.round(a / 1e3) + 'k' : String(Math.round(a));
  return (v < 0 ? '−' : '') + sym + s;
}
const edSigned = (v) => (v >= 0 ? '+' : '−') + edMoney(Math.abs(v));
const edSvg = (w, h, inner, label) => `<svg class="ed-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label || '')}">${inner}</svg>`;
const edT = (x, y, text, { a = 'start', cls = 'ed-l', extra = '' } = {}) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${a}" class="${cls}" ${extra}>${esc(text)}</text>`;
const edLine = (x1, y1, x2, y2, cls = 'ed-gl', extra = '') => `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="${cls}" ${extra}/>`;
/** Bar with a 4px rounded data end and a square base (up: the data end is on top). */
function edBar(x, yBase, yEnd, w, fill, tip, extra = '') {
  const top = Math.min(yBase, yEnd), h = Math.abs(yEnd - yBase); if (h < 0.5) return '';
  const r = Math.min(4, h / 2, w / 2); const up = yEnd < yBase;
  const d = up ? `M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${top + h} Z`
    : `M${x},${top} H${x + w} V${top + h - r} Q${x + w},${top + h} ${x + w - r},${top + h} H${x + r} Q${x},${top + h} ${x},${top + h - r} Z`;
  return `<path d="${d}" fill="${fill}" ${tip ? `data-tip="${esc(tip)}"` : ''} ${extra}/>`;
}
const edLegend = (items) => `<div class="ed-legend">${items.map(([c, l, dash]) => `<span><i style="background:${c}${dash ? ';background-image:repeating-linear-gradient(90deg,transparent 0 3px,var(--surface) 3px 5px)' : ''}"></i>${esc(l)}</span>`).join('')}</div>`;
const edDefs = `<defs><pattern id="ed-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="var(--red-soft)"/><line x1="0" y1="0" x2="0" y2="7" stroke="var(--red)" stroke-width="2"/></pattern>
  <pattern id="ed-hatch2" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,.55)" stroke-width="2"/></pattern></defs>`;

/* ---------- data ---------- */
function edMoves(e, fy) { return live(e.revenueMovements).filter((m) => !fy || m.fy === fy); }
function edGroup(list, keyFn) { const g = {}; list.forEach((m) => { const k = keyFn(m); g[k] = g[k] || { k, v: 0, n: 0 }; g[k].v += num(m.monthly); g[k].n++; }); return Object.values(g); }
function edBase(e, p) {
  if (num(p.base)) return { v: num(p.base), label: p.baseLabel || 'Start of period' };
  const fp = live(e.financePeriods); const f = fp.find((x) => x.id === p.basePeriod || x.label === p.basePeriod) || fp[0];
  return f ? { v: num(f.revenue), label: 'Revenue, ' + f.label } : { v: 0, label: '' };
}
function edTarget(e, p) { if (num(p.target)) return num(p.target); const k = live(e.kpis).find((x) => /retention|nrr/i.test(x.label || '')); return k && num(k.target) ? num(k.target) : 125; }
const edWarn = (c) => { const s = parseFloat((c.register || {}).satisfaction); return /^(medium|high)$/i.test(c.churnRisk || '') || /^low$/i.test(c.adoption || '') || (isFinite(s) && s <= 6); };

/* ---------- 1. NRR bridge ---------- */
function edNrrBridge(e, x) {
  const p = edP(x); const BL = p.source !== 'register' && nrrBillingOn(e) ? nrrBill(e) : null;
  let base, grow, down, lost, endLabel;
  if (BL) { // billing per account: the same accounts now against a year earlier, split by channel
    const a = BL.all; base = { v: a.B, label: `Billed in ${BL.winWas}` }; endLabel = `NRR, ${BL.winNow}`;
    const by = (key, nKey, lab) => BL.ch.map(({ c, x: y }) => ({ k: `${lab} (${NRR_CH[c].split(' ')[0].toLowerCase()})`, v: y[key], n: y[nKey] })).filter((g) => g.v > 0.5);
    grow = [{ k: 'Billed more', v: a.up, n: a.nUp }]; down = by('down', 'nDown', 'Billed less'); lost = by('lost', 'nLost', 'Stopped');
  } else {
    base = edBase(e, p); const mv = edMoves(e, p.fy); endLabel = `NRR ${p.fy || ''}`.trim();
    if (!base.v || !mv.length) return { html: empty('Needs revenue movements and a starting revenue.') };
    grow = edGroup(mv.filter((m) => m.kind === 'growth'), (m) => m.cause || 'Growth').sort((a, b) => b.v - a.v);
    down = edGroup(mv.filter((m) => m.kind === 'downgrade'), () => 'Downgrades');
    lost = edGroup(mv.filter((m) => m.kind === 'lost'), () => 'Lost clients');
  }
  const target = edTarget(e, p); const pt = (v) => v / base.v * 100;
  const steps = [{ k: 'start', l: 'Start of period', v: 100, tip: `${base.label}: ${edMoney(base.v)}/month (= 100%)` }];
  grow.forEach((g) => steps.push({ k: 'up', l: g.k, v: pt(g.v), r: g.v, n: g.n }));
  down.forEach((g) => steps.push({ k: 'down', l: g.k, v: -pt(g.v), r: g.v, n: g.n }));
  lost.forEach((g) => steps.push({ k: 'down', l: g.k, v: -pt(g.v), r: g.v, n: g.n }));
  const end = 100 + sum(steps.slice(1), (s) => s.v); const expansion = sum(grow, (g) => g.v); const losses = sum(down, (g) => g.v) + sum(lost, (g) => g.v);
  const need = (target - 100) / 100 * base.v + losses;
  steps.push({ k: 'end', l: endLabel, v: end, tip: `${endLabel} ≈ ${end.toFixed(1)}%: net ${edSigned(expansion - losses)}/month from existing ${BL ? 'accounts' : 'clients'}` });
  if (target > end) steps.push({ k: 'gap', l: `Needed for ${target}%`, v: target - end, tip: `Gap to ${target}%: ${(target - end).toFixed(1)} points ≈ ${edMoney((target - end) / 100 * base.v)}/month. At this loss rate, expansion of about ${edMoney(need)}/month a year is needed (this period: ${edMoney(expansion)}).` });
  steps.push({ k: 'target', l: 'Target', v: target, tip: `Target: ${target}%` });
  const vals = steps.map((s) => s.v); let run = 100; const tops = [100];
  steps.slice(1).forEach((s) => { if (s.k === 'up' || s.k === 'down') { run += s.v; tops.push(run); } });
  const lo = Math.floor(Math.min(end, ...tops) / 10) * 10 - 10, hi = Math.ceil(Math.max(target, ...tops) / 10) * 10 + 5;
  const W = 1100, H = 320, L = 46, B = 48, T = 22; const y = (v) => T + (hi - v) / (hi - lo) * (H - T - B);
  const n = steps.length, slot = (W - L) / n, bw = Math.min(100, slot * .7);
  let s = edDefs; for (let g = lo; g <= hi; g += 10) s += edLine(L, y(g), W, y(g), g === 100 ? 'ed-base' : 'ed-gl') + edT(L - 8, y(g) + 4, g + '%', { a: 'end', cls: 'ed-ax' });
  run = 100;
  steps.forEach((st, i) => {
    const x = L + i * slot + (slot - bw) / 2; let a, b, fill, label; const prev = run;
    if (st.k === 'start') { a = lo; b = 100; fill = 'var(--s-other)'; label = '100%'; }
    else if (st.k === 'up') { a = run; b = run + st.v; run = b; fill = 'var(--ed-gain)'; label = '+' + st.v.toFixed(1); }
    else if (st.k === 'down') { a = run; b = run + st.v; run = b; fill = 'var(--red)'; label = st.v.toFixed(1); }
    else if (st.k === 'end') { a = lo; b = st.v; fill = 'var(--ink)'; label = Math.round(st.v) + '%'; }
    else if (st.k === 'gap') { a = end; b = target; fill = 'url(#ed-hatch)'; label = '+' + Math.round(st.v) + ' pts'; }
    else { a = lo; b = target; label = target + '%'; }
    const tip = st.tip || `${st.l}: ${st.v > 0 ? '+' : ''}${st.v.toFixed(1)} points · ${edMoney(st.r)}/month · ${st.n} client${st.n === 1 ? '' : 's'}`;
    if (st.k === 'target') s += `<rect x="${x}" y="${y(target)}" width="${bw}" height="${y(lo) - y(target)}" rx="4" fill="none" stroke="var(--ink)" stroke-dasharray="4 4" data-tip="${esc(tip)}"/>`;
    else if (st.k === 'down' || st.k === 'gap') s += `<rect x="${x}" y="${y(Math.max(a, b))}" width="${bw}" height="${Math.max(1, y(Math.min(a, b)) - y(Math.max(a, b)))}" rx="3" fill="${fill}" data-tip="${esc(tip)}"/>`;
    else s += edBar(x, y(Math.min(a, b)), y(Math.max(a, b)), bw, fill, tip);
    if ((st.k === 'start' || st.k === 'up' || st.k === 'down') && i < n - 1) s += edLine(x + bw, y(run), x + slot, y(run), 'ed-join');
    s += edT(x + bw / 2, y(Math.max(a, b)) - 7, label, { a: 'middle', cls: st.k === 'gap' ? 'ed-ann' : 'ed-l ed-strong' });
    const w = String(st.l).split(' '); const cut = w.length > 2 ? Math.ceil(w.length / 2) : w.length;
    s += edT(x + bw / 2, H - B + 18, w.slice(0, cut).join(' '), { a: 'middle' }) + (w.length > cut ? edT(x + bw / 2, H - B + 32, w.slice(cut).join(' '), { a: 'middle' }) : '');
    void prev;
  });
  return { html: `<div class="ed-scroll">${edSvg(W, H, s, 'Net revenue retention bridge')}</div>`, stats: { end, expansion, losses, need, target, base: base.v } };
}

/* ---------- 2. Movements by cause ---------- */
function edMovementCauses(e, x) {
  const p = edP(x); const mv = edMoves(e, p.fy); if (!mv.length) return { html: empty('Needs revenue movements.') };
  const rows = [
    ...edGroup(mv.filter((m) => m.kind === 'growth'), (m) => m.cause || 'Growth').sort((a, b) => b.v - a.v).map((g) => ({ l: g.k, v: g.v, n: g.n })),
    ...edGroup(mv.filter((m) => m.kind === 'downgrade'), () => 'Downgraded').map((g) => ({ l: g.k, v: -g.v, n: g.n })),
    ...edGroup(mv.filter((m) => m.kind === 'lost'), (m) => 'Lost: ' + String(m.cause || 'reason not recorded').replace(/^./, (c) => c.toLowerCase())).sort((a, b) => b.v - a.v).map((g) => ({ l: g.k, v: -g.v, n: g.n }))];
  const lostTot = sum(rows.filter((r) => /^Lost/.test(r.l)), (r) => -r.v);
  rows.forEach((r) => { r.hi = /not recorded|unknown/i.test(r.l); });
  const maxPos = Math.max(1, ...rows.map((r) => r.v)), maxNeg = Math.max(1, ...rows.map((r) => -r.v));
  const W = 560, rh = 30, T = 8, H = T + rows.length * rh + 26, lab = 186, room = W - lab - 128; const sc = room / (maxPos + maxNeg); const mid = lab + 62 + maxNeg * sc;
  let s = edDefs + edLine(mid, T - 4, mid, H - 22, 'ed-base');
  rows.forEach((r, i) => {
    const yy = T + i * rh, h = 18, w = Math.max(1.5, Math.abs(r.v) * sc), x = r.v >= 0 ? mid : mid - w;
    const tip = `${r.l}: ${edSigned(r.v)}/month · ${r.n} client${r.n === 1 ? '' : 's'}${r.hi && lostTot ? ` · ${Math.round(-r.v / lostTot * 100)}% of all revenue lost` : ''}`;
    s += edT(lab, yy + 13, r.l, { a: 'end', cls: r.hi ? 'ed-ann' : 'ed-l' });
    s += `<rect x="${x.toFixed(1)}" y="${yy}" width="${w.toFixed(1)}" height="${h}" rx="3" fill="${r.v >= 0 ? 'var(--ed-gain)' : 'var(--red)'}" data-tip="${esc(tip)}"/>`;
    if (r.hi) s += `<rect x="${x.toFixed(1)}" y="${yy}" width="${w.toFixed(1)}" height="${h}" rx="3" fill="url(#ed-hatch2)" pointer-events="none"/>`;
    s += edT(r.v >= 0 ? x + w + 6 : x - 6, yy + 13, edSigned(r.v), { a: r.v >= 0 ? 'start' : 'end' });
  });
  return { html: edLegend([['var(--ed-gain)', 'Added'], ['var(--red)', 'Lost or downgraded']]) + edSvg(W, H, s, 'Revenue movements by cause') };
}

/* ---------- 3. Adoption matrix ---------- */
function edAdoptionMatrix(e, x) {
  const p = edP(x); const xk = p.x || 'usage', yk = p.y || 'users'; const lv = ['Low', 'Medium', 'High'];
  const cl = live(e.topClients).filter((c) => c.csScores && lv.includes(c.csScores[xk]) && lv.includes(c.csScores[yk]));
  if (!cl.length) return { html: empty('Needs client scores.') };
  const cell = {}; cl.forEach((c) => { const k = c.csScores[xk] + '|' + c.csScores[yk]; (cell[k] = cell[k] || []).push(c.name); });
  const hot = p.hot || 'High|Low';
  const W = 560, H = 330, L = 120, T = 16, B = 54, cw = (W - L - 20) / 3, ch = (H - T - B) / 3; let s = '';
  lv.forEach((u, xi) => lv.forEach((g, yi) => {
    const names = cell[u + '|' + g] || []; const v = names.length; const xx = L + xi * cw, yy = T + (2 - yi) * ch; const isHot = u + '|' + g === hot;
    const tip = `${p.xLabel || 'Feature usage'} ${u.toLowerCase()}, ${(p.yLabel || 'logins').toLowerCase()} ${g.toLowerCase()}: ${v} client${v === 1 ? '' : 's'} (${Math.round(v / cl.length * 100)}%)${names.length ? ' · ' + names.slice(0, 8).join(', ') + (names.length > 8 ? ` and ${names.length - 8} more` : '') : ''}`;
    s += `<rect x="${xx + 2}" y="${yy + 2}" width="${cw - 4}" height="${ch - 4}" rx="8" class="${isHot ? 'ed-hot' : 'ed-cell'}" data-tip="${esc(tip)}"/>`;
    if (v) s += `<circle cx="${xx + cw / 2}" cy="${yy + ch / 2}" r="${(6 + Math.sqrt(v) * 6.2).toFixed(1)}" fill="${isHot ? 'var(--red)' : 'var(--ed-gain)'}" opacity="${isHot ? 1 : .8}" stroke="var(--surface)" stroke-width="2" pointer-events="none"/>`;
    s += edT(xx + cw / 2, yy + ch / 2 + 4, String(v), { a: 'middle', cls: v >= 10 ? 'ed-l ed-strong ed-on' : 'ed-l ed-strong', extra: 'pointer-events="none"' });
  }));
  lv.forEach((u, i) => { s += edT(L + i * cw + cw / 2, H - B + 20, u, { a: 'middle' }) + edT(L - 10, T + (2 - i) * ch + ch / 2 + 4, u, { a: 'end' }); });
  s += edT(L + 1.5 * cw, H - 10, (p.xLabel || 'Use of purchased features') + ' →', { a: 'middle', cls: 'ed-ax' });
  s += edT(16, T + 1.5 * ch, (p.yLabel || 'Dashboard logins') + ' →', { a: 'middle', cls: 'ed-ax', extra: `transform="rotate(-90 16 ${T + 1.5 * ch})"` });
  return { html: edSvg(W, H, s, 'Adoption matrix'), stats: { n: cl.length, hot: (cell[hot] || []).length } };
}

/* ---------- 4. Renewal calendar ---------- */
function edRenewalCalendar(e, x) {
  const p = edP(x); const segs = splitList(p.segment || 'Managed'); const months = num(p.months) || 12;
  const statusCols = splitList(p.statusBuckets || 'Out of contract, Month to month');
  const cl = live(e.topClients).filter((c) => !segs.length || segs.includes(c.segment)); if (!cl.length) return { html: empty('Needs the client register.') };
  const now = new Date(); const ym = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  const cols = statusCols.map((st) => ({ id: st, l: st, list: [] }));
  const mcols = []; for (let i = 0; i < months; i++) { const d = new Date(now.getFullYear(), now.getMonth() + i, 1); mcols.push({ id: ym(d), l: d.toLocaleString('en-GB', { month: 'short' }) + ' ' + String(d.getFullYear()).slice(2), list: [], month: true }); }
  const later = { id: 'later', l: 'Later', list: [] }, none = { id: 'none', l: 'No end date', list: [] };
  const all = [...cols, ...mcols, later, none]; const by = byId(all);
  cl.forEach((c) => {
    if (statusCols.includes(c.contractStatus)) return by[c.contractStatus].list.push(c);
    const end = String((c.register || {}).contractEnd || ''); if (!/^\d{4}-\d{2}/.test(end)) return none.list.push(c);
    const k = end.slice(0, 7); if (by[k]) return by[k].list.push(c);
    if (k < mcols[0].id) return (by[statusCols[0]] || none).list.push(c);
    later.list.push(c);
  });
  const shown = all.filter((c) => c.list.length || c.month);
  const max = Math.max(5, ...shown.map((c) => c.list.length)); const top = Math.ceil(max / 10) * 10;
  const W = 1100, H = 290, L = 36, B = 52, T = 26; const y = (v) => T + (top - v) / top * (H - T - B);
  const slot = (W - L) / shown.length, bw = Math.min(46, slot * .62);
  let s = ''; for (let g = 0; g <= top; g += 10) s += edLine(L, y(g), W, y(g), g ? 'ed-gl' : 'ed-base') + edT(L - 8, y(g) + 4, String(g), { a: 'end', cls: 'ed-ax' });
  const first = shown.findIndex((c) => c.month); const hiN = Math.max(0, num(p.highlight || 2));
  if (first >= 0 && hiN) {
    const band = shown.slice(first, first + hiN); const tot = sum(band, (c) => c.list.length), w = sum(band, (c) => c.list.filter(edWarn).length);
    s += `<rect x="${L + first * slot}" y="${T - 16}" width="${hiN * slot}" height="${H - T - B + 16}" class="ed-band"/>`;
    s += edT(L + first * slot + 6, T - 4, `${band[0].l.split(' ')[0]}–${band[band.length - 1].l.split(' ')[0]}: ${tot} contract${tot === 1 ? '' : 's'}, ${w} with a warning sign`, { cls: 'ed-ann ed-warnink' });
    s += edLine(L + first * slot, T - 16, L + first * slot, H - B, 'ed-today') + edT(L + first * slot - 6, T - 4, 'Today', { a: 'end', cls: 'ed-l ed-strong' });
  }
  shown.forEach((c, i) => {
    const xx = L + i * slot + (slot - bw) / 2; const warn = c.list.filter(edWarn), rest = c.list.filter((k) => !edWarn(k));
    const nm = (l) => l.slice(0, 10).map((k) => k.name).join(', ') + (l.length > 10 ? ` and ${l.length - 10} more` : '');
    const tip = `${c.l}: ${c.list.length} client${c.list.length === 1 ? '' : 's'}${warn.length ? ` · ⚠ ${warn.length} with a warning sign: ${nm(warn)}` : ''}${rest.length ? ` · no warning sign: ${nm(rest)}` : ''}`;
    if (rest.length) s += edBar(xx, y(0), y(rest.length), bw, 'var(--ed-rest)', tip);
    if (warn.length) s += edBar(xx, y(rest.length) - (rest.length ? 2 : 0), y(c.list.length) - (rest.length ? 2 : 0), bw, 'var(--ed-warn)', tip);
    if (c.list.length) s += edT(xx + bw / 2, y(c.list.length) - 8, String(c.list.length), { a: 'middle', cls: 'ed-l ed-strong' });
    const parts = c.l.split(' '); s += edT(xx + bw / 2, H - B + 18, parts.slice(0, parts.length > 2 ? 2 : 1).join(' '), { a: 'middle' }) + edT(xx + bw / 2, H - B + 32, parts.slice(parts.length > 2 ? 2 : 1).join(' '), { a: 'middle' });
    s += `<rect x="${L + i * slot}" y="${T}" width="${slot}" height="${H - T - B}" class="ed-hit" data-tip="${esc(tip)}"/>`;
  });
  return { html: edLegend([['var(--ed-warn)', '⚠ With a warning sign'], ['var(--ed-rest)', 'No warning sign']]) + `<div class="ed-scroll">${edSvg(W, H, s, 'Renewal calendar')}</div>` };
}

/* ---------- 5. Concentration (figures from the record's own data) ---------- */
function edConcentration(e, x) {
  const d = x.data || {}; const parts = (d.parts || []).filter((q) => num(q.value) > 0); if (!parts.length) return { html: empty('Add the parts in this view’s data.') };
  const tot = num(d.total) || sum(parts, (q) => q.value); let h = '';
  if (d.hero) h += `<div class="ed-hero"><div><div class="ed-hero-n">${esc(d.hero.value)}</div><div class="ed-muted">${esc(d.hero.label || '')}</div></div>${d.hero.delta ? `<div class="ed-hero-d">▼ ${esc(d.hero.delta)}</div>` : ''}</div>`;
  const W = 560; let s = edT(0, 12, d.partsLabel || 'Where it comes from', { cls: 'ed-l ed-strong' }); let xx = 0;
  parts.forEach((q, i) => { const w = num(q.value) / tot * W; const share = Math.round(num(q.value) / tot * 100);
    s += `<rect x="${xx.toFixed(1)}" y="20" width="${Math.max(1, w - 2).toFixed(1)}" height="22" rx="4" fill="${i === 0 ? 'var(--red)' : 'var(--ed-rest)'}" data-tip="${esc(`${q.label}: ${d.unit === 'k' ? edMoney(num(q.value) * 1000) : q.value} (${share}%)`)}"/>`;
    s += i === 0 ? edT(xx + 10, 35, `${q.label} ${d.unit === 'k' ? edMoney(num(q.value) * 1000) : q.value} · ${share}%`, { cls: 'ed-l ed-strong ed-on', extra: 'pointer-events="none"' })
      : edT(W, 60, `${q.label} ${d.unit === 'k' ? edMoney(num(q.value) * 1000) : q.value} · ${share}%`, { a: 'end' });
    xx += w; });
  h += edSvg(W, 66, s, d.partsLabel || 'Concentration');
  const pts = (d.series && d.series.points) || [];
  if (pts.length >= 2) {
    const vs = pts.map((q) => num(q[1])); const lo0 = Math.min(...vs), hi0 = Math.max(...vs), pad = (hi0 - lo0) * .3 || hi0 * .1; const lo = lo0 - pad, hi = hi0 + pad;
    const W2 = 560, H2 = 150, L = 50, T = 26, B = 26; const xs = (i) => L + 30 + i * (W2 - L - 90) / (pts.length - 1), y = (v) => T + (hi - v) / (hi - lo) * (H2 - T - B);
    let s2 = edT(0, 12, `${d.series.label || 'Trend'} (${pts.length} data points)`, { cls: 'ed-l ed-strong' });
    [lo0, (lo0 + hi0) / 2, hi0].forEach((g) => { s2 += edLine(L, y(g), W2, y(g)) + edT(L - 8, y(g) + 4, Math.round(g / 1000) + 'k', { a: 'end', cls: 'ed-ax' }); });
    s2 += `<polyline points="${pts.map((q, i) => xs(i).toFixed(1) + ',' + y(num(q[1])).toFixed(1)).join(' ')}" fill="none" stroke="var(--red)" stroke-width="2"/>`;
    pts.forEach((q, i) => { s2 += `<circle cx="${xs(i).toFixed(1)}" cy="${y(num(q[1])).toFixed(1)}" r="5" fill="var(--red)" stroke="var(--surface)" stroke-width="2" data-tip="${esc(`${q[0]}: ${num(q[1]).toLocaleString('en-ZA')}${q[2] ? ' · ' + q[2] : ''}`)}"/>`
      + edT(xs(i), H2 - 6, q[0], { a: 'middle', cls: 'ed-ax' }) + edT(xs(i), y(num(q[1])) - 10, num(q[1]).toLocaleString('en-ZA'), { a: 'middle' }); });
    h += `<div style="margin-top:12px">${edSvg(W2, H2, s2, d.series.label || 'Trend')}</div>`;
  }
  return { html: h };
}

/* ---------- 6. Indexed trends (finance periods) ---------- */
function edIndexedLines(e, x) {
  const p = edP(x); const fp = live(e.financePeriods); const roll = Math.max(1, num(p.roll) || 3);
  const lines = (Array.isArray(p.lines) && p.lines.length ? p.lines : [{ key: 'revenue', label: 'Revenue' }, { key: 'payroll', label: 'Payroll' }, { key: 'tools', label: 'Tools' }]).slice(0, 3);
  if (fp.length < roll + 2) return { html: empty('Needs at least a few months of finance periods.') };
  const cols = ['var(--ed-gain)', 'var(--red)', 'var(--ed-warn)'];
  const rolled = (k) => fp.map((_, i) => (i < roll - 1 ? null : sum(fp.slice(i - roll + 1, i + 1), (f) => f[k]) / roll)).slice(roll - 1);
  const S = lines.map((l, i) => { const r = rolled(l.key); return { l: l.label, c: cols[i], dash: i === 2 ? '6 4' : '', d: r.map((v) => (r[0] ? v / r[0] * 100 : 0)) }; });
  const xl = fp.slice(roll - 1).map((f) => f.label); const all = S.flatMap((q) => q.d);
  const lo = Math.floor(Math.min(...all) / 20) * 20, hi = Math.ceil(Math.max(...all) / 20) * 20;
  const W = 560, H = 300, L = 40, Rm = 116, T = 14, B = 34; const xs = (i) => L + i * (W - L - Rm) / (xl.length - 1), y = (v) => T + (hi - v) / (hi - lo) * (H - T - B);
  let s = ''; for (let g = lo; g <= hi; g += 20) s += edLine(L, y(g), W - Rm, y(g), g === 100 ? 'ed-base' : 'ed-gl') + edT(L - 8, y(g) + 4, String(g), { a: 'end', cls: 'ed-ax' });
  const every = Math.max(1, Math.ceil(xl.length / 5)); xl.forEach((l, i) => { if (i % every === 0 || i === xl.length - 1) s += edT(xs(i), H - 12, l, { a: 'middle', cls: 'ed-ax' }); });
  const ends = S.map((q) => ({ q, v: q.d[q.d.length - 1] })).sort((a, b) => b.v - a.v); let lastY = -99;
  S.forEach((q) => { s += `<polyline points="${q.d.map((v, i) => xs(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ')}" fill="none" stroke="${q.c}" stroke-width="2" stroke-linejoin="round" ${q.dash ? `stroke-dasharray="${q.dash}"` : ''}/>`
    + `<circle cx="${xs(xl.length - 1).toFixed(1)}" cy="${y(q.d[q.d.length - 1]).toFixed(1)}" r="4" fill="${q.c}" stroke="var(--surface)" stroke-width="2"/>`; });
  ends.forEach(({ q, v }) => { let yy = y(v) + 4; if (yy - lastY < 14) yy = lastY + 14; lastY = yy; s += edT(W - Rm + 8, yy, `${q.l} ${Math.round(v)}`, { cls: 'ed-l ed-strong' }); });
  const colW = (W - L - Rm) / Math.max(1, xl.length - 1);
  xl.forEach((l, i) => { s += `<rect x="${(xs(i) - colW / 2).toFixed(1)}" y="${T}" width="${colW.toFixed(1)}" height="${H - T - B}" class="ed-hit ed-col" data-tip="${esc(`${roll} months to ${l}: ` + S.map((q) => `${q.l} ${Math.round(q.d[i])}`).join(' · '))}"/>`; });
  const table = `<details class="ed-table"><summary>Table view</summary><table class="tbl"><thead><tr><th>${roll} months to</th>${S.map((q) => `<th class="r">${esc(q.l)}</th>`).join('')}</tr></thead><tbody>${xl.map((l, i) => `<tr><td>${esc(l)}</td>${S.map((q) => `<td class="r">${Math.round(q.d[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></details>`;
  return { html: edLegend(S.map((q) => [q.c, q.l, !!q.dash])) + edSvg(W, H, s, 'Indexed trends') + table };
}

const ED_RENDER = { nrrBridge: edNrrBridge, movementCauses: edMovementCauses, adoptionMatrix: edAdoptionMatrix, renewalCalendar: edRenewalCalendar, concentration: edConcentration, indexedLines: edIndexedLines };
function edChart(e, x) { try { return ED_RENDER[x.kind](e, x).html; } catch (err) { console.error(err); return `<p class="empty">This view couldn't be drawn: ${esc(err.message)}</p>`; } }
function edCoverage(x) { if (!x.coverage) return ''; const w = Math.max(0, Math.min(100, num(x.coveragePct))); return `<span class="ed-cov">${esc(x.coverage)}${x.coveragePct !== '' && x.coveragePct != null ? `<span class="ed-covbar"><span style="width:${w}%"></span></span>` : ''}</span>`; }
function edHead(x) { return `<div class="ed-eyebrow">${esc(x.eyebrow || ED_KINDS[x.kind])}${x.tag ? ` <span class="ed-tag ${/surpris/i.test(x.tag) ? 'ed-tag-s' : ''}">${esc(x.tag)}</span>` : ''}</div><h3 class="ed-title">${esc(x.title || ED_KINDS[x.kind])}</h3>${x.sub ? `<p class="ed-sub">${esc(x.sub)}</p>` : ''}`; }
const edWideCls = (x) => (x.wide === true || x.wide === 'true' || (x.wide !== false && x.wide !== 'false' && ED_WIDE.has(x.kind)) ? 'ed-wide' : '');

/** Studio: Evidence → Insights. */
function viewEnhanced(e) {
  const list = edList(e);
  const intro = `<p class="muted small ed-intro">Each view joins data we already hold and is redrawn from it, so it stays current. The takeaway and "so what" are written in the update file; check them when the data moves.${ui.share ? '' : ' Views marked "TGM only" stay out of the founder portal.'}</p>`;
  if (!list.length) return card('Insights', empty('No enhanced views yet. They arrive in an update file (collection "enhanced").'));
  return intro + `<div class="ed-grid">${list.map((x) => `<section class="card ed-card ${edWideCls(x)}" id="ed-${esc(x.id)}">${edHead(x)}${String(x.portal) === 'false' && !ui.share ? '<span class="chip">TGM only</span>' : ''}
    ${edChart(e, x)}${x.sowhat ? `<p class="ed-sowhat"><b>So what:</b> ${esc(x.sowhat)}</p>` : ''}
    <div class="ed-foot">${edCoverage(x)}${refsFor(e, 'finding', x).length ? `<details class="ed-src"><summary>Sources (${refsFor(e, 'finding', x).length})</summary>${citeBlock(e, 'finding', x, '')}</details>` : ''}</div></section>`).join('')}</div>`;
}
