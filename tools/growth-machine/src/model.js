/* ============================================================
   The Growth Machine — data model, scenario engine, scoring, insights
   ============================================================ */
const SCHEMA = 'tgm.engagement/1';
const HOURS_PER_FTE_YEAR = 1760;
const HOURS_PER_FTE_MONTH = HOURS_PER_FTE_YEAR / 12;

const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 8);
const clone = (o) => JSON.parse(JSON.stringify(o));
const num = (v) => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
const sum = (arr, f) => arr.reduce((a, x) => a + (f ? num(f(x)) : num(x)), 0);
const live = (arr) => (arr || []).filter((x) => !x._removed);
const byId = (arr) => Object.fromEntries((arr || []).map((x) => [x.id, x]));
const splitList = (v) => Array.isArray(v) ? v : String(v || '').split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);

const COLLECTIONS = ['intake', 'customQuestions', 'competitors', 'capabilities', 'intel', 'usps', 'opportunities', 'departments', 'people', 'tools', 'processes', 'segments', 'markets', 'topClients',
  'financePeriods', 'interviews', 'findings', 'recommendations', 'scenarios'];

function blankEngagement(name) {
  const today = todayISO();
  return {
    schema: SCHEMA,
    id: uid('eng'),
    client: { name: name || 'New client', sector: '', subSector: '', hq: '', website: '', founded: '', stage: '',
      businessModel: '', revenueModel: '', description: '', goals: '', constraints: '' },
    meta: { currency: 'ZAR', consultant: 'The Growth Machine', engagementStart: today, lastUpdated: new Date().toISOString(),
      lastExported: '', notes: '' },
    departments: [], people: [], tools: [], processes: [], segments: [], markets: [], topClients: [],
    financePeriods: [], interviews: [], findings: [], recommendations: [], scenarios: [],
    intake: [], customQuestions: [], competitors: [], capabilities: [], intel: [], usps: [], opportunities: [], engagement: blankEngagementBlock(),
    report: { title: '', preparedFor: '', summary: '', nextSteps: '', anonymise: true, scenarioId: '', processIds: [],
      sections: { snapshot: true, competition: true, findings: true, org: true, processes: true, recommendations: true, financials: true, nextSteps: true } }
  };
}

/** Fill missing keys so older / Claude-generated files always load. */
function normalise(e) {
  const b = blankEngagement(e && e.client && e.client.name);
  const out = Object.assign({}, b, e || {});
  out.client = Object.assign({}, b.client, out.client || {});
  out.meta = Object.assign({}, b.meta, out.meta || {});
  out.report = Object.assign({}, b.report, out.report || {});
  out.report.sections = Object.assign({}, b.report.sections, out.report.sections || {});
  if (!out.id) out.id = uid('eng');
  COLLECTIONS.forEach((c) => {
    if (!Array.isArray(out[c])) out[c] = [];
    out[c].forEach((x) => { if (!x.id) x.id = uid(c.slice(0, 3)); });
  });
  out.processes.forEach((p) => { if (!Array.isArray(p.steps)) p.steps = []; p.steps.forEach((s) => { if (!s.id) s.id = uid('s'); }); });
  out.recommendations.forEach((r) => { if (!Array.isArray(r.ops)) r.ops = []; });
  out.scenarios.forEach((s) => { s.recommendationIds = splitList(s.recommendationIds); });
  normaliseEngagementBlock(out);
  out.schema = SCHEMA;
  return out;
}

/** Merge a (partial) engagement — e.g. pasted from Claude — into an existing one. Upserts by id. */
function mergeEngagement(base, incoming) {
  const out = clone(base);
  ['client', 'meta', 'report'].forEach((k) => {
    if (incoming[k] && typeof incoming[k] === 'object') {
      Object.entries(incoming[k]).forEach(([kk, v]) => { if (v !== '' && v != null) out[k][kk] = v; });
    }
  });
  const counts = {};
  COLLECTIONS.forEach((c) => {
    if (!Array.isArray(incoming[c])) return;
    counts[c] = { added: 0, updated: 0 };
    incoming[c].forEach((item) => {
      const i = item.id ? out[c].findIndex((x) => x.id === item.id) : -1;
      if (i >= 0) { out[c][i] = Object.assign({}, out[c][i], item); counts[c].updated++; }
      else { out[c].push(Object.assign({ id: uid(c.slice(0, 3)) }, item)); counts[c].added++; }
    });
  });
  if (incoming.engagement && typeof incoming.engagement === 'object') {
    const g = out.engagement = Object.assign(blankEngagementBlock(), out.engagement || {});
    Object.entries(incoming.engagement).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        g[k] = Array.isArray(g[k]) ? g[k] : [];
        v.forEach((item) => { const i = item.id ? g[k].findIndex((x) => x.id === item.id) : -1; if (i >= 0) g[k][i] = Object.assign({}, g[k][i], item); else g[k].push(Object.assign({ id: uid(k.slice(0, 2)) }, item)); });
        counts['engagement.' + k] = { added: v.length, updated: 0 };
      } else if (v !== '' && v != null) g[k] = v;
    });
  }
  return { engagement: normalise(out), counts };
}

/* ---------------- Scenario engine ----------------
   Proposed state = current state + the "ops" of every recommendation in the scenario.
   Removed things are flagged (_removed) rather than deleted so views can show ghosts. */
function applyRecs(eng, recIds) {
  const s = { departments: clone(eng.departments), people: clone(eng.people), tools: clone(eng.tools), processes: clone(eng.processes) };
  const recs = byId(eng.recommendations);
  (recIds || []).forEach((rid) => {
    const r = recs[rid];
    if (!r) return;
    (r.ops || []).forEach((op) => { try { applyOp(s, op, r); } catch (err) { console.warn('Op failed', op, err); } });
  });
  return s;
}

function markChanged(obj, keys) { obj._changed = Array.from(new Set([...(obj._changed || []), ...keys])); }

function applyOp(s, op, rec) {
  const tag = rec.title || rec.id;
  const find = (coll, id) => s[coll].find((x) => x.id === id);
  const proc = op.processId ? find('processes', op.processId) : null;
  switch (op.op) {
    case 'removePerson': {
      const p = find('people', op.personId); if (!p || p._removed) return;
      live(s.people).filter((x) => x.managerId === p.id).forEach((r) => { r.managerId = p.managerId || ''; markChanged(r, ['managerId']); });
      p._removed = true; p._by = tag; break;
    }
    case 'addPerson': { const p = Object.assign({ id: uid('p') }, op.person, { _added: true, _by: tag }); s.people.push(p); break; }
    case 'updatePerson': { const p = find('people', op.personId); if (!p) return; Object.assign(p, op.changes); markChanged(p, Object.keys(op.changes || {})); p._by = tag; break; }
    case 'removeTool': { const t = find('tools', op.toolId); if (!t) return; t._removed = true; t._by = tag; break; }
    case 'addTool': { s.tools.push(Object.assign({ id: uid('t') }, op.tool, { _added: true, _by: tag })); break; }
    case 'updateTool': { const t = find('tools', op.toolId); if (!t) return; Object.assign(t, op.changes); markChanged(t, Object.keys(op.changes || {})); break; }
    case 'addProcess': { s.processes.push(Object.assign({ id: uid('pr'), steps: [] }, op.process, { _added: true, _by: tag })); break; }
    case 'removeProcess': { if (proc) { proc._removed = true; proc._by = tag; } break; }
    case 'updateProcess': { if (proc) { Object.assign(proc, op.changes); markChanged(proc, Object.keys(op.changes || {})); } break; }
    case 'addStep': {
      if (!proc) return;
      const st = Object.assign({ id: uid('s') }, op.step, { _added: true, _by: tag });
      const i = op.afterStepId ? proc.steps.findIndex((x) => x.id === op.afterStepId) : -1;
      if (i >= 0) proc.steps.splice(i + 1, 0, st); else proc.steps.push(st);
      markChanged(proc, ['steps']); break;
    }
    case 'updateStep': {
      if (!proc) return; const st = proc.steps.find((x) => x.id === op.stepId); if (!st) return;
      Object.assign(st, op.changes); markChanged(st, Object.keys(op.changes || {})); st._by = tag; markChanged(proc, ['steps']); break;
    }
    case 'removeStep': {
      if (!proc) return; const st = proc.steps.find((x) => x.id === op.stepId); if (!st) return;
      st._removed = true; st._by = tag; markChanged(proc, ['steps']); break;
    }
    case 'addDepartment': { s.departments.push(Object.assign({ id: uid('d') }, op.department, { _added: true })); break; }
    case 'updateDepartment': { const d = find('departments', op.departmentId); if (d) { Object.assign(d, op.changes); markChanged(d, Object.keys(op.changes || {})); } break; }
    case 'removeDepartment': { const d = find('departments', op.departmentId); if (d) { d._removed = true; d._by = tag; } break; }
    default: console.warn('Unknown op', op);
  }
}

/** Which recommendation ids are active for a scenario selection. */
function scenarioRecIds(eng, scenarioId) {
  if (!scenarioId || scenarioId === 'current') return [];
  if (scenarioId === 'all') return eng.recommendations.filter((r) => r.status !== 'Rejected').map((r) => r.id);
  const sc = eng.scenarios.find((x) => x.id === scenarioId);
  return sc ? splitList(sc.recommendationIds) : [];
}
function scenarioName(eng, scenarioId) {
  if (!scenarioId || scenarioId === 'current') return 'Current state';
  if (scenarioId === 'all') return 'All recommendations';
  const sc = eng.scenarios.find((x) => x.id === scenarioId);
  return sc ? sc.name : 'Current state';
}
function stateFor(eng, scenarioId) { return applyRecs(eng, scenarioRecIds(eng, scenarioId)); }

/* ---------------- Metrics ---------------- */
function personRate(p) { const f = num(p.fte) || 1; return num(p.annualCost) / (f * HOURS_PER_FTE_YEAR); }
function stepHours(step, proc) { return num(step.durationMins) * num(proc.runsPerMonth) / 60; }
function processHours(proc) {
  const st = live(proc.steps);
  if (st.some((s) => num(s.durationMins) > 0)) return sum(st, (s) => stepHours(s, proc));
  return num(proc.hoursPerMonth);
}
function processManualHours(proc) {
  const st = live(proc.steps);
  if (st.some((s) => num(s.durationMins) > 0)) return sum(st.filter((s) => !s.automated), (s) => stepHours(s, proc));
  return proc.automated ? 0 : num(proc.hoursPerMonth);
}
function avgRate(state) {
  const ppl = live(state.people);
  const hrs = sum(ppl, (p) => (num(p.fte) || 1) * HOURS_PER_FTE_YEAR);
  return hrs ? sum(ppl, (p) => p.annualCost) / hrs : 0;
}
function processCostMonthly(proc, state) {
  const people = byId(state.people); const rate = avgRate(state);
  const st = live(proc.steps);
  if (!st.length) return processHours(proc) * rate;
  return sum(st.filter((s) => !s.automated), (s) => stepHours(s, proc) * (people[s.actorId] ? personRate(people[s.actorId]) : rate));
}

function metrics(state) {
  const ppl = live(state.people), tools = live(state.tools), procs = live(state.processes);
  return {
    headcount: ppl.length,
    fte: sum(ppl, (p) => num(p.fte) || 1),
    payroll: sum(ppl, (p) => p.annualCost),
    toolSpend: sum(tools, (t) => num(t.monthlyCost) * 12),
    toolCount: tools.length,
    procHours: sum(procs, processHours),
    manualHours: sum(procs, processManualHours),
    processCost: sum(procs, (p) => processCostMonthly(p, state)),
    avgRate: avgRate(state)
  };
}

/** Per-person load: hours/month spent on mapped process steps. */
function personLoad(state) {
  const load = {};
  live(state.processes).forEach((proc) => live(proc.steps).forEach((s) => {
    if (!s.actorId || s.automated) return;
    load[s.actorId] = load[s.actorId] || { hours: 0, processes: new Set(), steps: 0 };
    load[s.actorId].hours += stepHours(s, proc);
    load[s.actorId].processes.add(proc.id);
    load[s.actorId].steps++;
  }));
  return load;
}

function latestPeriod(eng) { return eng.financePeriods.length ? eng.financePeriods[eng.financePeriods.length - 1] : null; }
function annualRevenue(eng) {
  const fp = eng.financePeriods;
  if (fp.length) {
    const last4 = fp.slice(-4);
    const months = sum(last4, (p) => num(p.months) || 3);
    return months ? sum(last4, (p) => p.revenue) * 12 / months : 0;
  }
  return sum(eng.segments, (s) => s.annualRevenue);
}

/* ---------------- Scenario + recommendation impact ---------------- */
function scenarioImpact(eng, scenarioId) {
  const base = metrics(stateFor(eng, 'current'));
  const ids = scenarioRecIds(eng, scenarioId);
  const m = metrics(applyRecs(eng, ids));
  const recs = eng.recommendations.filter((r) => ids.includes(r.id));
  const payrollSaving = base.payroll - m.payroll;
  const toolSaving = base.toolSpend - m.toolSpend;
  const otherSaving = sum(recs, (r) => r.otherAnnualSaving);
  const revenueUplift = sum(recs, (r) => r.revenueUplift);
  const cashSaving = payrollSaving + toolSaving + otherSaving;
  const hoursSaved = base.procHours - m.procHours;
  const oneOff = sum(recs, (r) => r.oneOffCost);
  const monthlyBenefit = (cashSaving + revenueUplift) / 12;
  return {
    base, m, recs, payrollSaving, toolSaving, otherSaving, revenueUplift, cashSaving, hoursSaved,
    capacityValue: hoursSaved * 12 * base.avgRate, oneOff,
    paybackMonths: oneOff > 0 && monthlyBenefit > 0 ? oneOff / monthlyBenefit : (oneOff === 0 && monthlyBenefit > 0 ? 0 : null),
    headcountDelta: m.headcount - base.headcount
  };
}

/** Value + priority score for every recommendation (each measured on its own against current state). */
function scoreRecommendations(eng) {
  const base = metrics(stateFor(eng, 'current'));
  const rows = eng.recommendations.map((r) => {
    const m = metrics(applyRecs(eng, [r.id]));
    const cash = (base.payroll - m.payroll) + (base.toolSpend - m.toolSpend) + num(r.otherAnnualSaving);
    const hoursSaved = base.procHours - m.procHours;
    const capacity = hoursSaved * 12 * base.avgRate;
    const revenue = num(r.revenueUplift);
    const value = cash + revenue + capacity * 0.5;
    const oneOff = num(r.oneOffCost);
    const monthly = (cash + revenue) / 12;
    return { rec: r, cash, hoursSaved, capacity, revenue, value, oneOff,
      payback: oneOff > 0 && monthly > 0 ? oneOff / monthly : (oneOff === 0 && monthly > 0 ? 0 : null),
      headcountDelta: m.headcount - base.headcount };
  });
  const maxV = Math.max(1, ...rows.map((x) => x.value));
  rows.forEach((x) => {
    const e = num(x.rec.effort) || 3, k = num(x.rec.risk) || 3, c = num(x.rec.confidence) || 3;
    x.score = Math.round(100 * (0.5 * Math.max(0, x.value) / maxV + 0.2 * (5 - e) / 4 + 0.15 * (5 - k) / 4 + 0.15 * (c - 1) / 4));
  });
  return rows.sort((a, b) => b.score - a.score);
}

/* ---------------- Crossover insights (rule engine) ---------------- */
function themeCounts(eng) {
  const counts = {};
  eng.interviews.forEach((iv) => splitList(iv.themes).forEach((t) => {
    const k = t.toLowerCase();
    counts[k] = counts[k] || { theme: t, count: 0, people: new Set() };
    counts[k].count++; if (iv.personId) counts[k].people.add(iv.personId);
  }));
  return Object.values(counts).sort((a, b) => b.count - a.count);
}

function insights(eng, fmtMoney, anon) {
  const state = stateFor(eng, 'current');
  const out = [];
  const add = (area, severity, title, detail) => out.push({ area, severity, title, detail });
  const people = live(state.people), pById = byId(state.people), tools = live(state.tools), procs = live(state.processes);
  const m = metrics(state);
  const rev = annualRevenue(eng);
  const nm = (p) => (anon ? (p.title || 'A role') : p.name);
  const name = (id) => (pById[id] ? nm(pById[id]) : 'Unknown');

  // Finance × People
  if (rev > 0 && m.payroll > 0) {
    const pct = m.payroll / rev * 100;
    if (pct > 50) add('Finance × People', pct > 65 ? 'high' : 'medium', `Payroll is ${pct.toFixed(0)}% of revenue`,
      `Annual payroll ${fmtMoney(m.payroll)} against run-rate revenue ${fmtMoney(rev)}. Revenue per FTE is ${fmtMoney(rev / (m.fte || 1))}.`);
    else add('Finance × People', 'low', `Revenue per FTE: ${fmtMoney(rev / (m.fte || 1))}`, `Payroll is ${pct.toFixed(0)}% of revenue.`);
  }
  // Tools
  const cats = {};
  tools.forEach((t) => { const c = (t.category || '').trim().toLowerCase(); if (!c) return; (cats[c] = cats[c] || []).push(t); });
  Object.values(cats).filter((g) => g.length > 1).forEach((g) => add('Tools', 'medium', `Overlapping tools: ${g.map((t) => t.name).join(' + ')}`,
    `${g.length} tools in "${g[0].category}" cost ${fmtMoney(sum(g, (t) => num(t.monthlyCost) * 12))}/yr combined. Consolidation candidate.`));
  tools.forEach((t) => {
    const seats = num(t.seats), active = num(t.activeUsers);
    if (seats && active && seats > active * 1.25 && num(t.monthlyCost) > 0) {
      const waste = num(t.monthlyCost) * 12 * (1 - active / seats);
      add('Tools', waste > 20000 ? 'medium' : 'low', `${t.name}: ${seats - active} unused seats`, `${active}/${seats} seats active. Roughly ${fmtMoney(waste)}/yr on idle licences.`);
    }
  });
  // Processes
  procs.forEach((p) => {
    const h = processHours(p), mh = processManualHours(p);
    if (h >= 15 && mh / h > 0.6) add('Process × Cost', h > 60 ? 'high' : 'medium', `${p.name}: ${Math.round(mh / h * 100)}% manual`,
      `${Math.round(h)} hrs/month, ${Math.round(mh)} of them manual, costing about ${fmtMoney(processCostMonthly(p, state) * 12)}/yr in staff time. Automation candidate.`);
    const actors = new Set(live(p.steps).filter((s) => s.actorId && !s.automated).map((s) => s.actorId));
    if (actors.size === 1 && h >= 10) add('Process × People', 'medium', `Single point of failure: ${p.name}`, `Every manual step is done by ${name([...actors][0])}. Knowledge is concentrated in one person.`);
    const painSteps = live(p.steps).filter((s) => s.painPoint);
    if (painSteps.length >= 2) add('Process × Interviews', 'medium', `${p.name}: ${painSteps.length} steps flagged as painful`, painSteps.map((s) => `${s.name}: ${s.painPoint}`).join(' · '));
  });
  // Tool friction: pain points concentrated on one tool
  const toolPain = {};
  procs.forEach((p) => live(p.steps).forEach((s) => { if (s.painPoint && s.toolId) toolPain[s.toolId] = (toolPain[s.toolId] || 0) + 1; }));
  const tById = byId(state.tools);
  Object.entries(toolPain).filter(([, c]) => c >= 2).forEach(([tid, c]) => tById[tid] && add('Tools × Process', 'medium', `${tById[tid].name} is linked to ${c} pain points`, 'This tool shows up in several painful steps. It may be the wrong tool, or badly configured.'));
  // People load
  const load = personLoad(state);
  people.forEach((p) => {
    const cap = (num(p.fte) || 1) * HOURS_PER_FTE_MONTH;
    const l = load[p.id];
    if (l && l.hours > cap * 0.8) add('People × Process', 'high', `${nm(p)} is overloaded on mapped work`, `${Math.round(l.hours)} hrs/month on ${l.processes.size} processes vs ${Math.round(cap)} hrs capacity.`);
    if (l && l.processes.size >= 3) add('People × Process', 'low', `${nm(p)} touches ${l.processes.size} processes`, 'High dependency. Check for cross-training and handover risk.');
  });
  // Org structure
  people.forEach((p) => {
    const reports = people.filter((x) => x.managerId === p.id);
    if (reports.length === 1) add('Org structure', 'low', `${nm(p)} manages only one person`, `${p.title || ''} → ${nm(reports[0])}. Possible extra management layer.`);
    if (reports.length > 8) add('Org structure', 'medium', `${nm(p)} has ${reports.length} direct reports`, 'Span of control may be too wide.');
  });
  const depth = (id, seen = new Set()) => { const p = pById[id]; if (!p || !p.managerId || seen.has(id)) return 1; seen.add(id); return 1 + depth(p.managerId, seen); };
  const maxDepth = Math.max(0, ...people.map((p) => depth(p.id)));
  if (maxDepth > 4) add('Org structure', 'medium', `${maxDepth} management layers`, 'A deep hierarchy for the headcount. Decisions may be slow.');
  // Customers
  const tc = eng.topClients.slice().sort((a, b) => num(b.annualRevenue) - num(a.annualRevenue));
  if (rev > 0 && tc.length) {
    const top1 = num(tc[0].annualRevenue) / rev * 100;
    const top3 = sum(tc.slice(0, 3), (c) => c.annualRevenue) / rev * 100;
    if (top1 > 15 || top3 > 40) add('Customers × Finance', top1 > 25 ? 'high' : 'medium', `Revenue concentration: top client ${top1.toFixed(0)}%, top 3 ${top3.toFixed(0)}%`, `${tc[0].name} is the largest account. Losing it would hit run-rate revenue hard.`);
  }
  eng.segments.forEach((s) => {
    if (num(s.churnPct) >= 15) add('Customers', 'medium', `${s.name}: ${num(s.churnPct)}% churn`, 'Churn is high in this segment. Look into onboarding, value delivery and fit.');
  });
  // Interviews
  themeCounts(eng).filter((t) => t.count >= 2).slice(0, 6).forEach((t) => add('Interviews', t.count >= 3 ? 'high' : 'medium', `"${t.theme}" raised in ${t.count} interviews`, 'Several people raised the same issue independently. That makes it a strong signal.'));
  // Market & competition
  (eng.competitors || []).forEach((c) => {
    if (c.threat === 'High') add('Market × Competition', 'medium', `${c.name} rated a high threat`, c.whereWeLose ? `Where ${eng.client.name} loses: ${c.whereWeLose}` : 'Record where deals are lost to them.');
    if (num(eng.client.pricePoint) > 0 && num(c.pricePoint) > 0 && num(c.pricePoint) < num(eng.client.pricePoint) && typeof capabilityScore === 'function') {
      const mine = capabilityScore(eng, (cap) => cap.client), theirs = capabilityScore(eng, (cap) => (cap.scores || {})[c.id]);
      if (mine != null && theirs != null && theirs >= mine) add('Market × Price', 'high', `Price pressure: ${c.name} is cheaper with equal or better capability`, `${fmtMoney(num(c.pricePoint))} vs ${fmtMoney(num(eng.client.pricePoint))} per location / month; capability ${Math.round(theirs)}% vs ${Math.round(mine)}%.`);
    }
  });
  const unsourced = (eng.competitors || []).filter((c) => !String(c.sources || '').trim());
  if (unsourced.length) add('Market × Competition', 'low', `${unsourced.length} competitor profile${unsourced.length > 1 ? 's have' : ' has'} no sources`, 'Add sources before these appear in a founder report.');
  // Department cost vs size
  const order = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Department scorecard: crosses people, tools, processes and interviews per department. */
function departmentScorecard(eng, state) {
  const pById = byId(state.people);
  const ivByPerson = {};
  eng.interviews.forEach((iv) => { if (iv.personId) ivByPerson[iv.personId] = (ivByPerson[iv.personId] || 0) + splitList(iv.painPoints).length; });
  return live(state.departments).map((d) => {
    const ppl = live(state.people).filter((p) => p.departmentId === d.id);
    const tools = live(state.tools).filter((t) => splitList(t.departmentIds).includes(d.id));
    const procs = live(state.processes).filter((p) => p.departmentId === d.id);
    const hours = sum(procs, processHours), manual = sum(procs, processManualHours);
    return {
      dept: d, headcount: ppl.length, fte: sum(ppl, (p) => num(p.fte) || 1), payroll: sum(ppl, (p) => p.annualCost),
      toolSpend: sum(tools, (t) => num(t.monthlyCost) * 12 / Math.max(1, splitList(t.departmentIds).length)),
      processes: procs.length, hours, manualPct: hours ? manual / hours * 100 : 0,
      pain: sum(ppl, (p) => ivByPerson[p.id] || 0),
      head: pById[d.headId]
    };
  });
}

/** Completeness of each compartment, used on the overview. */
function completeness(eng) {
  const c = eng.client;
  return [
    ['Business profile', ['sector', 'businessModel', 'revenueModel', 'description', 'goals'].filter((k) => c[k]).length / 5],
    ['Org & people', Math.min(1, eng.people.length / 5) * (eng.people.some((p) => p.annualCost) ? 1 : 0.6)],
    ['Tools', Math.min(1, eng.tools.length / 5)],
    ['Processes', Math.min(1, eng.processes.filter((p) => p.steps.length).length / 3)],
    ['Finance', Math.min(1, eng.financePeriods.length / 4)],
    ['Customers & market', Math.min(1, (eng.segments.length + eng.markets.length + eng.topClients.length) / 6)],
    ['Interviews', Math.min(1, eng.interviews.length / 6)],
    ['Recommendations', Math.min(1, eng.recommendations.length / 5)]
  ];
}
