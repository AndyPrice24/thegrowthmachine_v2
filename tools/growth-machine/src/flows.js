/* Flow schematics: end-to-end client journey + a serpentine process flow with warning markers.
   Data (all optional, backward compatible):
   process: stage, confidence ('heard'|'corroborated'|'measured'), sources, summary, talkingPoints, findingIds
   step:    team, actorLabel/actorId, toolId, automated, durationMins, painPoint, flags:[{type,text,by,date}] */

const TEAMS = [
  ['client', 'Client', 'var(--s-other)'], ['marketing', 'Marketing', 'var(--s5)'], ['sales', 'Sales', 'var(--s1)'],
  ['cs', 'Client Success', 'var(--s3)'], ['ops', 'Operations', 'var(--s2)'], ['product', 'Product & Dev', 'var(--s7)'],
  ['leadership', 'Leadership', 'var(--s4)'], ['finance', 'Finance', 'var(--s6)'], ['system', 'System', 'var(--faint)']
];
const STAGES = [['attract', 'Attract'], ['sell', 'Sell'], ['onboard', 'Onboard'], ['deliver', 'Deliver & maintain'], ['grow', 'Grow & renew']];
const CONFIDENCE = { heard: ['Heard', 'Based on what people told us; not yet checked', 'warn'], corroborated: ['Corroborated', 'Confirmed by more than one source', 's1'], measured: ['Measured', 'Checked against data or observed', 'good'] };
const FLAG_TYPES = { issue: ['Issue', 'raised by the team or interviews'], unverified: ['Unverified', 'to confirm'], weakness: ['Weakness', 'flagged by the machine'] };
/** Size of a flow schematic for n steps in c columns (keep in step with flowSchematic). */
const flowDims = (n, c) => { c = Math.max(1, Math.min(c, n)); const rows = Math.ceil(n / c); return [34 * 2 + c * 262 + (c - 1) * 78, 74 + rows * (150 + 96) - 96 + 92]; };
const REVIEW_STATUS = { assumed: ['Assumed', 'Not yet checked with the team'], confirmed: ['Confirmed', 'Checked: this is how it works'], corrected: ['Corrected', 'Checked and corrected'], unsure: ['Unsure', 'Reviewer was not sure'], 'not-done': ['Does not happen', 'Reviewer says this step does not happen'] };
const stepTimeBasis = (s) => s.timeBasis || ((s.review && (s.review.status === 'confirmed' || s.review.status === 'corrected')) && (num(s.durationMins) || num(s.elapsedDays)) ? 'confirmed' : 'assumed');
/** "≈15 min · 2 d wait" — ≈ marks an assumed time. */
function stepTimeText(s, long = false) {
  const m = num(s.durationMins), d = num(s.elapsedDays); if (!m && !d) return long ? 'Time not known' : 'time ?';
  const pre = stepTimeBasis(s) === 'assumed' ? '≈' : '';
  const mt = m ? (m >= 60 ? `${+(m / 60).toFixed(1)} h` : `${m} min`) : '';
  const dt = d ? `${d} d${long ? ' elapsed' : ''}` : '';
  return pre + [mt, dt].filter(Boolean).join(' · ') + (long ? ` (${stepTimeBasis(s)})` : '');
}
/** A step where work waits or takes long enough to matter (shown in executive view). */
const isHotspot = (s) => num(s.elapsedDays) >= 2 || num(s.durationMins) >= 60;
const teamInfo = (id) => TEAMS.find((t) => t[0] === id) || ['', 'Unassigned', 'var(--line)'];

function stepTeam(s, pById, dById) {
  if (s.team) return s.team;
  const p = s.actorId && pById[s.actorId]; const d = p && dById[p.departmentId];
  const map = { revenue: 'sales', tech: 'product' };
  if (d && d.type) return map[d.type] || d.type;
  return s.automated ? 'system' : '';
}

/** Every warning along a process, numbered in path order. Hand-off weaknesses sit on the connector into a step. */
function flowFlags(proc, people, tools, departments, clientSafe = false) {
  const steps = proc.steps || []; const pById = byId(people), tById = byId(tools), dById = byId(departments);
  const list = []; const add = (f) => { f.n = list.length + 1; list.push(f); };
  steps.forEach((s, i) => {
    if (i && !s._removed) {
      let j = i - 1; while (j >= 0 && steps[j]._removed) j--;
      const prev = steps[j];
      if (prev) {
        const a = stepTeam(prev, pById, dById), b = stepTeam(s, pById, dById);
        if (a && b && a !== b && a !== 'client' && b !== 'client') {
          const ta = tById[prev.toolId], tb = tById[s.toolId];
          if (!tb) add({ type: 'weakness', on: 'link', stepId: s.id, text: `Hand-off from ${teamInfo(a)[1]} to ${teamInfo(b)[1]} with no system to receive it: relies on email, chat or memory`, by: 'Machine' });
          else if (ta && tb && ta.id !== tb.id) add({ type: 'weakness', on: 'link', stepId: s.id, text: `Hand-off from ${teamInfo(a)[1]} to ${teamInfo(b)[1]} switches tool (${ta.name} → ${tb.name}): information re-entered?`, by: 'Machine' });
        }
      }
    }
    if (s.painPoint) add({ type: 'issue', on: 'node', stepId: s.id, text: s.painPoint, by: proc.sources || 'Interviews' });
    if (!clientSafe) (s.flags || []).forEach((f, k) => add({ type: FLAG_TYPES[f.type] ? f.type : 'issue', on: 'node', stepId: s.id, text: f.text, by: f.by || 'Team', date: f.date, idx: k }));
  });
  return list;
}

function flagShape(type, n, x, y, r = 11) {
  const t = esc(String(n));
  if (type === 'unverified') return `<g class="fl fl-unverified" transform="translate(${x},${y})"><path d="M0,${-r - 1} L${r + 2},${r - 2} L${-r - 2},${r - 2} Z"/><text y="${r - 5}" text-anchor="middle">${t}</text></g>`;
  if (type === 'weakness') return `<g class="fl fl-weakness" transform="translate(${x},${y})"><path d="M0,${-r - 1} L${r + 1},0 L0,${r + 1} L${-r - 1},0 Z"/><text y="4" text-anchor="middle">${t}</text></g>`;
  return `<g class="fl fl-issue" transform="translate(${x},${y})"><circle r="${r}"/><text y="4" text-anchor="middle">${t}</text></g>`;
}
const flagIcon = (type, n = '') => `<svg class="fl-ico" width="24" height="24" viewBox="-12 -12 24 24" aria-hidden="true">${flagShape(type, n, 0, type === 'unverified' ? 2 : 0, 10)}</svg>`;

/** Serpentine flow: Start → numbered step nodes (team-coloured) → End, with warning markers on nodes and links. */
function flowSchematic(proc, people, tools, departments, { cols = 3, selected = '', anonymise = false, interactive = true, zoom = 0, clientSafe = false, exec = true } = {}) {
  const steps = proc.steps || [];
  if (!steps.length) return '<p class="empty">This process has no steps yet.</p>';
  const pById = byId(people), tById = byId(tools), dById = byId(departments);
  const flags = exec ? flowFlags(proc, people, tools, departments, clientSafe) : [];
  cols = Math.max(1, Math.min(cols, steps.length));
  const NW = 262, NH = 150, GX = 78, GY = 96, PX = 34, TOP = 74;
  const rows = Math.ceil(steps.length / cols);
  const W = PX * 2 + cols * NW + (cols - 1) * GX, H = TOP + rows * (NH + GY) - GY + 92;
  const pos = steps.map((s, i) => { const r = Math.floor(i / cols); let c = i % cols; if (r % 2) c = cols - 1 - c; return { x: PX + c * (NW + GX), y: TOP + r * (NH + GY), r }; });
  const mid = `fa-${esc(proc.id)}`;
  const si = selected ? steps.findIndex((x) => x.id === selected) : -1;
  const near = si < 0 ? null : new Set([si - 1, si, si + 1]);
  let svg = `<svg class="flow-svg" viewBox="0 0 ${W} ${H}" ${zoom ? `width="${Math.round(W * zoom)}" height="${Math.round(H * zoom)}" style="max-width:none"` : `width="100%" style="max-width:${W}px"`} role="img" aria-label="Flow: ${esc(proc.name)}" data-w="${W}" data-h="${H}">`;
  svg += `<defs><marker id="${mid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fa"/></marker></defs>`;
  // start / end pills
  const pill = (x, y, label, text) => `<g class="pill"><rect x="${x}" y="${y}" width="${NW}" height="34" rx="17"/><text x="${x + 16}" y="${y + 22}"><tspan class="pl">${label}</tspan> ${esc(trunc(text, 29))}</text></g>`;
  const p0 = pos[0], pl = pos[pos.length - 1];
  svg += `<path class="link" d="M${p0.x + NW / 2},${p0.y - 40 + 34} V${p0.y - 3}" marker-end="url(#${mid})"/>`;
  svg += pill(p0.x, p0.y - 40 - 6, 'START', proc.inputs || 'Trigger');
  svg += `<path class="link" d="M${pl.x + NW / 2},${pl.y + NH} V${pl.y + NH + 40}" marker-end="url(#${mid})"/>`;
  svg += pill(pl.x, pl.y + NH + 44, 'END', proc.outputs || 'Outcome');
  // links with hand-off and weakness markers
  steps.forEach((s, i) => {
    if (!i) return; const a = pos[i - 1], b = pos[i];
    const ghost = s._removed || steps[i - 1]._removed ? ' ghost' : '';
    let d, mx, my;
    if (a.r === b.r) { const ltr = b.x > a.x; const x1 = ltr ? a.x + NW : a.x, x2 = ltr ? b.x - 3 : b.x + NW + 3, y = a.y + NH / 2; d = `M${x1},${y} H${x2}`; mx = (x1 + x2) / 2; my = y; }
    else { const x = a.x + NW / 2; d = `M${x},${a.y + NH} V${b.y - 3}`; mx = x; my = (a.y + NH + b.y) / 2; }
    const ta = teamInfo(stepTeam(steps[i - 1], pById, dById)), tb = teamInfo(stepTeam(s, pById, dById));
    const handoff = ta[0] && tb[0] && ta[0] !== tb[0];
    const hl = near && (i === si || i - 1 === si) ? ' hl' : near ? ' dim' : '';
    svg += `<path class="link${handoff ? ' handoff' : ''}${ghost}${hl}" d="${d}" marker-end="url(#${mid})"/>`;
    const lf = flags.filter((f) => f.on === 'link' && f.stepId === s.id);
    if (lf.length) svg += lf.map((f, k) => `<g data-tip="${esc(`${f.n}. ${f.text}`)}" ${interactive ? `data-action="flowStep" data-id="${esc(s.id)}"` : ''} class="clk">${flagShape('weakness', f.n, mx + k * 26, my)}</g>`).join('');
    else if (handoff) svg += `<g class="ho" transform="translate(${mx},${my})" data-tip="${esc(`Hand-off: ${ta[1]} → ${tb[1]}`)}"><circle r="9"/><text y="4" text-anchor="middle">⇄</text></g>`;
  });
  // nodes
  steps.forEach((s, i) => {
    const { x, y } = pos[i]; const tm = teamInfo(stepTeam(s, pById, dById));
    const st = s._removed ? 'removed' : s._added ? 'added' : (s._changed && s._changed.length) ? 'changed' : '';
    const p = s.actorId && pById[s.actorId];
    const actor = p ? (anonymise ? (p.title || 'Team member') : p.name) : (s.actorLabel || '');
    const t = tById[s.toolId];
    const lines = wrapText(s.name || 'Step', 31, 3);
    const nf = flags.filter((f) => f.on === 'node' && f.stepId === s.id);
    const rv = (s.review && s.review.status) || 'assumed';
    const hot = exec && isHotspot(s);
    svg += `<g class="fnode ${s.collapsed ? 'collapsed' : ''} ${s.automated ? 'auto' : 'manual'} ${exec && s.kind === 'decision' ? 'decision' : ''} rvs-${rv} ${st} ${selected === s.id ? 'sel' : near && near.has(i) ? 'nbr' : near ? 'dim' : ''} ${interactive ? 'clk' : ''}" transform="translate(${x},${y})" ${interactive ? `data-action="flowStep" data-id="${esc(s.id)}"` : ''} data-tip="${esc([s.name, actor, t ? 'Tool: ' + t.name : 'No system', s.automated ? 'Automated' : 'Manual', stepTimeText(s, true), REVIEW_STATUS[rv][0] + (s.review && s.review.by ? ' by ' + s.review.by : '')].filter(Boolean).join(' · '))}">`;
    svg += `<rect class="nb" width="${NW}" height="${NH}" rx="12"/>`;
    svg += `<rect class="band" width="${NW}" height="28" rx="12" style="fill:${tm[2]}"/><rect class="band" y="16" width="${NW}" height="12" style="fill:${tm[2]}"/>`;
    svg += `<circle class="num" cx="18" cy="14" r="10"/><text class="numt" x="18" y="18" text-anchor="middle" ${String(s.displayNum || '').length > 2 ? 'style="font-size:8px"' : ''}>${esc(s.displayNum || i + 1)}</text>`;
    svg += `<text class="team" x="36" y="18.5">${exec && s.kind === 'decision' ? '◇ DECISION · ' : ''}${esc(s.collapsed ? 'OTHER TEAMS' : tm[1].toUpperCase())}</text>`;
    svg += lines.map((ln, k) => `<text class="nm" x="14" y="${50 + k * 16}">${esc(ln)}</text>`).join('');
    if (actor) svg += `<text class="act" x="14" y="${NH - 48}">${esc(trunc(actor, 40))}</text>`;
    const extra = !exec ? '' : s.kind === 'decision' && s.decisionNo ? `If no: ${s.decisionNo}` : s.involves ? `With: ${s.involves}` : '';
    if (extra) svg += `<text class="inv ${s.kind === 'decision' ? 'inv-d' : ''}" x="14" y="${NH - 33}">${esc(trunc(extra, 40))}</text>`;
    svg += `<line class="sep" x1="14" x2="${NW - 14}" y1="${NH - 24}" y2="${NH - 24}"/>`;
    svg += `<text class="tool" x="14" y="${NH - 9}">${s.automated ? '⚙ ' : ''}${esc(trunc(t ? t.name : 'No system', 22))}${t && t._removed ? ' (removed)' : ''}</text>`;
    if (!s.collapsed) svg += `<text class="mode ${hot ? 'm-hot' : stepTimeBasis(s) === 'assumed' ? 'm-assumed' : 'm-confirmed'}" x="${NW - 14}" y="${NH - 9}" text-anchor="end">${hot ? '⏱ ' : ''}${esc(stepTimeText(s))}</text>`;
    nf.forEach((f, k) => { svg += `<g data-tip="${esc(`${f.n}. ${FLAG_TYPES[f.type][0]}: ${f.text}`)}">${flagShape(f.type, f.n, NW - 14 - k * 27, 0)}</g>`; });
    if (st) svg += `<text class="stt stt-${st}" x="${NW - 14}" y="${NH - 48}" text-anchor="end">${st === 'removed' ? '✕ REMOVED' : st === 'added' ? '+ NEW' : '~ CHANGED'}</text>`;
    svg += '</g>';
  });
  svg += '</svg>';
  return `<div class="flow-wrap">${clientSafe ? svg.replace(/ data-tip="[^"]*"/g, '') : svg}</div>`;
}

const flowLegend = (clientSafe = false) => `<div class="legend flow-legend">
  <span>${flagIcon('issue')} Issue <span class="faint">(team / interviews)</span></span>
  ${clientSafe ? '' : `<span>${flagIcon('unverified')} Unverified <span class="faint">(to confirm)</span></span>`}
  <span>${flagIcon('weakness')} Weakness <span class="faint">(flagged by the machine)</span></span>
  <span><span class="ho-ico">⇄</span> Hand-off between teams</span>
  <span><span class="chip" style="border-style:dashed">⚙ Automated</span></span>
  <span><span class="rv-dot rv-assumed"></span>Assumed</span><span><span class="rv-dot rv-confirmed"></span>Confirmed by the team</span><span><span class="rv-dot rv-unsure"></span>Unsure</span><span><span class="rv-dot rv-not-done"></span>Doesn't happen</span>
  <span class="faint">≈ time is an estimate · ◇ decision point</span></div>`;

/** Client journey strip: stages left to right, the processes mapped in each, with warning counts. */
function journeyStrip(procs, people, tools, departments, current, clientSafe = false) {
  const counts = (p) => { const f = flowFlags(p, people, tools, departments, clientSafe); return ['issue', 'unverified', 'weakness'].map((t) => [t, f.filter((x) => x.type === t).length]); };
  const pBtn = (p) => `<button class="jp ${p.id === current ? 'on' : ''}" data-action="proc" data-id="${esc(p.id)}"><strong>${esc(p.name)}</strong><span class="jc">${counts(p).filter(([, n]) => n).map(([t, n]) => `<span class="jcn jcn-${t}" title="${FLAG_TYPES[t][0]}">${flagIcon(t)}${n}</span>`).join('') || '<span class="faint small">No warnings</span>'}</span>${effConfidence(p) ? `<span class="conf conf-${CONFIDENCE[effConfidence(p)] ? CONFIDENCE[effConfidence(p)][2] : 'warn'}">${esc((CONFIDENCE[effConfidence(p)] || [effConfidence(p)])[0])}</span>` : ''}</button>`;
  const stageCards = STAGES.map(([id, label], i) => {
    const ps = procs.filter((p) => p.stage === id);
    return `<div class="jstage ${ps.length ? '' : 'jempty'}"><div class="jh ${ps.length ? 'clk' : ''}" ${ps.length ? `data-action="proc" data-id="${esc(ps[0].id)}"` : ''}><span class="jn">${i + 1}</span>${esc(label)}</div>${ps.length ? ps.map(pBtn).join('') : '<p class="faint small">Not mapped yet</p>'}</div>`;
  }).join('<div class="jarrow" aria-hidden="true">›</div>');
  const other = procs.filter((p) => !STAGES.some(([id]) => id === p.stage));
  return `<div class="journey">${stageCards}</div>${other.length ? `<div class="jother"><span class="faint small">Other processes:</span> ${other.map(pBtn).join('')}</div>` : ''}`;
}

/** Confidence shown: measured if set; corroborated once the team has sense-checked it; otherwise what was set. */
function effConfidence(p) {
  if (p.confidence === 'measured') return 'measured';
  const done = (p.reviews || []).some((r) => Object.keys(r.verdicts || {}).length);
  return done ? 'corroborated' : (p.confidence || '');
}
function reviewSummary(p) {
  return (p.reviews || []).filter((r) => Object.keys(r.verdicts || {}).length).map((r) => {
    const v = Object.values(r.verdicts); const c = (k) => v.filter((x) => x === k).length;
    return `${r.label || 'Reviewer'} (${r.date}): ${[c('confirmed') && c('confirmed') + ' confirmed', c('corrected') && c('corrected') + ' corrected', c('not-done') && c('not-done') + ' not done', c('unsure') && c('unsure') + ' unsure', (r.added || []).length && (r.added || []).length + ' added'].filter(Boolean).join(', ')}`;
  });
}
function flowTimeTotals(p) {
  const st = live(p.steps); const mins = sum(st, (x) => x.durationMins), days = sum(st, (x) => x.elapsedDays);
  const timed = st.filter((x) => num(x.durationMins) || num(x.elapsedDays)).length; const assumed = st.some((x) => (num(x.durationMins) || num(x.elapsedDays)) && stepTimeBasis(x) === 'assumed');
  return { mins, days, timed, total: st.length, assumed };
}
/** Plain-language brief above the schematic: summary, confidence, talking points, what is still to measure. */
function processBrief(e, p) {
  const conf = CONFIDENCE[effConfidence(p)]; const revs = reviewSummary(p); const tt = flowTimeTotals(p);
  const steps = live(p.steps);
  const toMeasure = [];
  if (!num(p.runsPerMonth)) toMeasure.push('How often it runs (per month)');
  const untimed = steps.filter((s) => !num(s.durationMins) && !num(s.elapsedDays)).length;
  if (untimed) toMeasure.push(`Time per step (${untimed} of ${steps.length} steps have no time yet)`);
  const unconfirmed = steps.filter((s) => !(s.review && ['confirmed', 'corrected'].includes(s.review.status))).length;
  if (unconfirmed) toMeasure.push(`Sense-check with the team (${unconfirmed} of ${steps.length} steps not yet confirmed)`);
  if (!p.ownerId) toMeasure.push('Owner');
  const fIds = splitList(p.findingIds); const fs = fIds.map((id) => e.findings.find((f) => f.id === id)).filter(Boolean);
  const tps = String(p.talkingPoints || '').split('\n').map((x) => x.trim()).filter(Boolean);
  return `<div class="pbrief">
    <div>${conf ? `<span class="conf conf-${conf[2]}" title="${esc(conf[1])}">${esc(conf[0])}</span> <span class="faint small">${esc(conf[1])}${p.sources ? ' · Source: ' + esc(p.sources) : ''}</span>` : '<span class="faint small">Confidence not set</span>'}
      ${revs.length ? `<div class="small" style="margin-top:6px">✓ Sense-checked: ${revs.map(esc).join(' · ')}</div>` : ''}
      ${p.summary ? `<p class="psum">${esc(p.summary)}</p>` : ''}
      ${tt.timed ? `<p class="small" style="margin:8px 0 0"><b>Time:</b> ${tt.assumed ? '≈' : ''}${tt.mins >= 60 ? +(tt.mins / 60).toFixed(1) + ' h' : tt.mins + ' min'} hands-on per run${tt.days ? ` · ${tt.assumed ? '≈' : ''}${+tt.days.toFixed(1)} days end to end` : ''} <span class="faint">(${tt.timed} of ${tt.total} steps timed${tt.assumed ? '; ≈ includes estimates' : ''})</span></p>` : ''}
      ${tps.length ? `<h5>Talking points</h5><ul class="tps">${tps.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</div>
    <div>${toMeasure.length ? `<h5>Still to measure</h5><ul class="tm">${toMeasure.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<h5>Measured</h5><p class="small muted">Volumes and times are in.</p>'}
      ${fs.length ? `<h5>Linked findings</h5><ul class="lf">${fs.map((f) => `<li><span class="chip sev-${esc(f.severity || 'medium')}">${esc(f.severity || 'medium')}</span> ${esc(f.title)}</li>`).join('')}</ul>` : ''}</div>
  </div>`;
}

/** Side panel: all warnings (nothing selected) or the selected step with where it comes from and goes to. */
function flowSidePanel(e, p, people, tools, departments) {
  const flags = flowFlags(p, people, tools, departments);
  const steps = p.steps || []; const idx = Object.fromEntries(steps.map((s, i) => [s.id, i]));
  const pById = byId(people), dById = byId(departments), tById = byId(tools);
  const flagLi = (f) => `<li class="clk ${f.stepId === ui.stepId ? 'on' : ''}" data-action="flowStep" data-id="${esc(f.stepId)}" data-scroll="1">${flagIcon(f.type, f.n)}<div><div class="small"><b>${FLAG_TYPES[f.type][0]}</b> · ${f.on === 'link' ? 'into ' : ''}step ${idx[f.stepId] + 1}: ${esc(trunc((steps[idx[f.stepId]] || {}).name, 60))}</div><div>${esc(f.text)}</div><div class="faint small">${esc(f.by || '')}${f.date ? ' · ' + esc(f.date) : ''}</div></div></li>`;
  const s = steps.find((x) => x.id === ui.stepId);
  if (!s && ui.execView === false) return card('Executive view is off', '<p class="small muted" style="margin:0">Issues, weaknesses, decisions and hotspots are hidden. Click a step to see its detail, or switch Executive view on.</p>');
  if (!s) return card(`Warnings along this flow (${flags.length})`, flags.length ? `<p class="faint small" style="margin-top:0">Click a warning or a step to see it in context.</p><ol class="flags">${flags.map(flagLi).join('')}</ol>` : '<p class="empty">No warnings on this flow.</p>');
  const i = idx[s.id]; const prev = steps[i - 1], next = steps[i + 1];
  const tm = (x) => teamInfo(stepTeam(x, pById, dById));
  const who = (x) => { const pp = x.actorId && pById[x.actorId]; return pp ? (ui.anon ? pp.title : pp.name) : (x.actorLabel || '—'); };
  const t = tById[s.toolId];
  const nb = (x, dir) => {
    if (!x) return `<div class="nbx nbx-end"><span class="faint small">${dir === 'from' ? 'Start' : 'End'}</span><div>${esc(dir === 'from' ? (p.inputs || 'Trigger') : (p.outputs || 'Outcome'))}</div></div>`;
    const a = tm(x), here = tm(s); const ho = a[0] && here[0] && a[0] !== here[0];
    return `<button class="nbx clk" data-action="flowStep" data-id="${esc(x.id)}" data-scroll="1"><span class="faint small">${dir === 'from' ? '‹ Comes from' : 'Goes to ›'} step ${idx[x.id] + 1}${ho ? ` · <b>hand-off ${dir === 'from' ? esc(a[1]) + ' → ' + esc(here[1]) : esc(here[1]) + ' → ' + esc(a[1])}</b>` : ''}</span><div><i class="tdot" style="background:${a[2]}"></i>${esc(x.name)}</div><span class="faint small">${esc(who(x))} · ${esc((tById[x.toolId] || {}).name || 'No system')}</span></button>`;
  };
  const mine = flags.filter((f) => f.stepId === s.id || (next && f.on === 'link' && f.stepId === next.id));
  const own = (s.flags || []).map((f, k) => `<li>${flagIcon(FLAG_TYPES[f.type] ? f.type : 'issue')} <span>${esc(f.text)} <span class="faint small">${esc(f.by || '')}${f.date ? ' · ' + esc(f.date) : ''}</span></span> <button class="btn sm ghost" data-action="removeFlowFlag" data-id="${k}" title="Clear (e.g. once verified)">✕ Clear</button></li>`).join('');
  const body = `<div class="btn-row" style="margin:0 0 8px"><button class="btn sm" data-action="flowClear">← All warnings</button>${prev ? `<button class="btn sm" data-action="flowStep" data-id="${esc(prev.id)}" data-scroll="1">‹ Previous</button>` : ''}${next ? `<button class="btn sm" data-action="flowStep" data-id="${esc(next.id)}" data-scroll="1">Next ›</button>` : ''}</div>
    <h4 style="margin-top:0">Step ${i + 1} of ${steps.length}: ${esc(s.name)}</h4>
    ${nb(prev, 'from')}
    <dl class="sd"><dt>Team</dt><dd><i class="tdot" style="background:${tm(s)[2]}"></i>${esc(tm(s)[1])}</dd><dt>Who</dt><dd>${esc(who(s))}</dd>
      <dt>System</dt><dd>${esc(t ? t.name : 'No system')}</dd><dt>Mode</dt><dd>${s.automated ? 'Automated' : 'Manual'}</dd><dt>Time</dt><dd>${num(s.durationMins) || num(s.elapsedDays) ? esc(stepTimeText(s, true)) : '<span class="warn-t">Not known yet</span>'}</dd>
      <dt>Status</dt><dd><span class="rv-dot rv-${esc((s.review && s.review.status) || 'assumed')}"></span>${esc(REVIEW_STATUS[(s.review && s.review.status) || 'assumed'][0])}${s.review && s.review.by ? ' · ' + esc(s.review.by) + ' · ' + esc(s.review.date || '') : ''}</dd>
      ${s.involves ? `<dt>Involves</dt><dd>${esc(s.involves)}</dd>` : ''}${s.kind === 'decision' ? `<dt>Decision</dt><dd>${esc(s.name)}${s.decisionNo ? `<br><span class="small">If no: ${esc(s.decisionNo)}</span>` : ''}</dd>` : ''}
      ${s.input || s.output ? `<dt>In → out</dt><dd>${esc(s.input || '—')} → ${esc(s.output || '—')}</dd>` : ''}</dl>
    ${nb(next, 'to')}
    ${ui.execView === false ? '' : mine.length ? `<h5>Warnings here (${mine.length})</h5><ol class="flags">${mine.map(flagLi).join('')}</ol>` : '<p class="small muted">No warnings on this step.</p>'}
    ${own ? `<h5>Flags you can clear</h5><ul class="ownf">${own}</ul>` : ''}
    ${ui.editStep === s.id ? `<div class="step-edit"><h5>Edit this step (your assumptions)</h5>${stepFields(s, { people, tools, departments }, 'data-ed')}
      <div class="btn-row"><button class="btn sm" data-action="stepMove" data-id="-1">↑ Earlier</button><button class="btn sm" data-action="stepMove" data-id="1">↓ Later</button><button class="btn sm" data-action="stepAdd">+ Step after</button><button class="btn sm danger" data-action="stepDelete">Delete step</button><button class="btn sm" data-action="stepEdit">Done</button></div></div>`
      : `<div class="btn-row"><button class="btn sm" data-action="stepEdit">✎ Edit step</button><button class="btn sm" data-action="stepAdd">+ Step after</button></div>`}
    <div class="btn-row"><button class="btn sm" data-action="addFlowFlag" data-id="issue">+ Flag issue</button><button class="btn sm" data-action="addFlowFlag" data-id="unverified">+ Flag unverified</button><button class="btn sm" data-action="addFlowFlag" data-id="weakness">+ Flag weakness</button></div>`;
  return card('Step detail', body);
}

/** Zoom / layout toolbar for the flow. */
function flowToolbar(cols) {
  const z = ui.flowZoom;
  return `<div class="flow-tools"><span class="faint small">View</span>
    <button class="btn sm ${ui.flowWhole && z ? 'on' : ''}" data-action="flowZoom" data-id="fit" title="Whole flow on one screen">⤢ Whole flow</button>
    <button class="btn sm" data-action="flowZoom" data-id="out" title="Zoom out">−</button><span class="small zl">${z ? Math.round(z * 100) + '%' : 'Fit width'}</span><button class="btn sm" data-action="flowZoom" data-id="in" title="Zoom in">+</button>
    <button class="btn sm ${z === 1 ? 'on' : ''}" data-action="flowZoom" data-id="100" title="Full size">100%</button>
    <span class="faint small" style="margin-left:8px">Steps per row</span>${[1, 2, 3, 4, 5].map((n) => `<button class="btn sm ${cols === n ? 'on' : ''}" data-action="flowCols" data-id="${n}">${n}</button>`).join('')}
    <span class="faint small" style="margin-left:8px">Tip: Ctrl + scroll (or pinch) to zoom; drag to move around when zoomed in.</span>
    ${ui.stepId ? '<button class="btn sm ghost" data-action="flowClear" style="margin-left:auto">Clear highlight</button>' : ''}</div>`;
}

/* ---------- Export: PNG, SVG, PDF/HTML page (internal or client-safe) ---------- */
const LIGHT_TOKENS = { '--bg': '#f6f1e9', '--surface': '#fffdf9', '--surface-2': '#eee7dd', '--ink': '#171715', '--muted': '#665f57', '--faint': '#8a8074', '--line': '#d7cfc3', '--grid': '#e6dfd4', '--red': '#c8221c',
  '--s1': '#2a78d6', '--s2': '#eb6834', '--s3': '#1baf7a', '--s4': '#eda100', '--s5': '#e87ba4', '--s6': '#008300', '--s7': '#6250d6', '--s8': '#e34948', '--s-other': '#9a948b',
  '--good': '#0ca30c', '--warn': '#fab219', '--serious': '#ec835a', '--crit': '#d03b3b', '--good-ink': '#0a7a0a', '--warn-ink': '#8a5a00', '--crit-ink': '#b02a2a' };

/** Standalone SVG with styles inlined (light theme), ready for PNG/SVG download. */
function flowStandaloneSVG(proc, st, clientSafe) {
  return svgStandalone(flowSchematic(proc, st.people, st.tools, st.departments, { cols: ui.flowCols || ui.flowColsAuto || 3, interactive: false, clientSafe, anonymise: ui.anon, exec: ui.execView !== false }));
}
function svgStandalone(markup) {
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-100000px;top:0;width:2400px';
  Object.entries(LIGHT_TOKENS).forEach(([k, v]) => holder.style.setProperty(k, v));
  holder.innerHTML = markup.replace(/ data-tip="[^"]*"/g, '');
  document.body.appendChild(holder);
  const svg = holder.querySelector('svg');
  const W = +svg.dataset.w, H = +svg.dataset.h;
  svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); svg.removeAttribute('style');
  const props = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'font-size', 'font-weight', 'letter-spacing'];
  const els = [...svg.querySelectorAll('*')];
  const styles = els.map((el) => { const cs = getComputedStyle(el); const out = props.map((pr) => `${pr}:${cs.getPropertyValue(pr)}`); if (el.tagName === 'text' || el.tagName === 'tspan') out.push('font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif'); return out.join(';'); });
  els.forEach((el, i) => { el.setAttribute('style', styles[i]); el.removeAttribute('class'); });
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', W); bg.setAttribute('height', H); bg.setAttribute('fill', '#fffdf9'); svg.insertBefore(bg, svg.firstChild);
  const xml = new XMLSerializer().serializeToString(svg); holder.remove();
  return { xml, W, H };
}

/** A printable page for one or more flows. Internal adds sources, unverified points and what is still to measure. */
function flowExportDoc(e, procs, st, { internal = false, journey = false } = {}) {
  const css = (document.getElementById('viz-css') || {}).textContent || '';
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const part = (p) => {
    const flags = flowFlags(p, st.people, st.tools, st.departments, !internal);
    const steps = p.steps || []; const idx = Object.fromEntries(steps.map((x, i) => [x.id, i]));
    const tps = String(p.talkingPoints || '').split('\n').map((x) => x.trim()).filter(Boolean);
    const conf = CONFIDENCE[effConfidence(p)];
    const untimed = live(steps).filter((x) => !num(x.durationMins) && !num(x.elapsedDays)).length;
    return `<section class="fx-sec"><div class="eyebrow">${esc((STAGES.find((x) => x[0] === p.stage) || ['', 'Process'])[1])}</div><h2>${esc(p.name)}</h2>
      <p class="muted">${esc(p.inputs || 'Start')} → ${esc(p.outputs || 'End')}${internal && conf ? ` · <span class="conf conf-${conf[2]}">${esc(conf[0])}</span> ${p.sources ? 'Source: ' + esc(p.sources) : ''}` : ''}</p>
      <div class="fx-body"><div class="fx-fig">${flowLegend(!internal)}${flowSchematic(p, st.people, st.tools, st.departments, { cols: 3, interactive: false, clientSafe: !internal, anonymise: ui.anon })}</div><div class="fx-text">
      ${p.summary ? `<p>${esc(p.summary)}</p>` : ''}
      ${tps.length ? `<h4>${internal ? 'Talking points' : 'Key points'}</h4><ul>${tps.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      ${flags.length ? `<h4>Points along the flow</h4><ol class="fx-flags">${flags.map((f) => `<li>${flagIcon(f.type, f.n)}<span><b>${FLAG_TYPES[f.type][0]}</b> · ${f.on === 'link' ? 'into ' : ''}step ${idx[f.stepId] + 1}: ${esc(f.text)}${internal && f.by ? ` <span class="faint">(${esc(f.by)})</span>` : ''}</span></li>`).join('')}</ol>` : ''}
      ${internal && (untimed || !num(p.runsPerMonth)) ? `<p class="faint small">Still to measure: ${[!num(p.runsPerMonth) ? 'how often it runs' : '', untimed ? `time per step (${untimed} of ${live(steps).length})` : ''].filter(Boolean).join('; ')}.</p>` : ''}
      </div></div>
    </section>`;
  };
  return `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc((procs.length === 1 ? procs[0].name : 'Process flows') + ' · ' + e.client.name)}</title><style>${css}
body{margin:0;background:#fff;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#171715;font-size:13px;line-height:1.45}
main{max-width:1180px;margin:24px auto;padding:0 20px}.eyebrow{text-transform:uppercase;letter-spacing:.16em;font-size:10.5px;font-weight:750;color:#c8221c}
h1{font-family:Georgia,serif;font-weight:400;font-size:28px;margin:4px 0}h2{font-family:Georgia,serif;font-weight:400;font-size:22px;margin:2px 0 4px}h4{font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#665f57;margin:14px 0 6px}
.muted{color:#665f57}.faint{color:#8a8074}.small{font-size:11.5px}ul{margin:0;padding-left:18px}.flow-wrap{border:0;padding:0;margin-top:6px}.flow-svg{max-width:100%!important}
.fx-sec{margin:22px 0 34px}.fx-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.7fr);gap:18px;align-items:start}.fx-body .fx-fig{order:2}.fx-body .fx-text{order:1}.fx-flags{list-style:none;padding:0;margin:0;display:grid;gap:5px}.fx-flags .fl-ico{width:20px;height:20px}@media (max-width:800px){.fx-body{grid-template-columns:1fr}}.fx-flags li{display:flex;gap:6px;align-items:flex-start}
.jp{cursor:default}.foot{border-top:1px solid #d7cfc3;margin-top:24px;padding-top:8px;color:#8a8074;font-size:11px}
.fx-fig{break-inside:avoid;page-break-inside:avoid}
@page{size:A4 landscape;margin:10mm}@media print{main{margin:0;max-width:none;padding:0}.fx-sec+.fx-sec{break-before:page}.fx-cover+.fx-sec{break-before:page}.journey{flex-wrap:nowrap}.jstage{min-width:0}.flow-svg{max-height:146mm;width:auto!important;max-width:100%!important}.fx-body{display:block}.fx-body .fx-fig{float:right;width:63%;margin:0 0 8px 16px}.fx-body::after{content:'';display:block;clear:both}.fx-text{font-size:10.5px}.fx-text h4{margin:8px 0 4px}.fx-sec h2{font-size:19px}.fx-fig .legend{font-size:10px}}
</style></head><body><main>
<div class="eyebrow">${esc(e.client.name)} · ${internal ? 'TGM internal' : 'Process flows'}</div><h1>${procs.length === 1 ? esc(procs[0].name) : 'How the work flows'}</h1><p class="muted">${date}${internal ? ' · Internal working view: includes unverified points and sources' : ''}</p>
${journey ? `<div class="fx-cover"><h4>Client journey</h4>${journeyStrip(st.processes, st.people, st.tools, st.departments, '', !internal)}<p class="faint small">Each stage's flow follows on its own page. Markers: ● issue, ◆ weakness${internal ? ', ▲ unverified' : ''}; ⇄ hand-off between teams.</p></div>` : ''}
${procs.map(part).join('')}
<div class="foot">The Growth Machine · ${date} · ${internal ? 'Internal working document: not for client distribution.' : `Confidential. Prepared for ${esc(e.client.name)}.`}</div>
</main></body></html>`;
}

/** Export toolbar row shown under the flow. */
function flowExportBar() {
  const a = ui.flowAudience === 'internal';
  return `<div class="flow-tools flow-export"><span class="faint small">Export</span>
    <select data-ui="flowAudience" title="Who is it for?"><option value="client" ${a ? '' : 'selected'}>Client-safe (issues and weaknesses only)</option><option value="internal" ${a ? 'selected' : ''}>TGM internal (adds unverified points and sources)</option></select>
    <button class="btn sm" data-action="exportFlow" data-id="png">Image (PNG)</button><button class="btn sm" data-action="exportFlow" data-id="svg">Vector (SVG)</button>
    <button class="btn sm" data-action="exportFlow" data-id="pdf">PDF page</button><button class="btn sm" data-action="exportFlow" data-id="html">HTML page</button>
    <button class="btn sm ghost" data-action="exportFlow" data-id="all">All flows + journey (PDF)</button>
    <button class="btn sm ghost" data-action="exportFlow" data-id="sheet" title="Assumed flow + a table per step to confirm or correct">Sense-check sheet (PDF)</button></div>`;
}


/** Editable fields for one step (used by the step editor and the live sense-check). */
function stepFields(s, st, attr) {
  const toolOpts = st.tools.filter((t) => !t._removed).map((t) => [t.id, t.name]);
  return `<label class="fld"><span>Step</span><input ${attr}="name" value="${esc(s.name || '')}"></label>
    <div class="rv-grid">
      <label class="fld"><span>Team</span>${sel(TEAMS.map((t) => [t[0], t[1]]), s.team || stepTeam(s, byId(st.people), byId(st.departments)), `${attr}="team"`)}</label>
      <label class="fld"><span>Who does it</span><input ${attr}="actorLabel" value="${esc(s.actorLabel || '')}"></label>
      <label class="fld"><span>System used</span>${sel(toolOpts, s.toolId || '', `${attr}="toolId"`)}</label>
      <label class="fld"><span>Automated?</span>${sel([['no', 'Manual'], ['yes', 'Automated']], s.automated ? 'yes' : 'no', `${attr}="automated"`, false)}</label>
      <label class="fld"><span>Hands-on time (minutes)</span><input type="number" min="0" ${attr}="durationMins" value="${esc(s.durationMins || '')}"></label>
      <label class="fld"><span>Waiting / elapsed (days)</span><input type="number" min="0" step="0.5" ${attr}="elapsedDays" value="${esc(s.elapsedDays || '')}"></label>
    </div>
    <label class="fld"><span>Who else gets involved (management approval, escalation, other team)?</span><input ${attr}="involves" value="${esc(s.involves || '')}" placeholder="e.g. CRO approves Tier 1"></label>
    <div class="rv-grid"><label class="fld"><span>Decision point?</span>${sel([['', 'No'], ['decision', 'Yes, a decision']], s.kind || '', `${attr}="kind"`, false)}</label>
      ${s.kind === 'decision' ? `<label class="fld"><span>If no, what happens?</span><input ${attr}="decisionNo" value="${esc(s.decisionNo || '')}" placeholder="e.g. back to Sales to re-scope"></label>` : '<span></span>'}</div>`;
}

/* ---------- Sense-check: walk an assumed flow live with a decision maker and record what they confirm or correct ---------- */
function reviewChooser(e, p) {
  const opts = e.people.filter((x) => !x._removed).map((x) => [x.id, `${x.name}${x.title ? ' · ' + x.title : ''}`]);
  return card(`Sense-check "${p.name}"`, `<p class="small muted" style="margin-top:0">Walk the flow with someone who knows it. For each step they confirm, correct, flag as unsure, or say it doesn't happen; you can fix the step, add the time it takes, decisions and who else gets involved, and add missing steps. Everything saves as you go.</p>
    <div class="rv-setup"><label class="fld"><span>Who are you checking it with?</span>${sel(opts, '', 'id="rvPerson"')}</label><label class="fld"><span>…or role, if not on the org chart</span><input id="rvLabel" placeholder="e.g. Operations team lead"></label></div>
    <div class="btn-row"><button class="btn" data-action="reviewStart">▶ Start sense-check</button><button class="btn ghost" data-action="reviewCancel">Cancel</button></div>`);
}

function reviewCard(e, p, st) {
  const R = ui.review; const steps = p.steps || []; const s = steps[R.idx]; if (!s) return '';
  const rev = (p.reviews || []).find((r) => r.id === R.revId) || { verdicts: {}, notes: {} };
  const v = rev.verdicts[s.id] || '';
  const flags = flowFlags(p, st.people, st.tools, st.departments);
  const concerns = flags.filter((f) => f.stepId === s.id && f.type !== 'unverified');
  const asks = (s.flags || []).map((f, k) => [f, k]).filter(([f]) => f.type === 'unverified');
  const vb = (k, label) => `<button class="btn sm rvb rvb-${k} ${v === k ? 'on' : ''}" data-action="reviewVerdict" data-id="${k}">${label}</button>`;
  return card(`Step ${R.idx + 1} of ${steps.length}`, `
    <p class="small muted" style="margin:0 0 6px">Is this how it works?</p>
    <div class="btn-row rv-verdicts">${vb('confirmed', '✓ Yes')}${vb('corrected', '✎ Mostly (correct it)')}${vb('unsure', '? Not sure')}${vb('not-done', '✕ Doesn\'t happen')}</div>
    ${stepFields(s, st, 'data-rv')}
    ${concerns.length ? `<h5>Concerns on this step</h5><ol class="flags">${concerns.map((f) => `<li>${flagIcon(f.type, f.n)}<div>${esc(f.text)}</div></li>`).join('')}</ol>` : ''}
    <div class="btn-row"><button class="btn sm" data-action="reviewConcern">+ Concern they raise</button><button class="btn sm" data-action="reviewAddStep">+ Missing step after this</button></div>
    <label class="fld" style="margin-top:8px"><span>Notes from this conversation</span><textarea data-rvnote rows="3">${esc(rev.notes[s.id] || '')}</textarea></label>
    ${asks.length ? `<details class="rv-mine" ${R.mine ? 'open' : ''}><summary data-action="reviewMine">My questions to confirm (${asks.length}) <span class="faint small">hide when screen-sharing</span></summary><ul class="ownf">${asks.map(([f, k]) => `<li>${flagIcon('unverified')}<span>${esc(f.text)}</span><button class="btn sm" data-action="reviewAnswer" data-id="${k}">Answered</button></li>`).join('')}</ul></details>` : ''}
    <div class="btn-row rv-nav">${R.idx ? '<button class="btn sm" data-action="reviewNav" data-id="-1">‹ Back</button>' : ''}${R.idx < steps.length - 1 ? '<button class="btn" data-action="reviewNav" data-id="1">Next step ›</button>' : '<button class="btn" data-action="reviewFinish">Finish sense-check</button>'}</div>`);
}

function reviewView(e, p, st, cols) {
  const R = ui.review; const steps = p.steps || [];
  const rev = (p.reviews || []).find((r) => r.id === R.revId) || { verdicts: {} };
  const vals = Object.values(rev.verdicts); const c = (k) => vals.filter((x) => x === k).length;
  const sel2 = (steps[R.idx] || {}).id || '';
  return `<div class="page-h"><div><span class="eyebrow">Sense-check · live</span><h1>${esc(p.name)}</h1><p class="muted">With ${esc(rev.label || 'reviewer')} · ${vals.length} of ${steps.length} steps checked · ${c('confirmed')} confirmed · ${c('corrected')} corrected · ${c('unsure')} unsure · ${c('not-done')} don't happen</p></div>
    <div class="btn-row"><button class="btn" data-action="reviewFinish">Finish</button></div></div>
    ${flowLegend(true)}
    <div class="flow-split"><div>${flowSchematic(p, st.people, st.tools, st.departments, { cols, selected: sel2, anonymise: ui.anon, clientSafe: true })}</div><aside class="flow-side">${reviewCard(e, p, st)}</aside></div>`;
}

/** Printable sense-check sheet: our assumed flow + a table per step to confirm or correct. Concerns shown, internal notes left out. */
function senseCheckSheet(e, procs, st) {
  const css = (document.getElementById('viz-css') || {}).textContent || '';
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const pById = byId(st.people), dById = byId(st.departments), tById = byId(st.tools);
  const part = (p) => {
    const steps = live(p.steps); const flags = flowFlags(p, st.people, st.tools, st.departments, true);
    return `<section class="fx-sec"><div class="eyebrow">${esc((STAGES.find((x) => x[0] === p.stage) || ['', 'Process'])[1])} · for checking</div><h2>${esc(p.name)}</h2>
      <p class="muted">${esc(p.inputs || 'Start')} → ${esc(p.outputs || 'End')}</p>
      <div class="fx-fig">${flowLegend(true)}${flowSchematic(p, st.people, st.tools, st.departments, { cols: 3, interactive: false, clientSafe: true, anonymise: ui.anon })}</div>
      <table class="sc"><thead><tr><th>#</th><th>Step</th><th>Who</th><th>System</th><th>Time</th><th>Concerns</th><th>Is this right?</th><th>Corrections / notes</th></tr></thead><tbody>
      ${steps.map((s) => { const i = (p.steps || []).indexOf(s) + 1; const tm = teamInfo(stepTeam(s, pById, dById)); const fs = flags.filter((f) => f.stepId === s.id);
        return `<tr><td>${i}</td><td><b>${esc(s.name)}</b>${s.kind === 'decision' ? `<div class="small">◇ Decision${s.decisionNo ? ' · if no: ' + esc(s.decisionNo) : ''}</div>` : ''}${s.involves ? `<div class="small">With: ${esc(s.involves)}</div>` : ''}</td><td>${esc(tm[1])}${s.actorLabel ? '<div class="small">' + esc(s.actorLabel) + '</div>' : ''}</td><td>${esc((tById[s.toolId] || {}).name || 'No system')}</td><td>${num(s.durationMins) || num(s.elapsedDays) ? esc(stepTimeText(s)) : '<span class="faint">?</span>'}</td><td class="small">${fs.map((f) => `${f.n}. ${esc(f.text)}`).join('<br>')}</td><td class="ck">☐ Yes<br>☐ Partly<br>☐ No</td><td class="nt"></td></tr>`; }).join('')}
      </tbody></table>
      <p class="small">Anything missing between steps? Who else gets involved? Where does work wait?</p><div class="lines"></div>
    </section>`;
  };
  return `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc('Sense-check · ' + (procs.length === 1 ? procs[0].name : 'process flows') + ' · ' + e.client.name)}</title><style>${css}
body{margin:0;background:#fff;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#171715;font-size:12.5px;line-height:1.4}
main{max-width:1180px;margin:24px auto;padding:0 20px}.eyebrow{text-transform:uppercase;letter-spacing:.16em;font-size:10.5px;font-weight:750;color:#c8221c}
h1{font-family:Georgia,serif;font-weight:400;font-size:26px;margin:4px 0}h2{font-family:Georgia,serif;font-weight:400;font-size:21px;margin:2px 0 4px}
.muted{color:#665f57}.faint{color:#8a8074}.small{font-size:11px}.flow-wrap{border:0;padding:0}.flow-svg{max-width:100%!important}
table.sc{width:100%;border-collapse:collapse;margin-top:10px}table.sc th{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#665f57;text-align:left;border-bottom:1.5px solid #171715;padding:5px}
table.sc td{border-bottom:1px solid #d7cfc3;padding:6px 5px;vertical-align:top}td.ck{white-space:nowrap;font-size:11px;line-height:1.7}td.nt{min-width:200px}
.lines{height:70px;background:repeating-linear-gradient(#fff 0 22px,#d7cfc3 22px 23px)}.intro{border-left:3px solid #c8221c;padding:6px 12px;background:#faf6f0}
@page{size:A4 landscape;margin:10mm}@media print{main{margin:0;max-width:none;padding:0}.fx-sec+.fx-sec{break-before:page}.fx-fig{break-after:page}.flow-svg{max-height:160mm;width:auto!important;max-width:100%!important}tr{break-inside:avoid}}
</style></head><body><main>
<div class="eyebrow">${esc(e.client.name)} · The Growth Machine</div><h1>How we understand the work flows today</h1>
<p class="intro">This is our current understanding, built from conversations so far. <b>Please correct anything that is wrong.</b> For each step, tick whether it is right, and note who does it, how long it takes, and anything we have missed. Times marked ≈ are our estimates. ${date}.</p>
${procs.map(part).join('')}
<p class="faint small" style="margin-top:20px">The Growth Machine · ${date} · Confidential. Prepared for ${esc(e.client.name)}.</p></main></body></html>`;
}


/* ---------- Across the journey: by team or by process, as lanes or one flow ---------- */
function journeyProcs(st) { return STAGES.flatMap(([id]) => st.processes.filter((p) => p.stage === id && !p._removed)); }
function journeyTeams(st) {
  const pById = byId(st.people), dById = byId(st.departments); const used = new Set();
  journeyProcs(st).forEach((p) => (p.steps || []).forEach((s) => { const t = stepTeam(s, pById, dById); if (t) used.add(t); }));
  return TEAMS.filter((t) => used.has(t[0])).map((t) => t[0]);
}
/** The ordered steps to show, with their process, team and client-safe flags. */
function journeySeq(st, J) {
  const pById = byId(st.people), dById = byId(st.departments);
  const procs = journeyProcs(st).filter((p) => J.by !== 'process' || J.procs.includes(p.id));
  const seq = [];
  procs.forEach((p) => { const fl = flowFlags(p, st.people, st.tools, st.departments, true); (p.steps || []).filter((x) => !x._removed).forEach((s) => seq.push({ s, p, team: stepTeam(s, pById, dById) || 'other', flags: fl.filter((f) => f.stepId === s.id) })); });
  return { seq, procs };
}
function journeyState(st) {
  const allTeams = journeyTeams(st), allProcs = journeyProcs(st).map((p) => p.id);
  const J = ui.journey || {};
  const teams = (J.teams || ['sales', 'cs', 'ops']).filter((t) => allTeams.includes(t));
  const procs = (J.procs || allProcs).filter((id) => allProcs.includes(id));
  return { by: J.by || 'team', layout: J.layout || 'lanes', teams: teams.length ? teams : allTeams.slice(0, 3), procs: procs.length ? procs : allProcs, allTeams, allProcs };
}

function journeyLanes(st, J, { exec = true, interactive = true, zoom = 0 } = {}) {
  const { seq, procs } = journeySeq(st, J); if (!seq.length) return '<p class="empty">Nothing to show for this selection.</p>';
  const tById = byId(st.tools);
  const lanes = J.by === 'team' ? J.teams.slice() : TEAMS.map((t) => t[0]).filter((t) => seq.some((x) => x.team === t));
  if (J.by === 'process' && seq.some((x) => x.team === 'other')) lanes.push('other');
  const others = J.by === 'team' && seq.some((x) => !lanes.includes(x.team));
  const LW = 200, CW = 172, NW = 150, NH = 104, LH = 148, TOP = 88, OTH = 64;
  const W = LW + seq.length * CW + 24;
  const laneTop = (t) => TOP + lanes.indexOf(t) * LH;
  const toolsUsed = {}; seq.forEach(({ s, team }) => { if (s.toolId && lanes.includes(team)) (toolsUsed[s.toolId] = toolsUsed[s.toolId] || new Set()).add(team); });
  const toolRows = Object.entries(toolsUsed).filter(([id]) => tById[id]).sort((a, b) => b[1].size - a[1].size);
  const lanesBottom = TOP + lanes.length * LH + (others ? OTH : 0);
  const TT = lanesBottom + 46; const H = TT + 24 + toolRows.length * 36 + 18;
  const T = (x, y, t, cls, anchor) => `<text class="${cls}" x="${x}" y="${y}" ${anchor ? `text-anchor="${anchor}"` : ''}>${esc(t)}</text>`;
  let g = `<svg class="flow-svg jl" viewBox="0 0 ${W} ${H}" ${zoom ? `width="${Math.round(W * zoom)}" height="${Math.round(H * zoom)}" style="max-width:none"` : `width="100%" style="max-width:${W}px"`} data-w="${W}" data-h="${H}" role="img" aria-label="Journey by team">`;
  g += `<defs><marker id="jla" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fa"/></marker><marker id="jlb" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="fb"/></marker></defs>`;
  let c0 = 0; procs.forEach((p) => { const n = (p.steps || []).filter((x) => !x._removed).length; if (!n) return; const x1 = LW + c0 * CW + 4, x2 = LW + (c0 + n) * CW - 22;
    g += `<g ${interactive ? `class="clk" data-action="proc" data-id="${esc(p.id)}"` : ''}><rect class="jl-stage" x="${x1}" y="18" width="${Math.max(40, x2 - x1)}" height="44" rx="8"/>${T(x1 + 12, 35, (STAGES.find((x) => x[0] === p.stage) || ['', ''])[1].toUpperCase(), 'jl-st')}${T(x1 + 12, 52, trunc(p.name, Math.max(8, Math.floor((x2 - x1) / 7.4))), 'jl-pn')}</g>`; c0 += n; });
  lanes.forEach((t, i) => { const y = TOP + i * LH; const ti = teamInfo(t); g += `<rect class="jl-lane ${i % 2 ? 'alt' : ''}" x="0" y="${y}" width="${W}" height="${LH}"/><rect x="0" y="${y}" width="6" height="${LH}" style="fill:${t === 'other' ? 'var(--line)' : ti[2]}"/>${T(18, y + LH / 2 - 2, t === 'other' ? 'Unassigned' : ti[1], 'jl-ln')}${T(18, y + LH / 2 + 15, `${seq.filter((x) => x.team === t).length} steps`, 'jl-ls')}`; });
  if (others) g += `<rect class="jl-lane other" x="0" y="${TOP + lanes.length * LH}" width="${W}" height="${OTH}"/>${T(18, TOP + lanes.length * LH + OTH / 2 - 2, 'Other teams', 'jl-ln')}${T(18, TOP + lanes.length * LH + OTH / 2 + 14, '(not ticked)', 'jl-ls')}`;
  const pos = seq.map((x, i) => { const other = !lanes.includes(x.team); return { x: LW + i * CW, y: other ? TOP + lanes.length * LH + 12 : laneTop(x.team) + (LH - NH) / 2, w: NW, h: other ? 40 : NH, other }; });
  seq.forEach((x, i) => { if (!i) return; const a = pos[i - 1], b = pos[i]; const cross = seq[i - 1].team !== x.team;
    const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x - 2, y2 = b.y + b.h / 2, mx = (x1 + x2) / 2;
    g += `<path class="jl-link ${cross ? 'ho' : ''}" d="M${x1},${y1} H${mx} V${y2} H${x2}" marker-end="url(#${cross ? 'jlb' : 'jla'})"/>`;
    const wk = exec ? x.flags.filter((f) => f.on === 'link') : [];
    if (wk.length) g += `<g data-tip="${esc(wk.map((f) => f.text).join(' · '))}">${flagShape('weakness', '', mx, (y1 + y2) / 2, 10)}</g>`; });
  seq.forEach((x, i) => { const P = pos[i]; const t = tById[x.s.toolId]; const tm = teamInfo(x.team); const act = interactive ? `data-action="flowStep" data-id="${esc(x.s.id)}"` : '';
    const tip = esc([`${i + 1}. ${x.s.name}`, tm[1], x.s.actorLabel, t ? t.name : 'No system', stepTimeText(x.s, true), exec ? x.flags.map((f) => f.text).join(' · ') : ''].filter(Boolean).join(' · '));
    if (P.other) { g += `<g class="jl-o ${interactive ? 'clk' : ''}" ${act} data-tip="${tip}"><rect x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="20" style="stroke:${tm[2]}"/>${T(P.x + 12, P.y + 17, `${i + 1} · ${tm[1]}`, 'jl-ot')}${T(P.x + 12, P.y + 31, trunc(x.s.name, 24), 'jl-on')}</g>`; return; }
    const hot = exec && isHotspot(x.s); const dec = exec && x.s.kind === 'decision';
    const rv = (x.s.review && x.s.review.status) || 'assumed';
    g += `<g class="jl-n ${x.s.automated ? 'auto' : ''} ${dec ? 'decision' : ''} rvs-${rv} ${interactive ? 'clk' : ''}" ${act} data-tip="${tip}">`;
    g += `<rect class="nb" x="${P.x}" y="${P.y}" width="${P.w}" height="${P.h}" rx="10"/><rect x="${P.x}" y="${P.y}" width="5" height="${P.h}" rx="2" style="fill:${tm[2]}"/>`;
    g += `<circle class="num" cx="${P.x + 18}" cy="${P.y + 16}" r="9"/>${T(P.x + 18, P.y + 20, i + 1, 'numt', 'middle')}`;
    if (dec) g += T(P.x + 32, P.y + 20, '◇ DECISION', 'jl-dec');
    wrapText(x.s.name, 21, 3).forEach((ln, k) => { g += T(P.x + 12, P.y + 42 + k * 14, ln, 'jl-nm'); });
    if (exec && x.s.involves) g += T(P.x + 12, P.y + P.h - 22, trunc('With: ' + x.s.involves, 24), 'jl-inv');
    g += T(P.x + 12, P.y + P.h - 8, (x.s.automated ? '⚙ ' : '') + trunc(t ? t.name.replace(/ \(.*/, '') : 'No system', 16), `jl-tool ${t ? '' : 'none'}`);
    if (num(x.s.durationMins) || num(x.s.elapsedDays)) g += T(P.x + P.w - 8, P.y + P.h - 8, (hot ? '⏱ ' : '') + stepTimeText(x.s), `jl-time ${hot ? 'hot' : ''}`, 'end');
    const nf = exec ? x.flags.filter((f) => f.on === 'node') : [];
    if (nf.length) g += flagShape('issue', nf.length > 1 ? nf.length : '!', P.x + P.w - 6, P.y + 4, 10);
    g += '</g>'; });
  g += `<line class="jl-sep" x1="0" x2="${W}" y1="${lanesBottom + 22}" y2="${lanesBottom + 22}"/>${T(18, TT + 2, 'TOOLS ALONG THE JOURNEY', 'jl-th')}${T(LW, TT + 2, '● = a step that uses this tool, coloured by team', 'jl-ls')}`;
  toolRows.forEach(([tid, set], k) => { const y = TT + 30 + k * 36; const t = tById[tid];
    g += `<line class="jl-tl" x1="${LW - 10}" x2="${W - 20}" y1="${y - 4}" y2="${y - 4}"/>${T(18, y - 2, trunc(t.name.replace(/ \(.*/, ''), 24), 'jl-tn')}${T(18, y + 13, set.size > 1 ? 'SHARED: ' + [...set].map((l) => teamInfo(l)[1]).join(' + ') : teamInfo([...set][0])[1] + ' only', set.size > 1 ? 'jl-sh' : 'jl-ls')}`;
    seq.forEach((x, i) => { if (x.s.toolId === tid && lanes.includes(x.team)) g += `<circle cx="${LW + i * CW + NW / 2}" cy="${y - 4}" r="7" class="jl-dot" style="fill:${teamInfo(x.team)[2]}"/>${T(LW + i * CW + NW / 2, y + 14, i + 1, 'jl-dn', 'middle')}`; }); });
  g += '</svg>';
  return `<div class="flow-wrap${zoom ? ' zoomed' : ''}">${g}</div>`;
}

/** The same selection as one snaking flow; steps by unticked teams collapse into grey "other teams" cards. */
function journeyFlow(st, J, { exec = true, cols = 4, interactive = true, zoom = 0 } = {}) {
  const { seq } = journeySeq(st, J); if (!seq.length) return '<p class="empty">Nothing to show for this selection.</p>';
  const steps = [];
  seq.forEach((x, k) => {
    if (J.by === 'team' && !J.teams.includes(x.team)) {
      const last = steps[steps.length - 1];
      if (last && last.collapsed) { last._n++; last._teams.add(teamInfo(x.team)[1]); last.name = `${[...last._teams].join(', ')}: ${last._n} steps`; last.displayNum = `${last._from}–${k + 1}`; return; }
      steps.push({ id: x.s.id, collapsed: true, _n: 1, _from: k + 1, displayNum: k + 1, _teams: new Set([teamInfo(x.team)[1]]), name: `${teamInfo(x.team)[1]}: ${x.s.name}`, team: '', automated: false, toolId: '', actorLabel: '' }); return;
    }
    steps.push(Object.assign({}, x.s, { team: x.team === 'other' ? '' : x.team, painPoint: x.s.painPoint, flags: [], displayNum: k + 1 }));
  });
  const first = seq[0].p, last = seq[seq.length - 1].p;
  const merged = { id: 'journey', name: 'Across the journey', inputs: first.inputs, outputs: last.outputs, steps };
  return flowSchematic(merged, st.people, st.tools, st.departments, { cols, interactive, zoom, clientSafe: true, exec, anonymise: ui.anon }).replace('class="flow-wrap"', `class="flow-wrap${zoom ? ' zoomed' : ''}"`);
}

function journeyControls(st, J) {
  const tick = (kind, id, label, on) => `<label class="jtick ${on ? 'on' : ''}"><input type="checkbox" data-action="journeyTick" data-kind="${kind}" data-id="${esc(id)}" ${on ? 'checked' : ''}>${label}</label>`;
  return `<div class="jctl">
    <div class="jrow"><span class="faint small">Show</span><button class="btn sm ${J.by === 'team' ? 'on' : ''}" data-action="journeySet" data-k="by" data-id="team">By team</button><button class="btn sm ${J.by === 'process' ? 'on' : ''}" data-action="journeySet" data-k="by" data-id="process">By process</button>
      <span class="faint small" style="margin-left:10px">Layout</span><button class="btn sm ${J.layout === 'lanes' ? 'on' : ''}" data-action="journeySet" data-k="layout" data-id="lanes">Lanes</button><button class="btn sm ${J.layout === 'flow' ? 'on' : ''}" data-action="journeySet" data-k="layout" data-id="flow">Flow</button>
      <label class="tog small" style="margin-left:10px"><input type="checkbox" data-ui="execView" ${ui.execView !== false ? 'checked' : ''}> <b>Executive view</b> <span class="faint">(issues, decisions, management, hotspots)</span></label></div>
    <div class="jrow">${J.by === 'team'
      ? J.allTeams.map((t) => { const ti = teamInfo(t); return tick('team', t, `<i class="tdot" style="background:${ti[2]}"></i>${esc(ti[1])}`, J.teams.includes(t)); }).join('') + '<span class="faint small">Product is not mapped yet.</span>'
      : J.allProcs.map((id) => { const p = st.processes.find((x) => x.id === id); return tick('proc', id, `<span class="faint small">${esc((STAGES.find((x) => x[0] === p.stage) || ['', ''])[1])}</span> ${esc(p.name)}`, J.procs.includes(id)); }).join('')}</div></div>`;
}

function journeyView(e, st) {
  const J = journeyState(st); const exec = ui.execView !== false;
  const mainW = (document.getElementById('main') || {}).clientWidth || 1100;
  const cols = ui.flowCols || ui.flowColsAuto || (mainW < 640 ? 1 : mainW < 1000 ? 2 : 4);
  const nSteps = journeySeq(st, J).seq.length; const laneW = 200 + nSteps * 172 + 24;
  const laneZoom = ui.flowZoom || Math.min(1, Math.max((mainW - 60) / laneW, 0.8));
  const diagram = J.layout === 'lanes' ? journeyLanes(st, J, { exec, zoom: laneZoom }) : journeyFlow(st, J, { exec, cols, zoom: ui.flowZoom });
  const { seq } = journeySeq(st, J);
  const shown = seq.filter((x) => J.by === 'process' || J.teams.includes(x.team));
  const issues = exec ? shown.flatMap((x) => x.flags.map((f) => ({ f, x }))) : [];
  const idx = Object.fromEntries(seq.map((x, i) => [x.s.id, i + 1]));
  const hand = shown.filter((x, i) => { const k = seq.indexOf(x); return k > 0 && seq[k - 1].team !== x.team; }).length;
  return `<section class="card pflow"><header class="card-h"><div><span class="eyebrow">Across the journey</span><h3 class="ptitle">${J.by === 'team' ? esc(J.teams.map((t) => teamInfo(t)[1]).join(' + ')) : esc(J.procs.length + ' processes joined end to end')}</h3>
      <p class="sub">${shown.length} steps · ${hand} hand-offs between teams${exec ? ` · ${issues.length} issues and weaknesses` : ''}. Click a step to open its process.</p></div>
      <div class="btn-row"><button class="btn sm ghost" data-action="journeyClose">← Back to single process</button></div></header>
    ${journeyControls(st, J)}
    ${J.layout === 'flow' ? flowToolbar(cols) : `<div class="flow-tools"><span class="faint small">View</span><button class="btn sm ${ui.flowWhole && ui.flowZoom ? 'on' : ''}" data-action="flowZoom" data-id="fit">⤢ Whole journey</button><button class="btn sm" data-action="flowZoom" data-id="out">−</button><span class="small zl">${Math.round(laneZoom * 100)}%</span><button class="btn sm" data-action="flowZoom" data-id="in">+</button><button class="btn sm ${laneZoom === 1 ? 'on' : ''}" data-action="flowZoom" data-id="100">100%</button><span class="faint small" style="margin-left:8px">Scroll sideways or drag to move along the journey; Ctrl + scroll to zoom.</span></div>`}
    <div class="flow-tools flow-export"><span class="faint small">Export</span><button class="btn sm" data-action="exportJourney" data-id="png">Image (PNG)</button><button class="btn sm" data-action="exportJourney" data-id="svg">Vector (SVG)</button><button class="btn sm" data-action="exportJourney" data-id="pdf">PDF page</button><span class="faint small">Client-safe: no internal notes.</span></div>
    ${exec ? flowLegend(true) : '<div class="legend flow-legend"><span class="faint">Executive view is off: steps, people, systems and hand-offs only.</span></div>'}
    ${diagram}
    ${exec && issues.length ? `<details class="jiss" open><summary><b>Issues and weaknesses along this view (${issues.length})</b></summary><ol class="flags">${issues.map(({ f, x }) => `<li class="clk" data-action="flowStep" data-id="${esc(x.s.id)}">${flagIcon(f.type)}<div><div class="small"><b>${FLAG_TYPES[f.type][0]}</b> · step ${idx[x.s.id]} (${esc(teamInfo(x.team)[1])}): ${esc(trunc(x.s.name, 60))}</div><div>${esc(f.text)}</div></div></li>`).join('')}</ol></details>` : ''}
  </section>`;
}

function journeyExportDoc(e, st, markup, J) {
  const css = (document.getElementById('viz-css') || {}).textContent || '';
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><title>${esc('Across the journey · ' + e.client.name)}</title><style>${css}
body{margin:0;background:#fff;font-family:Inter,ui-sans-serif,-apple-system,"Segoe UI",sans-serif;color:#171715;font-size:12.5px}main{margin:16px}.eyebrow{text-transform:uppercase;letter-spacing:.16em;font-size:10.5px;font-weight:750;color:#c8221c}
h1{font-family:Georgia,serif;font-weight:400;font-size:24px;margin:4px 0}.flow-wrap{border:0;padding:0}.flow-svg{max-width:100%!important;width:100%!important;height:auto!important}.muted{color:#665f57}
@page{size:A3 landscape;margin:8mm}</style></head><body><main><div class="eyebrow">${esc(e.client.name)} · The Growth Machine</div>
<h1>${J.by === 'team' ? esc(J.teams.map((t) => teamInfo(t)[1]).join(' + ')) + ' across the journey' : 'Selected processes, end to end'}</h1><p class="muted">${date}${ui.execView !== false ? ' · Executive view: issues, weaknesses, decisions, management involvement and time hotspots shown' : ''}</p>
${ui.execView !== false ? flowLegend(true) : ''}${markup}<p class="muted" style="font-size:10.5px">The Growth Machine · ${date} · Confidential. Prepared for ${esc(e.client.name)}.</p></main></body></html>`;
}
