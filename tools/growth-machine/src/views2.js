/* ============================================================
   Progress & time, Discovery (coverage, founder intake, interview capture), Status report
   ============================================================ */
const sel = (opts, v, attrs, blank = true) => `<select ${attrs}>${blank ? '<option value=""></option>' : ''}${opts.map((o) => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(lab)}</option>`; }).join('')}</select>`;
const ecell = (coll, row, field, type = 'text', extra = '') => `<input data-cell data-coll="${coll}" data-id="${esc(row.id)}" data-field="${field}" data-type="${type === 'number' ? 'num' : type}" type="${type}" value="${esc(row[field])}" ${extra}>`;
const ecellSel = (coll, row, field, opts, blank = true) => sel(opts, row[field], `data-cell data-coll="${coll}" data-id="${esc(row.id)}" data-field="${field}"`, blank);
const ecellArea = (coll, row, field, rows = 2) => `<textarea data-cell data-coll="${coll}" data-id="${esc(row.id)}" data-field="${field}" rows="${rows}">${esc(row[field])}</textarea>`;
const delBtn = (coll, id) => `<button class="btn sm ghost" data-action="delRow" data-coll="${coll}" data-id="${esc(id)}" title="Delete">✕</button>`;
const reqChip = (s) => ({ Received: '<span class="chip st-added">✓ Received</span>', Overdue: '<span class="chip st-removed">▲ Overdue</span>', Waiting: '<span class="chip">○ Waiting</span>' }[s] || `<span class="chip">${esc(s)}</span>`);
const phaseChip = (s) => ({ Done: '<span class="chip st-added">✓ Done</span>', 'In progress': '<span class="chip sev-high">● In progress</span>', 'On hold': '<span class="chip st-changed">❚❚ On hold</span>' }[s] || '<span class="chip">○ Not started</span>');

/* ---------- Gantt (phases, slips, reviews, today) ---------- */
function phaseGantt(e, { compact = false } = {}) {
  const g = e.engagement; if (!g.phases.length || !g.start || !g.end) return '';
  const st = engagementStatus(e);
  const s = new Date(g.start + 'T00:00:00').getTime(), en = new Date(g.end + 'T00:00:00').getTime() + 864e5;
  const W = 900, LW = compact ? 230 : 260, RH = 30, TOP = 22;
  const x = (iso) => LW + (new Date(iso + 'T00:00:00').getTime() - s) / (en - s) * (W - LW - 10);
  const H = TOP + g.phases.length * RH + 8;
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="gantt-svg" role="img" aria-label="Engagement timeline">`;
  [0, 1, 2, 3].forEach((k) => { const d = new Date(g.start + 'T00:00:00'); d.setMonth(d.getMonth() + k); const iso = d.toISOString().slice(0, 10); if (iso > g.end) return; svg += `<line class="g-grid" x1="${x(iso)}" x2="${x(iso)}" y1="${TOP - 4}" y2="${H}"/><text class="g-lab" x="${x(iso) + 4}" y="12">Month ${k + 1} · ${fmtD(iso)}</text>`; });
  splitList(g.reviewDates).forEach((r) => { if (r >= g.start && r <= g.end) svg += `<line class="g-review" x1="${x(r)}" x2="${x(r)}" y1="${TOP - 4}" y2="${H}"><title>Fortnightly review ${fmtD(r)}</title></line>`; });
  g.phases.forEach((p, i) => {
    const y = TOP + i * RH; const slip = num(st.slipByPhase[p.id]);
    const cls = p.status === 'Done' ? 'done' : p.status === 'In progress' ? 'doing' : p.status === 'On hold' ? 'hold' : 'todo';
    svg += `<text class="g-name" x="0" y="${y + 19}">${esc(trunc(p.name, compact ? 34 : 40))}</text>`;
    if (p.start && p.end) {
      const x1 = x(p.start), x2 = x(addDaysISO(p.end, 1));
      svg += `<rect class="g-bar ${cls}" x="${x1}" y="${y + 7}" width="${Math.max(4, x2 - x1)}" height="16" rx="4" data-tip="${esc(p.name)} · ${fmtD(p.start)}–${fmtD(p.end)} · ${p.status} · ${num(p.plannedDays)} days planned, ${num(st.byPhase[p.id] || 0)} used"/>`;
      if (slip > 0) { const x3 = x(addDaysISO(p.end, 1 + slip)); const dl = e.engagement.delays.filter((d) => d.phaseId === p.id).map((d) => `${d.cause}: +${num(d.daysImpact)}d`).join(' · '); svg += `<rect class="g-slip" x="${x2}" y="${y + 7}" width="${Math.max(4, x3 - x2)}" height="16" rx="3" data-tip="⚑ Slipped ${slip} days · ${esc(dl)}"/><text class="g-sliplab" x="${x3 + 4}" y="${y + 19}">⚑ +${slip}d</text>`; }
    }
  });
  if (st.today >= g.start && st.today <= g.end) svg += `<line class="g-today" x1="${x(st.today)}" x2="${x(st.today)}" y1="${TOP - 8}" y2="${H}"/><text class="g-todaylab" x="${x(st.today) + 3}" y="${H - 2}">Today</text>`;
  return `<div class="chart gantt-wrap">${svg}</div><div class="legend"><span><i style="background:var(--ink)"></i>Done</span><span><i style="background:var(--red)"></i>In progress</span><span><i style="background:var(--grid);outline:1px solid var(--faint)"></i>Not started</span><span><i class="hatch"></i>⚑ Slip from logged delays</span><span><i style="background:transparent;border-left:2px dashed var(--red);border-radius:0"></i>Fortnightly review</span></div>`;
}

/* ---------- Progress & time ---------- */
function viewProgress(e) {
  const g = e.engagement;
  if (!g.phases.length) {
    return `<div class="page-h"><div><span class="eyebrow">Progress & time</span><h1>Set up the engagement</h1><p class="muted">Enter the contract basics. The Studio then creates the standard three-month plan, the client information requests and the first activities. You can edit everything afterwards.</p></div></div>
    ${card('Contract basics', `<div class="form-grid">
      ${field('engagement.contact', 'Client point of contact (decision-maker)', g.contact)}${field('engagement.contactRole', 'Their role', g.contactRole)}
      ${field('engagement.start', 'Start date', g.start, { type: 'date' })}${field('engagement.end', 'End date', g.end, { type: 'date' })}
      ${field('engagement.daysTotal', 'Consulting days in total', g.daysTotal, { type: 'number' })}${field('engagement.daysPerMonth', 'Days per contract month', g.daysPerMonth, { type: 'number' })}
      ${field('engagement.targetMonthly', 'Monthly recurring savings target', g.targetMonthly, { type: 'number' })}${field('engagement.reviewDates', 'Review dates (optional, comma separated)', g.reviewDates, { ph: 'Calculated if left blank' })}
    </div><div class="btn-row"><button class="btn" data-action="seedPlan">Create plan</button></div>`)}`;
  }
  const st = engagementStatus(e); const sv = savingsTracker(e);
  const monthUsed = num(st.byMonth[st.thisMonth] || 0);
  const overMonth = monthUsed > num(g.daysPerMonth);
  const phaseOpts = g.phases.map((p) => [p.id, p.name]);
  const pName = (id) => (g.phases.find((p) => p.id === id) || {}).name || '—';
  const flag = st.openDelays.length || st.totalSlip > 0;

  const kpis = `<div class="kpis">
    ${kpi('Current phase', esc(st.current ? st.current.name : '—'), st.current ? `<div class="k-delta">${fmtD(st.current.start)} – ${fmtD(st.current.end)}</div>` : '')}
    ${kpi('Consulting days used', `${st.used.toFixed(1)} / ${num(g.daysTotal)}`, `<div class="k-delta ${st.remaining < 0 ? 'delta-bad' : ''}">${st.remaining.toFixed(1)} remaining</div>`)}
    ${kpi(`Contract month ${Math.max(1, st.thisMonth)}`, `${monthUsed.toFixed(1)} / ${num(g.daysPerMonth)}`, `<div class="k-delta ${overMonth ? 'delta-bad' : ''}">${overMonth ? '▲ over the monthly allowance' : 'days this month'}</div>`)}
    ${kpi('Term elapsed', st.termDays ? pct(st.elapsed / st.termDays * 100) : '—', `<div class="k-delta">${st.daysLeftInTerm} calendar days to ${fmtD(g.end)}</div>`)}
    <div class="kpi ${flag ? 'kpi-flag' : ''}"><div class="k-label">⚑ Delays & changes</div><div class="k-value">${st.openDelays.length} open</div><div class="k-delta ${st.totalSlip > 0 ? 'delta-bad' : ''}">${st.totalSlip > 0 ? `+${st.totalSlip} days total slip` : 'no slip logged'}</div></div>
    <div class="kpi ${st.overdue.length ? 'kpi-flag' : ''}"><div class="k-label">Waiting on client</div><div class="k-value">${st.reqs.filter((r) => r._status === 'Waiting' || r._status === 'Overdue').length}</div><div class="k-delta ${st.overdue.length ? 'delta-bad' : ''}">${st.overdue.length} overdue</div></div>
    ${sv.target ? kpi('Savings approved / month', fmtMoney(sv.approved), `<div class="k-delta">target ${fmtMoney(sv.target)} · realised ${fmtMoney(sv.realised)}</div>`) : ''}
  </div>`;

  const delays = `<section class="card flag-card" id="delays"><header class="card-h"><div><h3>⚑ Delays & changes log</h3><p class="sub">Every slip, whatever the cause, with its date, reason, impact and the date written notice was given. This section appears in every status report. Log TGM-side slips too: that's what makes the log credible.</p></div><button class="btn" data-action="addDelay">+ Log delay / change</button></header>
    ${g.delays.length ? `<div class="scroll-x"><table class="tbl grid-edit"><thead><tr><th>Raised</th><th>Phase</th><th>Cause</th><th>What happened</th><th>Days impact</th><th>Written notice sent</th><th>Status</th><th>Resolution / action</th><th></th></tr></thead><tbody>
      ${g.delays.slice().sort((a, b) => (b.dateRaised || '').localeCompare(a.dateRaised || '')).map((d) => `<tr class="${d.status === 'Resolved' ? '' : 'row-flag'}"><td>${ecell('engagement.delays', d, 'dateRaised', 'date')}</td><td>${ecellSel('engagement.delays', d, 'phaseId', phaseOpts)}</td><td>${ecellSel('engagement.delays', d, 'cause', DELAY_CAUSES)}</td><td>${ecellArea('engagement.delays', d, 'description')}</td><td>${ecell('engagement.delays', d, 'daysImpact', 'number', 'style="width:70px"')}</td><td>${ecell('engagement.delays', d, 'noticeDate', 'date')}</td><td>${ecellSel('engagement.delays', d, 'status', ['Open', 'Resolved'], false)}</td><td>${ecellArea('engagement.delays', d, 'resolution')}</td><td>${delBtn('engagement.delays', d.id)}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="empty">No delays or changes logged. That will show as "none recorded" in status reports, which is itself worth reporting.</p>'}
    ${st.totalSlip > 0 ? `<p class="small delta-bad">⚑ ${st.totalSlip} days of slip logged. The contract end date (${fmtD(g.end)}) is fixed, so later phases are compressed unless an extension is agreed in writing (clauses 2.4 and 5.7).</p>` : ''}
  </section>`;

  const reqs = card(`Waiting on client (${st.reqs.filter((r) => r._status === 'Waiting' || r._status === 'Overdue').length} open · ${st.overdue.length} overdue)`, `<div class="scroll-x"><table class="tbl grid-edit"><thead><tr><th>Status</th><th>Item</th><th>Owner</th><th>Requested</th><th>Due</th><th>Received</th><th>Override</th><th>Notes</th><th></th></tr></thead><tbody>
    ${st.reqs.map((r) => `<tr class="${r._status === 'Overdue' ? 'row-flag' : ''}"><td>${reqChip(r._status)}${r._status === 'Overdue' ? `<div><button class="link small" data-action="delayFromRequest" data-id="${esc(r.id)}">⚑ Log as delay</button></div>` : ''}</td><td>${ecellArea('engagement.requests', r, 'item')}</td><td>${ecell('engagement.requests', r, 'owner')}</td><td>${ecell('engagement.requests', r, 'requestedDate', 'date')}</td><td>${ecell('engagement.requests', r, 'dueDate', 'date')}</td><td>${ecell('engagement.requests', r, 'receivedDate', 'date')}</td><td>${ecellSel('engagement.requests', r, 'status', ['Not needed', 'Not available'])}</td><td>${ecellArea('engagement.requests', r, 'notes')}</td><td>${delBtn('engagement.requests', r.id)}</td></tr>`).join('')}
    </tbody></table></div><div class="btn-row"><button class="btn sm" data-action="addRow" data-coll="engagement.requests">+ Add request</button></div>`, { sub: 'Requests become Overdue automatically after their due date. Log a delay when a late item holds up the work.' });

  const actCol = (title, list, empty) => `<div class="act-col"><h4>${title} (${list.length})</h4>${list.length ? list.map((a) => `<div class="act ${a.status === 'Waiting on client' ? 'act-wait' : ''}"><div class="act-top">${ecellArea('engagement.activities', a, 'title', 1)}</div><div class="act-meta">${ecellSel('engagement.activities', a, 'phaseId', phaseOpts)} ${ecell('engagement.activities', a, a.status === 'Done' ? 'doneDate' : 'due', 'date')} ${ecellSel('engagement.activities', a, 'status', ACTIVITY_STATUSES, false)} ${delBtn('engagement.activities', a.id)}</div></div>`).join('') : `<p class="empty">${empty}</p>`}</div>`;
  const acts = card('What\'s done, what\'s happening, what\'s next', `<div class="act-grid">${actCol('✓ Done', st.done, 'Nothing completed yet.')}${actCol('● In progress / waiting', st.doing, 'Nothing in progress.')}${actCol('→ Next', st.next, 'Nothing queued.')}</div><div class="btn-row"><button class="btn sm" data-action="addActivity">+ Add activity</button></div>`, { sub: 'Marking an activity Done stamps today\'s date automatically.' });

  const timeRows = g.timeLog.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const time = card(`Time log: ${st.used.toFixed(1)} of ${num(g.daysTotal)} days used`, `<div class="grid-2">
      <div><h4>By phase (used vs planned)</h4>${hbars(g.phases.map((p) => ({ label: p.name, value: num(st.byPhase[p.id] || 0), tip: `${num(st.byPhase[p.id] || 0)} used of ${num(p.plannedDays)} planned`, color: num(st.byPhase[p.id] || 0) > num(p.plannedDays) ? 'var(--crit)' : 'var(--s1)' })), { fmt: (v) => v.toFixed(1) + ' d', max: Math.max(1, ...g.phases.map((p) => Math.max(num(p.plannedDays), num(st.byPhase[p.id] || 0)))) })}</div>
      <div><h4>By contract month (allowance ${num(g.daysPerMonth)})</h4>${hbars([1, 2, 3].map((m) => ({ label: `Month ${m}`, value: num(st.byMonth[m] || 0), color: num(st.byMonth[m] || 0) > num(g.daysPerMonth) ? 'var(--crit)' : 'var(--s3)' })), { fmt: (v) => v.toFixed(1) + ' d', max: Math.max(num(g.daysPerMonth), ...Object.values(st.byMonth)) })}
      <p class="faint small">Unused Month-2 days may carry into Month 3 by written agreement; the total of ${num(g.daysTotal)} cannot increase (clause 3.4).</p></div></div>
    <div class="scroll-x"><table class="tbl grid-edit"><thead><tr><th>Date</th><th>Phase</th><th>Days</th><th>What was done</th><th>Notes</th><th></th></tr></thead><tbody>
    ${timeRows.map((t) => `<tr><td>${ecell('engagement.timeLog', t, 'date', 'date')}</td><td>${ecellSel('engagement.timeLog', t, 'phaseId', phaseOpts)}</td><td>${ecellSel('engagement.timeLog', t, 'days', ['0.25', '0.5', '0.75', '1'], false)}</td><td>${ecellArea('engagement.timeLog', t, 'activity', 1)}</td><td>${ecellArea('engagement.timeLog', t, 'notes', 1)}</td><td>${delBtn('engagement.timeLog', t.id)}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">No time logged yet.</td></tr>'}
    </tbody></table></div><div class="btn-row"><button class="btn sm" data-action="addTime">+ Log time</button></div>`, { sub: 'Logged in half days (8-hour day), as in the contract. Reported at every fortnightly review.' });

  const savings = sv.target ? card('Savings tracker (contract)', savingsBlock(sv), { sub: 'Monthly recurring savings, net of new recurring costs. Stage comes from each recommendation\'s status.' }) : '';

  const phases = card('Phases', `<div class="scroll-x"><table class="tbl grid-edit"><thead><tr><th>Phase</th><th>Start</th><th>End</th><th>Planned days</th><th>Used</th><th>Status</th><th>Deliverables</th></tr></thead><tbody>
    ${g.phases.map((p) => `<tr><td>${ecell('engagement.phases', p, 'name')}</td><td>${ecell('engagement.phases', p, 'start', 'date')}</td><td>${ecell('engagement.phases', p, 'end', 'date')}</td><td>${ecell('engagement.phases', p, 'plannedDays', 'number', 'style="width:70px"')}</td><td class="r">${num(st.byPhase[p.id] || 0).toFixed(1)}</td><td>${ecellSel('engagement.phases', p, 'status', PHASE_STATUSES, false)}</td><td>${ecellArea('engagement.phases', p, 'deliverables')}</td></tr>`).join('')}</tbody></table></div>
    <details class="small"><summary>Contract settings</summary><div class="form-grid">${field('engagement.contact', 'Point of contact', g.contact)}${field('engagement.contactRole', 'Role', g.contactRole)}${field('engagement.start', 'Start', g.start, { type: 'date' })}${field('engagement.end', 'End', g.end, { type: 'date' })}${field('engagement.daysTotal', 'Days total', g.daysTotal, { type: 'number' })}${field('engagement.daysPerMonth', 'Days / month', g.daysPerMonth, { type: 'number' })}${field('engagement.targetMonthly', 'Monthly savings target', g.targetMonthly, { type: 'number' })}${field('engagement.baselineMonthly', 'Agreed monthly cost baseline', g.baselineMonthly, { type: 'number' })}${field('engagement.reviewDates', 'Review dates', g.reviewDates)}</div></details>`);

  return `<div class="page-h"><div><span class="eyebrow">Progress & time</span><h1>Where the engagement stands</h1><p class="muted">Point of contact: <strong>${esc(g.contact || '—')}</strong>${g.contactRole ? ' · ' + esc(g.contactRole) : ''}. Next review: <strong>${esc(fmtD(splitList(g.reviewDates).find((d) => d >= st.today) || ''))}</strong>.</p></div>
    <div class="btn-row"><button class="btn" data-action="statusReport">Status report →</button></div></div>
    ${kpis}${card('Timeline', phaseGantt(e))}${delays}<div class="grid-2">${acts}${reqs}</div>${time}${savings}${phases}`;
}

function savingsBlock(sv) {
  const mx = Math.max(sv.target, sv.identified, 1);
  const bar = (v, c, label) => `<div class="sv-row"><span>${label}</span><div class="sv-track"><span style="width:${v / mx * 100}%;background:${c}"></span><i style="left:${sv.target / mx * 100}%" title="Target"></i></div><b>${fmtMoney(v)}</b></div>`;
  return `<div class="sv">${bar(sv.identified, 'var(--seq-3)', 'Identified')}${bar(sv.approved, 'var(--seq-5)', 'Approved')}${bar(sv.realised, 'var(--seq-7)', 'Realised')}
    <p class="small muted">Target ${fmtMoney(sv.target)}/month (marker line)${sv.baseline ? ` against an agreed baseline of ${fmtMoney(sv.baseline)}/month` : ' · baseline not yet agreed'}. Reported separately: one-off savings ${fmtMoney(sv.oneOffSavings)}; one-off costs of approved items ${fmtMoney(sv.oneOffCosts)}; time freed ${Math.round(sv.hours)} hrs/month (capacity, not cash).</p></div>
    ${sv.rows.length ? `<table class="tbl"><thead><tr><th>Initiative</th><th>Stage</th><th class="r">Net recurring / month</th><th class="r">One-off cost</th><th class="r">Hours freed / mo</th></tr></thead><tbody>${sv.rows.map((r) => `<tr class="${r.stage === 'Rejected' ? 'row-removed' : ''}"><td>${esc(r.rec.title)}</td><td><span class="chip ${r.stage === 'Realised' ? 'st-added' : r.stage === 'Approved' || r.stage === 'In progress' ? 'st-changed' : ''}">${esc(r.stage)}</span></td><td class="r ${r.monthlyNet < 0 ? 'delta-bad' : ''}">${fmtMoney(r.monthlyNet)}</td><td class="r">${fmtMoney(r.oneOffCost)}</td><td class="r">${Math.round(r.hoursMonth)}</td></tr>`).join('')}</tbody></table>` : ''}`;
}

/* ---------- Discovery: coverage, founder intake, interview capture ---------- */
function viewDiscovery(e) {
  if (ui.capture) return viewCapture(e);
  const cov = coverage(e); const mx = Math.max(1, ...cov.rows.flatMap((r) => r.counts));
  const cell = (n) => { if (!n) return '<td class="cov-0">—</td>'; const k = Math.min(6, Math.floor(n / mx * 6.999)); return `<td style="background:${SEQ[k]};color:${k >= 4 ? '#fff' : 'var(--ink)'}">${n}</td>`; };
  const covTable = `<table class="heat cov"><tr><th>Criterion</th>${cov.cols.map((c) => `<th>${c}</th>`).join('')}<th>Total</th><th>Feeds</th></tr>
    ${cov.rows.map((r) => `<tr><th>${esc(r.c.label)}</th>${r.counts.map(cell).join('')}<td><strong>${r.total}</strong>${r.total === 0 ? ' <span class="chip sev-high">▲ gap</span>' : r.total < 3 ? ' <span class="chip sev-medium">● thin</span>' : ''}</td><td class="faint small">${esc(r.c.feeds)}</td></tr>`).join('')}</table>`;
  const people = e.people.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const done = new Set(e.interviews.map((i) => i.personId));
  const sections = INTAKE_SECTIONS;
  const intake = e.intake.length ? e.intake.map((r) => `<details class="intake"><summary><strong>${esc(r.respondent)}</strong> <span class="muted small">${esc(r.role)} · ${esc(r.timestamp || r.date)} · ${Object.keys(r.answers).length} answers</span></summary>
      ${sections.map((s) => { const qs = s.questions.filter((q) => r.answers[q.id]); return qs.length ? `<h5>${esc(s.title)}</h5><dl>${qs.map((q) => `<dt>${esc(q.q)} <span class="chip">${esc((CRITERIA.find((c) => c.id === q.crit) || {}).label || '')}</span></dt><dd>${esc(r.answers[q.id])}</dd>`).join('')}</dl>` : ''; }).join('')}</details>`).join('')
    : '<p class="empty">No founder responses yet.</p>';
  return `<div class="page-h"><div><span class="eyebrow">Discovery</span><h1>What we know, and where the gaps are</h1><p class="muted">Every answer is stored against a discovery criterion. Coverage shows which criteria are well evidenced and which still need questions.</p></div>
    <div class="btn-row"><button class="btn" data-action="startCapture">+ Capture an interview</button></div></div>
  ${card('Discovery coverage (answers per criterion)', `<div class="scroll-x">${covTable}</div>`, { sub: 'Darker means more evidence. "Gap" and "thin" show where to aim the next interviews.' })}
  <div class="grid-2">
    ${card(`Founder questionnaire (${e.intake.length} responses)`, `<div class="btn-row"><label class="btn sm">Import responses CSV<input type="file" accept=".csv,text/csv" id="intakeFile" hidden></label></div>
      <p class="faint small">In the responses Google Sheet: File → Download → CSV, then import it here. Re-importing updates existing responses. Or ask Claude to read the Sheet from your Drive and produce the JSON.</p>${intake}`)}
    ${card('Interview checklist', people.length ? `<table class="tbl"><thead><tr><th>Person</th><th>Level</th><th>Question set</th><th></th></tr></thead><tbody>${people.map((p) => { const d = e.departments.find((x) => x.id === p.departmentId); const dt = deptType(d); return `<tr><td>${esc(p.name)}<div class="faint small">${esc(p.title || '')}</div></td><td>${esc(guessLevel(e, p))}</td><td class="small">${esc((DEPT_TYPES.find((x) => x[0] === dt) || ['', 'core only'])[1])}</td><td>${done.has(p.id) ? '<span class="chip st-added">✓ Interviewed</span>' : `<button class="btn sm" data-action="startCapture" data-id="${esc(p.id)}">Interview</button>`}</td></tr>`; }).join('')}</tbody></table>` : '<p class="empty">Add the org chart (People) first. The checklist and question sets then build themselves from it.</p>', { sub: 'Built from the org chart. Level and department decide each person\'s questions.' })}
  </div>`;
}

const DRAFT_KEY = () => STORE_KEY + '.draft';
function loadDraft() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY()) || 'null'); } catch (err) { return null; } }
function saveDraft(d) { try { localStorage.setItem(DRAFT_KEY(), JSON.stringify(d)); } catch (err) { /* ignore */ } }

function viewCapture(e) {
  const d = ui.draft;
  const p = e.people.find((x) => x.id === d.personId);
  const dept = e.departments.find((x) => x.id === (p ? p.departmentId : d.departmentId));
  const dtype = d.deptType || deptType(dept);
  const set = questionSet(d.level, dtype);
  const critLabel = (id) => (CRITERIA.find((c) => c.id === id) || {}).label || id;
  const qBlock = (title, qs) => qs.length ? `<h4>${title}</h4>${qs.map((q) => `<div class="qa"><label><span>${esc(q.q)}</span><span class="chip">${esc(critLabel(q.crit))}</span></label><textarea data-draft="answers.${q.id}" rows="2">${esc(d.answers[q.id] || '')}</textarea></div>`).join('')}` : '';
  const filled = Object.values(d.answers).filter((v) => String(v).trim()).length;
  const total = set.core.length + set.level.length + set.dept.length;
  return `<div class="page-h"><div><span class="eyebrow">Capture interview${d.editingId ? ' (editing)' : ''}</span><h1>${esc(p ? p.name : (d.personLabel || 'New interview'))}</h1><p class="muted">${filled} of ${total} questions answered. Your draft saves as you type. Skip anything that doesn't fit, and use Unexpected points for whatever comes up.</p></div>
    <div class="btn-row"><button class="btn" data-action="saveCapture">Save interview</button><button class="btn ghost" data-action="cancelCapture">Close</button></div></div>
  <div class="capture">
    <aside class="card">
      <label class="fld"><span>Person (from org chart)</span>${sel(e.people.map((x) => [x.id, x.name + (x.title ? ' · ' + x.title : '')]), d.personId, 'data-draftsel="personId"')}</label>
      ${p ? '' : `<label class="fld"><span>…or name / role if not on the org chart</span><input data-draft="personLabel" value="${esc(d.personLabel || '')}"></label>`}
      <label class="fld"><span>Level</span>${sel([['founder', 'Founder / director'], ['manager', 'Manager'], ['staff', 'Team member']], d.level, 'data-draftsel="level"', false)}</label>
      <label class="fld"><span>Department question set</span>${sel(DEPT_TYPES, dtype, 'data-draftsel="deptType"')}</label>
      <label class="fld"><span>Date</span><input type="date" data-draft="date" value="${esc(d.date)}"></label>
      <label class="fld"><span>Interviewer</span><input data-draft="interviewer" value="${esc(d.interviewer || '')}"></label>
      <label class="fld"><span>Duration (minutes)</span><input type="number" data-draft="durationMins" value="${esc(d.durationMins || '')}"></label>
      <label class="tog"><input type="checkbox" data-draftchk="logTime" ${d.logTime ? 'checked' : ''}> Add to time log (Listening phase)</label>
      <h5>Wrap-up</h5>
      <label class="fld"><span>Summary (2–3 lines)</span><textarea data-draft="summary" rows="3">${esc(d.summary || '')}</textarea></label>
      <label class="fld"><span>Themes (comma separated, keep consistent)</span><input data-draft="themes" value="${esc(d.themes || '')}" list="themeList"><datalist id="themeList">${themeCounts(e).map((t) => `<option value="${esc(t.theme)}">`).join('')}</datalist></label>
      <label class="fld"><span>Pain points (one per line)</span><textarea data-draft="painPoints" rows="3">${esc(d.painPoints || '')}</textarea></label>
      <label class="fld"><span>Ideas</span><textarea data-draft="ideas" rows="2">${esc(d.ideas || '')}</textarea></label>
      <label class="fld"><span>Quote worth keeping</span><textarea data-draft="quotes" rows="2">${esc(d.quotes || '')}</textarea></label>
    </aside>
    <div class="card qcol">
      ${qBlock('Core questions (everyone)', set.core)}
      ${qBlock(d.level === 'founder' ? 'Founder questions' : d.level === 'manager' ? 'Manager questions' : 'Team member questions', set.level)}
      ${qBlock(dtype ? `${(DEPT_TYPES.find((x) => x[0] === dtype) || ['', ''])[1]} questions` : '', set.dept)}
      <h4>Unexpected points</h4><p class="faint small">Anything outside the script. Tag each one so it still lands against a criterion.</p>
      ${(d.outliers || []).map((o, i) => `<div class="qa outlier"><textarea data-draft="outliers.${i}.text" rows="2" placeholder="What came up?">${esc(o.text || '')}</textarea>${sel(CRITERIA.map((c) => [c.id, c.label]), o.crit, `data-draftsel="outliers.${i}.crit"`)}</div>`).join('')}
      <button class="btn sm" data-action="addOutlier">+ Add unexpected point</button>
    </div>
  </div>`;
}

/* ---------- Client status report ---------- */
function renderStatusReport(e) {
  const g = e.engagement; const st = engagementStatus(e); const sv = savingsTracker(e);
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const nextReview = splitList(g.reviewDates).find((d) => d > st.today);
  const awaiting = e.recommendations.filter((r) => r.status === 'Identified');
  const waiting = st.reqs.filter((r) => r._status === 'Waiting' || r._status === 'Overdue').sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  let h = `<header class="rpt-cover"><div class="rpt-brand">THE <strong>GROWTH</strong> MACHINE</div><h1>Status report</h1><p class="rpt-client">${esc(e.client.name)}</p>
    <p class="rpt-meta">As at ${date}${g.contact ? ` · For ${esc(g.contact)}` : ''} · Engagement ${fmtD(g.start, { day: 'numeric', month: 'short', year: 'numeric' })} – ${fmtD(g.end, { day: 'numeric', month: 'short', year: 'numeric' })} · Confidential</p></header>`;
  h += `<section class="rpt-sec"><h2>At a glance</h2><div class="kpis">
    ${kpi('Current phase', esc(st.current ? st.current.name : '—'))}
    ${kpi('Consulting days used', `${st.used.toFixed(1)} of ${num(g.daysTotal)}`, `<div class="k-delta">${st.remaining.toFixed(1)} remaining · month ${Math.max(1, st.thisMonth)}: ${num(st.byMonth[st.thisMonth] || 0).toFixed(1)} of ${num(g.daysPerMonth)}</div>`)}
    ${kpi('Term elapsed', st.termDays ? pct(st.elapsed / st.termDays * 100) : '—', `<div class="k-delta">${st.daysLeftInTerm} days to go</div>`)}
    <div class="kpi ${st.openDelays.length || st.totalSlip ? 'kpi-flag' : ''}"><div class="k-label">⚑ Delays & changes</div><div class="k-value">${st.openDelays.length} open</div><div class="k-delta">${st.totalSlip ? `+${st.totalSlip} days slip in total` : 'none affecting the timeline'}</div></div>
    ${kpi('Waiting on you', `${waiting.length} items`, `<div class="k-delta ${st.overdue.length ? 'delta-bad' : ''}">${st.overdue.length} overdue</div>`)}
    ${sv.target ? kpi('Savings approved', `${fmtMoney(sv.approved)}/mo`, `<div class="k-delta">target ${fmtMoney(sv.target)}/mo</div>`) : ''}
  </div>${nextReview ? `<p class="small muted">Next review: ${fmtD(nextReview, { weekday: 'long', day: 'numeric', month: 'long' })}.</p>` : ''}</section>`;
  h += `<section class="rpt-sec"><h2>Where we are in the plan</h2>${phaseGantt(e, { compact: true })}</section>`;
  h += `<section class="rpt-sec flag-sec"><h2>⚑ Delays & changes</h2>${g.delays.length ? `<table class="tbl"><thead><tr><th>Raised</th><th>Phase</th><th>Cause</th><th>What happened</th><th class="r">Impact</th><th>Notice</th><th>Status / action</th></tr></thead><tbody>
    ${g.delays.slice().sort((a, b) => (a.dateRaised || '').localeCompare(b.dateRaised || '')).map((d) => `<tr><td class="nowrap">${fmtD(d.dateRaised)}</td><td>${esc((g.phases.find((p) => p.id === d.phaseId) || {}).name || '—')}</td><td>${esc(d.cause || '')}</td><td>${esc(d.description || '')}</td><td class="r">${num(d.daysImpact) ? '+' + num(d.daysImpact) + ' days' : '—'}</td><td class="nowrap">${d.noticeDate ? fmtD(d.noticeDate) : '—'}</td><td>${d.status === 'Resolved' ? '✓ Resolved' : '⚑ Open'}${d.resolution ? ' · ' + esc(d.resolution) : ''}</td></tr>`).join('')}</tbody></table>
    ${st.totalSlip ? `<p class="small">The end date (${fmtD(g.end, { day: 'numeric', month: 'long', year: 'numeric' })}) is fixed. The ${st.totalSlip} days of slip will be absorbed by reprioritising the later phases, unless a change is agreed in writing.</p>` : ''}` : '<p>No delays or changes recorded in this period.</p>'}</section>`;
  const li = (a) => `<li>${esc(a.title)}${a.due && a.status !== 'Done' ? ` <span class="muted small">· due ${fmtD(a.due)}</span>` : ''}${a.doneDate && a.status === 'Done' ? ` <span class="muted small">· ${fmtD(a.doneDate)}</span>` : ''}${a.status === 'Waiting on client' ? ' <span class="chip st-changed">waiting on client</span>' : ''}</li>`;
  h += `<section class="rpt-sec"><div class="rpt-2"><div><h3>✓ Done</h3>${st.done.length ? `<ul>${st.done.map(li).join('')}</ul>` : '<p class="muted">—</p>'}</div><div><h3>● In progress</h3>${st.doing.length ? `<ul>${st.doing.map(li).join('')}</ul>` : '<p class="muted">—</p>'}<h3>→ Next</h3>${st.next.length ? `<ul>${st.next.slice(0, 8).map(li).join('')}</ul>` : '<p class="muted">—</p>'}</div></div></section>`;
  h += `<section class="rpt-sec"><h2>What we need from you</h2>${waiting.length ? `<table class="tbl"><thead><tr><th>Item</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>${waiting.map((r) => `<tr><td>${esc(r.item)}</td><td>${esc(r.owner || '')}</td><td class="nowrap">${fmtD(r.dueDate)}</td><td>${r._status === 'Overdue' ? '▲ Overdue' : 'Waiting'}</td></tr>`).join('')}</tbody></table>` : '<p>Nothing outstanding. Thank you.</p>'}
    ${awaiting.length ? `<h3>Decisions awaiting approval</h3><ul>${awaiting.map((r) => `<li>${esc(r.title)}</li>`).join('')}</ul>` : ''}</section>`;
  h += `<section class="rpt-sec"><h2>Time used</h2><div class="rpt-2"><div><h3>By phase</h3>${hbars(g.phases.map((p) => ({ label: p.name, value: num(st.byPhase[p.id] || 0), tip: `${num(p.plannedDays)} planned` })), { fmt: (v) => v.toFixed(1) + ' d', max: Math.max(1, ...g.phases.map((p) => Math.max(num(p.plannedDays), num(st.byPhase[p.id] || 0)))) })}</div>
    <div><h3>By contract month</h3>${hbars([1, 2, 3].map((m) => ({ label: `Month ${m}`, value: num(st.byMonth[m] || 0) })), { fmt: (v) => `${v.toFixed(1)} of ${num(g.daysPerMonth)} d`, max: Math.max(num(g.daysPerMonth), ...Object.values(st.byMonth)), color: 'var(--s3)' })}</div></div></section>`;
  if (sv.target) h += `<section class="rpt-sec"><h2>Savings tracker</h2>${savingsBlock(sv)}</section>`;
  h += `<footer class="rpt-foot">The Growth Machine · Status report generated ${date}. Figures are working estimates until validated against the agreed baseline.</footer>`;
  return h;
}
