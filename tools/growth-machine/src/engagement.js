/* ============================================================
   Engagement tracking — phases, time log, delays & changes, client requests,
   activities, contract savings tracker, discovery coverage.
   ============================================================ */
const DELAY_CAUSES = ['Client: information late', 'Client: access not granted', 'Client: decision / approval pending', 'Client: availability / cooperation',
  'New information / finding', 'Scope change (agreed)', 'TGM side', 'External / other'];
const PHASE_STATUSES = ['Not started', 'In progress', 'Done', 'On hold'];
const ACTIVITY_STATUSES = ['Next', 'In progress', 'Waiting on client', 'Done'];
const REC_STAGES = ['Identified', 'Approved', 'In progress', 'Realised', 'Rejected'];
const LEGACY_STATUS = { Proposed: 'Identified', Agreed: 'Approved', Done: 'Realised' };

/* Dates are calendar days (YYYY-MM-DD). All arithmetic is done in UTC so it is identical in every timezone
   (local-time arithmetic + toISOString() shifts by a day east of UTC, e.g. South Africa). */
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const addDaysISO = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const addMonthsISO = (iso, k) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + k); return d.toISOString().slice(0, 10); };
const weekdayISO = (iso) => new Date(iso + 'T00:00:00Z').getUTCDay();
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5);
const fmtD = (iso, o) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', o || { day: 'numeric', month: 'short' }) : '—');

function blankEngagementBlock() {
  return { contact: '', contactRole: '', start: '', end: '', daysTotal: 30, daysPerMonth: 10, targetMonthly: 0, baselineMonthly: 0,
    reviewDates: '', phases: [], timeLog: [], delays: [], requests: [], activities: [] };
}
function normaliseEngagementBlock(e) {
  e.engagement = Object.assign(blankEngagementBlock(), e.engagement || {});
  ['phases', 'timeLog', 'delays', 'requests', 'activities'].forEach((k) => {
    if (!Array.isArray(e.engagement[k])) e.engagement[k] = [];
    e.engagement[k].forEach((x) => { if (!x.id) x.id = uid(k.slice(0, 2)); });
  });
  // Work diary: whole or half days only; what happened is a simple list (no durations)
  e.engagement.timeLog.forEach((t) => {
    if (t.dayType !== 'Full' && t.dayType !== 'Half') t.dayType = num(t.days) >= 0.75 ? 'Full' : 'Half';
    t.days = t.dayType === 'Full' ? 1 : 0.5;
    if (t.items == null) t.items = [t.activity, t.notes].filter(Boolean).join('\n');
    delete t.activity;
    if (!t.phaseId) t.phaseId = phaseForDate(e.engagement, t.date);
  });
  // One-time repair: plans created east of UTC before 2 Nov 2026 were saved one day early (timezone bug).
  const g0 = e.engagement;
  if (!g0._tzFixed && g0.start && g0.phases.length && g0.phases[0].id === 'ph0' && g0.phases[0].start === addDaysISO(g0.start, -1)) {
    const shift = (v) => (v ? addDaysISO(v, 1) : v);
    g0.phases.forEach((p) => { p.start = shift(p.start); p.end = p.id === 'ph5' && p.end === addDaysISO(g0.end, -1) ? g0.end : shift(p.end); });
    g0.requests.forEach((r) => { if (r.requestedDate === addDaysISO(g0.start, -1)) r.requestedDate = g0.start; if (!r.receivedDate) r.dueDate = shift(r.dueDate); });
    g0.activities.forEach((a) => { if (a.status !== 'Done') a.due = shift(a.due); });
    const rd = splitList(g0.reviewDates);
    if (rd.length && rd.every((d) => weekdayISO(d) === 4)) g0.reviewDates = rd.map(shift).join(', ');
    g0._tzFixed = true;
  }
  if (g0.start) g0._tzFixed = true;
  e.engagement.status = Object.assign({ headline: '', delivered: '', next: '', includeDiary: false }, e.engagement.status || {});
  if (!Array.isArray(e.intake)) e.intake = [];
  if (!Array.isArray(e.staffSurvey)) e.staffSurvey = [];
  e.recommendations.forEach((r) => { if (LEGACY_STATUS[r.status]) r.status = LEGACY_STATUS[r.status]; if (!r.status) r.status = 'Identified'; });
  e.interviews.forEach((iv) => { if (!iv.answers || typeof iv.answers !== 'object') iv.answers = {}; if (!Array.isArray(iv.outliers)) iv.outliers = []; });
  return e;
}

/** Seed the standard 3-month plan, document requests and first activities. */
function seedStandardPlan(e) {
  const g = e.engagement; const start = g.start || todayISO();
  g.start = start;
  if (!g.end) g.end = addDaysISO(addMonthsISO(start, 3), -1);
  g.phases = standardPlan(start).map((p, i) => Object.assign(p, { status: i === 0 ? 'In progress' : 'Not started' }));
  g.requests = DOCUMENT_REQUESTS.map((d) => ({ id: d.id, item: d.item, crit: d.crit, owner: g.contact || '', requestedDate: start, dueDate: addDaysISO(start, d.dueDays), receivedDate: '', status: '', notes: '' }));
  const A = (phaseId, title, due, status) => ({ id: uid('ac'), phaseId, title, due, status: status || 'Next', doneDate: '' });
  g.activities = [
    A('ph0', 'Kick-off meeting with founders; agreement signed', start, 'In progress'),
    A('ph0', 'Send founder questionnaire link + secure folder link', start),
    A('ph0', 'Team announcement sent by founders', addDaysISO(start, 3)),
    A('ph1', 'Receive org chart, payroll and P&L', addDaysISO(start, 4)),
    A('ph1', 'Systems & data map', addDaysISO(start, 9)),
    A('ph1', 'Draft cost baseline', addDaysISO(start, 11)),
    A('ph2', 'Schedule manager and staff interviews', addDaysISO(start, 4)),
    A('ph2', 'Complete all interviews', addDaysISO(start, 18)),
    A('ph3', 'Opportunity register with monthly impact', addDaysISO(start, 24)),
    A('ph3', 'Month-1 readout to founders', g.phases[3].end)
  ];
  if (!g.reviewDates) {
    let first = start; while (weekdayISO(first) !== 5) first = addDaysISO(first, 1); first = addDaysISO(first, 7);
    const out = [];
    const holidays = ['12-16', '12-24', '12-25', '12-26', '12-31', '01-01']; // skip SA year-end public holidays
    for (let d = first, i = 0; d <= g.end && i < 60; d = addDaysISO(d, 14), i++) { if (!holidays.includes(d.slice(5))) out.push(d); }
    g.reviewDates = out.join(', ');
  }
}

/** The phase a date falls in (latest-starting phase that contains it). */
function phaseForDate(g, iso) {
  if (!iso || !g.phases || !g.phases.length) return '';
  const hits = g.phases.filter((p) => p.start <= iso && iso <= p.end).sort((a, b) => (b.start || '').localeCompare(a.start || ''));
  if (hits.length) return hits[0].id;
  return iso < g.phases[0].start ? g.phases[0].id : g.phases[g.phases.length - 1].id;
}
/** Things the Studio recorded on a given date, so the diary fills itself in. Roles, never names. */
function dayEvents(e, iso) {
  const g = e.engagement; const out = [];
  const pById = byId(e.people);
  const roleOf = (iv) => iv.role || (pById[iv.personId] && pById[iv.personId].title) || 'team member';
  const ivs = e.interviews.filter((iv) => iv.date === iso);
  if (ivs.length) out.push(`Interview${ivs.length > 1 ? 's' : ''}: ${ivs.map(roleOf).join(', ')}`);
  const fs = e.intake.filter((r) => (r.sessionDates || []).includes(iso));
  if (fs.length) out.push(`Founder session: ${fs.map((r) => r.role || 'founder').join(', ')}`);
  const rec = g.requests.filter((r) => r.receivedDate === iso);
  if (rec.length) out.push(`Information received: ${rec.length} item${rec.length > 1 ? 's' : ''}`);
  g.activities.filter((a) => a.status === 'Done' && a.doneDate === iso).forEach((a) => out.push(`Done: ${a.title}`));
  g.delays.filter((d) => d.dateRaised === iso).forEach((d) => out.push(`Delay logged: ${d.cause || 'see log'}`));
  const ss = e.staffSurvey.filter((r) => r.date === iso);
  if (ss.length) out.push(`Staff questionnaires received: ${ss.length}`);
  return out;
}
/** Start of the current reporting period: the most recent review date before today (or the engagement start). */
function statusPeriodStart(g) {
  const t = todayISO();
  const past = splitList(g.reviewDates).filter((d) => d < t).sort();
  return past.length ? past[past.length - 1] : g.start;
}

/** Contract month (1-based) for a date, from the engagement start. */
function contractMonth(g, iso) {
  if (!g.start || !iso) return 0;
  const s = new Date(g.start + 'T00:00:00'), d = new Date(iso + 'T00:00:00');
  let k = (d.getFullYear() - s.getFullYear()) * 12 + (d.getMonth() - s.getMonth());
  if (d.getDate() < s.getDate()) k -= 1;
  return k + 1;
}

function requestStatus(r, today) {
  if (r.status === 'Not needed' || r.status === 'Not available') return r.status;
  if (r.receivedDate) return 'Received';
  if (r.dueDate && r.dueDate < today) return 'Overdue';
  return 'Waiting';
}

function engagementStatus(e) {
  const g = e.engagement; const today = todayISO();
  const phases = g.phases;
  const current = phases.find((p) => p.status === 'In progress') || phases.find((p) => p.start <= today && today <= p.end) || phases.find((p) => p.status !== 'Done') || null;
  const used = sum(g.timeLog, (t) => t.days);
  const byMonth = {}; g.timeLog.forEach((t) => { const m = contractMonth(g, t.date); byMonth[m] = (byMonth[m] || 0) + num(t.days); });
  const byPhase = {}; g.timeLog.forEach((t) => { byPhase[t.phaseId || '—'] = (byPhase[t.phaseId || '—'] || 0) + num(t.days); });
  const openDelays = g.delays.filter((d) => d.status !== 'Resolved');
  const slipByPhase = {}; g.delays.forEach((d) => { if (d.phaseId) slipByPhase[d.phaseId] = (slipByPhase[d.phaseId] || 0) + num(d.daysImpact); });
  const totalSlip = sum(g.delays, (d) => d.daysImpact);
  const reqs = g.requests.map((r) => Object.assign({}, r, { _status: requestStatus(r, today) }));
  const overdue = reqs.filter((r) => r._status === 'Overdue');
  const thisMonth = contractMonth(g, today);
  const termDays = g.start && g.end ? daysBetween(g.start, g.end) + 1 : 0;
  const elapsed = g.start ? Math.max(0, Math.min(termDays, daysBetween(g.start, today) + 1)) : 0;
  return { today, current, used, byMonth, byPhase, openDelays, slipByPhase, totalSlip, reqs, overdue, thisMonth, termDays, elapsed,
    daysLeftInTerm: g.end ? Math.max(0, daysBetween(today, g.end)) : 0, remaining: num(g.daysTotal) - used,
    done: g.activities.filter((a) => a.status === 'Done').sort((a, b) => (b.doneDate || '').localeCompare(a.doneDate || '')),
    doing: g.activities.filter((a) => a.status === 'In progress' || a.status === 'Waiting on client'),
    next: g.activities.filter((a) => a.status === 'Next').sort((a, b) => (a.due || '').localeCompare(b.due || '')) };
}

/** Contract savings tracker: monthly recurring, net of new recurring costs, by stage. */
function savingsTracker(e) {
  const rows = scoreRecommendations(e).map((r) => ({ rec: r.rec, monthlyNet: r.cash / 12, oneOffSaving: num(r.rec.oneOffSaving), oneOffCost: r.oneOff, hoursMonth: r.hoursSaved, stage: r.rec.status || 'Identified' }));
  const live = rows.filter((r) => r.stage !== 'Rejected');
  const by = (st) => sum(live.filter((r) => st.includes(r.stage)), (r) => Math.max(0, r.monthlyNet));
  return { rows, target: num(e.engagement.targetMonthly), baseline: num(e.engagement.baselineMonthly),
    identified: by(['Identified', 'Approved', 'In progress', 'Realised']), approved: by(['Approved', 'In progress', 'Realised']), realised: by(['Realised']),
    oneOffSavings: sum(live, (r) => r.oneOffSaving), oneOffCosts: sum(live.filter((r) => r.stage !== 'Identified'), (r) => r.oneOffCost), hours: sum(live, (r) => Math.max(0, r.hoursMonth)) };
}

/* ---------- Discovery coverage: how well each criterion is evidenced ---------- */
const QINDEX = (() => { const m = {}; [...INTAKE_SECTIONS, ...STAFF_SECTIONS].forEach((s) => s.questions.forEach((q) => { m[q.id] = q; })); INTERVIEW_QUESTIONS.forEach((q) => { m[q.id] = q; }); return m; })();
function coverage(e) {
  const cols = ['Founder questionnaire', 'Staff questionnaire', 'Founder interviews', 'Manager interviews', 'Staff interviews', 'Unexpected points'];
  const m = {}; CRITERIA.forEach((c) => { m[c.id] = cols.map(() => 0); });
  const hit = (crit, col) => { if (m[crit]) m[crit][col]++; };
  e.intake.forEach((r) => Object.entries(r.answers || {}).forEach(([qid, v]) => { if (String(v || '').trim() && QINDEX[qid]) hit(QINDEX[qid].crit, 0); }));
  e.staffSurvey.forEach((r) => Object.entries(r.answers || {}).forEach(([qid, v]) => { if (String(v || '').trim() && QINDEX[qid] && !/_name$|_role$/.test(qid)) hit(QINDEX[qid].crit, 1); }));
  e.interviews.forEach((iv) => {
    const col = iv.level === 'founder' ? 2 : iv.level === 'manager' ? 3 : 4;
    Object.entries(iv.answers || {}).forEach(([qid, v]) => { if (String(v || '').trim() && QINDEX[qid]) hit(QINDEX[qid].crit, col); });
    (iv.outliers || []).forEach((o) => { if (o.text && o.crit) hit(o.crit, 5); });
  });
  return { cols, rows: CRITERIA.map((c) => ({ c, counts: m[c.id], total: sum(m[c.id]) })) };
}

/** Guess a department's question set from its name if no type was set. */
function deptType(d) {
  if (!d) return '';
  if (d.type) return d.type;
  const n = (d.name || '').toLowerCase();
  if (/revenue|\bcro\b/.test(n)) return 'revenue';
  if (/sales|business dev|commercial/.test(n)) return 'sales';
  if (/success|support|account|client|customer|service/.test(n)) return 'cs';
  if (/oper|data|listing|delivery|fulfil/.test(n)) return 'ops';
  if (/financ|account(ing|s)|billing|admin/.test(n)) return 'finance';
  if (/product|engineer|tech|dev|it\b/.test(n)) return 'tech';
  if (/market|brand|growth/.test(n)) return 'marketing';
  if (/lead|exec|founder|management|board/.test(n)) return 'leadership';
  return '';
}
function guessLevel(e, p) {
  if (!p) return 'staff';
  const reports = e.people.filter((x) => x.managerId === p.id).length;
  if (!p.managerId || /founder|ceo|owner|director|md\b|managing/i.test(p.title || '')) return 'founder';
  return reports > 0 || /head|manager|lead|chief/i.test(p.title || '') ? 'manager' : 'staff';
}
function questionSet(level, dtype) {
  return {
    core: INTERVIEW_QUESTIONS.filter((q) => q.level === 'all' && q.dept === 'all'),
    level: INTERVIEW_QUESTIONS.filter((q) => q.level === level && q.dept === 'all'),
    dept: dtype ? INTERVIEW_QUESTIONS.filter((q) => q.dept === dtype) : []
  };
}

/* ---------- CSV (Google Form / Sheet export) ---------- */
function parseCSV(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}
/** Map Google Form response columns (question titles) back to question ids, then merge into the target list.
    Answers are merged per person: a later form submission fills gaps without wiping answers captured live. */
function importFormCSV(e, text, kind) {
  const isStaff = kind === 'staff';
  const sections = isStaff ? STAFF_SECTIONS : INTAKE_SECTIONS; const list = isStaff ? e.staffSurvey : e.intake;
  const nameQ = isStaff ? 'st_name' : 'i_name', roleQ = isStaff ? 'st_role' : 'i_role';
  const rows = parseCSV(text); if (rows.length < 2) return { added: 0, updated: 0, unmatched: [] };
  const head = rows[0];
  const byTitle = {}; sections.forEach((s) => s.questions.forEach((q) => { byTitle[q.q.trim().toLowerCase()] = q.id; }));
  const map = head.map((h) => byTitle[h.trim().toLowerCase()] || null);
  const unmatched = head.filter((h, i) => !map[i] && !/timestamp/i.test(h));
  let added = 0, updated = 0;
  rows.slice(1).forEach((r) => {
    const answers = {}; map.forEach((qid, i) => { if (qid && String(r[i] || '').trim()) answers[qid] = r[i]; });
    const ts = r[head.findIndex((h) => /timestamp/i.test(h))] || '';
    const respondent = (answers[nameQ] || 'Unknown').trim();
    const person = e.people.find((p) => (p.name || '').trim().toLowerCase() === respondent.toLowerCase());
    const id = (isStaff ? 'ss_' : 'in_') + respondent.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 40);
    const existing = list.find((x) => x.id === id || String(x.respondent).toLowerCase() === respondent.toLowerCase());
    if (existing) { existing.answers = Object.assign({}, existing.answers, answers); existing.timestamp = ts; existing.source = (existing.source || '') + (existing.source && !/Google Form/.test(existing.source) ? ' + Google Form' : existing.source ? '' : 'Google Form'); if (person) existing.personId = person.id; updated++; }
    else { list.push({ id, respondent, role: answers[roleQ] || '', personId: person ? person.id : '', timestamp: ts, date: todayISO(), source: 'Google Form', answers }); added++; }
  });
  return { added, updated, unmatched };
}
const importIntakeCSV = (e, text) => importFormCSV(e, text, 'intake');

/** Founder questionnaire completeness: which questions nobody has answered yet. */
function intakeOutstanding(e) {
  const answered = new Set(); e.intake.forEach((r) => Object.entries(r.answers || {}).forEach(([q, v]) => { if (String(v || '').trim()) answered.add(q); }));
  const all = INTAKE_SECTIONS.filter((s) => s.id !== 'about').flatMap((s) => s.questions.map((q) => Object.assign({ section: s.title }, q)));
  const open = all.filter((q) => !answered.has(q.id));
  return { total: all.length, open, openPriority: open.filter((q) => q.p), answered: all.length - open.length };
}
