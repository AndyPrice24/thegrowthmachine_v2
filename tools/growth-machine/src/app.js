/* ============================================================
   App shell — storage, routing, actions, data editor, Claude bridge
   ============================================================ */
const STORE_KEY = 'tgm.studio.v1';
const ui = { tab: 'overview', scenario: 'current', processId: '', anon: false, ghosts: true, showCost: true, compare: true, zoom: 1, area: 'All', recType: 'All', coll: 'people', theme: '', reportType: 'status', capture: false, draft: null, session: false, sessionId: '', prioOnly: true };
let db = { activeId: '', engagements: {} };

/* ---------- storage (localStorage, wrapped; the JSON file export is the real backup) ---------- */
function loadDB() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) db = JSON.parse(raw); } catch (err) { console.warn('Storage unavailable', err); }
  if (!db.engagements || !Object.keys(db.engagements).length) {
    const lb = locationBankShell(), demo = demoEngagement();
    db = { activeId: demo.id, engagements: { [lb.id]: lb, [demo.id]: demo } };
  }
  Object.keys(db.engagements).forEach((k) => { db.engagements[k] = normalise(db.engagements[k]); });
  if (db.engagements.eng_demo && !db.engagements.eng_demo.engagement.phases.length) db.engagements.eng_demo = demoEngagement(); // refresh old demo with tracking sample
  if (!db.engagements[db.activeId]) db.activeId = Object.keys(db.engagements)[0];
  try { Object.assign(ui, JSON.parse(localStorage.getItem(STORE_KEY + '.ui') || '{}'), { scenario: 'current' }); } catch (err) { /* ignore */ }
}
let saveTimer = null;
function save() {
  E().meta.lastUpdated = new Date().toISOString();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); setStatus('Saved in this browser'); }
    catch (err) { setStatus('⚠ Could not save in this browser. Export JSON to keep your work.'); }
  }, 250);
}
function flushSave() { if (!saveTimer) return; clearTimeout(saveTimer); saveTimer = null; try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (err) { /* ignore */ } }
window.addEventListener('pagehide', flushSave);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushSave(); });
function saveUI() { try { localStorage.setItem(STORE_KEY + '.ui', JSON.stringify({ tab: ui.tab, anon: ui.anon, showCost: ui.showCost, ghosts: ui.ghosts, compare: ui.compare, coll: ui.coll, theme: ui.theme })); } catch (err) { /* ignore */ } }
const E = () => db.engagements[db.activeId];
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
  const e = E();
  const engOpts = Object.values(db.engagements).map((x) => `<option value="${x.id}" ${x.id === db.activeId ? 'selected' : ''}>${esc(x.client.name)}</option>`).join('');
  const scOpts = [['current', 'Current state'], ...e.scenarios.map((s) => [s.id, s.name]), ['all', 'All recommendations']].map(([id, n]) => `<option value="${id}" ${ui.scenario === id ? 'selected' : ''}>${esc(n)}</option>`).join('');
  document.getElementById('topbar').innerHTML = `
    <div class="brand"><span class="cog" aria-hidden="true">✹</span><span>THE <strong>GROWTH</strong> MACHINE</span><em>Studio</em></div>
    <label class="hsel"><span>Client</span><select id="engSel">${engOpts}</select></label>
    <label class="hsel"><span>View as</span><select id="scSel">${scOpts}</select></label>
    ${flagBadge(e)}
    <div class="hbtns"><button class="btn sm" data-action="newEng">+ New client</button><button class="btn sm" data-action="exportJSON">Export JSON</button><button class="btn sm ghost" data-action="theme" title="Toggle light/dark">◐</button></div>`;
  const st = e.engagement.phases.length ? engagementStatus(e) : null;
  const badge = (id) => id === 'progress' && st && (st.openDelays.length || st.overdue.length) ? `<span class="nav-badge" title="Open delays / overdue client items">⚑ ${st.openDelays.length + st.overdue.length}</span>` : '';
  document.getElementById('nav').innerHTML = TABS.map(([id, n]) => `<button class="nav-btn ${ui.tab === id ? 'on' : ''}" data-action="tab" data-id="${id}">${n}${badge(id)}</button>`).join('')
    + `<div class="nav-foot"><div id="status" class="faint small">Saved in this browser</div><div class="faint small">Last export: ${e.meta.lastExported ? new Date(e.meta.lastExported).toLocaleString('en-GB') : 'never'}</div><div class="faint small">Studio version: ${typeof STUDIO_BUILD === 'undefined' ? 'dev' : STUDIO_BUILD}</div></div>`;
}
function render() {
  const e = E();
  renderHeader();
  const views = { progress: viewProgress, discovery: viewDiscovery, overview: viewOverview, business: viewBusiness, finance: viewFinance, org: viewOrg, tools: viewTools, processes: viewProcesses, interviews: viewInterviews, crossover: viewCrossover, recs: viewRecs, scenarios: viewScenarios, report: viewReport, data: viewData };
  let html;
  try { html = (views[ui.tab] || viewOverview)(e); }
  catch (err) { console.error(err); html = `<div class="banner err">Something in this client's data could not be displayed: ${esc(err.message)}. Check the Data tab.</div>`; }
  document.getElementById('main').innerHTML = html;
  document.documentElement.dataset.theme = ui.theme || '';
  if (!ui.theme) delete document.documentElement.dataset.theme;
}

/* ---------- Data & Claude view (lives here because it is tied to the editor) ---------- */
const FIELD_DEFS = {
  departments: [['id', 'text'], ['name', 'text'], ['type', DEPT_TYPES.map((d) => d[0])], ['headId', 'person'], ['notes', 'text']],
  people: [['id', 'text'], ['name', 'text'], ['title', 'text'], ['departmentId', 'dept'], ['managerId', 'person'], ['employmentType', ['Full-time', 'Part-time', 'Contractor', 'Outsourced', 'Vacant']], ['fte', 'num'], ['annualCost', 'num'], ['location', 'text'], ['startDate', 'date'], ['notes', 'text']],
  tools: [['id', 'text'], ['name', 'text'], ['category', 'text'], ['vendor', 'text'], ['monthlyCost', 'num'], ['seats', 'num'], ['activeUsers', 'num'], ['departmentIds', 'text'], ['ownerId', 'person'], ['purpose', 'text'], ['notes', 'text']],
  processes: [['id', 'text'], ['name', 'text'], ['departmentId', 'dept'], ['ownerId', 'person'], ['frequency', 'text'], ['runsPerMonth', 'num'], ['hoursPerMonth', 'num'], ['inputs', 'text'], ['outputs', 'text'], ['steps', 'json']],
  segments: [['id', 'text'], ['name', 'text'], ['customers', 'num'], ['annualRevenue', 'num'], ['churnPct', 'num'], ['acquisitionChannel', 'text'], ['notes', 'text']],
  markets: [['id', 'text'], ['name', 'text'], ['region', 'text'], ['revenueShare', 'num'], ['notes', 'text']],
  topClients: [['id', 'text'], ['name', 'text'], ['segmentId', 'text'], ['annualRevenue', 'num'], ['notes', 'text']],
  financePeriods: [['id', 'text'], ['label', 'text'], ['months', 'num'], ['revenue', 'num'], ['cogs', 'num'], ['payroll', 'num'], ['tools', 'num'], ['marketing', 'num'], ['premises', 'num'], ['other', 'num']],
  interviews: [['id', 'text'], ['personId', 'person'], ['date', 'date'], ['interviewer', 'text'], ['summary', 'long'], ['themes', 'text'], ['painPoints', 'long'], ['ideas', 'long'], ['quotes', 'long']],
  findings: [['id', 'text'], ['title', 'text'], ['area', 'text'], ['severity', ['high', 'medium', 'low']], ['evidence', 'long']],
  recommendations: [['id', 'text'], ['title', 'text'], ['type', ['People', 'Process', 'Tool', 'Build', 'Structure', 'Commercial']], ['horizon', ['0-3 months', '3-6 months', '6-12 months', '12+ months']], ['description', 'long'], ['effort', 'num'], ['risk', 'num'], ['confidence', 'num'], ['oneOffCost', 'num'], ['otherAnnualSaving', 'num'], ['oneOffSaving', 'num'], ['revenueUplift', 'num'], ['status', REC_STAGES], ['ops', 'json']],
  scenarios: [['id', 'text'], ['name', 'text'], ['description', 'text'], ['recommendationIds', 'json']]
};
const COLL_LABELS = { departments: 'Departments', people: 'People', tools: 'Tools', processes: 'Processes', segments: 'Customer segments', markets: 'Markets', topClients: 'Top clients', financePeriods: 'Finance periods', interviews: 'Interviews', findings: 'Findings', recommendations: 'Recommendations', scenarios: 'Scenarios' };

function cellInput(e, coll, row, [f, type]) {
  const v = row[f]; const base = `data-cell data-coll="${coll}" data-id="${esc(row.id)}" data-field="${f}"`;
  if (Array.isArray(type)) return `<select ${base}><option value=""></option>${type.map((o) => `<option ${v === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  if (type === 'person') return `<select ${base}><option value="">—</option>${e.people.map((p) => `<option value="${p.id}" ${v === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select>`;
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
  return `<div class="page-h"><div><span class="eyebrow">Data & Claude</span><h1>Get information in and out</h1><p class="muted">This browser saves your work automatically, but browser storage is not a backup. <strong>Export JSON after every session</strong> and keep the files somewhere private, such as your own Google Drive. Never put them in the website repo.</p></div></div>
  <div class="grid-2">
    ${card('Import / export', `<div class="btn-row">
        <button class="btn" data-action="exportJSON">Export this client (.json)</button>
        <label class="btn">Import client file<input type="file" accept=".json,application/json" id="importFile" hidden></label>
        <button class="btn ghost" data-action="exportAll">Export all clients</button>
      </div>
      <p class="faint small">Importing a file whose id matches an existing client replaces that client. Use "Paste from Claude" to merge partial data.</p>`)}
    ${card('Paste from Claude', `<textarea id="pasteBox" rows="7" placeholder='Paste JSON here, e.g. {"people":[...],"interviews":[...]}'></textarea>
      <div class="btn-row"><button class="btn" data-action="mergePaste">Merge into ${esc(e.client.name)}</button><button class="btn ghost" data-action="copyPrompt">Copy Claude prompt</button><button class="btn ghost" data-action="copyContext">Copy client JSON for Claude</button></div>
      <p class="faint small">Merge adds new records and updates records with the same id. Nothing is deleted.</p>`)}
  </div>
  ${card('Edit data', `<div class="toolbar">${Object.keys(FIELD_DEFS).map((c) => `<button class="btn sm ${coll === c ? 'on' : ''}" data-action="coll" data-id="${c}">${COLL_LABELS[c]} (${e[c].length})</button>`).join('')}</div>
    <div class="scroll-x">${grid}</div>
    <div class="btn-row"><button class="btn" data-action="addRow" data-coll="${coll}">+ Add ${COLL_LABELS[coll].toLowerCase().replace(/s$/, '')}</button></div>
    <p class="faint small">Changes save as you leave each cell. Lists (process steps, recommendation ops, scenario recommendation ids) are edited as JSON. See the README for the format.</p>`)}
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
  "processes": [{ "id","name","departmentId","ownerId","frequency","runsPerMonth":0,"inputs","outputs",
     "steps": [{ "id","name","actorId":"<person id or empty>","actorLabel":"<role if no person>","toolId","durationMins":0,"automated":false,"input","output","painPoint" }] }],
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
  "scenarios": [{ "id","name","description","recommendationIds":["r1","r2"] }]
}
Rules: amounts are annual unless the field says monthly. Use the client's currency. Never invent numbers. Leave a field out if it is unknown, and list what is missing in a separate message after the JSON. Keep theme tags consistent across interviews.

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
  tab: (el) => { ui.tab = el.dataset.id; saveUI(); render(); window.scrollTo(0, 0); },
  setScenario: (el) => { ui.scenario = el.dataset.id; render(); },
  proc: (el) => { ui.processId = el.dataset.id; render(); },
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
  exportJSON: () => { const e = E(); e.meta.lastExported = new Date().toISOString(); save(); downloadFile(`${slugify(e.client.name)}-${new Date().toISOString().slice(0, 10)}.tgm.json`, JSON.stringify(stripMarks(e), null, 2)); render(); },
  exportAll: () => downloadFile(`tgm-all-clients-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ schema: 'tgm.studio/1', engagements: Object.values(db.engagements).map(stripMarks) }, null, 2)),
  mergePaste: () => {
    const raw = document.getElementById('pasteBox').value.trim(); if (!raw) return toast('Nothing to merge');
    let obj; try { obj = JSON.parse(raw.replace(/^```(json)?|```$/gm, '')); } catch (err) { return toast('That is not valid JSON: ' + err.message); }
    const { engagement, counts } = mergeEngagement(E(), obj); engagement.id = db.activeId; db.engagements[db.activeId] = engagement; save(); render();
    toast('Merged: ' + (Object.entries(counts).map(([k, v]) => `${k} +${v.added}/~${v.updated}`).join(', ') || 'profile fields'));
  },
  copyPrompt: () => copyText(CLAUDE_PROMPT, 'Claude prompt copied. Paste it into Claude, then add your notes underneath.'),
  copyContext: () => copyText(JSON.stringify(stripMarks(E())), 'Client JSON copied. Paste it into Claude for analysis.'),
  addRow: (el) => {
    const c = el.dataset.coll; const row = { id: uid(c.replace(/^engagement\./, '').slice(0, 2)) };
    if (c === 'processes') row.steps = []; if (c === 'recommendations') { row.ops = []; row.status = 'Identified'; } if (c === 'scenarios') row.recommendationIds = [];
    if (c === 'engagement.requests') Object.assign(row, { item: '', owner: E().engagement.contact || '', requestedDate: todayISO(), dueDate: addDaysISO(todayISO(), 5) });
    getPath(E(), c).push(row); save(); render();
  },
  delRow: (el) => { if (!confirm('Delete this row?')) return; const c = el.dataset.coll; const arr = getPath(E(), c); const i = arr.findIndex((x) => x.id === el.dataset.id); if (i >= 0) arr.splice(i, 1); save(); render(); },
  seedPlan: () => { const g = E().engagement; if (!g.start) return toast('Add a start date first'); seedStandardPlan(E()); save(); render(); toast('Plan, requests and first activities created'); },
  addDelay: () => { const g = E().engagement; const st = engagementStatus(E()); g.delays.push({ id: uid('dl'), dateRaised: todayISO(), phaseId: st.current ? st.current.id : '', cause: '', description: '', daysImpact: 0, noticeDate: '', status: 'Open', resolution: '' }); save(); render(); },
  delayFromRequest: (el) => {
    const g = E().engagement; const r = g.requests.find((x) => x.id === el.dataset.id); const st = engagementStatus(E());
    g.delays.push({ id: uid('dl'), dateRaised: todayISO(), phaseId: st.current ? st.current.id : 'ph1', cause: 'Client: information late', description: `Outstanding since ${fmtD(r.dueDate)}: ${r.item}`, daysImpact: 0, noticeDate: '', status: 'Open', resolution: '' });
    save(); render(); toast('Delay logged. Set the days impact and the date notice was sent.'); document.getElementById('delays')?.scrollIntoView({ behavior: 'smooth' });
  },
  addActivity: () => { const st = engagementStatus(E()); E().engagement.activities.push({ id: uid('ac'), phaseId: st.current ? st.current.id : '', title: '', due: todayISO(), status: 'Next', doneDate: '' }); save(); render(); },
  addTime: () => { const st = engagementStatus(E()); E().engagement.timeLog.push({ id: uid('tl'), date: todayISO(), phaseId: st.current ? st.current.id : '', days: '0.5', activity: '', notes: '' }); save(); render(); },
  statusReport: () => { ui.tab = 'report'; ui.reportType = 'status'; saveUI(); render(); },
  reportType: (el) => { ui.reportType = el.dataset.id; render(); },
  startCapture: (el) => {
    const e = E(); const pid = el.dataset.id || '';
    const existing = loadDraft();
    if (existing && existing.engId === e.id && !pid && !existing.saved && confirm('Resume your unsaved interview draft?')) { ui.draft = existing; }
    else { const p = e.people.find((x) => x.id === pid); ui.draft = { engId: e.id, personId: pid, level: guessLevel(e, p), deptType: '', date: todayISO(), interviewer: e.meta.consultant === 'The Growth Machine' ? '' : e.meta.consultant, durationMins: '', logTime: true, answers: {}, outliers: [{ text: '', crit: '' }], summary: '', themes: '', painPoints: '', ideas: '', quotes: '' }; }
    ui.capture = true; ui.tab = 'discovery'; saveDraft(ui.draft); render(); window.scrollTo(0, 0);
  },
  editInterview: (el) => {
    const iv = E().interviews.find((x) => x.id === el.dataset.id); if (!iv) return;
    ui.draft = Object.assign({ engId: E().id, editingId: iv.id, level: iv.level || 'staff', deptType: iv.deptType || '', logTime: false, outliers: [] }, clone(iv));
    if (!ui.draft.outliers.length) ui.draft.outliers.push({ text: '', crit: '' });
    ui.capture = true; ui.tab = 'discovery'; render(); window.scrollTo(0, 0);
  },
  cancelCapture: () => { ui.capture = false; render(); },
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
      date: d.date, interviewer: d.interviewer || '', durationMins: d.durationMins, summary: d.summary, themes: d.themes, painPoints: d.painPoints, ideas: d.ideas, quotes: d.quotes,
      answers: Object.fromEntries(Object.entries(d.answers).filter(([, v]) => String(v).trim())), outliers: d.outliers.filter((o) => String(o.text || '').trim()) };
    const i = e.interviews.findIndex((x) => x.id === iv.id); if (i >= 0) e.interviews[i] = iv; else e.interviews.push(iv);
    if (d.logTime && num(d.durationMins) > 0 && e.engagement.phases.length) {
      const ph = e.engagement.phases.find((x) => /listen|interview/i.test(x.name)) || e.engagement.phases[0];
      e.engagement.timeLog.push({ id: uid('tl'), date: d.date, phaseId: ph.id, days: String(Math.max(0.25, Math.round(num(d.durationMins) / 480 * 4) / 4)), activity: `Interview: ${p ? p.name : d.personLabel}`, notes: '' });
    }
    d.saved = true; saveDraft(d); ui.capture = false; save(); render(); toast('Interview saved');
  },
  editJSON: (el) => {
    const { coll, id, field } = el.dataset; const row = getPath(E(), coll).find((x) => x.id === id);
    openModal(`${COLL_LABELS[coll]} → ${row.name || row.title || id} → ${field}`, JSON.stringify(row[field] || [], null, 2), (txt) => {
      let v; try { v = JSON.parse(txt); } catch (err) { toast('Invalid JSON: ' + err.message); return false; }
      row[field] = v; Object.assign(E(), normalise(E())); save(); render(); return true;
    });
  },
  addRec: () => { const r = { id: uid('r'), title: 'New recommendation', type: 'Process', horizon: '0-3 months', effort: 3, risk: 3, confidence: 3, status: 'Proposed', ops: [] }; E().recommendations.push(r); ui.tab = 'data'; ui.coll = 'recommendations'; save(); render(); },
  addScenario: () => { const n = prompt('Scenario name?', `Scenario ${String.fromCharCode(65 + E().scenarios.length)}`); if (!n) return; E().scenarios.push({ id: uid('sc'), name: n, description: '', recommendationIds: [] }); save(); render(); },
  delScenario: (el) => { if (!confirm('Delete this scenario?')) return; E().scenarios = E().scenarios.filter((s) => s.id !== el.dataset.id); if (ui.scenario === el.dataset.id) ui.scenario = 'current'; save(); render(); },
  toggleRecInScenario: (el) => {
    const s = E().scenarios.find((x) => x.id === el.dataset.scenario); const ids = new Set(splitList(s.recommendationIds));
    el.checked ? ids.add(el.dataset.rec) : ids.delete(el.dataset.rec); s.recommendationIds = [...ids]; save(); render();
  },
  toggleReportProc: (el) => { const r = E().report; const ids = new Set(r.processIds || []); el.checked ? ids.add(el.dataset.id) : ids.delete(el.dataset.id); r.processIds = [...ids]; save(); render(); },
  printReport: () => { if (ui.tab !== 'report') { ui.tab = 'report'; render(); } setTimeout(() => window.print(), 50); },
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
        list.forEach((x) => { const e = normalise(x); db.engagements[e.id] = e; db.activeId = e.id; });
        ui.scenario = 'current'; save(); render(); toast(`Imported ${list.length} client${list.length > 1 ? 's' : ''}`);
      } catch (err) { toast('Could not read file: ' + err.message); }
    };
    fr.readAsText(t.files[0]); return;
  }
  if (t.id === 'staffFile' && t.files[0]) {
    const fr = new FileReader();
    fr.onload = () => { const res = importFormCSV(E(), fr.result, 'staff'); save(); render(); toast(`Staff responses: ${res.added} added, ${res.updated} updated${res.unmatched.length ? `, ${res.unmatched.length} columns not matched` : ''}`); };
    fr.readAsText(t.files[0]); return;
  }
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
  if (t.dataset.ui) { ui[t.dataset.ui] = t.type === 'checkbox' ? t.checked : t.value; saveUI(); render(); return; }
  if (t.dataset.bind) {
    const v = t.type === 'checkbox' ? t.checked : t.value; setPath(E(), t.dataset.bind, v); save();
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
    row[field] = v;
    if (coll === 'engagement.activities' && field === 'status') row.doneDate = v === 'Done' ? (row.doneDate || todayISO()) : '';
    if (coll === 'engagement.phases' && field === 'status' && v === 'Done') { const ps = E().engagement.phases; const i = ps.indexOf(row); if (ps[i + 1] && ps[i + 1].status === 'Not started') ps[i + 1].status = 'In progress'; }
    save();
    if ((coll === 'recommendations' && ui.tab === 'recs') || (ui.tab === 'progress' && (t.tagName === 'SELECT' || t.type === 'date' || t.type === 'number'))) render();
  }
});
document.addEventListener('input', (ev) => {
  const t = ev.target;
  if (t.tagName === 'TEXTAREA' && t.dataset.bind) { setPath(E(), t.dataset.bind, t.value); save(); }
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
render();
