/* ============================================================
   The pages. Home (home.js: what needs me, the board, departments, my days, waiting on), Processes (where work breaks),
   Evidence (what proves it), Conversations (who we ask what next), Progress & reports (are we on track),
   Sources & data (where every number comes from). Older page ids still work: they redirect here.
   ============================================================ */
const TAB_ALIAS = {
  overview: ['hub'], leaks: ['hub'], crossover: ['hub'], home: ['hub'], moves: ['hub'], plan: ['hub'], dept: ['hub'], stage: ['hub'],
  recs: ['hub'], scenarios: ['hub'],
  finance: ['evidence', 'money'], business: ['evidence', 'clients'], org: ['evidence', 'people'], tools: ['evidence', 'tools'], competitors: ['evidence', 'market'],
  interviews: ['talk', 'interviews'], discovery: ['talk', 'discovery'],
  report: ['progress', 'report']
};
const SUBTABS = {
  evidence: [['insights', 'Insights'], ['value', 'True value'], ['growth', 'Client growth (NRR)'], ['money', 'Money'], ['clients', 'Clients'], ['people', 'People'], ['tools', 'Tools'], ['market', 'Market']],
  talk: [['people', 'By person'], ['interviews', 'Interviews'], ['discovery', 'Discovery']],
  progress: [['progress', 'Progress & time'], ['report', 'Reports']]
};
/** Pages where "View as" (current state or a scenario) changes what is shown. */
const SCENARIO_TABS = ['evidence', 'processes'];

function normaliseTab() {
  ui.sub = ui.sub || {};
  const a = TAB_ALIAS[ui.tab];
  if (a) { ui.tab = a[0]; if (a[1]) ui.sub[a[0]] = a[1]; }
  if (!TABS.some((t) => t[0] === ui.tab)) ui.tab = 'hub';
  Object.keys(SUBTABS).forEach((t) => { if (!SUBTABS[t].some((s) => s[0] === ui.sub[t])) ui.sub[t] = SUBTABS[t][0][0]; });
}
const subOf = (t) => { const s = (ui.sub || {})[t] || SUBTABS[t][0][0]; return PORTAL_ON && t === 'evidence' && (s === 'insights' || s === 'value') ? 'growth' : s; };
function subBar(t) {
  return `<nav class="subnav">${SUBTABS[t].filter(([id]) => !(PORTAL_ON && t === 'evidence' && (id === 'insights' || id === 'value'))).map(([id, n]) => `<button class="sub-btn ${subOf(t) === id ? 'on' : ''}" data-action="sub" data-tab="${t}" data-id="${id}">${n}</button>`).join('')}</nav>`;
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
    chip(noSrcCount(e), 'figures with no source', 'data-action="loNeed" data-k="nosrc"', 'Items that state a number, rand value or time with no source behind it. Click to filter the leaks; recommendations and automations show "No source yet".', L.nosrc),
    chip(unlinkedAutos(e).length, 'automations not linked to a fix', `data-action="goAuto" data-id="${esc((unlinkedAutos(e)[0] || {}).id || '')}"`, unlinkedAutos(e).slice(0, 4).map((a) => a.title).join(' · ')),
    chip(lrUnseen(e), 'new report comments and flags', 'data-action="lrOpen"', 'From recipients of the live report. Click to read them.'),
    chip(stale.length, 'to-dos past their date', 'data-action="tab" data-id="progress"', stale.slice(0, 4).map((a) => a.title).join(' · '))
  ].filter(Boolean);
  return `<div class="needs"><span class="needs-h">Needs your input</span>${chips.length ? chips.join('') : '<span class="faint small">Nothing right now.</span>'}</div>`;
}


/* ---------- Evidence: the detail behind findings ---------- */
function viewEvidence(e) {
  const s = subOf('evidence');
  const body = s === 'insights' ? viewEnhanced(e) : s === 'value' ? viewTrueValue(e) : s === 'growth' ? viewNRR(e) : s === 'money' ? viewFinance(e) : s === 'clients' ? viewBusiness(e) : s === 'people' ? viewOrg(e) + peopleCrossCards(e) : s === 'tools' ? viewTools(e) : viewCompetitors(e) + profileCard(e);
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
  const cc = citeCounts(e);
  return card(`Source register (${src.length})`, `<div class="scroll-x"><table class="tbl"><thead><tr><th>Source</th><th>Type</th><th>From</th><th>Information as of</th><th>Received</th><th>Via</th><th class="r">Cited by</th></tr></thead><tbody>
    ${topN('sources', src, 8).map((s) => `<tr id="src-${esc(s.id)}"><td><strong>${s.link ? `<a href="${esc(s.link)}" target="_blank" rel="noopener">${esc(s.name || s.id)}</a>` : esc(s.name || s.id)}</strong>${s.notes ? `<div class="faint small">${esc(trunc(s.notes, 140))}</div>` : ''}</td><td>${esc(s.type || '')}</td><td>${esc(s.from || '')}${s.person && !ui.anon ? ` <span class="faint small">(${esc(s.person)})</span>` : ''}</td><td>${esc(s.asOf || '')}</td><td>${esc(s.received || '')}</td><td>${esc(s.via || '')}</td><td class="r">${cc[s.id] || 0}</td></tr>`).join('')}
    </tbody></table></div>${showAllBtn('sources', src.length, 8)}`, { sub: 'Every figure in findings, recommendations, automations and feedback should point here. "Cited by" counts the items that use each source. Edit them under Edit data → Sources.' });
}
