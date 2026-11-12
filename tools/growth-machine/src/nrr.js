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

/** The view. forClient: no internal notes, worded for the founder. */
function nrrView(e, { forClient = false } = {}) {
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
  return `<div class="page-h"><div><span class="eyebrow">Evidence · Client growth</span><h1>Are clients and resellers growing or shrinking?</h1><p class="muted">Company objective 1: NRR ${esc((e.client.nrr || {}).target || 125)}%. Version 1, built from the data we hold today.${PORTAL_ON ? '' : ' To send it to Daryl: Progress &amp; reports → Reports → Client growth (NRR).'}</p></div>
    <div class="btn-row"><button class="btn" data-action="nrrReport">Open as a report →</button></div></div>
  <section class="card">${nrrView(e)}</section>`;
}
