/* Department-first shell (graphite), step 2 of the build: the left menu, Home for TGM, a first department board and
   the all-items-by-stage list. Pages not yet rebuilt open inside the same shell. "Classic view" (menu foot) brings
   back the earlier layout until the next fortnightly review. */

const SHELL_TABS = ['hub', 'dept', 'stage'];
const shellOn = () => !ui.classic && !PORTAL_ON;
const DEPT_ICON = { lead: '◆', sales: '↗', cs: '♥', ops: '⚙︎', prod: '▣', admin: '▤' };
const STAGE_FLOW = ITEM_STAGES.filter(([k]) => k !== 'parked');
const shellItems = (e) => live(e.items || []).filter((i) => !(ui.share && String(i.portal) === 'false')).sort((a, b) => num(a.order) - num(b.order));
const deptItems = (e, k) => shellItems(e).filter((i) => splitList(i.depts).includes(k));
const typeIcon = (t) => { const x = ITEM_TYPES.find((y) => y[0] === t); return x ? `<span class="gs-ty" title="${esc(x[2])}">${x[1]}</span>` : ''; };
const LABEL_TXT = { leak: 'Leak', opportunity: 'Opportunity', weakness: 'Weakness' };
const longDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dayMon = (iso) => { const d = new Date(iso + 'T00:00:00'); return [d.getDate(), d.toLocaleString('en-GB', { month: 'short' })]; };

function gsRing(pct, centre, sub, { size = 78, w = 9, hot = false } = {}) {
  const r = (size - w) / 2, c = size / 2, C = 2 * Math.PI * r, id = 'gr' + Math.random().toString(36).slice(2, 8);
  return `<svg class="gs-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(centre)} ${esc(sub)}">
    <defs><linearGradient id="${id}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#35c2e0"/><stop offset="1" stop-color="#ff6a4d"/></linearGradient></defs>
    <circle cx="${c}" cy="${c}" r="${r}" stroke="rgba(0,0,0,.45)" stroke-width="${w + 4}" fill="none"/><circle cx="${c}" cy="${c}" r="${r}" stroke="rgba(255,255,255,.06)" stroke-width="${w}" fill="none"/>
    <circle cx="${c}" cy="${c}" r="${r}" stroke="${hot ? '#ff6a4d' : `url(#${id})`}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-dasharray="${(C * Math.min(Math.max(pct, .02), 1)).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${c} ${c})"/>
    <text x="${c}" y="${c + (sub ? 2 : 6)}" text-anchor="middle" font-size="${String(centre).length > 3 ? size / 5 : size / 4.2}" font-weight="600" fill="currentColor">${esc(centre)}</text>
    ${sub ? `<text x="${c}" y="${c + size / 5.6}" text-anchor="middle" font-size="${size / 9.5}" class="gs-ring-sub">${esc(sub)}</text>` : ''}</svg>`;
}

/* ---------- left menu ---------- */
function railHTML(e) {
  const engOpts = Object.values(db.engagements).map((x) => `<option value="${x.id}" ${x.id === db.activeId ? 'selected' : ''}>${esc(x.client.name)}</option>`).join('');
  const scOpts = [['current', 'Current state'], ...e.scenarios.map((s) => [s.id, s.name]), ['all', 'All recommendations']].map(([id, n]) => `<option value="${id}" ${ui.scenario === id ? 'selected' : ''}>${esc(n)}</option>`).join('');
  const sub = (t) => (ui.sub || {})[t];
  const b = (o, t, attrs, on, c) => `<button class="gs-rl ${on ? 'on' : ''}" ${attrs}><span class="o">${o}</span><span class="t">${t}</span>${c !== undefined ? `<span class="c">${c}</span>` : ''}</button>`;
  const its = shellItems(e);
  const st = e.engagement.phases.length ? engagementStatus(e) : null;
  const initials = (e.client.name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return `<div class="gs-brand"><b></b><span>The Growth Machine</span></div>
    <label class="gs-client"><span class="lg">${esc(initials)}</span><span class="cn"><select id="engSel" aria-label="Client">${engOpts}</select><span class="s">${st ? `Week ${Math.max(1, Math.ceil(st.elapsed / 7))} of ${Math.max(1, Math.round(st.termDays / 7))}` : 'Client'}</span></span><span class="dd">▾</span></label>
    ${SCENARIO_TABS.includes(ui.tab) || ui.scenario !== 'current' ? `<label class="gs-scn"><span>View as</span><select id="scSel">${scOpts}</select></label>` : ''}
    ${b('⌂', 'Home', 'data-action="tab" data-id="hub"', ui.tab === 'hub' || ui.tab === 'stage')}
    <div class="gs-h">Departments</div>
    ${ITEM_DEPTS.map(([k, n]) => b(`<i style="--c:var(--gd-${k})"></i>`, esc(n), `data-action="dept" data-id="${k}"`, ui.tab === 'dept' && ui.dept === k, its.filter((i) => splitList(i.depts).includes(k)).length)).join('')}
    <div class="gs-h">Whole business</div>
    ${b('⇄', 'How work flows', 'data-action="tab" data-id="processes"', ui.tab === 'processes')}
    ${b('◔', 'Insights &amp; value', 'data-action="tab" data-id="evidence"', ui.tab === 'evidence')}
    <div class="gs-h">Our engagement</div>
    ${b('◷', 'Our work', 'data-action="tab" data-id="progress" data-sub="progress"', ui.tab === 'progress' && sub('progress') !== 'report')}
    ${b('☺︎', 'Conversations', 'data-action="tab" data-id="talk"', ui.tab === 'talk')}
    ${b('▤', 'Reports', 'data-action="tab" data-id="progress" data-sub="report"', ui.tab === 'progress' && sub('progress') === 'report')}
    ${b('◎', 'Sources &amp; data', 'data-action="tab" data-id="data"', ui.tab === 'data')}
    <div class="gs-foot">
      ${syncSupported() && (syncState.handle || syncState.name) ? b('⟳', 'Updates', 'data-action="syncCheck"', false) : ''}
      ${b('◐', ui.share ? 'Screen share on' : 'Screen share', 'data-action="share" title="Names become roles; TGM-only notes and items are hidden"', ui.share)}
      ${b('⤓', 'Back up', 'data-action="exportJSON"', false)}
      ${b('+', 'New client', 'data-action="newEng"', false)}
      ${b('↺', 'Classic view', 'data-action="classic" title="The earlier layout, kept until the next fortnightly review"', false)}
      <div class="gs-meta"><div id="status">Saved in this browser</div><div>Last backup: ${e.meta.lastExported ? new Date(e.meta.lastExported).toLocaleString('en-GB') : 'never'}</div><div>Studio ${typeof STUDIO_BUILD === 'undefined' ? 'dev' : STUDIO_BUILD}</div></div>
    </div>`;
}

/* ---------- Home (TGM) ---------- */
function viewHub(e) {
  const g = e.engagement, today = todayISO(), its = shellItems(e);
  const st = g.phases.length ? engagementStatus(e) : null;
  const acts = (g.activities || []).filter((a) => a.status !== 'Done' && !(ui.share && a.private));
  const overdue = acts.filter((a) => a.due && a.due < today).sort((a, b) => a.due.localeCompare(b.due));
  const soon = acts.filter((a) => a.due && a.due >= today && a.due <= addDaysISO(today, 2)).sort((a, b) => a.due.localeCompare(b.due));
  const reviews = splitList(g.reviewDates).filter((d) => d >= today).sort();
  const nextRev = reviews[0]; const toRev = nextRev ? daysBetween(today, nextRev) : null;
  const decide = its.filter((i) => i.stage === 'proposed' && String(i.portal) !== 'false');
  const reqs = st ? st.reqs.filter((r) => r._status === 'Waiting' || r._status === 'Overdue') : [];
  const late = st ? st.overdue : [];
  const keyReq = reqs.find((r) => String(r.key) === 'true');
  const cap = g.phases.length ? capacityInfo(e) : null;
  const f1 = (v) => (v % 1 ? v.toFixed(1) : String(v));
  const tile = (ring, lbl, v, s, hot, go) => `<button class="gs-panel gs-tile click" ${go}><span class="gs-knob ${hot ? 'hot' : ''}">↗</span><div>${ring}</div><div><div class="lbl">${lbl}</div><div class="v gs-num">${v}</div><div class="s">${s}</div></div></button>`;
  const dueChip = (d) => { if (!d) return '<span class="gs-due n">No date</span>'; const n = daysBetween(today, d); if (n < 0) return `<span class="gs-due bad">${-n} day${n === -1 ? '' : 's'} late</span>`; if (n === 0) return '<span class="gs-due warn">Today</span>'; if (n === 1) return '<span class="gs-due warn">Tomorrow</span>'; const [dd, mm] = dayMon(d); return `<span class="gs-due n">${dd} ${mm}</span>`; };
  const nowList = [...overdue, ...soon].slice(0, 7);
  const li = (c, ic, t, m, right) => `<div class="gs-li"><span class="gs-ic" style="--c:${c}">${ic}</span><div><div class="t">${t}</div>${m ? `<div class="m">${m}</div>` : ''}</div>${right || ''}</div>`;
  const ORDER = { underway: 0, approved: 1, proposed: 2 };
  const motion = its.filter((i) => ORDER[i.stage] !== undefined).sort((a, b) => (String(b.pinned) === 'true') - (String(a.pinned) === 'true') || ORDER[a.stage] - ORDER[b.stage] || num(a.order) - num(b.order)).slice(0, 7);
  const nextChip = (i) => { if (!i.nextDate) return ''; const iso = mvDate(e, i.nextDate); const n = iso ? daysBetween(today, iso) : null; const cls = n === null ? 'n' : n < 0 ? 'bad' : n <= 3 ? 'warn' : 'n'; return `<span class="gs-due ${cls}">${esc(i.nextDate)}</span>`; };
  // departments
  const depts = ITEM_DEPTS.map(([k, n]) => {
    const l = deptItems(e, k); const c = (ks) => l.filter((i) => ks.includes(i.stage)).length;
    const strip = [c(['found', 'investigating']), c(['proposed', 'approved']), c(['underway']), c(['live'])];
    return `<button class="gs-panel gs-dt click" data-action="dept" data-id="${k}" style="--dc:var(--gd-${k})"><span class="gs-edge"></span><span class="gs-knob">→</span>
      <div class="hd"><span class="gs-ic" style="--c:var(--gd-${k})">${DEPT_ICON[k]}</span><div class="n">${esc(n)}</div></div>
      <div class="row"><span class="cnt gs-num">${l.length}</span><span class="f">${c(['proposed'])} for decision · ${c(['underway'])} under way</span></div>
      <div class="gs-well gs-strip">${strip.map((x) => `<div class="${x ? 'on' : ''} gs-num">${x || ''}</div>`).join('')}</div>
      <div class="gs-stripl"><span>Found</span><span>Proposed</span><span>Under way</span><span>Live</span></div></button>`;
  }).join('');
  const stageRow = ITEM_STAGES.map(([k, n]) => { const c = its.filter((i) => i.stage === k).length; return `<button class="gs-panel gs-sb click" data-action="stage" data-id="${k}"><span class="v gs-num">${c}</span><span class="l">${n}</span></button>`; }).join('');
  // ahead
  const horizon = addDaysISO(today, 21); const ev = [];
  reviews.filter((d) => d <= horizon).forEach((d) => ev.push({ d, t: 'Fortnightly review', m: decide.length ? `${decide.length} decision${decide.length === 1 ? '' : 's'} to take` : '', hot: d === nextRev }));
  (g.milestones || []).forEach((m) => { if (m.date && m.date >= today && m.date <= horizon && !/review/i.test(m.title || '')) ev.push({ d: m.date, t: m.title, m: '' }); });
  its.forEach((i) => { const iso = i.nextDate && mvDate(e, i.nextDate); if (iso && iso >= today && iso <= horizon && i.stage !== 'parked') ev.push({ d: iso, t: i.next || i.title, m: i.title }); });
  ev.sort((a, b) => a.d.localeCompare(b.d));
  const ag = ev.slice(0, 6).map((x) => { const [dd, mm] = dayMon(x.d); return `<div class="gs-ag${x.hot ? ' hot' : ''}"><div class="d"><b class="gs-num">${dd}</b><span>${mm}</span></div><div><div class="t">${esc(x.t)}</div>${x.m ? `<div class="m">${esc(x.m)}</div>` : ''}</div></div>`; }).join('') || '<p class="gs-empty">Nothing dated in the next three weeks.</p>';
  const pinned = its.filter((i) => String(i.pinned) === 'true');
  const kpis = live(e.kpis || []);
  const lr = (e.liveReports || [])[0];
  const fb = live(e.reportFeedback || []);
  const hidden = live(e.items || []).filter((i) => String(i.portal) === 'false').length;
  return `<div class="gs-top"><div><h1>Home</h1><div class="s">${esc(e.client.name)}${st && st.current ? ` · ${esc(st.current.name)}` : ''}${g.start && g.end ? ` · ${longDate(g.start)} to ${longDate(g.end)}` : ''}</div></div>
      <div class="gs-pills">${flagBadge(e)}${lr ? `<button class="gs-pill" data-action="tab" data-id="progress" data-sub="report">Founder portal · ${fb.length} comment${fb.length === 1 ? '' : 's'} or flag${fb.length === 1 ? '' : 's'}</button>` : ''}</div></div>
    <div class="gs-sh"><h3>At a glance</h3><i></i></div>
    <div class="gs-tiles">
      ${tile(gsRing(acts.length ? overdue.length / acts.length : 0, String(overdue.length), 'overdue', { hot: overdue.length > 0 }), 'My to-dos past their date', `${overdue.length} <small>of ${acts.length} open</small>`, soon.length ? `<b>${soon.length}</b> more due in the next two days` : 'Nothing else due in the next two days', overdue.length > 0, 'data-action="tab" data-id="progress" data-sub="progress"')}
      ${tile(gsRing(toRev === null ? 0 : Math.max(0, 14 - toRev) / 14, toRev === null ? '–' : `${toRev}d`, 'to go'), 'Next fortnightly review', nextRev ? (() => { const [dd, mm] = dayMon(nextRev); return `${new Date(nextRev + 'T00:00:00').toLocaleString('en-GB', { weekday: 'short' })} ${dd} ${mm}`; })() : 'Not set', decide.length ? `<b>${decide.length} decision${decide.length === 1 ? '' : 's'}</b> to take to the founders` : 'No decisions waiting', false, 'data-action="stage" data-id="proposed"')}
      ${tile(gsRing(reqs.length ? late.length / reqs.length : 0, String(late.length), 'late'), `Waiting on ${esc(e.client.name)}`, `${reqs.length} <small>requests</small>`, `<b>${late.length}</b> past their due date${keyReq ? ' · 1 marked key' : ''}`, false, 'data-action="tab" data-id="progress" data-sub="progress"')}
      ${cap ? tile(gsRing(cap.total ? cap.used / cap.total : 0, f1(cap.used), `of ${f1(cap.total)}`), 'My days', `${f1(cap.used)} <small>of ${f1(cap.total)} used</small>`, cap.fl ? 'Front-loaded, as agreed; invoicing unchanged' : `${f1(cap.remaining)} remaining`, false, 'data-action="tab" data-id="progress" data-sub="progress"') : ''}
    </div>
    <div class="gs-sh"><h3>To do and in motion</h3><i></i></div>
    <div class="gs-row2">
      <div class="gs-panel"><span class="gs-knob ${overdue.length ? 'hot' : ''}">!</span><div class="gs-ph"><h2>Needs you now</h2><span class="s">Oldest first · from your to-do list</span></div>
        <div class="gs-well gs-list">${nowList.length ? nowList.map((a) => li(a.due < today ? 'var(--gs-bad)' : 'var(--gs-warn)', a.due < today ? '!' : '›', esc(a.title), a.private ? '🔒 TGM only' : '', dueChip(a.due))).join('') : '<p class="gs-empty">Nothing overdue or due in the next two days.</p>'}</div></div>
      <div class="gs-panel"><span class="gs-knob">↗</span><div class="gs-ph"><h2>Key changes in motion</h2><span class="s">Next step and date for each</span></div>
        <div class="gs-well gs-list">${motion.map((i) => { const d = splitList(i.depts)[0]; return li(`var(--gd-${d})`, DEPT_ICON[d] || '•', `${esc(i.title)} <span class="gs-stg">${esc(ITEM_STAGE_NAME[i.stage])}</span>`, i.next ? esc(i.next) : '', nextChip(i)); }).join('') || '<p class="gs-empty">No items approved or under way yet.</p>'}</div></div>
    </div>
    <div class="gs-sh"><h3>Departments</h3><i></i></div>
    <div class="gs-depts">${depts}</div>
    <div class="gs-stages">${stageRow}</div>
    <div class="gs-sh"><h3>Ahead</h3><i></i></div>
    <div class="gs-row3">
      <div class="gs-panel"><span class="gs-knob">↗</span><div class="gs-ph"><h2>Coming up</h2><span class="s">Next three weeks</span></div><div class="gs-well gs-agenda">${ag}</div></div>
      <div class="gs-panel"><span class="gs-knob">↗</span><div class="gs-ph"><h2>Their headline numbers</h2><span class="s">What we're measured against</span></div><div class="gs-well gs-box">
        ${pinned.map((i) => `<div class="k">Pinned · founder priority</div><div class="gs-pinned">${esc(i.title)}</div><div class="m">${esc(i.line || '')}</div>`).join('')}
        ${kpis.map((k) => `<div class="gs-kv"><span>${esc(k.label)}${k.sub ? `<small>${esc(k.sub)}</small>` : ''}</span><b class="gs-num">${esc(k.value)}</b></div>`).join('')}
        ${kpis.length || pinned.length ? '' : '<p class="gs-empty">No headline numbers yet.</p>'}</div></div>
      <div class="gs-panel"><span class="gs-knob">↗</span><div class="gs-ph"><h2>Founder portal</h2><span class="s">What the founders see</span></div><div class="gs-well gs-box">
        ${lr ? `<div class="gs-kv"><span>Recipients</span><b class="gs-num">${(lr.recipients || []).length}</b></div>
        <div class="gs-kv"><span>Comments and red flags</span><b class="gs-num">${fb.length}</b></div>
        <div class="gs-kv"><span>Decisions shown to them</span><b class="gs-num">${decide.length}</b></div>
        <div class="gs-kv"><span>Items kept TGM only</span><b class="gs-num">${ui.share ? '–' : hidden}</b></div>` : '<p class="gs-empty">No founder portal set up yet (Reports).</p>'}</div></div>
    </div>`;
}

/* ---------- a department's board (first cut; filters, detail panel and headline numbers come in step 3) ---------- */
function itemCard(it, here) {
  const others = splitList(it.depts).filter((d) => d !== here);
  return `<div class="gs-card">
    <div class="row">${it.label ? `<span class="gs-lb lb-${esc(it.label)}">${LABEL_TXT[it.label] || esc(it.label)}</span>` : '<span></span>'}<span class="tys">${splitList(it.types).map(typeIcon).join('')}</span></div>
    <h3>${esc(it.title)}${String(it.pinned) === 'true' ? ' <span class="gs-pin">● Pinned</span>' : ''}${String(it.portal) === 'false' ? ' <span class="gs-tgm">TGM only</span>' : ''}</h3>
    ${it.line ? `<p>${esc(it.line)}</p>` : ''}
    ${it.next ? `<div class="nx"><b>Next:</b> ${esc(it.next)}${it.nextDate ? ` · ${esc(it.nextDate)}` : ''}</div>` : ''}
    ${others.length ? `<div class="also"><span>${here ? 'Also in' : 'In'}</span>${others.map((d) => `<span><i style="background:var(--gd-${d})"></i>${esc(ITEM_DEPT_NAME[d] || d)}</span>`).join('')}</div>` : ''}</div>`;
}
function viewDept(e) {
  const k = ITEM_DEPT_NAME[ui.dept] ? ui.dept : 'lead'; ui.dept = k;
  const l = deptItems(e, k); const parked = l.filter((i) => i.stage === 'parked');
  const cols = STAGE_FLOW.map(([s, n]) => { const cs = l.filter((i) => i.stage === s); return `<div class="gs-col"><div class="ch">${n}<span class="gs-num">${cs.length}</span></div>${cs.length ? cs.map((i) => itemCard(i, k)).join('') : '<div class="gs-emptycol">Nothing here yet</div>'}</div>`; }).join('');
  const lab = (x) => l.filter((i) => i.label === x).length;
  return `<div class="gs-top"><div><h1 class="gs-dh" style="--dc:var(--gd-${k})"><i></i>${esc(ITEM_DEPT_NAME[k])}</h1><div class="s">${l.length} items · ${[['leak', 'leaks'], ['opportunity', 'opportunities'], ['weakness', 'weaknesses']].filter(([x]) => lab(x)).map(([x, w]) => `${lab(x)} ${w}`).join(' · ')}</div></div>
      <div class="gs-tabs"><span class="on">Board</span><span title="Step 4">Processes</span><span title="Step 5">Evidence</span><span title="Step 5">Conversations</span><span title="Step 5">Data</span></div></div>
    <div class="gs-board">${cols}</div>
    ${parked.length ? `<div class="gs-sh"><h3>Parked · the client's decision</h3><i></i></div><div class="gs-parked">${parked.map((i) => itemCard(i, k)).join('')}</div>` : ''}`;
}

/* ---------- every item at one stage, across departments (replaces the Key changes page) ---------- */
function viewStage(e) {
  const s = ITEM_STAGE_NAME[ui.stage] ? ui.stage : 'underway'; ui.stage = s;
  const its = shellItems(e);
  const tabs = ITEM_STAGES.map(([k, n]) => `<button class="${k === s ? 'on' : ''}" data-action="stage" data-id="${k}">${n} <span class="gs-num">${its.filter((i) => i.stage === k).length}</span></button>`).join('');
  const l = its.filter((i) => i.stage === s);
  return `<div class="gs-top"><div><h1>${esc(ITEM_STAGE_NAME[s])}</h1><div class="s">${l.length} item${l.length === 1 ? '' : 's'} across the business</div></div></div>
    <div class="gs-stagetabs">${tabs}</div>
    <div class="gs-grid">${l.map((i) => `<div class="gs-stagecard" style="--dc:var(--gd-${splitList(i.depts)[0]})">${itemCard(i, '')}</div>`).join('') || '<p class="gs-empty">No items at this stage.</p>'}</div>`;
}
