/* ============================================================
   Founder portal: what a founder sees from their personal link. Served by TGM's Apps Script web app from a page the
   Studio publishes (the Studio's own code plus this portal shell) and a data snapshot. Sections:
   Overview · Our work · Leaks & opportunities · Processes (read only) · Evidence (read only) · Insights (to come).
   Processes and Evidence are the Studio's own pages, locked to read only: navigation works, nothing can be changed,
   TGM-only notes stay hidden (share mode). Views, comments, red flags and summaries go back through the web app.
   ============================================================ */
let PORTAL_ON = false;
const PT = { S: null, R: null, me: null, ev: [], sec: 'home', open: {}, drafts: {}, replyTo: {}, busy: {}, lf: 'all', tab: 'found', modal: '', D: null };
/* Studio actions that only change what is shown. Everything else is blocked in the portal. */
const PT_ACTIONS = new Set(['sub', 'showAll', 'pvPick', 'pvBack', 'pvFocus', 'pvJourney', 'pvHl', 'pvSet', 'pvTick', 'flowStep', 'flowClear', 'zoom', 'setIntelFilter', 'goSrc', 'tab']);
const PT_UI_OK = new Set(['compare', 'execView', 'ghosts', 'showCost', 'prioOnly']);
const PT_SECTIONS = [['home', 'Overview', 'i-home'], ['work', 'Our work', 'i-work'], ['leaks', 'Leaks & opportunities', 'i-leak'], ['proc', 'Processes', 'i-proc'], ['evid', 'Evidence', 'i-evid'], ['ins', 'Insights', 'i-ins']];
/** Short money: R494k, R1.06m. */
function ptMoney(v) { v = num(v); const sym = fmtShort(0).replace(/[\d.,\s]/g, '') || 'R'; const a = Math.abs(v); const s = a >= 1e6 ? (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace(/\.?0+$/, '') + 'm' : a >= 1e3 ? Math.round(a / 1e3) + 'k' : String(Math.round(a)); return (v < 0 ? '-' : '') + sym + s; }
const ptName = (k) => (PT_SECTIONS.find((s) => s[0] === k) || ['', ''])[1];
function ptActionOK(a) {
  const k = a.dataset.action;
  if (!PT_ACTIONS.has(k)) return false;
  if (k === 'tab') return ['processes', 'evidence'].includes(a.dataset.id);
  return true;
}
function ptChangeOK(t) {
  if (t.closest && t.closest('#pt-sum, #pt-modal')) return true;
  if (t.dataset && t.dataset.ui) return PT_UI_OK.has(t.dataset.ui);
  if (t.dataset && t.dataset.action) return PT_ACTIONS.has(t.dataset.action);
  return false;
}

/* ---------- boot ---------- */
function portalBoot(S) {
  PORTAL_ON = true; PT.S = S; PT.R = S.report; PT.me = S.me || { id: 'owner', label: 'The Growth Machine', owner: true }; PT.ev = S.events || [];
  const eng = normalise(PT.R.eng); eng.meta.tsMigrated = true;
  db = { activeId: eng.id, engagements: { [eng.id]: eng } };
  save = function () {}; saveUI = function () {}; flushSave = function () {};
  Object.assign(ui, { tab: 'home', sub: {}, all: {}, share: true, anon: false, scenario: 'current', flowAudience: 'client', theme: 'light' });
  document.documentElement.dataset.theme = 'light';
  document.body.className = 'portal';
  const root = document.getElementById('pt-app') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'pt-app' }));
  root.innerHTML = ptShell();
  ptDerive();
  if (S.focus) { const f = S.focus; if (PT.R.itemIds.includes(f) || (PT.R.recIds || []).includes(f)) { PT.sec = 'leaks'; PT.tab = (PT.R.recIds || []).includes(f) ? 'recs' : 'found'; PT.open[f] = true; } else if (f.startsWith('ask-') || f === 'report') { PT.modal = f; } }
  portalRender();
  if (S.focus && PT.open[S.focus]) setTimeout(() => ptFocus(S.focus), 120);
  setInterval(() => { if (document.hidden) return; const a = document.activeElement; if (a && a.tagName === 'TEXTAREA') return;
    ptCall({ op: 'refresh' }).then((res) => { const n = PT.ev.length; ptSetEvents(res.events); if (PT.ev.length !== n) portalRender(); }).catch(() => {}); }, 60000);
}
const PT_ICONS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-home" viewBox="0 0 24 24"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></symbol>
  <symbol id="i-work" viewBox="0 0 24 24"><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19H2"/></symbol>
  <symbol id="i-leak" viewBox="0 0 24 24"><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/></symbol>
  <symbol id="i-proc" viewBox="0 0 24 24"><rect x="3" y="4" width="6" height="5" rx="1"/><rect x="15" y="4" width="6" height="5" rx="1"/><rect x="9" y="15" width="6" height="5" rx="1"/><path d="M6 9v3h12V9"/><path d="M12 12v3"/></symbol>
  <symbol id="i-evid" viewBox="0 0 24 24"><path d="M4 4h12l4 4v12H4z"/><path d="M8 13h8M8 17h5M8 9h4"/></symbol>
  <symbol id="i-ins" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/><path d="M8 12l2-2 2 2 2-3"/></symbol>
  <symbol id="i-pdf" viewBox="0 0 24 24"><path d="M12 4v11"/><path d="M7 10l5 5 5-5"/><path d="M5 20h14"/></symbol>
  <symbol id="i-chat" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></symbol>
  <symbol id="i-flag" viewBox="0 0 24 24"><path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/></symbol>
  <symbol id="i-info" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></symbol>
  <symbol id="i-x" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
</svg>`;
const ptIcon = (id) => `<svg class="pt-ic" aria-hidden="true"><use href="#${id}"/></svg>`;
function ptShell() {
  const R = PT.R; const me = PT.me;
  const nav = (cls) => PT_SECTIONS.map(([k, n, ic], i) => `${cls === 'rail' && i === 3 ? '<div class="pt-nav-h">Your business</div>' : ''}<button type="button" data-pt="go" data-sec="${k}">${ptIcon(ic)}<span>${cls === 'tab' && k === 'leaks' ? 'Leaks' : esc(n)}</span>${k === 'ins' && cls === 'rail' ? '<span class="pt-soon">soon</span>' : ''}</button>`).join('');
  return `${PT_ICONS}<div class="pt-shell">
    <aside class="pt-rail" aria-label="Portal navigation">
      <div class="pt-brand">THE <b>GROWTH</b> MACHINE</div>
      <div class="pt-client"><div class="pt-client-n">${esc(R.client)}</div><div class="pt-client-s">${esc(R.title || 'Founder portal')}</div></div>
      <nav class="pt-nav">${nav('rail')}</nav>
      <div class="pt-rail-foot"><div class="pt-who"><span class="pt-avatar">${esc((me.label || '?').trim().charAt(0).toUpperCase())}</span><div><b>${esc(me.label)}</b>${me.owner ? '<br>Owner view' : ''}</div></div>
        <div>${me.owner ? 'Your visits aren’t counted as views.' : `Read only · comments are shared with ${esc(ptOthers() || 'the team')}`}</div></div>
    </aside>
    <div class="pt-body">
      <header class="pt-top"><div class="pt-top-in">
        <span class="pt-mclient">${esc(R.client)}</span>
        <span class="pt-crumb" id="pt-crumb"></span><span class="pt-spacer"></span>
        <span class="pt-updated"><span class="pt-dot"></span>Updated ${esc(ptDate(R.publishedAt, true))}</span>
        <button type="button" class="pt-btn" data-pt="comments" title="All comments">${ptIcon('i-chat')}<span class="pt-lbl">Comments</span><span class="pt-badge" id="pt-ccount"></span></button>
        <button type="button" class="pt-btn pt-primary" data-pt="sumOpen" title="Summary PDF for your team">${ptIcon('i-pdf')}<span class="pt-lbl">Summary PDF</span></button>
      </div></header>
      <main id="main" class="pt-main"></main>
    </div></div>
    <nav class="pt-tabbar" aria-label="Portal navigation">${nav('tab').replace(/<button[^>]*data-sec="ins"[\s\S]*?<\/button>/, '')}</nav>
    <div id="pt-modal" class="pt-overlay" hidden></div><div id="pt-sum" class="pt-sum" role="dialog" aria-modal="true" hidden></div>`;
}
const ptOthers = () => (PT.R.recipients || []).filter((r) => r.id !== PT.me.id).map((r) => String(r.label).split(/[\s(]/)[0]).join(' and ');
function ptDate(iso, time) { if (!iso) return ''; try { return new Date(iso).toLocaleString('en-GB', time ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' }); } catch (err) { return iso; } }

/* ---------- events (comments, flags) ---------- */
function ptCall(req) {
  req.r = PT.S.r; req.t = PT.S.t;
  return new Promise((ok, fail) => {
    if (!window.google || !google.script || !google.script.run) return fail(new Error('Not connected. Reload the page and try again.'));
    google.script.run.withSuccessHandler(ok).withFailureHandler(fail).api(req);
  });
}
function ptSetEvents(list) { if (Array.isArray(list)) { PT.ev = list; ptDerive(); } }
function ptDerive() {
  const last = {}, comments = {}, byId = {};
  PT.ev.forEach((x) => {
    if (x.type === 'flag' || x.type === 'unflag') last[x.elementId + '|' + x.by] = x;
    if (x.type === 'comment') { (comments[x.elementId] = comments[x.elementId] || []).push(x); byId[x.id] = x; }
  });
  const flags = {}; Object.values(last).forEach((x) => { if (x.type === 'flag') (flags[x.elementId] = flags[x.elementId] || []).push(x); });
  PT.D = { flags, comments, byId };
}
const ptErr = (e) => esc((e && e.message) || 'Something went wrong. Please try again.');

/* ---------- data for the portal ---------- */
function ptItems() {
  const e = E(); const C = lrCandidates(e); const by = {}; C.forEach((c) => { by[c.id] = c; });
  const rows = {}; savingsTracker(e).rows.forEach((r) => { rows[r.rec.id] = r; });
  const recBy = byId(e.recommendations);
  const mk = (c) => {
    const o = c.o; const fix = c.src === 'recommendation' ? o : recBy[o.fixId || o.recommendationId];
    const saving = fix && rows[fix.id] ? Math.max(0, rows[fix.id].monthlyNet) : 0;
    let cat, tone, val = '', valSub = '';
    if (c.src === 'recommendation') { cat = 'Fix'; tone = 'ink'; if (saving) { val = '~' + ptMoney(saving); valSub = '/ mo saving'; } }
    else if (c.kind === 'opportunity') { cat = 'Opportunity'; tone = 'good'; if (c.value) { val = ptMoney(c.value); valSub = '/ mo upside'; } }
    else if (c.basis === 'At risk') { cat = 'At risk'; tone = 'warn'; val = ptMoney(c.value); valSub = '/ mo at risk'; }
    else if (c.basis === 'Spend to review' || c.kind === 'tool') { cat = 'Cost'; tone = 'blue'; if (saving) { val = '~' + ptMoney(saving); valSub = '/ mo saving'; } else if (c.value) { val = ptMoney(c.value); valSub = '/ mo to review'; } }
    else { cat = c.kind === 'leak' ? 'Leak' : (LR_TAG[c.kind] || 'Weakness'); tone = 'bad'; if (c.value) { val = ptMoney(c.value); valSub = '/ mo leaked'; } }
    if (!val && o.pinned) { val = '★'; valSub = 'Founder priority'; }
    const prev = (PT.R.prev || {})[c.id]; const now = c.src === 'recommendation' ? saving : c.value;
    const change = prev != null && now && Math.abs(now - prev) >= 1 ? now - prev : 0;
    return { id: c.id, c, o, src: c.src, cat, tone, val, valSub, fix: c.src === 'recommendation' ? null : fix, saving, change, rank: 0,
      title: o.title, summary: lrFirst(o.evidence || o.description), detail: o.evidence || o.description || '' };
  };
  const found = (PT.R.itemIds || []).map((id) => by[id]).filter(Boolean).sort(lrRank).map(mk);
  const recs = (PT.R.recIds || []).map((id) => by[id]).filter(Boolean).sort(lrRank).map(mk);
  found.forEach((x, i) => { x.rank = i + 1; }); recs.forEach((x, i) => { x.rank = i + 1; });
  return { found, recs };
}

/* ---------- render ---------- */
function portalRender() {
  const sec = PT.sec; const main = document.getElementById('main');
  document.querySelectorAll('[data-pt="go"]').forEach((b) => { if (b.dataset.sec === sec) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  const crumb = document.getElementById('pt-crumb'); if (crumb) crumb.innerHTML = `<b>${esc(ptName(sec))}</b>${sec === 'proc' || sec === 'evid' ? ' <span class="pt-ro">Read only</span>' : ''}`;
  const n = PT.ev.filter((x) => x.type === 'comment').length; const cc = document.getElementById('pt-ccount'); if (cc) { cc.textContent = n || ''; cc.hidden = !n; }
  const keep = [...main.querySelectorAll('.flow-wrap')].map((w) => [w.scrollLeft, w.scrollTop]);
  let html;
  try {
    if (sec === 'proc') { ui.tab = 'processes'; html = `<div class="pt-studio">${viewProcesses(E())}</div>`; }
    else if (sec === 'evid') { ui.tab = 'evidence'; html = `<div class="pt-studio">${viewEvidence(E())}</div>`; }
    else html = ({ home: ptHome, work: ptWork, leaks: ptLeaks, ins: ptInsights })[sec]();
  } catch (err) { console.error(err); html = `<div class="pt-card"><p>This part of the portal couldn't be shown: ${esc(err.message)}</p></div>`; }
  main.innerHTML = html;
  if (sec === 'proc' || sec === 'evid') { ptLock(main); main.querySelectorAll('.flow-wrap').forEach((w, i) => { if (keep[i]) { w.scrollLeft = keep[i][0]; w.scrollTop = keep[i][1]; } }); }
  ptModalRender();
}
/** Read only: hide controls that change data, disable inputs that would edit it. */
function ptLock(root) {
  root.querySelectorAll('[data-action]').forEach((n) => { if (!ptActionOK(n)) n.classList.add('pt-hide'); });
  root.querySelectorAll('input, select, textarea').forEach((n) => { if (ptChangeOK(n)) return; n.disabled = true; n.classList.add('pt-locked'); });
  root.querySelectorAll('.pv-export:not(.pv-key), button[disabled]:not([data-pt])').forEach((n) => n.classList.add('pt-hide'));
  root.querySelectorAll('.btn-row').forEach((r) => { if (![...r.children].some((c) => !c.classList.contains('pt-hide'))) r.classList.add('pt-hide'); });
}
function ptGo(sec, opts = {}) {
  PT.sec = sec; if (sec === 'proc' && ui.tab !== 'processes') landProcesses();
  if (opts.tab) PT.tab = opts.tab;
  portalRender(); if (!opts.keepScroll) window.scrollTo(0, 0);
}

/* ---------- shared pieces ---------- */
const ptTrend = (dir, tone, text) => text ? `<span class="pt-trend pt-${esc(tone || 'info')}">${dir === 'up' ? '▲ ' : dir === 'down' ? '▼ ' : dir === 'flat' ? '■ ' : ''}${esc(text)}</span>` : '';
function ptSpark(series, target, tone) {
  const v = splitList(String(series || '')).map(Number).filter((x) => isFinite(x)); if (v.length < 2) return '';
  const all = v.concat(isFinite(+target) && target !== '' ? [+target] : []); const lo = Math.min(...all), hi = Math.max(...all); const span = hi - lo || 1;
  const y = (x) => 30 - ((x - lo) / span) * 26; const pts = v.map((x, i) => `${(i / (v.length - 1) * 100).toFixed(1)},${y(x).toFixed(1)}`).join(' ');
  const col = tone === 'bad' ? 'var(--pt-red)' : 'var(--pt-ink)'; const last = pts.split(' ').pop().split(',');
  return `<svg class="pt-spark" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">${isFinite(+target) && target !== '' ? `<line x1="0" y1="${y(+target).toFixed(1)}" x2="100" y2="${y(+target).toFixed(1)}" stroke="var(--pt-red)" stroke-dasharray="3 3" stroke-width="1" vector-effect="non-scaling-stroke"/>` : ''}<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/><circle cx="${last[0]}" cy="${last[1]}" r="2.6" fill="${col}"/></svg>`;
}
function ptSrcBtn(refs, label) {
  const ids = dedupeRefs(refs || []).map((r) => r.id + (r.part ? '::' + r.part : '')).join('||');
  return ids ? `<button type="button" class="pt-src" data-pt="src" data-refs="${esc(ids)}" title="Where this comes from">${ptIcon('i-info')}${label ? `<span>${esc(label)}</span>` : ''}</button>` : '';
}
function ptActs(id) {
  const f = PT.D.flags[id] || [], cs = PT.D.comments[id] || []; const mine = f.some((x) => x.by === PT.me.id);
  return `<div class="pt-acts"><button type="button" class="pt-act pt-flag ${mine ? 'on' : f.length ? 'others' : ''}" data-pt="flag" data-id="${esc(id)}" aria-pressed="${mine}" title="${mine ? 'Remove your red flag' : 'Red-flag this as very important'}">${ptIcon('i-flag')}<span>${f.length || ''}</span><span class="pt-vh">${mine ? 'Remove red flag' : 'Red flag'}</span></button>
    <button type="button" class="pt-act" data-pt="discuss" data-id="${esc(id)}" title="Comments">${ptIcon('i-chat')}<span>${cs.length || ''}</span><span class="pt-vh">Comments</span></button></div>`;
}
function ptThread(id) {
  const cs = PT.D.comments[id] || []; const f = PT.D.flags[id] || []; const D = PT.D;
  const tops = cs.filter((c) => !c.parentId || !D.byId[c.parentId]);
  const one = (c, kids) => `<div class="pt-cmt ${c.by === PT.me.id ? 'mine' : ''} ${c.by === 'owner' ? 'tgm' : ''}"><div class="pt-cmt-by"><b>${esc(c.byLabel)}</b> <span>· ${esc(ptDate(c.at, true))}</span></div><p>${esc(c.text)}</p>${c.parentId ? '' : `<button type="button" class="pt-link" data-pt="reply" data-id="${esc(id)}" data-c="${esc(c.id)}">Reply</button>`}${kids && kids.length ? `<div class="pt-replies">${kids.map((k) => one(k)).join('')}</div>` : ''}</div>`;
  const rp = PT.replyTo[id] && D.byId[PT.replyTo[id]];
  return `<div class="pt-thread">${f.length ? `<p class="pt-flagged">Red-flagged by ${esc(f.map((x) => x.byLabel).join(', '))}</p>` : ''}
    ${cs.length ? `<div class="pt-thread-h">Discussion (${cs.length})</div>${tops.map((c) => one(c, cs.filter((k) => k.parentId === c.id))).join('')}` : ''}
    <div class="pt-compose">${rp ? `<div class="pt-replying">Replying to ${esc(rp.byLabel)} · <button type="button" class="pt-link" data-pt="noreply" data-id="${esc(id)}">cancel</button></div>` : ''}
      <label class="pt-vh" for="tx-${esc(id)}">Your comment</label><textarea id="tx-${esc(id)}" data-draft="${esc(id)}" maxlength="4000" placeholder="${rp ? 'Write a reply' : 'Add a comment, question or correction'}">${esc(PT.drafts[id] || '')}</textarea>
      <div class="pt-compose-f"><span>${PT.me.owner ? 'Posts as The Growth Machine.' : `Shared with ${esc(ptOthers() || 'everyone on this report')} and The Growth Machine.`}</span><button type="button" class="pt-btn pt-primary" data-pt="post" data-id="${esc(id)}" ${PT.busy[id] ? 'disabled' : ''}>${PT.busy[id] ? 'Posting…' : rp ? 'Post reply' : 'Post comment'}</button></div></div></div>`;
}
const ptCard = (title, body, { note = '', link = '', cls = '' } = {}) => `<section class="pt-card ${cls}">${title ? `<div class="pt-card-h"><h2>${title}</h2>${note ? `<span class="pt-note">${note}</span>` : ''}${link}</div>` : ''}${body}</section>`;
const ptLinkTo = (sec, label, extra = '') => `<button type="button" class="pt-more" data-pt="go" data-sec="${sec}" ${extra}>${esc(label)} →</button>`;

/* ---------- Overview ---------- */
function ptTimeline(e, big) {
  const g = e.engagement; const today = todayISO();
  if (!g.start || !g.end) return '';
  const weeks = Math.max(1, Math.ceil((daysBetween(g.start, g.end) + 1) / 7)); const cur = Math.max(1, Math.min(weeks, Math.floor(daysBetween(g.start, today) / 7) + 1));
  const bars = Array.from({ length: weeks }, (_, i) => `<span class="${i + 1 < cur ? 'done' : i + 1 === cur ? 'now' : ''}"></span>`).join('');
  const ph = g.phases || []; const tot = Math.max(1, sum(ph, (p) => Math.max(1, daysBetween(p.start, p.end) + 1)));
  const cls = (p) => (p.status === 'Done' ? 'done' : (p.status === 'In progress' || (p.start <= today && today <= p.end)) ? 'now' : '');
  return `<div class="pt-tl" style="grid-template-columns:repeat(${weeks},minmax(0,1fr))" aria-label="Week ${cur} of ${weeks}">${bars}</div>
    <div class="pt-phases" style="grid-template-columns:${ph.map((p) => `${Math.max(1, daysBetween(p.start, p.end) + 1) / tot}fr`).join(' ')}">${ph.map((p) => `<div class="${cls(p)}"><span>${esc(p.name)}</span>${big ? `<small>${esc(fmtD(p.start))} – ${esc(fmtD(p.end))} · ${esc(p.status || '')}</small>` : ''}</div>`).join('')}</div>`;
}
function ptWeek(e) { const g = e.engagement; const weeks = Math.max(1, Math.ceil((daysBetween(g.start, g.end) + 1) / 7)); return { cur: Math.max(1, Math.min(weeks, Math.floor(daysBetween(g.start, todayISO()) / 7) + 1)), weeks }; }
function ptKpis(e) {
  const sv = savingsTracker(e);
  const pct = sv.target ? Math.min(100, sv.identified / sv.target * 100) : 0; const apct = sv.target ? Math.min(100, sv.approved / sv.target * 100) : 0;
  const tiles = [`<div class="pt-card pt-kpi"><span class="pt-kpi-l">Savings identified</span><span class="pt-kpi-v">${esc(ptMoney(sv.identified))}<small>/ mo</small></span>
    <div class="pt-bar" title="Identified and approved against the target"><i style="width:${pct.toFixed(0)}%"></i><b style="width:${apct.toFixed(0)}%"></b></div>
    <span class="pt-kpi-c">${esc(ptMoney(sv.approved))} of ${esc(ptMoney(sv.target))} / mo target approved${sv.realised ? ` · ${esc(ptMoney(sv.realised))} realised` : ''}</span>
    ${ptTrend(sv.approved ? 'up' : '', sv.approved ? 'good' : 'info', sv.approved ? 'Approved savings are counting' : 'Estimates · approval needs finance data')}</div>`];
  (e.kpis || []).slice().sort((a, b) => num(a.order) - num(b.order)).slice(0, 3).forEach((k) => {
    tiles.push(`<div class="pt-card pt-kpi"><span class="pt-kpi-l">${esc(k.label)}${ptSrcBtn(k.sources)}</span><span class="pt-kpi-v">${esc(k.value)}${k.sub ? `<small>${esc(k.sub)}</small>` : ''}</span>
      ${k.series ? ptSpark(k.series, k.target, k.trendTone) : num(k.barPct) ? `<div class="pt-bar"><i class="red" style="width:${Math.min(100, num(k.barPct))}%"></i></div>` : ''}
      ${k.ctx ? `<span class="pt-kpi-c">${esc(k.ctx)}</span>` : ''}${ptTrend(k.trendDir, k.trendTone, k.trendText)}</div>`);
  });
  return tiles.join('');
}
function ptLeakRow(x, compact) {
  const f = (PT.D.flags[x.id] || []).length, cs = (PT.D.comments[x.id] || []).length;
  return `<button type="button" class="pt-leak" data-pt="openItem" data-id="${esc(x.id)}" data-tab="${x.src === 'recommendation' ? 'recs' : 'found'}">
    <span class="pt-rank">${x.rank}</span><span class="pt-lt">${esc(x.title)}${compact ? '' : `<small>${esc(trunc(x.summary, 140))}</small>`}${f || cs ? `<span class="pt-mini">${f ? `<span class="pt-mf">⚑ ${f}</span>` : ''}${cs ? `<span>💬 ${cs}</span>` : ''}</span>` : ''}</span>
    <span class="pt-lv">${esc(x.val || '—')}<small>${esc(x.valSub || 'not sized')}</small>${x.change ? `<span class="pt-chg ${x.change > 0 === (x.tone === 'good' || x.cat === 'Fix') ? 'good' : 'bad'}">${x.change > 0 ? '▲' : '▼'} ${esc(ptMoney(Math.abs(x.change)))} since last update</span>` : ''}</span>
    <span class="pt-tag pt-${x.tone}">${esc(x.cat)}</span></button>`;
}
function ptHome() {
  const e = E(); const R = PT.R; const st = engagementStatus(e); const w = ptWeek(e); const g = e.engagement; const S = g.status || {};
  const h = new Date().getHours(); const hello = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const first = PT.me.owner ? '' : ', ' + String(PT.me.label).split(/[\s(]/)[0];
  const next = splitList(g.reviewDates).find((d) => d > todayISO());
  const waiting = st.overdue.length;
  const { found } = ptItems();
  const asks = R.asks || [];
  return `<section class="pt-hello"><div class="pt-eyebrow">Week ${w.cur} of ${w.weeks} · ${st.openDelays.length ? `${st.openDelays.length} open delay${st.openDelays.length > 1 ? 's' : ''}` : 'on track'}</div>
      <h1>${hello}${esc(first)}. Here's where ${esc(e.client.name)} stands.</h1>${R.intro || S.headline ? `<p class="pt-lede">${esc(R.intro || S.headline)}</p>` : ''}</section>
    <div class="pt-grid">
      ${ptCard('The engagement', `${ptTimeline(e)}<div class="pt-tl-meta">${next ? `<span>Next review <b>${esc(fmtD(next, { weekday: 'short', day: 'numeric', month: 'short' }))}</b></span>` : ''}<span>Conversations <b>${num(R.stats.conversations)}</b></span><span>Processes mapped <b>${num(R.stats.processes)}</b></span><span>Every figure sourced <b>${num(R.stats.sources)} sources</b></span></div>`,
        { note: `${esc(fmtD(g.start, { day: 'numeric', month: 'short', year: 'numeric' }))} – ${esc(fmtD(g.end, { day: 'numeric', month: 'short', year: 'numeric' }))}`, link: ptLinkTo('work', 'Our work'), cls: 'c12' })}
      ${ptKpis(e)}
      ${asks.length ? ptCard('Needs your decision', `<div class="pt-asks">${asks.map((a, i) => `<div class="pt-ask"><span class="pt-n">${i + 1}</span><div><b>${esc(a.title)}</b>${a.detail ? `<p>${esc(a.detail)}</p>` : ''}${(PT.D.comments[a.id] || []).length ? `<p class="pt-replied">💬 ${(PT.D.comments[a.id] || []).length} repl${(PT.D.comments[a.id] || []).length > 1 ? 'ies' : 'y'}</p>` : ''}</div><button type="button" class="pt-btn" data-pt="discuss" data-id="${esc(a.id)}">Reply</button></div>`).join('')}</div>${waiting ? `<p class="pt-wait-line">Also ${waiting} information request${waiting > 1 ? 's' : ''} past their date. ${ptLinkTo('work', 'See the list')}</p>` : ''}`, { note: `${asks.length} open`, cls: 'c5' }) : ''}
      ${found.length ? ptCard('Biggest leaks &amp; opportunities', `<div class="pt-leaks">${found.slice(0, 5).map((x) => ptLeakRow(x)).join('')}</div>`, { note: 'ranked by size', link: ptLinkTo('leaks', `All ${found.length}`), cls: asks.length ? 'c7' : 'c12' }) : ''}
      ${S.delivered || S.next ? ptCard('This fortnight', `<div class="pt-two"><div><p class="pt-sub-h">Delivered</p>${ptList(S.delivered, 'done')}</div><div><p class="pt-sub-h">Next</p>${ptList(S.next, 'next')}</div></div>`, { link: ptLinkTo('work', 'Full status'), cls: 'c12' }) : ''}
      ${ptCard('Explore your business', `<div class="pt-explore">
        <button type="button" class="pt-tile" data-pt="go" data-sec="proc"><span class="pt-ti">${ptIcon('i-proc')}Processes</span><p>How work flows across the teams, with every pain point and flag we've found.</p><span class="pt-stat">${num(R.stats.processes)} processes · ${num(R.stats.steps)} steps · ${num(R.stats.flags)} flags</span></button>
        <button type="button" class="pt-tile" data-pt="go" data-sec="evid"><span class="pt-ti">${ptIcon('i-evid')}Evidence</span><p>Client growth, money, clients, people, tools and market, with the source behind every number.</p><span class="pt-stat">6 areas · ${num(R.stats.sources)} sources</span></button>
        <button type="button" class="pt-tile" data-pt="go" data-sec="ins"><span class="pt-ti">${ptIcon('i-ins')}Insights</span><p>Numbers in context: revenue at risk, cost to serve, where the time goes.</p><span class="pt-stat">Coming next</span></button></div>`, { note: 'read only · everything we’ve mapped and measured', cls: 'c12' })}
    </div>
    ${PT.me.owner ? '' : `<p class="pt-foot">Anything missing or wrong? <button type="button" class="pt-link" data-pt="discuss" data-id="report">Comment on the portal as a whole</button>.</p>`}`;
}
const ptLines = (txt) => String(txt || '').split('\n').map((x) => x.trim()).filter(Boolean);
function ptList(txt, kind) { const l = ptLines(txt); return l.length ? `<ul class="pt-list ${kind}">${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="pt-muted">—</p>'; }

/* ---------- Our work ---------- */
function ptWork() {
  const e = E(); const g = e.engagement; const S = g.status || {}; const st = engagementStatus(e); const sv = savingsTracker(e); const w = ptWeek(e); const R = PT.R;
  const reviews = splitList(g.reviewDates);
  const waiting = st.reqs.filter((r) => r._status === 'Waiting' || r._status === 'Overdue').sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  const rows = sv.rows.filter((r) => r.stage !== 'Rejected' && r.monthlyNet > 0).sort((a, b) => b.monthlyNet - a.monthlyNet);
  const stageCls = (s) => ({ Identified: 'info', Approved: 'good', 'In progress': 'good', Realised: 'good' })[s] || 'info';
  const late = (d) => d ? Math.max(0, daysBetween(d, todayISO())) : 0;
  return `<section class="pt-hello"><div class="pt-eyebrow">Week ${w.cur} of ${w.weeks}</div><h1>Our work</h1>${S.headline ? `<p class="pt-lede">${esc(S.headline)}</p>` : ''}</section>
  <div class="pt-grid">
    ${ptCard('Where we are in the plan', `${ptTimeline(e, true)}<div class="pt-tl-meta">${reviews.map((d) => `<span class="${d < todayISO() ? 'pt-past' : ''}">Review <b>${esc(fmtD(d, { day: 'numeric', month: 'short' }))}</b></span>`).join('')}</div>`, { note: `${esc(fmtD(g.start, { day: 'numeric', month: 'short' }))} – ${esc(fmtD(g.end, { day: 'numeric', month: 'short', year: 'numeric' }))}`, cls: 'c12' })}
    ${ptCard('This fortnight', `<div class="pt-two"><div><p class="pt-sub-h">Delivered</p>${ptList(S.delivered, 'done')}</div><div><p class="pt-sub-h">Next</p>${ptList(S.next, 'next')}</div></div>`, { cls: 'c12' })}
    ${ptCard('Savings against the target', `<div class="pt-sv">
        <div><span class="pt-kpi-l">Identified</span><span class="pt-kpi-v">${esc(ptMoney(sv.identified))}<small>/ mo</small></span></div>
        <div><span class="pt-kpi-l">Approved</span><span class="pt-kpi-v">${esc(ptMoney(sv.approved))}<small>/ mo</small></span></div>
        <div><span class="pt-kpi-l">Realised</span><span class="pt-kpi-v">${esc(ptMoney(sv.realised))}<small>/ mo</small></span></div>
        <div><span class="pt-kpi-l">Target</span><span class="pt-kpi-v">${esc(ptMoney(sv.target))}<small>/ mo</small></span></div></div>
      ${rows.length ? `<table class="pt-tbl"><thead><tr><th>Saving</th><th>Stage</th><th class="r">Per month</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(r.rec.title)}</td><td><span class="pt-trend pt-${stageCls(r.stage)}">${esc(r.stage)}</span></td><td class="r">~${esc(ptMoney(r.monthlyNet))}</td></tr>`).join('')}</tbody></table>` : ''}
      <p class="pt-muted pt-small">Monthly recurring savings, net of new costs. Estimates until validated against the agreed baseline; only approved savings count towards the target.</p>`, { cls: 'c7' })}
    ${ptCard('What we need from you', `${(R.asks || []).length ? `<p class="pt-sub-h">Decisions</p><ul class="pt-list next">${R.asks.map((a) => `<li><button type="button" class="pt-link" data-pt="discuss" data-id="${esc(a.id)}">${esc(a.title)}</button></li>`).join('')}</ul>` : ''}
      ${waiting.length ? `<p class="pt-sub-h" style="margin-top:14px">Information requested (${waiting.length})</p><div class="pt-reqs">${waiting.slice(0, 8).map((r) => `<div class="pt-req"><span>${esc(r.item)}</span><span class="pt-muted pt-small">${esc(r.owner || '')}${r.dueDate ? ` · due ${esc(fmtD(r.dueDate))}` : ''}</span>${r._status === 'Overdue' ? `<span class="pt-trend pt-bad">${late(r.dueDate)} days late</span>` : ''}</div>`).join('')}${waiting.length > 8 ? `<p class="pt-muted pt-small">+ ${waiting.length - 8} more, most of them older requests to the founders and finance.</p>` : ''}</div>` : '<p class="pt-muted">Nothing outstanding.</p>'}`, { cls: 'c5' })}
    ${(g.delays || []).length ? ptCard('Delays and changes', `<table class="pt-tbl"><thead><tr><th>Raised</th><th>What happened</th><th class="r">Days</th><th>Status</th></tr></thead><tbody>${g.delays.map((d) => `<tr><td>${esc(fmtD(d.dateRaised))}</td><td>${esc(d.description || d.cause || '')}</td><td class="r">${num(d.daysImpact)}</td><td>${esc(d.status || '')}</td></tr>`).join('')}</tbody></table>`, { cls: 'c12' }) : ''}
    ${ptCard('Capacity', `<p>${esc(R.stats.capacity || '')}</p><p class="pt-muted pt-small">One line by agreement: the engagement isn't charged by the hour.</p>`, { cls: 'c12' })}
  </div>`;
}

/* ---------- Leaks & opportunities ---------- */
function ptLeaks() {
  const { found, recs } = ptItems();
  const tabs = `<div class="pt-tabs" role="tablist"><button type="button" role="tab" data-pt="tab" data-id="found" aria-selected="${PT.tab === 'found'}">What we found (${found.length})</button><button type="button" role="tab" data-pt="tab" data-id="recs" aria-selected="${PT.tab === 'recs'}">What we suggest (${recs.length})</button></div>`;
  const cats = [['all', 'All'], ['Leak', 'Leaks'], ['At risk', 'At risk'], ['Cost', 'Costs'], ['Opportunity', 'Opportunities']].filter(([k]) => k === 'all' || found.some((x) => x.cat === k));
  const list = PT.tab === 'recs' ? recs : found.filter((x) => PT.lf === 'all' || x.cat === PT.lf || (PT.lf === 'Leak' && x.tone === 'bad'));
  const rows = list.map((x) => {
    const open = !!PT.open[x.id];
    return `<article class="pt-item ${open ? 'open' : ''} ${(PT.D.flags[x.id] || []).length ? 'flagged' : ''}" id="it-${esc(x.id)}">
      <div class="pt-item-h"><button type="button" class="pt-item-t" data-pt="toggle" data-id="${esc(x.id)}" aria-expanded="${open}">
        <span class="pt-rank">${x.rank}</span><span class="pt-lt"><span class="pt-tag pt-${x.tone}">${esc(x.cat)}</span>${x.o.pinned ? ' <span class="pt-prio">★ Founder priority</span>' : ''}${x.src === 'recommendation' ? ` <span class="pt-muted pt-small">${esc(x.o.status || 'Identified')}${x.o.horizon ? ' · ' + esc(x.o.horizon) : ''}</span>` : ''}<b>${esc(x.title)}</b>${open ? '' : `<small>${esc(x.summary)}</small>`}</span>
        <span class="pt-lv">${esc(x.val || '—')}<small>${esc(x.valSub || 'not sized')}</small>${x.change ? `<span class="pt-chg ${x.change > 0 === (x.tone === 'good' || x.cat === 'Fix') ? 'good' : 'bad'}">${x.change > 0 ? '▲' : '▼'} ${esc(ptMoney(Math.abs(x.change)))} since last update</span>` : ''}</span></button>${ptActs(x.id)}</div>
      ${open ? ptItemBody(x) : ''}</article>`;
  }).join('');
  return `<section class="pt-hello"><div class="pt-eyebrow">Leaks &amp; opportunities</div><h1>The few things worth the most</h1><p class="pt-lede">Ranked by size. Open any item for the detail, the evidence behind it, the suggested fix and the discussion. Red-flag what matters most.</p></section>
    ${tabs}${PT.tab === 'found' && cats.length > 2 ? `<div class="pt-pills">${cats.map(([k, n]) => `<button type="button" data-pt="lf" data-id="${esc(k)}" aria-pressed="${PT.lf === k}">${esc(n)}</button>`).join('')}</div>` : ''}
    <div class="pt-items">${rows || '<p class="pt-muted">Nothing here yet.</p>'}</div>`;
}
function ptItemBody(x) {
  const e = E(); const o = x.o;
  const rowsHtml = [];
  if (x.fix && x.fix.status !== 'Rejected') {
    const inList = (PT.R.recIds || []).includes(x.fix.id);
    rowsHtml.push(['Suggested fix', `${inList ? `<button type="button" class="pt-link" data-pt="openItem" data-id="${esc(x.fix.id)}" data-tab="recs">${esc(x.fix.title)} →</button>` : esc(x.fix.title)} <span class="pt-muted pt-small">${esc(x.fix.status || 'Identified')}${x.saving ? ` · ~${esc(ptMoney(x.saving))} / mo` : ''}</span>`]);
  }
  if (x.src === 'recommendation') {
    const solves = e.findings.filter((f) => f.fixId === o.id && (PT.R.itemIds || []).includes(f.id));
    if (solves.length) rowsHtml.push(['Fixes', solves.map((f) => `<button type="button" class="pt-link" data-pt="openItem" data-id="${esc(f.id)}" data-tab="found">${esc(f.title)}</button>`).join('<br>')]);
    if (o.stick) rowsHtml.push(['How it sticks', esc(o.stick)]);
    if (o.owner) rowsHtml.push(['Owner', esc(o.owner)]);
  }
  const recId = x.src === 'recommendation' ? o.id : x.fix && x.fix.id;
  const autos = recId ? (e.automations || []).filter((a) => a.recommendationId === recId && !a.private) : [];
  if (autos.length) rowsHtml.push(['Runs itself', autos.map((a) => `${esc(a.title)} <span class="pt-muted pt-small">(${esc(a.status || 'Idea')})</span>`).join('<br>')]);
  if (o.nextStep) rowsHtml.push(['Next step', esc(o.nextStep)]);
  const refs = refsFor(e, x.src === 'recommendation' ? 'recommendation' : x.src, o);
  return `<div class="pt-item-b">${String(x.detail).split(/\n{2,}/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('')}
    ${rowsHtml.length ? `<dl class="pt-rows">${rowsHtml.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>` : ''}
    ${refs.length ? `<div class="pt-cites"><span>Where this comes from</span><ol>${refs.map((r) => `<li>${esc(sourceLine(e, r, true))}</li>`).join('')}</ol></div>` : ''}
    ${ptThread(x.id)}</div>`;
}

/* ---------- Insights (to design together) ---------- */
function ptInsights() {
  return `<section class="pt-hello"><div class="pt-eyebrow">Insights</div><h1>Numbers in context</h1><p class="pt-lede">This section will show the business's numbers against each other, so they explain why something is happening, not just what. We're designing it with you.</p></section>
  <div class="pt-grid">${ptCard('What it will cover', `<ul class="pt-list next">
    <li>Revenue at risk: contract status × monthly value × adoption × satisfaction</li><li>Cost to serve per client: effort to serve × revenue</li>
    <li>Data quality against churn: clients with data problems against who left or downgraded</li><li>Growth by channel: resellers against direct clients, revenue and locations</li>
    <li>Where the time goes: turnaround by task type and team, and what Pulse takes off the teams</li><li>Net revenue retention, step by step: start of period, upsells, downgrades, losses, end</li></ul>`, { cls: 'c12' })}</div>`;
}

/* ---------- modal: discussion, sources, all comments ---------- */
function ptLabel(id) {
  if (id === 'report') return 'The portal as a whole';
  const a = (PT.R.asks || []).find((x) => x.id === id); if (a) return a.title;
  const el = (PT.R.elements || []).find((x) => x.id === id); return el ? el.label : id;
}
function ptModalRender() {
  const m = document.getElementById('pt-modal'); if (!m) return;
  if (!PT.modal) { m.hidden = true; m.innerHTML = ''; return; }
  let title = '', body = '';
  if (PT.modal === 'comments') {
    title = 'All comments';
    const list = PT.ev.filter((x) => x.type === 'comment' || x.type === 'flag').slice().reverse();
    body = list.length ? list.map((x) => `<button type="button" class="pt-cl" data-pt="goto" data-id="${esc(x.elementId)}"><span><b>${esc(x.byLabel)}</b> ${x.type === 'flag' ? 'red-flagged' : x.parentId ? 'replied on' : 'commented on'} <b>${esc(ptLabel(x.elementId))}</b></span>${x.text ? `<span class="pt-cl-t">${esc(trunc(x.text, 160))}</span>` : ''}<span class="pt-muted pt-small">${esc(ptDate(x.at, true))}</span></button>`).join('') : '<p class="pt-muted">No comments yet. Open any item and use the comment button to start a discussion.</p>';
  } else if (PT.modal.startsWith('src:')) {
    title = 'Where this comes from'; const e = E();
    body = `<ol class="pt-srcs">${PT.modal.slice(4).split('||').map((s) => { const [id, part] = s.split('::'); return `<li>${esc(sourceLine(e, { id, part }, true))}</li>`; }).join('')}</ol>`;
  } else {
    const id = PT.modal; const a = (PT.R.asks || []).find((x) => x.id === id);
    title = esc(ptLabel(id)); body = `${a && a.detail ? `<p class="pt-muted">${esc(a.detail)}</p>` : ''}${ptActs(id)}${ptThread(id)}`;
  }
  m.hidden = false;
  m.innerHTML = `<div class="pt-dialog" role="dialog" aria-modal="true" aria-labelledby="pt-dlg-h"><div class="pt-dialog-h"><h2 id="pt-dlg-h">${title}</h2><button type="button" class="pt-x" data-pt="close" aria-label="Close">${ptIcon('i-x')}</button></div><div class="pt-dialog-b">${body}</div></div>`;
}
function ptFocus(id) { const n = document.getElementById('it-' + id); if (n) { n.scrollIntoView({ block: 'start', behavior: 'smooth' }); n.classList.add('pt-hl'); setTimeout(() => n.classList.remove('pt-hl'), 2200); } }

/* ---------- summary PDF for the team ---------- */
const PT_SUM = { ids: null, title: '', note: '', comments: false, fortnight: true, loaded: false };
function ptSumGroups() {
  const { found, recs } = ptItems(); const out = [];
  if ((PT.R.asks || []).length) out.push({ title: 'Needs a decision', items: PT.R.asks.map((a) => ({ id: a.id, title: a.title, summary: a.detail })) });
  if (found.length) out.push({ title: 'Leaks & opportunities', items: found });
  if (recs.length) out.push({ title: 'What we suggest', items: recs });
  return out;
}
function ptSumKey() { return 'tgm.portal.sum.' + PT.R.reportId + '.' + PT.me.id; }
function ptSumLoad() {
  if (PT_SUM.loaded) return; PT_SUM.loaded = true;
  PT_SUM.title = `${PT.R.client}: update for the team, ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
  try { const s = JSON.parse(localStorage.getItem(ptSumKey()) || 'null'); if (s) Object.assign(PT_SUM, { ids: s.ids, note: s.note || '', comments: !!s.comments, fortnight: s.fortnight !== false }, s.title ? { title: s.title } : {}); } catch (err) { /* ignore */ }
}
function ptSumSave() { try { localStorage.setItem(ptSumKey(), JSON.stringify({ ids: PT_SUM.ids, title: PT_SUM.title, note: PT_SUM.note, comments: PT_SUM.comments, fortnight: PT_SUM.fortnight })); } catch (err) { /* ignore */ } }
function ptSumIds() { const all = ptSumGroups().flatMap((g) => g.items.map((x) => x.id)); return PT_SUM.ids ? PT_SUM.ids.filter((i) => all.includes(i)) : all; }
function ptSumDoc() {
  const pick = new Set(ptSumIds()); const S = E().engagement.status || {}; const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const e2 = (s) => esc(s);
  let h = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${e2(PT_SUM.title)}</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#171715;font-size:10.5pt;line-height:1.45;margin:28px 34px;background:#fff}h1{font-family:Georgia,serif;font-weight:normal;font-size:21pt;line-height:1.15;margin:8pt 0 3pt}h2{font-family:Georgia,serif;font-weight:normal;font-size:14pt;margin:16pt 0 6pt;border-bottom:1px solid #d7cfc3;padding-bottom:3pt}.brand{font-size:8pt;letter-spacing:2pt}.brand b{color:#c8221c}.client{font-family:Georgia,serif;color:#c8221c;font-size:13pt;margin:0}.meta{color:#665f57;font-size:9pt;margin:4pt 0 0}.note{background:#f6f1e9;border-left:3px solid #c8221c;padding:8pt 10pt;margin:12pt 0 0}.note b{display:block;font-size:8.5pt;color:#665f57;text-transform:uppercase;margin-bottom:2pt}.it{margin:0 0 9pt;page-break-inside:avoid}.t{font-weight:bold}.tag{color:#665f57;font-size:8pt;text-transform:uppercase}.s{color:#444;margin:2pt 0 0}.flag{color:#c8221c;font-weight:bold;font-size:9pt;margin-top:2pt}.c{border-left:2px solid #d7cfc3;padding-left:6pt;margin:3pt 0 0 4pt;color:#333;font-size:9pt}ul{margin:0;padding-left:14pt}.foot{color:#8a8074;font-size:8pt;margin-top:18pt}</style></head><body>`;
  h += `<div class="brand">THE <b>GROWTH</b> MACHINE</div><h1>${e2(PT_SUM.title)}</h1><p class="client">${e2(PT.R.client)}</p><p class="meta">${e2(date)}${PT.me.owner ? '' : ' · Shared by ' + e2(PT.me.label)} · Confidential</p>`;
  if (PT_SUM.note.trim()) h += `<div class="note"><b>${PT.me.owner ? 'Note' : 'Note from ' + e2(PT.me.label)}</b>${e2(PT_SUM.note.trim()).replace(/\n/g, '<br>')}</div>`;
  if (PT_SUM.fortnight && (S.delivered || S.next)) { const li = (t) => ptLines(t).map((x) => `<li>${e2(x)}</li>`).join(''); h += `<h2>This fortnight</h2>${S.delivered ? `<p class="t">Delivered</p><ul>${li(S.delivered)}</ul>` : ''}${S.next ? `<p class="t" style="margin-top:6pt">Next</p><ul>${li(S.next)}</ul>` : ''}`; }
  let n = 0;
  ptSumGroups().forEach((g) => {
    const items = g.items.filter((x) => pick.has(x.id)); if (!items.length) return;
    h += `<h2>${e2(g.title)}</h2>`;
    items.forEach((x) => {
      n++; const f = PT.D.flags[x.id] || [];
      h += `<div class="it">${x.cat ? `<div class="tag">${e2(x.cat)}</div>` : ''}<div class="t">${e2(x.title)}</div>${x.val ? `<div>${e2(x.val)} ${e2(x.valSub || '')}</div>` : ''}${x.summary ? `<div class="s">${e2(x.summary)}</div>` : ''}${f.length ? `<div class="flag">Red-flagged by ${e2(f.map((y) => y.byLabel).join(', '))}</div>` : ''}`;
      if (PT_SUM.comments) (PT.D.comments[x.id] || []).forEach((c) => { h += `<div class="c"><b>${e2(c.byLabel)}:</b> ${e2(c.text)}</div>`; });
      h += '</div>';
    });
  });
  if (!n && !PT_SUM.fortnight) h += '<p style="color:#665f57">Nothing selected yet.</p>';
  return h + `<p class="foot">From the ${e2(PT.R.client)} founder portal by The Growth Machine. The portal shows the evidence and sources behind every figure.</p></body></html>`;
}
function ptSumRender() {
  ptSumLoad(); const box = document.getElementById('pt-sum'); const ids = new Set(ptSumIds()); const groups = ptSumGroups(); const total = groups.reduce((a, g) => a + g.items.length, 0);
  box.innerHTML = `<div class="pt-sum-h"><div class="pt-sum-hin"><h2>Summary for your team</h2><span class="pt-muted pt-small">${ids.size} of ${total} items</span><span class="pt-spacer"></span>
      <button type="button" class="pt-btn pt-primary" data-pt="sumPdf" id="pt-sumpdf">Download PDF</button><button type="button" class="pt-btn" data-pt="sumPrint">Print</button><button type="button" class="pt-btn" data-pt="sumClose">Close</button></div></div>
    <div class="pt-sum-b"><div class="pt-sum-pick">
      <p class="pt-muted pt-small" style="margin:0">Starts from everything in the portal. Untick what this week's or month's update doesn't need; your choice is remembered.</p>
      <label class="pt-fld">Title<input type="text" data-sum="title" value="${esc(PT_SUM.title)}" maxlength="140"></label>
      <label class="pt-fld">Note to your team (optional)<textarea data-sum="note" rows="3" maxlength="1500">${esc(PT_SUM.note)}</textarea></label>
      <label class="pt-chk"><input type="checkbox" data-sum="fortnight" ${PT_SUM.fortnight ? 'checked' : ''}> Include “This fortnight”</label>
      <label class="pt-chk"><input type="checkbox" data-sum="comments" ${PT_SUM.comments ? 'checked' : ''}> Include comments</label>
      <div class="pt-pills"><button type="button" data-pt="sumAll">Everything</button><button type="button" data-pt="sumFlag">Only red-flagged</button><button type="button" data-pt="sumNone">None</button></div>
      ${groups.map((g, gi) => { const on = g.items.filter((x) => ids.has(x.id)).length; return `<div class="pt-sum-g"><label class="pt-chk"><input type="checkbox" data-sum="grp" data-g="${gi}" ${on === g.items.length ? 'checked' : ''}><b>${esc(g.title)}</b> <span class="pt-muted">(${on}/${g.items.length})</span></label><ul>${g.items.map((x) => `<li><label class="pt-chk"><input type="checkbox" data-sum="it" data-id="${esc(x.id)}" ${ids.has(x.id) ? 'checked' : ''}><span>${esc(x.title)}${(PT.D.flags[x.id] || []).length ? ` <b class="pt-mf">⚑ ${(PT.D.flags[x.id] || []).length}</b>` : ''}</span></label></li>`).join('')}</ul></div>`; }).join('')}
    </div><div class="pt-sum-prev"><span class="pt-muted pt-small">Preview (the PDF follows this closely)</span><iframe id="pt-sumframe" title="Summary preview"></iframe></div></div>`;
  ptSumPreview();
}
let ptSumT = null;
function ptSumPreview() { clearTimeout(ptSumT); ptSumT = setTimeout(() => { const f = document.getElementById('pt-sumframe'); if (f) f.srcdoc = ptSumDoc(); }, 120); }
function ptSumSet(ids) { PT_SUM.ids = ids; ptSumSave(); ptSumRender(); }

/* ---------- portal events ---------- */
document.addEventListener('click', (ev) => {
  if (!PORTAL_ON) return;
  const b = ev.target.closest('[data-pt]'); if (!b) { if (ev.target.id === 'pt-modal') { PT.modal = ''; ptModalRender(); } return; }
  const d = b.dataset.pt; const id = b.dataset.id;
  if (d === 'go') return ptGo(b.dataset.sec);
  if (d === 'tab') { PT.tab = id; return portalRender(); }
  if (d === 'lf') { PT.lf = id; return portalRender(); }
  if (d === 'toggle') { PT.open[id] = !PT.open[id]; return portalRender(); }
  if (d === 'openItem') { PT.modal = ''; PT.sec = 'leaks'; PT.tab = b.dataset.tab || 'found'; PT.lf = 'all'; PT.open[id] = true; portalRender(); return setTimeout(() => ptFocus(id), 60); }
  if (d === 'discuss') { if ((PT.R.itemIds || []).includes(id) || (PT.R.recIds || []).includes(id)) { if (PT.sec === 'leaks') { PT.open[id] = true; portalRender(); setTimeout(() => { const t = document.getElementById('tx-' + id); if (t) { t.focus(); t.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }, 40); return; } }
    PT.modal = id; ptModalRender(); const t = document.getElementById('tx-' + id); if (t) t.focus(); return; }
  if (d === 'comments') { PT.modal = 'comments'; return ptModalRender(); }
  if (d === 'src') { PT.modal = 'src:' + b.dataset.refs; return ptModalRender(); }
  if (d === 'close') { PT.modal = ''; return ptModalRender(); }
  if (d === 'goto') {
    PT.modal = '';
    if ((PT.R.itemIds || []).includes(id) || (PT.R.recIds || []).includes(id)) { PT.sec = 'leaks'; PT.tab = (PT.R.recIds || []).includes(id) ? 'recs' : 'found'; PT.lf = 'all'; PT.open[id] = true; portalRender(); return setTimeout(() => ptFocus(id), 60); }
    PT.modal = id; return ptModalRender();
  }
  if (d === 'reply') { PT.replyTo[id] = b.dataset.c; (PT.modal ? ptModalRender : portalRender)(); const t = document.getElementById('tx-' + id); if (t) t.focus(); return; }
  if (d === 'noreply') { delete PT.replyTo[id]; return (PT.modal ? ptModalRender : portalRender)(); }
  if (d === 'flag') {
    const mine = (PT.D.flags[id] || []).some((x) => x.by === PT.me.id); b.disabled = true;
    ptCall({ op: 'flag', el: id, on: !mine }).then((res) => { ptSetEvents(res.events); portalRender(); toast(mine ? 'Red flag removed' : 'Red-flagged. Thank you: this will get attention.'); })
      .catch((e) => { b.disabled = false; toast(ptErr(e)); });
    return;
  }
  if (d === 'post') {
    const text = (PT.drafts[id] || '').trim(); if (!text) { toast('Write a comment first'); return; }
    PT.busy[id] = true; (PT.modal ? ptModalRender : portalRender)();
    ptCall({ op: 'comment', el: id, text, parent: PT.replyTo[id] || '' }).then((res) => { PT.busy[id] = false; PT.drafts[id] = ''; delete PT.replyTo[id]; ptSetEvents(res.events); portalRender(); toast('Comment posted'); })
      .catch((e) => { PT.busy[id] = false; (PT.modal ? ptModalRender : portalRender)(); toast(ptErr(e)); });
    return;
  }
  if (d === 'sumOpen') { document.getElementById('pt-sum').hidden = false; document.body.classList.add('pt-noscroll'); ptSumRender(); return; }
  if (d === 'sumClose') { document.getElementById('pt-sum').hidden = true; document.body.classList.remove('pt-noscroll'); return; }
  if (d === 'sumAll') return ptSumSet(null);
  if (d === 'sumNone') return ptSumSet([]);
  if (d === 'sumFlag') return ptSumSet(ptSumGroups().flatMap((g) => g.items).filter((x) => PT.D.flags[x.id]).map((x) => x.id));
  if (d === 'sumPrint') { const f = document.getElementById('pt-sumframe'); f.srcdoc = ptSumDoc(); setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (err) { toast('Printing isn’t available here; use Download PDF.'); } }, 300); return; }
  if (d === 'sumPdf') {
    const ids = ptSumIds(); const btn = document.getElementById('pt-sumpdf'); btn.disabled = true; btn.textContent = 'Preparing the PDF…';
    ptCall({ op: 'pdf', html: ptSumDoc(), items: ids, summaryTitle: PT_SUM.title, comments: PT_SUM.comments }).then((res) => {
      const bin = atob(res.pdf); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([arr], { type: 'application/pdf' })); const a = document.createElement('a'); a.href = url; a.download = res.name; document.body.appendChild(a); a.click(); a.remove();
      btn.disabled = false; btn.textContent = 'Download PDF'; toast('Your PDF is downloading.');
    }).catch((e) => { btn.disabled = false; btn.textContent = 'Download PDF'; toast(ptErr(e) + ' You can use Print instead.'); });
  }
});
document.addEventListener('input', (ev) => {
  if (!PORTAL_ON) return; const t = ev.target;
  if (t.dataset && t.dataset.draft) PT.drafts[t.dataset.draft] = t.value;
  if (t.dataset && t.dataset.sum === 'title') { PT_SUM.title = t.value; ptSumSave(); ptSumPreview(); }
  if (t.dataset && t.dataset.sum === 'note') { PT_SUM.note = t.value; ptSumSave(); ptSumPreview(); }
});
document.addEventListener('change', (ev) => {
  if (!PORTAL_ON) return; const t = ev.target; if (!t.dataset || !t.dataset.sum) return;
  const cur = ptSumIds(); const k = t.dataset.sum;
  if (k === 'comments' || k === 'fortnight') { PT_SUM[k] = t.checked; ptSumSave(); return ptSumPreview(); }
  if (k === 'it') return ptSumSet(t.checked ? cur.concat([t.dataset.id]) : cur.filter((i) => i !== t.dataset.id));
  if (k === 'grp') { const g = ptSumGroups()[+t.dataset.g]; const gids = g.items.map((x) => x.id); const rest = cur.filter((i) => !gids.includes(i)); return ptSumSet(t.checked ? rest.concat(gids) : rest); }
});
document.addEventListener('keydown', (ev) => {
  if (!PORTAL_ON || ev.key !== 'Escape') return;
  const s = document.getElementById('pt-sum'); if (s && !s.hidden) { s.hidden = true; document.body.classList.remove('pt-noscroll'); return; }
  if (PT.modal) { PT.modal = ''; ptModalRender(); }
});
