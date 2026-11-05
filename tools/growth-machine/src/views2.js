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
  [0, 1, 2, 3].forEach((k) => { const iso = addMonthsISO(g.start, k); if (iso > g.end) return; svg += `<line class="g-grid" x1="${x(iso)}" x2="${x(iso)}" y1="${TOP - 4}" y2="${H}"/><text class="g-lab" x="${x(iso) + 4}" y="12">Month ${k + 1} · ${fmtD(iso)}</text>`; });
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

  const delays = !g.delays.length ? `<p class="small muted slim-line" id="delays">⚑ No delays or changes logged (status reports will say "none recorded"). <button class="link" data-action="addDelay">+ Log a delay or change</button></p>` : `<section class="card flag-card" id="delays"><header class="card-h"><div><h3>⚑ Delays & changes log</h3><p class="sub">Every slip, whatever the cause, with its date, reason, impact and the date written notice was given. This section appears in every status report. Log TGM-side slips too: that's what makes the log credible.</p></div><button class="btn" data-action="addDelay">+ Log delay / change</button></header>
    ${g.delays.length ? `<div class="scroll-x"><table class="tbl grid-edit"><thead><tr><th>Raised</th><th>Phase</th><th>Cause</th><th>What happened</th><th>Days impact</th><th>Written notice sent</th><th>Status</th><th>Resolution / action</th><th></th></tr></thead><tbody>
      ${g.delays.slice().sort((a, b) => (b.dateRaised || '').localeCompare(a.dateRaised || '')).map((d) => `<tr class="${d.status === 'Resolved' ? '' : 'row-flag'}"><td>${ecell('engagement.delays', d, 'dateRaised', 'date')}</td><td>${ecellSel('engagement.delays', d, 'phaseId', phaseOpts)}</td><td>${ecellSel('engagement.delays', d, 'cause', DELAY_CAUSES)}</td><td>${ecellArea('engagement.delays', d, 'description')}</td><td>${ecell('engagement.delays', d, 'daysImpact', 'number', 'style="width:70px"')}</td><td>${ecell('engagement.delays', d, 'noticeDate', 'date')}</td><td>${ecellSel('engagement.delays', d, 'status', ['Open', 'Resolved'], false)}</td><td>${ecellArea('engagement.delays', d, 'resolution')}</td><td>${delBtn('engagement.delays', d.id)}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="empty">No delays or changes logged. That will show as "none recorded" in status reports, which is itself worth reporting.</p>'}
    ${st.totalSlip > 0 ? `<p class="small delta-bad">⚑ ${st.totalSlip} days of slip logged. The contract end date (${fmtD(g.end)}) is fixed, so later phases are compressed unless an extension is agreed in writing (clauses 2.4 and 5.7).</p>` : ''}
  </section>`;

  const reqs = card(`Waiting on client (${st.reqs.filter((r) => r._status === 'Waiting' || r._status === 'Overdue').length} open · ${st.overdue.length} overdue)`, `<div class="scroll-x"><table class="tbl grid-edit"><thead><tr><th>Status</th><th>Item</th><th>Owner</th><th>Requested</th><th>Due</th><th>Received</th><th>Override</th><th>Notes</th><th></th></tr></thead><tbody>
    ${st.reqs.map((r) => `<tr class="${r._status === 'Overdue' ? 'row-flag' : ''}"><td>${reqChip(r._status)}${r._status === 'Overdue' ? `<div><button class="link small" data-action="delayFromRequest" data-id="${esc(r.id)}">⚑ Log as delay</button></div>` : ''}</td><td>${ecellArea('engagement.requests', r, 'item')}</td><td>${ecell('engagement.requests', r, 'owner')}</td><td>${ecell('engagement.requests', r, 'requestedDate', 'date')}</td><td>${ecell('engagement.requests', r, 'dueDate', 'date')}</td><td>${ecell('engagement.requests', r, 'receivedDate', 'date')}</td><td>${ecellSel('engagement.requests', r, 'status', ['Not needed', 'Not available'])}</td><td>${ecellArea('engagement.requests', r, 'notes')}</td><td>${delBtn('engagement.requests', r.id)}</td></tr>`).join('')}
    </tbody></table></div><div class="btn-row"><button class="btn sm" data-action="addRow" data-coll="engagement.requests">+ Add request</button></div>`, { sub: 'Requests become Overdue automatically after their due date. Log a delay when a late item holds up the work.' });

  const actCol = (title, list0, empty) => { const list = ui.share ? list0.filter((a) => !a.private) : list0; return `<div class="act-col"><h4>${title} (${list.length})</h4>${list.length ? list.map((a) => `<div class="act ${a.status === 'Waiting on client' ? 'act-wait' : ''}"><div class="act-top">${a.private ? '<span class="chip st-removed" title="TGM only: never suggested into client reports">🔒 TGM only</span> ' : ''}${ecellArea('engagement.activities', a, 'title', 1)}</div><div class="act-meta">${ecellSel('engagement.activities', a, 'phaseId', phaseOpts)} ${ecell('engagement.activities', a, a.status === 'Done' ? 'doneDate' : 'due', 'date')} ${ecellSel('engagement.activities', a, 'status', ACTIVITY_STATUSES, false)} ${delBtn('engagement.activities', a.id)}</div></div>`).join('') : `<p class="empty">${empty}</p>`}</div>`; };
  const acts = card('What\'s done, what\'s happening, what\'s next', `<div class="act-grid">${actCol('✓ Done', st.done, 'Nothing completed yet.')}${actCol('● In progress / waiting', st.doing, 'Nothing in progress.')}${actCol('→ Next', st.next, 'Nothing queued.')}</div><div class="btn-row"><button class="btn sm" data-action="addActivity">+ Add activity</button></div>`, { sub: 'Marking an activity Done stamps today\'s date automatically.' });

  const entryDates = new Set(g.timeLog.map((t) => t.date));
  const missing = []; if (g.start) { for (let d = g.start, i = 0; d <= st.today && d <= g.end && i < 400; d = addDaysISO(d, 1), i++) { if (!entryDates.has(d) && dayEvents(e, d).length) missing.push(d); } }
  const diaryRows = g.timeLog.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const time = card(`Work diary · ${st.used % 1 ? st.used.toFixed(1) : st.used} of ${num(g.daysTotal)} days`, `<div class="grid-2">
      <div><h4>Days by contract month (allowance ${num(g.daysPerMonth)})</h4>${hbars([1, 2, 3].map((m) => ({ label: `Month ${m}`, value: num(st.byMonth[m] || 0), color: num(st.byMonth[m] || 0) > num(g.daysPerMonth) ? 'var(--crit)' : 'var(--s3)' })), { fmt: (v) => (v % 1 ? v.toFixed(1) : v) + ' d', max: Math.max(num(g.daysPerMonth), ...Object.values(st.byMonth)) })}</div>
      <div class="small muted"><p><b>Private.</b> Founders see a single capacity line in the status report, never this diary, unless you switch "Include work diary" on.</p><p>Record each working day as a <b>half</b> or <b>full</b> day and list what happened. No durations. Things captured in the Studio that day appear automatically.</p><p class="faint">Unused Month-2 days may carry into Month 3 by written agreement; the total of ${num(g.daysTotal)} cannot increase (clause 3.4).</p></div></div>
    ${missing.length ? `<div class="banner">Studio activity recorded on ${missing.map((d) => `<button class="link" data-action="addDay" data-id="${d}">${fmtD(d, { weekday: 'short', day: 'numeric', month: 'short' })}</button>`).join(' ')} with no diary entry yet. Click a date to add it.</div>` : ''}
    <div class="scroll-x"><table class="tbl grid-edit diary"><thead><tr><th>Date</th><th>Day</th><th>What happened (one item per line)</th><th>Recorded automatically</th><th></th></tr></thead><tbody>
    ${diaryRows.map((t) => { const auto = dayEvents(e, t.date); return `<tr><td>${ecell('engagement.timeLog', t, 'date', 'date')}<div class="faint small">${esc((g.phases.find((p) => p.id === phaseForDate(g, t.date)) || {}).name || '')}</div></td><td>${ecellSel('engagement.timeLog', t, 'dayType', [['Full', 'Full day'], ['Half', 'Half day']], false)}</td><td>${ecellArea('engagement.timeLog', t, 'items', Math.max(2, String(t.items || '').split('\n').length))}</td><td class="small muted">${auto.length ? auto.map((x) => `• ${esc(x)}`).join('<br>') : '<span class="faint">—</span>'}</td><td>${delBtn('engagement.timeLog', t.id)}</td></tr>`; }).join('') || '<tr><td colspan="5" class="empty">No working days recorded yet.</td></tr>'}
    </tbody></table></div><div class="btn-row"><button class="btn sm" data-action="addDay">+ Add today</button><button class="btn sm ghost" data-action="exportDiary">Export diary (CSV, on request)</button></div>`, { sub: 'One line per working day. This is your private record of what the days delivered.' });

  const savings = sv.target ? card('Savings tracker (contract)', savingsBlock(sv), { sub: 'Monthly recurring savings, net of new recurring costs. Stage comes from each recommendation\'s status.' }) : '';

  const phases = card('Phases', `<div class="scroll-x"><table class="tbl grid-edit"><thead><tr><th>Phase</th><th>Start</th><th>End</th><th>Planned days</th><th>Used</th><th>Status</th><th>Deliverables</th></tr></thead><tbody>
    ${g.phases.map((p) => `<tr><td>${ecell('engagement.phases', p, 'name')}</td><td>${ecell('engagement.phases', p, 'start', 'date')}</td><td>${ecell('engagement.phases', p, 'end', 'date')}</td><td>${ecell('engagement.phases', p, 'plannedDays', 'number', 'style="width:70px"')}</td><td class="r">${num(st.byPhase[p.id] || 0).toFixed(1)}</td><td>${ecellSel('engagement.phases', p, 'status', PHASE_STATUSES, false)}</td><td>${ecellArea('engagement.phases', p, 'deliverables')}</td></tr>`).join('')}</tbody></table></div>
    <details class="small"><summary>Contract settings</summary><div class="form-grid">${field('engagement.contact', 'Point of contact', g.contact)}${field('engagement.contactRole', 'Role', g.contactRole)}${field('engagement.start', 'Start', g.start, { type: 'date' })}${field('engagement.end', 'End', g.end, { type: 'date' })}${field('engagement.daysTotal', 'Days total', g.daysTotal, { type: 'number' })}${field('engagement.daysPerMonth', 'Days / month', g.daysPerMonth, { type: 'number' })}${field('engagement.targetMonthly', 'Monthly savings target', g.targetMonthly, { type: 'number' })}${field('engagement.baselineMonthly', 'Agreed monthly cost baseline', g.baselineMonthly, { type: 'number' })}${field('engagement.reviewDates', 'Review dates', g.reviewDates)}</div></details>`);

  return `<div class="page-h"><div><span class="eyebrow">Progress & time</span><h1>Where the engagement stands</h1><p class="muted">Point of contact: <strong>${esc(g.contact || '—')}</strong>${g.contactRole ? ' · ' + esc(g.contactRole) : ''}. Next review: <strong>${esc(fmtD(splitList(g.reviewDates).find((d) => d >= st.today) || ''))}</strong>.</p></div>
    <div class="btn-row"><button class="btn" data-action="statusReport">Status report →</button></div></div>
    ${kpis}${card('Timeline', phaseGantt(e))}${delays}<div class="grid-2">${acts}${reqs}</div>${ui.share ? '' : time}${savings}${phases}`;
}

function savingsBlock(sv, { rows = true } = {}) {
  const mx = Math.max(sv.target, sv.identified, 1);
  const bar = (v, c, label) => `<div class="sv-row"><span>${label}</span><div class="sv-track"><span style="width:${v / mx * 100}%;background:${c}"></span><i style="left:${sv.target / mx * 100}%" title="Target"></i></div><b>${fmtMoney(v)}</b></div>`;
  return `<div class="sv">${bar(sv.identified, 'var(--seq-3)', 'Identified (estimates)')}${bar(sv.approved, 'var(--seq-5)', 'Approved')}${bar(sv.realised, 'var(--seq-7)', 'Realised')}
    <p class="small muted">Target ${fmtMoney(sv.target)}/month (marker line)${sv.baseline ? ` against a baseline of ${fmtMoney(sv.baseline)}/month` : ' · baseline not yet set'}. <b>Identified</b> are our estimates until the client approves them; only Approved and Realised count towards the target. Reported separately: one-off savings ${fmtMoney(sv.oneOffSavings)}; one-off costs of approved items ${fmtMoney(sv.oneOffCosts)}; time freed ${Math.round(sv.hours)} hrs/month (capacity, not cash).</p></div>
    ${rows && sv.rows.length ? `<table class="tbl"><thead><tr><th>Initiative</th><th>Stage</th><th class="r">Net recurring / month</th><th class="r">One-off cost</th><th class="r">Hours freed / mo</th></tr></thead><tbody>${sv.rows.map((r) => `<tr class="${r.stage === 'Rejected' ? 'row-removed' : ''}"><td>${esc(r.rec.title)}</td><td><span class="chip ${r.stage === 'Realised' ? 'st-added' : r.stage === 'Approved' || r.stage === 'In progress' ? 'st-changed' : ''}">${esc(r.stage)}</span></td><td class="r ${r.monthlyNet < 0 ? 'delta-bad' : ''}">${fmtMoney(r.monthlyNet)}</td><td class="r">${fmtMoney(r.oneOffCost)}</td><td class="r">${Math.round(r.hoursMonth)}</td></tr>`).join('')}</tbody></table>` : ''}`;
}

/* ---------- Discovery: coverage, founder intake, interview capture ---------- */
function viewDiscovery(e) {
  if (ui.session) return viewIntakeSession(e);
  if (ui.capture) return viewCapture(e);
  const cov = coverage(e); const mx = Math.max(1, ...cov.rows.flatMap((r) => r.counts));
  const cell = (n) => { if (!n) return '<td class="cov-0">—</td>'; const k = Math.min(6, Math.floor(n / mx * 6.999)); return `<td style="background:${SEQ[k]};color:${k >= 4 ? '#fff' : 'var(--ink)'}">${n}</td>`; };
  const covTable = `<table class="heat cov"><tr><th>Criterion</th>${cov.cols.map((c) => `<th>${c}</th>`).join('')}<th>Total</th><th>Feeds</th></tr>
    ${cov.rows.map((r) => `<tr><th>${esc(r.c.label)}</th>${r.counts.map(cell).join('')}<td><strong>${r.total}</strong>${r.total === 0 ? ' <span class="chip sev-high">▲ gap</span>' : r.total < 3 ? ' <span class="chip sev-medium">● thin</span>' : ''}</td><td class="faint small">${esc(r.c.feeds)}</td></tr>`).join('')}</table>`;
  const people = e.people.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const done = new Set(e.interviews.map((i) => i.personId));
  const sections = INTAKE_SECTIONS; const io = intakeOutstanding(e);
  const intake = e.intake.length ? e.intake.map((r) => `<details class="intake"><summary><strong>${esc(r.respondent)}</strong> <span class="muted small">${esc(r.role)} · ${esc(r.timestamp || r.date)} · ${Object.keys(r.answers).length} answers</span></summary>
      <div class="btn-row"><button class="btn sm" data-action="resumeIntake" data-id="${esc(r.id)}">Continue live session</button></div>
      ${sections.map((s) => { const qs = s.questions.filter((q) => r.answers[q.id]); return qs.length ? `<h5>${esc(s.title)}</h5><dl>${qs.map((q) => `<dt>${esc(q.q)} <span class="chip">${esc((CRITERIA.find((c) => c.id === q.crit) || {}).label || '')}</span></dt><dd>${esc(r.answers[q.id])}</dd>`).join('')}</dl>` : ''; }).join('')}</details>`).join('')
    : '<p class="empty">No founder responses yet.</p>';
  return `<div class="page-h"><div><span class="eyebrow">Discovery</span><h1>What we know, and where the gaps are</h1><p class="muted">Every answer is stored against a discovery criterion. Coverage shows which criteria are well evidenced and which still need questions.</p></div>
    <div class="btn-row"><button class="btn" data-action="startIntake">▶ Live founder session</button><button class="btn ghost" data-action="startCapture">+ Capture a manager / staff interview</button></div></div>
  ${card('Discovery coverage (answers per criterion)', `<div class="scroll-x">${covTable}</div>`, { sub: 'Darker means more evidence. "Gap" and "thin" show where to aim the next interviews.' })}
  <div class="grid-2">
    ${card(`Founder questionnaire: ${io.answered} of ${io.total} answered`, `<div class="btn-row"><button class="btn" data-action="startIntake">▶ Live founder session</button><label class="btn sm">Import form responses (CSV)<input type="file" accept=".csv,text/csv" id="intakeFile" hidden></label></div>
      ${io.open.length ? `<div class="outstanding"><h5>⚑ Still needed (${io.open.length}${io.openPriority.length ? `, ${io.openPriority.length} priority` : ''})</h5><ul>${io.open.slice(0, 40).map((q) => `<li>${q.p ? '<b>★</b> ' : ''}${esc(q.q)} <span class="faint small">· ${esc(q.section)}</span></li>`).join('')}</ul><button class="btn sm ghost" data-action="copyOutstanding">Copy outstanding questions</button></div>` : '<p class="small"><span class="chip st-added">✓ All founder questions answered</span></p>'}
      <p class="faint small">Answers from live sessions and from the Google Form merge per person. A form submission fills gaps without overwriting what you captured live.</p>${intake}`)}
    ${card('Interview checklist', people.length ? `<table class="tbl"><thead><tr><th>Person</th><th>Level</th><th>Question set</th><th></th></tr></thead><tbody>${people.map((p) => { const d = e.departments.find((x) => x.id === p.departmentId); const dt = deptType(d); return `<tr><td>${esc(p.name)}<div class="faint small">${esc(p.title || '')}</div></td><td>${esc(guessLevel(e, p))}</td><td class="small">${esc((DEPT_TYPES.find((x) => x[0] === dt) || ['', 'core only'])[1])}</td><td>${done.has(p.id) ? '<span class="chip st-added">✓ Interviewed</span>' : `${e.staffSurvey.some((x) => x.personId === p.id) ? '<span class="chip">✓ Questionnaire</span> ' : ''}<button class="btn sm" data-action="startCapture" data-id="${esc(p.id)}">Interview</button>`}</td></tr>`; }).join('')}</tbody></table>` : '<p class="empty">Add the org chart (People) first. The checklist and question sets then build themselves from it.</p>', { sub: 'Built from the org chart. Level and department decide each person\'s questions.' })}
  </div>
  ${e.staffSurvey.length ? '' : '<details class="card"><summary class="small"><b>Staff questionnaire</b> · no responses yet (import a CSV)</summary>'}${card(`Staff questionnaire (${e.staffSurvey.length} responses)`, `<div class="btn-row"><label class="btn sm">Import staff responses (CSV)<input type="file" accept=".csv,text/csv" id="staffFile" hidden></label></div>
    <p class="faint small">The 10-minute pre-interview form. Responses match to people by name, and each person's answers appear at the top of their interview capture form.</p>
    ${e.staffSurvey.length ? `<table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>Matched to org chart</th><th>Biggest frustration</th></tr></thead><tbody>${e.staffSurvey.map((r) => `<tr><td>${esc(r.respondent)}</td><td>${esc(r.role)}</td><td>${r.personId ? '<span class="chip st-added">✓</span>' : '<span class="chip sev-medium">● not matched</span>'}</td><td class="small">${esc(trunc(r.answers.st_frustration || '', 120))}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">No staff responses yet.</p>'}`)}${e.staffSurvey.length ? '' : '</details>'}`;
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
  const total = set.core.length + set.level.length + set.dept.length + (e.customQuestions || []).filter((q) => q.personId && q.personId === d.personId).length;
  return `<div class="page-h"><div><span class="eyebrow">Capture interview${d.editingId ? ' (editing)' : ''}</span><h1>${esc(p ? p.name : (d.personLabel || 'New interview'))}</h1><p class="muted">${filled} of ${total} questions answered. Your draft saves as you type. Skip anything that doesn't fit, and use Unexpected points for whatever comes up.</p></div>
    <div class="btn-row"><button class="btn" data-action="saveCapture">Save interview</button><button class="btn ghost" data-action="cancelCapture">Close</button></div></div>
  <div class="capture">
    <aside class="card">
      <label class="fld"><span>Person (from org chart)</span>${sel(e.people.map((x) => [x.id, x.name + (x.title ? ' · ' + x.title : '')]), d.personId, 'data-draftsel="personId"')}</label>
      ${p ? '' : `<label class="fld"><span>${e.people.length ? '…or name, if not on the org chart' : 'Name'}</span><input data-draft="personLabel" value="${esc(d.personLabel || '')}"></label><label class="fld"><span>Position / role</span><input data-draft="role" value="${esc(d.role || '')}" placeholder="Shown in reports instead of the name"></label>`}
      <label class="fld"><span>Level</span>${sel([['founder', 'Founder / director'], ['manager', 'Manager'], ['staff', 'Team member']], d.level, 'data-draftsel="level"', false)}</label>
      <label class="fld"><span>Department question set</span>${sel(DEPT_TYPES, dtype, 'data-draftsel="deptType"')}</label>
      <label class="fld"><span>Date</span><input type="date" data-draft="date" value="${esc(d.date)}"></label>
      <label class="fld"><span>Interviewer</span><input data-draft="interviewer" value="${esc(d.interviewer || '')}"></label>
      <h5>Wrap-up</h5>
      <label class="fld"><span>Summary (2–3 lines)</span><textarea data-draft="summary" rows="3">${esc(d.summary || '')}</textarea></label>
      <label class="fld"><span>Themes (comma separated, keep consistent)</span><input data-draft="themes" value="${esc(d.themes || '')}" list="themeList"><datalist id="themeList">${themeCounts(e).map((t) => `<option value="${esc(t.theme)}">`).join('')}</datalist></label>
      <label class="fld"><span>Pain points (one per line)</span><textarea data-draft="painPoints" rows="3">${esc(d.painPoints || '')}</textarea></label>
      <label class="fld"><span>Ideas</span><textarea data-draft="ideas" rows="2">${esc(d.ideas || '')}</textarea></label>
      <label class="fld"><span>Quote worth keeping</span><textarea data-draft="quotes" rows="2">${esc(d.quotes || '')}</textarea></label>
    </aside>
    <div class="card qcol">
      ${(() => { const cq = (e.customQuestions || []).filter((q) => q.personId && q.personId === d.personId).map((q, i) => [q, i]).sort((a, b) => ((a[0].ord ?? 1e6 + a[1]) - (b[0].ord ?? 1e6 + b[1]))).map((x) => x[0]); if (!cq.length) return ''; let sec = '';
        return `<div class="custom-qs"><h4>Questions for this interview <span class="faint small">(★ = priority; prepared from what we know so far)</span></h4>${cq.map((q) => { const head = q.section && q.section !== sec ? `<h5>${esc((sec = q.section))}</h5>` : ''; return head + `<div class="qa ${String(d.answers[q.id] || '').trim() ? 'qa-done' : ''}"><label><span>${q.p ? '<b class="star">★</b> ' : ''}${esc(q.q)}</span><span class="chip">${esc(critLabel(q.crit))}</span></label>${q.note ? `<div class="faint small">${esc(q.note)}</div>` : ''}<textarea data-draft="answers.${q.id}" rows="2">${esc(d.answers[q.id] || '')}</textarea></div>`; }).join('')}</div>`; })()}
      ${(e.customQuestions || []).some((q) => q.personId && q.personId === d.personId) ? '<details class="std-qs"><summary>Standard question sets (optional)</summary>' : ''}
      ${(() => { const ss = e.staffSurvey.find((x) => x.personId === d.personId && d.personId); return ss ? `<div class="pre"><h4>Their questionnaire answers</h4><dl>${STAFF_SECTIONS.flatMap((sec) => sec.questions).filter((q) => ss.answers[q.id] && !/_name$/.test(q.id)).map((q) => `<dt>${esc(q.q)}</dt><dd>${esc(ss.answers[q.id])}</dd>`).join('')}</dl></div>` : ''; })()}
      ${qBlock('Core questions (everyone)', set.core)}
      ${qBlock(d.level === 'founder' ? 'Founder questions' : d.level === 'manager' ? 'Manager questions' : 'Team member questions', set.level)}
      ${qBlock(dtype ? `${(DEPT_TYPES.find((x) => x[0] === dtype) || ['', ''])[1]} questions` : '', set.dept)}
      ${(e.customQuestions || []).some((q) => q.personId && q.personId === d.personId) ? '</details>' : ''}
      <h4>Unexpected points</h4><p class="faint small">Anything outside the script. Tag each one so it still lands against a criterion.</p>
      ${(d.outliers || []).map((o, i) => `<div class="qa outlier"><textarea data-draft="outliers.${i}.text" rows="2" placeholder="What came up?">${esc(o.text || '')}</textarea>${sel(CRITERIA.map((c) => [c.id, c.label]), o.crit, `data-draftsel="outliers.${i}.crit"`)}</div>`).join('')}
      <button class="btn sm" data-action="addOutlier">+ Add unexpected point</button>
    </div>
  </div>`;
}

/* ---------- Client status report (output-led: what was delivered, not how time was spent) ---------- */
function interviewsByRole(e) {
  const pById = byId(e.people), dById = byId(e.departments);
  const groups = {};
  e.interviews.forEach((iv) => {
    const p = pById[iv.personId]; const role = iv.role || (p && p.title) || 'Team member';
    const dept = (p && dById[p.departmentId] && dById[p.departmentId].name) || (DEPT_TYPES.find((x) => x[0] === iv.deptType) || [])[1] || 'Other';
    groups[dept] = groups[dept] || {}; groups[dept][role] = (groups[dept][role] || 0) + 1;
  });
  return groups;
}
function suggestDelivered(e) {
  const g = e.engagement; const since = statusPeriodStart(g); const out = [];
  g.activities.filter((a) => !a.private && a.status === 'Done' && (a.doneDate || '') >= since).forEach((a) => out.push(a.title));
  const rec = g.requests.filter((r) => r.receivedDate && r.receivedDate >= since).length;
  if (rec) out.push(`Information received: ${g.requests.filter((r) => r.receivedDate).length} of ${g.requests.length} requested items`);
  const iv = e.interviews.filter((x) => (x.date || '') >= since).length;
  if (iv) out.push(`${iv} interview${iv > 1 ? 's' : ''} completed this period`);
  return out.join('\n');
}
function suggestNext(e) {
  return e.engagement.activities.filter((a) => !a.private && a.status !== 'Done').sort((a, b) => (a.due || '').localeCompare(b.due || '')).slice(0, 5).map((a) => a.title).join('\n');
}
function renderStatusReport(e) {
  const g = e.engagement; const st = engagementStatus(e); const sv = savingsTracker(e); const S = g.status || {};
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const since = statusPeriodStart(g);
  const nextReview = splitList(g.reviewDates).find((d) => d > st.today);
  const awaiting = e.recommendations.filter((r) => r.status === 'Identified');
  const waiting = st.reqs.filter((r) => r._status === 'Waiting' || r._status === 'Overdue').sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
  const onTrack = !st.openDelays.length && !st.overdue.length;
  const m = Math.max(1, Math.min(3, st.thisMonth));
  const dfmt = (v) => (v % 1 ? v.toFixed(1) : String(v));
  const capacity = `Month ${m}: ${dfmt(num(st.byMonth[m] || 0))} of ${num(g.daysPerMonth)} days used · ${dfmt(Math.max(0, st.remaining))} of ${num(g.daysTotal)} remaining overall`;
  const bullets = (txt) => { const l = splitList(String(txt || '').replace(/\n/g, ';')); return l.length ? `<ul>${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">—</p>'; };
  const groups = interviewsByRole(e); const ivTotal = e.interviews.length; const planned = e.people.length;
  let h = `<header class="rpt-cover"><div class="rpt-brand">THE <strong>GROWTH</strong> MACHINE</div><h1>Status report</h1><p class="rpt-client">${esc(e.client.name)}</p>
    <p class="rpt-meta">${fmtD(since, { day: 'numeric', month: 'short' })} – ${date}${g.contact ? ` · For ${esc(g.contact)}` : ''} · Confidential</p></header>`;
  h += `<section class="rpt-sec"><h2>Headline</h2>${S.headline ? `<p class="rpt-lead">${esc(S.headline)}</p>` : ''}<div class="kpis">
    ${kpi('Where we are', esc(st.current ? st.current.name : '—'))}
    <div class="kpi ${onTrack ? '' : 'kpi-flag'}"><div class="k-label">Status</div><div class="k-value k-text">${onTrack ? '✓ On track' : '⚑ Needs attention'}</div><div class="k-delta">${onTrack ? 'no open delays' : `${st.openDelays.length} open delay${st.openDelays.length === 1 ? '' : 's'} · ${st.overdue.length} overdue item${st.overdue.length === 1 ? '' : 's'}`}</div></div>
    ${sv.target ? kpi('Savings approved', `${fmtMoney(sv.approved)}/mo`, `<div class="k-delta">target ${fmtMoney(sv.target)}/mo · identified ${fmtMoney(sv.identified)}/mo</div>`) : ''}
  </div>${nextReview ? `<p class="small muted">Next review: ${fmtD(nextReview, { weekday: 'long', day: 'numeric', month: 'long' })}.</p>` : ''}</section>`;
  h += `<section class="rpt-sec"><div class="rpt-2"><div><h3>✓ Delivered</h3>${bullets(S.delivered)}</div><div><h3>→ Next fortnight</h3>${bullets(S.next)}</div></div></section>`;
  if (ivTotal) h += `<section class="rpt-sec"><h2>Interviews</h2><p>${ivTotal}${planned ? ` of ${planned}` : ''} completed. Roles interviewed so far:</p><table class="tbl"><tbody>${Object.entries(groups).map(([d, roles]) => `<tr><td class="nowrap"><b>${esc(d)}</b></td><td>${Object.entries(roles).map(([r, n]) => esc(r) + (n > 1 ? ` ×${n}` : '')).join(', ')}</td></tr>`).join('')}</tbody></table><p class="small muted">Findings are reported as themes and are never attributed to individuals or roles.</p></section>`;
  h += `<section class="rpt-sec"><h2>Where we are in the plan</h2>${phaseGantt(e, { compact: true })}</section>`;
  h += `<section class="rpt-sec"><h2>What we need from you</h2>${waiting.length ? `<table class="tbl"><thead><tr><th>Item</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead><tbody>${waiting.map((r) => `<tr><td>${esc(r.item)}</td><td>${esc(r.owner || '')}</td><td class="nowrap">${fmtD(r.dueDate)}</td><td>${r._status === 'Overdue' ? '▲ Overdue' : 'Waiting'}</td></tr>`).join('')}</tbody></table>` : '<p>Nothing outstanding. Thank you.</p>'}
    ${(() => { const io = intakeOutstanding(e); return e.intake.length && io.open.length ? `<p><b>Founder questions still open:</b> ${io.open.length} of ${io.total}${io.openPriority.length ? ` (${io.openPriority.length} priority)` : ''}. These can be finished in a short follow-up or through the online form.</p>` : ''; })()}
    ${awaiting.length ? `<h3>Decisions awaiting approval</h3><ul>${awaiting.map((r) => `<li>${esc(r.title)}</li>`).join('')}</ul>` : ''}</section>`;
  h += `<section class="rpt-sec flag-sec"><h2>⚑ Delays & changes</h2>${g.delays.length ? `<table class="tbl"><thead><tr><th>Raised</th><th>Phase</th><th>Cause</th><th>What happened</th><th class="r">Impact</th><th>Notice</th><th>Status / action</th></tr></thead><tbody>
    ${g.delays.slice().sort((a, b) => (a.dateRaised || '').localeCompare(b.dateRaised || '')).map((d) => `<tr><td class="nowrap">${fmtD(d.dateRaised)}</td><td>${esc((g.phases.find((p) => p.id === d.phaseId) || {}).name || '—')}</td><td>${esc(d.cause || '')}</td><td>${esc(d.description || '')}</td><td class="r">${num(d.daysImpact) ? '+' + num(d.daysImpact) + ' days' : '—'}</td><td class="nowrap">${d.noticeDate ? fmtD(d.noticeDate) : '—'}</td><td>${d.status === 'Resolved' ? '✓ Resolved' : '⚑ Open'}${d.resolution ? ' · ' + esc(d.resolution) : ''}</td></tr>`).join('')}</tbody></table>
    ${st.totalSlip ? `<p class="small">The end date (${fmtD(g.end, { day: 'numeric', month: 'long', year: 'numeric' })}) is fixed. The ${st.totalSlip} days of slip will be absorbed by reprioritising later work, unless a change is agreed in writing.</p>` : ''}` : '<p>No delays or changes recorded.</p>'}</section>`;
  if (sv.target) h += `<section class="rpt-sec"><h2>Savings tracker</h2>${savingsBlock(sv)}</section>`;
  h += `<section class="rpt-sec"><h2>Capacity</h2><p>${capacity}</p></section>`;
  if (S.includeDiary && g.timeLog.length) h += `<section class="rpt-sec rpt-break"><h2>Appendix: work diary</h2><table class="tbl"><thead><tr><th>Date</th><th>Day</th><th>What happened</th></tr></thead><tbody>${g.timeLog.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '')).map((t) => `<tr><td class="nowrap">${fmtD(t.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td><td>${t.dayType === 'Full' ? 'Full' : 'Half'}</td><td>${esc(String(t.items || '').split('\n').filter(Boolean).join(' · '))}</td></tr>`).join('')}</tbody></table></section>`;
  h += `<footer class="rpt-foot">The Growth Machine · Status report generated ${date}. Figures are working estimates until validated against the agreed baseline.</footer>`;
  return h;
}

/** Settings panel shown beside the status report preview. */
function statusSettings(e) {
  const S = e.engagement.status || {}; const since = statusPeriodStart(e.engagement);
  return `<aside class="card report-settings">
    <p class="small muted">This period: since <b>${fmtD(since, { weekday: 'short', day: 'numeric', month: 'short' })}</b> (the last review). Keep it to outputs, not activity.</p>
    ${field('engagement.status.headline', 'Headline (2–3 sentences)', S.headline, { area: true, ph: 'Where we are, and whether it is on track.' })}
    <label class="fld"><span>Delivered (one per line, 3–6 outputs)</span><textarea data-bind="engagement.status.delivered" rows="6">${esc(S.delivered || '')}</textarea></label>
    <div class="btn-row" style="margin-top:-4px"><button class="btn sm" data-action="suggestDelivered">Suggest from this period</button></div>
    <label class="fld"><span>Next fortnight (one per line, 3–5)</span><textarea data-bind="engagement.status.next" rows="5">${esc(S.next || '')}</textarea></label>
    <div class="btn-row" style="margin-top:-4px"><button class="btn sm" data-action="suggestNext">Suggest from activities</button></div>
    <h5>On request only</h5>
    <label class="tog"><input type="checkbox" data-bind="engagement.status.includeDiary" ${S.includeDiary ? 'checked' : ''}> Include work diary as an appendix</label>
    <p class="faint small">Off by default. Founders see one capacity line, not a day-by-day account (clause 3.3: "not a timesheet-based or hourly charge").</p>
  </aside>`;
}

/* ---------- Live founder session: you ask, you type; every keystroke is saved ---------- */
function viewIntakeSession(e) {
  const r = e.intake.find((x) => x.id === ui.sessionId);
  if (!r) {
    const leaders = e.people.filter((p) => guessLevel(e, p) === 'founder');
    return `<div class="page-h"><div><span class="eyebrow">Live founder session</span><h1>Who are you speaking with?</h1><p class="muted">You ask the questions and type the answers. Everything saves as you type, so you can stop at any point, switch person, and come back later.</p></div><button class="btn ghost" data-action="endIntake">Close</button></div>
    ${e.intake.length ? card('Continue with', `<div class="btn-row">${e.intake.map((x) => `<button class="btn sm" data-action="resumeIntake" data-id="${esc(x.id)}">${esc(x.respondent)}${x.role ? ' · ' + esc(x.role) : ''} (${Object.keys(x.answers).length} answers)</button>`).join('')}</div>`) : ''}
    ${card('New person', `<div class="form-grid">
      ${e.people.length ? `<label class="fld"><span>From the org chart</span>${sel(leaders.concat(e.people.filter((p) => !leaders.includes(p))).map((p) => [p.id, p.name + (p.title ? ' · ' + p.title : '')]), '', 'id="sessPerson"')}</label>` : '<input type="hidden" id="sessPerson" value="">'}
      <label class="fld"><span>${e.people.length ? '…or name' : 'Name'}</span><input id="sessName" placeholder="e.g. Daryl"></label>
      <label class="fld"><span>Role</span><input id="sessRole" placeholder="e.g. Co-founder / MD"></label></div>
      ${e.people.length ? '' : '<p class="faint small">No org chart yet, so just type the name. Once People & org is filled in, you can pick people from a list here.</p>'}
      <div class="btn-row"><button class="btn" data-action="newIntake">Start</button></div>`)}`;
  }
  const io = intakeOutstanding(e);
  const mine = INTAKE_SECTIONS.filter((s) => s.id !== 'about').flatMap((s) => s.questions);
  const mineDone = mine.filter((q) => String(r.answers[q.id] || '').trim()).length;
  const others = (qid) => e.intake.filter((x) => x.id !== r.id && String(x.answers[qid] || '').trim()).map((x) => x.respondent);
  const input = (q) => {
    const v = r.answers[q.id] || ''; const a = `data-intake="${q.id}"`;
    if (q.type === 'long') return `<textarea ${a} rows="2">${esc(v)}</textarea>`;
    if (q.type === 'scale') return sel([['1', '1 · ' + (q.low || '')], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5 · ' + (q.high || '')]], v, `data-intakesel="${q.id}"`);
    if (q.type === 'choice') return `<input ${a} list="dl_${q.id}" value="${esc(v)}" placeholder="Pick or type"><datalist id="dl_${q.id}">${(q.options || []).map((o) => `<option value="${esc(o)}">`).join('')}</datalist>`;
    if (q.type === 'checkbox') {
      const parts = splitList(v); const opts = q.options || []; const other = parts.filter((x) => !opts.includes(x)).join(', ');
      return `<div class="chk">${opts.map((o) => `<label><input type="checkbox" data-intakemulti="${q.id}" value="${esc(o)}" ${parts.includes(o) ? 'checked' : ''}> ${esc(o)}</label>`).join('')}<input data-intakeother="${q.id}" value="${esc(other)}" placeholder="Other"></div>`;
    }
    return `<input ${a} value="${esc(v)}">`;
  };
  const sections = INTAKE_SECTIONS.filter((s) => s.id !== 'about').map((s) => {
    const qs = s.questions.filter((q) => !ui.prioOnly || q.p);
    if (!qs.length) return '';
    return `<h4>${esc(s.title)}</h4>${qs.map((q) => { const o = others(q.id); const done = String(r.answers[q.id] || '').trim(); return `<div class="qa ${done ? 'qa-done' : ''}"><label><span>${q.p ? '<b class="star">★</b> ' : ''}${esc(q.q)}</span><span class="qa-meta">${o.length ? `<span class="chip">answered by ${esc(o.join(', '))}</span>` : ''}${done ? '<span class="chip st-added">✓</span>' : ''}</span></label>${input(q)}</div>`; }).join('')}`;
  }).join('');
  return `<div class="page-h"><div><span class="eyebrow">Live founder session · saving as you type</span><h1>${esc(r.respondent)}${r.role ? ` <span class="muted" style="font-size:20px">· ${esc(r.role)}</span>` : ''}</h1>
      <p class="muted">${mineDone} of ${mine.length} answered by ${esc(r.respondent)} · ${io.open.length} still open across all founders (${io.openPriority.length} priority).</p></div>
    <div class="btn-row"><label class="tog"><input type="checkbox" data-ui="prioOnly" ${ui.prioOnly ? 'checked' : ''}> ★ Priority questions only</label><button class="btn sm" data-action="switchIntake">Switch person</button><button class="btn" data-action="endIntake">Done for now</button></div></div>
  <div class="card qcol session">${sections}
    ${ui.prioOnly ? `<h4>Anything else they raised</h4><div class="qa"><textarea data-intake="i_other" rows="3" placeholder="Unexpected points, worries, names mentioned…">${esc(r.answers.i_other || '')}</textarea></div>` : ''}
  </div>`;
}

/* ---------- Competitors: profiles, capability matrix, positioning ---------- */
const CAP_LEVELS = ['Strong', 'Partial', 'None'];
const INTEL_TOPICS = ['Pricing', 'Product', 'Marketing', 'Customers', 'Team', 'Technology', 'Partnerships', 'News', 'Other'];
const SOURCE_TYPES = ['Online research', 'Founder', 'Staff', 'Client / customer', 'Other'];
const OPP_AREAS = ['Positioning', 'Marketing', 'Product', 'Pricing', 'Sales', 'Systems & operations'];
const CAP_VAL = { Strong: 1, Partial: 0.5, None: 0 };
const IMP_W = { High: 3, Medium: 2, Low: 1 };
/** Weighted capability score. Returns null until at least half the capabilities are rated, so thin evidence never shows as 100%. */
function capabilityScore(e, getLevel) {
  let w = 0, tot = 0; const rated = capabilityRated(e, getLevel);
  if (!e.capabilities.length || rated < Math.ceil(e.capabilities.length / 2)) return null;
  e.capabilities.forEach((c) => { const lv = getLevel(c); if (!(lv in CAP_VAL)) return; const wt = IMP_W[c.importance] || 2; w += wt; tot += wt * CAP_VAL[lv]; });
  return w ? tot / w * 100 : null;
}
function capabilityRated(e, getLevel) { return e.capabilities.filter((c) => getLevel(c) in CAP_VAL).length; }
function positioningMap(e) {
  const pts = e.competitors.filter((c) => num(c.pricePoint) > 0).map((c) => ({ label: c.name, x: num(c.pricePoint), y: capabilityScore(e, (cap) => (cap.scores || {})[c.id]), threat: c.threat }));
  if (num(e.client.pricePoint) > 0) pts.push({ label: e.client.name, x: num(e.client.pricePoint), y: capabilityScore(e, (cap) => cap.client), me: true });
  const ok = pts.filter((p) => p.y != null);
  if (ok.length < 2) return '<p class="empty">Add indicative price points and capability scores for at least two players to see the positioning map.</p>';
  const W = 640, H = 300, L = 60, R = 20, T = 14, B = 36;
  const xmax = niceMax(Math.max(...ok.map((p) => p.x)) * 1.1);
  const x = (v) => L + v / xmax * (W - L - R), y = (v) => T + (1 - v / 100) * (H - T - B);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Price versus capability">`;
  svg += `<g class="grid">${[0, 25, 50, 75, 100].map((t) => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  svg += `<g class="axis">${[0, 50, 100].map((t) => `<text x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${t}%</text>`).join('')}${[0, 0.5, 1].map((f) => `<text x="${x(f * xmax)}" y="${H - 16}" text-anchor="middle">${esc(fmtShort(f * xmax))}</text>`).join('')}
    <text x="${(L + W - R) / 2}" y="${H - 2}" text-anchor="middle">Indicative price per location / month →</text><text x="12" y="${T + 6}" transform="rotate(-90 12 ${T + 6})" text-anchor="end">Capability →</text></g>`;
  ok.forEach((p) => {
    svg += `<circle cx="${x(p.x)}" cy="${y(p.y)}" r="${p.me ? 8 : 6}" fill="${p.me ? 'var(--red)' : 'var(--s1)'}" stroke="var(--surface)" stroke-width="2" data-tip="${esc(p.label)} · ${esc(fmtMoney(p.x))} · capability ${Math.round(p.y)}%${p.threat ? ' · threat ' + esc(p.threat) : ''}"/>`;
    svg += `<text x="${x(p.x) + 11}" y="${y(p.y) + 4}" style="font-size:11px;fill:var(--ink);font-weight:${p.me ? 700 : 500}">${esc(trunc(p.label, 22))}</text>`;
  });
  return `<div class="chart pos-map"><div class="legend"><span><i style="background:var(--red)"></i>${esc(e.client.name)}</span><span><i style="background:var(--s1)"></i>Competitors</span></div>${svg}</div>`;
}
const capMark = (lv) => ({ Strong: '<span class="cap cap-s" title="Strong">● Strong</span>', Partial: '<span class="cap cap-p" title="Partial">◐ Partial</span>', None: '<span class="cap cap-n" title="None">○ None</span>' }[lv] || '<span class="faint">?</span>');
function capabilityMatrix(e, { editable = true } = {}) {
  if (!e.capabilities.length) return '<p class="empty">No capabilities listed yet. Add the features or services clients choose on (e.g. listings sync, review management, reporting, API, local support).</p>';
  const cols = [{ id: '__client', name: e.client.name, me: true }, ...e.competitors];
  const cell = (cap, col) => {
    const lv = col.me ? cap.client : (cap.scores || {})[col.id];
    return editable ? `<td class="c">${sel(CAP_LEVELS, lv || '', `data-capcell="${esc(cap.id)}" data-comp="${esc(col.id)}"`)}</td>` : `<td class="c">${capMark(lv)}</td>`;
  };
  return `<table class="tbl matrix capm"><thead><tr><th>Capability</th><th>Importance</th>${cols.map((c) => `<th class="c ${c.me ? 'me' : ''}">${esc(trunc(c.name, 18))}</th>`).join('')}</tr></thead><tbody>
    ${e.capabilities.map((cap) => `<tr><td>${esc(cap.name)}</td><td class="small">${esc(cap.importance || '—')}</td>${cols.map((c) => cell(cap, c)).join('')}</tr>`).join('')}
    <tr><td><b>Weighted score</b><div class="faint small">shown once half the rows are rated</div></td><td></td>${cols.map((c) => { const g = (cap) => (c.me ? cap.client : (cap.scores || {})[c.id]); const s = capabilityScore(e, g); const n = capabilityRated(e, g); return `<td class="c"><b>${s == null ? '—' : Math.round(s) + '%'}</b><div class="faint small">${n}/${e.capabilities.length} rated</div></td>`; }).join('')}</tr></tbody></table>`;
}
function viewCompetitors(e) {
  const comps = e.competitors;
  const threatChip = (t) => t === 'High' ? '<span class="chip sev-high">▲ High threat</span>' : t === 'Medium' ? '<span class="chip sev-medium">● Medium threat</span>' : t === 'Low' ? '<span class="chip sev-low">○ Low threat</span>' : '';
  const stale = comps.filter((c) => !c.lastReviewed || daysBetween(c.lastReviewed, todayISO()) > 90).length;
  const unsourced = comps.filter((c) => !String(c.sources || '').trim()).length;
  return `<div class="page-h"><div><span class="eyebrow">Market & competition</span><h1>Competitors</h1><p class="muted">Who ${esc(e.client.name)} competes with, where it wins and loses, and how it is positioned. Every profile should cite its sources and carry a review date: research goes stale.</p></div>
    <div class="btn-row"><button class="btn" data-action="addCompetitor">+ Add competitor</button><button class="btn ghost" data-action="addCapability">+ Add capability</button></div></div>
  <div class="kpis">${kpi('Competitors tracked', comps.length)}${kpi('High threat', comps.filter((c) => c.threat === 'High').length)}${kpi('Capabilities compared', e.capabilities.length)}
    <div class="kpi ${unsourced || stale ? 'kpi-flag' : ''}"><div class="k-label">Evidence</div><div class="k-value k-text">${unsourced ? `${unsourced} without sources` : '✓ All sourced'}</div><div class="k-delta">${stale ? `${stale} not reviewed in 90 days` : 'all reviewed recently'}</div></div></div>
  ${comps.length ? `<div class="comp-grid">${comps.map((c) => `<article class="card comp">
    <header><div><h3>${esc(c.name)}</h3><div class="muted small">${esc([c.type, c.hq, c.markets].filter(Boolean).join(' · '))}</div></div>${threatChip(c.threat)}</header>
    ${c.offering ? `<p class="small">${esc(c.offering)}</p>` : ''}
    <dl class="comp-dl">
      ${c.pricingModel || c.pricePoint ? `<dt>Pricing</dt><dd>${esc(c.pricingModel || '')}${num(c.pricePoint) ? ` · ~${esc(fmtMoney(num(c.pricePoint)))} per location / month` : ''}</dd>` : ''}
      ${c.segments ? `<dt>Targets</dt><dd>${esc(c.segments)}</dd>` : ''}
      ${c.strengths ? `<dt>Strengths</dt><dd>${esc(c.strengths)}</dd>` : ''}
      ${c.weaknesses ? `<dt>Weaknesses</dt><dd>${esc(c.weaknesses)}</dd>` : ''}
      ${c.whereWeWin ? `<dt>We win</dt><dd>${esc(c.whereWeWin)}</dd>` : ''}
      ${c.whereWeLose ? `<dt>We lose</dt><dd>${esc(c.whereWeLose)}</dd>` : ''}
    </dl>
    <p class="faint small">${c.sources ? 'Sources: ' + esc(trunc(c.sources, 140)) : '⚑ No sources recorded'} · ${c.lastReviewed ? 'Reviewed ' + esc(fmtD(c.lastReviewed, { day: 'numeric', month: 'short', year: 'numeric' })) : 'Not reviewed'}</p>
    <div class="btn-row"><button class="btn sm" data-action="editCompetitor" data-id="${esc(c.id)}">Edit profile</button><button class="btn sm ghost" data-action="addIntel" data-id="${esc(c.id)}">+ Intel</button><span class="faint small">${e.intel.filter((x) => x.competitorId === c.id).length} intel entries</span></div></article>`).join('')}</div>`
    : card('', '<p class="empty">No competitors yet. Add them here or in Sources & data, or ask Claude to research them and paste the result in (the prompt includes the competitor format).</p>')}
  ${card('Capability comparison', `<div class="scroll-x">${capabilityMatrix(e)}</div>`, { sub: 'Choose Strong / Partial / None per cell, and leave it blank when there is no evidence. The weighted score uses each capability\'s importance (High 3, Medium 2, Low 1). The Location Bank column is for the founders to confirm.' })}
  ${intelBlock(e)}
  ${sharpenBlock(e)}
  ${card('Positioning: price vs capability', `<div class="form-grid"><label class="fld"><span>${esc(e.client.name)} indicative price per location / month</span><input type="number" data-bind="client.pricePoint" value="${esc(e.client.pricePoint || '')}"></label></div>${positioningMap(e)}`, { sub: 'Price is an indicative monthly price per location. Hover a point for detail.' })}`;
}

/* Knowledge bank: every fact with its source type, filterable by competitor */
function intelBlock(e) {
  const f = ui.intelComp || 'all'; const cById = byId(e.competitors);
  const rows = e.intel.filter((x) => f === 'all' || x.competitorId === f).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const bySrc = SOURCE_TYPES.map((t) => [t, e.intel.filter((x) => x.sourceType === t).length]).filter(([, n]) => n);
  return card(`Knowledge bank (${e.intel.length} entries)`, `<div class="toolbar"><button class="btn sm ${f === 'all' ? 'on' : ''}" data-action="setIntelFilter" data-id="all">All</button>${e.competitors.map((c) => `<button class="btn sm ${f === c.id ? 'on' : ''}" data-action="setIntelFilter" data-id="${esc(c.id)}">${esc(trunc(c.name, 22))}</button>`).join('')}<span class="faint small" style="margin-left:auto">${bySrc.map(([t, n]) => `${esc(t)}: ${n}`).join(' · ')}</span></div>
    ${rows.length ? `<table class="tbl"><thead><tr><th>Date</th><th>Competitor</th><th>Topic</th><th>What we know</th><th>Source</th></tr></thead><tbody>${rows.map((x) => `<tr><td class="nowrap small">${fmtD(x.date)}</td><td class="small">${esc((cById[x.competitorId] || {}).name || '—')}</td><td><span class="chip">${esc(x.topic || '—')}</span></td><td>${esc(x.note || '')}</td><td class="small">${esc(x.sourceType || '')}${x.source ? `<div class="faint">${/^https?:/.test(x.source) ? `<a href="${esc(x.source)}" target="_blank" rel="noopener">${esc(trunc(x.source.replace(/^https?:\/\/(www\.)?/, ''), 40))}</a>` : esc(x.source)}</div>` : ''}</td></tr>`).join('')}</tbody></table>`
      : '<p class="empty">Nothing banked yet. Add facts as they come in from founders, staff, clients and online research. Each entry is one fact with its source.</p>'}
    <div class="btn-row"><button class="btn sm" data-action="addIntel">+ Add intel</button></div>`, { sub: 'One fact per entry, always with its source. Founder and staff answers about competitors appear under Discovery; bank the useful ones here.' });
}

/* Sharpening the client: positioning, USPs tested against competitors, opportunities */
function sharpenBlock(e) {
  const C = 'usps', O = 'opportunities';
  const usp = e.usps.length ? `<table class="tbl grid-edit"><thead><tr><th>Claim</th><th>Versus competitors</th><th>Proof / evidence</th><th>Who else has it</th><th></th></tr></thead><tbody>${e.usps.map((u) => `<tr><td>${ecell(C, u, 'claim')}</td><td>${ecellSel(C, u, 'strength', ['Unique', 'Shared', 'Claimed only'], false)}</td><td>${ecellArea(C, u, 'proof')}</td><td>${ecell(C, u, 'competitorsWithIt')}</td><td>${delBtn(C, u.id)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">List what Location Bank says makes it different, then test each claim against the knowledge bank.</p>';
  const opp = e.opportunities.length ? `<table class="tbl grid-edit"><thead><tr><th>Opportunity</th><th>Area</th><th>Based on</th><th>Impact</th><th>Effort</th><th>Status</th><th></th></tr></thead><tbody>${e.opportunities.map((o) => `<tr><td>${ecell(O, o, 'title')}${ecellArea(O, o, 'description', 1)}</td><td>${ecellSel(O, o, 'area', OPP_AREAS, false)}</td><td>${ecellArea(O, o, 'basedOn', 1)}</td><td>${ecellSel(O, o, 'impact', ['High', 'Medium', 'Low'], false)}</td><td>${ecellSel(O, o, 'effort', ['High', 'Medium', 'Low'], false)}</td><td>${o.status === 'Recommendation' ? '<span class="chip st-added">✓ In recommendations</span>' : `${ecellSel(O, o, 'status', ['Idea', 'Proposed'], false)}<div><button class="link small" data-action="oppToRec" data-id="${esc(o.id)}">→ Make recommendation</button></div>`}</td><td>${delBtn(O, o.id)}</td></tr>`).join('')}</tbody></table>` : '<p class="empty">Gaps competitors leave open, messages that work for them, prices you can defend, system or product moves. Each one can become a ranked recommendation.</p>';
  const counts = ['Unique', 'Shared', 'Claimed only'].map((k) => `${k}: ${e.usps.filter((u) => u.strength === k).length}`).join(' · ');
  return `<section class="card sharpen"><header class="card-h"><div><h3>Sharpening ${esc(e.client.name)}</h3><p class="sub">Use what the knowledge bank shows to tighten positioning, prove the USPs and find opportunities.</p></div></header>
    <label class="fld"><span>Positioning statement (for [who], [client] is the [category] that [key benefit], unlike [alternative])</span><textarea data-bind="client.positioning" rows="2">${esc(e.client.positioning || '')}</textarea></label>
    <h4>USPs tested against competitors <span class="faint small">${counts}</span></h4>${usp}<div class="btn-row"><button class="btn sm" data-action="addUsp">+ Add USP</button></div>
    <h4>Opportunities</h4>${opp}<div class="btn-row"><button class="btn sm" data-action="addOpportunity">+ Add opportunity</button></div>
  </section>`;
}
