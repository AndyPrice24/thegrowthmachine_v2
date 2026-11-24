/* ============================================================
   Founders' view, pages 1 to 4 (agreed 23 Nov 2026): Company health, Concerns and wins, Optimisation projects and
   Lowest-hanging fruit. They run inside the founder portal (portal.js) in the graphite style. Departments are a filter
   on pages 2 to 4. Founders can approve a lowest-hanging-fruit item ("Go ahead"); the web app records it and the
   Studio moves the item to Approved at the next ⟳ Updates (itApplyApprovals).
   Data: engagement.health (measures), items (why, knockOn, willBe, owner, next, nextDate), the findings behind each
   item (size and sources), and the key changes' dated timelines (wins).
   ============================================================ */
const FT_AREAS = ['Revenue', 'Clients', 'Delivery', 'People', 'Cost'];
const FT_STATUS = { green: 'On track', amber: 'Watch', red: 'Off track', grey: 'Not tracked yet' };
const FT_PROJECT = ['approved', 'underway', 'live'];
const FT_OPEN = ['found', 'investigating', 'proposed'];
const FT_SEV = { high: 3, medium: 2, low: 1 };
const FT_BASIS = { 'At risk': 'a month at risk', Leaking: 'a month lost', 'Spend to review': 'a month to review' };

const ftItems = () => live(E().items || []).filter((i) => String(i.portal) !== 'false').sort((a, b) => num(a.order) - num(b.order));
const ftDeptOK = (it) => !PT.dept || splitList(it.depts).includes(PT.dept);
const ftOn = (v) => v === true || v === 'true';
/** Findings and recommendations behind an item (only what reached the portal). */
function ftBehind(it) {
  const e = E(); const L = itemLinks(e, it);
  const f = live(e.findings).filter((x) => L.findings.has(x.id)); const r = live(e.recommendations).filter((x) => L.recommendations.has(x.id));
  // The headline size: the item's chosen finding (sizeId), else the main fix's findings first, at-risk before lost before spend.
  const ri = (x) => { const i = splitList(it.recIds).indexOf(x.fixId); return i < 0 ? 0 : i; }; const bi = (x) => Object.keys(FT_BASIS).indexOf(x.basis);
  const sized = f.filter((x) => num(x.valueMonthly) > 0 && FT_BASIS[x.basis]);
  const big = sized.find((x) => x.id === it.sizeId) || sized.sort((a, b) => ri(a) - ri(b) || bi(a) - bi(b) || num(b.valueMonthly) - num(a.valueMonthly))[0] || null;
  const sev = Math.max(0, ...f.map((x) => FT_SEV[x.severity] || 0));
  const eff = r.length ? r.reduce((s, x) => s + (num(x.effort) || 3), 0) / r.length : 3;
  return { f, r, big, sev, eff, sources: dedupeRefs(f.flatMap((x) => x.sources || [])) };
}
const ftSize = (b) => (b.big ? `<span class="ft-size">${esc(ptMoney(b.big.valueMonthly))}<small>${esc(FT_BASIS[b.big.basis])}</small>${ptSrcBtn(b.big.sources)}</span>` : '');
const ftSevTxt = (s) => (s >= 3 ? 'High impact' : s === 2 ? 'Medium impact' : s === 1 ? 'Low impact' : '');
const ftEffTxt = (x) => (x <= 1.5 ? 'Low effort' : x <= 2.5 ? 'Moderate effort' : 'Larger effort');
const ftDeptDots = (it) => `<span class="ft-depts">${splitList(it.depts).map((k) => `<span class="ft-dept" style="--dc:var(--gd-${esc(k)})"><i></i>${esc(ITEM_DEPT_NAME[k] || k)}</span>`).join('')}</span>`;
const ftStage = (it) => `<span class="ft-stage ft-st-${esc(it.stage)}">${esc(ITEM_STAGE_NAME[it.stage] || it.stage)}</span>`;
const ftDate = (it) => (it.nextDate ? mvDate(E(), it.nextDate) : null);
const ftLate = (it) => { const d = ftDate(it); return !!d && d < todayISO() && FT_PROJECT.includes(it.stage) && it.stage !== 'live'; };

/* ---------- shared: page head, department filter ---------- */
function ftHead(eyebrow, h1, lede = '') {
  return `<section class="pt-hello ft-hello"><div class="pt-eyebrow">${eyebrow}</div><h1>${h1}</h1>${lede ? `<p class="pt-lede">${lede}</p>` : ''}</section>`;
}
function ftDeptBar(list) {
  const n = (k) => list.filter((it) => splitList(it.depts).includes(k)).length;
  return `<div class="ft-filter" role="group" aria-label="Department"><button type="button" class="ft-chip ${PT.dept ? '' : 'on'}" data-pt="dept" data-id="">All <b>${list.length}</b></button>${ITEM_DEPTS.filter(([k]) => n(k)).map(([k, nm]) =>
    `<button type="button" class="ft-chip ${PT.dept === k ? 'on' : ''}" data-pt="dept" data-id="${k}" style="--dc:var(--gd-${k})"><i></i>${esc(nm.split(/[ ,]/)[0] === 'Admin' ? 'Admin & finance' : nm.replace(' & direction', '').replace(' & platform', ''))} <b>${n(k)}</b></button>`).join('')}</div>`;
}
const ftSh = (t, s = '') => `<div class="gs-sh ft-sh"><h3>${t}</h3><i></i>${s ? `<span class="ft-shs">${s}</span>` : ''}</div>`;
const ftEmpty = (t) => `<div class="gs-panel ft-empty"><p class="pt-muted">${t}</p></div>`;

/* ---------- 1. Company health ---------- */
function ftHealthList() { return live((E().engagement || {}).health || []).sort((a, b) => num(a.order) - num(b.order)); }
function ftMeasure(h) {
  const st = FT_STATUS[h.status] ? h.status : 'grey'; const arrow = h.trend === 'up' ? '▲' : h.trend === 'down' ? '▼' : h.trend === 'flat' ? '■' : '';
  const tracked = st !== 'grey';
  return `<div class="ft-m ft-${st}" id="it-${esc(h.id)}">
    <div class="ft-m-h"><span class="ft-light" title="${esc(FT_STATUS[st])}"></span><span class="ft-m-l">${esc(h.label)}</span>${ptActs(h.id)}</div>
    <div class="ft-m-v ${tracked ? '' : 'ft-nt'}">${esc(h.value || '—')}${h.unit && tracked ? `<small>${esc(h.unit)}</small>` : ''}</div>
    ${h.trendText ? `<div class="ft-m-t">${arrow ? `<b class="ft-arrow ft-a-${esc(h.trend)}">${arrow}</b>` : ''}${esc(h.trendText)}</div>` : ''}
    <div class="ft-m-f"><span>${h.asAt ? 'As at ' + esc(h.asAt) : ''}</span>${ptSrcBtn(h.source ? [{ id: h.source, part: h.part || '' }] : [], 'Source')}</div></div>`;
}
function ftHealth() {
  const e = E(); const H = ftHealthList(); const R = PT.R; const w = ptWeek(e); const g = e.engagement || {};
  const next = splitList(g.reviewDates).find((d) => d > todayISO());
  const cnt = (s) => H.filter((h) => (FT_STATUS[h.status] ? h.status : 'grey') === s).length;
  const areas = [...FT_AREAS, ...[...new Set(H.map((h) => h.area))].filter((a) => a && !FT_AREAS.includes(a))].filter((a) => H.some((h) => h.area === a));
  const asks = R.asks || []; const fruit = ftFruit(true); const appr = fruit.filter((x) => (PT.D.approve[x.it.id] || []).length).length;
  const lede = esc(R.intro || '');
  const head = ftHead(`Week ${w.cur} of ${w.weeks}${next ? ` · next review ${esc(fmtD(next, { weekday: 'short', day: 'numeric', month: 'short' }))}` : ''}`, `${esc(e.client.name)}: company health`, lede);
  if (!H.length) return head + ftEmpty('The health measures are being set up.');
  return `${head}
    <div class="ft-score">${['green', 'amber', 'red', 'grey'].filter(cnt).map((s) => `<span class="ft-sc ft-${s}"><span class="ft-light"></span><b>${cnt(s)}</b> ${esc(FT_STATUS[s].toLowerCase())}</span>`).join('')}</div>
    <div class="ft-areas">${areas.map((a) => { const L = H.filter((h) => h.area === a); const worst = L.some((h) => h.status === 'red') ? 'red' : L.some((h) => h.status === 'amber') ? 'amber' : L.every((h) => h.status === 'grey' || !FT_STATUS[h.status]) ? 'grey' : 'green';
      return `<section class="gs-panel ft-area ft-${worst}"><div class="ft-area-h"><h2>${esc(a)}</h2><span class="ft-area-s">${esc(FT_STATUS[worst])}</span></div><div class="gs-well ft-ms">${L.map(ftMeasure).join('')}</div></section>`; }).join('')}</div>
    <div class="ft-row2">
      ${asks.length || fruit.length ? `<section class="gs-panel ft-for"><div class="gs-ph"><h2>For you</h2></div><div class="ft-for-b">
        ${fruit.length ? `<button type="button" class="ft-for-i" data-pt="go" data-sec="fruit"><b>${fruit.length}</b><span>low-effort change${fruit.length === 1 ? '' : 's'} ready for a decision${appr ? ` · ${appr} approved` : ''}</span><em>→</em></button>` : ''}
        ${asks.map((a) => `<div class="ft-ask"><div><b>${esc(a.title)}</b>${a.detail ? `<p>${esc(a.detail)}</p>` : ''}</div><button type="button" class="pt-btn" data-pt="discuss" data-id="${esc(a.id)}">Reply${(PT.D.comments[a.id] || []).length ? ` (${(PT.D.comments[a.id] || []).length})` : ''}</button></div>`).join('')}</div></section>` : ''}
      ${ftWinsPanel(3)}
    </div>
    ${PT.me.owner ? '' : `<p class="pt-foot">Anything missing or wrong? <button type="button" class="pt-link" data-pt="discuss" data-id="report">Comment on the portal as a whole</button>.</p>`}`;
}

/* ---------- 2. Concerns and wins ---------- */
function ftConcernList(all = false) {
  const its = ftItems().filter((it) => it.stage !== 'parked' && String(it.concern) !== 'false');
  const rows = its.map((it) => { const b = ftBehind(it);
    const isC = (it.label === 'leak' || it.label === 'weakness') && FT_OPEN.concat(['approved']).includes(it.stage) && (b.sev >= 2 || b.big);
    return isC ? { it, b, late: ftLate(it), rank: num(it.concern) || 99 } : null; }).filter(Boolean)
    .sort((x, y) => x.rank - y.rank || (ftOn(y.it.pinned) - ftOn(x.it.pinned)) || (y.b.sev - x.b.sev) || (num((y.b.big || {}).valueMonthly) - num((x.b.big || {}).valueMonthly)) || num(x.it.order) - num(y.it.order));
  return all ? rows : rows.filter((x) => ftDeptOK(x.it));
}
/** Projects whose next step date has passed. */
const ftLateList = (all = false) => ftItems().filter((it) => ftLate(it) && (all || ftDeptOK(it)));
function ftWins() {
  const J = journey(E(), { portal: true }); const today = todayISO();
  const w = J.past.filter((x) => x.win).map((x) => ({ date: x.date, label: x.label, text: x.text, move: x.move }));
  ftItems().filter((it) => it.stage === 'live' && it.measured).forEach((it) => w.push({ date: today, label: 'Measured', text: `${it.title}: ${it.measured}`, move: null, it }));
  return w.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}
function ftWinsPanel(n) {
  const W = ftWins(); if (!W.length) return '';
  const it = (x) => { const item = x.move && ftItems().find((i) => i.moveId === x.move.id);
    return `<li class="ft-win"><span class="ft-wd">${esc(x.label || '')}</span><div><p>${esc(x.text)}</p>${item ? `<button type="button" class="ft-wlink" data-pt="proj" data-id="${esc(item.id)}">${esc(trunc(item.title, 60))}</button>` : ''}</div></li>`; };
  return `<section class="gs-panel ft-wins"><div class="gs-ph"><h2>Latest wins</h2><span class="s">${W.length} dated</span></div><ul class="gs-well ft-wl">${W.slice(0, n).map(it).join('')}</ul>${W.length > n ? `<div class="ft-more">${ptLinkTo('concerns', 'All wins')}</div>` : ''}</section>`;
}
function ftConcernCard(x, i) {
  const it = x.it; const b = x.b;
  return `<article class="gs-panel ft-c ${x.late ? 'ft-late' : ''}" id="it-${esc(it.id)}"><span class="gs-knob ${i < 3 ? 'hot' : ''}">${i + 1}</span>
    <div class="ft-c-top">${it.label ? `<span class="ft-lab ft-l-${esc(it.label)}">${esc(LABEL_TXT[it.label] || it.label)}</span>` : ''}${x.late ? `<span class="ft-lab ft-l-late">Next step overdue · ${esc(it.nextDate)}</span>` : ''}${ftStage(it)}</div>
    <h3>${esc(it.title)}</h3>
    <p class="ft-line">${esc(it.line || '')}</p>
    <div class="ft-c-f">${ftSize(b)}${!b.big && ftSevTxt(b.sev) ? `<span class="ft-size ft-sev">${esc(ftSevTxt(b.sev))}</span>` : ''}${ftDeptDots(it)}${ptActs(it.id)}</div>
    ${it.next ? `<p class="ft-next"><b>Next:</b> ${esc(it.next)}${it.nextDate ? ' · ' + esc(it.nextDate) : ''}${it.owner ? ` <span class="pt-muted">(${esc(it.owner)})</span>` : ''}</p>` : ''}</article>`;
}
function ftConcerns() {
  const all = ftConcernList(true); const C = ftConcernList(); const W = ftWins(); const late = ftLateList();
  const top = C.slice(0, 5); const rest = C.slice(5);
  const row = (x) => `<li class="ft-rest"><span>${esc(x.it.title)}</span>${x.b.big ? `<span class="ft-rv">${esc(ptMoney(x.b.big.valueMonthly))} <small>${esc(FT_BASIS[x.b.big.basis])}</small></span>` : `<span class="ft-rv pt-muted">${esc(ftSevTxt(x.b.sev))}</span>`}${ftStage(x.it)}</li>`;
  return `${ftHead('Concerns and wins', 'What needs attention, and what has moved')}
    ${ftDeptBar(all.map((x) => x.it))}
    ${ftSh('Top concerns', 'by size and impact')}
    ${top.length ? `<div class="ft-cgrid">${top.map(ftConcernCard).join('')}</div>` : ftEmpty('No concerns in this department.')}
    ${rest.length ? `<details class="gs-panel ft-also"><summary>${rest.length} more concern${rest.length === 1 ? '' : 's'}</summary><ul class="gs-well">${rest.map(row).join('')}</ul></details>` : ''}
    <div class="ft-also-l">${ptLinkTo('leaks', 'Every leak and opportunity, with sources')}</div>
    ${late.length ? `${ftSh('Behind schedule', `${late.length} project${late.length === 1 ? '' : 's'}`)}<section class="gs-panel"><ul class="gs-well ft-latel">${late.map((it) => `<li class="ft-rest"><button type="button" class="ft-wlink" data-pt="proj" data-id="${esc(it.id)}">${esc(it.title)}</button><span class="ft-rv"><span class="ft-lab ft-l-late">Due ${esc(it.nextDate)}</span></span><span class="pt-muted ft-lnx">${esc(it.next || '')}</span></li>`).join('')}</ul></section>` : ''}
    ${ftSh('Wins', `${W.length} so far`)}
    ${W.length ? `<section class="gs-panel"><ul class="gs-well ft-wl ft-wl-all">${W.map((x) => { const item = x.move && ftItems().find((i) => i.moveId === x.move.id);
      return `<li class="ft-win"><span class="ft-wd">${esc(x.label || '')}</span><div><p>${esc(x.text)}</p>${item ? `<button type="button" class="ft-wlink" data-pt="proj" data-id="${esc(item.id)}">${esc(item.title)}</button>` : ''}</div></li>`; }).join('')}</ul></section>` : ftEmpty('Wins are recorded as they happen.')}`;
}

/* ---------- 3. Optimisation projects ---------- */
function ftProjectList(all = false) {
  const order = { underway: 0, approved: 1, live: 2 };
  const L = ftItems().filter((it) => FT_PROJECT.includes(it.stage)).sort((a, b) => (ftOn(b.pinned) - ftOn(a.pinned)) || order[a.stage] - order[b.stage] || num(a.order) - num(b.order));
  return all ? L : L.filter(ftDeptOK);
}
function ftTrack(it) {
  const st = ['approved', 'underway', 'live']; const cur = st.indexOf(it.stage);
  return `<div class="ft-track">${st.map((k, i) => `<span class="${i < cur ? 'done' : i === cur ? 'now' : ''}">${esc(ITEM_STAGE_NAME[k])}</span>`).join('')}<span class="${it.measured ? 'now' : ''}">Measured</span></div>`;
}
function ftProjectCard(it) {
  const m = it.moveId && mvList(E(), { portal: true }).find((x) => x.id === it.moveId);
  const was = m ? m.before : ''; const now = m ? m.now : it.line;
  return `<article class="gs-panel ft-p ${ftOn(it.pinned) ? 'ft-pin' : ''}" id="it-${esc(it.id)}" style="--dc:var(--gd-${esc(splitList(it.depts)[0] || 'lead')})"><span class="gs-edge"></span>
    <div class="ft-c-top">${ftOn(it.pinned) ? '<span class="ft-lab ft-l-pin">★ Your priority</span>' : ''}${ftLate(it) ? `<span class="ft-lab ft-l-late">Next step overdue</span>` : ''}${ptActs(it.id)}</div>
    <h3>${esc(it.title)}</h3>
    ${ftTrack(it)}
    ${it.why ? `<p class="ft-why"><b>Why:</b> ${esc(it.why)}</p>` : ''}
    <div class="gs-well ft-wnw">${was ? `<div><span class="k">Was</span><p>${esc(was)}</p></div>` : ''}<div class="now"><span class="k">Now</span><p>${esc(now || '')}</p></div>${it.willBe ? `<div class="wb"><span class="k">Will be <em>(aim)</em></span><p>${esc(it.willBe)}</p></div>` : ''}</div>
    ${it.knockOn ? `<p class="ft-ko"><b>Knock-on:</b> ${esc(it.knockOn)}</p>` : ''}
    ${it.measured ? `<p class="ft-meas"><b>Measured:</b> ${esc(it.measured)}</p>` : ''}
    <div class="ft-p-f"><div><span class="k">Who</span>${esc(it.owner || 'To confirm')}</div><div><span class="k">Departments</span>${ftDeptDots(it)}</div>${it.next ? `<div><span class="k">Next</span>${esc(it.next)}${it.nextDate ? ` · <b>${esc(it.nextDate)}</b>` : ''}</div>` : ''}</div>
    ${m ? `<button type="button" class="pt-more" data-pt="move" data-id="${esc(m.id)}">The story so far →</button>` : ''}</article>`;
}
function ftProjects() {
  const all = ftProjectList(true); const L = ftProjectList();
  const by = (s) => L.filter((it) => it.stage === s);
  const grp = (s, t, sub) => (by(s).length ? `${ftSh(`${t} <b class="ft-n">${by(s).length}</b>`, sub)}<div class="ft-pgrid">${by(s).map(ftProjectCard).join('')}</div>` : '');
  return `${ftHead('Optimisation projects', 'What is changing, why, and where it stands')}
    ${ftDeptBar(all)}
    ${L.length ? grp('underway', 'Under way', '') + grp('approved', 'Approved, starting next', '') + grp('live', 'Live', '') : ftEmpty('No projects in this department yet.')}`;
}

/* ---------- 4. Lowest-hanging fruit ---------- */
function ftFruit(all = false) {
  const rows = ftItems().filter((it) => FT_OPEN.includes(it.stage) && String(it.fruit) !== 'false').map((it) => ({ it, b: ftBehind(it) }))
    .filter((x) => x.b.r.length && (x.b.sev >= 2 || x.b.big) && x.b.eff <= 2 && !(x.b.eff > 1.5 && x.b.sev < 3 && !x.b.big))
    .sort((x, y) => (num(x.it.fruit) || 99) - (num(y.it.fruit) || 99) || x.b.eff - y.b.eff || y.b.sev - x.b.sev || num((y.b.big || {}).valueMonthly) - num((x.b.big || {}).valueMonthly) || num(x.it.order) - num(y.it.order));
  return all ? rows : rows.filter((x) => ftDeptOK(x.it));
}
function ftGo(id, compact) {
  const A = PT.D.approve[id] || []; const mine = A.some((x) => x.by === PT.me.id);
  if (compact) return PT.me.owner ? (A.length ? '<span class="ft-go-s"><b>Approved</b></span>' : '') : `<button type="button" class="ft-go ft-go-sm ${mine ? 'on' : ''}" data-pt="approve" data-id="${esc(id)}" aria-pressed="${mine}">${mine ? '✓ Approved' : 'Go ahead'}</button>`;
  if (PT.me.owner) return `<div class="ft-go-s">${A.length ? `<b>Approved</b> by ${esc(A.map((x) => x.byLabel).join(', '))}` : '<span class="pt-muted">Founders approve here</span>'}</div>`;
  return `<div class="ft-go-w">${A.length ? `<div class="ft-go-s"><b>✓ Approved</b> by ${esc(A.map((x) => `${x.byLabel} (${ptDate(x.at)})`).join(', '))}. It moves to Approved at our next update.</div>` : ''}
    <button type="button" class="ft-go ${mine ? 'on' : ''}" data-pt="approve" data-id="${esc(id)}" aria-pressed="${mine}">${mine ? 'Withdraw approval' : 'Go ahead'}</button></div>`;
}
function ftFruitCard(x, i) {
  const it = x.it; const b = x.b; const A = (PT.D.approve[it.id] || []).length;
  return `<article class="gs-panel ft-f ${A ? 'ft-ok' : ''}" id="it-${esc(it.id)}"><span class="gs-knob ${A ? '' : 'hot'}">${A ? '✓' : i + 1}</span>
    <div class="ft-c-top"><span class="ft-lab ft-l-eff">${esc(ftEffTxt(b.eff))}</span>${ftSevTxt(b.sev) ? `<span class="ft-lab">${esc(ftSevTxt(b.sev))}</span>` : ''}</div>
    <h3>${esc(it.title)}</h3>
    <p class="ft-line">${esc(it.line || '')}</p>
    ${it.why ? `<p class="ft-why"><b>Why:</b> ${esc(it.why)}</p>` : ''}
    ${it.willBe ? `<p class="ft-why"><b>Aim:</b> ${esc(it.willBe)}</p>` : ''}
    <div class="ft-c-f">${ftSize(b)}${ftDeptDots(it)}${ptActs(it.id)}</div>
    ${it.next ? `<p class="ft-next"><b>First step:</b> ${esc(it.next)}${it.owner ? ` <span class="pt-muted">(${esc(it.owner)})</span>` : ''}</p>` : ''}
    ${ftGo(it.id)}</article>`;
}
function ftFruitPage() {
  const all = ftFruit(true); const L = ftFruit();
  const top = L.slice(0, 5); const rest = L.slice(5, 10);
  const row = (x) => `<li class="ft-rest ft-frow" id="it-${esc(x.it.id)}"><div><b>${esc(x.it.title)}</b><span class="pt-muted"> · ${esc(ftEffTxt(x.b.eff))}${ftSevTxt(x.b.sev) ? ', ' + esc(ftSevTxt(x.b.sev).toLowerCase()) : ''}</span>${x.it.line ? `<p>${esc(trunc(x.it.line, 160))}</p>` : ''}</div>${x.b.big ? `<span class="ft-rv">${esc(ptMoney(x.b.big.valueMonthly))} <small>${esc(FT_BASIS[x.b.big.basis])}</small></span>` : '<span></span>'}<span class="ft-fr-a">${ptActs(x.it.id)}${ftGo(x.it.id, true)}</span></li>`;
  return `${ftHead('Lowest-hanging fruit', 'Low effort, clear benefit: ready for your go-ahead')}
    ${ftDeptBar(all.map((x) => x.it))}
    ${top.length ? `<div class="ft-fgrid">${top.map(ftFruitCard).join('')}</div>` : ftEmpty('Nothing waiting for a decision in this department.')}
    ${rest.length ? `${ftSh('Next in line')}<section class="gs-panel"><ul class="gs-well ft-latel">${rest.map(row).join('')}</ul></section>` : ''}`;
}

/* ---------- Studio: approvals from the portal ---------- */
/** Latest approve/unapprove per founder per item; an item with at least one standing approval moves to Approved. */
function itApprovals(e) {
  const last = {}; (e.reportFeedback || []).forEach((x) => { if (x.type === 'approve' || x.type === 'unapprove') { const k = x.elementId + '|' + x.by; if (!last[k] || String(x.at) >= String(last[k].at)) last[k] = x; } });
  const by = {}; Object.values(last).forEach((x) => { if (x.type === 'approve') (by[x.elementId] = by[x.elementId] || []).push(x); }); return by;
}
/** Run after every merge. Moves approved items from Found, Investigating or Proposed to Approved and notes who and when;
    a withdrawn approval moves an item back only if the portal moved it and nothing else has changed its stage since. */
function itApplyApprovals(e) {
  const A = itApprovals(e); const moved = [];
  live(e.items || []).forEach((it) => {
    const a = A[it.id];
    if (a && FT_OPEN.includes(it.stage)) {
      const first = a.slice().sort((x, y) => String(x.at).localeCompare(String(y.at)))[0];
      it.stageWas = it.stage; it.stage = 'approved'; it.stageSince = todayISO(); it.stageSinceSure = 'true'; it.stageSinceNote = ''; it.approvedVia = 'portal'; it.approvedBy = a.map((x) => x.byLabel).join(', '); it.approvedAt = String(first.at || '').slice(0, 10); touch(it); moved.push(it);
    } else if (!a && it.approvedVia === 'portal' && it.stage === 'approved' && it.stageWas) {
      it.stage = it.stageWas; delete it.stageWas; delete it.approvedVia; delete it.approvedBy; delete it.approvedAt; touch(it); moved.push(it);
    }
  });
  return moved;
}
