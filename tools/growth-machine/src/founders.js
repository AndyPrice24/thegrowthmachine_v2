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
    ${it.blueprint ? `<button type="button" class="pt-more ft-bpbtn" data-pt="bp" data-id="${esc(it.id)}">See the plan →</button>` : ''}${m ? `<button type="button" class="pt-more" data-pt="move" data-id="${esc(m.id)}">The story so far →</button>` : ''}</article>`;
}
function ftProjects() {
  const bpIt = PT.bp && live(E().items || []).find((x) => x.id === PT.bp && x.blueprint);
  if (bpIt) return `<button type="button" class="ft-back" data-pt="bp" data-id="">◂ All projects</button>${ftHead(esc(ITEM_STAGE_NAME[bpIt.stage] || 'Project') + ' · the plan', esc(bpIt.blueprint.title || bpIt.title), esc(bpIt.title))}
    <div class="ft-bpacts">${ptActs('bp_' + bpIt.id)}<span class="pt-muted pt-small">Comment or red-flag the plan as a whole</span></div><div class="ft-bp">${bpRender(E(), bpIt, true)}</div>`;
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

/* ---------- 6. Report: TGM's path, week by week ----------
   engagement.weeks [{ id, start (Monday), end, done (one line each, plain words), next (optional) }] are written by TGM for
   the founders. Wins come from the key changes' dated timeline (win: true). Days come from the snapshot (stats.days),
   by calendar month and by week; the diary itself never reaches the portal. */
function ftReport() {
  const e = E(); const g = e.engagement; const today = todayISO(); const w = ptWeek(e); const D = (PT.R.stats || {}).days; const S = g.status || {};
  const J = journey(e, { portal: true }); const wins = J.past.filter((x) => x.win);
  const W = live(g.weeks || []).slice().sort((a, b) => String(a.start).localeCompare(String(b.start))); const Wn = W.slice(-4), Wold = W.slice(0, -4);
  // days: needed against used by calendar month
  const daysCard = D ? `<section class="gs-panel ft-rd"><div class="gs-ph"><h2>Days used</h2><span class="s">${hxF1(D.used)} of ${D.total}</span></div>
      <div class="ft-rdm">${D.months.map((m) => { const mx = Math.max(m.needed * 1.5, m.used, 1); const cur = today >= m.a && today <= m.b; return `<div class="ft-rdr ${cur ? 'cur' : ''}"><span>${esc(m.name.split(' ')[0])}${cur ? ' <em>now</em>' : ''}</span><span class="ft-rdb"><i style="width:${Math.min(100, m.used / mx * 100)}%" class="${m.used > m.needed ? 'over' : ''}"></i><b style="left:${m.needed / mx * 100}%"></b></span><span><b>${hxF1(m.used)}</b> of ${m.needed}${m.used > m.needed ? ` <em class="ft-bank">+${hxF1(m.used - m.needed)}</em>` : ''}</span></div>`; }).join('')}</div>
      <p class="ft-rdn">${hxF1(D.used)} days used against ${hxF1(D.needToDate)} at an even pace to date.${D.frontLoad ? ' ' + esc(D.frontLoad) : ''}</p></section>` : '';
  const planCard = `<section class="gs-panel ft-rp"><div class="gs-ph"><h2>The plan</h2><span class="s">${esc(fmtD(g.start, { day: 'numeric', month: 'short' }))} – ${esc(fmtD(g.end, { day: 'numeric', month: 'short', year: 'numeric' }))}</span></div><div class="pt-gantt ft-gantt">${phaseGantt(e)}</div>
      <div class="ft-revs">${splitList(g.reviewDates).map((d) => `<span class="${d < today ? 'past' : d === splitList(g.reviewDates).find((x) => x >= today) ? 'next' : ''}">Review ${esc(fmtD(d, { day: 'numeric', month: 'short' }))}</span>`).join('')}</div></section>`;
  const winsCard = `<section class="gs-panel ft-rw"><div class="gs-ph"><h2>Wins</h2><span class="s">${wins.length}</span></div><ul class="gs-well ft-wl">${wins.slice().reverse().slice(0, 4).map((x) => `<li class="ft-win"><span class="ft-wd">${esc(x.label || '')}</span><div><p>${esc(x.text)}</p></div></li>`).join('') || '<li class="pt-muted" style="padding:8px">Recorded as they happen.</li>'}</ul></section>`;
  const weekCard = (wk, i) => { const n = Math.floor(daysBetween(g.start, wk.start) / 7) + 1; const cur = today >= wk.start && today <= wk.end;
    const days = D && D.weeks ? D.weeks[wk.start] || 0 : null;
    return `<article class="gs-panel ft-wk ${cur ? 'cur' : ''}"><span class="gs-knob ${cur ? 'hot' : ''}">${n}</span><div class="ft-wkh"><b>Week ${n}</b><span>${esc(fmtD(wk.start, { day: 'numeric', month: 'short' }))} – ${esc(fmtD(wk.end, { day: 'numeric', month: 'short' }))}${cur ? ' · this week' : ''}</span>${days != null ? `<span class="ft-wkd">${hxF1(days)} day${days === 1 ? '' : 's'}</span>` : ''}</div>
      <ul class="ft-wkl">${ptLines(wk.done).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
      ${cur && (wk.next || S.next) ? `<div class="ft-wkn"><b>Next</b><ul>${ptLines(wk.next || S.next).map((l) => `<li>${esc(l)}</li>`).join('')}</ul></div>` : ''}</article>`; };
  const st = engagementStatus(e); const waiting = st.reqs.filter((r) => r._status === 'Waiting' || r._status === 'Overdue').sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  const next = J.next.filter((x) => x.date && x.date >= today).slice(0, 6);
  const comingCard = `<section class="gs-panel"><div class="gs-ph"><h2>Coming up</h2></div><ul class="gs-well ft-wl">${next.map((x) => `<li class="ft-win"><span class="ft-wd ft-wd-n">${esc(x.label || '')}</span><div><p>${esc(x.text)}</p></div></li>`).join('') || '<li class="pt-muted" style="padding:8px">Nothing dated yet.</li>'}</ul></section>`;
  return `${ftHead(`Report · week ${w.cur} of ${w.weeks}`, 'What we\'ve done, and what\'s next', esc(S.headline || ''))}
    ${planCard}
    <div class="ft-rtop">${daysCard}${comingCard}</div>
    ${ftSh('Week by week', `${W.length} week${W.length === 1 ? '' : 's'}`)}
    ${W.length ? `<div class="ft-wks">${Wn.map(weekCard).join('')}</div>${Wold.length ? `<details class="ft-wold"><summary>Earlier weeks (${Wold.length})</summary><div class="ft-wks">${Wold.map(weekCard).join('')}</div></details>` : ''}` : ftEmpty('The weekly report starts with the next update.')}
    <div class="ft-rbot"><div class="ft-rcol">
      ${winsCard}</div>
      <section class="gs-panel"><div class="gs-ph"><h2>What we need from you</h2><span class="s">${waiting.length} open</span></div><div class="ft-need">
        ${(PT.R.asks || []).length ? `<p class="pt-sub-h">Decisions</p>${PT.R.asks.map((a) => `<button type="button" class="ft-ask2" data-pt="discuss" data-id="${esc(a.id)}">${esc(a.title)}</button>`).join('')}` : ''}
        ${waiting.length ? `<p class="pt-sub-h">Information requested</p>${waiting.slice(0, 8).map((r) => `<div class="ft-req"><span>${esc(r.item)}</span><span class="pt-muted">${esc(r.owner || '')}${r.dueDate ? ` · due ${esc(fmtD(r.dueDate))}` : ''}</span>${r._status === 'Overdue' ? `<em>${Math.max(0, daysBetween(r.dueDate, today))}d late</em>` : ''}</div>`).join('')}${waiting.length > 8 ? `<p class="pt-muted pt-small">and ${waiting.length - 8} more</p>` : ''}` : '<p class="pt-muted">Nothing outstanding.</p>'}</div></section></div>
    ${(g.delays || []).length ? `${ftSh('Delays and changes')}<section class="gs-panel"><table class="pt-tbl" style="margin:0 16px 16px;width:calc(100% - 32px)"><thead><tr><th>Raised</th><th>What happened</th><th class="r">Days</th><th>Status</th></tr></thead><tbody>${g.delays.map((d) => `<tr><td>${esc(fmtD(d.dateRaised))}</td><td>${esc(d.description || d.cause || '')}</td><td class="r">${num(d.daysImpact)}</td><td>${esc(d.status || '')}</td></tr>`).join('')}</tbody></table></section>` : ''}`;
}

/* ---------- 8. Processes & systems ---------- */
const FT_TEAM = { sales: ['Sales', 'var(--gd-sales)'], marketing: ['Marketing', '#facc15'], cs: ['Client Success', 'var(--gd-cs)'], ops_onb: ['Ops: onboarding', 'var(--gd-ops)'],
  ops_tech: ['Ops: tech teams', '#fb923c'], ops: ['Operations', 'var(--gd-ops)'], product: ['Product', 'var(--gd-prod)'], leadership: ['Leadership', 'var(--gd-lead)'], finance: ['Finance', 'var(--gd-admin)'] };
const ftTeam = (k) => FT_TEAM[k] || [k || 'Other', '#94a3b8'];
/** A system's name without TGM's working notes (who told us, 'confirm'). */
const ftTool = (t) => String(t.name || '').replace(/[,;]?\s*(per [A-Z][\w-]*\b|heard as '[^']*'|confirm\b)/g, '').replace(/\(\s*\)/g, '').replace(/\s+\)/g, ')').replace(/\s{2,}/g, ' ').trim();
const FT_FAMILY = [['platform', 'The platform', '#22d3ee'], ['work', 'Work management', '#ffa23a'], ['ai', 'AI & automation', '#a78bfa'], ['sales', 'Sales & marketing', '#4f9cff'],
  ['comms', 'Communication', '#34d399'], ['listings', 'Listing networks', '#f472b6'], ['finance', 'Finance', '#facc15'], ['', 'Not grouped yet', '#94a3b8']];
const FT_AU_COLS = [['Idea', ['Idea', '']], ['Proposed', ['Proposed']], ['Agreed or under way', ['Agreed', 'In progress']], ['Live', ['Live']]];
function ftProcData() {
  const e = E(); const procs = live(e.processes || []); const tools = live(e.tools || []); const tById = {}; tools.forEach((t) => { tById[t.id] = t; });
  const autos = live(e.automations || []); const auStep = {}; autos.forEach((a) => splitList(a.stepIds).forEach((s) => { (auStep[s] = auStep[s] || []).push(a); }));
  const flags = (s) => (s.flags || []).filter((f) => f.type === 'issue' || f.type === 'weakness');
  const pain = (s) => !!(s.painPoint || flags(s).length);
  return { e, procs, tools, tById, autos, auStep, flags, pain, mapped: procs.filter((p) => (p.steps || []).length) };
}
function ftStrip(p, D) {
  return `<span class="ft-strip">${(p.steps || []).map((s) => `<i class="${s.automated ? 'auto' : D.pain(s) ? 'pain' : ''}${D.auStep[s.id] && !s.automated ? ' opp' : ''}"></i>`).join('')}</span>`;
}
function ftProcCard(p, D) {
  const [tn, tc] = ftTeam(p.team); const st = p.steps || []; const pains = st.filter(D.pain).length; const auto = st.filter((s) => s.automated).length;
  const opps = D.autos.filter((a) => a.processId === p.id && a.status !== 'Live').length; const tl = [...new Set(st.map((s) => s.toolId).filter((t) => D.tById[t]))];
  return `<button type="button" class="gs-panel ft-pc" data-pt="proc" data-id="${esc(p.id)}" style="--tc:${tc}"><span class="ft-pct"><i></i>${esc(tn)}</span><b>${esc(p.name)}</b>${ftStrip(p, D)}
    <span class="ft-pcm"><span>${st.length} steps</span>${auto ? `<span class="ok">${auto} automatic</span>` : ''}${pains ? `<span class="bad">${pains} pain point${pains === 1 ? '' : 's'}</span>` : ''}${opps ? `<span class="amb">${opps} to automate</span>` : ''}</span>
    ${tl.length ? `<span class="ft-pctl">${tl.slice(0, 4).map((t) => `<em>${esc(D.tById[t].name.replace(/ \(.*$/, ''))}</em>`).join('')}${tl.length > 4 ? `<em>+${tl.length - 4}</em>` : ''}</span>` : ''}</button>`;
}
function ftAuCard(a, D, withProc = true) {
  const p = D.procs.find((x) => x.id === a.processId); const n = splitList(a.stepIds).length;
  return `<div class="ft-au"><b>${esc(a.title)}</b>${withProc && p ? `<button type="button" class="pt-link" data-pt="proc" data-id="${esc(p.id)}">${esc(p.name)}${n ? ` · ${n} step${n === 1 ? '' : 's'}` : ''}</button>` : ''}
    <span class="ft-aum">${a.system ? `<span>${esc(trunc(a.system, 60))}</span>` : ''}${a.effort ? `<em>${esc(a.effort)} effort</em>` : ''}${!withProc ? `<em class="st">${esc(a.status || 'Idea')}</em>` : ''}</span></div>`;
}
function ftProcDetail(p, D) {
  const [tn, tc] = ftTeam(p.team); const st = p.steps || []; const tl = [...new Set(st.map((s) => s.toolId).filter((t) => D.tById[t]))];
  const inSteps = new Set(st.map((s) => s.id)); const whole = D.autos.filter((a) => a.processId === p.id && !splitList(a.stepIds).some((x) => inSteps.has(x)));
  const step = (s, i) => { const au = (D.auStep[s.id] || []); const t = D.tById[s.toolId];
    return `<li class="${s.automated ? 'auto' : D.pain(s) ? 'pain' : ''}"><span class="ft-fk">${i + 1}</span><div class="ft-fb"><b>${esc(s.name)}</b>
      <span class="ft-fm">${s.actorLabel ? `<span>${esc(s.actorLabel)}</span>` : ''}${t ? `<em>${esc(t.name.replace(/ \(.*$/, ''))}</em>` : ''}${s.automated ? '<em class="ok">Automatic</em>' : ''}${s.kind === 'decision' ? '<em>Decision</em>' : ''}</span>
      ${s.painPoint ? `<p class="ft-fp">${esc(s.painPoint)}</p>` : ''}${(() => { const fl = D.flags(s).map((f) => `<p class="ft-ff"><em>${esc((FLAG_TYPES[f.type] || [f.type])[0])}</em> ${esc(f.text)}</p>`); return fl.slice(0, 2).join('') + (fl.length > 2 ? `<details class="ft-fmore"><summary>${fl.length - 2} more note${fl.length === 3 ? '' : 's'}</summary>${fl.slice(2).join('')}</details>` : ''); })()}
      ${au.map((a) => `<div class="ft-fa"><span>${a.status === 'Live' ? 'Automated' : 'Could be automated'}</span><b>${esc(a.title)}</b><span class="pt-muted">${esc(a.status || 'Idea')}${a.effort ? ` · ${esc(a.effort)} effort` : ''}</span></div>`).join('')}</div></li>`; };
  return `<button type="button" class="ft-back" data-pt="proc" data-id="">◂ All processes and systems</button>
    <section class="pt-hello ft-hello" style="--tc:${tc}"><div class="pt-eyebrow"><span class="ft-pct"><i></i>${esc(tn)}</span></div><h1>${esc(p.name)}</h1>${p.summary ? `<p class="pt-lede">${esc((String(p.summary).match(/[^.!?]+[.!?]+(\s|$)/g) || [p.summary]).slice(0, 2).join('').trim())}</p>` : ''}
      <p class="ft-io">${p.inputs ? `<span>${esc(p.inputs)}</span>` : ''}${p.inputs && p.outputs ? '<b>→</b>' : ''}${p.outputs ? `<span>${esc(p.outputs)}</span>` : ''}${p.frequency ? `<em>${esc(p.frequency)}</em>` : ''}</p></section>
    <div class="ft-pd"><section class="gs-panel"><div class="gs-ph"><h2>How it works today</h2><span class="s">${st.length} steps</span></div><ol class="ft-flow">${st.map(step).join('')}</ol>
        <p class="ft-key"><span class="auto">Automatic</span><span class="pain">Pain point</span><span class="opp">Could be automated</span></p></section>
      <div class="ft-rcol"><section class="gs-panel"><div class="gs-ph"><h2>Systems used</h2><span class="s">${tl.length}</span></div><ul class="ft-tl">${tl.map((t) => { const x = D.tById[t]; return `<li><span>${esc(ftTool(x))}</span><b>${num(x.monthlyCost) ? esc(fmtMoney(x.monthlyCost)) + '/mo' : ''}</b></li>`; }).join('') || '<li class="pt-muted">None recorded.</li>'}</ul></section>
        ${whole.length ? `<section class="gs-panel"><div class="gs-ph"><h2>For the whole process</h2><span class="s">${whole.length}</span></div><div class="ft-aul">${whole.map((a) => ftAuCard(a, D, false)).join('')}</div></section>` : ''}
        <button type="button" class="gs-panel ft-full" data-pt="procfull" data-id="${esc(p.id)}"><b>Open the full process map</b><span>Every hand-off, time and source, read only</span></button></div></div>`;
}
function ftProc() {
  const D = ftProcData();
  if (PT.proc && PT.procFull) return `<button type="button" class="ft-back" data-pt="procfull" data-id="">◂ Back to ${esc((D.procs.find((p) => p.id === PT.proc) || {}).name || 'the process')}</button><div class="pt-studio">${viewProcesses(E())}</div>`;
  const P = PT.proc && D.procs.find((p) => p.id === PT.proc); if (P) return ftProcDetail(P, D);
  const teams = [...new Set(D.mapped.map((p) => p.team))]; const tk = PT.pteam && teams.includes(PT.pteam) ? PT.pteam : '';
  const mp = D.mapped.filter((p) => !tk || p.team === tk).sort((a, b) => b.steps.filter(D.pain).length - a.steps.filter(D.pain).length);
  const steps = D.mapped.flatMap((p) => p.steps); const auto = steps.filter((s) => s.automated).length; const pains = steps.filter(D.pain).length; const probs = steps.reduce((a, s) => a + (s.painPoint ? 1 : 0) + D.flags(s).length, 0);
  const sys = D.tools.filter((t) => t.family !== 'service'); const spend = sys.reduce((a, t) => a + num(t.monthlyCost), 0); const costed = sys.filter((t) => num(t.monthlyCost) || String(t.costKnown) === 'true').length;
  const fams = FT_FAMILY.map(([k, n, c]) => ({ k, n, c, list: sys.filter((t) => (t.family || '') === k).sort((a, b) => num(b.monthlyCost) - num(a.monthlyCost)) })).filter((f) => f.list.length);
  fams.forEach((f) => { f.cost = f.list.reduce((a, t) => a + num(t.monthlyCost), 0); });
  const owners = sys.filter((t) => t.ownerId || t.owner).length, users = sys.filter((t) => num(t.activeUsers) || num(t.seats)).length;
  const reg = live(E().items || []).find((it) => /^Software/i.test(it.title || ''));
  const au = D.autos.filter((a) => { const p = D.procs.find((x) => x.id === a.processId); return !tk || (p && p.team === tk); });
  const unm = D.procs.filter((p) => !(p.steps || []).length);
  const chip = (k, n, c, cnt) => `<button type="button" class="ft-chip ${tk === k ? 'on' : ''}" data-pt="pteam" data-id="${k}" ${c ? `style="--dc:${c}"` : ''}>${c ? '<i></i>' : ''}${esc(n)} <b>${cnt}</b></button>`;
  const srcBtn = ptSrcBtn([{ id: 'src_mgmt', part: 'P&L by month, Mar to Sep 2026' }, { id: 'src_subs_2611', part: "'Monthly costs' tab, Jan to Oct 2026" }, { id: 'src_invoices_2611', part: 'Supplier invoices' }], 'Sources');
  return `${ftHead('Processes &amp; systems', 'How the work flows, and what it runs on', '')}
    <div class="ft-ps">
      <div class="gs-panel ft-st"><span>Processes mapped</span><b>${D.mapped.length}<small> of ${D.procs.length}</small></b><span class="ft-bar"><i style="width:${D.mapped.length / Math.max(1, D.procs.length) * 100}%"></i></span></div>
      <div class="gs-panel ft-st"><span>Steps that run themselves</span><b>${auto}<small> of ${steps.length}</small></b><span class="ft-bar"><i class="ok" style="width:${auto / Math.max(1, steps.length) * 100}%"></i></span></div>
      <div class="gs-panel ft-st"><span>Steps with a known problem</span><b>${pains}<small> of ${steps.length}</small></b><span class="ft-bar"><i class="bad" style="width:${pains / Math.max(1, steps.length) * 100}%"></i></span><span class="ft-stn">${probs} problems recorded across them</span></div>
      <div class="gs-panel ft-st"><span>Automation ideas</span><b>${D.autos.length}</b><span class="ft-sts">${FT_AU_COLS.map(([n, s]) => `<em>${D.autos.filter((a) => s.includes(a.status || '')).length} ${esc(n.split(' ')[0].toLowerCase())}</em>`).join('')}</span></div>
    </div>
    ${ftSh('Processes', `${mp.length} mapped`)}
    <div class="ft-filter" role="group" aria-label="Team">${chip('', 'All', '', D.mapped.length)}${teams.map((k) => chip(k, ftTeam(k)[0], ftTeam(k)[1], D.mapped.filter((p) => p.team === k).length)).join('')}</div>
    <div class="ft-pcs">${mp.map((p) => ftProcCard(p, D)).join('')}</div>
    <p class="ft-key"><span class="auto">Automatic</span><span class="pain">Pain point</span><span class="opp">Could be automated</span><span class="plain">Done by hand</span></p>
    ${unm.length && !tk ? `<div class="ft-unm"><span>Not mapped yet</span>${unm.map((p) => `<em>${esc(p.name)}</em>`).join('')}</div>` : ''}
    ${ftSh('Automation', `${au.length} ideas${tk ? ' for ' + esc(ftTeam(tk)[0]) : ''}`)}
    <div class="ft-kb">${FT_AU_COLS.map(([n, s]) => { const EF = { Low: 0, Medium: 1, High: 2 }; const l = au.filter((a) => s.includes(a.status || '')).sort((x, y) => (EF[x.effort] ?? 1) - (EF[y.effort] ?? 1)); return `<div class="ft-kbc"><div class="ft-kbh"><b>${esc(n)}</b><span>${l.length}</span></div>${l.slice(0, 4).map((a) => ftAuCard(a, D)).join('') || '<p class="pt-muted pt-small">None yet.</p>'}${l.length > 4 ? `<details class="ft-kbm"><summary>${l.length - 4} more</summary><div>${l.slice(4).map((a) => ftAuCard(a, D)).join('')}</div></details>` : ''}</div>`; }).join('')}</div>
    ${ftSh('Systems', `${sys.length} systems`)}
    <section class="gs-panel ft-sysw"><p class="ft-spl">Known system costs come to about ${esc(fmtMoney(spend))} a month (as at Sep 2026), ${fams[0] && fams[0].cost ? `${Math.round(fams.find((f) => f.k === 'platform') ? fams.find((f) => f.k === 'platform').cost / Math.max(1, spend) * 100 : 0)}% of it the platform's development and hosting` : ''}. ${srcBtn}</p>
      <p class="ft-dh"><span class="${owners ? '' : 'bad'}">Owner named for ${owners} of ${sys.length}</span><span class="${users ? '' : 'bad'}">Users counted for ${users} of ${sys.length}</span><span>Cost known for ${costed} of ${sys.length}</span>${reg ? `<button type="button" class="pt-link" data-pt="proj" data-id="${esc(reg.id)}">${esc(reg.title)} →</button>` : ''}</p></section>
    <div class="ft-fams">${fams.map((f) => `<section class="gs-panel ft-fam" style="--fc:${f.c}"><div class="gs-ph"><h2><i></i>${esc(f.n)}</h2><span class="s">${f.cost ? esc(fmtMoney(f.cost)) + '/mo · ' : ''}${f.list.length}</span></div>
      <ul class="ft-tl">${f.list.map((t) => `<li><span>${esc(ftTool(t))}${t.overlapNote ? `<em class="ft-ov" title="${esc(t.overlapNote)}">Overlap</em>` : ''}</span><b>${num(t.monthlyCost) ? esc(fmtMoney(t.monthlyCost)) : String(t.costKnown) === 'true' ? '<span class="pt-muted">No charge</span>' : '<span class="pt-muted">cost to confirm</span>'}</b></li>`).join('')}</ul>
      ${[...new Set(f.list.map((t) => t.overlapNote).filter(Boolean))].map((n) => `<p class="ft-ovn">${esc(n)}</p>`).join('')}</section>`).join('')}</div>
    <p class="pt-muted pt-small ft-note">Consulting fees, outsourced sales support and general computer expenses are services, not systems, so they are not shown here.</p>`;
}

/* ---------- 5. Insights ---------- */
const ftJoins = (x) => String(x.joins || '').split('|').map((j) => j.trim()).filter(Boolean);
const ftNoHover = (t) => String(t || '').replace(/\s*Hover[^.]*\.\s*/gi, ' ').trim();
function ftInsights() {
  const e = E(); const all = edList(e, { portal: true }); const list = all.filter(ftDeptOK);
  const byItem = {}; ftItems().forEach((it) => { byItem[it.id] = it; });
  const stg = (k) => (ITEM_STAGES.find(([x]) => x === k) || [0, k])[1];
  if (!all.length) return ftHead('Insights', 'What the numbers say together') + ftEmpty('The first views are being prepared with you.');
  const tile = (x) => `<button type="button" class="gs-panel ft-it ${esc(x.tone || '')}" data-pt="ins" data-id="${esc(x.id)}"><b>${esc(x.stat || '')}</b><span>${esc(x.statLabel || x.title)}</span><em>${esc(x.eyebrow || '')}</em></button>`;
  const card = (x) => { const its = splitList(x.itemIds).map((id) => byItem[id] || (live(e.items || []).find((i) => i.id === id))).filter(Boolean);
    return `<section class="gs-panel ed-card ft-ins ${edWideCls(x)}" id="it-${esc(x.id)}"><div class="pt-ed-top"><div>${edHead(Object.assign({}, x, { sub: ftNoHover(x.sub) }))}</div>${ptActs(x.id)}</div>
      ${edChart(e, x)}
      <div class="ft-inf"><div class="ft-inw"><span>So what</span><p>${esc(x.sowhat || '')}</p></div>
        ${ftJoins(x).length ? `<div class="ft-inj"><span>What it joins</span><p>${ftJoins(x).map((j) => `<em>${esc(j)}</em>`).join('<b>×</b>')}</p></div>` : ''}
        <div class="ft-ina"><span>What we're doing about it</span>${its.length ? its.map((it) => ptPageOf(it.id) ? `<button type="button" class="ft-inl" data-pt="proj" data-id="${esc(it.id)}"><i class="st-${esc(it.stage)}">${esc(stg(it.stage))}</i>${esc(it.title)} →</button>` : `<span class="ft-inl"><i class="st-${esc(it.stage)}">${esc(stg(it.stage))}</i>${esc(it.title)}</span>`).join('') : '<p class="pt-muted">Not yet linked to an item.</p>'}</div></div>
      <div class="ed-foot">${ptSrcBtn(x.sources, 'Sources')}${edCoverage(x)}</div></section>`; };
  return `${ftHead('Insights', 'What the numbers say together', '')}
    <div class="ft-its">${all.map(tile).join('')}</div>
    ${ftSh('The views', `${list.length} of ${all.length}`)}${ftDeptBar(all)}
    ${list.length ? `<div class="ed-grid pt-ed ft-insg">${list.map(card).join('')}</div>` : ftEmpty('No views for this department yet.')}`;
}

/* ---------- 7. Department efficiency ---------- */
const FT_MSTATE = { have: ['Data exists', 'The data is there; not measured yet'], partly: ['Some data', 'Part of the data is there'], missing: ['Not collected yet', 'The data isn\'t collected yet'] };
const FT_RAG = { green: 'On target', amber: 'Near target', red: 'Off target', none: 'No target yet', grey: 'Not tracked yet' };
const ftDeptName = (k) => ((ITEM_DEPTS.find(([x]) => x === k) || [0, k])[1]).replace(' & direction', '').replace(' & platform', '');
function ftDeptStats(e, k) {
  const M = hxMeasures(e, k).map((m) => msrVal(e, m)); const tr = M.filter((m) => m.tracked); const tg = tr.filter((m) => m.hasT);
  return { M, tr, tg, on: tg.filter((m) => m.on).length, untr: M.filter((m) => !m.tracked) };
}
function ftRing(S, c) {
  const n = S.M.length || 1, r = 34, C = 2 * Math.PI * r; const seg = (a, b, col, w = 8) => `<circle cx="44" cy="44" r="${r}" fill="none" stroke="${col}" stroke-width="${w}" stroke-dasharray="${(b - a) / n * C} ${C}" stroke-dashoffset="${-a / n * C}" transform="rotate(-90 44 44)"/>`;
  return `<svg class="ft-ring" viewBox="0 0 88 88" aria-hidden="true"><circle cx="44" cy="44" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="8"/>${S.tr.length ? seg(0, S.tr.length, c) : ''}
    <text x="44" y="42" text-anchor="middle" class="ft-ringn">${S.tr.length}</text><text x="44" y="58" text-anchor="middle" class="ft-ringl">of ${S.M.length}</text></svg>`;
}
function ftMTrend(m) {
  if (!m.trend) return ''; const good = (m.trend === 'up' && m.better !== 'lower') || (m.trend === 'down' && m.better === 'lower');
  return `<span class="ft-mt ${m.trend === 'flat' ? '' : good ? 'good' : 'bad'}">${m.trend === 'up' ? '▲' : m.trend === 'down' ? '▼' : '■'} ${esc(m.trend === 'flat' ? 'Flat' : m.trend === 'up' ? 'Up' : 'Down')}</span>`;
}
function ftSparkM(m) {
  const v = splitList(m.points).map(Number).filter((x) => isFinite(x)); if (v.length < 2) return '';
  const lo = Math.min(...v), hi = Math.max(...v), sp = hi - lo || 1; const pts = v.map((x, i) => `${(i / (v.length - 1) * 200).toFixed(1)},${(36 - (x - lo) / sp * 30).toFixed(1)}`).join(' ');
  return `<div class="ft-msp"><svg viewBox="0 -4 200 44" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><span>${esc(m.pointsSpan || '')}</span></div>`;
}
function ftDeptCard(e, k) {
  const S = ftDeptStats(e, k); const c = `var(--gd-${k})`;
  return `<button type="button" class="gs-panel ft-dc" data-pt="dk" data-id="${k}" style="--dc:${c}"><div class="ft-dch"><b>${esc(ftDeptName(k))}</b><span>${S.tg.length ? `${S.on} of ${S.tg.length} on target` : 'No targets set yet'}</span></div>
    <div class="ft-dcb">${ftRing(S, c)}<ul>${S.M.filter((m) => String(m.phase) !== '2' || m.tracked).map((m) => `<li class="r-${m.rag}"><i></i><span>${esc(m.name)}</span>${m.tracked ? `<b>${esc(m.value)}</b>` : ''}</li>`).join('')}${S.M.filter((m) => String(m.phase) === '2' && !m.tracked).length ? `<li class="ft-dmore"><span>+ ${S.M.filter((m) => String(m.phase) === '2' && !m.tracked).length} more in the full model</span></li>` : ''}</ul></div>
    <div class="ft-dcf"><span>${S.tr.length} tracked</span><span>${S.untr.filter((m) => m.status === 'have').length} with data ready</span><span>${S.untr.filter((m) => m.status !== 'have').length} to set up</span></div></button>`;
}
function ftDeptPage(e, k) {
  const S = ftDeptStats(e, k); const c = `var(--gd-${k})`; const its = ftItems().filter((it) => splitList(it.depts).includes(k));
  const stg = (s) => (ITEM_STAGES.find(([x]) => x === s) || [0, s])[1]; const proj = its.filter((it) => FT_PROJECT.includes(it.stage)), open = its.filter((it) => !FT_PROJECT.includes(it.stage) && it.stage !== 'parked');
  const tracked = (m) => `<article class="gs-panel ft-mc r-${m.rag}" id="it-${esc(m.id)}"><div class="ft-mch"><span class="ft-rag">${esc(FT_RAG[m.rag])}</span>${ptActs(m.id)}</div><h3>${esc(m.name)}</h3>
      <div class="ft-mv"><b>${esc(m.value)}</b><span>${esc(m.unit || '')}</span></div>
      <p class="ft-mm">${m.target ? `<span>Target <b>${esc(m.target)}</b></span>` : `<span>${m.targetBy === 'now' ? 'Target to set' : 'Target after a four-week baseline'}</span>`}${ftMTrend(m)}${m.asAt ? `<span>As at ${esc(m.asAt)}</span>` : ''}</p>
      ${ftSparkM(m)}${m.trendText ? `<p class="ft-mx">${esc(m.trendText)}</p>` : ''}
      <p class="ft-mw">${esc(m.why || '')} · ${esc(m.rhythm || '')}</p><div class="ed-foot">${ptSrcBtn((m.sources || []).concat(m.pointsSources || []), 'Sources')}</div></article>`;
  return `<button type="button" class="ft-back" data-pt="dk" data-id="">◂ All departments</button>
    <section class="pt-hello ft-hello ft-dhd" style="--dc:${c}"><div><div class="pt-eyebrow"><span class="ft-pct" style="--tc:${c}"><i></i>Department efficiency</span></div><h1>${esc(ftDeptName(k))}</h1>
      <p class="pt-lede">${S.tg.length ? `${S.on} of ${S.tg.length} measures with a target are on target.` : 'No targets set yet.'} ${S.tr.length} of ${S.M.length} measures tracked; ${S.untr.length} not tracked yet.</p></div>
      <button type="button" class="ft-printbtn" data-pt="print">Print for the department head</button><p class="ft-printonly">${esc(e.client.name || '')} · prepared by The Growth Machine · ${esc(fmtD(todayISO(), { day: 'numeric', month: 'long', year: 'numeric' }))}</p></section>
    ${ftSh('How the department is measured')}<section class="gs-panel ft-efp">${efDiagram(e, k)}</section>
    ${S.tr.length ? `${ftSh('Tracked', String(S.tr.length))}<div class="ft-mcs">${S.tr.map(tracked).join('')}</div>` : ''}
    ${S.untr.length ? `${ftSh('Not tracked yet', String(S.untr.length))}<section class="gs-panel ft-mu"><table class="pt-tbl"><thead><tr><th>Measure</th><th>Why it matters</th><th>From</th><th>How often</th><th>Where it stands</th></tr></thead><tbody>
      ${S.untr.slice().sort((a, b) => String(a.phase || 1).localeCompare(String(b.phase || 1))).map((m) => `<tr id="it-${esc(m.id)}" class="${String(m.phase) === '2' ? 'ft-p2' : ''}"><td><b>${esc(m.name)}</b>${String(m.phase) === '2' ? '<span class="ft-p2t">Full model</span>' : ''}</td><td>${esc(m.why || '')}</td><td>${esc(m.source || '')}</td><td>${esc(m.rhythm || '')}</td><td><span class="ft-mst ms-${esc(m.status || 'missing')}">${esc((FT_MSTATE[m.status] || FT_MSTATE.missing)[0])}</span>${m.note ? `<span class="pt-muted pt-small">${esc(m.note)}</span>` : ''}</td></tr>`).join('')}</tbody></table>
      <p class="pt-muted pt-small ft-mbl">NRR and the money measures get targets now, from their March to September 2026 history. Every other measure runs for four full weeks to set its baseline; its target is then agreed with the department head.</p></section>` : ''}
    ${its.length ? `<div class="ft-dwrap">${ftSh('Work in this department', `${proj.length} under way · ${open.length} not started`)}<div class="ft-dw">${proj.concat(open).slice(0, 8).map((it) => `<button type="button" class="ft-inl" data-pt="proj" data-id="${esc(it.id)}"><i class="st-${esc(it.stage)}">${esc(stg(it.stage))}</i>${esc(it.title)} →</button>`).join('')}</div></div>` : ''}`;
}
function ftDepts() {
  const e = E(); const ks = ITEM_DEPTS.map(([k]) => k).filter((k) => hxMeasures(e, k).length);
  if (PT.dk && ks.includes(PT.dk)) return ftDeptPage(e, PT.dk);
  const all = ks.map((k) => ftDeptStats(e, k)); const n = (f) => all.reduce((a, S) => a + f(S), 0);
  const M = n((S) => S.M.length), M1 = n((S) => S.M.filter((m) => String(m.phase) !== '2').length), tr = n((S) => S.tr.length), tg = n((S) => S.tg.length), on = n((S) => S.on), ready = n((S) => S.untr.filter((m) => m.status === 'have').length);
  return `${ftHead('Department efficiency', 'How each department is running', '')}
    <div class="ft-ps">
      <div class="gs-panel ft-st"><span>Measures proposed</span><b>${M1}<small> to start</small></b><span class="ft-stn">${M} in the full model; team level only; for you to confirm</span></div>
      <div class="gs-panel ft-st"><span>Tracked</span><b>${tr}<small> of ${M}</small></b><span class="ft-bar"><i class="ok" style="width:${tr / Math.max(1, M) * 100}%"></i></span></div>
      <div class="gs-panel ft-st"><span>On target</span><b>${on}<small> of ${tg} with a target</small></b><span class="ft-stn">Money measures get targets now; the rest after a four-week baseline</span></div>
      <div class="gs-panel ft-st"><span>Data ready, not measured yet</span><b>${ready}</b><span class="ft-stn">${M - tr - ready} still to set up</span></div>
    </div>
    ${ftSh('Departments')}<div class="ft-dcs">${ks.map((k) => ftDeptCard(e, k)).join('')}</div>
    <p class="ft-key ft-rkey"><span class="r-green">On target</span><span class="r-amber">Near target</span><span class="r-red">Off target</span><span class="r-none">Tracked, no target yet</span><span class="r-grey">Not tracked yet</span></p>`;
}
