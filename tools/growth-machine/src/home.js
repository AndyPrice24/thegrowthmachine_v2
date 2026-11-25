/* ============================================================
   Home (TGM, agreed 24 Nov 2026): the graphite "Signal" design. Every widget opens a detail view that says where its
   figures come from, and every view can go back one step (Back button, breadcrumb, browser back or Esc).
   Views live in a small stack (HX) inside the 'hub' tab: home, days, focus, todo, people, person, req, board, item,
   dept, measure, nrr, review, portal.
   Data: the engagement (time log, days off, activities, requests, phases, reviews, milestones), items, measures
   (collection "measures": department efficiency), billing per account (NRR), founder portal feedback.
   ============================================================ */
let HX = [{ v: 'home', p: {} }];
const hxCur = () => HX[HX.length - 1];
const hxP = (v, p) => `data-hx="${v}" data-hp='${JSON.stringify(p || {}).replace(/'/g, '&#39;')}'`;
function hxGo(v, p = {}) { ui.tab = 'hub'; if (v === 'home') HX = [{ v: 'home', p: {} }]; else HX.push({ v, p }); try { history.pushState({ hx: HX.length }, ''); } catch (err) { /* file:// */ } render(); window.scrollTo(0, 0); }
/** Open the item that holds a finding, recommendation, automation, opportunity or key change; else Sources & data. */
function hxOpenFor(kind, id) {
  const e = E(); const coll = { finding: 'findings', recommendation: 'recommendations', automation: 'automations', opportunity: 'opportunities', move: 'moves' }[kind];
  const it = id && live(e.items || []).find((i) => (itemLinks(e, i)[coll] || new Set()).has(id));
  if (it) { HX = [{ v: 'home', p: {} }]; return hxGo('item', { id: it.id }); }
  ui.tab = 'data'; ui.coll = coll; render(); window.scrollTo(0, 0); toast('Not in an item yet: shown in Sources & data');
}
function hxBack() { if (HX.length > 1) { HX.pop(); render(); window.scrollTo(0, 0); } }
const HX_STAGES = STAGE_FLOW;
const HX_DN = ITEM_DEPT_NAME;
const hxF1 = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '');
const hxSgn = (v) => (v >= 0 ? '+' : '−') + hxF1(Math.abs(v));
const hxD = (s) => new Date(s + 'T00:00:00');
const hxFd = (s, o = { day: 'numeric', month: 'short' }) => (s ? hxD(s).toLocaleDateString('en-GB', o) : '');
const hxLateBy = (d) => (d && d < todayISO() ? daysBetween(d, todayISO()) : 0);

/* ---------- people: owners of requests, matched to the people list ---------- */
function hxPeople(e) {
  const P = {}; live(e.people).forEach((p) => { const first = String(p.name || '').split(/\s+/)[0]; const aka = String(p.aka || '').split(/[,\s]+/)[0]; const key = aka || first; if (key) P[key] = { key, name: p.name, title: p.title || '', firsts: [first, aka].filter(Boolean).map((x) => x.toLowerCase()) }; });
  return P;
}
function hxPerson(e, owner) {
  const P = hxPeople(e); const o = String(owner || '').trim(); if (!o) return 'Unassigned';
  const tok = o.split(/[\s(/,]+/)[0].toLowerCase();
  const byName = Object.values(P).find((p) => p.firsts.includes(tok)); if (byName) return byName.key;
  const byTitle = Object.values(P).find((p) => p.title && o.toLowerCase().includes(p.title.toLowerCase().split(/[,(]/)[0].trim()));
  if (byTitle) return byTitle.key;
  if (/^finance\b/i.test(o)) { const f = Object.values(P).find((p) => /financ/i.test(p.title)); if (f) return f.key; }
  return o.split(/\s*[(/,]\s*|\s+with\s+/)[0];
}
const hxRole = (e, k) => (hxPeople(e)[k] || {}).title || '';
const hxShow = (e, k) => (ui.share ? (hxRole(e, k) || k) : k);

/* ---------- days: calendar months, working days ---------- */
const ZA_HOLIDAYS = ['2026-01-01', '2026-03-21', '2026-04-03', '2026-04-06', '2026-04-27', '2026-05-01', '2026-06-16', '2026-08-10', '2026-09-24', '2026-12-16', '2026-12-25', '2026-12-26',
  '2027-01-01', '2027-03-22', '2027-03-26', '2027-03-29', '2027-04-27', '2027-05-01', '2027-06-16', '2027-08-09', '2027-09-24', '2027-12-16', '2027-12-25', '2027-12-27'];
function hxOff(e) { return live((e.engagement || {}).daysOff || []); }
function hxWorkdays(e, a, b) { const hol = new Set(ZA_HOLIDAYS.concat(hxOff(e).filter((o) => o.kind === 'holiday').map((o) => o.date))); const out = []; let d = a; while (d && d <= b) { const w = hxD(d).getDay(); if (w > 0 && w < 6 && !hol.has(d)) out.push(d); d = addDaysISO(d, 1); } return out; }
function hxMonths(e) {
  const g = e.engagement; if (!g.start || !g.end) return [];
  const out = []; let a = g.start;
  while (a <= g.end) { const d = hxD(a); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0); const b0 = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`; const b = b0 < g.end ? b0 : g.end;
    out.push({ a, b, name: d.toLocaleDateString('en-GB', { month: 'long' }) }); a = addDaysISO(b, 1); }
  // a stub of three working days or fewer at the end joins the month before (e.g. 1 Feb)
  if (out.length > 1 && hxWorkdays(e, out[out.length - 1].a, out[out.length - 1].b).length <= 3) { const s = out.pop(); out[out.length - 1].b = s.b; out[out.length - 1].name += ` (with ${hxFd(s.a)}${s.a !== s.b ? ' – ' + hxFd(s.b) : ''})`; }
  return out;
}
function hxDays(e) {
  const g = e.engagement; const today = todayISO(); const total = num(g.daysTotal), per = num(g.daysPerMonth);
  const log = (g.timeLog || []).map((t) => ({ date: t.date, days: num(t.days) || (t.dayType === 'Half' ? 0.5 : t.dayType === 'Full' ? 1 : 0), t }));
  const sumIn = (a, b) => log.filter((l) => l.date >= a && l.date <= b).reduce((s, l) => s + l.days, 0);
  const all = hxWorkdays(e, g.start, g.end); const el = all.filter((d) => d <= today).length; const logged = sumIn(g.start, g.end);
  const M = hxMonths(e); let mi = M.findIndex((m) => today >= m.a && today <= m.b); if (mi < 0) mi = today < g.start ? 0 : M.length - 1;
  const m = M[mi] || { a: today, b: today, name: '' }; const mw = hxWorkdays(e, m.a, m.b); const mel = mw.filter((d) => d <= today).length;
  const off = hxOff(e).filter((o) => o.kind !== 'holiday');
  const unl = mw.filter((d) => d <= today && !log.some((l) => l.date === d) && !off.some((o) => o.date === d));
  const expC = all.length ? total * el / all.length : 0;
  return { total, per, all: all.length, el, logged, expC, bankC: logged - expC, M, mi, m, mw: mw.length, mel, mlog: sumIn(m.a, m.b), byM: M.map((x) => sumIn(x.a, x.b)), unl, off, log };
}
/* Days dial. Left half: contract (0–total). Right half: this month. One line per side = days logged; a labelled notch =
   needed (contract: by today; month: the month's days). Past the notch the line turns gold = banked; short of it, a
   dashed red line = still needed. */
function hxDial(S, size = 320) {
  const c = size / 2, r = size * 0.34; const P = (th, rr) => [c + rr * Math.cos(th * Math.PI / 180), c + rr * Math.sin(th * Math.PI / 180)];
  const arc = (t0, t1, sw) => { const a = P(t0, r), b = P(t1, r); return `M${a[0].toFixed(1)} ${a[1].toFixed(1)} A${r} ${r} 0 0 ${sw} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`; };
  const MR = Math.max(S.per * 1.5, S.mlog + 1, 2);
  const sides = [{ f: (v) => 90 + 180 * Math.min(1, v / (S.total || 1)), sw: 1, max: S.total, step: 5, log: S.logged, need: S.expC, col: '#4fd18b' },
    { f: (v) => 90 - 180 * Math.min(1, v / MR), sw: 0, max: MR, step: 2, log: S.mlog, need: S.per, col: '#22c3d6' }];
  let s = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Days logged against days needed">`;
  sides.forEach((q, k) => {
    const L = q.f; const seg = (a, b, col, dash) => (b > a + 0.001 ? `<path d="${arc(L(a), L(b), q.sw)}" fill="none" stroke="${col}" stroke-width="14" ${dash ? 'stroke-dasharray="4 5"' : ''}/>` : '');
    s += `<path d="${arc(L(0), L(q.max), q.sw)}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="14"/>`;
    s += seg(0, Math.min(q.log, q.need), q.col) + seg(q.need, q.log, '#f5b83d') + seg(q.log, q.need, '#ff6b5b', true);
    for (let v = q.step; v <= q.max + 0.01; v += q.step) { if (Math.abs(v - q.need) < q.step * 0.35) continue; const th = L(v); const a = P(th, r + 10), b = P(th, r + 15), t = P(th, r + 25); const top = v >= q.max - 0.01;
      s += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#5b636f" stroke-width="1.3"/><text x="${top ? (k ? t[0] + 6 : t[0] - 6) : t[0]}" y="${t[1] + 3.5}" text-anchor="${top ? (k ? 'start' : 'end') : 'middle'}" font-size="9.5" fill="#7d8592">${Math.round(v)}</text>`; }
    const th = L(q.need), a = P(th, r - 12), b = P(th, r + 12), t = P(th, r + 40);
    s += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/><text x="${t[0]}" y="${t[1] + 4}" text-anchor="${k ? 'start' : 'end'}" font-size="10.5" font-weight="700" fill="#fff">${hxF1(q.need)}</text>`;
  });
  s += `<text x="${c}" y="${c + r + 28}" text-anchor="middle" font-size="9.5" fill="#7d8592">0</text><line x1="${c}" y1="${c - r + 26}" x2="${c}" y2="${c + r - 26}" stroke="rgba(255,255,255,.08)"/>`;
  const side = (x, an, kk, col, log, need) => { const d = log - need; return `<text x="${x}" y="${c - 40}" text-anchor="${an}" font-size="9.5" fill="${col}" font-weight="700" letter-spacing="1.1">${kk}</text><text x="${x}" y="${c - 6}" text-anchor="${an}" font-size="34" font-weight="800" fill="#eef1f5">${hxF1(log)}</text><text x="${x}" y="${c + 12}" text-anchor="${an}" font-size="10.5" fill="#9aa2ae">of ${hxF1(need)} needed</text><text x="${x}" y="${c + 40}" text-anchor="${an}" font-size="18" font-weight="800" fill="${d >= 0 ? '#f5b83d' : '#ff8a7a'}">${d >= 0 ? '+' + hxF1(d) : hxF1(-d)}</text><text x="${x}" y="${c + 54}" text-anchor="${an}" font-size="10" fill="${d >= 0 ? '#f5b83d' : '#ff8a7a'}">${d >= 0 ? 'banked' : 'still needed'}</text>`; };
  s += side(c - 12, 'end', 'CONTRACT', '#4fd18b', S.logged, S.expC) + side(c + 12, 'start', String(S.m.name || '').split(' ')[0].toUpperCase(), '#22c3d6', S.mlog, S.per);
  return s + '</svg>';
}
function hxDialKey() {
  const k = (bg, t) => `<span><i style="display:inline-block;width:16px;height:5px;border-radius:2px;vertical-align:middle;margin-right:6px;background:${bg}"></i>${t}</span>`;
  return `<div class="hx-key">${k('linear-gradient(90deg,#4fd18b 50%,#22c3d6 50%)', 'Days logged')}${k('#f5b83d', 'Banked (over what\'s needed)')}${k('repeating-linear-gradient(90deg,#ff6b5b 0 4px,transparent 4px 8px)', 'Still needed')}<span><i style="display:inline-block;width:3px;height:12px;background:#fff;border-radius:2px;vertical-align:middle;margin-right:6px"></i>Needed</span></div>`;
}
function hxDayChips(S) {
  return `${S.unl.length ? `<span class="hx-late">${S.unl.length} not logged</span>${S.unl.map((d) => `<span class="hx-chip hx-red">${hxFd(d, { weekday: 'short', day: 'numeric' })}</span>`).join('')}` : '<span class="hx-up" style="font-size:11px;font-weight:700">Every working day accounted for</span>'}${S.off.filter((o) => o.date >= S.m.a && o.date <= S.m.b).map((o) => `<span class="hx-chip">${hxFd(o.date, { weekday: 'short', day: 'numeric' })} · off</span>`).join('')}`;
}

/* ---------- to-dos and requests ---------- */
const HX_CAT = { founders: ['Founders', 'var(--hx-or)', '◆'], client: ['Client', 'var(--hx-cy)', '✉'], ours: ['Ours', 'var(--hx-vi)', '≡'], private: ['Private', 'var(--hx-gr)', '🔒'] };
function hxCat(a) { if (a.group && HX_CAT[a.group]) return a.group; if (a.private === true || a.private === 'true') return 'private'; const t = a.title || '';
  if (/\b(Daryl|Neil|founders?)\b/i.test(t)) return 'founders'; if (/\b(Ask|Gen|Gabby|CRO|Natalie|Finance|Tevin|Product|Head of|team lead|request)/.test(t)) return 'client'; return 'ours'; }
const hxTodos = (e) => live(e.engagement.activities || []).filter((a) => a.status !== 'Done' && a.status !== 'Not needed' && !a.doneDate && !(ui.share && hxCat(a) === 'private') && !(ui.hxHideNotes && hxCat(a) === 'private'));
const hxReqs = (e) => live(e.engagement.requests || []).filter((r) => !r.receivedDate && !['Received', 'Not needed', 'Not available'].includes(r.status)).map((r) => Object.assign({}, r, { _p: hxPerson(e, r.owner) }));
const hxReqCat = (e, r) => (/^(daryl|neil)$/i.test(r._p) || /co-?founding|founder/i.test(hxRole(e, r._p)) ? 'founders' : 'client');
function hxByPerson(e) { const m = {}; hxReqs(e).forEach((r) => { (m[r._p] = m[r._p] || []).push(r); }); return Object.entries(m).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])); }
function hxLastConv(e, k) { const role = hxRole(e, k); if (!role) return null; const key = role.toLowerCase().split(/[,(]/)[0].trim(); const L = live(e.interviews).filter((iv) => (iv.role || '').toLowerCase().includes(key)).sort((a, b) => String(a.date).localeCompare(String(b.date))); return L.length ? L[L.length - 1] : null; }

/* ---------- items ---------- */
const hxItems = (e) => shellItems(e);
const hxItemDate = (e, i) => (i.nextDate ? mvDate(e, i.nextDate) : null);
function hxFruit(e) { return hxItems(e).filter((i) => FT_OPEN.includes(i.stage) && String(i.fruit) !== 'false').map((it) => ({ it, b: hxBehind(e, it) })).filter((x) => x.b.r.length && (x.b.sev >= 2 || x.b.big) && x.b.eff <= 1.5).sort((x, y) => x.b.eff - y.b.eff || y.b.sev - x.b.sev || num((y.b.big || {}).valueMonthly) - num((x.b.big || {}).valueMonthly)); }
function hxBehind(e, it) {
  const L = itemLinks(e, it); const f = live(e.findings).filter((x) => L.findings.has(x.id)); const r = live(e.recommendations).filter((x) => L.recommendations.has(x.id));
  const BASIS = { 'At risk': 0, Leaking: 1, 'Spend to review': 2 }; const ri = (x) => { const i = splitList(it.recIds).indexOf(x.fixId); return i < 0 ? 0 : i; };
  const sized = f.filter((x) => num(x.valueMonthly) > 0 && BASIS[x.basis] !== undefined).sort((a, b) => ri(a) - ri(b) || BASIS[a.basis] - BASIS[b.basis] || num(b.valueMonthly) - num(a.valueMonthly));
  return { f, r, big: sized.find((x) => x.id === it.sizeId) || sized[0] || null, sev: Math.max(0, ...f.map((x) => ({ high: 3, medium: 2, low: 1 })[x.severity] || 0)), eff: r.length ? r.reduce((s, x) => s + (num(x.effort) || 3), 0) / r.length : 3 };
}
const hxSince = (i) => (i.stageSince ? `${hxFd(i.stageSince)}${String(i.stageSinceSure) === 'true' ? '' : ' or earlier'}` : 'date not recorded');

/* ---------- measures (department efficiency) ---------- */
const HX_ST = { have: ['Measured', 'var(--hx-gr)'], partly: ['Partly', 'var(--hx-am)'], missing: ['Not yet', 'var(--hx-dim)'] };
const hxMeasures = (e, d) => live(e.measures || []).filter((m) => m.dept === d).sort((a, b) => num(a.order) - num(b.order));
/** A department measure with its value resolved: from the company health measure it points to (healthId), else its own fields. */
function msrVal(e, m) {
  const h = m.healthId && live((e.engagement || {}).health || []).find((x) => x.id === m.healthId); const r = Object.assign({}, m);
  if (h) Object.assign(r, { value: h.value, unit: h.unit, target: h.target || m.target, asAt: h.asAt, trend: h.trend, trendText: h.trendText, sources: h.source ? [{ id: h.source, part: h.part }] : m.sources });
  const n = (v) => parseFloat(String(v == null ? '' : v).replace(/[^\d.-]/g, '')); r.n = n(r.value); r.t = n(r.target);
  r.tracked = isFinite(r.n); r.hasT = r.tracked && isFinite(r.t); r.on = r.hasT && (String(r.better) === 'lower' ? r.n <= r.t : r.n >= r.t);
  r.rag = !r.tracked ? 'grey' : !r.hasT ? 'none' : r.on ? 'green' : Math.abs(r.n - r.t) / Math.abs(r.t || 1) <= 0.1 ? 'amber' : 'red';
  return r;
}
function hxDeptStats(e, d) {
  const M = hxMeasures(e, d); const st = (m) => String(m.status || 'missing').toLowerCase();
  const h = M.filter((m) => st(m) === 'have').length, p = M.filter((m) => st(m) === 'partly').length, mi = M.filter((m) => st(m) === 'missing').length;
  const scored = M.map((m) => msrVal(e, m)).filter((m) => m.hasT);
  const onT = scored.filter((m) => m.on).length;
  const broken = M.filter((m) => String(m.broken) === 'true');
  return { M, h, p, mi, scored, onT, broken, ready: M.length ? (h + 0.5 * p) / M.length : 0 };
}

/* ---------- widgets ---------- */
function hxSrc(lines) { return `<div class="hx-src"><b>Where this comes from</b><ul>${lines.filter(Boolean).map((l) => `<li>${l}</li>`).join('')}</ul></div>`; }
function hxNrrInfo(e) {
  const B = nrrBillingOn(e) ? nrrBill(e) : null; if (!B || B.trend.length < 2) return null; const T = B.trend; const a = T[T.length - 1], b = T[T.length - 2];
  const cfg = e.client.nrr || {}; const src = (e.sources || []).find((s) => s.id === cfg.source) || {};
  const due = cfg.nextDue || ''; const today = todayISO(); const late = due && due < today; const soon = due && !late && daysBetween(today, due) <= 3;
  return { B, a, b, due, late, soon, received: src.received || '', note: cfg.nextNote || '' };
}
function hxBucket(n) { return n === 0 ? 0 : n <= 7 ? 1 : n <= 14 ? 2 : 3; }
function wxFocus(e, full) {
  const f = hxCur().p.f || 'all'; const today = todayISO(); const soon = addDaysISO(today, 2);
  const T = hxTodos(e).filter((t) => f === 'all' || hxCat(t) === f); const R = hxReqs(e).filter((r) => f === 'all' || hxReqCat(e, r) === f);
  const tl = T.filter((t) => t.due && t.due <= soon).sort((a, b) => a.due.localeCompare(b.due)); const rl = R.filter((r) => r.dueDate && r.dueDate < today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const cnt = (k) => hxTodos(e).filter((t) => hxCat(t) === k && hxLateBy(t.due)).length + hxReqs(e).filter((r) => hxReqCat(e, r) === k && hxLateBy(r.dueDate)).length;
  const tabs = [['all', 'All', hxTodos(e).filter((t) => hxLateBy(t.due)).length + hxReqs(e).filter((r) => hxLateBy(r.dueDate)).length], ['founders', 'Founders', cnt('founders')], ['client', 'Client', cnt('client')], ['ours', 'Ours', cnt('ours')]].concat(ui.share ? [] : [['private', 'Private', cnt('private')]]);
  const bk = ['Due in 2 days', '1–7 days late', '8–14 days late', '15+ days late'];
  const mine = bk.map((_, i) => tl.filter((t) => hxBucket(hxLateBy(t.due)) === i).length); const theirs = bk.map((_, i) => R.filter((r) => r.dueDate && (i === 0 ? r.dueDate >= today && r.dueDate <= soon : r.dueDate < today) && hxBucket(hxLateBy(r.dueDate)) === i).length);
  const mx = Math.max(1, ...mine, ...theirs);
  const bal = `<div class="hx-well hx-bal"><div class="hx-balh"><span style="text-align:right;color:var(--hx-or)">I OWE · ${tl.filter((t) => hxLateBy(t.due)).length} late</span><span></span><span style="color:var(--hx-cy)">OWED TO ME · ${rl.length} late</span></div>
    ${bk.map((l, i) => `<div class="hx-balr"><div style="justify-content:flex-end"><b>${mine[i]}</b><i style="width:${mine[i] / mx * 100}%;background:linear-gradient(90deg,#ffb08a,var(--hx-or));border-radius:6px 0 0 6px"></i></div><span>${l}</span><div><i style="width:${theirs[i] / mx * 100}%;background:linear-gradient(90deg,var(--hx-cy),#7fe3ee);border-radius:0 6px 6px 0"></i><b>${theirs[i]}</b></div></div>`).join('')}</div>`;
  const n = full ? 999 : 5;
  const tRow = (t) => { const c = HX_CAT[hxCat(t)]; return `<button class="hx-li" ${hxP('todo', { id: t.id })}><span class="hx-sq" style="background:${c[1]}">${c[2]}</span><span><div class="hx-t">${esc(t.title)}</div><div class="hx-s">${c[0]}${t.due ? ' · due ' + hxFd(t.due) : ''}</div></span><span class="hx-late">${hxLateBy(t.due) ? hxLateBy(t.due) + 'd' : t.due ? 'soon' : ''}</span></button>`; };
  const rRow = (r) => `<button class="hx-li" ${hxP('req', { id: r.id })}><span class="hx-sq" style="background:var(--hx-cy)">${esc(String(r._p)[0] || '?')}</span><span><div class="hx-t">${esc(r.item)}</div><div class="hx-s">${esc(hxShow(e, r._p))}${r.dueDate ? ' · due ' + hxFd(r.dueDate) : ''}</div></span><span class="hx-late hx-lcy">${hxLateBy(r.dueDate) ? hxLateBy(r.dueDate) + 'd' : ''}</span></button>`;
  return `<div class="hx-tile ${full ? '' : 'hx-span2'}"><div class="hx-th"><span class="hx-k">Needs you now · and what you're waiting on</span>${full ? '' : `<button class="hx-knob" ${hxP('focus', { f })}>↗</button>`}</div>
    <div class="hx-tabs" style="margin-top:12px">${tabs.map(([k, l, c]) => `<button class="hx-tb ${f === k ? 'on' : ''}" data-hxk="f" data-hxv="${k}">${l}<b>${c}</b></button>`).join('')}</div>${bal}
    <div class="hx-two"><div><div class="hx-k" style="color:var(--hx-or);margin-bottom:4px">${full ? 'My to-dos, due now or late' : 'Top 5 to do'}</div>${tl.slice(0, n).map(tRow).join('') || '<p class="hx-note">Nothing in this group.</p>'}</div>
    <div><div class="hx-k" style="color:var(--hx-cy);margin-bottom:4px">${full ? 'Late from the client' : 'Top 5 waiting on'}</div>${rl.slice(0, n).map(rRow).join('') || '<p class="hx-note">Nothing waiting in this group.</p>'}</div></div></div>`;
}

/* ---------- views ---------- */
const HXV = {};
/* ---------- Home layout (bento, 24 Nov): each widget has its own shape on a 12-column grid ---------- */
const bxArea = (a) => `style="grid-area:${a}"`;
function bxDays(e) {
  const S = hxDays(e); if (!S.total) return '';
  return `<div class="hx-tile hx-click bx-days" ${bxArea('days')} ${hxP('days')}><div class="bx-dial">${hxDial(S, 300)}</div><div class="bx-dside"><div class="hx-th"><span class="hx-k">My days</span><span class="hx-knob">↗</span></div>
    <div class="bx-stat"><span class="hx-k" style="color:var(--hx-gr)">Contract to date</span><b>${hxSgn(S.bankC)}</b><span>${S.bankC >= 0 ? 'banked' : 'behind'} · ${hxF1(S.logged)} of ${hxF1(S.expC)} needed</span></div>
    <div class="bx-stat"><span class="hx-k" style="color:var(--hx-cy)">${esc(S.m.name.split(' ')[0])}</span><b>${S.mlog >= S.per ? hxSgn(S.mlog - S.per) : hxF1(S.per - S.mlog)}</b><span>${S.mlog >= S.per ? 'banked' : 'still needed'} · ${hxF1(S.mlog)} of ${S.per} · ${S.mw - S.mel} working days left</span></div>
    <div class="bx-chips">${hxDayChips(S)}</div>${hxDialKey()}</div></div>`;
}
function bxReview(e) {
  const today = todayISO(); const nx = splitList(e.engagement.reviewDates).filter((d) => d > today).sort()[0]; if (!nx) return `<div class="hx-tile" ${bxArea('rev')}><span class="hx-k">Next review</span><p class="hx-note">No review dates set.</p></div>`;
  const left = daysBetween(today, nx); const dec = hxItems(e).filter((i) => i.stage === 'proposed').length; const c = 62, r = 50; let seg = '';
  for (let i = 0; i < 14; i++) { const a0 = -90 + i * 360 / 14 + 2, a1 = a0 + 360 / 14 - 4; const P = (a) => [c + r * Math.cos(a * Math.PI / 180), c + r * Math.sin(a * Math.PI / 180)]; const p0 = P(a0), p1 = P(a1); const on = i >= 14 - left;
    seg += `<path d="M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${r} ${r} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}" fill="none" stroke="${on ? '#22c3d6' : 'rgba(255,255,255,.09)'}" stroke-width="9" stroke-linecap="round"/>`; }
  return `<div class="hx-tile hx-click bx-rev" ${bxArea('rev')} ${hxP('review')}><span class="hx-k">Next review</span><svg width="124" height="124" viewBox="0 0 124 124" style="display:block;margin:8px auto 4px;flex:none">${seg}<text x="62" y="62" text-anchor="middle" font-size="28" font-weight="800" fill="#eef1f5">${left}</text><text x="62" y="78" text-anchor="middle" font-size="9.5" fill="#9aa2ae">day${left === 1 ? '' : 's'} to review</text></svg>
    <div style="text-align:center"><div class="bx-revd">${hxFd(nx, { weekday: 'short', day: 'numeric', month: 'short' })}</div><div class="hx-mut" style="font-size:12px"><b style="color:var(--hx-or)">${dec}</b> decision${dec === 1 ? '' : 's'} to put to the founders</div></div></div>`;
}
function bxPortal(e) {
  const fb = live(e.reportFeedback || []); const unseen = fb.filter((x) => (x.type === 'comment' || x.type === 'flag') && !x.seen).length; const ok = Object.keys(itApprovals(e)).length; const dec = hxItems(e).filter((i) => i.stage === 'proposed').length;
  return `<div class="hx-tile hx-click bx-portal" ${bxArea('portal')} ${hxP('portal')}><span class="hx-k">Founder portal</span><div class="bx-pc bx-pch">${[[unseen, 'new comments or flags', 'var(--hx-or)'], [ok, 'go-aheads', 'var(--hx-cy)'], [dec, 'decisions waiting', '#8b93a0']].map(([n, l, c]) => `<div><b style="color:${c};border-color:${c}">${n}</b><span>${l}</span></div>`).join('')}</div></div>`;
}
function bxNrr(e) {
  const N = hxNrrInfo(e); if (!N) return `<div class="hx-tile" ${bxArea('nrr')}><span class="hx-k">Net revenue retention</span><p class="hx-note">No billing per account loaded yet.</p></div>`;
  const T = N.B.trend.slice(-6); const tgt = N.B.target; const lo = 60, hi = 140; const v = N.a.all; const d = v - N.b.all;
  const cx = 140, cy = 128, r = 86; const ang = (x) => Math.PI * (1 - (Math.min(hi, Math.max(lo, x)) - lo) / (hi - lo)); const pt = (x, rr) => [cx + rr * Math.cos(ang(x)), cy - rr * Math.sin(ang(x))];
  const arcP = (a, b, rr) => { const p0 = pt(a, rr), p1 = pt(b, rr); return `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${rr} ${rr} 0 0 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`; };
  let g = `<path d="${arcP(lo, hi, r)}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="16"/><path d="${arcP(lo, Math.min(v, 100), r)}" fill="none" stroke="#ff6b5b" stroke-width="16"/>${v > 100 ? `<path d="${arcP(100, v, r)}" fill="none" stroke="#f5b83d" stroke-width="16"/>` : ''}`;
  for (let x = lo; x <= hi; x += 20) { const a = pt(x, r + 12), b = pt(x, r + 18), t = pt(x, r + 30); g += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#5b636f" stroke-width="1.3"/><text x="${t[0]}" y="${t[1] + 3}" text-anchor="middle" font-size="9" fill="#7d8592">${x}</text>`; }
  const ta = pt(tgt, r - 12), tb = pt(tgt, r + 12), tt = pt(tgt, r + 26); g += `<line x1="${ta[0]}" y1="${ta[1]}" x2="${tb[0]}" y2="${tb[1]}" stroke="#4fd18b" stroke-width="3"/><text x="${tt[0] + 4}" y="${tt[1]}" font-size="9.5" font-weight="700" fill="#4fd18b">${tgt}%</text>`;
  const nd = pt(v, r - 30); g += `<line x1="${cx}" y1="${cy}" x2="${nd[0]}" y2="${nd[1]}" stroke="#eef1f5" stroke-width="3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="7" fill="#2a2e35" stroke="#eef1f5" stroke-width="2"/>`;
  const bar = (lab, k, col) => { const x = N.a.by[k]; if (x == null) return ''; const dd = x - (N.b.by[k] ?? x); return `<div class="bx-nb"><span>${lab}</span><i><b style="width:${Math.min(100, x / 140 * 100)}%;background:${col}"></b><em style="left:${tgt / 140 * 100}%"></em></i><span><b>${Math.round(x)}%</b> <span class="${dd >= 0 ? 'hx-up' : 'hx-dn'}">${dd >= 0 ? '▲' : '▼'}${Math.abs(dd).toFixed(1)}</span></span></div>`; };
  const W = 250, H = 46, mn = Math.min(...T.map((t) => t.all)) - 2, mx = Math.max(...T.map((t) => t.all)) + 2; const X = (i) => i * W / Math.max(1, T.length - 1), Y = (x) => H - (x - mn) / (mx - mn || 1) * H;
  const line = T.map((t, i) => `${X(i).toFixed(1)},${Y(t.all).toFixed(1)}`).join(' ');
  const st = N.late ? ['Data late', 'var(--hx-red)'] : N.soon ? ['Data due soon', 'var(--hx-am)'] : ['On schedule', 'var(--hx-gr)'];
  return `<div class="hx-tile hx-click bx-nrr" ${bxArea('nrr')} ${hxP('nrr')}><div class="hx-th"><span class="hx-k">Net revenue retention</span><span class="bx-fresh"><span class="hx-light" style="--c:${st[1]}"></span>${st[0]}</span></div>
    <div class="bx-gauge"><svg width="280" height="138" viewBox="0 0 280 138">${g}</svg></div><div class="bx-gv"><b>${Math.round(v)}%</b><span class="${d >= 0 ? 'hx-up' : 'hx-dn'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)} pts on last month</span></div>
    ${bar('Direct', 'direct', 'linear-gradient(90deg,#15a3b8,#5fe0ee)')}${bar('Resellers', 'reseller', 'linear-gradient(90deg,#d9531f,#ff9a6a)')}
    <div class="bx-spark"><svg width="100%" height="${H + 4}" viewBox="0 -2 ${W} ${H + 4}" preserveAspectRatio="none"><defs><linearGradient id="bxg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a3d" stop-opacity=".45"/><stop offset="1" stop-color="#22c3d6" stop-opacity="0"/></linearGradient></defs><polygon points="0,${H} ${line} ${W},${H}" fill="url(#bxg)"/><polyline points="${line}" fill="none" stroke="#ffb08a" stroke-width="2"/></svg><div class="bx-sl">${T.map((t) => `<span>${keyLabel(t.k).split(' ')[0]}</span>`).join('')}</div></div>
    <div class="hx-note" style="margin-top:4px">Data to ${esc(keyLabel(N.B.last))}${N.due ? ' · next due ' + esc(hxFd(N.due)) : ''}</div></div>`;
}
function bxFocus(e) {
  const f = hxCur().p.f || 'all'; const today = todayISO(); const soon = addDaysISO(today, 2);
  const T = hxTodos(e).filter((t) => f === 'all' || hxCat(t) === f); const R = hxReqs(e).filter((r) => f === 'all' || hxReqCat(e, r) === f);
  const tl = T.filter((t) => t.due && t.due <= soon).sort((a, b) => a.due.localeCompare(b.due)); const rl = R.filter((r) => r.dueDate && r.dueDate < today).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const cnt = (k) => hxTodos(e).filter((t) => hxCat(t) === k && hxLateBy(t.due)).length + hxReqs(e).filter((r) => hxReqCat(e, r) === k && hxLateBy(r.dueDate)).length;
  const tabs = [['all', 'All', hxTodos(e).filter((t) => hxLateBy(t.due)).length + hxReqs(e).filter((r) => hxLateBy(r.dueDate)).length], ['founders', 'Founders', cnt('founders')], ['client', 'Client', cnt('client')], ['ours', 'Ours', cnt('ours')]].concat(ui.share ? [] : [['private', 'Private', cnt('private')]]);
  const bk = ['due ≤2d', '1–7d late', '8–14d', '15d+']; const mine = bk.map((_, i) => tl.filter((t) => hxBucket(hxLateBy(t.due)) === i).length); const theirs = bk.map((_, i) => R.filter((r) => r.dueDate && (i === 0 ? r.dueDate >= today && r.dueDate <= soon : r.dueDate < today) && hxBucket(hxLateBy(r.dueDate)) === i).length); const mx = Math.max(1, ...mine, ...theirs);
  const tRow = (t) => { const c = HX_CAT[hxCat(t)]; return `<button class="bx-row" ${hxP('todo', { id: t.id })}><i style="background:${c[1]}"></i><span>${esc(t.title)}</span><em>${hxLateBy(t.due) ? hxLateBy(t.due) + 'd' : 'soon'}</em></button>`; };
  const rRow = (r) => `<button class="bx-row" ${hxP('req', { id: r.id })}><i style="background:var(--hx-cy)"></i><span>${esc(r.item)} <small>· ${esc(hxShow(e, r._p))}</small></span><em class="hx-lcy">${hxLateBy(r.dueDate)}d</em></button>`;
  return `<div class="hx-tile bx-focus" ${bxArea('focus')}><div class="hx-th"><span class="hx-k">Needs you now · and what you're waiting on</span><button class="hx-knob" ${hxP('focus', { f })}>↗</button></div>
    <div class="hx-tabs" style="margin:10px 0 8px">${tabs.map(([k, l, c]) => `<button class="hx-tb ${f === k ? 'on' : ''}" data-hxk="f" data-hxv="${k}">${l}<b>${c}</b></button>`).join('')}</div>
    <div class="bx-bal"><div class="bx-bh"><span style="color:var(--hx-or)">I owe · ${tl.filter((t) => hxLateBy(t.due)).length} late</span><span></span><span style="color:var(--hx-cy)">Owed to me · ${rl.length} late</span></div>${bk.map((l, i) => `<div class="bx-br"><div><b>${mine[i]}</b><i style="width:${mine[i] / mx * 100}%"></i></div><span>${l}</span><div><i style="width:${theirs[i] / mx * 100}%"></i><b>${theirs[i]}</b></div></div>`).join('')}</div>
    <div class="bx-lists"><div>${tl.slice(0, 7).map(tRow).join('') || '<p class="hx-note">Nothing here.</p>'}</div><div>${rl.slice(0, 7).map(rRow).join('') || '<p class="hx-note">Nothing waiting.</p>'}</div></div></div>`;
}
function bxPeople(e) {
  const R = hxReqs(e); const P = hxByPerson(e); const mx = Math.max(1, ...P.map(([, L]) => L.length));
  return `<div class="hx-tile bx-people" ${bxArea('people')}><div class="hx-th"><span class="hx-k" style="color:#ff8a8a">Waiting on ${esc(e.client.name)}</span><button class="hx-knob hot" ${hxP('people')}>!</button></div>
    <div class="bx-pbig"><b>${R.filter((r) => hxLateBy(r.dueDate)).length}</b><span>late of ${R.length} requests</span></div>
    ${P.map(([p, L]) => { const late = L.filter((r) => hxLateBy(r.dueDate)).length; return `<button class="bx-pr" ${hxP('person', { n: p })}><span class="bx-pn">${esc(hxShow(e, p))}<small>${ui.share ? '' : esc(hxRole(e, p))}</small></span><span class="bx-pbar"><i style="width:${late / mx * 100}%;background:linear-gradient(90deg,#e8443a,#ff8a7a)"></i><i style="width:${(L.length - late) / mx * 100}%;background:rgba(34,195,214,.55)"></i></span><b>${L.length}</b></button>`; }).join('')}
    <div class="hx-key" style="margin-top:6px"><span><i style="display:inline-block;width:10px;height:6px;border-radius:2px;background:#ff6b5b;margin-right:5px"></i>Late</span><span><i style="display:inline-block;width:10px;height:6px;border-radius:2px;background:rgba(34,195,214,.55);margin-right:5px"></i>Not due yet</span></div></div>`;
}
function bxAhead(e) {
  const today = todayISO(); const g = e.engagement; const L = [];
  live(g.milestones).forEach((m) => { if (m.date && m.date >= today) L.push([m.date, m.title, m.detail || '']); });
  splitList(g.reviewDates).forEach((d) => { if (d >= today && !L.some((x) => x[0] === d)) L.push([d, 'Fortnightly review', '']); });
  (g.phases || []).forEach((p) => { if (p.start > today) L.push([p.start, p.name + ' starts', 'Engagement phase']); });
  const N = hxNrrInfo(e); if (N && N.due && N.due >= today) L.push([N.due, 'Billing data due from Finance', 'Next NRR update']);
  hxItems(e).forEach((i) => { const d = hxItemDate(e, i); if (d && d >= today && d <= addDaysISO(today, 14) && i.stage !== 'live') L.push([d, i.title, i.next || '']); });
  const S = L.sort((a, b) => a[0].localeCompare(b[0])).slice(0, 5);
  return `<div class="hx-tile hx-warm bx-ahead" ${bxArea('ahead')}><div class="hx-k" style="color:#f2dcb6;position:relative">Ahead</div><div class="bx-tl">${S.map(([d, t, s]) => `<div class="bx-te"><span class="bx-tdot"></span><span class="bx-td">${hxFd(d, { weekday: 'short', day: 'numeric', month: 'short' })} · ${daysBetween(today, d)}d</span><b>${esc(t)}</b>${s ? `<small>${esc(s)}</small>` : ''}</div>`).join('') || '<p class="hx-note">Nothing dated ahead.</p>'}</div></div>`;
}
function bxWork(e) {
  const today = todayISO(); const open = hxItems(e).filter((i) => i.stage !== 'parked');
  const cell = (d, s) => open.filter((i) => splitList(i.depts).includes(d) && i.stage === s).length; const mx = Math.max(1, ...ITEM_DEPTS.flatMap(([d]) => HX_STAGES.map(([s]) => cell(d, s))));
  const soon = open.filter((i) => { const d = hxItemDate(e, i); return d && d <= addDaysISO(today, 7) && i.stage !== 'live'; }).sort((a, b) => hxItemDate(e, a).localeCompare(hxItemDate(e, b)));
  const dec = open.filter((i) => i.stage === 'proposed').sort((a, b) => String(a.stageSince || '9').localeCompare(String(b.stageSince || '9')));
  const row = (i, tag, col) => `<button class="bx-row" ${hxP('item', { id: i.id })}><i style="background:${col}"></i><span>${esc(i.title)}</span><em style="color:${col}">${tag}</em></button>`;
  return `<div class="hx-tile bx-work" ${bxArea('work')}><div class="hx-th"><span class="hx-k">The work · department × stage</span><button class="hx-knob" ${hxP('board', {})}>↗</button></div>
    <div class="bx-wg"><table class="hx-tbl hx-grid"><tr><th></th>${HX_STAGES.map(([, n]) => `<th>${esc(n.slice(0, 5))}</th>`).join('')}</tr>${ITEM_DEPTS.map(([d, n]) => `<tr><td style="white-space:nowrap"><span class="hx-dot" style="--c:var(--gd-${d})"></span> ${esc(n.split(/ [&,]/)[0])}</td>${HX_STAGES.map(([s]) => { const c = cell(d, s); return `<td><button ${hxP('board', { d, s })} class="hx-cell" style="color:${c ? '#0e1114' : 'var(--hx-dim)'};background:${c ? `rgba(255,122,61,${0.25 + 0.75 * c / mx})` : 'rgba(255,255,255,.03)'}">${c || '·'}</button></td>`; }).join('')}</tr>`).join('')}</table>
    <div class="bx-wl"><div class="hx-k" style="color:var(--hx-am)">Next step due in 7 days · ${soon.length}</div>${soon.slice(0, 4).map((i) => row(i, hxFd(hxItemDate(e, i)), hxItemDate(e, i) < today ? '#ff8a7a' : 'var(--hx-am)')).join('')}
    <div class="hx-k" style="color:var(--hx-or);margin-top:10px">Waiting for a founder decision · ${dec.length}</div>${dec.slice(0, 3).map((i) => row(i, i.stageSince ? daysBetween(i.stageSince, today) + (String(i.stageSinceSure) === 'true' ? '' : '+') + 'd' : '—', 'var(--hx-or)')).join('')}</div></div></div>`;
}
function bxStages(e) {
  const its = hxItems(e); const cols = { found: '#5b636f', investigating: '#9b7bff', proposed: '#ff7a3d', approved: '#f5b83d', underway: '#22c3d6', live: '#4fd18b', parked: '#3a3f48' };
  const L = ITEM_STAGES.map(([k, n]) => [k, n, its.filter((i) => i.stage === k).length]).filter((x) => x[2]); const tot = L.reduce((s, x) => s + x[2], 0) || 1; const r = 54, C = 2 * Math.PI * r; let off = 0;
  const arcs = L.map(([k, , n]) => { const len = C * n / tot; const a = `<circle cx="70" cy="70" r="${r}" fill="none" stroke="${cols[k]}" stroke-width="18" stroke-dasharray="${Math.max(0, len - 2).toFixed(1)} ${C}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 70 70)"/>`; off += len; return a; }).join('');
  return `<div class="hx-tile hx-click bx-stages" ${bxArea('stages')} ${hxP('board', {})}><span class="hx-k">Items by stage</span><svg width="140" height="140" viewBox="0 0 140 140" style="display:block;margin:8px auto 6px">${arcs}<text x="70" y="70" text-anchor="middle" font-size="26" font-weight="800" fill="#eef1f5">${its.length}</text><text x="70" y="86" text-anchor="middle" font-size="9.5" fill="#9aa2ae">items</text></svg>
    <div class="bx-leg">${L.map(([k, n, c]) => `<span><i style="background:${cols[k]}"></i>${esc(n)}<b>${c}</b></span>`).join('')}</div></div>`;
}
function bxFruit(e) {
  const fr = hxFruit(e);
  return `<div class="hx-tile bx-fruit" ${bxArea('fruit')}><div class="hx-th"><span class="hx-k" style="color:var(--hx-gr)">Lowest-hanging fruit · ${fr.length}</span></div>${fr.slice(0, 5).map((x) => `<button class="bx-fr" ${hxP('item', { id: x.it.id })}><span><b class="bx-frt">${esc(x.it.title)}</b><small>${splitList(x.it.depts).map((dd) => `<i class="hx-dot" style="--c:var(--gd-${dd})"></i>`).join(' ')} ${x.b.eff <= 1.25 ? 'Low effort' : 'Low–moderate effort'} · ${x.b.sev >= 3 ? 'high impact' : 'medium impact'}</small></span><b>${x.b.big ? 'R' + Math.round(num(x.b.big.valueMonthly) / 1000) + 'k<small>/mo</small>' : ''}</b></button>`).join('') || '<p class="hx-note">Nothing low-effort waiting.</p>'}</div>`;
}
function bxDept(e, d, i) {
  const its = hxItems(e).filter((x) => splitList(x.depts).includes(d) && x.stage !== 'parked'); const S = hxDeptStats(e, d); const ex = ui.hxExample;
  const light = S.broken.length ? 'var(--hx-red)' : (S.mi || S.p) ? 'var(--hx-am)' : S.M.length ? 'var(--hx-gr)' : 'var(--hx-dim)';
  const exS = { lead: [2, 3], sales: [1, 4], cs: [3, 5], ops: [2, 4], prod: [0, 2], admin: [2, 4] }[d] || [0, 0];
  const pct = ex ? exS[0] / (exS[1] || 1) : S.scored.length ? S.onT / S.scored.length : S.ready; const r = 30, C = 2 * Math.PI * r;
  const mxs = Math.max(1, ...HX_STAGES.map(([s]) => its.filter((x) => x.stage === s).length));
  return `<div class="hx-tile hx-click bx-dept" style="grid-area:d${i};--dc:var(--gd-${d})" ${hxP('dept', { d })}>${ex ? '<span class="hx-ex">EXAMPLE</span>' : ''}<span class="hx-edge"></span>
    <div class="hx-th"><span class="bx-dn">${esc(HX_DN[d].split(/ [&,]/)[0])}</span>${ex ? '' : `<span class="hx-light" style="--c:${light}"></span>`}</div>
    <div class="bx-dm"><svg width="76" height="76" viewBox="0 0 76 76"><circle cx="38" cy="38" r="${r}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="8"/><circle cx="38" cy="38" r="${r}" fill="none" stroke="var(--dc)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${(C * pct).toFixed(1)} ${C}" transform="rotate(-90 38 38)"/><text x="38" y="42" text-anchor="middle" font-size="15" font-weight="800" fill="#eef1f5">${Math.round(pct * 100)}%</text></svg>
      <div><b>${ex ? exS[0] + ' of ' + exS[1] : S.scored.length ? S.onT + ' of ' + S.scored.length : S.h + ' of ' + S.M.length}</b><span>${ex || S.scored.length ? 'on target' : 'measured · not scored yet'}</span></div></div>
    <div class="bx-ms">${S.M.map((m) => `<i title="${esc(m.name)}: ${esc((HX_ST[String(m.status).toLowerCase()] || HX_ST.missing)[0])}" style="background:${(HX_ST[String(m.status).toLowerCase()] || HX_ST.missing)[1]}"></i>`).join('')}<span>${S.M.length} measures</span></div>
    ${S.M.filter((m) => String(m.status).toLowerCase() === 'missing').slice(0, 1).map((m) => `<div class="bx-next">Next to set up: ${esc(m.name)}</div>`).join('')}
    <div class="bx-sb">${HX_STAGES.map(([s, n]) => { const c = its.filter((x) => x.stage === s).length; return `<div title="${esc(n)}: ${c}"><i style="height:${c ? 6 + 20 * c / mxs : 2}px"></i><b>${c}</b><span>${esc(n[0])}</span></div>`; }).join('')}</div></div>`;
}
function bxTools() {
  return `<div class="bx-tools"><button class="hx-tg" data-hxtog="hxHideNotes"><s class="${ui.hxHideNotes ? '' : 'on'}"></s>TGM notes</button><button class="hx-tg" data-action="share"><s class="${ui.share ? 'on' : ''}"></s>Screen share</button>${syncSupported() ? '<button class="hx-pl" data-action="syncCheck">⟳ Updates</button>' : ''}<button class="hx-pl" data-action="exportJSON">Back up</button></div>`;
}
HXV.home = (e) => { const st = e.engagement.phases.length ? engagementStatus(e) : null; const w = st ? Math.max(1, Math.ceil(st.elapsed / 7)) : 0; const today = todayISO();
  const ph = (e.engagement.phases || []).filter((x) => x.start <= today && today <= x.end).sort((a, b) => String(b.start).localeCompare(String(a.start)))[0] || (st && st.current);
  return `<div class="bx-head"><div><h1 class="hx-pg">Home</h1><p class="hx-pgs">${esc(e.client.name)}${ph ? ' · ' + esc(ph.name) + ` (${hxFd(ph.start)} – ${hxFd(ph.end)})` : ''}${st ? ` · week ${w} of ${Math.max(1, Math.round(st.termDays / 7))}` : ''}</p></div>${bxTools()}</div>
  <div class="bx">${bxDays(e)}${bxNrr(e)}${bxReview(e)}${bxPortal(e)}${bxFocus(e)}${bxPeople(e)}${bxAhead(e)}${bxWork(e)}${bxStages(e)}${bxFruit(e)}${ITEM_DEPTS.map(([d], i) => bxDept(e, d, i)).join('')}</div>
  <div class="bx-foot"><button class="hx-tg" data-hxtog="hxExample"><s class="${ui.hxExample ? 'on' : ''}"></s>Preview department scores with example values</button></div>`; };
HXV.days = (e) => { const S = hxDays(e); const more = ui.hxPlanRest ? S.mw - S.mel : 0; const rest = S.total - S.logged - more; const left = S.M.length - 1 - S.mi; const perRest = left > 0 ? rest / left : 0;
  const phaseName = (id) => ((e.engagement.phases || []).find((p) => p.id === id) || {}).name || id || '';
  const dayRow = (d) => { const lg = S.log.find((l) => l.date === d), off = S.off.find((o) => o.date === d); const [t, c] = off ? ['off' + (off.why ? ' · ' + off.why : ''), 'var(--hx-dim)'] : lg ? ['logged', 'var(--hx-gr)'] : ['not logged', '#ff8a7a'];
    return `<span class="hx-pl" style="border:1px solid ${c}"><b>${hxFd(d, { weekday: 'short', day: 'numeric' })}</b> <span style="color:${c}">${esc(t)}</span>${!lg && !off ? ` <button class="hx-mini-b" data-action="addDay" data-id="${d}">Log</button> <button class="hx-mini-b" data-hxoff="${d}">Off</button>` : ''}</span>`; };
  const hol = hxOff(e).filter((o) => o.kind === 'holiday' && o.date >= S.m.a && o.date <= S.m.b && o.date <= todayISO());
  return `<h1 class="hx-pg">My days</h1><p class="hx-pgs">Contract: ${S.total} days from ${hxFd(e.engagement.start, { day: 'numeric', month: 'short', year: 'numeric' })} to ${hxFd(e.engagement.end, { day: 'numeric', month: 'short', year: 'numeric' })}, ${S.per} a month. Working days exclude weekends and public holidays.</p>
  <div class="hx-gdays"><div class="hx-tile">${hxDial(S)}${hxDialKey()}</div><div class="hx-tile"><div class="hx-th"><span class="hx-k">Planning: the rest of the term</span>${left > 0 ? `<button class="hx-tg" data-hxtog="hxPlanRest"><s class="${ui.hxPlanRest ? 'on' : ''}"></s>Also count the ${S.mw - S.mel} working days left in ${esc(S.m.name.split(' ')[0])} as worked</button>` : ''}</div>
    <table class="hx-tbl" style="margin-top:10px"><tr><th>Month</th><th>Working days</th><th>Needed</th><th>Logged</th><th>Over / under</th><th>Plan for the rest</th></tr>
    ${S.M.map((m, i) => { const lg = S.byM[i] + (i === S.mi ? more : 0); const isCur = i === S.mi; return `<tr><td><b>${esc(m.name)}</b>${isCur ? ' <span class="hx-chip" style="color:var(--hx-cy);border-color:var(--hx-cy)">now</span>' : ''}</td><td class="hx-mut">${hxWorkdays(e, m.a, m.b).length}</td><td>${S.per}</td><td>${hxF1(lg)}</td><td class="${lg - S.per >= 0 ? 'hx-up' : 'hx-mut'}">${i <= S.mi ? hxSgn(lg - S.per) : '—'}</td><td>${i > S.mi ? `<b>${hxF1(perRest)}</b> days <span class="hx-mut">(${hxF1(Math.max(0, S.per - perRest))} free for other work)</span>` : '—'}</td></tr>`; }).join('')}</table>
    ${left > 0 ? `<div class="hx-well" style="padding:12px 14px;margin-top:12px;line-height:1.6">${hxF1(rest)} of ${S.total} days left after ${esc(S.m.name.split(' ')[0])}${ui.hxPlanRest ? ' (if you work the rest of the month)' : ''}. Spread over the ${left} remaining month${left === 1 ? '' : 's'}: <b>${hxF1(perRest)} a month</b> against ${S.per}, so about <b class="hx-up">${hxF1(Math.max(0, S.per - perRest))} days a month</b> are free for other projects if the total stays at ${S.total}.</div>` : ''}</div></div>
  <div class="hx-sh"><h3>${esc(S.m.name.split(' ')[0])}: every working day so far</h3><i></i></div><div class="hx-tile"><div class="hx-ctl">${hxWorkdays(e, S.m.a, S.m.b).filter((d) => d <= todayISO()).map(dayRow).join('')}${hol.map((o) => `<span class="hx-pl"><b>${hxFd(o.date, { weekday: 'short', day: 'numeric' })}</b> <span class="hx-dim">holiday</span></span>`).join('')}</div></div>
  <div class="hx-sh"><h3>Time log · ${S.log.length} entries</h3><i></i></div><div class="hx-tile"><table class="hx-tbl"><tr><th>Date</th><th>Days</th><th>Phase</th><th>What happened</th></tr>${S.log.slice().sort((a, b) => b.date.localeCompare(a.date)).map((l) => `<tr><td style="white-space:nowrap">${hxFd(l.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td><td>${l.days}</td><td class="hx-mut" style="white-space:nowrap">${esc(phaseName(l.t.phaseId))}</td><td class="hx-mut" style="font-size:12px">${esc(String(l.t.items || '').split('\n')[0])}</td></tr>`).join('')}</table>
  ${hxSrc(['The Studio time log (Our work → Progress &amp; time).', `Contract: ${S.total} days, ${S.per} a month${e.engagement.frontLoad && e.engagement.frontLoad.agreed ? '; front-loading agreed ' + hxFd(e.engagement.frontLoad.agreed) : ''}.`, 'South African public holidays, plus days off recorded for this client (engagement.daysOff).'])}</div>`; };
HXV.focus = (e) => `<h1 class="hx-pg">Needs you now &amp; waiting on</h1><p class="hx-pgs">Everything due or late, oldest first. The filters apply to both sides.</p>${wxFocus(e, true)}
  <div class="hx-two" style="margin-top:18px"><div class="hx-tile"><div class="hx-k" style="color:var(--hx-or)">All open to-dos</div>${hxTodos(e).filter((t) => (hxCur().p.f || 'all') === 'all' || hxCat(t) === hxCur().p.f).sort((a, b) => (a.due || '9').localeCompare(b.due || '9')).map((t) => `<button class="hx-li" ${hxP('todo', { id: t.id })}><span class="hx-sq" style="background:${HX_CAT[hxCat(t)][1]}">${HX_CAT[hxCat(t)][2]}</span><span><div class="hx-t">${esc(t.title)}</div><div class="hx-s">${HX_CAT[hxCat(t)][0]}${t.due ? ' · due ' + hxFd(t.due) : ''}</div></span><span class="hx-late">${hxLateBy(t.due) ? hxLateBy(t.due) + 'd' : ''}</span></button>`).join('')}</div>
  <div class="hx-tile"><div class="hx-k" style="color:var(--hx-cy)">All open requests</div>${hxReqs(e).filter((r) => (hxCur().p.f || 'all') === 'all' || hxReqCat(e, r) === hxCur().p.f).sort((a, b) => (a.dueDate || '9').localeCompare(b.dueDate || '9')).map((r) => `<button class="hx-li" ${hxP('req', { id: r.id })}><span class="hx-sq" style="background:var(--hx-cy)">${esc(String(r._p)[0])}</span><span><div class="hx-t">${esc(r.item)}</div><div class="hx-s">${esc(hxShow(e, r._p))}${r.dueDate ? ' · due ' + hxFd(r.dueDate) : ''}</div></span><span class="hx-late hx-lcy">${hxLateBy(r.dueDate) ? hxLateBy(r.dueDate) + 'd' : ''}</span></button>`).join('')}</div></div>`;
HXV.todo = (e) => { const t = live(e.engagement.activities).find((x) => x.id === hxCur().p.id); if (!t) return '<p>This to-do no longer exists.</p>'; const c = HX_CAT[hxCat(t)]; const ph = (e.engagement.phases || []).find((p) => p.id === t.phaseId);
  return `<h1 class="hx-pg hx-pgsm">${esc(t.title)}</h1><div class="hx-tile hx-narrow"><dl class="hx-kv"><dt>Group</dt><dd><span class="hx-light" style="--c:${c[1]}"></span> ${c[0]}</dd><dt>Due</dt><dd>${t.due ? hxFd(t.due, { weekday: 'short', day: 'numeric', month: 'short' }) : '—'}${hxLateBy(t.due) ? ` · <span class="hx-late">${hxLateBy(t.due)} days late</span>` : ''}</dd><dt>Status</dt><dd>${esc(t.status || 'Open')}</dd><dt>Phase</dt><dd>${esc(ph ? ph.name : '—')}</dd></dl>
  <div class="hx-ctl" style="margin-top:16px"><button class="hx-pl" data-hxdo="todoDone" data-id="${esc(t.id)}">Mark done</button><button class="hx-pl" data-hxdo="todoWeek" data-id="${esc(t.id)}">Move a week</button></div>
  ${hxSrc([`The Studio to-do list (engagement activities), id ${esc(t.id)}.`, 'Group: set on the to-do, or by rule (names a founder → Founders; asks a client person → Client; private → Private; else Ours).'])}</div>`; };
HXV.people = (e) => `<h1 class="hx-pg">Waiting on ${esc(e.client.name)}</h1><p class="hx-pgs">${hxReqs(e).length} open requests, ${hxReqs(e).filter((r) => hxLateBy(r.dueDate)).length} past their date, by person.</p><div class="hx-g3">${hxByPerson(e).map(([p, L]) => `<div class="hx-tile hx-click" ${hxP('person', { n: p })}><div class="hx-th"><span style="font-weight:800;font-size:16px">${esc(hxShow(e, p))}</span><span class="hx-knob ${L.some((r) => hxLateBy(r.dueDate)) ? 'hot' : ''}">${L.length}</span></div><div class="hx-mut">${ui.share ? '' : esc(hxRole(e, p))}</div><div style="margin-top:10px;font-size:12px"><span class="hx-late">${L.filter((r) => hxLateBy(r.dueDate)).length} late</span> · oldest ${Math.max(0, ...L.map((r) => hxLateBy(r.dueDate)))} days past due</div></div>`).join('')}</div>`;
HXV.person = (e) => { const p = hxCur().p.n; const L = hxReqs(e).filter((r) => r._p === p).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || '')); const lr = L.map((r) => r.requestedDate).filter(Boolean).sort().pop(); const c = hxLastConv(e, p);
  return `<h1 class="hx-pg">${esc(hxShow(e, p))}</h1><p class="hx-pgs">${ui.share ? '' : esc(hxRole(e, p)) + ' · '}${L.length} open, ${L.filter((r) => hxLateBy(r.dueDate)).length} late${lr ? ' · last request sent ' + hxFd(lr) : ''}${c ? ' · last conversation on record ' + hxFd(c.date) : ''}</p>
  <div class="hx-tile">${L.map((r) => `<button class="hx-li" ${hxP('req', { id: r.id })}><span class="hx-sq" style="background:${hxLateBy(r.dueDate) ? 'linear-gradient(145deg,#ff8a7a,#e8443a)' : 'var(--hx-cy)'}">${hxLateBy(r.dueDate) ? '!' : '…'}</span><span><div class="hx-t">${esc(r.item)}</div><div class="hx-s">Asked ${hxFd(r.requestedDate) || '—'} · due ${hxFd(r.dueDate) || '—'}</div></span><span class="hx-late">${hxLateBy(r.dueDate) ? hxLateBy(r.dueDate) + ' days late' : 'on time'}</span></button>`).join('')}</div>`; };
HXV.req = (e) => { const r = hxReqs(e).find((x) => x.id === hxCur().p.id) || live(e.engagement.requests).find((x) => x.id === hxCur().p.id); if (!r) return '<p>This request no longer exists.</p>'; const p = r._p || hxPerson(e, r.owner);
  const w = r.requestedDate ? daysBetween(r.requestedDate, todayISO()) : null; const c = hxLastConv(e, p); const lr = hxReqs(e).filter((x) => x._p === p).map((x) => x.requestedDate).filter(Boolean).sort().pop();
  return `<h1 class="hx-pg hx-pgsm">${esc(r.item)}</h1><div class="hx-g3 hx-narrow"><div class="hx-tile"><div class="hx-k">Waiting</div><div class="hx-big" style="margin-top:8px">${w ?? '—'}<small>days since asked</small></div></div><div class="hx-tile ${hxLateBy(r.dueDate) ? 'hx-alert' : ''}"><div class="hx-k">Past its date</div><div class="hx-big" style="margin-top:8px">${hxLateBy(r.dueDate)}<small>days</small></div></div><div class="hx-tile"><div class="hx-k">From</div><div style="font-size:18px;font-weight:800;margin-top:8px">${esc(hxShow(e, p))}</div><div class="hx-mut">${esc(ui.share ? '' : r.owner || '')}</div></div></div>
  <div class="hx-tile hx-narrow" style="margin-top:18px"><dl class="hx-kv"><dt>Asked</dt><dd>${hxFd(r.requestedDate, { weekday: 'short', day: 'numeric', month: 'short' }) || '—'}</dd><dt>Due</dt><dd>${hxFd(r.dueDate, { weekday: 'short', day: 'numeric', month: 'short' }) || '—'}</dd><dt>Area</dt><dd>${esc(r.crit || '—')}</dd><dt>Notes and follow-ups</dt><dd>${esc(r.notes || 'None recorded')}</dd><dt>Last request to ${esc(hxShow(e, p))}</dt><dd>${hxFd(lr) || '—'}</dd><dt>Last conversation on record</dt><dd>${c ? `${hxFd(c.date)} · ${esc(trunc(c.summary || c.themes || c.role || '', 160))}` : 'None linked'}</dd></dl>
  <div class="hx-ctl" style="margin-top:16px"><button class="hx-pl" data-hxdo="reqReceived" data-id="${esc(r.id)}">Mark received</button><button class="hx-pl" data-hxdo="reqNotNeeded" data-id="${esc(r.id)}">Not needed</button><button class="hx-pl ${hxCur().p.rp === 'assign' ? 'on' : ''}" data-hxk="rp" data-hxv="${hxCur().p.rp === 'assign' ? '' : 'assign'}">Reassign</button><button class="hx-pl ${hxCur().p.rp === 'query' ? 'on' : ''}" data-hxk="rp" data-hxv="${hxCur().p.rp === 'query' ? '' : 'query'}">Query</button></div>
  ${hxCur().p.rp === 'assign' ? hxReqAssign(e, r) : ''}${hxCur().p.rp === 'query' ? hxReqQuery(e, r) : ''}
  ${hxSrc([`The Studio's information requests (Our work → What we need), id ${esc(r.id)}.`, c ? `Conversation: interview record ${esc(c.id)} (${esc(c.role || '')}).` : ''])}</div>`; };
/** Reassign a request to someone else in the organisation. */
function hxReqAssign(e, r) {
  const ppl = live(e.people || []).filter((p) => !/confirm/i.test(p.title || '')).slice().sort((a, b) => String(a.departmentId).localeCompare(String(b.departmentId)) || String(a.title).localeCompare(String(b.title)));
  const dn = {}; live(e.departments || []).forEach((d) => { dn[d.id] = d.name; });
  return `<div class="hx-rq"><div class="hx-k">Move this request to</div><select id="hx-rq-to" class="hx-sel">${ppl.map((p) => `<option value="${esc(p.id)}">${esc(ui.share ? '' : (p.aka || String(p.name || '').split(' ')[0]) + ', ')}${esc(p.title || '')} · ${esc(dn[p.departmentId] || '')}</option>`).join('')}</select>
    <input id="hx-rq-why" class="hx-in" placeholder="Why (optional), e.g. she owns the client register now"><button class="hx-pl" data-hxdo="reqReassign" data-id="${esc(r.id)}">Move it</button><p class="hx-note">The note on the request records who it moved from, to whom, and when.</p></div>`;
}
/** Why a request exists: what it is for, what it feeds, its history; with a question ready to paste to Claude. */
function hxReqQuery(e, r) {
  const its = splitList(r.itemIds).map((id) => live(e.items || []).find((i) => i.id === id)).filter(Boolean);
  return `<div class="hx-rq"><div class="hx-k">Why this request is here</div><dl class="hx-kv"><dt>What it's for</dt><dd>${esc(r.why || 'Not recorded. Ask below.')}</dd><dt>It feeds</dt><dd>${its.length ? its.map((i) => `<button class="hx-li hx-mini" ${hxP('item', { id: i.id })}><span class="hx-t">${esc(i.title)}</span></button>`).join('') : 'No item linked yet'}</dd>
    <dt>First asked</dt><dd>${hxFd(r.requestedDate, { day: 'numeric', month: 'short' }) || '—'} · due ${hxFd(r.dueDate, { day: 'numeric', month: 'short' }) || '—'}</dd><dt>History</dt><dd>${esc(r.notes || 'None recorded')}</dd></dl>
    <div class="hx-k" style="margin-top:14px">Still not sure? Ask Claude</div><textarea id="hx-rq-q" class="hx-in" rows="3" placeholder="e.g. Why do we need this from Daryl rather than Product? Is it still needed?"></textarea>
    <button class="hx-pl" data-hxdo="reqQuery" data-id="${esc(r.id)}">Copy question for Claude</button><p class="hx-note">Copies your question with this request's details. Paste it into your Claude session; the answer can come back as an update.</p></div>`;
}
HXV.board = (e) => { const d = hxCur().p.d || '', hs = hxCur().p.s || ''; const all = hxItems(e); const its = all.filter((i) => !d || splitList(i.depts).includes(d)); const park = its.filter((i) => i.stage === 'parked');
  return `<h1 class="hx-pg">Board${d ? ' · ' + esc(HX_DN[d]) : ''}</h1><p class="hx-pgs">${its.length} items${d ? ' that touch ' + esc(HX_DN[d]) : ''}. An item appears in every department it touches.</p>
  <div class="hx-tabs" style="margin-bottom:14px"><button class="hx-tb ${!d ? 'on' : ''}" data-hxk="d" data-hxv="">Everything<b>${all.length}</b></button>${ITEM_DEPTS.map(([k, n]) => `<button class="hx-tb ${d === k ? 'on' : ''}" data-hxk="d" data-hxv="${k}"><span class="hx-dot" style="--c:var(--gd-${k})"></span> ${esc(n)}<b>${all.filter((i) => splitList(i.depts).includes(k)).length}</b></button>`).join('')}</div>
  <div class="hx-kb">${HX_STAGES.map(([s, n]) => { const L = its.filter((i) => i.stage === s); return `<div class="hx-col hx-well ${hs === s ? 'hx-hl' : ''}"><h4><span>${esc(n)}</span><span>${L.length}</span></h4>${L.map((i) => { const B = hxBehind(e, i); return `<button class="hx-card" ${hxP('item', { id: i.id })} style="--dc:var(--gd-${splitList(i.depts)[0]})"><span class="hx-cedge"></span><div class="hx-ct">${String(i.pinned) === 'true' ? '★ ' : ''}${esc(i.title)}</div><div class="hx-cm">${splitList(i.depts).map((x) => `<span class="hx-dot" style="--c:var(--gd-${x})"></span>`).join('')}${i.label ? `<span>${esc(LABEL_TXT[i.label] || i.label)}</span>` : ''}${B.big ? `<span>R${Math.round(num(B.big.valueMonthly) / 1000)}k</span>` : ''}${i.stageSince ? `<span>· ${daysBetween(i.stageSince, todayISO())}d${String(i.stageSinceSure) === 'true' ? '' : '+'} here</span>` : ''}</div></button>`; }).join('')}</div>`; }).join('')}</div>
  ${park.length ? `<div class="hx-tile" style="margin-top:14px"><span class="hx-k">Parked · ${park.length}</span> ${park.map((i) => `<button class="hx-pl" style="margin-left:8px" ${hxP('item', { id: i.id })}>${esc(i.title)}</button>`).join('')}</div>` : ''}`; };
HXV._item = (e) => { const i = live(e.items).find((x) => x.id === hxCur().p.id); if (!i) return '<p>This item no longer exists.</p>'; const B = hxBehind(e, i); const ci = HX_STAGES.findIndex(([s]) => s === i.stage);
  const srcs = (f) => dedupeRefs(f.sources || []).map((r) => `<li>${esc(sourceLine(e, r, !ui.share))}</li>`).join('');
  return `<h1 class="hx-pg hx-pgsm">${esc(i.title)}</h1><p class="hx-pgs">${splitList(i.depts).map((d) => `<span class="hx-dot" style="--c:var(--gd-${d})"></span> ${esc(HX_DN[d])}`).join(' &nbsp; ')} · ${esc(ITEM_STAGE_NAME[i.stage] || i.stage)} since ${hxSince(i)}</p>
  <div class="hx-well hx-track">${HX_STAGES.map(([s, n], k) => `<span class="${k < ci ? 'd' : k === ci ? 'n' : ''}">${esc(n)}</span>`).join('')}</div>
  <div class="hx-gitem"><div class="hx-tile"><dl class="hx-kv"><dt>Now</dt><dd>${esc(i.line || '')}</dd>${i.why ? `<dt>Why</dt><dd>${esc(i.why)}</dd>` : ''}${i.knockOn ? `<dt>Knock-on</dt><dd>${esc(i.knockOn)}</dd>` : ''}${i.willBe ? `<dt>Will be (aim)</dt><dd>${esc(i.willBe)}</dd>` : ''}<dt>Next step</dt><dd>${esc(i.next || '—')}${i.nextDate ? ` · <b>${esc(i.nextDate)}</b>` : ''}</dd><dt>Owner</dt><dd>${esc(i.owner || 'To confirm')}</dd>${B.big ? `<dt>Size</dt><dd>R${Math.round(num(B.big.valueMonthly)).toLocaleString('en-GB')} a month (${esc(String(B.big.basis).toLowerCase())})</dd>` : ''}<dt>Effort</dt><dd>${B.eff <= 1.5 ? 'Low' : B.eff <= 2.5 ? 'Moderate' : 'Larger'} (average of its fixes)</dd>${!ui.share && i.private ? `<dt>TGM only</dt><dd>${esc(i.private)}</dd>` : ''}${i.stageSinceNote ? `<dt>Stage date</dt><dd class="hx-mut">${esc(i.stageSinceNote)}</dd>` : ''}</dl><div class="hx-ctl" style="margin-top:14px"><button class="hx-pl" data-hxdo="editItems">Edit in Sources &amp; data</button></div></div>
  <div class="hx-tile"><div class="hx-k">The evidence behind it · ${B.f.length}</div>${B.f.map((f) => `<div class="hx-ev"><div style="font-weight:600;font-size:12.5px">${esc(f.title)}</div><div class="hx-mut" style="font-size:11px;margin-top:2px">Severity: ${esc(f.severity || '—')}${num(f.valueMonthly) ? ' · R' + Math.round(num(f.valueMonthly)).toLocaleString('en-GB') + ' a month' : ''}</div>${(f.sources || []).length ? `<ul class="hx-srcl">${srcs(f)}</ul>` : '<div class="hx-note">No source linked</div>'}</div>`).join('') || '<p class="hx-note">No findings linked.</p>'}</div></div>`; };
HXV.dept = (e) => { const d = hxCur().p.d; const S = hxDeptStats(e, d); const its = hxItems(e).filter((i) => splitList(i.depts).includes(d)); const ex = ui.hxExample; const exRow = (k) => [[12, '▲', 'gr'], [9, '▼', 'am'], [0, '■', 'red'], [30, '▲', 'gr'], [6, '■', 'gr'], [4, '▼', 'am']][k % 6];
  return `<h1 class="hx-pg">${esc(HX_DN[d])}</h1><p class="hx-pgs">${its.length} items · efficiency measures: ${S.h} measured, ${S.p} partly, ${S.mi} not yet</p>
  <div class="hx-g4"><div class="hx-tile"><div class="hx-k">Efficiency score</div><div class="hx-big" style="margin-top:8px">${ex ? '2<small>of 4 on target</small>' : S.scored.length ? `${S.onT}<small>of ${S.scored.length} on target</small>` : '—<small>not scored yet</small>'}</div><div class="hx-note">Measures on target out of measures tracked, shown beside those not tracked yet. Targets are set with the head once a baseline exists.</div></div>
  <div class="hx-tile"><div class="hx-k">Data health</div><div style="margin-top:10px;font-size:14px;font-weight:700"><span class="hx-light" style="--c:${ex || S.broken.length ? 'var(--hx-red)' : S.mi ? 'var(--hx-am)' : 'var(--hx-gr)'}"></span> ${ex ? '1 measure stopped reporting' : S.broken.length ? S.broken.length + ' stopped reporting' : S.mi ? S.mi + (S.mi === 1 ? ' measure' : ' measures') + ' not collected yet' : 'All measures flowing'}</div><div class="hx-note">Red: a measure that was reporting has stopped, or its data points dropped. Amber: not collected yet.</div></div>
  <div class="hx-tile"><div class="hx-k">Ready to score</div><div class="hx-big" style="margin-top:8px">${Math.round(S.ready * 100)}%</div><div class="hx-note">Measured counts 1, partly ½.</div></div>
  <div class="hx-tile"><div class="hx-k">Trend</div><div class="hx-big" style="margin-top:8px">${ex ? '<span class="hx-up">▲</span><small>last 4 weeks vs the 4 before</small>' : '—<small>needs 8 weeks of data</small>'}</div></div></div>
  <div class="hx-sh"><h3>How the department is measured</h3><i></i></div>${efDiagram(e, d)}
  <div class="hx-sh"><h3>Measures</h3><i></i><button class="hx-tg" data-hxtog="hxExample"><s class="${ex ? 'on' : ''}"></s>Preview with example values</button></div>
  <div class="hx-tile">${ex ? '<span class="hx-ex">EXAMPLE VALUES</span>' : ''}${S.M.length ? `<table class="hx-tbl"><tr><th>Measure</th><th>Source</th><th>Rhythm</th><th>Status</th><th>Data points</th><th>Trend</th></tr>${S.M.map((m, k) => { const st = HX_ST[String(m.status || 'missing').toLowerCase()] || HX_ST.missing; return `<tr class="hx-click" ${hxP('measure', { id: m.id })}><td><b>${esc(m.name)}</b><div class="hx-mut" style="font-size:11px">${esc(m.why || '')}</div></td><td class="hx-mut">${esc(m.source || '')}</td><td class="hx-mut">${esc(m.rhythm || '')}</td><td>${ex ? `<span class="hx-light" style="--c:var(--hx-${exRow(k)[2]})"></span>` : `<span class="hx-chip" style="color:${st[1]};border-color:currentColor">${st[0]}</span>`}</td><td>${ex ? exRow(k)[0] : m.points !== undefined && m.points !== '' ? esc(m.points) : String(m.status).toLowerCase() === 'missing' ? '0' : '—'}</td><td>${ex ? exRow(k)[1] : esc(m.trend || '—')}</td></tr>`; }).join('')}</table>` : '<p class="hx-note">No measures defined for this department yet. They arrive in an update file (collection "measures").</p>'}</div>
  <div class="hx-two" style="margin-top:18px"><div class="hx-tile"><div class="hx-k" style="color:var(--hx-am)">Still needed to get efficiency tracking over the line</div>${S.M.filter((m) => String(m.status).toLowerCase() !== 'have').map((m) => `<div class="hx-ev"><b style="font-size:12.5px">${esc(m.name)}</b><div class="hx-mut" style="font-size:11.5px">From ${esc(m.source || '—')}${m.note ? ' · ' + esc(m.note) : ''}</div></div>`).join('') || '<p class="hx-note">Every measure is collected.</p>'}</div>
  <div class="hx-tile"><div class="hx-k">This department's board</div>${HX_STAGES.map(([s, n]) => { const L = its.filter((i) => i.stage === s); return L.length ? `<div style="margin-top:8px"><span class="hx-mut" style="font-size:11px">${esc(n)} · ${L.length}</span>${L.map((i) => `<button class="hx-li hx-mini" ${hxP('item', { id: i.id })}><span class="hx-t">${esc(i.title)}</span></button>`).join('')}</div>` : ''; }).join('')}<button class="hx-pl" style="margin-top:10px" ${hxP('board', { d })}>Open as a board ▸</button></div></div>
  ${hxSrc(['Measures: the "measures" collection (Sources &amp; data), from the founders\' view and data plan, section 7.', 'Items: the item table (departments, stage).'])}`; };
HXV.measure = (e) => { const m0 = live(e.measures).find((x) => x.id === hxCur().p.id); const m = m0 && msrVal(e, m0); if (!m) return '<p>This measure no longer exists.</p>'; const st = HX_ST[String(m.status || 'missing').toLowerCase()] || HX_ST.missing;
  return `<h1 class="hx-pg hx-pgsm">${esc(m.name)}</h1><p class="hx-pgs">${esc(HX_DN[m.dept] || m.dept)}</p><div class="hx-tile hx-narrow"><dl class="hx-kv"><dt>Why it's collected</dt><dd>${esc(m.why || '—')}</dd><dt>Where it's collected</dt><dd>${esc(m.source || '—')}</dd><dt>How often</dt><dd>${esc(m.rhythm || '—')}</dd><dt>Status</dt><dd><span style="color:${st[1]}">${st[0]}</span>${m.note ? ' · ' + esc(m.note) : ''}</dd><dt>Value</dt><dd>${esc(m.value || '—')}${m.unit ? ' ' + esc(m.unit) : ''}${m.asAt ? ' (as at ' + esc(m.asAt) + ')' : ''}${m.healthId ? ' · from the company health measure' : ''}</dd><dt>Target</dt><dd>${esc(m.target || 'Not set yet')}</dd><dt>Data points so far</dt><dd>${esc(m.points || (String(m.status).toLowerCase() === 'missing' ? 'None' : 'Not counted yet'))}</dd><dt>Baseline</dt><dd>${esc(m.baseline || 'Mar–Sep 2026 where history exists; otherwise the first four full weeks')}</dd><dt>Level</dt><dd>Team level, never per person</dd></dl>
  ${hxSrc([`Measure record ${esc(m.id)} (Sources &amp; data → measures).`, m.planRef ? esc(m.planRef) : ''])}</div>`; };
HXV.nrr = (e) => { const N = hxNrrInfo(e); if (!N) return '<p>No billing per account loaded yet.</p>'; const T = N.B.trend; const W = 640, H = 220, L = 40; const lo = 50, hi = Math.max(130, N.B.target + 5); const y = (v) => 20 + (hi - v) / (hi - lo) * (H - 50), x = (i) => L + i * (W - L - 20) / Math.max(1, T.length - 1);
  const line = (get, c) => `<polyline points="${T.map((t, i) => x(i) + ',' + y(get(t))).join(' ')}" fill="none" stroke="${c}" stroke-width="2.5"/>${T.map((t, i) => `<circle cx="${x(i)}" cy="${y(get(t))}" r="3.5" fill="${c}"><title>${keyLabel(t.k)}: ${get(t).toFixed(1)}%</title></circle>`).join('')}`;
  const cfg = e.client.nrr || {};
  return `<h1 class="hx-pg">Net revenue retention</h1><p class="hx-pgs">The same accounts' average monthly billing over ${N.B.span} months, against the same months a year earlier.</p>
  <div class="hx-gitem"><div class="hx-tile"><svg width="100%" viewBox="0 0 ${W} ${H}">${[60, 80, 100, N.B.target].map((g) => `<line x1="${L}" x2="${W - 20}" y1="${y(g)}" y2="${y(g)}" stroke="${g === N.B.target ? '#ff4b4b' : 'rgba(255,255,255,.07)'}" ${g === N.B.target ? 'stroke-dasharray="5 4"' : ''}/><text x="${L - 6}" y="${y(g) + 4}" text-anchor="end" font-size="10" fill="#9aa2ae">${g}%</text>`).join('')}${N.B.chans.includes('direct') ? line((t) => t.by.direct, '#22c3d6') : ''}${N.B.chans.includes('reseller') ? line((t) => t.by.reseller, '#ff7a3d') : ''}${line((t) => t.all, '#eef1f5')}${T.map((t, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle" font-size="10" fill="#9aa2ae">${keyLabel(t.k)}</text>`).join('')}</svg>
    <div class="hx-ctl" style="font-size:11.5px"><span><span class="hx-dot" style="--c:#eef1f5"></span> All</span><span><span class="hx-dot" style="--c:#22c3d6"></span> Direct</span><span><span class="hx-dot" style="--c:#ff7a3d"></span> Resellers</span><span class="hx-dn">- - target ${N.B.target}%</span></div></div>
  <div class="hx-tile"><div class="hx-k">Data</div><dl class="hx-kv" style="grid-template-columns:110px 1fr;margin-top:10px"><dt>Covers</dt><dd>Billing to ${esc(keyLabel(N.B.last))}</dd><dt>Received</dt><dd>${esc(N.received || '—')}</dd><dt>Next due</dt><dd>${N.due ? hxFd(N.due, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Not set'}${N.note ? ': ' + esc(N.note) : ''}</dd><dt>Status</dt><dd><span class="hx-light" style="--c:${N.late ? 'var(--hx-red)' : N.soon ? 'var(--hx-am)' : 'var(--hx-gr)'}"></span> ${N.late ? 'Late: the next file has not arrived' : N.soon ? 'Due within 3 days' : 'On schedule'}</dd><dt>Gap to ${N.B.target}%</dt><dd>About ${fmtMoney(Math.round(N.B.all.B * N.B.target / 100 - N.B.all.C))} a month more from the same accounts</dd></dl><button class="hx-pl" style="margin-top:12px" data-action="tab" data-id="evidence" data-sub="growth">Full Client growth page ▸</button></div></div>
  <div class="hx-tile" style="margin-top:18px"><table class="hx-tbl"><tr><th>3 months to</th><th>All</th><th>Direct</th><th>Resellers</th></tr>${T.slice().reverse().slice(0, 8).map((t, i, a) => `<tr><td>${keyLabel(t.k)}</td>${[['all', t.all], ['direct', t.by.direct], ['reseller', t.by.reseller]].map(([k, v]) => { const n = a[i + 1]; const pv = n ? (k === 'all' ? n.all : n.by[k]) : null; const dd = pv == null || v == null ? null : v - pv; return `<td><b>${v == null ? '—' : v.toFixed(1) + '%'}</b> ${dd == null ? '' : `<span class="${dd >= 0 ? 'hx-up' : 'hx-dn'}" style="font-size:11px">${dd >= 0 ? '▲' : '▼'}${Math.abs(dd).toFixed(1)}</span>`}</td>`; }).join('')}</tr>`).join('')}</table>
  ${hxSrc([cfg.source ? esc(sourceLine(e, { id: cfg.source, part: cfg.part || '' }, !ui.share)) : 'Billing per account (collection "billing").', cfg.method ? esc(cfg.method) : ''])}</div>`; };
HXV.review = (e) => { const today = todayISO(); const nx = splitList(e.engagement.reviewDates).filter((d) => d > today).sort()[0]; const dec = hxItems(e).filter((i) => i.stage === 'proposed');
  return `<h1 class="hx-pg">Next fortnightly review${nx ? ' · ' + hxFd(nx, { weekday: 'short', day: 'numeric', month: 'short' }) : ''}</h1><p class="hx-pgs">${dec.length} decision${dec.length === 1 ? '' : 's'} to put to the founders.</p><div class="hx-tile">${dec.map((i) => `<button class="hx-li hx-mini" ${hxP('item', { id: i.id })}><span class="hx-t">${esc(i.title)}</span><span class="hx-mut" style="font-size:11px">${esc(i.owner || '')} · proposed since ${hxSince(i)}</span></button>`).join('')}${hxSrc(['Items at the Proposed stage; review dates from the engagement plan.'])}</div>`; };
HXV.portal = (e) => { const fb = live(e.reportFeedback || []).filter((x) => ['comment', 'flag', 'approve', 'unapprove'].includes(x.type)).sort((a, b) => String(b.at).localeCompare(String(a.at)));
  return `<h1 class="hx-pg">Founder portal</h1><p class="hx-pgs">What the founders did on their links, newest first.</p><div class="hx-tile">${fb.length ? fb.slice(0, 30).map((x) => `<div class="hx-ev"><b>${esc(x.byLabel || '')}</b> <span class="hx-mut">${x.type === 'flag' ? 'red-flagged' : x.type === 'approve' ? 'gave the go-ahead for' : x.type === 'unapprove' ? 'withdrew the go-ahead for' : 'commented on'}</span> <b>${esc(x.elementLabel || x.elementId || '')}</b> <span class="hx-mut" style="font-size:11px">· ${esc(String(x.at || '').slice(0, 10))}${x.seen ? '' : ' · new'}</span>${x.text ? `<div style="margin-top:4px">${esc(x.text)}</div>` : ''}</div>`).join('') : '<p class="hx-note">Nothing yet.</p>'}<button class="hx-pl" style="margin-top:12px" data-action="tab" data-id="progress" data-sub="report">Reports → Founder portal ▸</button>${hxSrc(['Portal feedback files in the updates folder, merged with ⟳ Updates (Report feedback).'])}</div>`; };
const HX_NAMES = { home: 'Home', days: 'My days', focus: 'Needs you now & waiting on', todo: 'To-do', people: 'Waiting on', person: 'Person', req: 'Request', board: 'Board', item: 'Item', dept: 'Department', measure: 'Measure', nrr: 'Net revenue retention', review: 'Next review', portal: 'Founder portal' };
function hxCrumb(e) { return HX.map((s, i) => { const n = s.v === 'dept' ? HX_DN[s.p.d] : s.v === 'person' ? hxShow(e, s.p.n) : s.v === 'board' && s.p.d ? 'Board · ' + HX_DN[s.p.d] : HX_NAMES[s.v]; return i === HX.length - 1 ? `<b>${esc(n)}</b>` : `<button class="hx-cb" data-hxto="${i}">${esc(n)}</button>`; }).join(' <span class="hx-dim">›</span> '); }
function viewHome(e) {
  const v = hxCur().v; let body = ''; try { body = (HXV[v] || HXV.home)(e); } catch (err) { console.error(err); body = `<div class="hx-tile">This view couldn't be shown: ${esc(err.message)}</div>`; }
  return `<div class="hx">${HX.length > 1 ? `<div class="hx-top"><button class="hx-back" data-hxback="1">← Back</button><span class="hx-crumb">${hxCrumb(e)}</span></div>` : ''}${body}</div>`;
}
/* ---------- events ---------- */
document.addEventListener('click', (ev) => {
  if (typeof PORTAL_ON !== 'undefined' && PORTAL_ON) return;
  const t = ev.target.closest('[data-hx],[data-hxback],[data-hxto],[data-hxk],[data-hxtog],[data-hxdo],[data-hxoff],[data-hxrail]'); if (!t) return;
  ev.preventDefault();
  if (t.dataset.hxrail !== undefined) { ui.hxMini = !ui.hxMini; saveUI(); render(); return; }
  if (t.dataset.hx) { if (t.dataset.hxreset) HX = [{ v: 'home', p: {} }]; return hxGo(t.dataset.hx, JSON.parse(t.dataset.hp || '{}')); }
  if (t.dataset.hxback) { try { history.back(); } catch (err) { hxBack(); } return; }
  if (t.dataset.hxto !== undefined) { HX = HX.slice(0, +t.dataset.hxto + 1); render(); window.scrollTo(0, 0); return; }
  if (t.dataset.hxk) { hxCur().p[t.dataset.hxk] = t.dataset.hxv; if (t.dataset.hxk === 'd') hxCur().p.s = ''; return render(); }
  if (t.dataset.hxtog) { ui[t.dataset.hxtog] = !ui[t.dataset.hxtog]; return render(); }
  if (t.dataset.hxoff) { const g = E().engagement; g.daysOff = Array.isArray(g.daysOff) ? g.daysOff : []; if (!g.daysOff.some((o) => o.date === t.dataset.hxoff)) g.daysOff.push({ id: 'off_' + t.dataset.hxoff, date: t.dataset.hxoff, kind: 'off', why: '' }); save(); render(); toast('Marked as a day off'); return; }
  const id = t.dataset.id; const e = E();
  if (t.dataset.hxdo === 'todoDone') { const a = e.engagement.activities.find((x) => x.id === id); if (a) { a.status = 'Done'; a.doneDate = todayISO(); touch(a); save(); toast('Done'); hxBack(); } return; }
  if (t.dataset.hxdo === 'todoWeek') { const a = e.engagement.activities.find((x) => x.id === id); if (a) { a.due = addDaysISO(a.due && a.due > todayISO() ? a.due : todayISO(), 7); touch(a); save(); render(); toast('Moved to ' + hxFd(a.due)); } return; }
  if (t.dataset.hxdo === 'reqReassign') { const r = e.engagement.requests.find((x) => x.id === id); const p = live(e.people || []).find((x) => x.id === (document.getElementById('hx-rq-to') || {}).value); if (r && p) { const was = r.owner || 'nobody'; const to = `${p.aka || String(p.name || '').split(' ')[0]} (${p.title || ''})`; const why = ((document.getElementById('hx-rq-why') || {}).value || '').trim(); r.owner = to; r.notes = `${r.notes ? r.notes + ' ' : ''}Reassigned ${fmtD(todayISO(), { day: 'numeric', month: 'short' })} from ${was} to ${to}${why ? ': ' + why : ''}.`; touch(r); save(); toast('Moved to ' + to); hxCur().p.rp = ''; render(); } return; }
  if (t.dataset.hxdo === 'reqQuery') { const r = e.engagement.requests.find((x) => x.id === id); if (r) { const q = ((document.getElementById('hx-rq-q') || {}).value || '').trim(); const its = splitList(r.itemIds).map((x) => (live(e.items || []).find((i) => i.id === x) || {}).title).filter(Boolean);
      const txt = `Query about Studio request ${r.id} (${E().client.name}).\nRequest: ${r.item}\nWaiting on: ${r.owner || '—'} · asked ${r.requestedDate || '—'} · due ${r.dueDate || '—'}\nWhy recorded: ${r.why || 'not recorded'}\nFeeds: ${its.join('; ') || 'nothing linked'}\nHistory: ${r.notes || 'none'}\n\nMy question: ${q || 'Why is this request here, and is it still needed?'}`;
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast('Copied. Paste it into your Claude session.'), () => { window.prompt('Copy this and paste it into your Claude session:', txt); }); } return; }
  if (t.dataset.hxdo === 'reqReceived' || t.dataset.hxdo === 'reqNotNeeded') { const r = e.engagement.requests.find((x) => x.id === id); if (r) { if (t.dataset.hxdo === 'reqReceived') { r.receivedDate = todayISO(); r.status = 'Received'; } else r.status = 'Not needed'; touch(r); save(); toast(t.dataset.hxdo === 'reqReceived' ? 'Marked received' : 'Marked not needed'); hxBack(); } return; }
  if (t.dataset.hxdo === 'editItems') { ui.tab = 'data'; ui.coll = 'items'; render(); window.scrollTo(0, 0); }
});
window.addEventListener('popstate', () => { if (!PORTAL_ON && ui.tab === 'hub' && HX.length > 1) { HX.pop(); render(); } });
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !PORTAL_ON && ui.tab === 'hub' && HX.length > 1 && !document.querySelector('.modal-back:not([hidden]), #modal:not([hidden])')) { try { history.back(); } catch (err) { hxBack(); } } });

/* ---------- efficiency model: measures → dimensions → department score (Studio department view and founders' page 7) ---------- */
const EF_DIMS = [['output', 'Output', 'Productive: what the team delivers'], ['speed', 'Speed', 'Expedient: how fast work moves'], ['quality', 'Quality', 'Careful: right first time'],
  ['activity', 'Activity', 'Active: the work being done and kept up'], ['input', 'Inputs and cost', 'What it takes: people, time, money'], ['improve', 'Improvement', 'Improving: tracked measures moving the right way']];
const efScore = (m) => (!m.hasT ? null : Math.max(0, Math.min(100, String(m.better) === 'lower' ? (m.n > 0 ? m.t / m.n * 100 : 100) : (m.t > 0 ? m.n / m.t * 100 : 100))));
const efGood = (m) => (m.trend === 'up' && m.better !== 'lower') || (m.trend === 'down' && m.better === 'lower');
function efModel(e, d) {
  const M = hxMeasures(e, d).map((m) => msrVal(e, m)); const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const dims = EF_DIMS.map(([k, n, s]) => { if (k === 'improve') { const tr = M.filter((m) => m.tracked && m.trend); const g = tr.filter(efGood).length; return { k, n, s, list: [], tr, good: g, score: tr.length ? g / tr.length * 100 : null }; }
    const list = M.filter((m) => (m.dim || 'output') === k); const sc = list.map(efScore).filter((x) => x != null); return { k, n, s, list, score: avg(sc), scored: sc.length }; });
  const scoredDims = dims.filter((x) => x.score != null); const score = scoredDims.length >= 3 ? avg(scoredDims.map((x) => x.score)) : null;
  return { M, dims, score, scoredDims: scoredDims.length, tracked: M.filter((m) => m.tracked).length };
}
function efDiagram(e, d) {
  const F = efModel(e, d); const W = 980, bh = 30, gap = 6, gg = 18, top = 30; let y = top; const rows = []; const dn = [];
  F.dims.forEach((D) => { const items = D.k === 'improve' ? [{ pseudo: true }] : D.list; const y0 = y; items.forEach((m) => { rows.push({ m, y, D }); y += bh + gap; }); const y1 = y - gap; dn.push(Object.assign(D, { cy: (y0 + y1) / 2 })); y += gg; });
  const H = Math.max(y - gg + 20, 300); const sx = 340, dx = 560, dw = 210, cx = 880, cy = H / 2;
  const col = (m) => (!m.tracked ? '#6b7280' : { green: '#34d399', amber: '#f5b83d', red: '#ff6b4a', none: '#c9ced8' }[m.rag] || '#c9ced8');
  const tr = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1) + '…' : String(s));
  const link = (x1, y1, x2, y2, c, dash) => `<path d="M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}" fill="none" stroke="${c}" stroke-width="${dash ? 1.2 : 1.8}" ${dash ? 'stroke-dasharray="4 4"' : ''} opacity="${dash ? 0.45 : 0.9}"/>`;
  const fmt = (v) => (v == null ? '—' : Math.round(v));
  const svg = `<svg class="ef-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="How the department's measures roll up into its score">
    <text x="0" y="16" class="ef-h">Measures</text><text x="${dx}" y="16" class="ef-h">Dimensions</text><text x="${cx}" y="16" class="ef-h" text-anchor="middle">Department score</text>
    ${rows.map(({ m, y: ry, D }) => link(sx, ry + bh / 2, dx, D.cy, m.pseudo ? '#a78bfa' : col(m), m.pseudo || !m.tracked)).join('')}
    ${dn.map((D) => link(dx + dw, D.cy, cx - 70, cy, D.score != null ? '#e6e9ef' : '#6b7280', D.score == null)).join('')}
    ${rows.map(({ m, y: ry }) => m.pseudo ? `<g><rect x="0" y="${ry}" width="${sx}" height="${bh}" rx="8" class="ef-box ef-pseudo"/><text x="12" y="${ry + 19}" class="ef-t ef-mut">Worked out from the trend of every tracked measure</text></g>`
      : `<g><title>${esc(m.name)}${m.tracked ? ': ' + esc(m.value) + (m.unit ? ' ' + esc(m.unit) : '') : ' (not tracked yet)'}${m.target ? ' · target ' + esc(m.target) : ''}</title><rect x="0" y="${ry}" width="${sx}" height="${bh}" rx="8" class="ef-box ${m.tracked ? 'on' : ''} ${String(m.phase) === '2' ? 'p2' : ''}" style="--c:${col(m)}"/>
        <circle cx="14" cy="${ry + bh / 2}" r="5" fill="${m.tracked ? col(m) : 'none'}" stroke="${col(m)}" stroke-width="1.5"/><text x="27" y="${ry + 19}" class="ef-t">${esc(tr(m.name, m.tracked ? 38 : 46))}</text>${m.tracked ? `<text x="${sx - 10}" y="${ry + 19}" class="ef-v" text-anchor="end">${esc(tr(m.value, 10))}</text>` : ''}</g>`).join('')}
    ${dn.map((D) => `<g><title>${esc(D.s)}</title><rect x="${dx}" y="${D.cy - 26}" width="${dw}" height="52" rx="12" class="ef-dim ${D.score != null ? 'on' : ''}"/><text x="${dx + 14}" y="${D.cy - 5}" class="ef-dn">${esc(D.n)}</text>
      <text x="${dx + 14}" y="${D.cy + 14}" class="ef-ds">${D.k === 'improve' ? (D.tr.length ? `${D.good} of ${D.tr.length} improving` : 'No trends yet') : `${D.list.filter((m) => m.tracked).length} of ${D.list.length} tracked${D.scored ? ` · ${D.scored} scored` : ''}`}</text>
      <text x="${dx + dw - 14}" y="${D.cy + 7}" class="ef-dv" text-anchor="end">${fmt(D.score)}</text></g>`).join('')}
    <circle cx="${cx}" cy="${cy}" r="70" class="ef-sc ${F.score != null ? 'on' : ''}"/><text x="${cx}" y="${cy + (F.score != null ? 12 : 4)}" text-anchor="middle" class="${F.score != null ? 'ef-scv' : 'ef-scn'}">${F.score != null ? Math.round(F.score) : 'Not scored'}</text>
    <text x="${cx}" y="${cy + 34}" text-anchor="middle" class="ef-ds">${F.score != null ? 'out of 100' : `${F.scoredDims} of 6 dimensions scored`}</text></svg>`;
  return `<div class="ef-wrap"><div class="ef-scroll">${svg}</div>
    <div class="ef-legend"><span><i style="background:#34d399"></i>On target</span><span><i style="background:#f5b83d"></i>Near target</span><span><i style="background:#ff6b4a"></i>Off target</span><span><i style="background:#c9ced8"></i>Tracked, no target yet</span><span><i class="o"></i>Not tracked yet</span><span><i class="p2"></i>Full model (later)</span></div>
    <p class="ef-how">Each measure scores 0 to 100 against its target (100 at target or better). A dimension is the average of its scored measures; improvement is the share of tracked measures moving the right way. The department score is the average of its scored dimensions, each counting equally, and shows once three of the six are scored. ${F.tracked} of ${F.M.length} measures are tracked.</p></div>`;
}

/* ---------- blueprint on an item: the department brain (Studio only) ---------- */
function bpRender(e, i, portal = false) {
  const B = i.blueprint; if (!B || typeof B !== 'object') return ''; const P = portal ? { bd: PT.bpd } : hxCur().p; const sel = (B.depts || []).find((x) => x.k === P.bd) || null;
  const selAttr = (k) => (portal ? `data-pt="bpd" data-id="${esc(k)}"` : `data-hxk="bd" data-hxv="${esc(k)}"`);
  const S = {}; (B.sources || []).forEach((s) => { S[s.id] = s; }); const uses = sel ? new Set(sel.needs.flatMap((n) => splitList(n[1]))) : null;
  const users = (B.depts || []).reduce((a, x) => a + num(x.users), 0); const usd = (v) => '$' + Math.round(v).toLocaleString('en-GB');
  const chip = (s) => `<div class="bp-src ${uses ? (uses.has(s.id) ? 'hit' : 'dim') : ''} ${s.wall ? 'walled' : ''}" title="${esc(s.what)}"><b>${esc(s.name)}</b><span>${esc(s.how)}</span>${s.wall ? '<em>Walled</em>' : ''}</div>`;
  const arrow = (t) => `<div class="bp-arrow"><span>${esc(t)}</span></div>`;
  const dcard = (x) => `<button type="button" class="bp-dept ${P.bd === x.k ? 'on' : ''}" ${selAttr(P.bd === x.k ? '' : x.k)} style="--c:var(--gd-${esc(x.k)})"><span class="bp-dh"><b>${esc(x.name)}</b><em>Phase ${esc(x.phase)}</em></span>
    <span class="bp-du">${num(x.users)} people</span><span class="bp-dl">${(x.layers || []).map((l) => `<span><b>${esc(l[0])}</b>${num(l[1]) ? ` ×${num(l[1])}` : ''}<i>${esc(l[2])}</i></span>`).join('')}</span><span class="bp-dw">${esc(x.wall)}</span></button>`;
  const total = (B.costs.rows || []).reduce((a, r) => a + num(r[2]), 0);
  const ev = hxBehind(e, i).f; const hist = (B.history || []).slice().sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const work = (hist.length || ev.length) ? `<div class="hx-two" style="margin-top:18px"><div class="hx-tile"><div class="hx-k">How we got here</div><ol class="bp-hist">${hist.map((h) => `<li><b>${esc(fmtD(h[0], { day: 'numeric', month: 'short' }))}</b><span>${esc(h[1])}</span></li>`).join('')}</ol></div>
    <div class="hx-tile"><div class="hx-k">The evidence behind it · ${ev.length}</div>${ev.map((f) => `<div class="hx-ev"><div style="font-weight:600;font-size:12.5px">${esc(f.title)}</div><div class="hx-mut" style="font-size:11px;margin-top:2px">${dedupeRefs(f.sources || []).map((r) => esc(sourceLine(e, r, !portal && !ui.share))).join(' · ')}</div></div>`).join('') || '<p class="hx-note">Linked findings appear here.</p>'}</div></div>` : '';
  return `${portal ? '' : `<div class="hx-sh" style="margin-top:26px"><h3>${esc(B.title || 'Blueprint')}</h3><i></i></div>`}
  <div class="hx-tile bp-intro"><p>${esc(B.summary)}</p><div class="bp-kpis"><span><b>${(B.sources || []).length}</b>sources</span><span><b>${(B.depts || []).length}</b>groups of users</span><span><b>${users}</b>people</span><span><b>${(B.walls || []).length}</b>walls</span><span><b>${usd(total)}</b>a month (estimate)</span></div></div>
  <div class="bp-map">
    <div class="bp-band"><div class="bp-bl">1 · Where the knowledge is, and how we connect to it</div><div class="bp-groups">${(B.groups || []).map(([g, n]) => { const L = (B.sources || []).filter((s) => s.group === g); return L.length ? `<div class="bp-grp"><div class="bp-gn">${esc(n)}</div>${L.map(chip).join('')}</div>` : ''; }).join('')}</div></div>
    ${arrow('read on a schedule or when asked; each department only through its own access')}
    <div class="bp-band bp-core"><div class="bp-bl">2 · The brain</div><div class="bp-cores">${(B.core || []).map((c) => `<div class="bp-c"><b>${esc(c.name)}</b><p>${esc(c.what)}</p><span>${esc(c.how)}</span></div>`).join('')}</div></div>
    ${arrow('answers come back where people already work')}
    <div class="bp-band"><div class="bp-bl">3 · How people reach it</div><div class="bp-acc">${(B.access || []).map((a) => `<div class="bp-a"><b>${esc(a.name)}</b><span class="bp-aw">${esc(a.who)}</span><p>${esc(a.what)}</p><em>${esc(a.cost)}</em></div>`).join('')}</div></div>
    ${arrow('each group sees only what its work needs')}
    <div class="bp-band"><div class="bp-bl">4 · Who uses it ${sel ? '' : '<span class="bp-tip">Choose a group to light up its sources</span>'}</div><div class="bp-depts">${(B.depts || []).map(dcard).join('')}</div></div>
  </div>
  ${sel ? `<div class="hx-tile bp-sel" style="--c:var(--gd-${esc(sel.k)})"><div class="hx-k">${esc(sel.name)}: what the brain does for them</div><ol class="bp-needs">${sel.needs.map((n) => `<li><p>${esc(n[0])}</p><div class="bp-nf">${splitList(n[1]).map((id) => `<span>${esc((S[id] || { name: id }).name)}</span>`).join('')}</div><em>${esc(n[2])}</em></li>`).join('')}</ol><p class="bp-wall"><b>Wall</b> ${esc(sel.wall)}</p></div>` : ''}
  <div class="hx-two" style="margin-top:18px">
    <div class="hx-tile"><div class="hx-k">The walls</div><table class="hx-tbl bp-tbl"><tr><th>What</th><th>Who can see it</th></tr>${(B.walls || []).map((w) => `<tr><td><b>${esc(w[0])}</b></td><td class="hx-mut">${esc(w[1])}</td></tr>`).join('')}</table></div>
    <div class="hx-tile"><div class="hx-k">What it would cost a month (estimate)</div><table class="hx-tbl bp-tbl">${(B.costs.rows || []).map((r) => `<tr><td><b>${esc(r[0])}</b><div class="hx-mut" style="font-size:11px">${esc(r[1])}</div></td><td class="bp-r">${usd(r[2])}</td></tr>`).join('')}<tr class="bp-tot"><td><b>Total</b></td><td class="bp-r"><b>${usd(total)}</b></td></tr></table>
      <p class="hx-note">${esc(B.costs.oneOff || '')} ${esc(B.costs.note || '')}</p></div></div>
  <div class="hx-tile" style="margin-top:18px"><div class="hx-k">Against a licence for everyone</div><div class="bp-cmp">${(B.costs.compare || []).map((c, k) => `<div class="${k ? 'best' : ''}"><b>${esc(c[0])}</b><span>${esc(c[1])}</span><strong>${esc(c[2])}</strong><p>${esc(c[3])}</p></div>`).join('')}</div></div>
  <div class="hx-tile" style="margin-top:18px"><div class="hx-k">Every source: what matters and how we connect</div><table class="hx-tbl bp-tbl"><tr><th>Source</th><th>What matters from it</th><th>How we connect</th><th>How often</th></tr>${(B.sources || []).map((s) => `<tr><td><b>${esc(s.name)}</b>${s.wall ? `<div class="bp-wl">${esc(s.wall)}</div>` : ''}</td><td>${esc(s.what)}</td><td class="hx-mut">${esc(s.how)}</td><td class="hx-mut">${esc(s.when)}</td></tr>`).join('')}</table></div>
  <div class="hx-two" style="margin-top:18px"><div class="hx-tile"><div class="hx-k">In phases</div>${(B.phases || []).map((p) => `<div class="hx-ev"><b>Phase ${esc(p[0])}</b> · <span class="hx-mut">${esc(p[2])}</span><div style="font-size:12.5px;margin-top:3px">${esc(p[1])}</div></div>`).join('')}</div>
    <div class="hx-tile"><div class="hx-k">Questions that decide whether it works</div>${(B.questions || []).map((q) => `<div class="hx-ev"><div style="font-size:12.5px">${esc(q[0])}</div><div class="hx-mut" style="font-size:11px;margin-top:2px">${esc(q[1])}</div></div>`).join('')}</div></div>
  ${work}
  ${hxSrc([`Prices: ${(B.costs.sources || []).map((r) => esc(sourceLine(e, r, !portal && !ui.share))).join('; ')}.`, 'Headcount by department from the organogram (roles, not names).', 'Systems from the process maps and the software list.'])}`;
}

HXV.item = (e) => { const i = live(e.items).find((x) => x.id === hxCur().p.id); return HXV._item(e) + (i ? bpRender(e, i) : ''); };
