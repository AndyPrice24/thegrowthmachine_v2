/* ============================================================
   True value of a client (Evidence → True value; TGM only, hidden in the founder portal).
   Two measures, computed from the engagement's own data each time:
   1. True value (rand) = revenue − risk of losing the client (revenue × chance of losing it in the next 12 months).
   2. Effort balance = share of effort ÷ share of revenue. Break-even is average revenue per effort point.
   No rand cost is put on effort: the team is paid either way; the question is where its time goes.
   Revenue: client.monthlyRevenue (billing, Version 2), else the latest value on the New & Lost movements.
   Effort: TouchPoint scores (csScores), else touch level; plus client.opsEffort (0–10) when Operations data arrives.
   Assumptions live in e.engagement.trueValue (defaults below), set by an update file, so they can be agreed and changed without code.
   `exclude` lists clients (name or id) kept in true value but left out of the effort balance, e.g. partner accounts whose
   revenue pays for work the effort score doesn't see.
   ============================================================ */
const TV_DEFAULTS = { exclude: [], segment: 'Managed', risk: { Low: 0.05, Medium: 0.2, High: 0.4, none: 0.1 }, outPts: 0.1, satPts: 0.1, satMax: 6, cap: 0.7 };
const TV_DIMS = ['contacts', 'emails', 'meetings', 'calls', 'queries', 'tickets', 'training'];
const TV_L3 = { Low: 1, Medium: 2, High: 3 };
const TV_MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
function tvOpts(e) { const o = Object.assign({}, TV_DEFAULTS, (e.meta && e.meta.trueValue) || {}, (e.engagement && typeof e.engagement.trueValue === 'object' && e.engagement.trueValue) || {}); o.risk = Object.assign({}, TV_DEFAULTS.risk, o.risk || {}); return o; }
function tvCsEffort(c) {
  const r = c.register || {}; const s = c.csScores || {}; const vals = TV_DIMS.map((k) => TV_L3[s[k]]).filter(Boolean);
  let e, basis;
  if (vals.length) { e = (vals.reduce((a, b) => a + b, 0) / vals.length - 1) / 2 * 10; basis = 'TouchPoint scores'; }
  else { const t = r.touch || ''; e = t === 'High Touch' ? 7 : t === 'Low Touch' ? 3 : 5; basis = /Touch$/.test(t) ? 'touch level' : 'assumed (no data)'; }
  if (String(r.customReport || '').toUpperCase() === 'TRUE') e += 1;
  if (String(r.reputationReport || '') === 'Monthly') e += 0.5;
  return { e: Math.min(10, Math.round(e * 10) / 10), basis };
}
function tvModel(e) {
  const o = tvOpts(e); const segs = splitList(o.segment);
  const clients = live(e.topClients).filter((c) => !segs.length || segs.includes(c.segment));
  const key = (m) => { const p = String(m.from || '').split(' '); return (num(p[1]) || 0) * 100 + (TV_MON[String(p[0] || '').slice(0, 3)] || 0); };
  const last = {}; live(e.revenueMovements).forEach((m) => { if (!m.clientId) return; if (!last[m.clientId] || key(m) >= key(last[m.clientId])) last[m.clientId] = m; });
  const anyOps = clients.some((c) => c.opsEffort !== undefined && c.opsEffort !== '');
  const all = clients.map((c) => {
    const cs = tvCsEffort(c); const ops = anyOps ? Math.min(10, num(c.opsEffort)) : 0;
    const mv = last[c.id]; const rev = num(c.monthlyRevenue) || (num(c.annualRevenue) ? num(c.annualRevenue) / 12 : 0) || (mv && mv.kind !== 'lost' ? num(mv.value) : 0);
    const src0 = num(c.monthlyRevenue) ? 'billing' : num(c.annualRevenue) ? 'annual revenue' : mv ? 'New & Lost' : '';
    const r = c.register || {}; const cr = c.churnRisk || ''; let p = o.risk[cr] != null ? o.risk[cr] : o.risk.none; const why = [cr && o.risk[cr] != null ? `churn risk ${cr.toLowerCase()}` : 'churn risk not rated'];
    const out = /^(Out of contract|Month to month)$/.test(c.contractStatus || ''); if (out) { p += o.outPts; why.push(String(c.contractStatus).toLowerCase()); }
    const sat = parseFloat(r.satisfaction); const lowSat = isFinite(sat) && sat <= o.satMax; if (lowSat) { p += o.satPts; why.push(`satisfaction ${sat}`); }
    p = Math.min(o.cap, p);
    return { c, name: c.name, rev, src: src0, cs: cs.e, ops, basis: cs.basis, e: Math.max(1, cs.e + ops), p, why, out, lowSat, risk: cr, riskR: rev * p, tv: rev * (1 - p) };
  });
  const exl = splitList(o.exclude).map((s) => s.toLowerCase());
  const rows = all.filter((x) => x.rev > 0).sort((a, b) => b.rev - a.rev);
  rows.forEach((x) => { x.ex = exl.includes(String(x.name).toLowerCase()) || exl.includes(String(x.c.id).toLowerCase()); });
  const bal = rows.filter((x) => !x.ex);
  const rev = sum(rows, (x) => x.rev), risk = sum(rows, (x) => x.riskR), E = sum(bal, (x) => x.e), revB = sum(bal, (x) => x.rev), rate = E ? revB / E : 0;
  const revs = rows.map((x) => x.rev).sort((a, b) => a - b); const med = revs.length ? revs[Math.floor(revs.length / 2)] : 0;
  rows.forEach((x) => {
    x.fair = rate ? x.rev / rate : 0; x.idx = x.e ? x.fair / x.e : 0;
    x.v = x.ex ? 'Partner' : x.p >= 0.2 && x.rev >= med ? 'Protect' : x.idx < 0.5 ? 'Rebalance' : x.idx >= 1 && x.p < 0.2 ? 'Grow' : 'Keep as is';
    const step = x.risk === 'High' ? 0.2 : x.risk === 'Medium' ? 0.15 : 0;
    x.L = { contract: x.out ? x.rev * o.outPts : 0, sat: x.lowSat ? x.rev * o.satPts : 0, rating: x.rev * step };
    x.L.base = Math.max(0, x.riskR - x.L.contract - x.L.sat - x.L.rating);
  });
  return { o, all, rows, bal, revB, rev, risk, tv: rev - risk, E, rate, med, anyOps, gaps: all.filter((x) => !x.rev).sort((a, b) => b.e - a.e) };
}
const tvR = (n) => { const a = Math.abs(n); return (n < 0 ? '−' : '') + 'R' + (a >= 1e6 ? (a / 1e6).toFixed(2) + 'm' : Math.round(a / 1000) + 'k'); };
const tvPct = (x) => Math.round(x * 100) + '%';
const tvX = (v) => (v >= 10 ? String(Math.round(v)) : v.toFixed(1));
const tvBal = (x) => (x.idx < 1 ? `gets ${tvX(1 / x.idx)}× the effort its revenue pays for` : `pays for ${tvX(x.idx)}× the effort it gets`);
const tvTip = (x) => x.ex ? `${x.name} · revenue ${tvR(x.rev)}/mo · partner account, not in the effort balance · risk ${tvPct(x.p)} · true value ${tvR(x.tv)}` : `${x.name} · revenue ${tvR(x.rev)}/mo (${x.src}) · effort ${tvX(x.e)} (${x.basis}${x.ops ? ` + Operations ${tvX(x.ops)}` : ''}); its revenue pays for ${tvX(x.fair)} · ${tvBal(x)} · risk ${tvPct(x.p)} (${x.why.join(', ')}) · true value ${tvR(x.tv)} (${tvPct(x.tv / x.rev)}) · ${x.v}`;
const tvShort = (n) => { const w = String(n).replace(/[:(].*$/, '').trim().split(' '); return (w[0] === 'The' ? w.slice(0, 3) : w.slice(0, 2)).join(' '); };
const tvT = (x, y, t, cls = 'ed-l', extra = '') => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls}" ${extra}>${esc(t)}</text>`;

function tvScatter(M) {
  const W = 1100, H = 380, L = 56, B = 42, T0 = 14, Rr = 24; const lo = Math.log10(2000), hi = Math.log10(Math.max(250000, ...M.bal.map((x) => x.rev)) * 1.05);
  const ymax = M.anyOps ? 20 : 10;
  const X = (v) => L + (Math.log10(Math.max(2000, v)) - lo) / (hi - lo) * (W - L - Rr), Y = (e) => T0 + (ymax - Math.min(ymax, e)) / ymax * (H - T0 - B);
  const pts = []; for (let lv = lo; lv <= hi + 1e-9; lv += 0.02) { const v = 10 ** lv; pts.push(`${X(v).toFixed(1)},${Y(v / M.rate).toFixed(1)}`); }
  const line = 'M' + pts.join(' L');
  let s = `<path d="${line} L${X(10 ** hi).toFixed(1)},${Y(ymax)} L${X(2000)},${Y(ymax)} Z" fill="var(--red-soft)" opacity=".75"/><path d="${line} L${X(10 ** hi).toFixed(1)},${Y(0)} L${X(2000)},${Y(0)} Z" fill="var(--mv-em-soft)" opacity=".75"/>`;
  for (let g = 0; g <= ymax; g += ymax / 5) s += `<line x1="${L}" x2="${W - Rr}" y1="${Y(g)}" y2="${Y(g)}" class="ed-gl"/>` + tvT(L - 8, Y(g) + 4, String(g), 'ed-ax', 'text-anchor="end"');
  [2000, 5000, 10000, 20000, 50000, 100000, 200000].filter((g) => Math.log10(g) <= hi).forEach((g) => { s += tvT(X(g), H - 22, 'R' + g / 1000 + 'k', 'ed-ax', 'text-anchor="middle"'); });
  s += tvT((L + W) / 2, H - 4, 'Monthly revenue →', 'ed-ax', 'text-anchor="middle"') + tvT(14, (T0 + H - B) / 2, `Effort (0–${ymax}) →`, 'ed-ax', `text-anchor="middle" transform="rotate(-90 14 ${(T0 + H - B) / 2})"`);
  s += `<path d="${line}" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="6 4"/>`;
  s += tvT(X(2000) + 8, Y(ymax) + 16, 'More effort than revenue pays for', 'ed-ann') + tvT(X(10 ** hi) - 8, Y(0) - 10, 'Pays for more than it gets', 'ed-ann', 'text-anchor="end" style="fill:var(--mv-em)"');
  const col = (p) => (p >= 0.3 ? 'var(--red)' : p >= 0.2 ? 'var(--ed-warn)' : 'var(--ed-gain)');
  M.bal.slice().sort((a, b) => a.rev - b.rev).forEach((x) => { s += `<circle cx="${X(x.rev).toFixed(1)}" cy="${Y(x.e).toFixed(1)}" r="6" fill="${col(x.p)}" fill-opacity=".9" stroke="var(--surface)" stroke-width="1.5" data-tip="${esc(tvTip(x))}"/>`; });
  const placed = [];
  M.bal.filter((x) => x.idx < 0.4 || x.idx > 2).sort((a, b) => Math.abs(Math.log(b.idx)) - Math.abs(Math.log(a.idx))).forEach((x) => {
    const t = tvShort(x.name), w = t.length * 6.2; let ax = X(x.rev) + 9; if (ax + w > W - Rr) ax = X(x.rev) - 9 - w; const ly = Y(x.e) + 4;
    if (placed.some((q) => Math.abs(q.y - ly) < 13 && ax < q.x + q.w && ax + w > q.x)) return; placed.push({ x: ax, y: ly, w }); s += tvT(ax, ly, t, 'ed-l', 'pointer-events="none"'); });
  return `<div class="ed-scroll"><svg class="ed-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Effort against revenue">${s}</svg></div>`;
}
function tvDumb(M, list) {
  const W = 560, rh = 24, L = 170, T0 = 6, H = T0 + list.length * rh + 24, ymax = M.anyOps ? 20 : 10, X = (e) => L + Math.min(ymax, e) / ymax * (W - L - 40);
  let s = ''; for (let g = 0; g <= ymax; g += ymax / 5) s += `<line x1="${X(g)}" x2="${X(g)}" y1="0" y2="${H - 20}" class="ed-gl"/>` + tvT(X(g), H - 6, String(g), 'ed-ax', 'text-anchor="middle"');
  list.forEach((x, i) => { const yy = T0 + i * rh + 10; const f = Math.min(ymax, x.fair); const c = x.idx < 1 ? 'var(--red)' : 'var(--mv-em)';
    s += `<g data-tip="${esc(tvTip(x))}"><rect x="0" y="${yy - 12}" width="${W}" height="${rh}" fill="transparent"/>` + tvT(L - 8, yy + 4, trunc(x.name, 25), 'ed-l', 'text-anchor="end"')
      + `<line x1="${X(f)}" x2="${X(x.e)}" y1="${yy}" y2="${yy}" stroke="${c}" stroke-width="3" stroke-opacity=".5"/><circle cx="${X(f)}" cy="${yy}" r="5" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/><circle cx="${X(x.e)}" cy="${yy}" r="5" fill="${c}"/>`
      + tvT(Math.max(X(f), X(x.e)) + 9, yy + 4, x.idx < 1 ? `${tvX(1 / x.idx)}×` : `÷${tvX(x.idx)}`) + '</g>'; });
  return `<svg class="ed-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Most out of balance">${s}</svg>`;
}
function tvBars(M, list) {
  const W = 560, rh = 24, L = 170, T0 = 4, H = T0 + list.length * rh + 22, max = M.rows[0].rev, sc = (W - L - 50) / max;
  let s = ''; [0, 0.25, 0.5, 0.75, 1].forEach((f) => { const g = max * f; s += `<line x1="${L + g * sc}" x2="${L + g * sc}" y1="0" y2="${H - 18}" class="ed-gl"/>` + tvT(L + g * sc, H - 4, g ? tvR(g) : '0', 'ed-ax', 'text-anchor="middle"'); });
  list.forEach((x, i) => { const yy = T0 + i * rh;
    s += `<g data-tip="${esc(tvTip(x))}"><rect x="0" y="${yy}" width="${W}" height="${rh}" fill="transparent"/>` + tvT(L - 8, yy + 13, trunc(x.name, 25), 'ed-l', 'text-anchor="end"')
      + `<rect x="${L}" y="${yy + 3}" width="${Math.max(0, x.tv * sc - 1.5).toFixed(1)}" height="14" rx="2" fill="var(--ink)"/><rect x="${(L + x.tv * sc).toFixed(1)}" y="${yy + 3}" width="${(x.riskR * sc).toFixed(1)}" height="14" rx="1" fill="var(--red)"/>`
      + tvT(L + x.rev * sc + 6, yy + 14, tvPct(x.tv / x.rev)) + '</g>'; });
  return `<svg class="ed-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Revenue against true value">${s}</svg>`;
}

function viewTrueValue(e) {
  const M = tvModel(e);
  if (!M.rows.length) return card('True value of a client', empty('Needs clients with a monthly revenue (billing, or the New &amp; Lost movements) and effort scores.'));
  const rows = M.rows, B = M.bal, n = M.all.length, sh = (L, k) => sum(L, (x) => x[k]);
  const over = B.filter((x) => x.idx < 1), far = B.filter((x) => x.idx < 0.5), carry = B.filter((x) => x.idx >= 2);
  const exNames = rows.filter((x) => x.ex).map((x) => x.name);
  const spare = sum(over, (x) => Math.max(0, x.e - x.fair));
  const scored = M.all.filter((x) => x.basis !== 'assumed (no data)').length, assumed = n - scored;
  const st = (cls, lab) => `<span class="tv-st ${cls}">${esc(lab)}</span>`;
  const fx = (op, h, w, s, eq) => `<div class="tv-fx ${eq ? 'eq' : ''} ${/todo/.test(s) ? 'todo' : ''}">${op ? `<span class="tv-op">${op}</span>` : ''}<b>${h}</b><div class="tv-w">${w}</div>${s}</div>`;
  const kpi = (k, v, u, s) => `<div class="mv-tile mv-lead"><div class="k">${k}</div><div class="v">${v}<small> ${u}</small></div><div class="s">${s}</div></div>`;
  const head = `<div class="page-h"><div><span class="eyebrow">Evidence · True value of a client · TGM only · indicative</span>
    <h1>${over.length} of the ${B.length} clients we can compare get more of the team's effort than their revenue pays for: together ${tvPct(sh(over, 'e') / M.E)} of the effort for ${tvPct(sh(over, 'rev') / M.revB)} of the revenue.</h1>
    <p class="muted">The team is paid either way; what matters is where its time goes. Each client's share of effort is compared with its share of revenue, and its true value is shown once the risk of losing it is taken off. Revenue is known for ${rows.length} of ${n} clients${M.anyOps ? '' : '; Operations &amp; tech effort per client is still to come'}.${exNames.length ? ` ${esc(exNames.join(' and '))} ${exNames.length > 1 ? 'are' : 'is'} counted in true value but left out of the effort balance (partner accounts; their revenue pays for work the effort score doesn't see).` : ''}</p></div></div>`;
  const kpis = `<div class="tv-kpis">${kpi('Revenue we can value', tvR(M.rev), '/ mo', `${rows.length} of ${n} clients`)}${kpi('Risk of losing it', '−' + tvR(M.risk), '/ mo', 'revenue × chance of losing each client in 12 months')}${kpi('True value', tvR(M.tv), '/ mo', `${tvPct(M.tv / M.rev)} of headline revenue`)}${kpi('Effort out of balance', `${over.length} of ${B.length}`, 'clients', `get more effort than they pay for · ${far.length} over twice as much`)}</div>`;
  const billing = rows.filter((x) => x.src === 'billing').length;
  const ing = card('What goes into it', `<div class="tv-eqlab">1 · True value, in rand</div><div class="tv-eq">
      ${fx('', 'Revenue', 'What the client pays each month.', billing === rows.length && rows.length === n ? st('in', 'In: billing') : st('part', `Partly: ${rows.length} of ${n}${billing ? ` (${billing} from billing)` : ' · billing to come'}`))}
      ${fx('−', 'Risk of losing them', 'Revenue × the chance they leave in the next 12 months: churn risk rating, contract status, satisfaction.', st('in', 'In (assumed chances, to agree)'))}
      ${fx('=', 'True value', 'What you can count on each month.', '', true)}</div>
    <div class="tv-eqlab">2 · Effort balance: is the team's time in proportion to what the client pays?</div><div class="tv-eq">
      ${fx('', 'Client Success effort', 'TouchPoint scores, touch level and reports.', st('in', `In: ${scored} of ${n} scored`))}
      ${fx('+', 'Operations &amp; tech effort', 'Time the tech teams spend on each client, from Paper-trail time stamps.', M.anyOps ? st('in', 'In') : st('todo', 'To come'))}
      ${fx('÷', 'Share of revenue', "The client's slice of the revenue we can value.", st('part', `Partly: ${rows.length} of ${n}`))}
      ${fx('=', 'Effort balance', 'Above 1: gets more effort than it pays for. Below 1: pays for more than it gets.', '', true)}</div>
    <div class="tv-decide"><div><b>Break-even.</b> Each point of effort is matched by about ${tvR(M.rate)} of monthly revenue, so "medium" effort (5) breaks even at about ${tvR(M.rate * 5)} a month (the average client: ${tvR(M.revB / B.length)} at ${tvX(M.E / B.length)}).</div>
      <div><b>The groups.</b> <b>Protect:</b> above-middle revenue (${tvR(M.med)}) with risk of 20% or more. <b>Rebalance:</b> gets over twice the effort its revenue pays for. <b>Grow:</b> pays for at least its effort, lower risk. <b>Keep as is:</b> the rest.</div></div>`);
  const scatter = card('Effort against revenue: who gets more of the team than they pay for', tvScatter(M) + `<p class="ed-sowhat"><b>So what:</b> ${far.length} clients get more than twice the effort their revenue pays for (${tvPct(sh(far, 'e') / M.E)} of the effort for ${tvPct(sh(far, 'rev') / M.revB)} of the revenue). ${carry.length} pay for at least twice what they get (${tvPct(sh(carry, 'rev') / M.revB)} of the revenue for ${tvPct(sh(carry, 'e') / M.E)} of the effort): that's where extra time earns most. The effort scale stops at 10, so big clients' real effort may be understated until we have hours.</p>`,
    { cls: 'tv-wide', sub: `The dashed line is break-even (${tvR(M.rate)} of monthly revenue per effort point). Above it a client gets more effort than its revenue covers. Colour: risk (blue under 20%, amber 20–29%, red 30%+). Hover a dot for the workings.` });
  const byIdx = B.slice().sort((a, b) => a.idx - b.idx);
  const dumb = card('Most out of balance', tvDumb(M, topN('tvDumb', byIdx, 12)) + showAllBtn('tvDumb', byIdx.length, 12), { sub: 'Effort each client gets (dot) against the effort its revenue pays for (ring).' });
  const bars = card('Headline revenue against true value', `<div class="ed-legend"><span><i style="background:var(--ink)"></i>True value</span><span><i style="background:var(--red)"></i>Risk of losing it</span></div>${tvBars(M, topN('tvBars', rows, 12))}${showAllBtn('tvBars', rows.length, 12)}`, { sub: 'Sorted by revenue.' });
  const VD = [['Protect', 'var(--red)', 'Renewal owner and a save plan now.'], ['Grow', 'var(--mv-em)', 'Give them more of the team: upsell and cross-sell.'], ['Rebalance', 'var(--ed-warn)', 'Lighter tier, self-service or a price that fits the work. Check strategic value first.'], ['Keep as is', 'var(--ed-gain)', 'Roughly in balance; keep it lean.']];
  const groups = card("What we'd suggest for each group", `<div class="tv-groups">${VD.map(([k, c, d]) => { const L = rows.filter((x) => x.v === k);
    return `<div class="tv-g" style="--c:${c}"><h4>${k}</h4><div class="n">${L.length}</div><p>${d}<br><b>${tvR(sh(L, 'rev'))}/mo</b> · ${tvPct(sh(L, 'e') / M.E)} of the effort</p><ul>${L.slice(0, 6).map((x) => `<li>${esc(x.name)} <span>${tvR(x.rev)}</span></li>`).join('')}${L.length > 6 ? `<li><span>and ${L.length - 6} more</span></li>` : ''}</ul></div>`; }).join('')}</div>`,
    { cls: 'tv-wide', sub: `Suggestions for the founders to decide, not verdicts on clients.${exNames.length ? ` Not grouped (partner accounts): ${esc(exNames.join(', '))}.` : ''}` });
  const sumL = (k) => sum(rows, (x) => x.L[k]); const fixAll = sumL('contract') + sumL('sat') + sumL('rating');
  const lv = (n2, h, d, c, todo) => `<div class="tv-lv ${todo ? 'todo' : ''}" style="--c:${c}"><div class="n">${n2}</div><b>${h}</b><p>${d}</p></div>`;
  const chip = (v, lab) => (v >= 500 ? `<span class="chip">${lab} +${tvR(v)}</span> ` : '');
  const byGap = rows.slice().sort((a, b) => b.riskR - a.riskR);
  const path = card('Getting each client closer to 100%, and the team\'s time where it pays', `<div class="tv-levers">
      ${lv('+' + tvR(sumL('contract')), 'Sign the renewal', `Out of contract or month to month adds ${Math.round(M.o.outPts * 100)} points of risk.`, 'var(--red)')}
      ${lv('+' + tvR(sumL('sat')), 'Lift satisfaction', `Satisfaction of ${M.o.satMax} or below adds ${Math.round(M.o.satPts * 100)} points.`, 'var(--ed-warn)')}
      ${lv('+' + tvR(sumL('rating')), 'Lower the churn risk', 'Adoption and relationship: high to medium, medium to low.', 'var(--ed-gain)')}
      ${lv(tvPct(spare / M.E), "of the team's effort to move", 'Effort on over-served clients beyond what their revenue pays for.', 'var(--mv-em)')}
      ${M.anyOps ? '' : lv('To come', 'Operations &amp; tech effort', 'Added when Paper-trail time per client arrives.', 'var(--faint)', true)}</div>
    <div class="scroll-x"><table class="tbl"><thead><tr><th>Client</th><th class="r">Revenue</th><th class="r">True value</th><th>What closes the gap (per month)</th><th>Effort balance</th><th class="r">Could reach</th></tr></thead><tbody>
    ${topN('tvPath', byGap, 10).map((x) => `<tr><td>${esc(x.name)}</td><td class="r">${tvR(x.rev)}</td><td class="r">${tvPct(x.tv / x.rev)}</td><td>${chip(x.L.contract, 'Sign renewal')}${chip(x.L.sat, 'Lift satisfaction')}${chip(x.L.rating, 'Lower churn risk')}</td><td>${x.ex ? '<span class="chip">partner: not compared</span>' : x.idx < 1 ? `<span class="chip">${tvX(1 / x.idx)}× its share</span>` : '<span class="chip">in balance or better</span>'}</td><td class="r"><b>${tvPct((x.tv + x.L.contract + x.L.sat + x.L.rating) / x.rev)}</b></td></tr>`).join('')}</tbody></table></div>${showAllBtn('tvPath', byGap.length, 10)}
    <p class="ed-sowhat"><b>So what:</b> the three risk levers would lift true value from ${tvR(M.tv)} to about ${tvR(M.tv + fixAll)} a month (${tvPct(M.tv / M.rev)} → ${tvPct((M.tv + fixAll) / M.rev)}); about ${tvR(sumL('base'))} is everyday risk. Separately, about ${tvPct(spare / M.E)} of the team's effort sits on over-served clients beyond what their revenue pays for: move it to Grow and Protect.</p>`,
    { cls: 'tv-wide', sub: 'Risk never reaches zero, so 100% is the direction, not the target.' });
  const gapsL = M.gaps.filter((x) => x.e >= 5.5);
  const gaps = card('High effort, but no revenue figure', gapsL.length ? `<div class="scroll-x"><table class="tbl"><thead><tr><th>Client</th><th class="r">Effort</th><th>Contract</th><th>Churn risk</th></tr></thead><tbody>${topN('tvGaps', gapsL, 10).map((x) => `<tr><td>${esc(x.name)}</td><td class="r">${tvX(x.e)}</td><td>${esc(x.c.contractStatus || '—')}</td><td>${esc(x.risk || '—')}</td></tr>`).join('')}</tbody></table></div>${showAllBtn('tvGaps', gapsL.length, 10)}` : empty('None.'), { sub: 'We can\'t place these yet. The billing export fills this in.' });
  const method = card('How it\'s worked out', `<ul class="small">
    <li>Revenue: billing per client where loaded (monthlyRevenue); otherwise the latest monthly value on the New &amp; Lost movements, which mix billing values and change amounts.</li>
    <li>Client Success effort (0–10): average of seven TouchPoint measures (${TV_DIMS.join(', ')}), or touch level where unscored (High 7, Low 3, unknown 5; ${assumed} assumed), plus 1 for a custom report and 0.5 for a monthly reputation report. Every client counts as at least 1.</li>
    <li>Effort balance: share of effort ÷ share of revenue; break-even ${tvR(M.rate)} of monthly revenue per effort point. No rand cost is put on effort.</li>
    <li>Risk: revenue × chance of losing the client in 12 months. Assumed: churn risk low ${tvPct(M.o.risk.Low)}, medium ${tvPct(M.o.risk.Medium)}, high ${tvPct(M.o.risk.High)}, not rated ${tvPct(M.o.risk.none)}; +${Math.round(M.o.outPts * 100)} points if out of contract or month to month; +${Math.round(M.o.satPts * 100)} if satisfaction is ${M.o.satMax} or below. Change these, and the clients left out of the balance, in engagement.trueValue once agreed.</li>
    <li>Not counted yet: ${M.anyOps ? '' : 'Operations &amp; tech effort, '}complaints and escalations, data problems, strategic value.</li></ul>`);
  return head + kpis + ing + `<div class="tv-grid">${scatter}${dumb}${bars}${groups}${path}${gaps}${method}</div>`;
}
