/* Business processes and flows page.
   Department view: one primary department -> the processes it is involved in.
   Process view: one or more processes -> the departments involved (unticked departments collapse to grey).
   Processes have an optional group label and can trigger other processes (leadsTo); there are no fixed stages. */

const procGroup = (p) => p.group || (p.stage ? 'Client lifecycle' : 'Ungrouped');
const procDepts = (p, pById, dById) => { const s = new Set(); (p.steps || []).filter((x) => !x._removed).forEach((x) => { const t = stepTeam(x, pById, dById); if (t) s.add(t); }); return s; };

/** Current selection, with sensible defaults so the page is never empty. */
function pvState(st) {
  const pById = byId(st.people), dById = byId(st.departments);
  const allProcs = st.processes.filter((p) => !p._removed);
  const subOf = {}; allProcs.forEach((p) => (p.steps || []).forEach((x, i) => { if (x.subProcessId && !subOf[x.subProcessId]) subOf[x.subProcessId] = { p, s: x, i }; }));
  // a step that opens into a sub-process carries a summary of what is inside, so its issues count on the parent map
  const decorate = (p) => Object.assign({}, p, { steps: (p.steps || []).map((x) => { const sp = x.subProcessId && allProcs.find((y) => y.id === x.subProcessId); if (!sp) return x;
    const iss = flowFlags(sp, st.people, st.tools, st.departments, true).filter((f) => f.type === 'issue');
    return Object.assign({}, x, { _sub: { id: sp.id, name: sp.name, n: iss.length, mapped: !!(sp.steps || []).length, sev: (sp.steps || []).some((y) => y.painSeverity === 'high' && y.painPoint) ? 'high' : 'medium' } }); }) });
  const procs = allProcs.filter((p) => (p.steps || []).length).map(decorate);
  const deptsOf = Object.fromEntries(procs.map((p) => [p.id, procDepts(p, pById, dById)]));
  const counts = {}; procs.forEach((p) => (p.steps || []).forEach((s) => { const t = stepTeam(s, pById, dById); if (t) counts[t] = (counts[t] || 0) + 1; }));
  const allDepts = TEAMS.map((t) => t[0]).filter((t) => counts[t] && t !== 'client' && t !== 'system');
  const V = ui.pv || {};
  const mode = V.mode === 'proc' ? 'proc' : 'dept';
  const busiest = allDepts.slice().sort((a, b) => counts[b] - counts[a])[0] || '';
  const dept = allDepts.includes(V.dept) ? V.dept : busiest;
  const deptProcs = procs.filter((p) => deptsOf[p.id].has(dept)).map((p) => p.id);
  const dSel = (V.dprocs || []).filter((id) => deptProcs.includes(id));
  const focus = allProcs.some((p) => p.id === V.focus) ? V.focus : ''; const focusP = allProcs.find((p) => p.id === focus);
  const focusMapped = !!(focusP && (focusP.steps || []).length);
  let procIds;
  if (mode === 'dept') procIds = dSel.length ? dSel : deptProcs;
  else if (!focusMapped) procIds = [];
  else if (V.journey) { const grp = procGroup(focusP); const ch = procChains(procs, procs.filter((p) => procGroup(p) === grp).map((p) => p.id)).find((c) => c.some((p) => p.id === focus)); procIds = ch ? ch.map((p) => p.id) : [focus]; }
  else procIds = [focus];
  const availDepts = TEAMS.map((t) => t[0]).filter((t) => procIds.some((id) => deptsOf[id].has(t)));
  const shownDepts = availDepts;
  const hl = mode === 'proc' && availDepts.includes(V.hl) ? V.hl : '';
  return { mode, dept, deptProcs, procIds, availDepts, shownDepts, allDepts, counts, procs, deptsOf, layout: V.layout === 'lanes' ? 'lanes' : 'flow', allProcs, subOf, focus, focusP, focusMapped, journey: !!V.journey, hl };
}

/** Order the selected processes into chains following "triggers" links; unlinked processes stand alone. */
function procChains(procs, ids) {
  const sel = ids.map((id) => procs.find((p) => p.id === id)).filter(Boolean);
  const inSel = new Set(sel.map((p) => p.id));
  const next = (p) => splitList(p.leadsTo).filter((id) => inSel.has(id));
  const hasIn = new Set(sel.flatMap((p) => next(p)));
  const used = new Set(); const chains = [];
  const walk = (p, chain) => { if (!p || used.has(p.id)) return; used.add(p.id); chain.push(p); next(p).forEach((id, k) => { if (k === 0) walk(sel.find((x) => x.id === id), chain); }); };
  sel.filter((p) => !hasIn.has(p.id)).forEach((p) => { const c = []; walk(p, c); if (c.length) chains.push(c); });
  sel.filter((p) => !used.has(p.id)).forEach((p) => { const c = []; walk(p, c); if (c.length) chains.push(c); });
  return chains;
}

/** Steps to draw, numbered across the whole visual. Unticked departments (process view) collapse into grey cards. */
function pvSeq(st, P) {
  const pById = byId(st.people), dById = byId(st.departments);
  const chains = procChains(P.procs, P.procIds); let n = 0;
  return chains.map((chain) => {
    const items = [];
    chain.forEach((p, pi) => (p.steps || []).filter((x) => !x._removed).forEach((s, si) => {
      n++; const dept = stepTeam(s, pById, dById) || 'other';
      items.push({ s, p, dept, num: n, procStart: si === 0 && pi > 0, shown: P.mode === 'dept' || P.shownDepts.includes(dept) || dept === 'client' || dept === 'system' || dept === 'other' });
    }));
    return { chain, items };
  });
}

/** One merged pseudo-process per chain, for the serpentine flow. */
function chainAsProcess(c, P) {
  const steps = [];
  c.items.forEach((it) => {
    if (!it.shown) {
      const last = steps[steps.length - 1];
      if (last && last.collapsed) { last._n++; last._d.add(teamInfo(it.dept)[1]); last.name = `${[...last._d].join(', ')}: ${last._n} steps`; last.displayNum = `${last._from}–${it.num}`; return; }
      steps.push({ id: it.s.id, collapsed: true, _n: 1, _from: it.num, displayNum: it.num, _d: new Set([teamInfo(it.dept)[1]]), name: `${teamInfo(it.dept)[1]}: ${it.s.name}`, team: '', automated: false, toolId: '', actorLabel: '' }); return;
    }
    steps.push(Object.assign({}, it.s, { team: it.dept === 'other' ? '' : it.dept, displayNum: it.num, _procStart: it.procStart ? it.p.name : '', _focus: P.mode === 'dept' && it.dept === P.dept, _dim: !!(P.hl && it.dept !== P.hl) }));
  });
  const first = c.chain[0], last = c.chain[c.chain.length - 1];
  return { id: 'chain_' + first.id, name: c.chain.map((p) => p.name).join(' → '), inputs: first.inputs, outputs: last.outputs, steps, sources: c.chain.map((p) => p.sources).filter(Boolean).join('; ') };
}

/** Swimlanes across all chains: one row per department, steps in sequence, hand-offs crossing rows. */
function pvLanes(st, P, seqChains, { exec = true, interactive = true, zoom = 0, selected = '', clientSafe = true, ranks = null } = {}) {
  const tById = byId(st.tools);
  const all = seqChains.flatMap((c) => c.items);
  if (!all.length) return '<p class="empty">Nothing to show for this selection.</p>';
  let lanes = TEAMS.map((t) => t[0]).filter((t) => all.some((x) => x.shown && x.dept === t));
  if (P.mode === 'dept' && lanes.includes(P.dept)) lanes = [P.dept, ...lanes.filter((t) => t !== P.dept)];
  if (all.some((x) => x.shown && x.dept === 'other')) lanes.push('other');
  const hasHidden = all.some((x) => !x.shown);
  const flagsFor = {}; seqChains.forEach((c) => c.chain.forEach((p) => flowFlags(p, st.people, st.tools, st.departments, clientSafe).forEach((f) => (flagsFor[f.stepId] = flagsFor[f.stepId] || []).push(f))));
  const LW = 210, CW = 172, NW = 150, NH = 104, LH = 148, TOP = 92, OTH = 64, GAP = 60;
  const bpx = exec ? (ranks ? { ranks, label: ranks._label || {} } : breakPoints(all.map((x) => x.s), Object.values(flagsFor).flat())) : { ranks: {}, label: {} }; const rk = bpx.ranks;
  const cols = []; let x = LW; seqChains.forEach((c, ci) => { if (ci) x += GAP; c.items.forEach((it) => { cols.push({ it, x }); x += CW; }); });
  const W = x + 24; const lanesBottom = TOP + lanes.length * LH + (hasHidden ? OTH : 0);
  const toolsUsed = {}; all.forEach((it) => { if (it.shown && it.s.toolId && tById[it.s.toolId]) (toolsUsed[it.s.toolId] = toolsUsed[it.s.toolId] || new Set()).add(it.dept); });
  const toolRows = Object.entries(toolsUsed).sort((a, b) => b[1].size - a[1].size);
  const TT = lanesBottom + 46, H = TT + 24 + toolRows.length * 36 + 18;
  const T = (x2, y, t, cls, anchor) => `<text class="${cls}" x="${x2}" y="${y}" ${anchor ? `text-anchor="${anchor}"` : ''}>${esc(t)}</text>`;
  let g = `<svg class="flow-svg jl" viewBox="0 0 ${W} ${H}" ${zoom ? `width="${Math.round(W * zoom)}" height="${Math.round(H * zoom)}" style="max-width:none"` : `width="100%" style="max-width:${W}px"`} data-w="${W}" data-h="${H}" role="img" aria-label="Swimlane">`;
  g += '<defs><marker id="jla" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fa"/></marker><marker id="jlb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fb"/></marker></defs>';
  // process brackets
  seqChains.forEach((c) => c.chain.forEach((p) => { const cs = cols.filter((k) => k.it.p.id === p.id); if (!cs.length) return; const x1 = cs[0].x + 4, x2 = cs[cs.length - 1].x + NW;
    g += `<rect class="jl-stage" x="${x1}" y="18" width="${Math.max(40, x2 - x1)}" height="44" rx="8"/>${T(x1 + 12, 35, procGroup(p).toUpperCase(), 'jl-st')}${T(x1 + 12, 52, trunc(p.name, Math.max(8, Math.floor((x2 - x1) / 7.4))), 'jl-pn')}`; }));
  const LS = LW - 12; let lab = `<rect class="jl-stbg" x="0" y="0" width="${LS}" height="${H}"/>`; // sticky department column (shown when zoomed)
  lanes.forEach((t, i) => { const y = TOP + i * LH; const ti = teamInfo(t); const prim = P.mode === 'dept' && t === P.dept;
    lab += `<rect class="jl-lane ${i % 2 ? 'alt' : ''} ${prim ? 'prim' : ''}" x="0" y="${y}" width="${LS}" height="${LH}"/><rect x="0" y="${y}" width="${prim ? 10 : 6}" height="${LH}" style="fill:${t === 'other' ? 'var(--line)' : ti[2]}"/>${T(20, y + LH / 2 - 2, t === 'other' ? 'Unassigned' : ti[1], 'jl-ln')}${T(20, y + LH / 2 + 15, prim ? 'primary department' : `${all.filter((k) => k.shown && k.dept === t).length} steps`, 'jl-ls')}`;
    g += `<rect class="jl-lane ${i % 2 ? 'alt' : ''} ${prim ? 'prim' : ''}" x="0" y="${y}" width="${W}" height="${LH}"/><rect x="0" y="${y}" width="${prim ? 10 : 6}" height="${LH}" style="fill:${t === 'other' ? 'var(--line)' : ti[2]}"/>${T(20, y + LH / 2 - 2, t === 'other' ? 'Unassigned' : ti[1], 'jl-ln')}${T(20, y + LH / 2 + 15, prim ? 'primary department' : `${all.filter((k) => k.shown && k.dept === t).length} steps`, 'jl-ls')}`; });
  if (hasHidden) { const oth = (w) => `<rect class="jl-lane other" x="0" y="${TOP + lanes.length * LH}" width="${w}" height="${OTH}"/>${T(20, TOP + lanes.length * LH + OTH / 2 - 2, 'Other departments', 'jl-ln')}${T(20, TOP + lanes.length * LH + OTH / 2 + 14, '(not ticked)', 'jl-ls')}`; g += oth(W); lab += oth(LS); }
  seqChains.forEach((c, ci) => { if (!ci) return; const xc = cols.find((k) => k.it === c.items[0]).x - GAP / 2 - 6; g += `<line class="jl-div" x1="${xc}" x2="${xc}" y1="${TOP - 6}" y2="${lanesBottom}"/>`; });
  const pos = new Map(cols.map(({ it, x: cx }) => [it, { x: cx, y: it.shown ? TOP + lanes.indexOf(it.dept) * LH + (LH - NH) / 2 : TOP + lanes.length * LH + 12, w: NW, h: it.shown ? NH : 40 }]));
  seqChains.forEach((c) => c.items.forEach((it, i) => { if (!i) return; const prev = c.items[i - 1]; const a = pos.get(prev), b = pos.get(it);
    const cross = prev.dept !== it.dept; const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x - 2, y2 = b.y + b.h / 2, mx = (x1 + x2) / 2;
    const hl = selected && (it.s.id === selected || prev.s.id === selected) ? ' hl' : '';
    g += `<path class="jl-link ${cross ? 'ho' : ''}${it.procStart ? ' trig' : ''}${hl}" d="M${x1},${y1} H${mx} V${y2} H${x2}" marker-end="url(#${cross ? 'jlb' : 'jla'})"/>`;
    if (it.procStart) g += T(b.x + 2, b.y - (rk[it.s.id] ? 22 : 7), '▸ triggers: ' + trunc(it.p.name, 22), 'jl-trig');
    const wk = exec ? (flagsFor[it.s.id] || []).filter((f) => f.on === 'link') : [];
    if (wk.length) g += `<g class="${interactive ? 'clk' : ''}" ${interactive ? `data-action="flowStep" data-id="${esc(it.s.id)}" data-flag="link"` : ''} data-tip="${esc(wk.map((f) => f.text).join(' · '))}">${flagShape('weakness', '', mx, (y1 + y2) / 2, 10)}</g>`; }));
  all.forEach((it) => { const P2 = pos.get(it); const t = tById[it.s.toolId]; const tm = teamInfo(it.dept); const act = interactive ? `data-action="flowStep" data-id="${esc(it.s.id)}"` : '';
    const fl = exec ? (flagsFor[it.s.id] || []) : [];
    const tip = esc([`${it.num}. ${it.s.name}`, tm[1], it.s.actorLabel, t ? t.name : 'No system', stepTimeText(it.s, true), fl.map((f) => f.text).join(' · ')].filter(Boolean).join(' · '));
    if (!it.shown) { g += `<g class="jl-o ${interactive ? 'clk' : ''}" ${act} data-tip="${tip}"><rect x="${P2.x}" y="${P2.y}" width="${P2.w}" height="${P2.h}" rx="20" style="stroke:${tm[2]}"/>${T(P2.x + 12, P2.y + 17, `${it.num} · ${tm[1]}`, 'jl-ot')}${T(P2.x + 12, P2.y + 31, trunc(it.s.name, 24), 'jl-on')}</g>`; return; }
    const hot = exec && isHotspot(it.s), dec = exec && it.s.kind === 'decision', rv = (it.s.review && it.s.review.status) || 'assumed';
    const issue = fl.some((f) => f.type !== 'unverified'); const rank = rk[it.s.id];
    g += `<g class="jl-n ${P.hl && it.dept !== P.hl ? 'hl-dim' : ''} ${rank ? 'bp-top' : issue ? 'bp-lite' : ''} ${it.s.automated ? 'auto' : ''} ${dec ? 'decision' : ''} rvs-${rv} ${selected === it.s.id ? 'sel' : ''} ${interactive ? 'clk' : ''}" ${act} data-tip="${tip}">`;
    g += `<rect class="nb" x="${P2.x}" y="${P2.y}" width="${P2.w}" height="${P2.h}" rx="10"/><rect x="${P2.x}" y="${P2.y}" width="5" height="${P2.h}" rx="2" style="fill:${tm[2]}"/>`;
    g += `<circle class="num" cx="${P2.x + 18}" cy="${P2.y + 16}" r="9"/>${T(P2.x + 18, P2.y + 20, it.num, 'numt', 'middle')}`;
    if (dec) g += T(P2.x + 32, P2.y + 20, '◇ DECISION', 'jl-dec');
    if (rank) g += `<g class="bp-pill"><rect x="${P2.x + P2.w / 2 - 52}" y="${P2.y - 11}" width="104" height="19" rx="9.5"/><text x="${P2.x + P2.w / 2}" y="${P2.y + 3}" text-anchor="middle">${bpx.label[it.s.id] || '#' + rank} BREAK POINT</text></g>`;
    wrapText(it.s.name, 21, 3).forEach((ln, k) => { g += T(P2.x + 12, P2.y + 42 + k * 14, ln, 'jl-nm'); });
    if (exec && it.s.involves) g += T(P2.x + 12, P2.y + P2.h - 22, trunc('With: ' + it.s.involves, 24), 'jl-inv');
    g += T(P2.x + 12, P2.y + P2.h - 8, (it.s._sub ? '⊞ ' : '') + (it.s.automated ? '⚙ ' : '') + trunc(t ? t.name.replace(/ \(.*/, '') : 'No system', 16), `jl-tool ${t ? '' : 'none'}`);
    if (num(it.s.durationMins) || num(it.s.elapsedDays)) g += T(P2.x + P2.w - 8, P2.y + P2.h - 8, (hot ? '⏱ ' : '') + stepTimeText(it.s), `jl-time ${hot ? 'hot' : ''}`, 'end');
    const nf = fl.filter((f) => f.on === 'node' && f.type !== 'unverified'); const uv = fl.filter((f) => f.type === 'unverified');
    if (nf.length) g += flagShape('issue', nf.length > 1 ? nf.length : '!', P2.x + P2.w - 6, P2.y + 4, 10);
    if (uv.length) g += flagShape('unverified', uv.length > 1 ? uv.length : '?', P2.x + P2.w - (nf.length ? 32 : 6), P2.y + 6, 9);
    g += '</g>'; });
  g += `<line class="jl-sep" x1="0" x2="${W}" y1="${lanesBottom + 22}" y2="${lanesBottom + 22}"/>${T(20, TT + 2, 'TOOLS AND SYSTEMS', 'jl-th')}${T(LW, TT + 2, '● = a step that uses this tool, coloured by department', 'jl-ls')}`;
  toolRows.forEach(([tid, set], k) => { const y = TT + 30 + k * 36; const t = tById[tid];
    const tl = `${T(20, y - 2, trunc(t.name.replace(/ \(.*/, ''), 24), 'jl-tn')}${T(20, y + 13, set.size > 1 ? 'SHARED: ' + [...set].map((l) => teamInfo(l)[1]).join(' + ') : teamInfo([...set][0])[1] + ' only', set.size > 1 ? 'jl-sh' : 'jl-ls')}`;
    g += `<line class="jl-tl" x1="${LW - 10}" x2="${W - 20}" y1="${y - 4}" y2="${y - 4}"/>${tl}`; lab += tl;
    cols.forEach(({ it, x: cx }) => { if (it.shown && it.s.toolId === tid) g += `<circle cx="${cx + NW / 2}" cy="${y - 4}" r="7" class="jl-dot" style="fill:${teamInfo(it.dept)[2]}"/>${T(cx + NW / 2, y + 14, it.num, 'jl-dn', 'middle')}`; }); });
  g += '</svg>';
  if (!zoom || !interactive) return `<div class="flow-wrap${zoom ? ' zoomed' : ''}">${g}</div>`;
  const ov = `<svg class="jl jl-stick-svg" viewBox="0 0 ${LS} ${H}" width="${Math.round(LS * zoom)}" height="${Math.round(H * zoom)}" aria-hidden="true">${lab}${T(20, TT + 2, 'TOOLS AND SYSTEMS', 'jl-th')}<line class="jl-stedge" x1="${LS - 0.5}" x2="${LS - 0.5}" y1="0" y2="${H}"/></svg>`;
  return `<div class="flow-wrap zoomed"><div class="jl-grid"><div class="jl-stick">${ov}</div>${g}</div></div>`;
}

/** The visual for the current selection (flow: one serpentine per chain; swimlane: all chains in one). */
function pvVisual(st, P, seqChains, { exec, interactive = true, zoom = 0, cols = 3, selected = '', clientSafe = false, ranks = null } = {}) {
  if (P.layout === 'lanes') return pvLanes(st, P, seqChains, { exec, interactive, zoom, selected, clientSafe: true, ranks });
  return seqChains.map((c) => {
    const mp = chainAsProcess(c, P);
    const head = c.chain.length > 1 ? `<div class="chain-h"><span class="faint small">Linked processes:</span> ${c.chain.map((p) => `<b>${esc(p.name)}</b>`).join(' <span class="faint">→ triggers →</span> ')}</div>` : (seqChains.length > 1 ? `<div class="chain-h"><b>${esc(c.chain[0].name)}</b> <span class="faint small">${esc(procGroup(c.chain[0]))}</span></div>` : '');
    return head + flowSchematic(mp, st.people, st.tools, st.departments, { cols, selected, interactive, zoom, clientSafe, exec, anonymise: ui.anon, ranks });
  }).join('<div class="chain-gap"></div>');
}

/* ---------- Page ---------- */
function processPage(e) {
  const st = stateFor(e, ui.scenario); const cur = stateFor(e, 'current');
  if (ui.review) { const rp = cur.processes.find((x) => x.id === ui.review.procId); const mainW0 = (document.getElementById('main') || {}).clientWidth || 1100; if (rp) return reviewView(e, rp, cur, mainW0 < 1000 ? 2 : 3); }
  const head = `<div class="page-h"><div><span class="eyebrow">Processes</span><h1>Business processes and flows</h1><p class="muted">How work moves through the business: who does each step, with which systems, where it changes hands, and where it breaks.</p></div><div class="btn-row"><button class="btn sm" data-action="procNew">+ New process</button></div></div>`;
  const P = pvState(st);
  const sw0 = `<div class="pv-switch"><button class="seg ${P.mode === 'dept' ? 'on' : ''}" data-action="pvSet" data-k="mode" data-id="dept">Department view</button><button class="seg ${P.mode === 'proc' ? 'on' : ''}" data-action="pvSet" data-k="mode" data-id="proc">Process view</button></div>`;
  if (P.mode === 'proc' && !P.focus) return `${scenarioBanner(e)}${head}${pvIndex(e, st, P, sw0)}`;
  if (P.mode === 'proc' && !P.focusMapped) return `${scenarioBanner(e)}${head}${pvFocusHead(e, st, P, sw0, [])}${pvUnmapped(e, P)}`;
  if (!P.procs.length) return head + empty('No processes mapped yet. Click + New process, or merge process maps from Claude in Data & Claude.');
  const exec = ui.execView !== false;
  const pById = byId(st.people), dById = byId(st.departments);
  const seqChains = pvSeq(st, P); const all = seqChains.flatMap((c) => c.items);
  const single = P.procIds.length === 1 ? st.processes.find((p) => p.id === P.procIds[0]) : null;
  ui.processId = single ? single.id : '';
  if (ui.stepId && !all.some((it) => it.s.id === ui.stepId)) ui.stepId = '';

  // 3. switch
  const sw = `<div class="pv-switch"><button class="seg ${P.mode === 'dept' ? 'on' : ''}" data-action="pvSet" data-k="mode" data-id="dept">Department view</button><button class="seg ${P.mode === 'proc' ? 'on' : ''}" data-action="pvSet" data-k="mode" data-id="proc">Process view</button></div>`;
  // 4. refine
  const order = procChains(P.procs, P.procs.map((p) => p.id)).flat().map((p) => p.id);
  const groups = (ids) => { const out = {}; ids.slice().sort((a, b) => order.indexOf(a) - order.indexOf(b)).forEach((id) => { const p = P.procs.find((x) => x.id === id); (out[procGroup(p)] = out[procGroup(p)] || []).push(p); }); return out; };
  const procTick = (p, kind, on) => { const ds = [...P.deptsOf[p.id]].filter((t) => t !== 'client' && t !== 'system'); return `<label class="jtick ${on ? 'on' : ''}"><input type="checkbox" data-action="pvTick" data-kind="${kind}" data-id="${esc(p.id)}" ${on ? 'checked' : ''}><span>${esc(p.name)}</span><span class="pdots">${ds.map((t) => `<i class="tdot" title="${esc(teamInfo(t)[1])}" style="background:${teamInfo(t)[2]}"></i>`).join('')}</span></label>`; };
  const groupBlock = (ids, kind, isOn) => Object.entries(groups(ids)).map(([gname, ps]) => `<div class="pv-group"><span class="pv-gl">${esc(gname)}</span>${ps.map((p) => procTick(p, kind, isOn(p.id))).join('')}</div>`).join('');
  const deptChip = (t, kind, on, extra = '') => `<label class="jtick ${on ? 'on' : ''}"><input type="${kind === 'dept1' ? 'radio' : 'checkbox'}" name="${kind}" data-action="pvTick" data-kind="${kind}" data-id="${esc(t)}" ${on ? 'checked' : ''}><i class="tdot" style="background:${teamInfo(t)[2]}"></i>${esc(teamInfo(t)[1])}${extra}</label>`;
  const refine = P.mode === 'proc' ? '' : P.mode === 'dept'
    ? `<div class="pv-sec"><h5>1 · Primary department</h5><div class="jrow">${P.allDepts.map((t) => deptChip(t, 'dept1', t === P.dept, ` <span class="faint small">${P.procs.filter((p) => P.deptsOf[p.id].has(t)).length}</span>`)).join('')}</div></div>
       <div class="pv-sec"><h5>2 · Processes ${esc(teamInfo(P.dept)[1])} is involved in</h5>${groupBlock(P.deptProcs, 'dproc', (id) => P.procIds.includes(id))}</div>`
    : `<div class="pv-sec"><h5>1 · Processes</h5>${groupBlock(P.procs.map((p) => p.id), 'proc', (id) => P.procIds.includes(id))}</div>
       <div class="pv-sec"><h5>2 · Departments involved</h5><div class="jrow">${P.availDepts.filter((t) => t !== 'client' && t !== 'system').map((t) => deptChip(t, 'dept', P.shownDepts.includes(t))).join('')}<span class="faint small">Unticked departments shrink to grey markers.</span></div></div>`;
  const mainW = (document.getElementById('main') || {}).clientWidth || 1100;
  const visW = mainW > 1100 ? mainW - 390 : mainW;
  const colsN = ui.flowCols || ui.flowColsAuto || (visW < 560 ? 1 : visW < 900 ? 2 : 3);
  const laneW = 210 + all.length * 172 + (seqChains.length - 1) * 60 + 24;
  const laneZoom = ui.flowZoom || Math.min(1, Math.max((visW - 30) / laneW, 0.8));
  const z = P.layout === 'lanes' ? laneZoom : ui.flowZoom;
  const seg = (on, act, k, id, label, title = '') => `<button class="seg ${on ? 'on' : ''}" data-action="${act}" ${k ? `data-k="${k}"` : ''} data-id="${id}" ${title ? `title="${title}"` : ''}>${label}</button>`;
  const bar = `<div class="pv-bar">
    <div class="pv-g"><span class="pv-switch sm">${seg(P.layout === 'flow', 'pvSet', 'layout', 'flow', 'Flow')}${seg(P.layout === 'lanes', 'pvSet', 'layout', 'lanes', 'Swimlane')}</span>
      <label class="tog"><input type="checkbox" data-ui="execView" ${exec ? 'checked' : ''}> <b>Executive view</b></label>
      ${exec ? `<span class="faint small">Top</span><span class="pv-switch sm" title="How many top break points to highlight">${[3, 5, 10, 0].map((n) => seg((ui.bpTop == null ? 5 : ui.bpTop) === n, 'bpTop', '', n, n || 'All')).join('')}</span>` : ''}
      <label class="tog"><input type="checkbox" data-ui="anon" ${ui.anon ? 'checked' : ''}> Anonymise</label></div>
    <div class="pv-g"><span class="pv-switch sm" title="Size">${seg(ui.flowWhole && ui.flowZoom, 'flowZoom', '', 'fit', '⤢', 'Whole view on one screen')}${seg(false, 'flowZoom', '', 'out', '−', 'Zoom out')}<span class="seg zl" title="Current size">${z ? Math.round(z * 100) + '%' : 'Fit'}</span>${seg(false, 'flowZoom', '', 'in', '+', 'Zoom in')}${seg(z === 1, 'flowZoom', '', '100', '1:1', 'Full size')}</span>
      ${P.layout === 'flow' ? `<span class="pv-switch sm" title="Steps per row"><span class="seg zl" title="Steps per row">▦</span>${[1, 2, 3, 4, 5].map((n) => seg(colsN === n, 'flowCols', '', n, n)).join('')}</span>` : ''}</div>
    <div class="pv-g pv-r">${single ? '<button class="btn sm" data-action="reviewSetup" title="Walk this process live with someone and record what they confirm or correct">▶ Sense-check</button>' : '<button class="btn sm" disabled title="Select a single process to sense-check it">▶ Sense-check</button>'}
      <details class="pv-export pv-key"><summary class="btn sm" title="What the symbols mean">?</summary><div class="pv-exp-menu pv-key-pop">${flowLegend(!exec)}</div></details>
      <details class="pv-export"><summary class="btn sm">Export ▾</summary><div class="pv-exp-menu">
      <label class="fld"><span>For</span><select data-ui="flowAudience"><option value="client" ${ui.flowAudience === 'internal' ? '' : 'selected'}>Client-safe (issues and weaknesses only)</option><option value="internal" ${ui.flowAudience === 'internal' ? 'selected' : ''}>TGM internal (adds unverified points and sources)</option></select></label>
      <button class="btn sm" data-action="pvExport" data-id="png">Image (PNG)</button><button class="btn sm" data-action="pvExport" data-id="svg">Vector (SVG)</button><button class="btn sm" data-action="pvExport" data-id="pdf">PDF page</button><button class="btn sm" data-action="pvExport" data-id="html">HTML page</button>
      <button class="btn sm ghost" data-action="pvExport" data-id="all">Each selected process, one page each (PDF)</button>${single ? '<button class="btn sm ghost" data-action="exportFlow" data-id="sheet">Sense-check sheet (PDF)</button>' : ''}</div></details></div></div>
  </div>`;
  // flags for the visual (internal: includes unverified)
  const flags = []; seqChains.forEach((c) => c.chain.forEach((p) => flowFlags(p, st.people, st.tools, st.departments).forEach((f) => flags.push(f))));
  const shownIds = new Set(all.filter((it) => it.shown).map((it) => it.s.id));
  const shownFlags = flags.filter((f) => shownIds.has(f.stepId));
  const BP = breakPoints(all.filter((it) => it.shown).map((it) => it.s), shownFlags);
  Object.defineProperty(BP.ranks, '_label', { value: BP.label, enumerable: false });
  // 7. visual
  const visual = pvVisual(st, P, seqChains, { exec, zoom: P.layout === 'lanes' ? laneZoom : ui.flowZoom, cols: colsN, selected: ui.stepId, ranks: BP.ranks });
  // 8. side panel
  const side = pvSide(e, st, P, seqChains, shownFlags, exec, BP);
  // 9. summaries
  const summaries = pvSummaries(e, st, P, seqChains, shownFlags);
  const shownSteps = all.filter((it) => it.shown).map((it) => it.s); const nT = (t) => shownFlags.filter((f) => f.type === t).length;
  const dec = shownSteps.filter((x) => x.kind === 'decision').length, mg = shownSteps.filter((x) => x.involves).length, hot = shownSteps.filter(isHotspot).length;
  const pill = (v, label, cls = '') => `<span class="es-i ${v ? '' : 'es-z'} ${cls}"><b>${v}</b> ${label}</span>`;
  const legend = exec ? `<div class="exec-slim"><span class="es-t">Executive view</span>${pill(Object.keys(BP.ranks).length, 'top break points', 'es-bp')}${pill(nT('issue'), 'issues')}${pill(nT('weakness'), 'weak hand-offs')}${pill(nT('unverified'), 'to confirm')}${pill(dec, 'decisions')}${pill(mg, 'management touchpoints')}${pill(hot, hot ? 'time hotspots' : 'time hotspots (add times)')}</div>` : '<div class="exec-slim off"><span class="faint small">Executive view is off: steps, people, systems and hand-offs only.</span></div>';
  const what = P.mode === 'dept' ? `${teamInfo(P.dept)[1]} · ${P.procIds.length} process${P.procIds.length === 1 ? '' : 'es'}` : (() => { const nd = P.shownDepts.filter((t) => t !== 'client' && t !== 'system').length; return `${P.procIds.length} process${P.procIds.length === 1 ? '' : 'es'} · ${nd} department${nd === 1 ? '' : 's'}`; })();
  const top = P.mode === 'proc' ? pvFocusHead(e, st, P, sw, all) : `<section class="card pv-top"><div class="pv-toprow">${sw}<span class="pv-what"><b>${esc(what)}</b> <span class="faint small">· ${all.filter((it) => it.shown).length} steps · ${all.filter((it, i) => it.shown && i && all[i - 1].dept !== it.dept).length} hand-offs</span></span></div>${refine}</section>`;
  return `${scenarioBanner(e)}${head}
  ${top}
  ${ui.reviewSetup && single ? reviewChooser(e, single) : ''}
  <section class="card pv-main">${bar}${legend}
    <div class="flow-split"><div class="pv-visual">${visual}</div><aside class="flow-side">${side}</aside></div></section>
  ${summaries}`;
}

/** Right-hand panel: takeaways for the selection, or the clicked step in context. */
function pvSide(e, st, P, seqChains, flags, exec, BP) {
  const all = seqChains.flatMap((c) => c.items); const pById = byId(st.people), tById = byId(st.tools);
  const it = all.find((x) => x.s.id === ui.stepId);
  if (!it) {
    const iss = flags.filter((f) => f.type !== 'unverified'); const uv = flags.filter((f) => f.type === 'unverified');
    const top = Object.entries(BP.ranks).sort((a, b) => a[1] - b[1]).map(([id, r]) => { const x = all.find((k) => k.s.id === id); return x ? `<li class="clk" data-action="flowStep" data-id="${esc(id)}" data-scroll="1"><span class="bp-n">${esc(BP.label[id] || '#' + r)}</span><div><b>Step ${x.num}:</b> ${esc(trunc(x.s.name, 60))}<div class="faint small">${esc(BP.why[id])} · ${esc(teamInfo(x.dept)[1])}</div></div></li>` : ''; }).join('');
    const tps = [...new Set(seqChains.flatMap((c) => c.chain.flatMap((p) => String(p.talkingPoints || '').split('\n').map((t) => t.trim()).filter(Boolean))))].slice(0, 8);
    return card('Key takeaways', `${exec && top ? `<h5 style="margin-top:0">Top break points</h5><p class="faint small" style="margin:0 0 6px">Scored by issues (high ×4, medium ×2, low ×1), weak hand-offs (×1.5) and time hotspots (×1). Only steps that clearly stand out (at least half the top score) are marked. "=" means tied: set each issue's severity in ✎ Edit step to separate them.${BP.cut ? ` ${BP.cut} more steps tie for the next place: choose a higher Top number to see them.` : ''}${BP.order.length > Object.keys(BP.ranks).length ? ` ${BP.order.length - Object.keys(BP.ranks).length} more step${BP.order.length - Object.keys(BP.ranks).length === 1 ? '' : 's'} with smaller problems are outlined in red.` : ''}</p><ol class="pv-top5">${top}</ol>` : ''}${exec && !top && BP.flat ? `<h5 style="margin-top:0">Top break points</h5><p class="small muted" style="margin:0 0 8px">No single step stands out: ${BP.order.length} steps have problems of a similar size (outlined in red). Set each issue's severity in ✎ Edit step to separate them.</p>` : ''}
      ${tps.length ? `<h5>Talking points</h5><ul class="tps">${tps.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="small muted">No talking points yet for these processes.</p>'}
      ${exec && uv.length ? `<p class="small warn-t">${uv.length} point${uv.length === 1 ? '' : 's'} still to confirm (▲).</p>` : ''}
      <p class="faint small">Click any step to see its detail, where it comes from and goes to, and to edit or flag it.</p>`);
  }
  const chain = seqChains.find((c) => c.items.includes(it)); const i = chain.items.indexOf(it); const prev = chain.items[i - 1], next = chain.items[i + 1];
  let focus = '';
  if (ui.flagFocus && ui.flagFocus.stepId === it.s.id && prev) {
    const wk = flags.filter((f) => f.stepId === it.s.id && f.on === 'link');
    const a2 = teamInfo(prev.dept), b2 = teamInfo(it.dept);
    const switchTool = wk.some((f) => /switches tool/.test(f.text));
    focus = `<div class="wk-focus"><div class="wk-h">${flagIcon('weakness')}<b>Weakness on the hand-off</b></div>
      <div class="wk-path"><span><i class="tdot" style="background:${a2[2]}"></i>Step ${prev.num}: ${esc(trunc(prev.s.name, 48))}<em>${esc(a2[1])} · ${esc((tById[prev.s.toolId] || {}).name || 'No system')}</em></span><span class="wk-arrow">↓ hand-off</span><span><i class="tdot" style="background:${b2[2]}"></i>Step ${it.num}: ${esc(trunc(it.s.name, 48))}<em>${esc(b2[1])} · ${esc((tById[it.s.toolId] || {}).name || 'No system')}</em></span></div>
      ${wk.map((f) => `<p style="margin:6px 0">${esc(f.text)}</p>`).join('')}
      <p class="small muted" style="margin:4px 0"><b>Why it matters:</b> ${switchTool ? 'the same information is likely re-typed from one system into another, which costs time and creates errors.' : 'work moves between departments by email, chat or memory, so it can be missed, delayed or done twice, and nobody can see where it is.'}</p>
      <p class="small muted" style="margin:4px 0"><b>Typical fix:</b> ${switchTool ? 'connect the two systems or work from one shared record, so the hand-off happens automatically.' : 'give the receiving department a system where the hand-off arrives as a task with an owner and a due date (e.g. created automatically when the previous step is completed).'}</p>
      <p class="faint small" style="margin:4px 0">Flagged by the machine from the departments and systems on these two steps. Confirm it in a sense-check.</p></div>`;
  }
  const s = it.s; const t = tById[s.toolId]; const tm = teamInfo(it.dept);
  const who = (x) => { const pp = x.actorId && pById[x.actorId]; return pp ? (ui.anon ? pp.title : pp.name) : (x.actorLabel || '—'); };
  const nb = (x, dir) => {
    if (!x) return `<div class="nbx nbx-end"><span class="faint small">${dir === 'from' ? 'Start' : 'End'}</span><div>${esc(dir === 'from' ? (chain.chain[0].inputs || 'Trigger') : (chain.chain[chain.chain.length - 1].outputs || 'Outcome'))}</div></div>`;
    const a = teamInfo(x.dept); const ho = x.dept !== it.dept; const trig = dir === 'from' ? it.procStart : x.procStart;
    return `<button class="nbx clk" data-action="flowStep" data-id="${esc(x.s.id)}" data-scroll="1"><span class="faint small">${dir === 'from' ? '‹ Comes from' : 'Goes to ›'} step ${x.num}${ho ? ` · <b>hand-off ${dir === 'from' ? esc(a[1]) + ' → ' + esc(tm[1]) : esc(tm[1]) + ' → ' + esc(a[1])}</b>` : ''}${trig ? ` · <b>triggers ${esc(dir === 'from' ? it.p.name : x.p.name)}</b>` : ''}</span><div><i class="tdot" style="background:${a[2]}"></i>${esc(x.s.name)}</div><span class="faint small">${esc(who(x.s))} · ${esc((tById[x.s.toolId] || {}).name || 'No system')}</span></button>`;
  };
  const mine = exec ? flags.filter((f) => f.stepId === s.id || (next && f.on === 'link' && f.stepId === next.s.id)) : [];
  const own = (s.flags || []).map((f, k) => `<li>${flagIcon(FLAG_TYPES[f.type] ? f.type : 'issue')} <span>${esc(f.text)} <span class="faint small">${esc(f.by || '')}${f.date ? ' · ' + esc(f.date) : ''}</span></span> <button class="btn sm ghost" data-action="removeFlowFlag" data-id="${k}" title="Clear (e.g. once verified)">✕ Clear</button></li>`).join('');
  const rv = (s.review && s.review.status) || 'assumed';
  return card(focus ? 'Weakness detail' : 'Step detail', `${focus}<div class="btn-row" style="margin:0 0 8px"><button class="btn sm" data-action="flowClear">← Takeaways</button>${prev ? `<button class="btn sm" data-action="flowStep" data-id="${esc(prev.s.id)}" data-scroll="1">‹ Previous</button>` : ''}${next ? `<button class="btn sm" data-action="flowStep" data-id="${esc(next.s.id)}" data-scroll="1">Next ›</button>` : ''}</div>
    <div class="faint small">${esc(it.p.name)}</div><h4 style="margin-top:2px">Step ${it.num}: ${esc(s.name)}</h4>
    ${nb(prev, 'from')}
    <dl class="sd"><dt>Department</dt><dd><i class="tdot" style="background:${tm[2]}"></i>${esc(tm[1])}</dd><dt>Who</dt><dd>${esc(who(s))}</dd><dt>System</dt><dd>${esc(t ? t.name : 'No system')}</dd><dt>Mode</dt><dd>${s.automated ? 'Automated' : 'Manual'}</dd>
      <dt>Time</dt><dd>${num(s.durationMins) || num(s.elapsedDays) ? esc(stepTimeText(s, true)) : '<span class="warn-t">Not known yet</span>'}</dd>
      <dt>Status</dt><dd><span class="rv-dot rv-${esc(rv)}"></span>${esc(REVIEW_STATUS[rv][0])}${s.review && s.review.by ? ' · ' + esc(s.review.by) : ''}</dd>
      ${exec && s.involves ? `<dt>Involves</dt><dd>${esc(s.involves)}</dd>` : ''}${exec && s.kind === 'decision' ? `<dt>Decision</dt><dd>${s.decisionNo ? 'If no: ' + esc(s.decisionNo) : 'Yes'}</dd>` : ''}</dl>
    ${s._sub ? `<button class="btn sm sub-open" data-action="pvFocus" data-id="${esc(s._sub.id)}">⊞ Open sub-process: ${esc(trunc(s._sub.name, 40))}${s._sub.n ? ` · ${s._sub.n} issue${s._sub.n === 1 ? '' : 's'} inside` : s._sub.mapped ? '' : ' · not mapped yet'}</button>` : ''}
    ${nb(next, 'to')}
    ${exec ? (mine.length ? `<h5>Warnings here (${mine.length})</h5><ol class="flags">${mine.map((f) => `<li>${flagIcon(f.type)}<div><div class="small"><b>${FLAG_TYPES[f.type][0]}</b>${f.on === 'link' ? ' · on the hand-off' : ''}</div><div>${esc(f.text)}</div><div class="faint small">${esc(f.by || '')}</div></div></li>`).join('')}</ol>` : '<p class="small muted">No warnings on this step.</p>') : ''}
    ${own ? `<h5>Flags you can clear</h5><ul class="ownf">${own}</ul>` : ''}
    ${ui.editStep === s.id ? `<div class="step-edit"><h5>Edit this step</h5>${stepFields(s, st, 'data-ed')}<div class="btn-row"><button class="btn sm" data-action="stepMove" data-id="-1">↑ Earlier</button><button class="btn sm" data-action="stepMove" data-id="1">↓ Later</button><button class="btn sm" data-action="stepAdd">+ Step after</button><button class="btn sm danger" data-action="stepDelete">Delete</button><button class="btn sm" data-action="stepEdit">Done</button></div></div>`
      : `<div class="btn-row"><button class="btn sm" data-action="stepEdit">✎ Edit step</button><button class="btn sm" data-action="stepAdd">+ Step after</button>${s._sub ? '' : '<button class="btn sm ghost" data-action="subNew" title="Map this step in more detail as its own process. Worth it when the step is a break point or has a high issue.">⊞ Map as sub-process</button>'}</div>`}
    <div class="btn-row"><button class="btn sm" data-action="addFlowFlag" data-id="issue">+ Flag issue</button><button class="btn sm" data-action="addFlowFlag" data-id="unverified">+ Flag unverified</button><button class="btn sm" data-action="addFlowFlag" data-id="weakness">+ Flag weakness</button></div>`);
}

/** Bottom summaries for the selection. */
function pvSummaries(e, st, P, seqChains, flags) {
  const all = seqChains.flatMap((c) => c.items).filter((it) => it.shown); const steps = all.map((it) => it.s); const tById = byId(st.tools);
  const procs = seqChains.flatMap((c) => c.chain);
  const n = (t) => flags.filter((f) => f.type === t).length;
  const hand = all.filter((it, i) => i && all[i - 1].dept !== it.dept).length;
  const mins = sum(steps, (x) => x.durationMins), days = sum(steps, (x) => x.elapsedDays), timed = steps.filter((x) => num(x.durationMins) || num(x.elapsedDays)).length;
  const conf = steps.filter((x) => x.review && ['confirmed', 'corrected'].includes(x.review.status)).length;
  const glance = `<div class="kpis">${kpi('Steps', steps.length, `<div class="k-delta">${steps.filter((x) => x.automated).length} automated</div>`)}${kpi('Hand-offs', hand, '<div class="k-delta">between departments</div>')}${kpi('Issues', n('issue'), `<div class="k-delta">${n('weakness')} weaknesses · ${n('unverified')} to confirm</div>`)}${kpi('Confirmed', `${conf}/${steps.length}`, '<div class="k-delta">steps sense-checked</div>')}${kpi('Time', timed ? `${mins >= 60 ? +(mins / 60).toFixed(1) + ' h' : mins + ' min'}` : 'Not known', timed ? `<div class="k-delta">hands-on per run${days ? ` · ${+days.toFixed(1)} days elapsed` : ''} · ${timed}/${steps.length} timed</div>` : '<div class="k-delta">add times to steps</div>')}${kpi('Decisions', steps.filter((x) => x.kind === 'decision').length, `<div class="k-delta">${steps.filter((x) => x.involves).length} management touchpoints</div>`)}</div>`;
  const toolMap = {}; all.forEach((it) => { if (it.s.toolId && tById[it.s.toolId]) { const r = toolMap[it.s.toolId] = toolMap[it.s.toolId] || { d: new Set(), n: [] }; r.d.add(it.dept); r.n.push(it.num); } });
  const noSys = all.filter((it) => !it.s.toolId && it.dept !== 'client').length;
  const tools = Object.entries(toolMap).sort((a, b) => b[1].d.size - a[1].d.size).map(([id, r]) => `<tr><td><b>${esc(tById[id].name)}</b></td><td>${[...r.d].map((d) => `<i class="tdot" style="background:${teamInfo(d)[2]}"></i>${esc(teamInfo(d)[1])}`).join(' · ')}</td><td class="small">${r.n.join(', ')}</td><td>${r.d.size > 1 ? '<span class="chip sev-medium">Shared</span>' : ''}</td></tr>`).join('');
  const fIds = [...new Set(procs.flatMap((p) => splitList(p.findingIds)))]; const fs = fIds.map((id) => e.findings.find((f) => f.id === id)).filter(Boolean);
  const toMeasure = []; procs.forEach((p) => { const live2 = (p.steps || []).filter((x) => !x._removed); const unt = live2.filter((x) => !num(x.durationMins) && !num(x.elapsedDays)).length; const unc = live2.filter((x) => !(x.review && ['confirmed', 'corrected'].includes(x.review.status))).length; const bits = [!num(p.runsPerMonth) ? 'how often it runs' : '', unt ? `time for ${unt} of ${live2.length} steps` : '', unc ? `sense-check ${unc} steps` : ''].filter(Boolean); if (bits.length) toMeasure.push(`<li><b>${esc(p.name)}:</b> ${bits.join('; ')}</li>`); });
  const single = procs.length === 1 ? e.processes.find((x) => x.id === procs[0].id) : null;
  const groupsList = [...new Set(e.processes.map((p) => p.group).filter(Boolean))];
  const details = procs.map((p) => { const c = CONFIDENCE[effConfidence(p)]; const trg = splitList(p.leadsTo).map((id) => (e.processes.find((x) => x.id === id) || {}).name).filter(Boolean);
    return `<div class="pd"><div><b>${esc(p.name)}</b> <span class="faint small">${esc(procGroup(p))}</span> ${c ? `<span class="conf conf-${c[2]}">${esc(c[0])}</span>` : ''}</div>
      <div class="small muted">${esc(p.inputs || 'Start')} → ${esc(p.outputs || 'End')}${trg.length ? ` · triggers: ${trg.map(esc).join(', ')}` : ''}${p.sources ? ` · Source: ${esc(p.sources)}` : ''}</div>${reviewSummary(p).length ? `<div class="small">✓ ${reviewSummary(p).map(esc).join(' · ')}</div>` : ''}${p.summary ? `<p class="small" style="margin:4px 0 0">${esc(p.summary)}</p>` : ''}</div>`; }).join('');
  const editor = single ? `<details class="pv-edit"><summary class="btn sm">✎ Edit process details</summary><div class="pv-edit-b">
      <label class="fld"><span>Name</span><input data-pe="name" value="${esc(single.name || '')}"></label>
      <div class="rv-grid"><label class="fld"><span>Group (optional, e.g. Client lifecycle, Product, Finance)</span><input data-pe="group" list="pgroups" value="${esc(single.group || '')}"><datalist id="pgroups">${groupsList.map((g) => `<option value="${esc(g)}">`).join('')}</datalist></label>
      <label class="fld"><span>Starts with (trigger)</span><input data-pe="inputs" value="${esc(single.inputs || '')}"></label></div>
      <label class="fld"><span>Ends with (outcome)</span><input data-pe="outputs" value="${esc(single.outputs || '')}"></label>
      <div class="fld"><span>When it finishes, it triggers…</span><div class="jrow">${e.processes.filter((x) => x.id !== single.id).map((x) => `<label class="jtick ${splitList(single.leadsTo).includes(x.id) ? 'on' : ''}"><input type="checkbox" data-action="pvLink" data-id="${esc(x.id)}" ${splitList(single.leadsTo).includes(x.id) ? 'checked' : ''}>${esc(x.name)}</label>`).join('') || '<span class="faint small">No other processes yet.</span>'}</div></div>
      <label class="fld"><span>Summary</span><textarea data-pe="summary" rows="2">${esc(single.summary || '')}</textarea></label>
      <label class="fld"><span>Talking points (one per line)</span><textarea data-pe="talkingPoints" rows="3">${esc(single.talkingPoints || '')}</textarea></label>
      <div class="btn-row"><button class="btn sm danger" data-action="procDelete">Delete process</button></div></div></details>` : '<p class="faint small">Select a single process to edit its details, links and talking points.</p>';
  const hoursCard = processes_hours_card(procs, st);
  const ho = {}; seqChains.forEach((c) => c.items.forEach((it, i) => { if (!i || !it.shown) return; const pr = c.items[i - 1]; if (pr.dept === it.dept || !pr.shown) return; const k = pr.dept + '>' + it.dept; const r = ho[k] = ho[k] || { a: pr.dept, b: it.dept, n: 0, w: 0, steps: [] }; r.n++; r.steps.push(it.num); if (flags.some((f) => f.stepId === it.s.id && f.on === 'link')) r.w++; }));
  const hoRows = Object.values(ho).sort((x, y) => y.w - x.w || y.n - x.n);
  const hoCard = P.mode === 'proc' && hoRows.length ? card(`Hand-offs between departments (${sum(hoRows, (r) => r.n)})`, `<table class="tbl"><thead><tr><th>From</th><th>To</th><th class="r">Hand-offs</th><th class="r">Weak</th><th>At steps</th></tr></thead><tbody>${hoRows.map((r) => `<tr><td><i class="tdot" style="background:${teamInfo(r.a)[2]}"></i>${esc(teamInfo(r.a)[1])}</td><td><i class="tdot" style="background:${teamInfo(r.b)[2]}"></i>${esc(teamInfo(r.b)[1])}</td><td class="r">${r.n}</td><td class="r">${r.w ? `<span class="chip sev-medium">◆ ${r.w}</span>` : '<span class="faint">0</span>'}</td><td class="small">${r.steps.join(', ')}</td></tr>`).join('')}</tbody></table>`, { sub: 'Where work changes hands, and how many of those hand-offs the machine thinks are weak (no system, or a switch of tool).' }) : '';
  return `<section class="pv-sum">
    ${card('At a glance', glance)}
    ${hoCard}
    <div class="grid-2">
      ${card(`Tools and systems (${Object.keys(toolMap).length})`, tools ? `<table class="tbl"><thead><tr><th>Tool</th><th>Used by</th><th>Steps</th><th></th></tr></thead><tbody>${tools}</tbody></table>` : '<p class="empty">No tools recorded on these steps.</p>', { sub: noSys ? `${noSys} step${noSys === 1 ? '' : 's'} use no system at all.` : '' })}
      ${card('Still to measure', toMeasure.length ? `<ul class="tm">${toMeasure.join('')}</ul>` : '<p class="small muted">Everything here is timed and sense-checked.</p>')}
    </div>
    ${fs.length ? card(`Linked findings (${fs.length})`, `<ul class="lf">${fs.map((f) => `<li><span class="chip sev-${esc(f.severity || 'medium')}">${esc(f.severity || 'medium')}</span> ${esc(f.title)}</li>`).join('')}</ul>`) : ''}
    ${card(`Process details (${procs.length})`, details + editor)}
    ${hoursCard}
  </section>`;
}

/** Printable page of the current selection. */
function pvExportDoc(e, st, P, markup, flags, internal) {
  const css = (document.getElementById('viz-css') || {}).textContent || '';
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const title = P.mode === 'dept' ? `${teamInfo(P.dept)[1]}: processes and flows` : 'Processes and flows';
  const list = flags.filter((f) => internal || f.type !== 'unverified');
  const nums = {}; pvSeq(st, P).forEach((c) => c.items.forEach((it) => { nums[it.s.id] = it.num; }));
  return `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><title>${esc(title + ' · ' + e.client.name)}</title><style>${css}
body{margin:0;background:#fff;font-family:Inter,ui-sans-serif,-apple-system,"Segoe UI",sans-serif;color:#171715;font-size:12.5px}main{margin:16px}.eyebrow{text-transform:uppercase;letter-spacing:.16em;font-size:10.5px;font-weight:750;color:#c8221c}
h1{font-family:Georgia,serif;font-weight:400;font-size:24px;margin:4px 0}.flow-wrap{border:0;padding:0}.flow-svg{max-width:100%!important;width:100%!important;height:auto!important}.muted{color:#665f57}.faint{color:#8a8074}
.chain-h{margin:10px 0 4px}.chain-gap{height:14px}ol.fx{columns:2;font-size:11px;padding-left:18px}@page{size:A3 landscape;margin:8mm}</style></head><body><main>
<div class="eyebrow">${esc(e.client.name)} · The Growth Machine${internal ? ' · TGM internal' : ''}</div><h1>${esc(title)}</h1>
<p class="muted">${esc(P.procIds.map((id) => (P.procs.find((p) => p.id === id) || {}).name).filter(Boolean).join(' · '))} · ${date}</p>
${ui.execView !== false ? flowLegend(!internal) : ''}${markup}
${ui.execView !== false && list.length ? `<h4>Issues and weaknesses${internal ? ' (and points to confirm)' : ''}</h4><ol class="fx">${list.map((f) => `<li><b>${FLAG_TYPES[f.type][0]}</b> · step ${nums[f.stepId] || '?'}: ${esc(f.text)}${internal && f.by ? ` <span class="faint">(${esc(f.by)})</span>` : ''}</li>`).join('')}</ol>` : ''}
<p class="faint" style="font-size:10.5px">The Growth Machine · ${date} · ${internal ? 'Internal working document: not for client distribution.' : `Confidential. Prepared for ${esc(e.client.name)}.`}</p></main></body></html>`;
}

/* ---------- Process view: index (every process, mapped or not) and the focus header ---------- */
const JOURNEYS = ['Client lifecycle', 'Product', 'Finance & admin', 'People'];
function procTeam(p, st) {
  if (p.team) return p.team;
  const pById = byId(st.people), dById = byId(st.departments); const c = {};
  (p.steps || []).forEach((x) => { const t = stepTeam(x, pById, dById); if (t && t !== 'client' && t !== 'system') c[t] = (c[t] || 0) + 1; });
  return Object.keys(c).sort((a, b) => c[b] - c[a])[0] || '';
}
/** Mapped? Checked with the team? */
function procStatus(p) {
  const steps = (p.steps || []).filter((x) => !x._removed);
  if (!steps.length) return { k: 'none', t: 'Not mapped' };
  const ok = steps.filter((x) => x.review && ['confirmed', 'corrected'].includes(x.review.status)).length;
  return ok / steps.length >= 0.5 ? { k: 'ok', t: `Checked ${ok}/${steps.length}` } : { k: 'as', t: ok ? `Assumed · ${ok}/${steps.length} checked` : 'Assumed' };
}
const teamChip = (t) => t ? `<span class="pi-team"><i class="tdot" style="background:${teamInfo(t)[2]}"></i>${esc(teamInfo(t)[1])}</span>` : '<span class="pi-team faint">No owner yet</span>';

function pvIndex(e, st, P, sw) {
  const all = P.allProcs; const mapped = all.filter((p) => (p.steps || []).length);
  // break points across everything mapped, so the index shows where the trouble sits
  const steps = P.procs.flatMap((p) => (p.steps || []).filter((x) => !x._removed));
  const flags = P.procs.flatMap((p) => flowFlags(p, st.people, st.tools, st.departments));
  const BP = breakPoints(steps, flags);
  const info = {}; all.forEach((p) => { const dp = P.procs.find((x) => x.id === p.id) || p; const fl = (dp.steps || []).length ? flowFlags(dp, st.people, st.tools, st.departments) : [];
    info[p.id] = { st: procStatus(p), iss: fl.filter((f) => f.type === 'issue').length, wk: fl.filter((f) => f.type === 'weakness').length, bp: (dp.steps || []).filter((x) => BP.ranks[x.id]).length, n: (p.steps || []).length }; });
  const checked = all.filter((p) => info[p.id].st.k === 'ok').length, withBp = all.filter((p) => info[p.id].bp).length;
  const pct = all.length ? Math.round(mapped.length / all.length * 100) : 0;
  const groups = {}; all.filter((p) => !P.subOf[p.id]).forEach((p) => { (groups[procGroup(p)] = groups[procGroup(p)] || []).push(p); });
  const gOrder = [...JOURNEYS.filter((g) => groups[g]), ...Object.keys(groups).filter((g) => !JOURNEYS.includes(g)).sort()];
  const chainOrder = procChains(P.procs, P.procs.map((p) => p.id)).flat().map((p) => p.id);
  const ord = (p) => { const i = chainOrder.indexOf(p.id); return i < 0 ? 999 : i; };
  const row = (p, depth) => { const I = info[p.id];
    const kids = all.filter((c) => P.subOf[c.id] && P.subOf[c.id].p.id === p.id);
    return `<button class="pi-row pi-${I.st.k} ${depth ? 'pi-sub' : ''}" data-action="pvFocus" data-id="${esc(p.id)}">
      <span class="pi-name">${depth ? '<span class="faint">↳</span> ' : ''}${esc(p.name)}${depth ? ' <span class="faint small">sub-process</span>' : ''}</span>
      ${teamChip(procTeam(p, st))}
      <span class="pi-st st-${I.st.k}">${I.st.k === 'ok' ? '✓ ' : I.st.k === 'as' ? '○ ' : '– '}${esc(I.st.t)}</span>
      <span class="pi-n">${I.n ? `${I.n} steps` : ''}</span>
      <span class="pi-iss">${I.iss ? `<span class="pi-dot"></span>${I.iss} issue${I.iss === 1 ? '' : 's'}` : ''}</span>
      <span class="pi-bp">${I.bp ? `⚑ ${I.bp}` : I.st.k === 'none' ? '<span class="pi-map">Map it →</span>' : ''}</span>
    </button>${kids.map((c) => row(c, depth + 1)).join('')}`; };
  const grp = (g) => { const ps = groups[g].slice().sort((a, b) => ((a.steps || []).length ? 0 : 1) - ((b.steps || []).length ? 0 : 1) || ord(a) - ord(b) || a.name.localeCompare(b.name));
    const inG = all.filter((p) => procGroup(P.subOf[p.id] ? P.subOf[p.id].p : p) === g); const m = inG.filter((p) => (p.steps || []).length).length;
    return `<div class="pi-g"><div class="pi-gh"><b>${esc(g)}</b><span class="faint small">${m} of ${inG.length} mapped</span></div>${ps.map((p) => row(p, 0)).join('')}</div>`; };
  return `<section class="card pv-top pv-index"><div class="pv-toprow">${sw}<span class="pv-what"><b>All processes</b> <span class="faint small">· pick one to look at it closely</span></span></div>
    <div class="pi-cov"><div class="pi-covt"><b>${mapped.length} of ${all.length}</b> mapped · <b>${checked}</b> checked with the team · <b>${withBp}</b> with top break points</div><div class="pi-bar"><i style="width:${pct}%"></i></div></div>
    <div class="pi-head"><span>Process</span><span>Owner</span><span>Status</span><span></span><span>Issues</span><span title="How many of the business's top break points (across all mapped processes) sit in this process">Top break points</span></div>
    ${gOrder.map(grp).join('')}
    <p class="faint small" style="margin:10px 0 0">Not mapped yet: click to see what we need to ask, or start mapping it. ⊞ sub-processes sit under the step they belong to; map one only where a step is a break point or has a serious issue.</p></section>`;
}

function pvFocusHead(e, st, P, sw, all) {
  const p = P.focusP; const parent = P.subOf[p.id];
  const grpName = procGroup(parent ? parent.p : p);
  const from = P.allProcs.filter((x) => splitList(x.leadsTo).includes(p.id));
  const to = splitList(p.leadsTo).map((id) => P.allProcs.find((x) => x.id === id)).filter(Boolean);
  const link = (x) => `<button class="pl-chip" data-action="pvFocus" data-id="${esc(x.id)}">${esc(x.name)}</button>`;
  const status = procStatus(p);
  const counts = {}; all.filter((it) => it.shown).forEach((it) => { counts[it.dept] = (counts[it.dept] || 0) + 1; });
  const who = Object.entries(counts).filter(([t]) => t !== 'system' && t !== 'other').sort((a, b) => b[1] - a[1]);
  const crumb = `<span class="faint">${esc(grpName)}</span> › ${parent ? `<button class="crumb-l" data-action="pvFocus" data-id="${esc(parent.p.id)}">${esc(parent.p.name)}</button> › ` : ''}<b>${esc(p.name)}</b>`;
  return `<section class="card pv-top pv-focus"><div class="pv-toprow">${sw}<button class="btn sm" data-action="pvFocus" data-id="">◂ All processes</button><span class="pv-crumb">${crumb}</span><span class="pi-st st-${status.k}">${esc(status.t)}</span>${teamChip(procTeam(p, st))}</div>
    ${P.focusMapped ? `<div class="pv-links">${parent ? `<span><span class="faint small">Part of</span> ${link(parent.p)} <span class="faint small">at step ${parent.i + 1}</span></span>` : ''}
      <span><span class="faint small">← Comes from</span> ${from.length ? from.map(link).join(' ') : '<span class="faint small">nothing linked</span>'}</span>
      <span><span class="faint small">Leads to →</span> ${to.length ? to.map(link).join(' ') : '<span class="faint small">nothing linked</span>'}</span>
      ${from.length || to.length ? `<label class="tog small"><input type="checkbox" data-action="pvJourney" ${P.journey ? 'checked' : ''}> Show the whole journey</label>` : ''}</div>
    <div class="pv-who"><span class="faint small">Who touches it</span>${who.map(([t, n]) => `<button class="pw-chip ${P.hl === t ? 'on' : ''} ${P.hl && P.hl !== t ? 'off' : ''}" data-action="pvHl" data-id="${esc(t)}" title="Highlight this department's steps"><i class="tdot" style="background:${teamInfo(t)[2]}"></i>${esc(teamInfo(t)[1])} <b>${n}</b></button>`).join('')}${P.hl ? '<button class="btn sm ghost" data-action="pvHl" data-id="">Clear</button>' : '<span class="faint small">Click one to highlight its steps</span>'}</div>` : ''}</section>`;
}

function pvUnmapped(e, P) {
  const p = P.focusP; const q = p.askId && e.customQuestions.find((x) => x.id === p.askId); const who = q && e.people.find((x) => x.id === q.personId);
  const parent = P.subOf[p.id];
  return card('Not mapped yet', `<p style="margin-top:0">${esc(p.summary || 'We know this process exists, but nobody has walked us through it yet.')}</p>
    ${q ? `<div class="pu-q"><span class="faint small">Question to ask${who ? ` · ${esc(who.name)}${who.title ? ', ' + esc(who.title) : ''}` : ''}</span><div>${esc(q.q)}</div>${q.note ? `<div class="faint small">${esc(q.note)}</div>` : ''}</div>` : ''}
    ${parent ? `<p class="small">Sub-process of <b>${esc(parent.p.name)}</b>, step ${parent.i + 1}: ${esc(parent.s.name)}.</p>` : ''}
    <div class="btn-row"><button class="btn" data-action="procMapStart">+ Start mapping: add the first step</button><button class="btn ghost" data-action="pvFocus" data-id="">◂ Back to all processes</button></div>`);
}
