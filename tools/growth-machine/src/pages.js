/* ============================================================
   The seven pages. Each answers one question for TGM:
   Home (what's leaking and what needs me), Plan (what we suggest and what it saves), Processes (where work breaks),
   Evidence (what proves it), Conversations (who we ask what next), Progress & reports (are we on track),
   Sources & data (where every number comes from). Older page ids still work: they redirect here.
   ============================================================ */
const TAB_ALIAS = {
  overview: ['home'], leaks: ['home'], crossover: ['home'],
  recs: ['plan'], scenarios: ['plan'],
  finance: ['evidence', 'money'], business: ['evidence', 'clients'], org: ['evidence', 'people'], tools: ['evidence', 'tools'], competitors: ['evidence', 'market'],
  interviews: ['talk', 'interviews'], discovery: ['talk', 'discovery'],
  report: ['progress', 'report']
};
const SUBTABS = {
  evidence: [['money', 'Money'], ['clients', 'Clients'], ['people', 'People'], ['tools', 'Tools'], ['market', 'Market']],
  talk: [['people', 'By person'], ['interviews', 'Interviews'], ['discovery', 'Discovery']],
  progress: [['progress', 'Progress & time'], ['report', 'Reports']]
};
/** Pages where "View as" (current state or a scenario) changes what is shown. */
const SCENARIO_TABS = ['plan', 'evidence', 'processes'];

function normaliseTab() {
  ui.sub = ui.sub || {};
  const a = TAB_ALIAS[ui.tab];
  if (a) { ui.tab = a[0]; if (a[1]) ui.sub[a[0]] = a[1]; }
  if (!TABS.some((t) => t[0] === ui.tab)) ui.tab = 'home';
  Object.keys(SUBTABS).forEach((t) => { if (!SUBTABS[t].some((s) => s[0] === ui.sub[t])) ui.sub[t] = SUBTABS[t][0][0]; });
}
const subOf = (t) => (ui.sub || {})[t] || SUBTABS[t][0][0];
function subBar(t) {
  return `<nav class="subnav">${SUBTABS[t].map(([id, n]) => `<button class="sub-btn ${subOf(t) === id ? 'on' : ''}" data-action="sub" data-tab="${t}" data-id="${id}">${n}</button>`).join('')}</nav>`;
}

/* ---------- "Top 5, then Show all" for long lists ---------- */
const TOP_N = 5;
function topN(key, list, n = TOP_N) { ui.all = ui.all || {}; return ui.all[key] ? list : list.slice(0, n); }
function showAllBtn(key, total, n = TOP_N) {
  if (total <= n) return '';
  const on = (ui.all || {})[key];
  return `<div class="show-all"><button class="link" data-action="showAll" data-id="${esc(key)}">${on ? 'Show the top ' + n + ' only' : `Show all ${total}`}</button></div>`;
}

/* ---------- Home: needs your input ---------- */
function needsInput(e, all) {
  const g = e.engagement || {}; const today = todayISO();
  const st = (g.phases || []).length ? engagementStatus(e) : null;
  const overdue = st ? st.overdue : [];
  const noFix = all.filter((x) => !x.fix && !x.next && x.src !== 'signal').length;
  const unsized = all.filter((x) => !x.value && x.src !== 'signal').length;
  const stale = (g.activities || []).filter((a) => a.status !== 'Done' && a.due && a.due < today && !(ui.share && a.private));
  const L = ui.lo || {};
  const chip = (n, label, attrs, tip, on) => n ? `<button class="need ${on ? 'on' : ''}" ${attrs} title="${esc(tip)}"><b>${n}</b> ${label}</button>` : '';
  const chips = [
    chip(overdue.length, `overdue from the client`, 'data-action="tab" data-id="progress"', overdue.slice(0, 4).map((r) => r.item).join(' · ')),
    chip(noFix, 'with no action yet', 'data-action="loNeed" data-k="noFix"', 'Each needs a recommendation, a question for a named role, or a data request. Click to filter the list.', L.noFix),
    chip(unsized, 'not sized', 'data-action="loNeed" data-k="unsized"', 'Add a rand figure, even a rough one, so they can be ranked. Click to filter the list.', L.unsized),
    chip(stale.length, 'to-dos past their date', 'data-action="tab" data-id="progress"', stale.slice(0, 4).map((a) => a.title).join(' · '))
  ].filter(Boolean);
  return `<div class="needs"><span class="needs-h">Needs your input</span>${chips.length ? chips.join('') : '<span class="faint small">Nothing right now.</span>'}</div>`;
}

/* ---------- Plan: recommendations by stage, the savings tracker, scenarios ---------- */
function viewPlan(e) {
  const sv = savingsTracker(e); const rows = scoreRecommendations(e);
  const stageOf = (r) => (REC_STAGES.includes(r.rec.status) ? r.rec.status : 'Identified');
  const groups = [['Identified', 'Identified: our suggestions, for the client to decide'], ['Approved', 'Approved by the client'], ['In progress', 'In progress'], ['Realised', 'Realised: saving or gain confirmed']];
  const head = '<thead><tr><th>#</th><th>Recommendation</th><th>Score</th><th class="r">Value / yr</th><th class="r">Hours freed / mo</th><th class="r">One-off</th><th class="r">Payback</th><th>Stage</th></tr></thead>';
  const row = (r, i) => `<tr class="${r.rec.status === 'Rejected' ? 'row-removed' : ''}"><td>${i + 1}</td><td><strong>${esc(r.rec.title)}</strong> <span class="chip">${esc(r.rec.type || '—')}</span> <span class="chip">${esc(r.rec.horizon || '—')}</span>
      <div class="muted small">${esc(trunc(r.rec.description || '', 260))}</div>
      <div class="small plan-stick">${r.rec.stick ? `<b>How it sticks:</b> ${esc(r.rec.stick)}` : '<span class="chip lo-nofix">How it sticks: not set</span> <span class="faint">system, ease, visibility, incentive, owner</span>'}${r.rec.owner ? ` · <b>Owner:</b> ${esc(r.rec.owner)}` : ''}</div></td>
    <td><div class="score-bar"><span style="width:${r.score}%"></span></div><span class="small">${r.score}</span></td>
    <td class="r">${fmtMoney(r.cash + r.revenue)}</td><td class="r">${Math.round(r.hoursSaved)}</td><td class="r">${fmtMoney(r.oneOff)}</td><td class="r">${r.payback == null ? '—' : r.payback.toFixed(1) + ' mo'}</td>
    <td><select data-cell data-coll="recommendations" data-id="${r.rec.id}" data-field="status">${REC_STAGES.map((s) => `<option ${r.rec.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`;
  const block = ([stage, title]) => {
    const list = rows.filter((r) => stageOf(r) === stage); if (!list.length) return '';
    const key = 'plan_' + stage;
    return card(`${title} (${list.length})`, `<table class="tbl recs">${head}<tbody>${topN(key, list).map(row).join('')}</tbody></table>${showAllBtn(key, list.length)}`, { cls: 'scroll-x' });
  };
  const rejected = rows.filter((r) => r.rec.status === 'Rejected');
  const impacts = e.scenarios.map((s) => ({ s, i: scenarioImpact(e, s.id) }));
  const scenTable = impacts.length ? `<table class="tbl"><thead><tr><th>Scenario</th><th class="r">Headcount Δ</th><th class="r">Cash saving / yr</th><th class="r">Revenue uplift</th><th class="r">Hours freed / mo</th><th class="r">One-off</th><th class="r">Payback</th><th></th></tr></thead><tbody>
    ${impacts.map(({ s, i }) => `<tr><td><strong>${esc(s.name)}</strong><div class="muted small">${esc(s.description || '')}</div></td><td class="r">${i.headcountDelta}</td><td class="r">${fmtMoney(i.cashSaving)}</td><td class="r">${fmtMoney(i.revenueUplift)}</td><td class="r">${hrs(i.hoursSaved)}</td><td class="r">${fmtMoney(i.oneOff)}</td><td class="r">${i.paybackMonths == null ? '—' : i.paybackMonths.toFixed(1) + ' mo'}</td><td><button class="btn sm" data-action="setScenario" data-id="${s.id}">View</button></td></tr>`).join('')}</tbody></table>` : empty('No scenarios yet.');
  const builder = e.scenarios.length ? `<table class="tbl"><thead><tr><th>Recommendation</th>${e.scenarios.map((s) => `<th class="c"><input class="inline" data-cell data-coll="scenarios" data-id="${s.id}" data-field="name" value="${esc(s.name)}"></th>`).join('')}</tr></thead><tbody>
    ${rows.map((r) => `<tr><td>${esc(r.rec.title)} <span class="faint small">(score ${r.score})</span></td>${e.scenarios.map((s) => `<td class="c"><input type="checkbox" data-action="toggleRecInScenario" data-scenario="${s.id}" data-rec="${r.rec.id}" ${splitList(s.recommendationIds).includes(r.rec.id) ? 'checked' : ''}></td>`).join('')}</tr>`).join('')}
    <tr><td></td>${e.scenarios.map((s) => `<td class="c"><button class="btn sm ghost" data-action="delScenario" data-id="${s.id}" title="Delete scenario">✕</button></td>`).join('')}</tr></tbody></table>` : '';
  return `${scenarioBanner(e)}<div class="page-h"><div><span class="eyebrow">Plan</span><h1>What we suggest, and what it saves</h1><p class="muted">Recommendations are suggestions for the client to decide, ordered from identified to realised. Each says how it will stick. Only approved and realised savings count towards the target.</p></div>
    <div class="btn-row"><button class="btn" data-action="addRec">+ Add recommendation</button></div></div>
  ${sv.target ? card('Savings against the target', savingsBlock(sv, { rows: false }), { sub: 'Monthly recurring savings, net of new recurring costs. Stage comes from each recommendation.' }) : ''}
  ${groups.map(block).join('')}
  ${rejected.length ? `<details class="card"><summary class="small"><b>Rejected (${rejected.length})</b></summary><table class="tbl recs">${head}<tbody>${rejected.map(row).join('')}</tbody></table></details>` : ''}
  ${card('Scenarios: bundles of recommendations', `<div class="scroll-x">${scenTable}</div>
    <details class="small"><summary><b>Build or edit scenarios</b></summary><div class="btn-row"><button class="btn sm" data-action="addScenario">+ Add scenario</button></div><div class="scroll-x">${builder}</div></details>`,
    { sub: 'A scenario is the current state with a set of recommendations applied. "View" switches Processes and Evidence to it.' })}
  <p class="muted small">Score = 50% value, 20% low effort, 15% low risk, 15% confidence. Value = cash saving + revenue uplift + half the value of freed hours (freed hours are capacity, not cash, unless headcount changes). Edit details, "how it sticks", owner and modelled changes in Sources &amp; data → Recommendations.</p>`;
}

/* ---------- Evidence: the detail behind findings ---------- */
function viewEvidence(e) {
  const s = subOf('evidence');
  const body = s === 'money' ? viewFinance(e) : s === 'clients' ? viewBusiness(e) : s === 'people' ? viewOrg(e) + peopleCrossCards(e) : s === 'tools' ? viewTools(e) : viewCompetitors(e) + profileCard(e);
  return subBar('evidence') + body;
}

/** Department scorecard and who carries which process (formerly on the Crossover page). */
function peopleCrossCards(e) {
  const st = stateFor(e, ui.scenario);
  const sc = departmentScorecard(e, st);
  const people = live(st.people).filter((p) => personLoad(st)[p.id]);
  const procs = live(st.processes);
  const matrix = people.map((p) => procs.map((pr) => sum(live(pr.steps).filter((x) => x.actorId === p.id && !x.automated), (x) => stepHours(x, pr))));
  const maxPay = Math.max(1, ...sc.map((d) => d.payroll + d.toolSpend));
  return `${card('Department scorecard', sc.length ? `<table class="tbl"><thead><tr><th>Department</th><th class="r">People</th><th>People + tool cost / yr</th><th class="r">Processes</th><th class="r">Process hrs/mo</th><th class="r">Manual</th><th class="r">Pain points raised</th></tr></thead><tbody>
    ${sc.map((d) => `<tr><td><i class="swatch" style="background:${deptColor(e.departments, d.dept.id)}"></i>${esc(d.dept.name)}</td><td class="r">${d.headcount}</td><td><div class="inline-bar"><span style="width:${(d.payroll + d.toolSpend) / maxPay * 100}%"></span></div>${fmtMoney(d.payroll + d.toolSpend)}</td><td class="r">${d.processes}</td><td class="r">${Math.round(d.hours)}</td><td class="r">${d.hours ? pct(d.manualPct) : '—'}</td><td class="r">${d.pain}</td></tr>`).join('')}</tbody></table>` : empty('Add departments.'), { cls: 'scroll-x', sub: 'Crosses people, tools, processes and interview pain points for each department.' })}
  ${people.length && procs.length ? card('Who carries which process (hours / month)', heatmap(people.map((p) => ui.anon ? p.title : p.name), procs.map((p) => p.name), matrix, { fmt: (v) => Math.round(v) }), { cls: 'scroll-x', sub: 'Darker means more hours. Look for one person carrying a whole process, or senior people doing manual work.' }) : ''}`;
}

/* ---------- Conversations ---------- */
/** An answer that starts with "Partly" records what is known so far; the question stays open until it is fully answered. */
const isPartly = (v) => /^\s*partly\b/i.test(String(v || ''));
/** Every recorded answer, by question id, from every interview (an answer can come from someone other than the person the question was set for). */
function answerIndex(e, skipId) {
  const ix = {};
  e.interviews.forEach((iv) => { if (skipId && iv.id === skipId) return; Object.entries(iv.answers || {}).forEach(([k, v]) => { if (String(v || '').trim()) (ix[k] = ix[k] || []).push({ v: String(v), date: iv.date, pid: iv.personId, partly: isPartly(v) }); }); });
  return ix;
}
function viewTalk(e) {
  if (ui.capture || ui.session) return viewDiscovery(e);
  const s = subOf('talk');
  return subBar('talk') + (s === 'interviews' ? viewInterviews(e) : s === 'discovery' ? viewDiscovery(e) : talkPeople(e));
}
/** Does a request owner (free text such as "Gabby / Genevieve" or "Head of Client Operations") name this person? */
function ownerMatches(owner, p) {
  const o = String(owner || '').toLowerCase(); if (!o) return false;
  const tokens = o.split(/[^a-z]+/).filter(Boolean);
  const name = String(p.name || '').toLowerCase(); const first = name.split(/[\s(]+/)[0];
  const nick = (name.match(/\(([^)]+)\)/) || [])[1];
  const title = String(p.title || '').toLowerCase();
  const acro = String(p.title || '').split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join('').toLowerCase();
  return (first && tokens.includes(first)) || (nick && tokens.includes(nick)) || (title.length > 6 && o.includes(title)) || (acro.length >= 2 && tokens.includes(acro));
}
function talkPeople(e) {
  const pById = byId(e.people); const qs = e.customQuestions || [];
  const nm = (p) => (ui.anon ? p.title || 'Role' : p.name);
  const AX = answerIndex(e);
  const ansOf = (q) => { let list = AX[q.id] || []; if (ui.share) list = list.filter((a) => a.pid === q.personId); return list.length ? { list, done: list.some((a) => !a.partly) } : null; };
  const isDone = (q) => !!(ansOf(q) || {}).done;
  const ids = [...new Set([...qs.map((q) => q.personId), ...e.interviews.map((i) => i.personId)])].filter((id) => pById[id]);
  const stats = ids.map((id) => { const mine = qs.filter((q) => q.personId === id); const open = mine.filter((q) => !isDone(q));
    return { p: pById[id], n: mine.length, open: open.length, partly: open.filter((q) => ansOf(q)).length, star: open.filter((q) => q.p).length, ivs: e.interviews.filter((i) => i.personId === id).length }; })
    .sort((a, b) => b.star - a.star || b.open - a.open || (a.p.name || '').localeCompare(b.p.name || ''));
  if (!stats.length) return `<div class="page-h"><div><span class="eyebrow">Conversations</span><h1>Who we ask what next</h1></div></div>${empty('No questions or interviews yet. Prepare questions with Claude (customQuestions) or capture an interview.')}`;
  const sel = stats.some((x) => x.p.id === ui.talkP) ? ui.talkP : stats[0].p.id; const p = pById[sel];
  const mine = qs.filter((q) => q.personId === sel).map((q, i) => [q, i]).sort((a, b) => ((a[0].ord ?? 1e6 + a[1]) - (b[0].ord ?? 1e6 + b[1]))).map((x) => x[0]);
  const shown = ui.talkOpen ? mine.filter((q) => !isDone(q)) : mine;
  let sec = '';
  const qList = shown.map((q) => { const h = q.section && q.section !== sec ? `<h5>${esc((sec = q.section))}</h5>` : ''; const a = ansOf(q);
    return `${h}<div class="tq ${a ? (a.done ? 'tq-done' : 'tq-part') : ''}"><div>${q.p ? '<b class="star">★</b> ' : ''}${esc(q.q)} <span class="chip">${esc((CRITERIA.find((c) => c.id === q.crit) || {}).label || q.crit || "")}</span>${q.qWas ? ` <span class="faint small" title="Originally: ${esc(q.qWas)}">· narrowed to what's still missing</span>` : ''}</div>${q.note ? `<div class="faint small">${esc(q.note)}</div>` : ''}${a ? a.list.map((x) => `<div class="${x.partly ? 'tq-p' : 'tq-a'} small"><b>${x.partly ? 'Partly answered' : 'Answered'}${x.pid !== q.personId && pById[x.pid] ? ' by ' + esc(ui.anon ? pById[x.pid].title || 'another person' : pById[x.pid].name + (pById[x.pid].title ? ' (' + pById[x.pid].title + ')' : '')) : ''}${x.date ? ' · ' + esc(fmtD(x.date)) : ''}:</b> ${esc(trunc(x.v.replace(/^\s*partly\b[:\s-]*/i, ''), 600))}</div>`).join('') : ''}</div>`; }).join('');
  const reqs = ((e.engagement || {}).requests || []).filter((r) => !r.receivedDate && ownerMatches(r.owner, p));
  const ivs = e.interviews.filter((i) => i.personId === sel).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const st = stats.find((x) => x.p.id === sel);
  return `<div class="page-h"><div><span class="eyebrow">Conversations</span><h1>Who we ask what next</h1><p class="muted">Pick a person: what to ask them (★ first), what they have already answered, and what they owe us.</p></div></div>
  <div class="talk">
    <aside class="card talk-list">${stats.map((x) => `<button class="talk-p ${x.p.id === sel ? 'on' : ''}" data-action="talkP" data-id="${esc(x.p.id)}"><b>${esc(nm(x.p))}</b><span class="faint small">${ui.anon ? '' : esc(x.p.title || '')}</span><span class="small">${x.open ? `${x.open} to ask${x.star ? ` · <b class="star">★</b> ${x.star}` : ''}` : '<span class="faint">all answered</span>'}${x.ivs ? ` · ${x.ivs} interview${x.ivs > 1 ? 's' : ''}` : ''}</span></button>`).join('')}</aside>
    <div>
      ${card(`${esc(nm(p))}${!ui.anon && p.title ? ` <span class="faint small">· ${esc(p.title)}</span>` : ''}`, `
        <div class="btn-row"><button class="btn" data-action="startCapture" data-id="${esc(sel)}">▶ Start interview</button>${ivs.map((iv) => `<button class="btn sm ghost" data-action="editInterview" data-id="${esc(iv.id)}">Open interview ${esc(fmtD(iv.date) || '')}</button>`).join('')}
          <label class="small tog"><input type="checkbox" data-ui="talkOpen" ${ui.talkOpen ? 'checked' : ''}> Still to ask only</label></div>
        <p class="small muted">${st.n} questions · ${st.n - st.open} answered · ${st.open} to ask${st.star ? ` (${st.star} starred)` : ''}${st.partly ? ` · ${st.partly} of those partly answered` : ''}</p>
        ${reqs.length ? `<div class="talk-reqs"><b class="small">Waiting on them (${reqs.length})</b><ul>${reqs.map((r) => `<li class="small">${esc(r.item)}${r.dueDate ? ` <span class="faint">· due ${esc(fmtD(r.dueDate))}</span>` : ''}</li>`).join('')}</ul></div>` : ''}
        <div class="talk-qs">${qList || empty(ui.talkOpen ? 'Everything prepared for them has been answered.' : 'No prepared questions for this person.')}</div>`)}
    </div>
  </div>`;
}

/* ---------- Progress & reports ---------- */
function viewProgressReports(e) {
  return subBar('progress') + (subOf('progress') === 'report' ? viewReport(e) : viewProgress(e));
}

/* ---------- Sources & data: the source register ---------- */
function sourcesCard(e) {
  const src = (e.sources || []).slice().sort((a, b) => String(b.received || '').localeCompare(String(a.received || '')));
  if (!src.length) return '';
  return card(`Source register (${src.length})`, `<div class="scroll-x"><table class="tbl"><thead><tr><th>Source</th><th>Type</th><th>From</th><th>Information as of</th><th>Received</th><th>Via</th></tr></thead><tbody>
    ${topN('sources', src, 8).map((s) => `<tr><td><strong>${esc(s.name || s.id)}</strong>${s.notes ? `<div class="faint small">${esc(trunc(s.notes, 140))}</div>` : ''}</td><td>${esc(s.type || '')}</td><td>${esc(s.from || '')}${s.person && !ui.anon ? ` <span class="faint small">(${esc(s.person)})</span>` : ''}</td><td>${esc(s.asOf || '')}</td><td>${esc(s.received || '')}</td><td>${esc(s.via || '')}</td></tr>`).join('')}
    </tbody></table></div>${showAllBtn('sources', src.length, 8)}`, { sub: 'Every finding and feedback item cites these. Edit them under Edit data → Sources.' });
}
