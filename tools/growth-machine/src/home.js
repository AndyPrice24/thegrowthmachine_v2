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
function hxDeptStats(e, d) {
  const M = hxMeasures(e, d); const st = (m) => String(m.status || 'missing').toLowerCase();
  const h = M.filter((m) => st(m) === 'have').length, p = M.filter((m) => st(m) === 'partly').length, mi = M.filter((m) => st(m) === 'missing').length;
  const scored = M.filter((m) => st(m) === 'have' && m.target !== undefined && m.target !== '' && m.value !== undefined && m.value !== '');
  const onT = scored.filter((m) => (String(m.better) === 'lower' ? num(m.value) <= num(m.target) : num(m.value) >= num(m.target))).length;
  const broken = M.filter((m) => String(m.broken) === 'true');
  return { M, h, p, mi, scored, onT, broken, ready: M.length ? (h + 0.5 * p) / M.length : 0 };
}

/* ---------- widgets ---------- */
function hxSrc(lines) { return `<div class="hx-src"><b>Where this comes from</b><ul>${lines.filter(Boolean).map((l) => `<li>${l}</li>`).join('')}</ul></div>`; }
function wxDays(e) {
  const S = hxDays(e); if (!S.total) return '';
  return `<div class="hx-tile hx-click hx-span2 hx-days" ${hxP('days')}><div>${hxDial(S)}</div><div style="min-width:0"><div class="hx-th"><span class="hx-k">My days · ${esc(e.client.name)}</span><span class="hx-knob">↗</span></div>
    <div style="display:grid;gap:10px;margin-top:12px">
      <div class="hx-well" style="padding:10px 14px"><div class="hx-k" style="color:var(--hx-gr)">Contract to date</div><div class="hx-big" style="margin-top:6px;font-size:28px">${hxSgn(S.bankC)}<small>${S.bankC >= 0 ? 'banked' : 'behind'}</small></div><div class="hx-note">${hxF1(S.logged)} logged of ${hxF1(S.expC)} needed by today (${S.total} days spread over ${S.all} working days)</div></div>
      <div class="hx-well" style="padding:10px 14px"><div class="hx-k" style="color:var(--hx-cy)">${esc(S.m.name)}</div><div class="hx-big" style="margin-top:6px;font-size:28px">${S.mlog >= S.per ? hxSgn(S.mlog - S.per) : hxF1(S.per - S.mlog)}<small>${S.mlog >= S.per ? 'banked' : 'still needed'}</small></div><div class="hx-note">${hxF1(S.mlog)} logged of ${S.per} needed this month · ${S.mw - S.mel} working days left</div></div></div>
    <div style="margin-top:12px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">${hxDayChips(S)}</div>${hxDialKey()}</div></div>`;
}
function wxReview(e) {
  const today = todayISO(); const nx = splitList(e.engagement.reviewDates).filter((d) => d > today).sort()[0]; if (!nx) return '';
  const left = daysBetween(today, nx); const done = Math.max(0, 14 - left); const r = 56, C = 2 * Math.PI * r; let ticks = '';
  for (let i = 0; i <= 14; i += 7) { const th = -90 + 360 * i / 14; ticks += `<text x="${70 + (r + 14) * Math.cos(th * Math.PI / 180)}" y="${70 + (r + 14) * Math.sin(th * Math.PI / 180) + 3}" text-anchor="middle" font-size="9" fill="#626a76">${14 - i}</text>`; }
  const dec = hxItems(e).filter((i) => i.stage === 'proposed').length;
  return `<div class="hx-tile hx-click" ${hxP('review')}><div class="hx-th"><span class="hx-k">Next fortnightly review</span><span class="hx-knob">↗</span></div>
    <div style="display:flex;align-items:center;gap:14px;margin-top:6px"><svg width="140" height="140" viewBox="0 0 140 140"><circle cx="70" cy="70" r="${r}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="9"/><circle cx="70" cy="70" r="${r}" fill="none" stroke="#22c3d6" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(C * done / 14).toFixed(1)} ${C}" transform="rotate(-90 70 70)"/>${ticks}<text x="70" y="74" text-anchor="middle" font-size="30" font-weight="800" fill="#eef1f5">${left}d</text><text x="70" y="91" text-anchor="middle" font-size="10" fill="#9aa2ae">to go</text></svg>
    <div><div style="font-size:18px;font-weight:800">${hxFd(nx, { weekday: 'short', day: 'numeric', month: 'short' })}</div><div class="hx-mut" style="margin-top:6px;line-height:1.55"><b style="color:var(--hx-ink)">${dec}</b> decision${dec === 1 ? '' : 's'} to put to the founders</div></div></div></div>`;
}
function wxPortal(e) {
  const fb = live(e.reportFeedback || []); const unseen = fb.filter((x) => (x.type === 'comment' || x.type === 'flag') && !x.seen).length;
  const ok = Object.keys(itApprovals(e)).length; const dec = hxItems(e).filter((i) => i.stage === 'proposed').length;
  return `<div class="hx-tile hx-click" ${hxP('portal')}><div class="hx-th"><span class="hx-k">Founder portal</span><span class="hx-knob">↗</span></div>
    <div class="hx-rings3">${[[unseen, 'New comments<br>or flags', 'var(--hx-or)'], [ok, 'Go-aheads', 'var(--hx-cy)'], [dec, 'Decisions<br>waiting', '#8b93a0']].map(([n, l, c]) => `<div><div class="hx-ring" style="border-color:${c};color:${c}">${n}</div><div class="hx-mut" style="font-size:11px;margin-top:7px;line-height:1.3">${l}</div></div>`).join('')}</div></div>`;
}
function hxNrrInfo(e) {
  const B = nrrBillingOn(e) ? nrrBill(e) : null; if (!B || B.trend.length < 2) return null; const T = B.trend; const a = T[T.length - 1], b = T[T.length - 2];
  const cfg = e.client.nrr || {}; const src = (e.sources || []).find((s) => s.id === cfg.source) || {};
  const due = cfg.nextDue || ''; const today = todayISO(); const late = due && due < today; const soon = due && !late && daysBetween(today, due) <= 3;
  return { B, a, b, due, late, soon, received: src.received || '', note: cfg.nextNote || '' };
}
function wxNrr(e) {
  const N = hxNrrInfo(e); if (!N) return '';
  const ring = (cx, v, col, lab, d) => { const r = 44, C = 2 * Math.PI * r; return `<circle cx="${cx}" cy="64" r="${r}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="10"/><circle cx="${cx}" cy="64" r="${r}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${(C * Math.min(1, v / N.B.target)).toFixed(1)} ${C}" transform="rotate(-90 ${cx} 64)"/><text x="${cx}" y="62" text-anchor="middle" font-size="18" font-weight="800" fill="#eef1f5">${Math.round(v)}%</text><text x="${cx}" y="77" text-anchor="middle" font-size="9.5" fill="#9aa2ae">${lab}</text><text x="${cx}" y="128" text-anchor="middle" font-size="11" font-weight="700" fill="${d >= 0 ? '#4fd18b' : '#ff8a7a'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)} pts</text>`; };
  const d = N.a.all - N.b.all; const st = N.late ? ['Data late', 'var(--hx-red)'] : N.soon ? ['Data due soon', 'var(--hx-am)'] : ['On schedule', 'var(--hx-gr)'];
  const dir = (k) => (N.a.by[k] ?? 0) - (N.b.by[k] ?? 0);
  return `<div class="hx-tile hx-click" ${hxP('nrr')}><div class="hx-th"><span class="hx-k">Net revenue retention</span><span class="hx-knob">↗</span></div>
    <div style="display:flex;align-items:baseline;gap:8px;margin-top:6px;flex-wrap:wrap"><span class="hx-big">${Math.round(N.a.all)}%</span><span class="${d >= 0 ? 'hx-up' : 'hx-dn'}" style="font-weight:700">${d >= 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)} pts on last month</span></div>
    <svg width="100%" height="136" viewBox="0 0 240 136">${ring(62, N.a.by.direct ?? 0, '#22c3d6', 'Direct', dir('direct'))}${ring(178, N.a.by.reseller ?? 0, '#ff7a3d', 'Resellers', dir('reseller'))}</svg>
    <div style="display:flex;align-items:center;gap:7px;font-size:11px;color:var(--hx-muted)"><span class="hx-light" style="--c:${st[1]}"></span>${st[0]} · data to ${esc(keyLabel(N.B.last))}${N.due ? ' · next due ' + esc(hxFd(N.due)) : ''}</div></div>`;
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
function wxPeople(e) {
  const R = hxReqs(e); if (!R.length) return '';
  return `<div class="hx-tile hx-alert"><div class="hx-th"><span class="hx-k" style="color:#ff8a8a">Waiting on ${esc(e.client.name)}</span><button class="hx-knob hot" ${hxP('people')}>!</button></div>
    <div class="hx-big" style="margin:10px 0">${R.filter((r) => hxLateBy(r.dueDate)).length}<small>late of ${R.length}</small></div>
    ${hxByPerson(e).map(([p, L]) => `<button class="hx-li" ${hxP('person', { n: p })}><span class="hx-sq" style="background:linear-gradient(145deg,#3b414b,#2a2e35)">${esc(String(p)[0])}</span><span><div class="hx-t">${esc(hxShow(e, p))}</div><div class="hx-s">${ui.share ? '' : esc(hxRole(e, p))}</div></span><span style="font-weight:800;font-size:15px;white-space:nowrap">${L.length}<span class="hx-late" style="margin-left:6px">${L.filter((r) => hxLateBy(r.dueDate)).length} late</span></span></button>`).join('')}</div>`;
}
function wxAhead(e) {
  const today = todayISO(); const g = e.engagement; const L = [];
  live(g.milestones).forEach((m) => { if (m.date && m.date >= today) L.push([m.date, m.title, m.detail || '', 'Engagement milestones']); });
  splitList(g.reviewDates).forEach((d) => { if (d >= today && !L.some((x) => x[0] === d)) L.push([d, 'Fortnightly review', '', 'Engagement plan']); });
  (g.phases || []).forEach((p) => { if (p.start > today) L.push([p.start, p.name + ' starts', 'Engagement phase', 'Engagement plan']); });
  const N = hxNrrInfo(e); if (N && N.due && N.due >= today) L.push([N.due, 'Billing data due from Finance', N.note || 'Next NRR and health update', 'Data rhythm']);
  hxItems(e).forEach((i) => { const d = hxItemDate(e, i); if (d && d >= today && d <= addDaysISO(today, 14) && i.stage !== 'live') L.push([d, i.title, i.next || '', 'Item next step']); });
  const S = L.sort((a, b) => a[0].localeCompare(b[0])).slice(0, 5);
  return `<div class="hx-tile hx-warm"><div class="hx-k" style="color:#f2dcb6;position:relative">Ahead</div>${S.map(([d, t, s, src]) => `<div class="hx-ag"><span class="hx-dd"><b>${hxD(d).getDate()}</b><span>${hxFd(d, { month: 'short' })}</span></span><span>${esc(t)}<small>${esc(s)}${s ? ' · ' : ''}${esc(src)}</small></span></div>`).join('') || '<p class="hx-note" style="position:relative">Nothing dated ahead.</p>'}</div>`;
}
function wxTools(e) {
  return `<div class="hx-tile"><div class="hx-k">Studio</div><div class="hx-ctl" style="margin-top:12px"><button class="hx-tg" data-hxtog="hxHideNotes"><s class="${ui.hxHideNotes ? '' : 'on'}"></s>TGM notes</button><button class="hx-tg" data-action="share"><s class="${ui.share ? 'on' : ''}"></s>Screen share</button></div>
    <div class="hx-ctl" style="margin-top:12px">${syncSupported() ? '<button class="hx-pl" data-action="syncCheck">⟳ Updates</button>' : ''}<button class="hx-pl" data-action="exportJSON">Back up</button><button class="hx-pl" data-action="classic">Classic view</button></div><p class="hx-note">TGM notes off hides private to-dos here. Screen share also turns names into roles and hides TGM-only items.</p></div>`;
}
function wxWork(e) {
  const today = todayISO(); const open = hxItems(e).filter((i) => i.stage !== 'parked');
  const cell = (d, s) => open.filter((i) => splitList(i.depts).includes(d) && i.stage === s).length; const mx = Math.max(1, ...ITEM_DEPTS.flatMap(([d]) => HX_STAGES.map(([s]) => cell(d, s))));
  const soon = open.filter((i) => { const d = hxItemDate(e, i); return d && d <= addDaysISO(today, 7) && i.stage !== 'live'; }).sort((a, b) => hxItemDate(e, a).localeCompare(hxItemDate(e, b)));
  const dec = open.filter((i) => i.stage === 'proposed').sort((a, b) => String(a.stageSince || '9').localeCompare(String(b.stageSince || '9')));
  const fr = hxFruit(e);
  const mini = (i, tag, col) => `<button class="hx-li hx-mini" ${hxP('item', { id: i.id })}><span class="hx-t">${esc(i.title)}</span><span class="hx-chip" style="color:${col};border-color:${col}">${tag}</span></button>`;
  return `<div class="hx-tile hx-span3"><div class="hx-th"><span class="hx-k">The work at a glance · department × stage</span><button class="hx-knob" ${hxP('board', {})}>↗</button></div>
    <div class="hx-work"><div><table class="hx-tbl hx-grid"><tr><th></th>${HX_STAGES.map(([, n]) => `<th>${esc(n.slice(0, 5))}</th>`).join('')}</tr>${ITEM_DEPTS.map(([d, n]) => `<tr><td style="white-space:nowrap"><span class="hx-dot" style="--c:var(--gd-${d})"></span> ${esc(n.split(/ [&,]/)[0])}</td>${HX_STAGES.map(([s]) => { const c = cell(d, s); return `<td><button ${hxP('board', { d, s })} class="hx-cell" style="color:${c ? '#0e1114' : 'var(--hx-dim)'};background:${c ? `rgba(255,122,61,${0.25 + 0.75 * c / mx})` : 'rgba(255,255,255,.03)'}">${c || '·'}</button></td>`; }).join('')}</tr>`).join('')}</table></div>
    <div><div class="hx-k" style="color:var(--hx-am)">Next step due within 7 days · ${soon.length}</div>${soon.slice(0, 5).map((i) => mini(i, hxFd(hxItemDate(e, i)), hxItemDate(e, i) < today ? '#ff8a7a' : 'var(--hx-am)')).join('')}</div>
    <div><div class="hx-k" style="color:var(--hx-or)">Waiting for a founder decision · ${dec.length}</div>${dec.slice(0, 5).map((i) => mini(i, i.stageSince ? daysBetween(i.stageSince, today) + (String(i.stageSinceSure) === 'true' ? '' : '+') + ' days' : '—', 'var(--hx-or)')).join('')}</div>
    <div><div class="hx-k" style="color:var(--hx-gr)">Lowest-hanging fruit · ${fr.length}</div>${fr.slice(0, 5).map((x) => mini(x.it, x.b.big ? 'R' + Math.round(num(x.b.big.valueMonthly) / 1000) + 'k' : 'Low effort', 'var(--hx-gr)')).join('')}</div></div></div>`;
}
function wxDept(e, d) {
  const its = hxItems(e).filter((i) => splitList(i.depts).includes(d) && i.stage !== 'parked'); const S = hxDeptStats(e, d); const ex = ui.hxExample;
  const light = S.broken.length ? 'var(--hx-red)' : (S.mi || S.p) ? 'var(--hx-am)' : S.M.length ? 'var(--hx-gr)' : 'var(--hx-dim)';
  const exS = { lead: [2, 3, '▲'], sales: [1, 4, '▼'], cs: [3, 5, '▲'], ops: [2, 4, '■'], prod: [0, 2, '▼'], admin: [2, 4, '▲'] }[d] || [0, 0, '■'];
  return `<div class="hx-tile hx-click hx-dept" ${hxP('dept', { d })} style="--dc:var(--gd-${d})">${ex ? '<span class="hx-ex">EXAMPLE</span>' : ''}<span class="hx-edge"></span>
    <div class="hx-th"><span style="font-weight:700;font-size:13.5px">${esc(HX_DN[d])}</span>${ex ? '' : `<span class="hx-light" style="--c:${light}"></span>`}</div>
    <div class="hx-stg">${HX_STAGES.map(([s, n]) => { const c = its.filter((i) => i.stage === s).length; return `<div><b style="background:${c ? `rgba(34,195,214,${0.15 + 0.12 * c})` : 'rgba(255,255,255,.03)'};color:${c ? 'var(--hx-ink)' : 'var(--hx-dim)'}">${c}</b><span>${esc(n.slice(0, 5))}</span></div>`; }).join('')}</div>
    <div class="hx-well" style="padding:10px 12px;margin-top:12px;display:flex;align-items:center;gap:12px">${ex ? `<div class="hx-big" style="font-size:26px">${exS[0]}<small>of ${exS[1]} on target</small></div><span class="${exS[2] === '▲' ? 'hx-up' : exS[2] === '▼' ? 'hx-dn' : 'hx-mut'}" style="margin-left:auto;font-weight:800">${exS[2]}</span>`
      : S.scored.length ? `<div class="hx-big" style="font-size:26px">${S.onT}<small>of ${S.scored.length} on target</small></div>` : `<div><div style="font-weight:700">Efficiency: not scored yet</div><div class="hx-mut" style="font-size:11px;margin-top:2px">${S.h} measured · ${S.p} partly · ${S.mi} not yet, of ${S.M.length}</div></div><span style="margin-left:auto;font-size:11px" class="hx-amb">${Math.round(S.ready * 100)}% ready</span>`}</div></div>`;
}

/* ---------- views ---------- */
const HXV = {};
HXV.home = (e) => { const st = e.engagement.phases.length ? engagementStatus(e) : null; const w = st ? Math.max(1, Math.ceil(st.elapsed / 7)) : 0; const today = todayISO();
  const ph = (e.engagement.phases || []).filter((x) => x.start <= today && today <= x.end).sort((a, b) => String(b.start).localeCompare(String(a.start)))[0] || (st && st.current);
  return `<h1 class="hx-pg">Home</h1><p class="hx-pgs">${esc(e.client.name)}${ph ? ' · ' + esc(ph.name) + ` (${hxFd(ph.start)} – ${hxFd(ph.end)})` : ''}${st ? ` · week ${w} of ${Math.max(1, Math.round(st.termDays / 7))}` : ''}</p>
  <div class="hx-sh"><h3>At a glance</h3><i></i></div><div class="hx-g4">${wxDays(e)}${wxReview(e)}${wxPortal(e)}</div>
  <div class="hx-sh"><h3>To do and waiting on</h3><i></i></div><div class="hx-g4">${wxFocus(e)}${wxPeople(e)}${wxNrr(e)}</div>
  <div class="hx-sh"><h3>The work</h3><i></i></div><div class="hx-g4">${wxWork(e)}<div class="hx-col">${wxAhead(e)}${wxTools(e)}</div></div>
  <div class="hx-sh"><h3>Departments</h3><i></i><button class="hx-tg" data-hxtog="hxExample"><s class="${ui.hxExample ? 'on' : ''}"></s>Preview with example scores</button></div><div class="hx-g3">${ITEM_DEPTS.map(([d]) => wxDept(e, d)).join('')}</div>`; };
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
  <div class="hx-ctl" style="margin-top:16px"><button class="hx-pl" data-hxdo="reqReceived" data-id="${esc(r.id)}">Mark received</button><button class="hx-pl" data-hxdo="reqNotNeeded" data-id="${esc(r.id)}">Not needed</button></div>
  ${hxSrc([`The Studio's information requests (Our work → What we need), id ${esc(r.id)}.`, c ? `Conversation: interview record ${esc(c.id)} (${esc(c.role || '')}).` : ''])}</div>`; };
HXV.board = (e) => { const d = hxCur().p.d || '', hs = hxCur().p.s || ''; const all = hxItems(e); const its = all.filter((i) => !d || splitList(i.depts).includes(d)); const park = its.filter((i) => i.stage === 'parked');
  return `<h1 class="hx-pg">Board${d ? ' · ' + esc(HX_DN[d]) : ''}</h1><p class="hx-pgs">${its.length} items${d ? ' that touch ' + esc(HX_DN[d]) : ''}. An item appears in every department it touches.</p>
  <div class="hx-tabs" style="margin-bottom:14px"><button class="hx-tb ${!d ? 'on' : ''}" data-hxk="d" data-hxv="">Everything<b>${all.length}</b></button>${ITEM_DEPTS.map(([k, n]) => `<button class="hx-tb ${d === k ? 'on' : ''}" data-hxk="d" data-hxv="${k}"><span class="hx-dot" style="--c:var(--gd-${k})"></span> ${esc(n)}<b>${all.filter((i) => splitList(i.depts).includes(k)).length}</b></button>`).join('')}</div>
  <div class="hx-kb">${HX_STAGES.map(([s, n]) => { const L = its.filter((i) => i.stage === s); return `<div class="hx-col hx-well ${hs === s ? 'hx-hl' : ''}"><h4><span>${esc(n)}</span><span>${L.length}</span></h4>${L.map((i) => { const B = hxBehind(e, i); return `<button class="hx-card" ${hxP('item', { id: i.id })} style="--dc:var(--gd-${splitList(i.depts)[0]})"><span class="hx-cedge"></span><div class="hx-ct">${String(i.pinned) === 'true' ? '★ ' : ''}${esc(i.title)}</div><div class="hx-cm">${splitList(i.depts).map((x) => `<span class="hx-dot" style="--c:var(--gd-${x})"></span>`).join('')}${i.label ? `<span>${esc(LABEL_TXT[i.label] || i.label)}</span>` : ''}${B.big ? `<span>R${Math.round(num(B.big.valueMonthly) / 1000)}k</span>` : ''}${i.stageSince ? `<span>· ${daysBetween(i.stageSince, todayISO())}d${String(i.stageSinceSure) === 'true' ? '' : '+'} here</span>` : ''}</div></button>`; }).join('')}</div>`; }).join('')}</div>
  ${park.length ? `<div class="hx-tile" style="margin-top:14px"><span class="hx-k">Parked · ${park.length}</span> ${park.map((i) => `<button class="hx-pl" style="margin-left:8px" ${hxP('item', { id: i.id })}>${esc(i.title)}</button>`).join('')}</div>` : ''}`; };
HXV.item = (e) => { const i = live(e.items).find((x) => x.id === hxCur().p.id); if (!i) return '<p>This item no longer exists.</p>'; const B = hxBehind(e, i); const ci = HX_STAGES.findIndex(([s]) => s === i.stage);
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
  <div class="hx-sh"><h3>Measures</h3><i></i><button class="hx-tg" data-hxtog="hxExample"><s class="${ex ? 'on' : ''}"></s>Preview with example values</button></div>
  <div class="hx-tile">${ex ? '<span class="hx-ex">EXAMPLE VALUES</span>' : ''}${S.M.length ? `<table class="hx-tbl"><tr><th>Measure</th><th>Source</th><th>Rhythm</th><th>Status</th><th>Data points</th><th>Trend</th></tr>${S.M.map((m, k) => { const st = HX_ST[String(m.status || 'missing').toLowerCase()] || HX_ST.missing; return `<tr class="hx-click" ${hxP('measure', { id: m.id })}><td><b>${esc(m.name)}</b><div class="hx-mut" style="font-size:11px">${esc(m.why || '')}</div></td><td class="hx-mut">${esc(m.source || '')}</td><td class="hx-mut">${esc(m.rhythm || '')}</td><td>${ex ? `<span class="hx-light" style="--c:var(--hx-${exRow(k)[2]})"></span>` : `<span class="hx-chip" style="color:${st[1]};border-color:currentColor">${st[0]}</span>`}</td><td>${ex ? exRow(k)[0] : m.points !== undefined && m.points !== '' ? esc(m.points) : String(m.status).toLowerCase() === 'missing' ? '0' : '—'}</td><td>${ex ? exRow(k)[1] : esc(m.trend || '—')}</td></tr>`; }).join('')}</table>` : '<p class="hx-note">No measures defined for this department yet. They arrive in an update file (collection "measures").</p>'}</div>
  <div class="hx-two" style="margin-top:18px"><div class="hx-tile"><div class="hx-k" style="color:var(--hx-am)">Still needed to get efficiency tracking over the line</div>${S.M.filter((m) => String(m.status).toLowerCase() !== 'have').map((m) => `<div class="hx-ev"><b style="font-size:12.5px">${esc(m.name)}</b><div class="hx-mut" style="font-size:11.5px">From ${esc(m.source || '—')}${m.note ? ' · ' + esc(m.note) : ''}</div></div>`).join('') || '<p class="hx-note">Every measure is collected.</p>'}</div>
  <div class="hx-tile"><div class="hx-k">This department's board</div>${HX_STAGES.map(([s, n]) => { const L = its.filter((i) => i.stage === s); return L.length ? `<div style="margin-top:8px"><span class="hx-mut" style="font-size:11px">${esc(n)} · ${L.length}</span>${L.map((i) => `<button class="hx-li hx-mini" ${hxP('item', { id: i.id })}><span class="hx-t">${esc(i.title)}</span></button>`).join('')}</div>` : ''; }).join('')}<button class="hx-pl" style="margin-top:10px" ${hxP('board', { d })}>Open as a board ▸</button></div></div>
  ${hxSrc(['Measures: the "measures" collection (Sources &amp; data), from the founders\' view and data plan, section 7.', 'Items: the item table (departments, stage).'])}`; };
HXV.measure = (e) => { const m = live(e.measures).find((x) => x.id === hxCur().p.id); if (!m) return '<p>This measure no longer exists.</p>'; const st = HX_ST[String(m.status || 'missing').toLowerCase()] || HX_ST.missing;
  return `<h1 class="hx-pg hx-pgsm">${esc(m.name)}</h1><p class="hx-pgs">${esc(HX_DN[m.dept] || m.dept)}</p><div class="hx-tile hx-narrow"><dl class="hx-kv"><dt>Why it's collected</dt><dd>${esc(m.why || '—')}</dd><dt>Where it's collected</dt><dd>${esc(m.source || '—')}</dd><dt>How often</dt><dd>${esc(m.rhythm || '—')}</dd><dt>Status</dt><dd><span style="color:${st[1]}">${st[0]}</span>${m.note ? ' · ' + esc(m.note) : ''}</dd><dt>Value</dt><dd>${esc(m.value || '—')}${m.asAt ? ' (as at ' + esc(m.asAt) + ')' : ''}</dd><dt>Target</dt><dd>${esc(m.target || 'Not set yet')}</dd><dt>Data points so far</dt><dd>${esc(m.points || (String(m.status).toLowerCase() === 'missing' ? 'None' : 'Not counted yet'))}</dd><dt>Baseline</dt><dd>${esc(m.baseline || 'Mar–Sep 2026 where history exists; otherwise the first four full weeks')}</dd><dt>Level</dt><dd>Team level, never per person</dd></dl>
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
  if (t.dataset.hxdo === 'reqReceived' || t.dataset.hxdo === 'reqNotNeeded') { const r = e.engagement.requests.find((x) => x.id === id); if (r) { if (t.dataset.hxdo === 'reqReceived') { r.receivedDate = todayISO(); r.status = 'Received'; } else r.status = 'Not needed'; touch(r); save(); toast(t.dataset.hxdo === 'reqReceived' ? 'Marked received' : 'Marked not needed'); hxBack(); } return; }
  if (t.dataset.hxdo === 'editItems') { ui.tab = 'data'; ui.coll = 'items'; render(); window.scrollTo(0, 0); }
});
window.addEventListener('popstate', () => { if (!PORTAL_ON && ui.tab === 'hub' && HX.length > 1) { HX.pop(); render(); } });
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !PORTAL_ON && ui.tab === 'hub' && HX.length > 1 && !document.querySelector('.modal-back:not([hidden]), #modal:not([hidden])')) { try { history.back(); } catch (err) { hxBack(); } } });
