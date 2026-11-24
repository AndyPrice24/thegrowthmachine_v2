/* ============================================================
   Client growth (NRR), version 1. Answers Daryl's question: are clients and resellers growing or shrinking, are we
   upselling, and where is the upsell potential? Built from what we hold today: the register's New & Lost movements,
   monthly revenue from the management accounts, the client register (services, adoption, contracts) and location
   counts. Version 2 replaces the estimates with billed revenue per account per month.
   ============================================================ */
const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "Mar 2025" or "Mar 25" -> 202503 (0 if unreadable). */
function monthKey(s) {
  const m = String(s || '').match(/([A-Za-z]{3})[a-z]*\.?\s+(\d{2,4})/); if (!m) return 0;
  const i = MONS.indexOf(m[1][0].toUpperCase() + m[1].slice(1, 3).toLowerCase()); if (i < 0) return 0;
  return (m[2].length === 2 ? 2000 + +m[2] : +m[2]) * 100 + i + 1;
}
const keyLabel = (k) => `${MONS[(k % 100) - 1]} ${String(Math.floor(k / 100)).slice(2)}`;
const addMonths = (k, n) => { const t = Math.floor(k / 100) * 12 + (k % 100) - 1 + n; return Math.floor(t / 12) * 100 + (t % 12) + 1; };
const normName = (s) => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, '');
const pctNum = (s) => { const m = String(s || '').match(/(\d+(?:\.\d+)?)\s*%/); return m ? +m[1] : null; };
const hasSvc = (v) => v != null && String(v).trim() !== '' && !/^(no|false|-)$/i.test(String(v).trim()) && !/^ss$/i.test(String(v).trim());

function nrrData(e) {
  const fin = {}; (e.financePeriods || []).forEach((p) => { const k = monthKey(p.label); if (k && num(p.revenue)) fin[k] = num(p.revenue); });
  const finKeys = Object.keys(fin).map(Number).sort();
  let mv = (e.revenueMovements || []).map((m) => Object.assign({}, m, { k: monthKey(m.from), v: num(m.monthly) })).filter((m) => m.k && m.v);
  // A client that left and signed again is a downgrade (or growth), not churn plus new business.
  const byName = {}; mv.forEach((m) => { (byName[normName(m.client)] = byName[normName(m.client)] || []).push(m); });
  const rebooked = [];
  Object.values(byName).forEach((list) => {
    const lost = list.filter((m) => m.kind === 'lost'); const fresh = list.filter((m) => m.kind === 'new' && lost.some((l) => m.k >= l.k));
    if (!lost.length || !fresh.length) return;
    const l = lost[lost.length - 1]; const n = fresh[fresh.length - 1]; const d = n.v - l.v;
    mv = mv.filter((m) => m !== l && m !== n);
    if (d) mv.push(Object.assign({}, n, { k: l.k, from: l.from, fy: l.fy, kind: d < 0 ? 'downgrade' : 'growth', v: Math.abs(d), cause: d < 0 ? 'Left and re-signed for less' : 'Left and re-signed for more' }));
    rebooked.push({ name: n.client, was: l.v, now: n.v });
  });
  if (!finKeys.length || !mv.length) return null;
  const last = finKeys[finKeys.length - 1]; const first = addMonths(last, -11);
  const base = fin[addMonths(first, -1)] || fin[first];
  const inWin = (m) => m.k >= first && m.k <= last;
  const sumK = (list, kind) => sum(list.filter((m) => m.kind === kind), (m) => m.v);
  const win = mv.filter(inWin);
  const ttm = { growth: sumK(win, 'growth'), downgrade: sumK(win, 'downgrade'), lost: sumK(win, 'lost'), fresh: sumK(win, 'new') };
  ttm.net = ttm.growth - ttm.downgrade - ttm.lost;
  ttm.nrr = base ? (base + ttm.net) / base * 100 : null; ttm.grr = base ? (base - ttm.downgrade - ttm.lost) / base * 100 : null;
  // financial years (March to February), as the client reports them
  const fys = [...new Set(mv.map((m) => m.fy).filter(Boolean))].sort().map((fy) => {
    const list = mv.filter((m) => m.fy === fy); const y = +fy.slice(0, 4); const startK = y * 100 + 3;
    const b = fin[startK] || fin[addMonths(startK, -1)] || base; const lastK = Math.max(...list.map((m) => m.k));
    const r = { fy, growth: sumK(list, 'growth'), downgrade: sumK(list, 'downgrade'), lost: sumK(list, 'lost'), fresh: sumK(list, 'new'), base: b, to: lastK };
    r.net = r.growth - r.downgrade - r.lost; r.nrr = b ? (b + r.net) / b * 100 : null; r.partial = addMonths(startK, 11) > lastK; return r;
  });
  // month by month, from the first movement to the latest
  const k0 = Math.min(...mv.map((m) => m.k)); const k1 = Math.max(...mv.map((m) => m.k)); const months = [];
  for (let k = k0; k <= k1; k = addMonths(k, 1)) { const l = mv.filter((m) => m.k === k); months.push({ k, growth: sumK(l, 'growth'), down: sumK(l, 'downgrade') + sumK(l, 'lost'), fresh: sumK(l, 'new') }); }
  // segments: match movement names to the client register
  const reg = (e.topClients || []).map((c) => ({ c, n: normName(c.name) })).filter((x) => x.n.length > 2);
  const segOf = (name) => { const n = normName(name); const hit = reg.find((x) => x.n === n) || reg.find((x) => n.length > 4 && (x.n.includes(n) || n.includes(x.n))); if (hit) return /reseller|partner/i.test(hit.c.segment || '') ? 'Resellers and partners' : 'Managed clients'; return /\(/.test(name) ? 'Resellers and partners' : 'No longer in the register'; };
  const bySeg = {}; win.forEach((m) => { const s = segOf(m.client); const o = bySeg[s] = bySeg[s] || { growth: 0, down: 0, lost: 0, fresh: 0 }; if (m.kind === 'growth') o.growth += m.v; else if (m.kind === 'downgrade') o.down += m.v; else if (m.kind === 'lost') o.lost += m.v; else if (m.kind === 'new') o.fresh += m.v; });
  // accounts since the first movement, netted per account
  const acc = {}; mv.forEach((m) => { if (m.kind === 'new') return; const a = acc[m.client] = acc[m.client] || { name: m.client, net: 0, lost: false, causes: new Set(), last: 0 }; a.net += m.kind === 'growth' ? m.v : -m.v; if (m.kind === 'lost') a.lost = true; if (m.cause) a.causes.add(m.cause); a.last = Math.max(a.last, m.k); });
  const accounts = Object.values(acc);
  const grew = accounts.filter((a) => a.net > 0).sort((a, b) => b.net - a.net);
  const shrank = accounts.filter((a) => a.net < 0 && !a.lost).sort((a, b) => a.net - b.net);
  const lost = accounts.filter((a) => a.lost).sort((a, b) => a.net - b.net);
  // locations: direct vs resellers, latest month against 12 months earlier
  const lt = (e.client && e.client.locationTrend) || null; let loc = null;
  if (lt && lt.labels && lt.series) {
    const n = lt.labels.length; const j = n - 13; const ser = (re) => lt.series.find((s) => re.test(s.name));
    const pick = (s) => s && j >= 0 ? { now: s.values[n - 1], then: s.values[j], chg: (s.values[n - 1] - s.values[j]) / s.values[j] * 100 } : null;
    loc = { label: lt.labels[n - 1], from: j >= 0 ? lt.labels[j] : '', direct: pick(ser(/direct/i)), resell: pick(ser(/reseller/i)), all: pick(ser(/^all/i)) };
  }
  // upsell and shrink signals from the register (managed clients)
  const managed = (e.topClients || []).filter((c) => c.segment === 'Managed' && c.register);
  const svc = (c) => (c.register.services || {});
  const hasPx = (c) => Object.entries(svc(c)).some(([k, v]) => /percepxion/i.test(k) && hasSvc(v));
  const core = ['Boost', 'Reviews', 'Q&A', 'Posts', 'Store Locator'];
  const missing = (c) => core.filter((k) => !hasSvc(svc(c)[k]) || /^ss$/i.test(String(svc(c)[k] || '').trim()));
  const adopt = (c) => pctNum(c.register.adoptionRate);
  const upsold = managed.filter((c) => /true/i.test(String(c.register.upsell2526)));
  const upsVals = upsold.map((c) => num(c.register.upsellValueMonthly)).filter((v) => v > 0).sort((a, b) => a - b);
  const medianUps = upsVals.length ? upsVals[Math.floor(upsVals.length / 2)] : 0;
  const riskScore = (c) => (c.churnRisk === 'High' ? 3 : c.churnRisk === 'Medium' ? 1 : 0) + (num(c.satisfaction) && num(c.satisfaction) <= 6 ? 2 : 0) + ((adopt(c) ?? 100) <= 38 ? 1 : 0);
  const atRisk = managed.filter((c) => /90 days|Out of contract|Month to month/i.test(c.contractStatus || '') && riskScore(c) > 0)
    .sort((x, y) => riskScore(y) - riskScore(x));
  const riskSet = new Set(atRisk);
  const cand = managed.filter((c) => (adopt(c) || 0) >= 63 && !hasPx(c) && c.churnRisk !== 'High' && !riskSet.has(c))
    .map((c) => ({ c, a: adopt(c), miss: missing(c) })).sort((x, y) => (y.a - x.a) || (num(y.c.satisfaction) - num(x.c.satisfaction)));
  return { rebooked, base, first, last, ttm, fys, months, bySeg, grew, shrank, lost, loc, managed, upsold, medianUps, cand, atRisk, pxCount: managed.filter(hasPx).length,
    target: num((e.client.nrr || {}).target) || 125 };
}

/** Month-by-month bars: expansion above the line, contraction and churn below, new business as a thin bar. */
function nrrMonthChart(months) {
  const W = 760, H = 252, pad = 34, mid = 118; const bw = (W - pad * 2) / months.length;
  const mx = Math.max(1, ...months.map((m) => Math.max(m.growth, m.down)));
  const sc = (v) => v / mx * (mid - 22);
  const bars = months.map((m, i) => { const x = pad + i * bw; const net = m.growth - m.down;
    return `<g><title>${keyLabel(m.k)}: expansion ${fmtMoney(m.growth)}, contraction and churn ${fmtMoney(m.down)}, net ${fmtMoney(net)}${m.fresh ? ', new business ' + fmtMoney(m.fresh) + ' (not in NRR)' : ''}</title>
      ${m.growth ? `<rect x="${x + 3}" y="${mid - sc(m.growth)}" width="${bw - 6}" height="${sc(m.growth)}" rx="2" fill="var(--nrr-up)"/>` : ''}
      ${m.down ? `<rect x="${x + 3}" y="${mid}" width="${bw - 6}" height="${sc(m.down)}" rx="2" fill="var(--nrr-down)"/>` : ''}
      ${net ? `<circle cx="${x + bw / 2}" cy="${mid - sc(net)}" r="3.2" fill="var(--nrr-ink)"/>` : ''}
      ${i % 2 === 0 || months.length <= 12 ? `<text x="${x + bw / 2}" y="${H - 6}" text-anchor="middle" class="nrr-ax">${keyLabel(m.k)}</text>` : ''}</g>`; }).join('');
  return `<svg class="nrr-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Expansion versus contraction and churn by month">
    <line x1="${pad}" x2="${W - pad}" y1="${mid}" y2="${mid}" class="nrr-zero"/>
    <text x="${pad}" y="12" class="nrr-ax">+${fmtShort(mx)}</text><text x="${pad}" y="${mid * 2 - 16}" class="nrr-ax">−${fmtShort(mx)}</text>${bars}</svg>
    <div class="nrr-key"><span><i style="background:var(--nrr-up)"></i>Expansion (upsells, price, more locations)</span><span><i style="background:var(--nrr-down)"></i>Contraction and churn</span><span><i class="dot"></i>Net for the month</span></div>`;
}

/** The view. forClient: no internal notes, worded for the founder. Billing per account (version 2) wins when it is there. */
function nrrView(e, { forClient = false } = {}) {
  if (nrrBillingOn(e)) { const B = nrrBill(e); if (B) return nrrViewBill(e, B, { forClient }); }
  const D = nrrData(e);
  if (!D) return `<p class="empty">No revenue movements or monthly revenue yet. Merge the client register's New &amp; Lost tabs and the management accounts first.</p>`;
  const R = (v) => fmtMoney(Math.round(v)); const P = (v) => v == null ? '—' : Math.round(v) + '%';
  const sign = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + fmtMoney(Math.abs(Math.round(v)));
  const t = D.ttm; const win = `${keyLabel(D.first)} to ${keyLabel(D.last)}`;
  const tile = (label, value, sub, cls = '') => `<div class="nrr-tile ${cls}"><div class="nrr-tl">${label}</div><div class="nrr-tv">${value}</div><div class="nrr-ts">${sub}</div></div>`;
  const accRow = (a) => `<tr><td>${esc(a.name)}</td><td class="r ${a.net < 0 ? 'nrr-neg' : 'nrr-pos'}">${sign(a.net)}/mo</td><td class="small">${esc([...a.causes].join(', '))}</td><td class="small">${keyLabel(a.last)}</td></tr>`;
  const accTable = (title, list, n = 8) => list.length ? `<div><h4>${title} <span class="faint small">(${list.length})</span></h4><table class="nrr-t"><thead><tr><th>Account</th><th class="r">Change</th><th>Why</th><th>When</th></tr></thead><tbody>${list.slice(0, n).map(accRow).join('')}</tbody></table>${list.length > n ? `<p class="faint small">and ${list.length - n} more</p>` : ''}</div>` : '';
  const segRows = Object.entries(D.bySeg).map(([s, o]) => `<tr><td>${esc(s)}</td><td class="r nrr-pos">${sign(o.growth)}</td><td class="r nrr-neg">${sign(-o.down)}</td><td class="r nrr-neg">${sign(-o.lost)}</td><td class="r"><b>${sign(o.growth - o.down - o.lost)}</b></td><td class="r faint">${o.fresh ? sign(o.fresh) : '—'}</td></tr>`).join('');
  const L = D.loc; const locLine = (lab, x) => x ? `<tr><td>${lab}</td><td class="r">${Math.round(x.then).toLocaleString('en-GB')}</td><td class="r">${Math.round(x.now).toLocaleString('en-GB')}</td><td class="r ${x.chg < 0 ? 'nrr-neg' : 'nrr-pos'}">${x.chg > 0 ? '+' : ''}${x.chg.toFixed(0)}%</td></tr>` : '';
  const potential = D.cand.length * D.medianUps;
  const candRows = D.cand.slice(0, 10).map((x) => `<tr><td>${esc(x.c.name)}</td><td class="r">${x.a}%</td><td class="small">${esc(x.miss.length ? x.miss.join(', ') : 'all core services')} · no PercepXion</td><td class="small">${esc(x.c.contractStatus || '')}</td></tr>`).join('');
  const riskRows = D.atRisk.slice(0, 10).map((c) => `<tr><td>${esc(c.name)}</td><td class="small">${esc(c.contractStatus || '')}</td><td class="small">${esc([c.churnRisk ? 'risk ' + c.churnRisk.toLowerCase() : '', c.satisfaction ? 'satisfaction ' + c.satisfaction : '', c.register.adoptionRate ? 'adoption ' + c.register.adoptionRate : ''].filter(Boolean).join(' · '))}</td></tr>`).join('');
  const fyRows = D.fys.map((f) => `<tr><td>${esc(f.fy)}${f.partial ? ` <span class="faint small">(to ${keyLabel(f.to)})</span>` : ''}</td><td class="r nrr-pos">${sign(f.growth)}</td><td class="r nrr-neg">${sign(-f.downgrade)}</td><td class="r nrr-neg">${sign(-f.lost)}</td><td class="r"><b>${sign(f.net)}</b></td><td class="r"><b>${P(f.nrr)}</b>${f.partial ? '<span class="faint small"> so far</span>' : ''}</td><td class="r faint">${sign(f.fresh)}</td></tr>`).join('');
  const gap = D.base * (D.target - 100) / 100 - t.net;
  return `<div class="nrr">
  <div class="nrr-tiles">
    ${tile('Net revenue retention, last 12 months', P(t.nrr), `${win} · target ${D.target}% · estimate`, t.nrr != null && t.nrr < D.target ? 'nrr-bad' : '')}
    ${tile('Gross revenue retention', P(t.grr), 'kept before any expansion')}
    ${tile('Expansion', sign(t.growth) + '/mo', 'upsells, price rises, more locations')}
    ${tile('Contraction and churn', sign(-(t.downgrade + t.lost)) + '/mo', `downgrades ${R(t.downgrade)} · lost ${R(t.lost)}`, 'nrr-bad')}
    ${tile('New business', sign(t.fresh) + '/mo', 'not part of NRR')}
  </div>
  <p class="nrr-lead"><b>What it says:</b> over the last 12 months, existing clients' monthly revenue ${t.net >= 0 ? 'rose' : 'fell'} by a net ${R(Math.abs(t.net))}, on a base of about ${R(D.base)} a month: NRR of about ${P(t.nrr)} against the ${D.target}% objective. Reaching ${D.target}% would mean existing clients paying about ${R(D.base * (D.target - 100) / 100)} a month more at the end of a year than at the start: about ${R(gap)} a month more growth than the last 12 months added.${L && L.resell && L.direct ? ` By channel, direct locations are ${L.direct.chg >= 0 ? 'up' : 'down'} ${Math.abs(L.direct.chg).toFixed(0)}% and reseller locations ${L.resell.chg >= 0 ? 'up' : 'down'} ${Math.abs(L.resell.chg).toFixed(0)}% in a year.` : ''}</p>
  <h3>Month by month</h3>${nrrMonthChart(D.months)}
  <h3>By year</h3><table class="nrr-t"><thead><tr><th>Financial year</th><th class="r">Expansion</th><th class="r">Downgrades</th><th class="r">Lost</th><th class="r">Net</th><th class="r">NRR</th><th class="r">New (not in NRR)</th></tr></thead><tbody>${fyRows}</tbody></table>
  <div class="nrr-2">
    <div><h3>Clients versus resellers, last 12 months</h3><table class="nrr-t"><thead><tr><th></th><th class="r">Expansion</th><th class="r">Downgrades</th><th class="r">Lost</th><th class="r">Net</th><th class="r">New</th></tr></thead><tbody>${segRows}</tbody></table>
      <p class="faint small">Matched by name to the client register. Lost clients no longer appear in it, so some losses can't be placed.${D.bySeg['Resellers and partners'] ? '' : ' The New &amp; Lost tabs recorded no reseller changes in this period, so reseller shrinkage shows only in the location counts, not in rand.'}</p></div>
    ${L ? `<div><h3>Locations by channel</h3><table class="nrr-t"><thead><tr><th></th><th class="r">${esc(L.from)}</th><th class="r">${esc(L.label)}</th><th class="r">Change</th></tr></thead><tbody>${locLine('Direct clients', L.direct)}${locLine('Resellers and partners', L.resell)}${locLine('All', L.all)}</tbody></table>
      <p class="faint small">Resellers are mostly billed per location, so this is the best view of reseller growth until billing per partner arrives.</p></div>` : ''}
  </div>
  <h3>Who is growing, shrinking or leaving</h3>
  <div class="nrr-3">${accTable('Growing', D.grew)}${accTable('Shrinking', D.shrank)}${accTable('Lost', D.lost)}</div>
  <h3>Where the next growth can come from</h3>
  <div class="nrr-2">
    <div><h4>Upsell candidates <span class="faint small">(${D.cand.length})</span></h4>
      <p class="small">Managed clients using at least 63% of what they bought, without PercepXion, and not on the shrink-risk list. ${D.pxCount} managed clients already have PercepXion; ${D.upsold.length} were upsold in 2025/26${D.medianUps ? ` (typical upsell ${R(D.medianUps)}/month)` : ''}.${potential ? ` <b>If every candidate took a typical upsell: about ${R(potential)}/month</b> (an upper bound, not a forecast).` : ''}</p>
      <table class="nrr-t"><thead><tr><th>Client</th><th class="r">Adoption</th><th>Not taken yet</th><th>Contract</th></tr></thead><tbody>${candRows}</tbody></table>${D.cand.length > 10 ? `<p class="faint small">and ${D.cand.length - 10} more</p>` : ''}</div>
    <div><h4>Shrink risk at renewal <span class="faint small">(${D.atRisk.length})</span></h4>
      <p class="small">Managed clients renewing within 90 days, out of contract or month to month, with a warning sign: high or medium churn risk, satisfaction of 6 or below, or low adoption.</p>
      <table class="nrr-t"><thead><tr><th>Client</th><th>Contract</th><th>Warning signs</th></tr></thead><tbody>${riskRows}</tbody></table>${D.atRisk.length > 10 ? `<p class="faint small">and ${D.atRisk.length - 10} more</p>` : ''}</div>
  </div>
  <div class="nrr-note"><b>How far to trust this (version 1).</b> NRR here is an estimate: changes come from the register's New &amp; Lost tabs, which don't yet tie to billing (some rows show R0 for active clients), and the base is total monthly revenue from the management accounts, which includes some non-recurring income. Accounts with no recorded change are not shown.${D.rebooked.length ? ` A client that left and re-signed counts as a downgrade or growth, not as churn plus new business (${esc(D.rebooked.map((r) => r.name).join(', '))}).` : ''} Upsell candidates come from the register's adoption and services columns; values are indicative.
  <b>Version 2</b> uses billed revenue per client and per reseller each month, so every account shows as growing, flat or shrinking, NRR is exact, and resellers are measured by revenue, not locations.${forClient ? '' : ' Needs: the billing export (request to finance) and Pipedrive access for the upsell pipeline.'}</div>
</div>`;
}

function viewNRR(e) {
  const B = nrrBillingOn(e) ? nrrBill(e) : null;
  return `<div class="page-h"><div><span class="eyebrow">Evidence · Client growth</span><h1>Are clients and resellers growing or shrinking?</h1><p class="muted">Company objective 1: NRR ${esc((e.client.nrr || {}).target || 125)}%. ${B ? `Built from billed revenue per account, ${esc(keyLabel(B.first))} to ${esc(keyLabel(B.last))}.` : 'Version 1, built from the data we hold today.'}${PORTAL_ON ? '' : ' To send it to Daryl: Progress &amp; reports → Reports → Client growth (NRR).'}</p></div>
    <div class="btn-row"><button class="btn" data-action="nrrReport">Open as a report →</button></div></div>
  <section class="card">${nrrView(e)}</section>`;
}


/* ============================================================
   Version 2: billed revenue per account per month (collection "billing", from the client's finance team).
   Record: { id, account, channel: direct | reseller | self, billedAs (accounts merged into one end client), months: { '2026-10': 123 } }.
   NRR = what the same accounts are billed now against a year earlier, on rolling averages (3 months by default) so billing
   timing (annual invoices, late or credited months) doesn't swing the number. New accounts are shown but are not part of NRR.
   Method notes, the source and caveats come from client.nrr { target, source, part, method, caveats }.
   ============================================================ */
const NRR_CH = { direct: 'Direct clients', reseller: 'Resellers and partners', self: 'Self-service' };
const ymStr = (k) => `${Math.floor(k / 100)}-${String(k % 100).padStart(2, '0')}`;
const nrrBillAcc = (e) => live(e.billing || []).filter((b) => b.months && typeof b.months === 'object' && Object.keys(b.months).length);
const nrrBillingOn = (e) => nrrBillAcc(e).length > 0;
function nrrBill(e, { span = 3 } = {}) {
  const acc = nrrBillAcc(e); if (!acc.length) return null;
  const ks = [...new Set(acc.flatMap((b) => Object.keys(b.months)))].map((m) => +m.replace('-', '')).filter((k) => k > 190000).sort((a, b) => a - b);
  const first = ks[0], last = ks[ks.length - 1];
  const val = (b, k) => num(b.months[ymStr(k)]);
  const avg = (b, end, n) => { let t = 0; for (let i = 0; i < n; i++) t += val(b, addMonths(end, -i)); return t / n; };
  const can = (end, n) => addMonths(end, -12 - (n - 1)) >= first;
  if (!can(last, span)) return null;
  const calc = (end, n, chans) => {
    const rows = acc.filter((b) => !chans || chans.includes(b.channel)).map((b) => ({ b, was: avg(b, addMonths(end, -12), n), now: avg(b, end, n) }));
    const base = rows.filter((r) => r.was > 0.5);
    const lost = base.filter((r) => r.now <= 0.5), down = base.filter((r) => r.now > 0.5 && r.now < r.was), up = base.filter((r) => r.now > r.was);
    const fresh = rows.filter((r) => r.was <= 0.5 && r.now > 0.5);
    const B = sum(base, (r) => r.was), C = sum(base, (r) => r.now);
    return { end, n, B, C, nrr: B ? C / B * 100 : null, grr: B ? (B - sum(lost, (r) => r.was) - sum(down, (r) => r.was - r.now)) / B * 100 : null,
      lost: sum(lost, (r) => r.was), nLost: lost.length, down: sum(down, (r) => r.was - r.now), nDown: down.length, up: sum(up, (r) => r.now - r.was), nUp: up.length,
      fresh: sum(fresh, (r) => r.now), nFresh: fresh.length, nBase: base.length, rows };
  };
  const chans = Object.keys(NRR_CH).filter((c) => acc.some((b) => b.channel === c));
  const all = calc(last, span); const ch = chans.map((c) => ({ c, x: calc(last, span, [c]), six: can(last, 6) ? calc(last, 6, [c]) : null }));
  const trend = []; for (let k = first; k <= last; k = addMonths(k, 1)) if (can(k, span)) trend.push({ k, all: calc(k, span).nrr, by: Object.fromEntries(chans.map((c) => [c, calc(k, span, [c]).nrr])) });
  const months = []; for (let k = first; k <= last; k = addMonths(k, 1)) months.push({ k, by: Object.fromEntries(chans.map((c) => [c, sum(acc.filter((b) => b.channel === c), (b) => val(b, k))])) });
  const win = (end, n) => `${keyLabel(addMonths(end, -(n - 1)))}${n > 1 ? ' to ' + keyLabel(end) : ''}`;
  return { first, last, span, all, ch, six: can(last, 6) ? calc(last, 6) : null, trend, months, chans, accounts: acc.length,
    winNow: win(last, span), winWas: win(addMonths(last, -12), span), target: num((e.client.nrr || {}).target) || 125 };
}
/** NRR by month (rolling average against a year earlier), one line per channel, with the target. */
function nrrTrendChart(D) {
  const T = D.trend; if (T.length < 2) return '';
  const W = 760, H = 250, L = 44, R = 14, Tp = 16, Bm = 30; const vals = T.flatMap((t) => [t.all, ...Object.values(t.by)]).filter((v) => v != null);
  const lo = Math.floor(Math.min(60, ...vals) / 10) * 10, hi = Math.ceil(Math.max(D.target + 5, ...vals) / 10) * 10;
  const x = (i) => L + i * (W - L - R) / (T.length - 1); const y = (v) => Tp + (hi - v) / (hi - lo) * (H - Tp - Bm);
  const line = (get, cls, w) => `<polyline points="${T.map((t, i) => get(t) == null ? '' : `${x(i).toFixed(1)},${y(get(t)).toFixed(1)}`).filter(Boolean).join(' ')}" fill="none" class="${cls}" stroke-width="${w}"/>`;
  let s = ''; for (let g = lo; g <= hi; g += 10) s += `<line x1="${L}" x2="${W - R}" y1="${y(g)}" y2="${y(g)}" class="${g === 100 ? 'nrr-zero' : 'nrr-grid'}"/><text x="${L - 6}" y="${y(g) + 4}" text-anchor="end" class="nrr-ax">${g}%</text>`;
  s += `<line x1="${L}" x2="${W - R}" y1="${y(D.target)}" y2="${y(D.target)}" class="nrr-target"/><text x="${W - R}" y="${y(D.target) - 5}" text-anchor="end" class="nrr-ax">Target ${D.target}%</text>`;
  const cl = { direct: 'nrr-l-direct', reseller: 'nrr-l-reseller', self: 'nrr-l-self' };
  D.chans.filter((c) => c !== 'self').forEach((c) => { s += line((t) => t.by[c], cl[c], 2); });
  s += line((t) => t.all, 'nrr-l-all', 3);
  T.forEach((t, i) => { s += `<g><title>${keyLabel(t.k)}: all ${Math.round(t.all)}%${D.chans.filter((c) => c !== 'self').map((c) => `, ${NRR_CH[c].toLowerCase()} ${t.by[c] == null ? '—' : Math.round(t.by[c]) + '%'}`).join('')}</title><circle cx="${x(i)}" cy="${y(t.all)}" r="3.4" class="nrr-dot"/></g><text x="${x(i)}" y="${H - 8}" text-anchor="middle" class="nrr-ax">${keyLabel(t.k)}</text>`; });
  return `<svg class="nrr-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Net revenue retention by month">${s}</svg>
    <div class="nrr-key"><span><i class="ln nrr-l-all"></i>All accounts</span>${D.chans.filter((c) => c !== 'self').map((c) => `<span><i class="ln ${cl[c]}"></i>${esc(NRR_CH[c])}</span>`).join('')}<span><i class="ln nrr-target"></i>Target</span></div>`;
}
/** Billed recurring revenue by month, stacked by channel. */
function nrrMrrChart(D) {
  const M = D.months; const W = 760, H = 220, L = 44, Bm = 28, Tp = 10; const tot = (m) => sum(Object.values(m.by), (v) => Math.max(0, v));
  const mx = Math.max(1, ...M.map(tot)); const bw = (W - L) / M.length; const sc = (v) => v / mx * (H - Tp - Bm);
  const col = { direct: 'var(--nrr-up)', reseller: 'var(--nrr-res)', self: 'var(--nrr-self)' };
  const bars = M.map((m, i) => { let yb = H - Bm; const parts = D.chans.map((c) => { const v = Math.max(0, m.by[c] || 0); const h = sc(v); yb -= h; return v ? `<rect x="${L + i * bw + 2}" y="${yb}" width="${bw - 4}" height="${h}" fill="${col[c]}"/>` : ''; }).join('');
    return `<g><title>${keyLabel(m.k)}: ${fmtMoney(Math.round(tot(m)))}${D.chans.map((c) => ` · ${NRR_CH[c].toLowerCase()} ${fmtMoney(Math.round(m.by[c] || 0))}`).join('')}</title>${parts}</g>${i % 3 === 0 || i === M.length - 1 ? `<text x="${L + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle" class="nrr-ax">${keyLabel(m.k)}</text>` : ''}`; }).join('');
  return `<svg class="nrr-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Billed recurring revenue by month and channel"><text x="${L - 6}" y="${Tp + 8}" text-anchor="end" class="nrr-ax">${fmtShort(mx)}</text><line x1="${L}" x2="${W}" y1="${H - Bm}" y2="${H - Bm}" class="nrr-zero"/>${bars}</svg>
    <div class="nrr-key">${D.chans.map((c) => `<span><i style="background:${col[c]}"></i>${esc(NRR_CH[c])}</span>`).join('')}</div>`;
}
function nrrViewBill(e, D, { forClient = false } = {}) {
  const R = (v) => fmtMoney(Math.round(v)); const P = (v) => v == null ? '—' : (Math.round(v * 10) / 10).toFixed(Math.abs(v - Math.round(v)) < 0.05 ? 0 : 1) + '%';
  const sign = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + fmtMoney(Math.abs(Math.round(v)));
  const a = D.all; const cfg = e.client.nrr || {}; const gap = a.B * D.target / 100 - a.C;
  const tile = (label, value, sub, cls = '') => `<div class="nrr-tile ${cls}"><div class="nrr-tl">${label}</div><div class="nrr-tv">${value}</div><div class="nrr-ts">${sub}</div></div>`;
  const chRow = (lab, x, six) => `<tr><td>${esc(lab)}</td><td class="r">${R(x.B)}</td><td class="r">${R(x.C)}</td><td class="r nrr-pos">${sign(x.up)}</td><td class="r nrr-neg">${sign(-x.down)}</td><td class="r nrr-neg">${sign(-x.lost)}${x.nLost ? ` <span class="faint small">(${x.nLost})</span>` : ''}</td><td class="r"><b>${P(x.nrr)}</b>${six ? ` <span class="faint small">(${P(six.nrr)})</span>` : ''}</td><td class="r">${P(x.grr)}</td><td class="r faint">${x.fresh ? sign(x.fresh) : '—'}</td></tr>`;
  const accRow = (r) => `<tr><td>${esc(r.b.account)}</td><td class="small">${esc(NRR_CH[r.b.channel] || '')}</td><td class="r">${R(r.was)}</td><td class="r">${R(r.now)}</td><td class="r ${r.now < r.was ? 'nrr-neg' : 'nrr-pos'}">${sign(r.now - r.was)}</td></tr>`;
  const accTable = (title, list, n = 8) => list.length ? `<div><h4>${title} <span class="faint small">(${list.length})</span></h4><table class="nrr-t"><thead><tr><th>Account</th><th>Channel</th><th class="r">Was</th><th class="r">Now</th><th class="r">Change</th></tr></thead><tbody>${list.slice(0, n).map(accRow).join('')}</tbody></table>${list.length > n ? `<p class="faint small">and ${list.length - n} more</p>` : ''}</div>` : '';
  const base = a.rows.filter((r) => r.was > 0.5);
  const grew = base.filter((r) => r.now > r.was).sort((x, y) => (y.now - y.was) - (x.now - x.was));
  const shrank = base.filter((r) => r.now > 0.5 && r.now < r.was).sort((x, y) => (x.now - x.was) - (y.now - y.was));
  const lost = base.filter((r) => r.now <= 0.5).sort((x, y) => y.was - x.was);
  const fresh = a.rows.filter((r) => r.was <= 0.5 && r.now > 0.5).sort((x, y) => y.now - x.now);
  const chTxt = D.ch.filter(({ c }) => c !== 'self').map(({ c, x }) => `${NRR_CH[c].toLowerCase()} ${P(x.nrr)}`).join('; ');
  const D1 = nrrData(e); // the register still drives upsell candidates and shrink risk
  const src = cfg.source ? sourceLine(e, { id: cfg.source, part: cfg.part || '' }, !forClient) : '';
  const potential = D1 ? D1.cand.length * D1.medianUps : 0;
  return `<div class="nrr">
  <div class="nrr-tiles">
    ${tile('Net revenue retention', P(a.nrr), `${esc(D.winNow)} against ${esc(D.winWas)} · target ${D.target}%`, a.nrr != null && a.nrr < D.target ? 'nrr-bad' : '')}
    ${tile('Gross revenue retention', P(a.grr), 'kept before any expansion')}
    ${tile('Expansion', sign(a.up) + '/mo', `${a.nUp} account${a.nUp === 1 ? '' : 's'} billed more`)}
    ${tile('Contraction and churn', sign(-(a.down + a.lost)) + '/mo', `${a.nDown} billed less (${R(a.down)}) · ${a.nLost} stopped (${R(a.lost)})`, 'nrr-bad')}
    ${tile('New accounts', sign(a.fresh) + '/mo', `${a.nFresh} account${a.nFresh === 1 ? '' : 's'} · not part of NRR`)}
  </div>
  <p class="nrr-lead"><b>What it says:</b> the accounts billed in ${esc(D.winWas)} were billed an average of ${R(a.C)} a month in ${esc(D.winNow)}, against ${R(a.B)} a year earlier: NRR of ${P(a.nrr)} against the ${D.target}% objective (${esc(chTxt)}). Reaching ${D.target}% on this base would mean those accounts paying about ${R(gap)} a month more than they do now.${D.six ? ` Over six months (${esc(keyLabel(addMonths(D.last, -5)))} to ${esc(keyLabel(D.last))}) NRR is ${P(D.six.nrr)}.` : ''}</p>
  <h3>By channel</h3>
  <table class="nrr-t"><thead><tr><th></th><th class="r">A year earlier</th><th class="r">Now</th><th class="r">Expansion</th><th class="r">Contraction</th><th class="r">Stopped</th><th class="r">NRR <span class="faint small">(6 months)</span></th><th class="r">GRR</th><th class="r">New (not in NRR)</th></tr></thead>
    <tbody>${D.ch.map(({ c, x, six }) => chRow(NRR_CH[c], x, six)).join('')}${D.ch.length > 1 ? chRow('All accounts', a, D.six) : ''}</tbody></table>
  <p class="faint small">Monthly averages over ${D.span} months, same accounts a year apart. A whole-month figure moves with billing timing, so the average is the steadier read.</p>
  <h3>Month by month</h3>
  <div class="nrr-2"><div><h4>NRR, ${D.span}-month average against a year earlier</h4>${nrrTrendChart(D)}</div><div><h4>Billed recurring revenue by channel</h4>${nrrMrrChart(D)}</div></div>
  <h3>Who is growing, shrinking or leaving</h3>
  <div class="nrr-3">${accTable('Billed more', grew)}${accTable('Billed less', shrank)}${accTable('Stopped', lost)}</div>
  ${fresh.length ? `<div class="nrr-2">${accTable('New accounts (not in NRR)', fresh, 6)}<div></div></div>` : ''}
  ${D1 && (D1.cand.length || D1.atRisk.length) ? `<h3>Where the next growth can come from</h3>
  <div class="nrr-2">
    <div><h4>Upsell candidates <span class="faint small">(${D1.cand.length})</span></h4>
      <p class="small">From the client register: managed clients using at least 63% of what they bought, without PercepXion, and not on the shrink-risk list.${potential ? ` If every candidate took a typical upsell (${R(D1.medianUps)}/month): about ${R(potential)}/month, an upper bound, not a forecast.` : ''}</p>
      <table class="nrr-t"><thead><tr><th>Client</th><th class="r">Adoption</th><th>Not taken yet</th><th>Contract</th></tr></thead><tbody>${D1.cand.slice(0, 10).map((x) => `<tr><td>${esc(x.c.name)}</td><td class="r">${x.a}%</td><td class="small">${esc(x.miss.length ? x.miss.join(', ') : 'all core services')} · no PercepXion</td><td class="small">${esc(x.c.contractStatus || '')}</td></tr>`).join('')}</tbody></table>${D1.cand.length > 10 ? `<p class="faint small">and ${D1.cand.length - 10} more</p>` : ''}</div>
    <div><h4>Shrink risk at renewal <span class="faint small">(${D1.atRisk.length})</span></h4>
      <p class="small">From the client register: managed clients renewing within 90 days, out of contract or month to month, with a warning sign (churn risk, satisfaction of 6 or below, or low adoption).</p>
      <table class="nrr-t"><thead><tr><th>Client</th><th>Contract</th><th>Warning signs</th></tr></thead><tbody>${D1.atRisk.slice(0, 10).map((c) => `<tr><td>${esc(c.name)}</td><td class="small">${esc(c.contractStatus || '')}</td><td class="small">${esc([c.churnRisk ? 'risk ' + c.churnRisk.toLowerCase() : '', c.satisfaction ? 'satisfaction ' + c.satisfaction : '', c.register.adoptionRate ? 'adoption ' + c.register.adoptionRate : ''].filter(Boolean).join(' · '))}</td></tr>`).join('')}</tbody></table>${D1.atRisk.length > 10 ? `<p class="faint small">and ${D1.atRisk.length - 10} more</p>` : ''}</div>
  </div>` : ''}
  <div class="nrr-note"><b>How this is measured.</b> ${esc(cfg.method || 'Billed recurring revenue per account per month.')} ${D.accounts} accounts, ${esc(keyLabel(D.first))} to ${esc(keyLabel(D.last))}.${cfg.caveats ? ' ' + esc(cfg.caveats) : ''}${src ? `<br><span class="small">Source: ${esc(src)}.</span>` : ''}</div>
</div>`;
}
