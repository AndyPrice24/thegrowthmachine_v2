/* ============================================================
   Views — each returns an HTML string for the main panel
   ============================================================ */
const TABS = [
  ['overview', 'Overview'], ['progress', 'Progress & time'], ['discovery', 'Discovery'], ['business', 'Business & market'], ['competitors', 'Competitors'], ['finance', 'Finance'], ['org', 'People & org'],
  ['tools', 'Tools'], ['processes', 'Processes'], ['interviews', 'Interviews'], ['crossover', 'Crossover'],
  ['recs', 'Recommendations'], ['scenarios', 'Scenarios'], ['report', 'Report'], ['data', 'Data & Claude']
];

const card = (title, body, { sub = '', cls = '', actions = '' } = {}) =>
  `<section class="card ${cls}"><header class="card-h"><div><h3>${title}</h3>${sub ? `<p class="sub">${sub}</p>` : ''}</div>${actions}</header>${body}</section>`;
const sevChip = (s) => `<span class="chip sev-${s}">${s === 'high' ? '▲ High' : s === 'medium' ? '● Medium' : '○ Low'}</span>`;
const stChip = (x) => x._removed ? '<span class="chip st-removed">✕ Removed</span>' : x._added ? '<span class="chip st-added">+ New</span>' : (x._changed && x._changed.length) ? '<span class="chip st-changed">~ Changed</span>' : '';
const empty = (msg) => `<p class="empty">${msg}</p>`;
const pct = (v) => `${Math.round(v)}%`;
const hrs = (v) => `${Math.round(v).toLocaleString('en-GB')} h`;

function deltaHTML(cur, next, fmt, lowerIsGood = true) {
  const d = next - cur; if (Math.abs(d) < 0.5) return '<span class="k-delta">no change</span>';
  const good = lowerIsGood ? d < 0 : d > 0;
  return `<span class="k-delta ${good ? 'delta-good' : 'delta-bad'}">${d > 0 ? '▲' : '▼'} ${fmt(Math.abs(d))} vs current</span>`;
}
const kpi = (label, value, delta = '') => `<div class="kpi"><div class="k-label">${label}</div><div class="k-value${String(value).replace(/<[^>]+>/g, '').length > 14 ? ' k-text' : ''}">${value}</div>${delta}</div>`;

function scenarioBanner(e) {
  if (ui.scenario === 'current') return '';
  return `<div class="banner">Showing the <strong>${esc(scenarioName(e, ui.scenario))}</strong> scenario. Changes are flagged: <span class="chip st-added">+ New</span> <span class="chip st-changed">~ Changed</span> <span class="chip st-removed">✕ Removed</span> <button class="link" data-action="setScenario" data-id="current">Back to current state</button></div>`;
}

/* ---------------- Overview ---------------- */
function viewOverview(e) {
  const imp = scenarioImpact(e, ui.scenario);
  const { base, m } = imp; const isCur = ui.scenario === 'current';
  const tiles = [
    kpi('Headcount', `${m.headcount}`, isCur ? `<div class="k-delta">${base.fte.toFixed(1)} FTE</div>` : deltaHTML(base.headcount, m.headcount, (v) => v)),
    kpi('Annual payroll', fmtMoney(m.payroll), isCur ? '' : deltaHTML(base.payroll, m.payroll, fmtMoney)),
    kpi('Tool spend / yr', fmtMoney(m.toolSpend), isCur ? `<div class="k-delta">${m.toolCount} tools</div>` : deltaHTML(base.toolSpend, m.toolSpend, fmtMoney)),
    kpi('Mapped process hours / mo', hrs(m.procHours), isCur ? `<div class="k-delta">${base.procHours ? pct(base.manualHours / base.procHours * 100) : '0%'} manual</div>` : deltaHTML(base.procHours, m.procHours, hrs)),
    kpi('Run-rate revenue', fmtMoney(annualRevenue(e)), `<div class="k-delta">from finance periods</div>`)
  ];
  if (!isCur) tiles.push(
    kpi('Cash saving / yr', fmtMoney(imp.cashSaving), `<div class="k-delta">+ ${fmtMoney(imp.revenueUplift)} revenue uplift</div>`),
    kpi('One-off cost', fmtMoney(imp.oneOff), `<div class="k-delta">payback ${imp.paybackMonths == null ? 'n/a' : imp.paybackMonths.toFixed(1) + ' months'}</div>`));

  const scen = e.scenarios.map((s) => ({ s, i: scenarioImpact(e, s.id) }));
  const scenTable = scen.length ? `<table class="tbl"><thead><tr><th>Scenario</th><th class="r">Headcount Δ</th><th class="r">Cash saving/yr</th><th class="r">Revenue uplift</th><th class="r">Hours freed/mo</th><th class="r">One-off</th><th class="r">Payback</th><th></th></tr></thead><tbody>
    ${scen.map(({ s, i }) => `<tr><td><strong>${esc(s.name)}</strong><div class="muted small">${esc(s.description || '')}</div></td><td class="r">${i.headcountDelta}</td><td class="r">${fmtMoney(i.cashSaving)}</td><td class="r">${fmtMoney(i.revenueUplift)}</td><td class="r">${hrs(i.hoursSaved)}</td><td class="r">${fmtMoney(i.oneOff)}</td><td class="r">${i.paybackMonths == null ? '—' : i.paybackMonths.toFixed(1) + ' mo'}</td><td><button class="btn sm" data-action="setScenario" data-id="${s.id}">View</button></td></tr>`).join('')}
    </tbody></table>` : empty('No scenarios yet. Create them under Scenarios.');

  const top = scoreRecommendations(e).slice(0, 5);
  const ins = insights(e, fmtMoney, ui.anon).slice(0, 6);
  return `${scenarioBanner(e)}
  <div class="page-h"><div><span class="eyebrow">${esc(e.client.sector || 'Client')}${e.client.subSector ? ' · ' + esc(e.client.subSector) : ''}</span><h1>${esc(e.client.name)}</h1><p class="muted">${esc(e.client.goals || e.client.description || 'Start by completing the business profile, or paste structured data from Claude in Data & Claude.')}</p></div></div>
  <div class="kpis">${tiles.join('')}</div>
  ${card('Scenarios compared', scenTable, { cls: 'scroll-x', sub: 'Each scenario is the current state with a set of recommendations applied.' })}
  <div class="grid-2">
    ${card('Top recommendations', top.length ? `<ol class="rank">${top.map((r) => `<li><div><strong>${esc(r.rec.title)}</strong><div class="muted small">${esc(r.rec.type || '')} · ${esc(r.rec.horizon || '')} · ${fmtMoney(r.cash + r.revenue)}/yr cash + revenue · ${hrs(r.hoursSaved)}/mo freed</div></div><span class="score">${r.score}</span></li>`).join('')}</ol>` : empty('No recommendations yet.'), { actions: '<button class="btn sm" data-action="tab" data-id="recs">All →</button>' })}
    ${card('Key crossover signals', ins.length ? `<ul class="insights">${ins.map((x) => `<li>${sevChip(x.severity)} <strong>${esc(x.title)}</strong><div class="muted small">${esc(x.area)}: ${esc(x.detail)}</div></li>`).join('')}</ul>` : empty('Signals appear as data comes in.'), { actions: '<button class="btn sm" data-action="tab" data-id="crossover">All →</button>' })}
  </div>
  ${card('Discovery coverage', hbars(completeness(e).map(([l, v]) => ({ label: l, value: v * 100 })), { fmt: pct, max: 100, color: 'var(--s1)' }), { sub: 'How complete each area is. Gaps here mean weaker analysis.' })}`;
}

/* ---------------- Business & market ---------------- */
function field(path, label, value, { type = 'text', area = false, ph = '' } = {}) {
  return `<label class="fld"><span>${label}</span>${area
    ? `<textarea data-bind="${path}" rows="3" placeholder="${esc(ph)}">${esc(value)}</textarea>`
    : `<input data-bind="${path}" type="${type}" value="${esc(value)}" placeholder="${esc(ph)}">`}</label>`;
}
function viewBusiness(e) {
  const c = e.client; const rev = annualRevenue(e);
  const segs = e.segments.slice().sort((a, b) => num(b.annualRevenue) - num(a.annualRevenue));
  const tc = e.topClients.slice().sort((a, b) => num(b.annualRevenue) - num(a.annualRevenue));
  return `<div class="page-h"><div><span class="eyebrow">Business & market</span><h1>Profile, customers, markets</h1></div></div>
  ${card('Business profile', `<div class="form-grid">
    ${field('client.name', 'Client name', c.name)}${field('client.sector', 'Sector', c.sector)}${field('client.subSector', 'Sub-sector', c.subSector)}
    ${field('client.hq', 'HQ', c.hq)}${field('client.website', 'Website', c.website)}${field('client.founded', 'Founded', c.founded)}
    ${field('client.stage', 'Stage', c.stage)}${field('meta.currency', 'Currency (ISO code)', e.meta.currency)}${field('meta.engagementStart', 'Engagement start', e.meta.engagementStart, { type: 'date' })}
  </div><div class="form-grid wide">
    ${field('client.description', 'What the business does', c.description, { area: true })}
    ${field('client.businessModel', 'Business model', c.businessModel, { area: true })}
    ${field('client.revenueModel', 'Revenue model', c.revenueModel, { area: true })}
    ${field('client.goals', 'Founder goals', c.goals, { area: true })}
    ${field('client.constraints', 'Constraints / sensitivities', c.constraints, { area: true })}
  </div>`)}
  <div class="grid-2">
    ${card('Revenue by customer segment', hbars(segs.map((s) => ({ label: s.name, value: num(s.annualRevenue), tip: `${num(s.customers)} customers · ${num(s.churnPct)}% churn · ${fmtMoney(num(s.annualRevenue) / Math.max(1, num(s.customers)))} avg/customer` })), { fmt: fmtMoney }), { sub: 'Hover for customer count, churn and average value.' })}
    ${card('Revenue share by market', hbars(e.markets.map((m) => ({ label: m.name, value: num(m.revenueShare) })), { fmt: pct, max: 100, color: 'var(--s2)' }))}
  </div>
  <div class="grid-2">
    ${card('Segment economics', segs.length ? `<table class="tbl"><thead><tr><th>Segment</th><th class="r">Customers</th><th class="r">Revenue</th><th class="r">Avg / customer</th><th class="r">Churn</th><th>Acquisition</th></tr></thead><tbody>${segs.map((s) => `<tr><td>${esc(s.name)}</td><td class="r">${num(s.customers)}</td><td class="r">${fmtMoney(num(s.annualRevenue))}</td><td class="r">${fmtMoney(num(s.annualRevenue) / Math.max(1, num(s.customers)))}</td><td class="r">${num(s.churnPct)}%</td><td>${esc(s.acquisitionChannel || '')}</td></tr>`).join('')}</tbody></table>` : empty('Add segments in Data & Claude.'))}
    ${card('Customer concentration', tc.length ? hbars(tc.slice(0, 10).map((c) => ({ label: c.name, value: rev ? num(c.annualRevenue) / rev * 100 : 0, tip: fmtMoney(num(c.annualRevenue)) })), { fmt: (v) => v.toFixed(1) + '%', color: 'var(--s7)' }) : empty('Add top clients to see concentration risk.'), { sub: 'Share of run-rate revenue per client.' })}
  </div>`;
}

/* ---------------- Finance ---------------- */
function viewFinance(e) {
  const fp = e.financePeriods; const labels = fp.map((p) => p.label);
  const costKeys = [['cogs', 'Cost of sales'], ['payroll', 'Payroll'], ['tools', 'Software & tools'], ['marketing', 'Marketing'], ['premises', 'Premises'], ['other', 'Other']];
  const totalCost = (p) => sum(costKeys, ([k]) => p[k]);
  const state = stateFor(e, ui.scenario);
  const sc = departmentScorecard(e, state);
  const rev = annualRevenue(e); const m = metrics(state);
  const last = latestPeriod(e);
  return `${scenarioBanner(e)}<div class="page-h"><div><span class="eyebrow">Finance</span><h1>Revenue, cost & where the money goes</h1></div></div>
  <div class="kpis">
    ${kpi('Run-rate revenue', fmtMoney(rev))}
    ${kpi('Latest period margin', last ? pct((num(last.revenue) - totalCost(last)) / Math.max(1, num(last.revenue)) * 100) : '—', last ? `<div class="k-delta">${esc(last.label)}</div>` : '')}
    ${kpi('Payroll / revenue', rev ? pct(m.payroll / rev * 100) : '—', ui.scenario !== 'current' ? '<div class="k-delta">scenario payroll</div>' : '')}
    ${kpi('Revenue per FTE', fmtMoney(rev / Math.max(1, m.fte)))}
    ${kpi('Tool spend / revenue', rev ? (m.toolSpend / rev * 100).toFixed(1) + '%' : '—')}
  </div>
  <div class="grid-2">
    ${card('Revenue vs total cost', lineChart(labels, [{ name: 'Revenue', values: fp.map((p) => p.revenue), color: 'var(--s1)' }, { name: 'Total cost', values: fp.map(totalCost), color: 'var(--s2)' }], { fmt: fmtShort }))}
    ${card('Cost composition', stackedColumns(labels, costKeys.map(([k, n], i) => ({ name: n, values: fp.map((p) => p[k]), color: slotVar(i) })), { fmt: fmtShort }))}
  </div>
  <div class="grid-2">
    ${card('Annual people + tool cost by department', hbars(sc.map((d) => ({ label: d.dept.name, value: d.payroll + d.toolSpend, swatch: deptColor(e.departments, d.dept.id), tip: `payroll ${fmtMoney(d.payroll)} · tools ${fmtMoney(d.toolSpend)} · ${d.headcount} people` })).sort((a, b) => b.value - a.value), { fmt: fmtMoney, color: 'var(--s1)' }), { sub: 'Payroll from People plus tool cost split across the departments using it. Follows the selected scenario.' })}
    ${card('Period P&L', fp.length ? `<table class="tbl"><thead><tr><th>Period</th><th class="r">Revenue</th>${costKeys.map(([, n]) => `<th class="r">${n}</th>`).join('')}<th class="r">Result</th><th class="r">Margin</th></tr></thead><tbody>
      ${fp.map((p) => { const r = num(p.revenue) - totalCost(p); return `<tr><td>${esc(p.label)}</td><td class="r">${fmtShort(p.revenue)}</td>${costKeys.map(([k]) => `<td class="r">${fmtShort(p[k])}</td>`).join('')}<td class="r ${r < 0 ? 'delta-bad' : ''}">${fmtShort(r)}</td><td class="r">${pct(r / Math.max(1, num(p.revenue)) * 100)}</td></tr>`; }).join('')}</tbody></table>` : empty('Add finance periods in Data & Claude (quarters or months).'), { cls: 'scroll-x' })}
  </div>`;
}

/* ---------------- People & org ---------------- */
function viewOrg(e) {
  const cur = stateFor(e, 'current'); const st = stateFor(e, ui.scenario);
  const opts = { anonymise: ui.anon, showGhosts: ui.ghosts, fmtMoney: fmtShort, showCost: ui.showCost };
  const isCur = ui.scenario === 'current';
  const controls = `<div class="toolbar">
    <label class="tog"><input type="checkbox" data-ui="anon" ${ui.anon ? 'checked' : ''}> Anonymise (roles only)</label>
    <label class="tog"><input type="checkbox" data-ui="showCost" ${ui.showCost ? 'checked' : ''}> Show cost</label>
    ${isCur ? '' : `<label class="tog"><input type="checkbox" data-ui="ghosts" ${ui.ghosts ? 'checked' : ''}> Show removed roles</label>
    <label class="tog"><input type="checkbox" data-ui="compare" ${ui.compare ? 'checked' : ''}> Side-by-side with current</label>`}
    <button class="btn sm" data-action="zoom" data-id="-1">−</button><button class="btn sm" data-action="zoom" data-id="1">+</button></div>`;
  const z = `style="zoom:${ui.zoom}"`;
  const chartCur = `<div class="org-wrap" ${z}>${orgChart(cur.people, cur.departments, opts)}</div>`;
  const chartNew = `<div class="org-wrap" ${z}>${orgChart(st.people, st.departments, opts)}</div>`;
  const load = personLoad(st); const ivCount = {};
  e.interviews.forEach((i) => { ivCount[i.personId] = (ivCount[i.personId] || 0) + 1; });
  const dById = byId(st.departments); const pById = byId(st.people);
  const ppl = st.people.filter((p) => ui.ghosts || !p._removed);
  const table = `<table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Reports to</th><th class="r">Cost / yr</th><th class="r">FTE</th><th class="r">Mapped hrs/mo</th><th class="r">% of capacity</th><th class="r">Processes</th><th class="r">Interviews</th><th></th></tr></thead><tbody>
    ${ppl.map((p) => { const l = load[p.id]; const cap = (num(p.fte) || 1) * HOURS_PER_FTE_MONTH; return `<tr class="${p._removed ? 'row-removed' : ''}"><td>${ui.anon ? '—' : esc(p.name)}</td><td>${esc(p.title || '')}</td><td><i class="swatch" style="background:${deptColor(e.departments, p.departmentId)}"></i>${esc(dById[p.departmentId] ? dById[p.departmentId].name : '')}</td><td>${ui.anon ? esc(pById[p.managerId] ? pById[p.managerId].title : '') : esc(pById[p.managerId] ? pById[p.managerId].name : '')}</td><td class="r">${fmtMoney(num(p.annualCost))}</td><td class="r">${num(p.fte) || 1}</td><td class="r">${l ? Math.round(l.hours) : 0}</td><td class="r">${l ? pct(l.hours / cap * 100) : '0%'}</td><td class="r">${l ? l.processes.size : 0}</td><td class="r">${ivCount[p.id] || 0}</td><td>${stChip(p)}</td></tr>`; }).join('')}</tbody></table>`;
  return `${scenarioBanner(e)}<div class="page-h"><div><span class="eyebrow">People & org</span><h1>${isCur ? 'Current structure' : 'Proposed structure'}</h1><p class="muted">Hover any card for detail. Mapped hours come from process steps, so low numbers usually mean unmapped work, not idle people.</p></div></div>
  ${controls}${orgLegend(e.departments)}
  ${!isCur && ui.compare ? `<div class="compare"><div><h4>Current</h4>${chartCur}</div><div><h4>${esc(scenarioName(e, ui.scenario))}</h4>${chartNew}</div></div>` : (isCur ? chartCur : chartNew)}
  ${card('People, cost & load', table, { cls: 'scroll-x' })}`;
}

/* ---------------- Tools ---------------- */
function viewTools(e) {
  const st = stateFor(e, ui.scenario);
  const tools = st.tools.filter((t) => ui.ghosts || !t._removed);
  const depts = live(st.departments);
  const cats = {}; live(st.tools).forEach((t) => { const c = (t.category || '').toLowerCase(); if (c) cats[c] = (cats[c] || 0) + 1; });
  const usage = {}; live(st.processes).forEach((p) => live(p.steps).forEach((s) => { if (s.toolId) usage[s.toolId] = (usage[s.toolId] || 0) + stepHours(s, p); }));
  const matrix = `<table class="tbl matrix"><thead><tr><th>Tool</th>${depts.map((d) => `<th class="c" title="${esc(d.name)}"><i class="swatch" style="background:${deptColor(e.departments, d.id)}"></i>${esc(trunc(d.name, 12))}</th>`).join('')}</tr></thead><tbody>
    ${tools.map((t) => `<tr class="${t._removed ? 'row-removed' : ''}"><td>${esc(t.name)} ${stChip(t)}</td>${depts.map((d) => `<td class="c">${splitList(t.departmentIds).includes(d.id) ? '●' : ''}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  return `${scenarioBanner(e)}<div class="page-h"><div><span class="eyebrow">Tools</span><h1>Tool stack, cost & overlap</h1></div></div>
  <div class="grid-2">
    ${card('Annual cost by tool', hbars(live(st.tools).map((t) => ({ label: t.name, value: num(t.monthlyCost) * 12, tip: t.category })).sort((a, b) => b.value - a.value), { fmt: fmtMoney }))}
    ${card('Hours of process work running through each tool', hbars(Object.entries(usage).map(([id, h]) => ({ label: (byId(st.tools)[id] || { name: id }).name, value: h })).sort((a, b) => b.value - a.value), { fmt: hrs, color: 'var(--s3)' }), { sub: 'From mapped process steps, per month.' })}
  </div>
  ${card('Tool register', `<table class="tbl"><thead><tr><th>Tool</th><th>Category</th><th class="r">Monthly</th><th class="r">Seats</th><th class="r">Active</th><th class="r">Cost / active user / mo</th><th>Purpose</th><th></th></tr></thead><tbody>
    ${tools.map((t) => `<tr class="${t._removed ? 'row-removed' : ''}"><td><strong>${esc(t.name)}</strong></td><td>${esc(t.category || '')}${cats[(t.category || '').toLowerCase()] > 1 ? ' <span class="chip sev-medium">● Overlap</span>' : ''}</td><td class="r">${fmtMoney(num(t.monthlyCost))}</td><td class="r">${num(t.seats) || '—'}</td><td class="r">${num(t.activeUsers) || '—'}</td><td class="r">${num(t.activeUsers) ? fmtMoney(num(t.monthlyCost) / num(t.activeUsers)) : '—'}</td><td class="muted small">${esc(t.purpose || '')}</td><td>${stChip(t)}</td></tr>`).join('')}</tbody></table>`, { cls: 'scroll-x' })}
  ${card('Which departments use which tools', matrix, { cls: 'scroll-x' })}`;
}

/* ---------------- Processes ---------------- */
function viewProcesses(e) {
  const st = stateFor(e, ui.scenario); const cur = stateFor(e, 'current');
  const procs = st.processes;
  if (!procs.length) return `<div class="page-h"><div><span class="eyebrow">Processes</span><h1>Process maps</h1></div></div>${empty('No processes yet. Add them in Data & Claude. Each process has steps, and each step has an actor, a tool, a duration and an optional pain point.')}`;
  if (!procs.find((p) => p.id === ui.processId)) ui.processId = procs[0].id;
  const p = procs.find((x) => x.id === ui.processId); const pc = cur.processes.find((x) => x.id === p.id);
  const h = processHours(p), mh = processManualHours(p);
  const list = `<div class="proc-list">${procs.map((x) => `<button class="proc-btn ${x.id === p.id ? 'on' : ''} ${x._removed ? 'row-removed' : ''}" data-action="proc" data-id="${x.id}"><strong>${esc(x.name)}</strong><span>${hrs(processHours(x))}/mo · ${live(x.steps).length} steps</span>${stChip(x)}</button>`).join('')}</div>`;
  const stats = `<div class="kpis">
    ${kpi('Hours / month', hrs(h), pc && ui.scenario !== 'current' ? deltaHTML(processHours(pc), h, hrs) : '')}
    ${kpi('Manual share', h ? pct(mh / h * 100) : '—')}
    ${kpi('Staff cost / yr', fmtMoney(processCostMonthly(p, st) * 12), pc && ui.scenario !== 'current' ? deltaHTML(processCostMonthly(pc, cur) * 12, processCostMonthly(p, st) * 12, fmtMoney) : '')}
    ${kpi('Runs / month', num(p.runsPerMonth) || '—', `<div class="k-delta">${esc(p.frequency || '')}</div>`)}
    ${kpi('Pain points', live(p.steps).filter((s) => s.painPoint).length)}
  </div>`;
  const legendHTML = `<div class="legend"><span><span class="chip">▭ Manual step</span></span><span><span class="chip" style="border-style:dashed;border-color:var(--s1)">▭ Automated</span></span><span><span class="chip sev-high">! Pain point</span></span><span><span class="chip st-added">+ New</span></span><span><span class="chip st-changed">~ Changed</span></span><span><span class="chip st-removed">✕ Removed</span></span></div>`;
  const z = `style="zoom:${ui.zoom}"`;
  const lanes = ui.scenario !== 'current' && pc
    ? `<h4>Before (current)</h4><div class="lane-wrap" ${z}>${swimlane(pc, cur.people, cur.tools, { anonymise: ui.anon })}</div><h4>After: ${esc(scenarioName(e, ui.scenario))}</h4><div class="lane-wrap" ${z}>${swimlane(p, st.people, st.tools, { anonymise: ui.anon })}</div>`
    : `<div class="lane-wrap" ${z}>${swimlane(p, st.people, st.tools, { anonymise: ui.anon })}</div>`;
  return `${scenarioBanner(e)}<div class="page-h"><div><span class="eyebrow">Processes</span><h1>${esc(p.name)}</h1><p class="muted">${esc(p.inputs || '')} → ${esc(p.outputs || '')}</p></div></div>
  <div class="proc-layout">${list}<div>${stats}
    <div class="toolbar"><label class="tog"><input type="checkbox" data-ui="anon" ${ui.anon ? 'checked' : ''}> Anonymise</label><button class="btn sm" data-action="zoom" data-id="-1">−</button><button class="btn sm" data-action="zoom" data-id="1">+</button></div>
    ${legendHTML}${lanes}
    ${card('All processes by monthly hours', hbars(live(procs).map((x) => ({ label: x.name, value: processHours(x), tip: `${pct(processManualHours(x) / Math.max(1, processHours(x)) * 100)} manual · ${fmtMoney(processCostMonthly(x, st) * 12)}/yr` })).sort((a, b) => b.value - a.value), { fmt: hrs, color: 'var(--s1)' }))}
  </div></div>`;
}

/* ---------------- Interviews ---------------- */
function viewInterviews(e) {
  const pById = byId(e.people); const themes = themeCounts(e);
  return `<div class="page-h"><div><span class="eyebrow">Interviews</span><h1>What people told us</h1><p class="muted">Tag themes consistently, e.g. "manual reporting". Themes raised by several people become crossover signals.</p></div><div class="btn-row"><button class="btn" data-action="startCapture">+ Capture an interview</button></div></div>
  ${card('Themes by number of interviews', hbars(themes.map((t) => ({ label: t.theme, value: t.count, tip: [...t.people].map((id) => pById[id] ? (ui.anon ? pById[id].title : pById[id].name) : '').join(', ') })), { fmt: (v) => v, color: 'var(--s7)' }))}
  <div class="iv-grid">${e.interviews.map((iv) => { const p = pById[iv.personId]; return `<article class="card iv">
    <header><strong>${p ? esc(ui.anon ? p.title : p.name) : esc(iv.personLabel || 'Unknown')}</strong><span class="muted small">${p && !ui.anon ? esc(p.title || '') + ' · ' : ''}${esc(iv.date || '')}</span></header>
    <p>${esc(iv.summary || '')}</p>
    ${splitList(iv.painPoints).length ? `<h5>Pain points</h5><ul>${splitList(iv.painPoints).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    ${iv.ideas ? `<h5>Ideas</h5><p class="small">${esc(iv.ideas)}</p>` : ''}
    ${iv.quotes ? `<blockquote>${esc(iv.quotes)}</blockquote>` : ''}
    <div class="tags">${splitList(iv.themes).map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div>
    ${Object.keys(iv.answers || {}).length || (iv.outliers || []).length ? `<details class="small"><summary>${Object.keys(iv.answers || {}).length} structured answers · ${(iv.outliers || []).length} unexpected points</summary>${CRITERIA.map((c) => { const qs = Object.entries(iv.answers || {}).filter(([q]) => QINDEX[q] && QINDEX[q].crit === c.id); const os = (iv.outliers || []).filter((o) => o.crit === c.id); return qs.length || os.length ? `<h5>${esc(c.label)}</h5><dl>${qs.map(([q, a]) => `<dt>${esc(QINDEX[q].q)}</dt><dd>${esc(a)}</dd>`).join('')}${os.map((o) => `<dt>Unexpected</dt><dd>${esc(o.text)}</dd>`).join('')}</dl>` : ''; }).join('')}</details>` : ''}
    <div class="btn-row"><button class="btn sm" data-action="editInterview" data-id="${esc(iv.id)}">Open in capture form</button></div></article>`; }).join('') || empty('No interviews yet. Paste notes into Claude and ask for interview JSON (see Data & Claude).')}</div>`;
}

/* ---------------- Crossover ---------------- */
function viewCrossover(e) {
  const ins = insights(e, fmtMoney, ui.anon);
  const areas = ['All', ...new Set(ins.map((i) => i.area))];
  const shown = ui.area && ui.area !== 'All' ? ins.filter((i) => i.area === ui.area) : ins;
  const st = stateFor(e, ui.scenario);
  const sc = departmentScorecard(e, st);
  const people = live(st.people).filter((p) => personLoad(st)[p.id]);
  const procs = live(st.processes);
  const matrix = people.map((p) => procs.map((pr) => sum(live(pr.steps).filter((s) => s.actorId === p.id && !s.automated), (s) => stepHours(s, pr))));
  const maxPay = Math.max(1, ...sc.map((d) => d.payroll + d.toolSpend));
  return `${scenarioBanner(e)}<div class="page-h"><div><span class="eyebrow">Crossover</span><h1>Where the data points meet</h1><p class="muted">Signals found by crossing finance, people, tools, processes, customers and interviews. They are prompts to investigate, not conclusions.</p></div></div>
  <div class="toolbar">${areas.map((a) => `<button class="btn sm ${((ui.area || 'All') === a) ? 'on' : ''}" data-action="area" data-id="${esc(a)}">${esc(a)}</button>`).join('')}</div>
  ${card(`Signals (${shown.length})`, shown.length ? `<ul class="insights">${shown.map((x) => `<li>${sevChip(x.severity)} <span class="chip">${esc(x.area)}</span> <strong>${esc(x.title)}</strong><div class="muted small">${esc(x.detail)}</div></li>`).join('')}</ul>` : empty('No signals yet.'))}
  ${card('Department scorecard', sc.length ? `<table class="tbl"><thead><tr><th>Department</th><th class="r">People</th><th>People + tool cost / yr</th><th class="r">Processes</th><th class="r">Process hrs/mo</th><th class="r">Manual</th><th class="r">Pain points raised</th></tr></thead><tbody>
    ${sc.map((d) => `<tr><td><i class="swatch" style="background:${deptColor(e.departments, d.dept.id)}"></i>${esc(d.dept.name)}</td><td class="r">${d.headcount}</td><td><div class="inline-bar"><span style="width:${(d.payroll + d.toolSpend) / maxPay * 100}%"></span></div>${fmtMoney(d.payroll + d.toolSpend)}</td><td class="r">${d.processes}</td><td class="r">${Math.round(d.hours)}</td><td class="r">${d.hours ? pct(d.manualPct) : '—'}</td><td class="r">${d.pain}</td></tr>`).join('')}</tbody></table>` : empty('Add departments.'), { cls: 'scroll-x', sub: 'Crosses people, tools, processes and interview pain points for each department.' })}
  ${card('Who carries which process (hours / month)', heatmap(people.map((p) => ui.anon ? p.title : p.name), procs.map((p) => p.name), matrix, { fmt: (v) => Math.round(v) }), { cls: 'scroll-x', sub: 'Darker means more hours. Look for one person carrying a whole process, or senior people doing manual work.' })}`;
}

/* ---------------- Recommendations ---------------- */
function viewRecs(e) {
  const rows = scoreRecommendations(e);
  const types = ['All', ...new Set(e.recommendations.map((r) => r.type).filter(Boolean))];
  const shown = ui.recType && ui.recType !== 'All' ? rows.filter((r) => r.rec.type === ui.recType) : rows;
  const statusOpts = REC_STAGES;
  return `<div class="page-h"><div><span class="eyebrow">Recommendations</span><h1>Ranked changes</h1><p class="muted">Each recommendation is scored on its own against the current state. Score = 50% value, 20% low effort, 15% low risk, 15% confidence. Value = cash saving + revenue uplift + half the value of freed hours. Freed hours are capacity, not cash, unless headcount changes.</p></div>
    <button class="btn" data-action="addRec">+ Add recommendation</button></div>
  <div class="toolbar">${types.map((t) => `<button class="btn sm ${((ui.recType || 'All') === t) ? 'on' : ''}" data-action="recType" data-id="${esc(t)}">${esc(t)}</button>`).join('')}</div>
  ${card('', shown.length ? `<table class="tbl recs"><thead><tr><th>#</th><th>Recommendation</th><th>Score</th><th class="r">Cash / yr</th><th class="r">Revenue / yr</th><th class="r">Hours freed / mo</th><th class="r">Headcount</th><th class="r">One-off</th><th class="r">Payback</th><th class="c">Effort</th><th class="c">Risk</th><th class="c">Conf.</th><th>Status</th></tr></thead><tbody>
    ${shown.map((r, i) => `<tr class="${r.rec.status === 'Rejected' ? 'row-removed' : ''}"><td>${i + 1}</td><td><strong>${esc(r.rec.title)}</strong> <span class="chip">${esc(r.rec.type || '—')}</span> <span class="chip">${esc(r.rec.horizon || '—')}</span><div class="muted small">${esc(r.rec.description || '')}</div>${(r.rec.ops || []).length ? `<div class="faint small">${r.rec.ops.length} modelled change${r.rec.ops.length > 1 ? 's' : ''}: ${esc(r.rec.ops.map((o) => o.op).join(', '))}</div>` : '<div class="faint small">Not modelled yet. Add ops so it shows in the scenarios.</div>'}</td>
    <td><div class="score-bar"><span style="width:${r.score}%"></span></div><span class="small">${r.score}</span></td>
    <td class="r">${fmtMoney(r.cash)}</td><td class="r">${fmtMoney(r.revenue)}</td><td class="r">${Math.round(r.hoursSaved)}</td><td class="r">${r.headcountDelta || '—'}</td><td class="r">${fmtMoney(r.oneOff)}</td><td class="r">${r.payback == null ? '—' : r.payback.toFixed(1) + ' mo'}</td>
    <td class="c">${num(r.rec.effort) || '—'}</td><td class="c">${num(r.rec.risk) || '—'}</td><td class="c">${num(r.rec.confidence) || '—'}</td>
    <td><select data-cell data-coll="recommendations" data-id="${r.rec.id}" data-field="status">${statusOpts.map((s) => `<option ${r.rec.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('')}
    </tbody></table>` : empty('No recommendations yet.'), { cls: 'scroll-x' })}
  <p class="muted small">Edit details, costs and modelled changes ("ops") in Data & Claude → Recommendations. Claude can draft the ops for you. See the schema in the README.</p>`;
}

/* ---------------- Scenarios ---------------- */
function viewScenarios(e) {
  const recs = scoreRecommendations(e);
  const impacts = e.scenarios.map((s) => ({ s, i: scenarioImpact(e, s.id) }));
  return `<div class="page-h"><div><span class="eyebrow">Scenarios</span><h1>Build "what it could be"</h1><p class="muted">Tick which recommendations each scenario includes. Every view (org, processes, tools, finance) can then be switched to that scenario from the selector at the top.</p></div><button class="btn" data-action="addScenario">+ Add scenario</button></div>
  ${e.scenarios.length ? card('Scenario builder', `<table class="tbl"><thead><tr><th>Recommendation</th>${e.scenarios.map((s) => `<th class="c"><input class="inline" data-cell data-coll="scenarios" data-id="${s.id}" data-field="name" value="${esc(s.name)}"></th>`).join('')}</tr></thead><tbody>
    ${recs.map((r) => `<tr><td>${esc(r.rec.title)} <span class="faint small">(score ${r.score})</span></td>${e.scenarios.map((s) => `<td class="c"><input type="checkbox" data-action="toggleRecInScenario" data-scenario="${s.id}" data-rec="${r.rec.id}" ${splitList(s.recommendationIds).includes(r.rec.id) ? 'checked' : ''}></td>`).join('')}</tr>`).join('')}
    <tr><td></td>${e.scenarios.map((s) => `<td class="c"><button class="btn sm" data-action="setScenario" data-id="${s.id}">View</button> <button class="btn sm ghost" data-action="delScenario" data-id="${s.id}" title="Delete scenario">✕</button></td>`).join('')}</tr>
    </tbody></table>`, { cls: 'scroll-x' }) : empty('No scenarios yet.')}
  ${impacts.length ? `<div class="grid-2">
    ${card('Annual cash saving + revenue uplift', hbars(impacts.map(({ s, i }) => ({ label: s.name, value: i.cashSaving + i.revenueUplift, tip: `cash ${fmtMoney(i.cashSaving)} · revenue ${fmtMoney(i.revenueUplift)}` })), { fmt: fmtMoney, color: 'var(--s3)' }))}
    ${card('One-off investment', hbars(impacts.map(({ s, i }) => ({ label: s.name, value: i.oneOff, tip: i.paybackMonths == null ? '' : `payback ${i.paybackMonths.toFixed(1)} months` })), { fmt: fmtMoney, color: 'var(--s2)' }))}
  </div>` : ''}`;
}

/* ---------------- Report (settings + preview) ---------------- */
function viewReport(e) {
  const toggle = `<div class="toolbar"><button class="btn sm ${ui.reportType === 'status' ? 'on' : ''}" data-action="reportType" data-id="status">Status report (progress, time, delays)</button><button class="btn sm ${ui.reportType !== 'status' ? 'on' : ''}" data-action="reportType" data-id="diagnostic">Diagnostic report (findings & recommendations)</button></div>`;
  if (ui.reportType === 'status') {
    return `<div class="page-h"><div><span class="eyebrow">Report</span><h1>Client status report</h1><p class="muted">Output-led: what was delivered, what's next, what we need, delays, savings and one capacity line. Send it after every fortnightly review. Delays & changes is always included.</p></div>
      <div class="btn-row"><button class="btn" data-action="printReport">Print / save PDF</button><button class="btn" data-action="downloadReport">Download HTML report</button></div></div>
      ${toggle}${e.engagement.phases.length ? `<div class="report-layout">${statusSettings(e)}<div class="report-preview status-preview"><div id="report-doc" class="rpt">${renderStatusReport(e)}</div></div></div>` : '<p>Set up the engagement in Progress & time first.</p>'}`;
  }
  const r = e.report; const sec = r.sections;
  const secLabels = { snapshot: 'Current-state snapshot', competition: 'Market & competition', findings: 'Key findings', org: 'Org chart: current vs proposed', processes: 'Process maps: before / after', recommendations: 'Recommendations roadmap', financials: 'Financial impact', nextSteps: 'Next steps' };
  return `<div class="page-h"><div><span class="eyebrow">Report</span><h1>Founder report</h1><p class="muted">Preview below. Export as PDF (print) or as one self-contained HTML file you can email. Exports hold no raw data and do not depend on this tool or on Claude.</p></div>
    <div class="btn-row"><button class="btn" data-action="printReport">Print / save PDF</button><button class="btn" data-action="downloadReport">Download HTML report</button></div></div>
  ${toggle}
  <div class="report-layout">
    <aside class="card report-settings">
      ${field('report.title', 'Report title', r.title)}${field('report.preparedFor', 'Prepared for', r.preparedFor)}
      <label class="fld"><span>Scenario to present</span><select data-bind="report.scenarioId"><option value="">None (current state only)</option>${e.scenarios.map((s) => `<option value="${s.id}" ${r.scenarioId === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}<option value="all" ${r.scenarioId === 'all' ? 'selected' : ''}>All recommendations</option></select></label>
      <label class="tog"><input type="checkbox" data-bind="report.anonymise" ${r.anonymise ? 'checked' : ''}> Anonymise people (roles only)</label>
      <p class="faint small">Anonymising hides names in charts and tables. It does not edit names you typed into free text.</p>
      <h5>Sections</h5>${Object.keys(secLabels).map((k) => `<label class="tog"><input type="checkbox" data-bind="report.sections.${k}" ${sec[k] ? 'checked' : ''}> ${secLabels[k]}</label>`).join('')}
      <h5>Processes to include</h5>${e.processes.map((p) => `<label class="tog"><input type="checkbox" data-action="toggleReportProc" data-id="${p.id}" ${(r.processIds || []).includes(p.id) ? 'checked' : ''}> ${esc(p.name)}</label>`).join('') || '<p class="faint small">No processes.</p>'}
      ${field('report.summary', 'Executive summary', r.summary, { area: true })}
      ${field('report.nextSteps', 'Next steps (one per line)', r.nextSteps, { area: true })}
    </aside>
    <div class="report-preview"><div id="report-doc" class="rpt">${renderReport(e)}</div></div>
  </div>`;
}
