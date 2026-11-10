/* ============================================================
   App shell — storage, routing, actions, data editor, Claude bridge
   ============================================================ */
const STORE_KEY = 'tgm.studio.v1';
const ui = { tab: 'home', sub: {}, all: {}, share: false, scenario: 'current', processId: '', stepId: '', editStep: '', pv: null, execView: true, review: null, reviewSetup: '', procView: 'flow', flowCols: 0, flowZoom: 0, flowWhole: false, anon: false, ghosts: true, showCost: true, compare: true, zoom: 1, area: 'All', recType: 'All', coll: 'people', theme: '', reportType: 'status', capture: false, draft: null, session: false, sessionId: '', prioOnly: true };
let db = { activeId: '', engagements: {} };

/* ---------- storage (localStorage, wrapped; the JSON file export is the real backup) ---------- */
function loadDB() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) db = JSON.parse(raw); } catch (err) { console.warn('Storage unavailable', err); }
  if (!db.engagements || !Object.keys(db.engagements).length) {
    const lb = locationBankShell(), demo = demoEngagement();
    db = { activeId: demo.id, engagements: { [lb.id]: lb, [demo.id]: demo } };
  }
  Object.keys(db.engagements).forEach((k) => { db.engagements[k] = normalise(db.engagements[k]); if (!db.engagements[k].meta.tsMigrated) stampAll(db.engagements[k], LEGACY_CUTOFF); });
  if (db.engagements.eng_demo && (!db.engagements.eng_demo.engagement.phases.length || !db.engagements.eng_demo.competitors.length)) db.engagements.eng_demo = demoEngagement(); // refresh old demo with tracking sample
  if (!db.engagements[db.activeId]) db.activeId = Object.keys(db.engagements)[0];
  try { Object.assign(ui, JSON.parse(localStorage.getItem(STORE_KEY + '.ui') || '{}'), { scenario: 'current' }); } catch (err) { /* ignore */ }
  ui.flowCols = 0; ui.all = {}; landProcesses();
}
let saveTimer = null;
function save() {
  E().meta.lastUpdated = new Date().toISOString();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); setStatus('Saved in this browser'); }
    catch (err) { setStatus('⚠ Could not save in this browser. Click Back up to keep your work.'); }
  }, 250);
}
function flushSave() { if (!saveTimer) return; clearTimeout(saveTimer); saveTimer = null; try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (err) { /* ignore */ } }
window.addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
/** The Processes page always opens on Department view; Process view starts with just the "Choose process" button. */
function landProcesses() { ui.pv = Object.assign({}, ui.pv, { mode: 'dept', focus: '', pick: '', hl: '', journey: false }); ui.stepId = ''; ui.editStep = ''; }
function saveUI() { try { localStorage.setItem(STORE_KEY + '.ui', JSON.stringify({ tab: ui.tab, sub: ui.sub, share: ui.share, anonBefore: ui.anonBefore, talkP: ui.talkP, pv: ui.pv, execView: ui.execView, bpTop: ui.bpTop, lo: ui.lo && { lens: ui.lo.lens, sort: ui.lo.sort, signals: ui.lo.signals, noFix: ui.lo.noFix, unsized: ui.lo.unsized }, anon: ui.anon, showCost: ui.showCost, ghosts: ui.ghosts, compare: ui.compare, coll: ui.coll, theme: ui.theme })); } catch (err) { /* ignore */ } }
const E = () => db.engagements[db.activeId];
function procOfStep(id) { return E().processes.find((p) => (p.steps || []).some((x) => x.id === id)); }
function reviewCtx() {
  if (!ui.review) return {}; const proc = E().processes.find((x) => x.id === ui.review.procId); if (!proc) return {};
  const rev = (proc.reviews || []).find((r) => r.id === ui.review.revId); return { proc, rev, step: rev ? (proc.steps || [])[ui.review.idx] : null };
}
const nowISO = () => new Date().toISOString();
const touch = (o) => { if (o && typeof o === 'object') o.updatedAt = nowISO(); };
function hashStr(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); }
/** Merge with history, duplicate warning and freshness protection. Returns false if cancelled. */
function doMerge(obj, label, quiet) {
  const e = E(); e.meta.mergeLog = Array.isArray(e.meta.mergeLog) ? e.meta.mergeLog : [];
  const fp = (obj._meta && obj._meta.fileId) || hashStr(JSON.stringify(obj));
  const prior = e.meta.mergeLog.find((l) => l.fp === fp);
  if (prior && !quiet && !confirm(`You already merged "${prior.label}" on ${new Date(prior.mergedAt).toLocaleString('en-GB')}.\n\nMerge it again? (Nothing will be duplicated, and newer data is protected.)`)) return false;
  if (!obj._meta && !quiet && !confirm(`"${label}" has no date stamp (it was made before freshness tracking).\n\nIt can ADD new records but will NOT overwrite anything already in the Studio. Continue?`)) return false;
  const { engagement, counts, skipped } = mergeEngagement(e, obj);
  engagement.id = db.activeId; db.engagements[db.activeId] = engagement;
  const sum = Object.entries(counts).filter(([, v]) => v.added || v.updated || v.skipped).map(([k, v]) => `${k} +${v.added}/~${v.updated}${v.skipped ? `/✕${v.skipped}` : ''}`).join(', ');
  engagement.meta.mergeLog = [{ fp, label, generatedAt: (obj._meta && obj._meta.generatedAt) || '', mergedAt: nowISO(), summary: sum || 'profile fields', skipped: skipped.slice(0, 50) }, ...(e.meta.mergeLog || [])].slice(0, 100);
  save(); if (quiet) return true; render();
  toast(`Merged: ${sum || 'profile fields'}${skipped.length ? ` · ${skipped.length} skipped (newer data kept)` : ''}`);
  return true;
}
/** Live founder session: write one answer straight into the respondent's record (no re-render, so typing is never interrupted). */
function intakeWrite(t) {
  const r = E().intake.find((x) => x.id === ui.sessionId); if (!r) return;
  const qid = t.dataset.intake || t.dataset.intakesel || t.dataset.intakemulti || t.dataset.intakeother;
  let v;
  if (t.dataset.intakemulti || t.dataset.intakeother) {
    const picked = [...document.querySelectorAll(`[data-intakemulti="${qid}"]:checked`)].map((x) => x.value);
    const other = (document.querySelector(`[data-intakeother="${qid}"]`) || {}).value || '';
    v = [...picked, ...splitList(other)].join(', ');
  } else v = t.value;
  if (String(v).trim()) r.answers[qid] = v; else delete r.answers[qid];
  touch(r); r.sessionDates = Array.from(new Set([...(r.sessionDates || []), todayISO()]));
  if (!/Live session/.test(r.source || '')) r.source = r.source ? r.source + ' + Live session' : 'Live session';
  const qa = t.closest('.qa'); if (qa) qa.classList.toggle('qa-done', !!String(v).trim());
  save();
}
function flagBadge(e) {
  if (!e.engagement.phases.length) return '';
  const st = engagementStatus(e); const n = st.openDelays.length, o = st.overdue.length;
  if (!n && !o && !st.totalSlip) return '<span class="flag-badge ok" title="No open delays or overdue client items">✓ On track</span>';
  return `<button class="flag-badge" data-action="tab" data-id="progress" title="Open the delays & changes log">⚑ ${n} open delay${n === 1 ? '' : 's'}${st.totalSlip ? ` · +${st.totalSlip}d` : ''}${o ? ` · ${o} overdue from client` : ''}</button>`;
}
function setStatus(t) { const el = document.getElementById('status'); if (el) el.textContent = t; }

/* ---------- formatting ---------- */
function fmtMoney(v) {
  v = num(v); const cur = (E() && E().meta.currency) || 'ZAR';
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur, currencyDisplay: 'narrowSymbol', maximumFractionDigits: Math.abs(v) >= 1e6 ? 2 : 0, notation: Math.abs(v) >= 1e6 ? 'compact' : 'standard' }).format(v);
  } catch (err) { return cur + ' ' + Math.round(v).toLocaleString('en-GB'); }
}
function fmtShort(v) {
  v = num(v); const cur = (E() && E().meta.currency) || 'ZAR';
  try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur, currencyDisplay: 'narrowSymbol', notation: 'compact', maximumFractionDigits: 1 }).format(v); }
  catch (err) { return Math.round(v).toLocaleString('en-GB'); }
}

/* ---------- path helpers ---------- */
function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
function setPath(obj, path, val) { const ks = path.split('.'); const last = ks.pop(); const t = ks.reduce((o, k) => (o[k] = o[k] || {}), obj); t[last] = val; }

/* ---------- render ---------- */
function renderHeader() {
  normaliseTab();
  const e = E();
  const engOpts = Object.values(db.engagements).map((x) => `<option value="${x.id}" ${x.id === db.activeId ? 'selected' : ''}>${esc(x.client.name)}</option>`).join('');
  const scOpts = [['current', 'Current state'], ...e.scenarios.map((s) => [s.id, s.name]), ['all', 'All recommendations']].map(([id, n]) => `<option value="${id}" ${ui.scenario === id ? 'selected' : ''}>${esc(n)}</option>`).join('');
  document.getElementById('topbar').innerHTML = `
    <div class="brand"><span class="cog" aria-hidden="true">✹</span><span>THE <strong>GROWTH</strong> MACHINE</span><em>Studio</em></div>
    <label class="hsel"><span>Client</span><select id="engSel">${engOpts}</select></label>
    ${SCENARIO_TABS.includes(ui.tab) || ui.scenario !== 'current' ? `<label class="hsel"><span>View as</span><select id="scSel">${scOpts}</select></label>` : ''}
    ${flagBadge(e)}
    <div class="hbtns"><button class="btn sm ${ui.share ? 'on share-on' : 'ghost'}" data-action="share" title="Screen-share mode: names become roles, and TGM-only notes (🔒 reminders, the work diary, confidential interview points) are hidden">${ui.share ? '● Screen share on' : 'Screen share'}</button>${syncTopBtn()}<button class="btn sm" data-action="newEng">+ New client</button><button class="btn sm" data-action="exportJSON" title="Download everything saved for ${esc(e.client.name)}: data, interviews, findings, progress, diary and merge history">Back up</button><button class="btn sm ghost" data-action="theme" title="Toggle light/dark">◐</button></div>`;
  const st = e.engagement.phases.length ? engagementStatus(e) : null;
  const badge = (id) => id === 'progress' && st && (st.openDelays.length || st.overdue.length) ? `<span class="nav-badge" title="Open delays / overdue client items">⚑ ${st.openDelays.length + st.overdue.length}</span>` : '';
  document.getElementById('nav').innerHTML = TABS.map(([id, n]) => `<button class="nav-btn ${ui.tab === id ? 'on' : ''}" data-action="tab" data-id="${id}">${n}${badge(id)}</button>`).join('')
    + `<div class="nav-foot"><div id="status" class="faint small">Saved in this browser</div><div class="faint small">Last backup: ${e.meta.lastExported ? new Date(e.meta.lastExported).toLocaleString('en-GB') : 'never'}</div><div class="faint small">Studio version: ${typeof STUDIO_BUILD === 'undefined' ? 'dev' : STUDIO_BUILD}</div></div>`;
}
/** Scroll the visual so a step sits in the middle of the viewer (horizontally inside the scroll box, vertically on the page). */
function centreStep(id) {
  const n = document.querySelector(`.pv-visual [data-id="${CSS.escape(id)}"].fnode, .pv-visual [data-id="${CSS.escape(id)}"].jl-n, .pv-visual [data-id="${CSS.escape(id)}"].jl-o, .flow-svg g.fnode[data-id="${CSS.escape(id)}"]`);
  if (!n) return; const wrap = n.closest('.flow-wrap'); const r = n.getBoundingClientRect();
  if (wrap) { const w = wrap.getBoundingClientRect(); wrap.scrollLeft += (r.left + r.width / 2) - (w.left + w.width / 2); if (wrap.scrollHeight > wrap.clientHeight) wrap.scrollTop += (r.top + r.height / 2) - (w.top + w.height / 2); }
  const r2 = n.getBoundingClientRect(); if (r2.top < 70 || r2.bottom > window.innerHeight) window.scrollBy({ top: (r2.top + r2.height / 2) - window.innerHeight / 2, behavior: 'smooth' });
}
function render() {
  const keep = [...document.querySelectorAll('#main .flow-wrap')].map((w) => [w.scrollLeft, w.scrollTop]);
  const e = E();
  renderHeader();
  normaliseTab();
  const views = { home: viewLeaks, plan: viewPlan, processes: viewProcesses, evidence: viewEvidence, talk: viewTalk, progress: viewProgressReports, data: viewData };
  let html;
  try { html = (views[ui.tab] || viewLeaks)(e); }
  catch (err) { console.error(err); html = `<div class="banner err">Something in this client's data could not be displayed: ${esc(err.message)}. Check Sources &amp; data.</div>`; }
  document.getElementById('main').innerHTML = html;
  document.body.classList.toggle('share', !!ui.share);
  document.querySelectorAll('#main .flow-wrap').forEach((w, i) => { if (keep[i]) { w.scrollLeft = keep[i][0]; w.scrollTop = keep[i][1]; } });
  document.documentElement.dataset.theme = ui.theme || '';
  if (!ui.theme) delete document.documentElement.dataset.theme;
}

/* ---------- Sources & data view (lives here because it is tied to the editor) ---------- */
const FIELD_DEFS = {
  departments: [['id', 'text'], ['name', 'text'], ['type', DEPT_TYPES.map((d) => d[0])], ['headId', 'person'], ['notes', 'text']],
  people: [['id', 'text'], ['name', 'text'], ['title', 'text'], ['departmentId', 'dept'], ['managerId', 'person'], ['employmentType', ['Full-time', 'Part-time', 'Contractor', 'Outsourced', 'Vacant']], ['fte', 'num'], ['annualCost', 'num'], ['location', 'text'], ['startDate', 'date'], ['notes', 'text']],
  tools: [['id', 'text'], ['name', 'text'], ['category', 'text'], ['vendor', 'text'], ['monthlyCost', 'num'], ['seats', 'num'], ['activeUsers', 'num'], ['departmentIds', 'text'], ['ownerId', 'person'], ['purpose', 'text'], ['notes', 'text']],
  processes: [['id', 'text'], ['name', 'text'], ['group', 'text'], ['leadsTo', 'text'], ['departmentId', 'dept'], ['ownerId', 'person'], ['confidence', Object.keys(CONFIDENCE)], ['sources', 'text'], ['summary', 'long'], ['talkingPoints', 'long'], ['findingIds', 'text'], ['frequency', 'text'], ['runsPerMonth', 'num'], ['hoursPerMonth', 'num'], ['inputs', 'text'], ['outputs', 'text'], ['team', 'text'], ['askId', 'text'], ['steps', 'json']],
  segments: [['id', 'text'], ['name', 'text'], ['customers', 'num'], ['annualRevenue', 'num'], ['churnPct', 'num'], ['acquisitionChannel', 'text'], ['notes', 'text']],
  markets: [['id', 'text'], ['name', 'text'], ['region', 'text'], ['revenueShare', 'num'], ['notes', 'text']],
  topClients: [['id', 'text'], ['name', 'text'], ['segment', ['Managed', 'Reseller / self-service', 'Partner / section row']], ['csm', 'text'], ['annualRevenue', 'num'], ['churnRisk', ['Low', 'Medium', 'High']], ['contractStatus', ['In contract', 'Renews within 90 days', 'Out of contract', 'Month to month', 'Unknown']], ['satisfaction', 'text'], ['touchpoint', ['Low', 'Low-Medium', 'Medium', 'Medium-High', 'High']], ['adoption', ['Low', 'Medium', 'High']], ['register', 'json'], ['csScores', 'json'], ['notes', 'text']],
  financePeriods: [['id', 'text'], ['label', 'text'], ['months', 'num'], ['revenue', 'num'], ['cogs', 'num'], ['payroll', 'num'], ['tools', 'num'], ['marketing', 'num'], ['premises', 'num'], ['other', 'num']],
  interviews: [['id', 'text'], ['personId', 'person'], ['date', 'date'], ['interviewer', 'text'], ['summary', 'long'], ['themes', 'text'], ['painPoints', 'long'], ['ideas', 'long'], ['quotes', 'long']],
  findings: [['id', 'text'], ['title', 'text'], ['area', 'text'], ['severity', ['high', 'medium', 'low']], ['kind', ['leak', 'weakness', 'hole', 'opportunity', 'tool', 'context']], ['valueMonthly', 'num'], ['basis', ['Leaking', 'At risk', 'Spend to review', 'Upside']], ['fixId', 'text'], ['partOf', 'text'], ['nextStep', 'text'], ['lens', 'text'], ['pinned', ['', 'true']], ['evidence', 'long'], ['sources', 'json']],
  sources: [['id', 'text'], ['name', 'text'], ['type', ['Interview', 'Meeting', 'Voice note', 'Spreadsheet', 'Presentation', 'Document', 'Management accounts', 'Platform export', 'Other']], ['from', 'text'], ['person', 'text'], ['asOf', 'text'], ['received', 'text'], ['via', 'text'], ['link', 'text'], ['notes', 'text']],
  feedback: [['id', 'text'], ['topic', 'text'], ['area', ['Revenue', 'Billing', 'Customers', 'Cost', 'Risk', 'Process', 'Documents']], ['number', 'text'], ['numberLabel', 'text'], ['says', 'long'], ['reality', 'long'], ['soWhat', 'long'], ['suggestion', 'long'], ['priority', ['high', 'medium', 'low']], ['status', ['Draft', 'Confirmed with client', 'Sent']], ['source', 'text'], ['sources', 'json']],
  revenueMovements: [['id', 'text'], ['fy', 'text'], ['client', 'text'], ['kind', ['lost', 'downgrade', 'new', 'growth']], ['cause', 'text'], ['monthly', 'num'], ['from', 'text'], ['reason', 'text'], ['comment', 'text']],
  customQuestions: [['id', 'text'], ['personId', 'person'], ['section', 'text'], ['q', 'long'], ['note', 'text'], ['crit', CRITERIA.map((c) => c.id)], ['p', 'num'], ['ord', 'num'], ['qWas', 'text']],
  competitors: [['id', 'text'], ['name', 'text'], ['type', ['Direct', 'Indirect', 'Substitute', 'Adjacent']], ['threat', ['High', 'Medium', 'Low']], ['website', 'text'], ['hq', 'text'], ['markets', 'text'], ['segments', 'text'], ['offering', 'long'], ['pricingModel', 'text'], ['pricePoint', 'num'], ['size', 'text'], ['ownership', 'text'], ['strengths', 'long'], ['weaknesses', 'long'], ['whereWeWin', 'long'], ['whereWeLose', 'long'], ['sources', 'long'], ['lastReviewed', 'date']],
  intel: [['id', 'text'], ['competitorId', 'comp'], ['topic', INTEL_TOPICS], ['note', 'long'], ['sourceType', SOURCE_TYPES], ['source', 'text'], ['date', 'date']],
  usps: [['id', 'text'], ['claim', 'text'], ['strength', ['Unique', 'Shared', 'Claimed only']], ['proof', 'long'], ['competitorsWithIt', 'text'], ['notes', 'text']],
  automations: [['id', 'text'], ['title', 'text'], ['removes', 'long'], ['system', 'text'], ['usesExisting', ['Yes', 'No']], ['approach', ['native', 'connect', 'ai']], ['status', AUTO_STATUS], ['effort', ['Low', 'Medium', 'High']], ['valueMonthly', 'num'], ['hoursMonthly', 'num'], ['basis', 'text'], ['processId', 'text'], ['owner', 'text'], ['nextStep', 'text'], ['description', 'long']],
  opportunities: [['id', 'text'], ['title', 'text'], ['area', OPP_AREAS], ['description', 'long'], ['basedOn', 'text'], ['impact', ['High', 'Medium', 'Low']], ['effort', ['High', 'Medium', 'Low']], ['status', ['Idea', 'Proposed', 'Recommendation']], ['valueMonthly', 'num'], ['recommendationId', 'text'], ['nextStep', 'text']],
  capabilities: [['id', 'text'], ['name', 'text'], ['importance', ['High', 'Medium', 'Low']], ['client', ['Strong', 'Partial', 'None']], ['notes', 'text'], ['scores', 'json']],
  recommendations: [['id', 'text'], ['title', 'text'], ['type', ['People', 'Process', 'Tool', 'Build', 'Structure', 'Commercial']], ['horizon', ['0-3 months', '3-6 months', '6-12 months', '12+ months']], ['description', 'long'], ['effort', 'num'], ['risk', 'num'], ['confidence', 'num'], ['oneOffCost', 'num'], ['otherAnnualSaving', 'num'], ['oneOffSaving', 'num'], ['revenueUplift', 'num'], ['status', REC_STAGES], ['stick', 'long'], ['owner', 'text'], ['pinned', ['', 'true']], ['ops', 'json']],
  scenarios: [['id', 'text'], ['name', 'text'], ['description', 'text'], ['recommendationIds', 'json']]
};
const COLL_LABELS = { customQuestions: 'Custom interview questions', competitors: 'Competitors', capabilities: 'Capabilities', intel: 'Competitor intelligence', usps: 'USPs', opportunities: 'Opportunities', automations: 'Automation opportunities', intake: 'Founder answers', departments: 'Departments', people: 'People', tools: 'Tools', processes: 'Processes', segments: 'Customer segments', markets: 'Markets', topClients: 'Clients', revenueMovements: 'Revenue movements', feedback: 'Client feedback (written vs practice)', sources: 'Sources (where every number comes from)', financePeriods: 'Finance periods', interviews: 'Interviews', findings: 'Findings', recommendations: 'Recommendations', scenarios: 'Scenarios' };

function cellInput(e, coll, row, [f, type]) {
  const v = row[f]; const base = `data-cell data-coll="${coll}" data-id="${esc(row.id)}" data-field="${f}"`;
  if (Array.isArray(type)) return `<select ${base}><option value=""></option>${type.map((o) => `<option ${v === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  if (type === 'person') return `<select ${base}><option value="">—</option>${e.people.map((p) => `<option value="${p.id}" ${v === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>`;
  if (type === 'comp') return `<select ${base}><option value="">—</option>${e.competitors.map((c) => `<option value="${c.id}" ${v === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>`;
  if (type === 'dept') return `<select ${base}><option value="">—</option>${e.departments.map((d) => `<option value="${d.id}" ${v === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select>`;
  if (type === 'json') return `<button class="btn sm" data-action="editJSON" data-coll="${coll}" data-id="${esc(row.id)}" data-field="${f}">Edit (${Array.isArray(v) ? v.length : 0})</button>`;
  if (type === 'long') return `<textarea ${base} rows="2">${esc(v)}</textarea>`;
  return `<input ${base} data-type="${type}" type="${type === 'num' ? 'number' : type === 'date' ? 'date' : 'text'}" value="${esc(v)}" ${f === 'id' ? 'class="id-cell"' : ''}>`;
}

function viewData(e) {
  const coll = ui.coll; const defs = FIELD_DEFS[coll];
  const grid = `<table class="tbl grid-edit"><thead><tr>${defs.map(([f]) => `<th>${f}</th>`).join('')}<th></th></tr></thead><tbody>
    ${e[coll].map((row) => `<tr>${defs.map((d) => `<td>${cellInput(e, coll, row, d)}</td>`).join('')}<td><button class="btn sm ghost" data-action="delRow" data-coll="${coll}" data-id="${esc(row.id)}" title="Delete row">✕</button></td></tr>`).join('')}
    </tbody></table>`;
  return `<div class="page-h"><div><span class="eyebrow">Sources &amp; data</span><h1>Get information in and out</h1><p class="muted">This browser saves your work automatically, but browser storage is not a backup. <strong>Back up after every session</strong> and keep the files somewhere private, such as your own Google Drive. Never put them in the website repo.</p></div></div>
  <div class="grid-2">
    ${card('Back up / restore', `<div class="btn-row">
        <button class="btn" data-action="exportJSON">Back up ${esc(e.client.name)} (everything)</button>
        <label class="btn">Import client file<input type="file" accept=".json,application/json" id="importFile" hidden></label>
        <label class="btn ghost">Merge a JSON file<input type="file" accept=".json,application/json" id="mergeFile" hidden></label>
        <button class="btn ghost" data-action="exportAll">Back up all clients</button>
      </div>
      <p class="faint small">"Back up" downloads one file with everything saved for ${esc(e.client.name)}: business data, interviews, findings, recommendations, progress, your private diary and merge history. It is for TGM only; never send it to the client (use the Report tab instead). "Import client file" loads a whole client, replacing it if it already exists. "Merge a JSON file" adds a partial file (e.g. competitor research from Claude) into ${esc(e.client.name)} without deleting anything.</p>`)}
    ${card('Paste from Claude', `<textarea id="pasteBox" rows="7" placeholder='Paste JSON here, e.g. {"people":[...],"interviews":[...]}'></textarea>
      <div class="btn-row"><button class="btn" data-action="mergePaste">Merge into ${esc(e.client.name)}</button><button class="btn ghost" data-action="copyPrompt">Copy Claude prompt</button><button class="btn ghost" data-action="copyContext">Copy client JSON for Claude</button></div>
      <p class="faint small">Merge adds new records and updates records with the same id. Nothing is deleted.</p>`)}
  </div>
  ${syncCard()}
  ${sourcesCard(e)}
  ${card('Find and replace text', `<div class="fr-row"><label class="fld"><span>Find</span><input id="frFind" placeholder="e.g. a misspelt name"></label><label class="fld"><span>Replace with</span><input id="frRepl"></label>
      <label class="tog small"><input type="checkbox" id="frCase"> Match case</label><button class="btn" data-action="findReplace">Find and replace…</button></div>
      <p class="faint small">Searches every text in ${esc(e.client.name)}: findings, recommendations, processes and steps, interviews, questions, notes. It shows how many it found and where before changing anything. IDs and the merge history are never changed.</p>`)}
  ${card('Edit data', `<div class="toolbar">${Object.keys(FIELD_DEFS).map((c) => `<button class="btn sm ${coll === c ? 'on' : ''}" data-action="coll" data-id="${c}">${COLL_LABELS[c]} (${e[c].length})</button>`).join('')}</div>
    <div class="scroll-x">${grid}</div>
    <div class="btn-row"><button class="btn" data-action="addRow" data-coll="${coll}">+ Add ${COLL_LABELS[coll].toLowerCase().replace(/s$/, '')}</button></div>
    <p class="faint small">Changes save as you leave each cell. Lists (process steps, recommendation ops, scenario recommendation ids) are edited as JSON. See the README for the format.</p>`)}
  ${card(`Merge history (${(e.meta.mergeLog || []).length})`, (e.meta.mergeLog || []).length ? `<details id="mergeHist" ${ui.mergeOpen ? 'open' : ''}><summary class="small"><b>${ui.mergeOpen ? 'Hide' : 'Show'} history</b> · latest: ${esc(e.meta.mergeLog[0].label)} (${esc(new Date(e.meta.mergeLog[0].mergedAt).toLocaleString('en-GB'))})</summary><table class="tbl" style="margin-top:8px"><thead><tr><th>Merged</th><th>File</th><th>File date</th><th>What changed</th></tr></thead><tbody>${(e.meta.mergeLog || []).slice(0, 30).map((l) => `<tr><td class="nowrap small">${esc(new Date(l.mergedAt).toLocaleString('en-GB'))}</td><td class="small">${esc(l.label)}</td><td class="nowrap small">${l.generatedAt ? esc(new Date(l.generatedAt).toLocaleString('en-GB')) : '<span class="chip sev-medium">● no stamp</span>'}</td><td class="small">${esc(l.summary)}${l.skipped && l.skipped.length ? `<div class="faint">Skipped (newer data kept): ${esc(l.skipped.map((s) => s.coll + (s.id ? ':' + s.id : '')).join(', '))}</div>` : ''}</td></tr>`).join('')}</tbody></table></details>` : '<p class="empty">No merges recorded yet. Every merge from now on is listed here, and merging the same file twice asks you first.</p>', { sub: '+ added · ~ updated · ✕ skipped because the Studio already had newer data. Hand edits always count as newer than earlier files.' })}
  ${card('Danger zone', `<div class="btn-row"><button class="btn ghost" data-action="duplicateEng">Duplicate this client</button><button class="btn danger" data-action="deleteEng">Delete ${esc(e.client.name)} from this browser</button></div>`)}`;
}

const CLAUDE_PROMPT = `You are helping me populate The Growth Machine Studio, my consulting diagnostic tool.
Turn the material below (interview notes, org info, finance exports, process descriptions) into JSON that matches this schema exactly. Return ONLY the JSON object, with no commentary.

Schema "tgm.engagement/1". Include only the collections you have data for. Every record needs a short, stable "id" (e.g. "p_jane", "pr_onboarding"). Reuse existing ids when updating records.
{
  "client": { "name","sector","subSector","hq","website","founded","stage","businessModel","revenueModel","description","goals","constraints" },
  "departments": [{ "id","name","headId" }],
  "people": [{ "id","name","title","departmentId","managerId","employmentType":"Full-time|Part-time|Contractor|Outsourced|Vacant","fte":1,"annualCost":0,"location","notes" }],
  "tools": [{ "id","name","category","vendor","monthlyCost":0,"seats":0,"activeUsers":0,"departmentIds":"d_a,d_b","purpose" }],
  "processes": [{ "id","name","stage":"attract|sell|onboard|deliver|grow (blank = internal)","departmentId","ownerId","confidence":"heard|corroborated|measured","sources","summary","talkingPoints":"one per line","findingIds":"f_a,f_b","frequency","runsPerMonth":0,"inputs","outputs",
     "steps": [{ "id","name","team":"client|marketing|sales|cs|ops|product|leadership|finance|system","actorId":"<person id or empty>","actorLabel":"<role if no person>","toolId","durationMins":0,"automated":false,"input","output","painPoint",
        "flags":[{ "type":"issue|unverified|weakness","text","by","date" }] }] }],
  "segments": [{ "id","name","customers":0,"annualRevenue":0,"churnPct":0,"acquisitionChannel" }],
  "markets": [{ "id","name","region","revenueShare":0 }],
  "topClients": [{ "id","name","segmentId","annualRevenue":0 }],
  "financePeriods": [{ "id","label","months":3,"revenue":0,"cogs":0,"payroll":0,"tools":0,"marketing":0,"premises":0,"other":0 }],
  "interviews": [{ "id","personId","date":"YYYY-MM-DD","interviewer","summary","themes":"comma, separated, consistent tags","painPoints":"one per line","ideas","quotes" }],
  "findings": [{ "id","title","area","severity":"high|medium|low","evidence" }],
  "recommendations": [{ "id","title","type":"People|Process|Tool|Build|Structure|Commercial","horizon":"0-3 months|3-6 months|6-12 months|12+ months",
     "description","effort":1-5,"risk":1-5,"confidence":1-5,"oneOffCost":0,"otherAnnualSaving":0,"revenueUplift":0,"status":"Proposed",
     "ops": [ /* modelled changes, applied to the current state to build scenarios */
       {"op":"removePerson","personId"}, {"op":"addPerson","person":{...}}, {"op":"updatePerson","personId","changes":{...}},
       {"op":"removeTool","toolId"}, {"op":"addTool","tool":{...}}, {"op":"updateTool","toolId","changes":{...}},
       {"op":"addProcess","process":{...}}, {"op":"removeProcess","processId"}, {"op":"updateProcess","processId","changes":{...}},
       {"op":"addStep","processId","afterStepId","step":{...}}, {"op":"updateStep","processId","stepId","changes":{...}}, {"op":"removeStep","processId","stepId"} ] }],
  "scenarios": [{ "id","name","description","recommendationIds":["r1","r2"] }],
  "competitors": [{ "id","name","type":"Direct|Indirect|Substitute|Adjacent","threat":"High|Medium|Low","website","hq","markets","segments","offering","pricingModel","pricePoint":0,"size","ownership","strengths","weaknesses","whereWeWin","whereWeLose","sources":"URLs, one per line (required)","lastReviewed":"YYYY-MM-DD" }],
  "intel": [{ "id","competitorId","topic":"Pricing|Product|Marketing|Customers|Team|Technology|Partnerships|News|Other","note":"one fact per entry","sourceType":"Online research|Founder|Staff|Client / customer|Other","source":"URL or who said it","date":"YYYY-MM-DD" }],
  "usps": [{ "id","claim","strength":"Unique|Shared|Claimed only","proof","competitorsWithIt" }],
  "automations": [{ "id","title","removes":"the manual work it takes away","system":"the system it runs in","usesExisting":"Yes|No (Yes = a system the client already uses or is moving to)","approach":"native|connect|ai","status":"Idea|Proposed|Agreed|In progress|Live","effort":"Low|Medium|High","valueMonthly":0,"hoursMonthly":0,"basis","processId","owner","nextStep","description" }],
  "opportunities": [{ "id","title","area":"Positioning|Marketing|Product|Pricing|Sales|Systems & operations","description","basedOn","impact":"High|Medium|Low","effort":"High|Medium|Low","status":"Idea" }],
  "capabilities": [{ "id","name","importance":"High|Medium|Low","client":"Strong|Partial|None","scores":{ "<competitor id>":"Strong|Partial|None" } }],
  "engagement": { "timeLog": [{ "id":"day_YYYY-MM-DD","date":"YYYY-MM-DD","dayType":"Full|Half","items":"one output per line" }] }
}
Rules: amounts are annual unless the field says monthly. Use the client's currency. Never invent numbers. Leave a field out if it is unknown, and list what is missing in a separate message after the JSON. Keep theme tags consistent across interviews.
Competitor research: every competitor needs sources (URLs) and a lastReviewed date. pricePoint is an indicative monthly price per location in the client's currency; leave it out rather than guess. Only score a capability when there is evidence.

MATERIAL:
`;

/* ---------- actions ---------- */
function downloadFile(name, content, type) {
  const blob = new Blob([content], { type: type || 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function copyText(t, msg) {
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(msg || 'Copied')).catch(() => {
    const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); toast(msg || 'Copied'); } catch (err) { toast('Copy failed. Select the text manually.'); } ta.remove();
  });
}
function toast(t) { const el = document.getElementById('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 2600); }
function stripMarks(o) { return JSON.parse(JSON.stringify(o, (k, v) => (k.startsWith('_') ? undefined : v))); }

const actions = {
  syncConnect: () => syncConnect(),
  syncCheck: () => syncCheck(false),
  syncBackup: () => syncBackup(false),
  tab: (el) => { if (el.dataset.id === 'processes' && ui.tab !== 'processes') landProcesses(); ui.tab = el.dataset.id; ui.capture = false; ui.session = false; if (el.dataset.sub) { normaliseTab(); ui.sub[ui.tab] = el.dataset.sub; } saveUI(); render(); window.scrollTo(0, 0); },
  sub: (el) => { ui.sub = Object.assign({}, ui.sub, { [el.dataset.tab]: el.dataset.id }); ui.capture = false; ui.session = false; saveUI(); render(); },
  showAll: (el) => { ui.all = Object.assign({}, ui.all, { [el.dataset.id]: !(ui.all || {})[el.dataset.id] }); render(); },
  loNeed: (el) => { const k = el.dataset.k; const L = ui.lo || {}; ui.lo = Object.assign({}, L, k === 'clear' ? { noFix: false, unsized: false } : { noFix: k === 'noFix' ? !L.noFix : false, unsized: k === 'unsized' ? !L.unsized : false }, { open: '' }); ui.all = Object.assign({}, ui.all, { home: !!(ui.lo.noFix || ui.lo.unsized) }); saveUI(); render(); },
  nrrReport: () => { ui.tab = 'progress'; ui.sub = Object.assign({}, ui.sub, { progress: 'report' }); ui.reportType = 'nrr'; saveUI(); render(); window.scrollTo(0, 0); },
  talkP: (el) => { ui.talkP = el.dataset.id; render(); },
  share: () => { if (!ui.share) { ui.anonBefore = !!ui.anon; ui.anon = true; ui.share = true; } else { ui.share = false; ui.anon = !!ui.anonBefore; } saveUI(); render(); toast(ui.share ? 'Screen share on: names show as roles; TGM-only notes are hidden' : 'Screen share off'); },
  pvPick: (el) => { ui.pv = Object.assign({}, ui.pv, { mode: 'proc', focus: '', pick: el.dataset.id || '' }); ui.stepId = ''; saveUI(); render(); },
  pvBack: (el) => { ui.pv = Object.assign({}, ui.pv, { mode: 'proc', focus: '', hl: '', journey: false, pick: el.dataset.id || 'open' }); ui.stepId = ''; ui.editStep = ''; saveUI(); render(); window.scrollTo(0, 0); },
  setScenario: (el) => { ui.scenario = el.dataset.id; render(); },
  proc: (el) => { ui.pv = Object.assign({}, ui.pv, { mode: 'proc', procs: [el.dataset.id] }); ui.stepId = ''; ui.review = null; ui.reviewSetup = ''; ui.flowZoom = 0; ui.flowColsAuto = 0; ui.flowWhole = false; saveUI(); render(); },
  flowStep: (el) => {
    if (ui.review) { const { proc } = reviewCtx(); const i = proc ? (proc.steps || []).findIndex((x) => x.id === el.dataset.id) : -1; if (i >= 0) { ui.review.idx = i; render(); centreStep(el.dataset.id); } return; }
    ui.stepId = el.dataset.id; ui.flagFocus = el.dataset.flag ? { stepId: el.dataset.id, kind: el.dataset.flag } : null; render();
    centreStep(ui.stepId);
  },
  flowClear: () => { ui.stepId = ''; ui.flagFocus = null; render(); },
  bpTop: (el) => { ui.bpTop = +el.dataset.id; saveUI(); render(); },
  findReplace: () => {
    const find = (document.getElementById('frFind').value || ''); const repl = document.getElementById('frRepl').value || ''; const mc = document.getElementById('frCase').checked;
    if (!find.trim()) return toast('Type the text to find');
    const re = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), mc ? 'g' : 'gi');
    const e = E(); const SKIP = new Set(['id', 'updatedAt', 'mergeLog', 'deleted', 'lastExported', 'lastUpdated']);
    const isIdKey = (k) => /Ids?$/.test(k) || k === 'leadsTo';
    const hits = {}; let total = 0;
    const walk = (o, area, apply) => {
      let changed = false;
      Object.keys(o).forEach((k) => {
        if (SKIP.has(k) || isIdKey(k) || k.startsWith('_')) return; const v = o[k];
        if (typeof v === 'string') { const m = v.match(re); if (m) { if (apply) { o[k] = v.replace(re, repl); changed = true; } else { hits[area] = (hits[area] || 0) + m.length; total += m.length; } } }
        else if (v && typeof v === 'object') { if (walk(v, area, apply)) changed = true; }
      });
      return changed;
    };
    const areas = Object.keys(e).filter((k) => !['id', 'schema', 'meta'].includes(k));
    areas.forEach((k) => { const v = e[k]; if (Array.isArray(v)) v.forEach((r) => r && typeof r === 'object' && walk(r, COLL_LABELS[k] || k, false)); else if (v && typeof v === 'object') walk(v, k === 'engagement' ? 'Progress & time' : k, false); });
    if (!total) return toast(`No matches for "${find}"`);
    const list = Object.entries(hits).map(([a, n]) => `  ${a}: ${n}`).join('\n');
    if (!confirm(`Found "${find}" ${total} time${total === 1 ? '' : 's'}:\n${list}\n\nReplace all with "${repl}"?`)) return;
    areas.forEach((k) => { const v = e[k]; if (Array.isArray(v)) v.forEach((r) => { if (r && typeof r === 'object' && walk(r, '', true)) touch(r); }); else if (v && typeof v === 'object' && walk(v, '', true)) touch(v); });
    e.meta.replaceLog = [{ find, repl, count: total, at: nowISO() }, ...(e.meta.replaceLog || [])].slice(0, 50);
    save(); render(); toast(`Replaced ${total} occurrence${total === 1 ? '' : 's'}. Back up when you're ready.`);
  },
  loSet: (el) => { ui.lo = Object.assign({}, ui.lo, { [el.dataset.k]: el.dataset.id, open: '' }); saveUI(); render(); },
  loTick: (el) => { ui.lo = Object.assign({}, ui.lo, { [el.dataset.k]: el.checked }); saveUI(); render(); },
  loOpen: (el) => { ui.lo = Object.assign({}, ui.lo, { open: ui.lo && ui.lo.open === el.dataset.id ? '' : el.dataset.id }); render(); },
  pvFocus: (el) => { ui.pv = Object.assign({}, ui.pv, { mode: 'proc', focus: el.dataset.id || '', hl: '', journey: false, pick: '' }); ui.stepId = ''; ui.editStep = ''; ui.flagFocus = null; ui.flowZoom = 0; ui.flowColsAuto = 0; ui.flowWhole = false; ui.reviewSetup = ''; saveUI(); render(); window.scrollTo(0, 0); },
  pvJourney: (el) => { ui.pv = Object.assign({}, ui.pv, { journey: !!el.checked }); ui.stepId = ''; ui.flowZoom = 0; ui.flowColsAuto = 0; saveUI(); render(); },
  pvHl: (el) => { const t = el.dataset.id || ''; ui.pv = Object.assign({}, ui.pv, { hl: (ui.pv || {}).hl === t ? '' : t }); saveUI(); render(); },
  procMapStart: () => { const e = E(); const p = e.processes.find((x) => x.id === (ui.pv || {}).focus); if (!p) return;
    const s = { id: uid('s'), name: 'First step', team: p.team || '', actorLabel: '', toolId: '', automated: false, durationMins: '', elapsedDays: '', painPoint: '', flags: [] };
    p.steps = [s]; touch(p); save(); ui.stepId = s.id; ui.editStep = s.id; render(); toast('Rename the first step, then add the rest with + Step after.'); },
  subNew: () => { const e = E(); const proc = procOfStep(ui.stepId); const step = proc && (proc.steps || []).find((x) => x.id === ui.stepId); if (!step) return;
    const n = prompt('Name of the sub-process (more detail for this step)', step.name); if (!n || !n.trim()) return;
    const sp = { id: uid('pr'), name: n.trim(), group: proc.group || '', team: step.team || '', leadsTo: '', inputs: '', outputs: '', confidence: 'heard', summary: `More detail for step "${step.name}" in ${proc.name}.`, steps: [] };
    e.processes.push(sp); step.subProcessId = sp.id; touch(sp); touch(proc); save(); actions.pvFocus({ dataset: { id: sp.id } }); },
  pvSet: (el) => { ui.pv = Object.assign({}, ui.pv, { [el.dataset.k]: el.dataset.id }, el.dataset.k === 'mode' ? { focus: '', pick: '', hl: '', journey: false } : {}); ui.stepId = ''; ui.flowZoom = 0; ui.flowColsAuto = 0; ui.flowWhole = false; ui.reviewSetup = ''; saveUI(); render(); },
  pvTick: (el) => {
    const P = pvState(stateFor(E(), ui.scenario)); const k = el.dataset.kind, id = el.dataset.id; const V = Object.assign({}, ui.pv);
    const toggle = (list, all) => { let l = list.filter((x) => x !== id); if (el.checked) l.push(id); if (!l.length) { toast('Keep at least one ticked'); return null; } return all.filter((x) => l.includes(x)); };
    if (k === 'dept1') { V.dept = id; V.dprocs = []; }
    if (k === 'dproc') { const l = toggle(P.procIds, P.deptProcs); if (!l) return render(); V.dprocs = l; }
    if (k === 'proc') { const l = toggle(P.procIds, P.procs.map((p) => p.id)); if (!l) return render(); V.procs = l; V.depts = []; }
    if (k === 'dept') { const l = toggle(P.shownDepts, P.availDepts); if (!l) return render(); V.depts = l; }
    ui.pv = V; ui.stepId = ''; ui.flowZoom = 0; ui.flowColsAuto = 0; ui.flowWhole = false; ui.reviewSetup = ''; saveUI(); render();
  },
  pvLink: (el) => {
    const proc = E().processes.find((x) => x.id === ui.processId); if (!proc) return;
    const l = splitList(proc.leadsTo).filter((x) => x !== el.dataset.id); if (el.checked) l.push(el.dataset.id); proc.leadsTo = l.join(','); touch(proc); save(); render();
  },
  procNew: () => {
    const n = prompt('Name of the new process (e.g. "Monthly client reporting")'); if (!n || !n.trim()) return;
    const P = pvState(stateFor(E(), ui.scenario)); const team = P.mode === 'dept' ? P.dept : '';
    const p = { id: uid('pr'), name: n.trim(), group: '', leadsTo: '', inputs: '', outputs: '', confidence: 'heard', steps: [{ id: uid('s'), name: 'First step', team, actorLabel: '', toolId: '', automated: false, durationMins: '', elapsedDays: '', painPoint: '', flags: [] }] };
    E().processes.push(p); touch(p); save();
    ui.pv = Object.assign({}, ui.pv, { mode: 'proc', procs: [p.id], focus: p.id, hl: '', journey: false, depts: [] }); ui.stepId = p.steps[0].id; ui.editStep = p.steps[0].id; saveUI(); render(); toast('Process created. Rename the first step and add the rest with + Step after.');
  },
  procDelete: () => {
    const e = E(); const i = e.processes.findIndex((x) => x.id === ui.processId); if (i < 0 || !confirm(`Delete the process "${e.processes[i].name}" and all its steps?`)) return;
    const id = e.processes[i].id; e.processes.splice(i, 1); e.meta.deleted = Object.assign({}, e.meta.deleted, { ['processes:' + id]: nowISO() });
    e.processes.forEach((p) => { if (splitList(p.leadsTo).includes(id)) { p.leadsTo = splitList(p.leadsTo).filter((x) => x !== id).join(','); touch(p); } });
    ui.pv = Object.assign({}, ui.pv, { procs: [], dprocs: [] }); ui.stepId = ''; save(); saveUI(); render();
  },
  pvExport: (el) => {
    const e = E(); const st = stateFor(e, ui.scenario); const P = pvState(st); const internal = ui.flowAudience === 'internal'; const k = el.dataset.id; const exec = ui.execView !== false;
    const slug = (s2) => String(s2).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const base = `${slug(e.client.name)}-${P.mode === 'dept' ? slug(teamInfo(P.dept)[1]) : 'processes'}-${P.layout === 'lanes' ? 'swimlane' : 'flow'}${internal ? '-INTERNAL' : ''}-${todayISO()}`;
    const seqChains = pvSeq(st, P);
    if (k === 'all') {
      const procs = seqChains.flatMap((c) => c.chain); const html2 = flowExportDoc(e, procs, st, { internal });
      const w2 = window.open('', '_blank'); if (!w2) { downloadFile(base + '.html', html2, 'text/html'); return toast('Pop-up blocked: downloaded as an HTML page instead'); }
      w2.document.open(); w2.document.write(html2); w2.document.close(); setTimeout(() => { w2.focus(); w2.print(); }, 400); return toast('Choose "Save as PDF" in the print window');
    }
    const cols = ui.flowCols || ui.flowColsAuto || 3;
    const markup = pvVisual(st, P, seqChains, { exec, interactive: false, cols, clientSafe: !internal });
    if (k === 'svg' || k === 'png') {
      const { xml, W, H } = svgStandalone(markup);
      if (k === 'svg') return downloadFile(base + '.svg', xml, 'image/svg+xml');
      const img = new Image(); const scale = 2;
      img.onload = () => { const c = document.createElement('canvas'); c.width = W * scale; c.height = H * scale; const g = c.getContext('2d'); g.scale(scale, scale); g.drawImage(img, 0, 0);
        c.toBlob((b) => { const a2 = document.createElement('a'); a2.href = URL.createObjectURL(b); a2.download = base + '.png'; document.body.appendChild(a2); a2.click(); setTimeout(() => { URL.revokeObjectURL(a2.href); a2.remove(); }, 500); }, 'image/png'); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml); return;
    }
    const flags = []; seqChains.forEach((c) => c.chain.forEach((p) => flowFlags(p, st.people, st.tools, st.departments, !internal).forEach((f) => flags.push(f))));
    const html = pvExportDoc(e, st, P, internal ? markup : markup.replace(/ data-tip="[^"]*"/g, ''), flags, internal);
    if (k === 'html') return downloadFile(base + '.html', html, 'text/html');
    const w = window.open('', '_blank'); if (!w) { downloadFile(base + '.html', html, 'text/html'); return toast('Pop-up blocked: downloaded as an HTML page instead'); }
    w.document.open(); w.document.write(html); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 400); toast('Choose "Save as PDF" in the print window');
  },
  stepEdit: () => { ui.editStep = ui.editStep === ui.stepId ? '' : ui.stepId; render(); },
  stepAdd: () => {
    const proc = procOfStep(ui.stepId); if (!proc) return; const i = (proc.steps || []).findIndex((x) => x.id === ui.stepId);
    const n = prompt('Name of the new step'); if (!n || !n.trim()) return;
    const cur = proc.steps[i] || {}; const ns = { id: uid('s'), name: n.trim(), team: cur.team || '', actorLabel: '', toolId: '', automated: false, durationMins: '', elapsedDays: '', painPoint: '', flags: [] };
    proc.steps.splice(i + 1, 0, ns); ui.stepId = ns.id; ui.editStep = ns.id; touch(proc); save(); render();
  },
  stepDelete: () => {
    const proc = procOfStep(ui.stepId); if (!proc) return; const i = (proc.steps || []).findIndex((x) => x.id === ui.stepId);
    if (i < 0 || !confirm(`Delete step ${i + 1}: "${proc.steps[i].name}"?`)) return;
    proc.steps.splice(i, 1); ui.stepId = ''; ui.editStep = ''; touch(proc); save(); render();
  },
  stepMove: (el) => {
    const proc = procOfStep(ui.stepId); if (!proc) return; const i = proc.steps.findIndex((x) => x.id === ui.stepId); const j = i + num(el.dataset.id);
    if (i < 0 || j < 0 || j >= proc.steps.length) return; const [x] = proc.steps.splice(i, 1); proc.steps.splice(j, 0, x); touch(proc); save(); render();
  },
  reviewSetup: () => { ui.reviewSetup = ui.processId; render(); },
  reviewCancel: () => { ui.reviewSetup = ''; render(); },
  reviewStart: () => {
    const e = E(); const proc = e.processes.find((x) => x.id === ui.processId); if (!proc) return;
    const pid = document.getElementById('rvPerson').value; const person = e.people.find((x) => x.id === pid);
    const label = (document.getElementById('rvLabel').value || (person ? (person.title || person.name) : '')).trim();
    if (!label) return toast('Choose a person or type their role');
    const r = { id: uid('rv'), personId: person ? person.id : '', label, date: todayISO(), verdicts: {}, notes: {}, answers: [], added: [] };
    proc.reviews = [...(proc.reviews || []), r]; touch(proc); save();
    ui.reviewSetup = ''; ui.scenario = 'current'; ui.review = { procId: proc.id, revId: r.id, idx: 0, mine: false }; render(); window.scrollTo(0, 0);
  },
  reviewVerdict: (el) => {
    const { proc, step, rev } = reviewCtx(); if (!step) return;
    rev.verdicts[step.id] = el.dataset.id; step.review = { status: el.dataset.id, by: rev.label, date: rev.date };
    touch(proc); save(); render();
  },
  reviewNav: (el) => { const { proc } = reviewCtx(); if (!proc) return; ui.review.idx = Math.max(0, Math.min((proc.steps || []).length - 1, ui.review.idx + num(el.dataset.id))); render(); const n = document.querySelector('.flow-svg g.fnode.sel'); if (n) n.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
  reviewMine: () => { ui.review.mine = !ui.review.mine; render(); },
  reviewConcern: () => {
    const { proc, step, rev } = reviewCtx(); if (!step) return;
    const t = prompt('What concern did they raise about this step?'); if (!t || !t.trim()) return;
    step.flags = [...(step.flags || []), { type: 'issue', text: t.trim(), by: rev.label, date: rev.date }]; touch(proc); save(); render();
  },
  reviewAddStep: () => {
    const { proc, step, rev } = reviewCtx(); if (!step) return;
    const n = prompt('What is the missing step?'); if (!n || !n.trim()) return;
    const ns = { id: uid('s'), name: n.trim(), team: step.team || '', actorLabel: '', toolId: '', automated: false, durationMins: '', elapsedDays: '', painPoint: '', flags: [], review: { status: 'corrected', by: rev.label, date: rev.date } };
    proc.steps.splice(ui.review.idx + 1, 0, ns); rev.added.push(ns.id); rev.verdicts[ns.id] = 'corrected'; ui.review.idx++;
    touch(proc); save(); render(); toast('Step added. Fill in who, system and time.');
  },
  reviewAnswer: (el) => {
    const { proc, step, rev } = reviewCtx(); if (!step) return; const f = (step.flags || [])[+el.dataset.id]; if (!f) return;
    const a = prompt(`Answer: ${f.text}`); if (a == null) return;
    rev.answers.push({ stepId: step.id, q: f.text, a: a.trim(), date: rev.date }); step.flags.splice(+el.dataset.id, 1);
    if (a.trim()) rev.notes[step.id] = [rev.notes[step.id], `${f.text} → ${a.trim()}`].filter(Boolean).join('\n');
    touch(proc); save(); render();
  },
  reviewFinish: () => {
    const { proc, rev } = reviewCtx(); ui.review = null; render();
    if (rev) { const n = Object.keys(rev.verdicts).length; toast(`Sense-check saved: ${n} step${n === 1 ? '' : 's'} checked with ${rev.label}`); }
  },
  exportFlow: (el) => {
    const e = E(); const st = stateFor(e, ui.scenario); const p = st.processes.find((x) => x.id === ui.processId); if (!p) return;
    const internal = ui.flowAudience === 'internal'; const k = el.dataset.id;
    const slug = (s2) => String(s2).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const base = `${slug(e.client.name)}-${slug(p.name)}${internal ? '-INTERNAL' : ''}-${todayISO()}`;
    if (k === 'svg' || k === 'png') {
      const { xml, W, H } = flowStandaloneSVG(p, st, !internal);
      if (k === 'svg') return downloadFile(base + '.svg', xml, 'image/svg+xml');
      const img = new Image(); const scale = 2;
      img.onload = () => { const c = document.createElement('canvas'); c.width = W * scale; c.height = H * scale; const g = c.getContext('2d'); g.scale(scale, scale); g.drawImage(img, 0, 0);
        c.toBlob((b) => { const a2 = document.createElement('a'); a2.href = URL.createObjectURL(b); a2.download = base + '.png'; document.body.appendChild(a2); a2.click(); setTimeout(() => { URL.revokeObjectURL(a2.href); a2.remove(); }, 500); }, 'image/png'); };
      img.onerror = () => toast('Could not draw the image. Try SVG instead.');
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml); return;
    }
    if (k === 'sheet') {
      const html2 = senseCheckSheet(e, [p], stateFor(e, 'current'));
      const w2 = window.open('', '_blank'); if (!w2) { downloadFile(`${slug(e.client.name)}-${slug(p.name)}-sense-check-${todayISO()}.html`, html2, 'text/html'); return toast('Pop-up blocked: downloaded as an HTML page instead'); }
      w2.document.open(); w2.document.write(html2); w2.document.close(); setTimeout(() => { w2.focus(); w2.print(); }, 400); return toast('Choose "Save as PDF" in the print window');
    }
    const all = k === 'all'; const procs = all ? st.processes.filter((x) => !x._removed) : [p];
    const html = flowExportDoc(e, procs, st, { internal });
    if (k === 'html') return downloadFile((all ? `${slug(e.client.name)}-process-flows${internal ? '-INTERNAL' : ''}-${todayISO()}` : base) + '.html', html, 'text/html');
    const w = window.open('', '_blank'); if (!w) return toast('Allow pop-ups for this file to print, or use HTML page.');
    w.document.open(); w.document.write(html); w.document.close(); setTimeout(() => { w.focus(); w.print(); }, 400);
    toast('Choose "Save as PDF" in the print window');
  },
  flowCols: (el) => { ui.flowCols = +el.dataset.id; ui.flowZoom = 0; ui.flowWhole = false; render(); },
  flowZoom: (el) => {
    const svg = document.querySelector('.flow-svg'); const wrap = document.querySelector('.flow-wrap'); if (!svg || !wrap) return;
    const W = +svg.dataset.w, H = +svg.dataset.h; const cur = ui.flowZoom || svg.getBoundingClientRect().width / W; const k = el.dataset.id;
    if (k === 'fit') {
      const availW = wrap.clientWidth - 26, availH = window.innerHeight - 170;
      if ((ui.pv || {}).layout === 'lanes') { ui.flowZoom = Math.max(0.15, +Math.min(1.2, availW / W, availH / H).toFixed(3)); ui.flowWhole = true; render(); document.querySelector('.flow-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      const ns = [...document.querySelectorAll('.pv-visual .flow-svg')].map((x) => x.querySelectorAll('g.fnode').length).filter(Boolean); if (!ns.length) return;
      const fitFor = (c) => { const w = Math.max(...ns.map((n) => flowDims(n, c)[0])); const h = sum(ns.map((n) => flowDims(n, c)[1])) + (ns.length - 1) * 40; return Math.min(availW / w, availH / h); };
      if (!ui.flowCols) { let best = 1; for (let c = 1; c <= Math.min(6, Math.max(...ns)); c++) if (fitFor(c) > fitFor(best) + 0.001) best = c; ui.flowColsAuto = best; }
      ui.flowZoom = Math.max(0.15, +Math.min(1.2, fitFor(ui.flowCols || ui.flowColsAuto)).toFixed(3)); ui.flowWhole = true; render();
      document.querySelector('.flow-wrap').scrollIntoView({ behavior: 'smooth', block: 'start' }); return;
    }
    ui.flowWhole = false;
    ui.flowZoom = k === '100' ? 1 : Math.max(0.2, Math.min(2.5, +(cur * (k === 'in' ? 1.25 : 0.8)).toFixed(3)));
    render();
  },
  addFlowFlag: (el) => {
    const proc = procOfStep(ui.stepId); const st = proc && (proc.steps || []).find((x) => x.id === ui.stepId);
    if (!st) return toast('This step only exists in the scenario. Flag it in the current state.');
    const label = { issue: 'Describe the issue', unverified: 'What needs to be confirmed?', weakness: 'Describe the weakness' }[el.dataset.id];
    const text = prompt(label); if (!text || !text.trim()) return;
    st.flags = [...(st.flags || []), { type: el.dataset.id, text: text.trim(), by: E().meta.consultant && E().meta.consultant !== 'The Growth Machine' ? E().meta.consultant : 'TGM', date: todayISO() }];
    touch(proc); save(); render(); toast('Flag added to the flow');
  },
  issueState: (el) => {
    const id = el.dataset.step; const proc = procOfStep(id); const step = proc && (proc.steps || []).find((x) => x.id === id); if (!step) return;
    const v = el.dataset.id; const src = el.dataset.src;
    let state = null;
    if (v !== 'open') {
      const note = prompt(v === 'resolved' ? 'Resolved: what fixed it, or why it is not a problem? (optional)' : 'On hold: why, and until when? (optional)', '');
      if (note === null) return;
      state = { status: v, note: note.trim(), date: todayISO(), by: 'TGM' };
    }
    if (src === 'pain') step.painState = state;
    else if (src === 'flag') { const f = (step.flags || [])[+el.dataset.k]; if (!f) return; f.state = state; }
    else if (src === 'link') { const fl = flowFlags(proc, E().people, E().tools, E().departments).find((x) => x.stepId === id && x.on === 'link'); step.linkState = state && Object.assign(state, { text: fl ? fl.text : (step.linkState || {}).text || '' }); }
    touch(proc); save(); render(); toast(v === 'open' ? 'Reopened' : v === 'resolved' ? 'Resolved: it no longer counts' : 'On hold: it no longer counts until reopened');
  },
  issueDelete: (el) => {
    const id = el.dataset.step; const proc = procOfStep(id); const step = proc && (proc.steps || []).find((x) => x.id === id); if (!step || !step.flags || !confirm('Delete this flag? (Use Resolve if it was real but is now fixed.)')) return;
    step.flags.splice(+el.dataset.k, 1); touch(proc); save(); render();
  },
  removeFlowFlag: (el) => {
    const proc = procOfStep(ui.stepId); const st = proc && (proc.steps || []).find((x) => x.id === ui.stepId);
    if (!st || !st.flags) return; st.flags.splice(+el.dataset.id, 1); touch(proc); save(); render();
  },
  area: (el) => { ui.area = el.dataset.id; render(); },
  recType: (el) => { ui.recType = el.dataset.id; render(); },
  coll: (el) => { ui.coll = el.dataset.id; saveUI(); render(); },
  zoom: (el) => { ui.zoom = Math.max(0.4, Math.min(1.6, +(ui.zoom + num(el.dataset.id) * 0.15).toFixed(2))); render(); },
  theme: () => { const dark = matchMedia('(prefers-color-scheme: dark)').matches; const curDark = ui.theme ? ui.theme === 'dark' : dark; ui.theme = curDark ? 'light' : 'dark'; saveUI(); render(); },
  newEng: () => { const n = prompt('Client name?'); if (!n) return; const e = blankEngagement(n); db.engagements[e.id] = e; db.activeId = e.id; ui.scenario = 'current'; ui.tab = 'business'; save(); render(); },
  duplicateEng: () => { const e = clone(E()); e.id = uid('eng'); e.client.name += ' (copy)'; db.engagements[e.id] = e; db.activeId = e.id; save(); render(); },
  deleteEng: () => {
    if (!confirm(`Delete "${E().client.name}" from this browser? Export it first if you want to keep it.`)) return;
    delete db.engagements[db.activeId];
    if (!Object.keys(db.engagements).length) { const e = blankEngagement('New client'); db.engagements[e.id] = e; }
    db.activeId = Object.keys(db.engagements)[0]; ui.scenario = 'current'; save(); render();
  },
  exportJSON: () => { const e = E(); e.meta.lastExported = new Date().toISOString(); save(); downloadFile(`${slugify(e.client.name)}-${todayISO()}.tgm.json`, JSON.stringify(stripMarks(e), null, 2)); render(); },
  exportAll: () => downloadFile(`tgm-all-clients-${todayISO()}.json`, JSON.stringify({ schema: 'tgm.studio/1', engagements: Object.values(db.engagements).map(stripMarks) }, null, 2)),
  mergePaste: () => {
    const raw = document.getElementById('pasteBox').value.trim(); if (!raw) return toast('Nothing to merge');
    let obj; try { obj = JSON.parse(raw.replace(/^```(json)?|```$/gm, '')); } catch (err) { return toast('That is not valid JSON: ' + err.message); }
    doMerge(obj, 'Pasted text');
  },
  copyPrompt: () => copyText(CLAUDE_PROMPT, 'Claude prompt copied. Paste it into Claude, then add your notes underneath.'),
  copyContext: () => copyText(JSON.stringify(stripMarks(E())), 'Client JSON copied. Paste it into Claude for analysis.'),
  addRow: (el) => {
    const c = el.dataset.coll; const row = { id: uid(c.replace(/^engagement\./, '').slice(0, 2)) };
    if (c === 'processes') row.steps = []; if (c === 'recommendations') { row.ops = []; row.status = 'Identified'; } if (c === 'scenarios') row.recommendationIds = [];
    if (c === 'engagement.requests') Object.assign(row, { item: '', owner: E().engagement.contact || '', requestedDate: todayISO(), dueDate: addDaysISO(todayISO(), 5) });
    getPath(E(), c).push(row); save(); render();
  },
  delRow: (el) => { if (!confirm('Delete this row?')) return; const c = el.dataset.coll; const arr = getPath(E(), c); const i = arr.findIndex((x) => x.id === el.dataset.id); if (i >= 0) { arr.splice(i, 1); E().meta.deleted = Object.assign({}, E().meta.deleted, { [c + ':' + el.dataset.id]: nowISO() }); } save(); render(); },
  seedPlan: () => { const g = E().engagement; if (!g.start) return toast('Add a start date first'); seedStandardPlan(E()); save(); render(); toast('Plan, requests and first activities created'); },
  addDelay: () => { const g = E().engagement; const st = engagementStatus(E()); g.delays.push({ id: uid('dl'), dateRaised: todayISO(), phaseId: st.current ? st.current.id : '', cause: '', description: '', daysImpact: 0, noticeDate: '', status: 'Open', resolution: '' }); save(); render(); },
  delayFromRequest: (el) => {
    const g = E().engagement; const r = g.requests.find((x) => x.id === el.dataset.id); const st = engagementStatus(E());
    g.delays.push({ id: uid('dl'), dateRaised: todayISO(), phaseId: st.current ? st.current.id : 'ph1', cause: 'Client: information late', description: `Outstanding since ${fmtD(r.dueDate)}: ${r.item}`, daysImpact: 0, noticeDate: '', status: 'Open', resolution: '' });
    save(); render(); toast('Delay logged. Set the days impact and the date notice was sent.'); document.getElementById('delays')?.scrollIntoView({ behavior: 'smooth' });
  },
  addActivity: () => { const st = engagementStatus(E()); E().engagement.activities.push({ id: uid('ac'), phaseId: st.current ? st.current.id : '', title: '', due: todayISO(), status: 'Next', doneDate: '' }); save(); render(); },
  addDay: (el) => {
    const g = E().engagement; const d = (el && el.dataset.id) || todayISO();
    if (g.timeLog.some((t) => t.date === d)) return toast('That day already has an entry. Edit it in the diary.');
    g.timeLog.push({ id: 'day_' + d, date: d, dayType: 'Full', days: 1, items: '', phaseId: phaseForDate(g, d) }); save(); render();
  },
  exportDiary: () => {
    const e = E(); const rows = [['Date', 'Day', 'Phase', 'What happened', 'Recorded automatically']].concat(e.engagement.timeLog.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((t) => [t.date, t.dayType, (e.engagement.phases.find((p) => p.id === phaseForDate(e.engagement, t.date)) || {}).name || '', String(t.items || '').split('\n').filter(Boolean).join('; '), dayEvents(e, t.date).join('; ')]));
    downloadFile(`${slugify(e.client.name)}-work-diary-${todayISO()}.csv`, rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
  },
  suggestDelivered: () => { const S = E().engagement.status; const sug = suggestDelivered(E()); S.delivered = S.delivered ? S.delivered + '\n' + sug : sug; save(); render(); toast('Suggested from this period. Edit them into outputs.'); },
  suggestNext: () => { const S = E().engagement.status; S.next = suggestNext(E()); save(); render(); },
  statusReport: () => { ui.tab = 'report'; ui.reportType = 'status'; saveUI(); render(); },
  reportType: (el) => { ui.reportType = el.dataset.id; render(); },
  startCapture: (el) => {
    const e = E(); const pid = el.dataset.id || '';
    const existing = loadDraft();
    if (existing && existing.engId === e.id && !pid && !existing.saved && confirm('Resume your unsaved interview draft?')) { ui.draft = existing; }
    else { const p = e.people.find((x) => x.id === pid); ui.draft = { engId: e.id, personId: pid, level: guessLevel(e, p), deptType: '', date: todayISO(), interviewer: e.meta.consultant === 'The Growth Machine' ? '' : e.meta.consultant, answers: {}, outliers: [{ text: '', crit: '' }], summary: '', themes: '', painPoints: '', ideas: '', quotes: '' }; }
    ui.capture = true; ui.tab = 'discovery'; saveDraft(ui.draft); render(); window.scrollTo(0, 0);
  },
  editInterview: (el) => {
    const iv = E().interviews.find((x) => x.id === el.dataset.id); if (!iv) return;
    ui.draft = Object.assign({ engId: E().id, editingId: iv.id, level: iv.level || 'staff', deptType: iv.deptType || '', outliers: [] }, clone(iv));
    if (!ui.draft.outliers.length) ui.draft.outliers.push({ text: '', crit: '' });
    ui.capture = true; ui.tab = 'discovery'; render(); window.scrollTo(0, 0);
  },
  cancelCapture: () => { ui.capture = false; render(); },
  addCompetitor: () => { E().competitors.push({ id: uid('co'), name: 'New competitor', type: 'Direct', lastReviewed: todayISO() }); ui.tab = 'data'; ui.coll = 'competitors'; save(); render(); toast('Fill in the new row (scroll right for all fields)'); },
  editCompetitor: () => { ui.tab = 'data'; ui.coll = 'competitors'; render(); },
  addIntel: (el) => { E().intel.push({ id: uid('it'), competitorId: el.dataset.id || '', topic: '', note: '', sourceType: 'Online research', source: '', date: todayISO() }); ui.tab = 'data'; ui.coll = 'intel'; save(); render(); },
  addUsp: () => { E().usps.push({ id: uid('us'), claim: '', strength: 'Claimed only', proof: '' }); save(); render(); },
  addOpportunity: () => { E().opportunities.push({ id: uid('op'), title: '', area: 'Positioning', status: 'Idea', impact: 'Medium', effort: 'Medium' }); save(); render(); },
  oppToRec: (el) => {
    const e = E(); const o = e.opportunities.find((x) => x.id === el.dataset.id); if (!o) return;
    const w = { High: 2, Medium: 3, Low: 4 };
    const r = { id: uid('r'), title: o.title || 'Untitled opportunity', type: 'Commercial', horizon: '0-3 months', description: [o.description, o.basedOn ? 'Based on: ' + o.basedOn : ''].filter(Boolean).join(' '), effort: { High: 4, Medium: 3, Low: 2 }[o.effort] || 3, risk: 2, confidence: w[o.impact] ? 5 - w[o.impact] + 1 : 3, status: 'Identified', ops: [] };
    e.recommendations.push(r); o.status = 'Recommendation'; o.recommendationId = r.id; save(); render(); toast('Added to Recommendations. Add the revenue uplift or saving there so it can be ranked.');
  },
  setIntelFilter: (el) => { ui.intelComp = el.dataset.id; render(); },
  addCapability: () => { const n = prompt('Capability or feature clients choose on (e.g. "Review management")'); if (!n) return; E().capabilities.push({ id: uid('cap'), name: n, importance: 'Medium', client: '', scores: {} }); save(); render(); },
  startIntake: () => { ui.session = true; ui.sessionId = ''; ui.capture = false; ui.tab = 'discovery'; render(); window.scrollTo(0, 0); },
  resumeIntake: (el) => { ui.session = true; ui.sessionId = el.dataset.id; ui.capture = false; ui.tab = 'discovery'; render(); window.scrollTo(0, 0); },
  switchIntake: () => { ui.sessionId = ''; render(); window.scrollTo(0, 0); },
  endIntake: () => { ui.session = false; ui.sessionId = ''; save(); render(); toast('Saved. Unanswered questions are listed under Discovery as still needed.'); },
  newIntake: () => {
    const e = E(); const pid = document.getElementById('sessPerson').value; const p = e.people.find((x) => x.id === pid);
    const name = (document.getElementById('sessName').value || (p ? p.name : '')).trim(); const role = (document.getElementById('sessRole').value || (p ? p.title : '') || '').trim();
    if (!name) return toast('Choose a person or type a name');
    let r = e.intake.find((x) => String(x.respondent).toLowerCase() === name.toLowerCase());
    if (!r) { r = { id: 'in_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 40), respondent: name, role, personId: p ? p.id : '', date: todayISO(), source: 'Live session', answers: { i_name: name, i_role: role } }; e.intake.push(r); }
    ui.sessionId = r.id; save(); render(); window.scrollTo(0, 0);
  },
  copyOutstanding: () => {
    const io = intakeOutstanding(E()); let sec = ''; const lines = [];
    io.open.forEach((q) => { if (q.section !== sec) { sec = q.section; lines.push('', sec); } lines.push('- ' + q.q); });
    copyText(`A few questions we didn't get to. Short answers are perfect:\n${lines.join('\n')}`, 'Outstanding questions copied, ready to paste into an email');
  },
  addOutlier: () => { ui.draft.outliers.push({ text: '', crit: '' }); saveDraft(ui.draft); render(); },
  saveCapture: () => {
    const e = E(); const d = ui.draft; const p = e.people.find((x) => x.id === d.personId);
    if (!p && !d.personLabel) return toast('Choose a person or enter a name');
    const iv = { id: d.editingId || uid('iv'), personId: d.personId || '', personLabel: p ? '' : d.personLabel, level: d.level, deptType: d.deptType || deptType(e.departments.find((x) => x.id === (p || {}).departmentId)),
      date: d.date, role: p ? (p.title || '') : (d.role || ''), interviewer: d.interviewer || '', summary: d.summary, themes: d.themes, painPoints: d.painPoints, ideas: d.ideas, quotes: d.quotes,
      answers: Object.fromEntries(Object.entries(d.answers).filter(([, v]) => String(v).trim())), outliers: d.outliers.filter((o) => String(o.text || '').trim()) };
    iv.updatedAt = nowISO();
    const i = e.interviews.findIndex((x) => x.id === iv.id); if (i >= 0) e.interviews[i] = iv; else e.interviews.push(iv);
    d.saved = true; saveDraft(d); ui.capture = false; save(); render(); toast('Interview saved');
  },
  editJSON: (el) => {
    const { coll, id, field } = el.dataset; const row = getPath(E(), coll).find((x) => x.id === id);
    openModal(`${COLL_LABELS[coll]} → ${row.name || row.title || id} → ${field}`, JSON.stringify(row[field] || [], null, 2), (txt) => {
      let v; try { v = JSON.parse(txt); } catch (err) { toast('Invalid JSON: ' + err.message); return false; }
      row[field] = v; touch(row); Object.assign(E(), normalise(E())); save(); render(); return true;
    });
  },
  addRec: () => { const r = { id: uid('r'), title: 'New recommendation', type: 'Process', horizon: '0-3 months', effort: 3, risk: 3, confidence: 3, status: 'Proposed', ops: [] }; E().recommendations.push(r); ui.tab = 'data'; ui.coll = 'recommendations'; save(); render(); },
  addScenario: () => { const n = prompt('Scenario name?', `Scenario ${String.fromCharCode(65 + E().scenarios.length)}`); if (!n) return; E().scenarios.push({ id: uid('sc'), name: n, description: '', recommendationIds: [] }); save(); render(); },
  delScenario: (el) => { if (!confirm('Delete this scenario?')) return; E().scenarios = E().scenarios.filter((s) => s.id !== el.dataset.id); if (ui.scenario === el.dataset.id) ui.scenario = 'current'; save(); render(); },
  toggleRecInScenario: (el) => {
    const s = E().scenarios.find((x) => x.id === el.dataset.scenario); const ids = new Set(splitList(s.recommendationIds));
    el.checked ? ids.add(el.dataset.rec) : ids.delete(el.dataset.rec); s.recommendationIds = [...ids]; touch(s); save(); render();
  },
  toggleReportProc: (el) => { const r = E().report; const ids = new Set(r.processIds || []); el.checked ? ids.add(el.dataset.id) : ids.delete(el.dataset.id); r.processIds = [...ids]; save(); render(); },
  printReport: () => { if (!(ui.tab === 'progress' && subOf('progress') === 'report')) { ui.tab = 'report'; render(); } setTimeout(() => window.print(), 50); },
  downloadReport: () => downloadReportHTML(E(), ui.reportType)
};

/* ---------- modal ---------- */
function openModal(title, text, onSave) {
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="modal-card"><h3>${esc(title)}</h3><textarea id="modalText" rows="20" spellcheck="false">${esc(text)}</textarea><div class="btn-row"><button class="btn" id="modalSave">Save</button><button class="btn ghost" id="modalCancel">Cancel</button></div></div>`;
  m.hidden = false;
  document.getElementById('modalCancel').onclick = () => { m.hidden = true; };
  document.getElementById('modalSave').onclick = () => { if (onSave(document.getElementById('modalText').value) !== false) m.hidden = true; };
}

/* ---------- events ---------- */
document.addEventListener('wheel', (ev) => {
  const wrap = ev.target.closest && ev.target.closest('.flow-wrap'); if (!wrap || !ev.ctrlKey) return;
  ev.preventDefault(); const svg = wrap.querySelector('.flow-svg'); if (!svg) return;
  const cur = ui.flowZoom || svg.getBoundingClientRect().width / +svg.dataset.w;
  ui.flowZoom = Math.max(0.2, Math.min(2.5, +(cur * (ev.deltaY < 0 ? 1.08 : 0.926)).toFixed(3))); ui.flowWhole = false;
  const sl = wrap.scrollLeft, st = wrap.scrollTop; render(); const w2 = document.querySelector('.flow-wrap'); if (w2) { w2.scrollLeft = sl; w2.scrollTop = st; }
}, { passive: false });
let panning = null;
document.addEventListener('mousedown', (ev) => {
  const wrap = ev.target.closest && ev.target.closest('.flow-wrap.zoomed'); if (!wrap || ev.target.closest('.clk') || ev.button) return;
  panning = { wrap, x: ev.clientX, y: ev.clientY, l: wrap.scrollLeft, t: wrap.scrollTop }; wrap.classList.add('panning'); ev.preventDefault();
});
document.addEventListener('mousemove', (ev) => { if (!panning) return; panning.wrap.scrollLeft = panning.l - (ev.clientX - panning.x); panning.wrap.scrollTop = panning.t - (ev.clientY - panning.y); });
document.addEventListener('mouseup', () => { if (panning) { panning.wrap.classList.remove('panning'); panning = null; } });
document.addEventListener('toggle', (ev) => { if (ev.target.id === 'mergeHist') { ui.mergeOpen = ev.target.open; const sm = ev.target.querySelector('summary b'); if (sm) sm.textContent = ev.target.open ? 'Hide history' : 'Show history'; } }, true);
document.addEventListener('click', (ev) => {
  const a = ev.target.closest('[data-action]'); if (!a) return;
  if (a.type === 'checkbox') return; // handled on change
  const fn = actions[a.dataset.action]; if (fn) { ev.preventDefault(); fn(a, ev); }
});
document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.id === 'engSel') { db.activeId = t.value; ui.scenario = 'current'; ui.processId = ''; save(); render(); return; }
  if (t.id === 'scSel') { ui.scenario = t.value; render(); return; }
  if (t.id === 'importFile' && t.files[0]) {
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const obj = JSON.parse(fr.result);
        const list = obj.engagements ? obj.engagements : [obj];
        list.forEach((x) => { const e = normalise(x); if (!e.meta.tsMigrated) stampAll(e, LEGACY_CUTOFF); db.engagements[e.id] = e; db.activeId = e.id; });
        ui.scenario = 'current'; save(); render(); toast(`Imported ${list.length} client${list.length > 1 ? 's' : ''}`);
      } catch (err) { toast('Could not read file: ' + err.message); }
    };
    fr.readAsText(t.files[0]); return;
  }
  if (t.id === 'mergeFile' && t.files[0]) {
    const fr = new FileReader(); const fname = t.files[0].name;
    fr.onload = () => {
      let obj; try { obj = JSON.parse(fr.result); } catch (err) { return toast('That file is not valid JSON: ' + err.message); }
      doMerge(obj, fname);
    };
    fr.readAsText(t.files[0]); t.value = ''; return;
  }
  if (t.id === 'staffFile' && t.files[0]) {
    const fr = new FileReader();
    fr.onload = () => { const res = importFormCSV(E(), fr.result, 'staff'); save(); render(); toast(`Staff responses: ${res.added} added, ${res.updated} updated${res.unmatched.length ? `, ${res.unmatched.length} columns not matched` : ''}`); };
    fr.readAsText(t.files[0]); return;
  }
  if (t.dataset.capcell) { const cap = E().capabilities.find((x) => x.id === t.dataset.capcell); if (cap) { if (t.dataset.comp === '__client') cap.client = t.value; else { cap.scores = cap.scores || {}; cap.scores[t.dataset.comp] = t.value; } touch(cap); save(); render(); } return; }
  if (t.dataset.intakesel || t.dataset.intakemulti) { intakeWrite(t); return; }
  if (t.dataset.intake) { intakeWrite(t); return; }
  if (t.id === 'intakeFile' && t.files[0]) {
    const fr = new FileReader();
    fr.onload = () => { const res = importIntakeCSV(E(), fr.result); save(); render(); toast(`Founder responses: ${res.added} added, ${res.updated || 0} updated${res.unmatched.length ? `, ${res.unmatched.length} columns not matched` : ''}`); };
    fr.readAsText(t.files[0]); return;
  }
  if (t.dataset.draftsel) { setPath(ui.draft, t.dataset.draftsel, t.value); if (t.dataset.draftsel === 'personId') { const p = E().people.find((x) => x.id === t.value); ui.draft.level = guessLevel(E(), p); ui.draft.deptType = ''; } saveDraft(ui.draft); render(); return; }
  if (t.dataset.draftchk) { ui.draft[t.dataset.draftchk] = t.checked; saveDraft(ui.draft); return; }
  if (t.dataset.action && t.type === 'checkbox') { const fn = actions[t.dataset.action]; if (fn) fn(t, ev); return; }
  if (t.dataset.pe) { const proc = E().processes.find((x) => x.id === ui.processId); if (!proc) return; proc[t.dataset.pe] = t.value; touch(proc); save(); render(); return; }
  if (t.dataset.ed) {
    const proc = procOfStep(ui.editStep); const step = proc && (proc.steps || []).find((x) => x.id === ui.editStep); if (!step) return;
    const f = t.dataset.ed; let v = t.value;
    if (f === 'durationMins' || f === 'elapsedDays') { v = v === '' ? '' : num(v); if (!(step.review && ['confirmed', 'corrected'].includes(step.review.status))) step.timeBasis = 'assumed'; }
    if (f === 'automated') v = v === 'yes';
    if (f === 'painPoint' && v !== step.painPoint) step.painState = null; // a new or changed issue starts open
    step[f] = v; if (f === 'actorLabel') step.actorId = '';
    touch(proc); save(); render(); return;
  }
  if (t.dataset.rv || t.hasAttribute('data-rvnote')) {
    const { proc, step, rev } = reviewCtx(); if (!step) return;
    if (t.hasAttribute('data-rvnote')) { rev.notes[step.id] = t.value; touch(proc); save(); return; }
    const f = t.dataset.rv; let v = t.value;
    if (f === 'durationMins' || f === 'elapsedDays') { v = v === '' ? '' : num(v); step.timeBasis = 'confirmed'; }
    if (f === 'automated') v = v === 'yes';
    step[f] = v; if (f === 'actorLabel') step.actorId = '';
    if (!rev.verdicts[step.id] || rev.verdicts[step.id] === 'confirmed') { rev.verdicts[step.id] = 'corrected'; step.review = { status: 'corrected', by: rev.label, date: rev.date }; }
    touch(proc); save(); render(); return;
  }
  if (t.dataset.ui) { ui[t.dataset.ui] = t.type === 'checkbox' ? t.checked : t.value; saveUI(); render(); return; }
  if (t.dataset.bind) {
    const v = t.type === 'checkbox' ? t.checked : t.value; setPath(E(), t.dataset.bind, v); touch(E()[t.dataset.bind.split('.')[0]]); save();
    if (ui.tab === 'report' || ui.tab === 'progress' || t.dataset.bind === 'meta.currency' || t.dataset.bind === 'client.name') render();
    return;
  }
  if (t.hasAttribute('data-cell')) {
    const { coll, id, field, type } = t.dataset; const arr = getPath(E(), coll) || []; const row = arr.find((x) => x.id === id); if (!row) return;
    let v = t.value; if (type === 'num') v = v === '' ? '' : num(v);
    if (field === 'id') {
      if (!v || arr.some((x) => x.id === v)) { toast('ids must be unique and not empty'); t.value = id; return; }
      t.closest('tr').querySelectorAll('[data-id]').forEach((n) => { n.dataset.id = v; });
    }
    row[field] = v; touch(row);
    if (coll === 'engagement.timeLog' && field === 'dayType') row.days = v === 'Full' ? 1 : 0.5;
    if (coll === 'engagement.timeLog' && field === 'date') row.phaseId = phaseForDate(E().engagement, v);
    if (coll === 'engagement.activities' && field === 'status') row.doneDate = v === 'Done' ? (row.doneDate || todayISO()) : '';
    if (coll === 'engagement.phases' && field === 'status' && v === 'Done') { const ps = E().engagement.phases; const i = ps.indexOf(row); if (ps[i + 1] && ps[i + 1].status === 'Not started') ps[i + 1].status = 'In progress'; }
    save();
    if ((coll === 'recommendations' && ui.tab === 'plan') || ui.tab === 'home' || (ui.tab === 'progress' && (t.tagName === 'SELECT' || t.type === 'date' || t.type === 'number'))) render();
  }
});
document.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.tagName === 'TEXTAREA' && t.dataset.bind) { setPath(E(), t.dataset.bind, t.value); touch(E()[t.dataset.bind.split('.')[0]]); save(); }
  if (t.dataset.intake || t.dataset.intakeother) { intakeWrite(t); return; }
  if (t.dataset.draft && ui.draft) { setPath(ui.draft, t.dataset.draft, t.type === 'number' ? t.value : t.value); saveDraft(ui.draft); }
});

/* ---------- tooltip (hover layer for every chart mark) ---------- */
(function tooltip() {
  const tip = document.getElementById('tip');
  document.addEventListener('mouseover', (ev) => {
    const el = ev.target.closest('[data-tip]'); if (!el) { tip.hidden = true; return; }
    tip.textContent = el.getAttribute('data-tip'); tip.hidden = false;
  });
  document.addEventListener('mousemove', (ev) => {
    if (tip.hidden) return;
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let x = ev.clientX + 14, y = ev.clientY + 14;
    if (x + w > innerWidth - 8) x = ev.clientX - w - 14;
    if (y + h > innerHeight - 8) y = ev.clientY - h - 14;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  });
  document.addEventListener('mouseleave', () => { tip.hidden = true; });
})();

loadDB();
syncLoad();
render();
