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
const flowDims = (n, c) => { c = Math.max(1, Math.min(c, n)); const rows = Math.ceil(n / c); return [34 * 2 + c * 262 + (c - 1) * 78, 74 + rows * (136 + 96) - 96 + 92]; };
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
function flowSchematic(proc, people, tools, departments, { cols = 3, selected = '', anonymise = false, interactive = true, zoom = 0, clientSafe = false } = {}) {
  const steps = proc.steps || [];
  if (!steps.length) return '<p class="empty">This process has no steps yet.</p>';
  const pById = byId(people), tById = byId(tools), dById = byId(departments);
  const flags = flowFlags(proc, people, tools, departments, clientSafe);
  cols = Math.max(1, Math.min(cols, steps.length));
  const NW = 262, NH = 136, GX = 78, GY = 96, PX = 34, TOP = 74;
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
    svg += `<g class="fnode ${s.automated ? 'auto' : 'manual'} ${st} ${selected === s.id ? 'sel' : near && near.has(i) ? 'nbr' : near ? 'dim' : ''} ${interactive ? 'clk' : ''}" transform="translate(${x},${y})" ${interactive ? `data-action="flowStep" data-id="${esc(s.id)}"` : ''} data-tip="${esc([s.name, actor, t ? 'Tool: ' + t.name : 'No system', s.automated ? 'Automated' : 'Manual', num(s.durationMins) ? num(s.durationMins) + ' min' : 'Time not measured'].filter(Boolean).join(' · '))}">`;
    svg += `<rect class="nb" width="${NW}" height="${NH}" rx="12"/>`;
    svg += `<rect class="band" width="${NW}" height="28" rx="12" style="fill:${tm[2]}"/><rect class="band" y="16" width="${NW}" height="12" style="fill:${tm[2]}"/>`;
    svg += `<circle class="num" cx="18" cy="14" r="10"/><text class="numt" x="18" y="18" text-anchor="middle">${i + 1}</text>`;
    svg += `<text class="team" x="36" y="18.5">${esc(tm[1].toUpperCase())}</text>`;
    svg += lines.map((ln, k) => `<text class="nm" x="14" y="${50 + k * 16}">${esc(ln)}</text>`).join('');
    if (actor) svg += `<text class="act" x="14" y="${NH - 30}">${esc(trunc(actor, 40))}</text>`;
    svg += `<line class="sep" x1="14" x2="${NW - 14}" y1="${NH - 22}" y2="${NH - 22}"/>`;
    svg += `<text class="tool" x="14" y="${NH - 8}">${esc(trunc(t ? t.name : 'No system', 26))}${t && t._removed ? ' (removed)' : ''}</text>`;
    svg += `<text class="mode ${s.automated ? 'm-auto' : ''}" x="${NW - 14}" y="${NH - 8}" text-anchor="end">${s.automated ? '⚙ Automated' : 'Manual'}${num(s.durationMins) ? ' · ' + num(s.durationMins) + 'm' : ''}</text>`;
    nf.forEach((f, k) => { svg += `<g data-tip="${esc(`${f.n}. ${FLAG_TYPES[f.type][0]}: ${f.text}`)}">${flagShape(f.type, f.n, NW - 14 - k * 27, 0)}</g>`; });
    if (st) svg += `<text class="stt stt-${st}" x="${NW - 14}" y="${NH - 30}" text-anchor="end">${st === 'removed' ? '✕ REMOVED' : st === 'added' ? '+ NEW' : '~ CHANGED'}</text>`;
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
  <span><span class="chip" style="border-style:dashed">⚙ Automated</span></span></div>`;

/** Client journey strip: stages left to right, the processes mapped in each, with warning counts. */
function journeyStrip(procs, people, tools, departments, current, clientSafe = false) {
  const counts = (p) => { const f = flowFlags(p, people, tools, departments, clientSafe); return ['issue', 'unverified', 'weakness'].map((t) => [t, f.filter((x) => x.type === t).length]); };
  const pBtn = (p) => `<button class="jp ${p.id === current ? 'on' : ''}" data-action="proc" data-id="${esc(p.id)}"><strong>${esc(p.name)}</strong><span class="jc">${counts(p).filter(([, n]) => n).map(([t, n]) => `<span class="jcn jcn-${t}" title="${FLAG_TYPES[t][0]}">${flagIcon(t)}${n}</span>`).join('') || '<span class="faint small">No warnings</span>'}</span>${p.confidence ? `<span class="conf conf-${CONFIDENCE[p.confidence] ? CONFIDENCE[p.confidence][2] : 'warn'}">${esc((CONFIDENCE[p.confidence] || [p.confidence])[0])}</span>` : ''}</button>`;
  const stageCards = STAGES.map(([id, label], i) => {
    const ps = procs.filter((p) => p.stage === id);
    return `<div class="jstage ${ps.length ? '' : 'jempty'}"><div class="jh ${ps.length ? 'clk' : ''}" ${ps.length ? `data-action="proc" data-id="${esc(ps[0].id)}"` : ''}><span class="jn">${i + 1}</span>${esc(label)}</div>${ps.length ? ps.map(pBtn).join('') : '<p class="faint small">Not mapped yet</p>'}</div>`;
  }).join('<div class="jarrow" aria-hidden="true">›</div>');
  const other = procs.filter((p) => !STAGES.some(([id]) => id === p.stage));
  return `<div class="journey">${stageCards}</div>${other.length ? `<div class="jother"><span class="faint small">Other processes:</span> ${other.map(pBtn).join('')}</div>` : ''}`;
}

/** Plain-language brief above the schematic: summary, confidence, talking points, what is still to measure. */
function processBrief(e, p) {
  const conf = CONFIDENCE[p.confidence];
  const steps = live(p.steps);
  const toMeasure = [];
  if (!num(p.runsPerMonth)) toMeasure.push('How often it runs (per month)');
  const untimed = steps.filter((s) => !num(s.durationMins)).length;
  if (untimed) toMeasure.push(`Time per step (${untimed} of ${steps.length} steps not measured)`);
  if (!p.ownerId) toMeasure.push('Owner');
  const fIds = splitList(p.findingIds); const fs = fIds.map((id) => e.findings.find((f) => f.id === id)).filter(Boolean);
  const tps = String(p.talkingPoints || '').split('\n').map((x) => x.trim()).filter(Boolean);
  return `<div class="pbrief">
    <div>${conf ? `<span class="conf conf-${conf[2]}" title="${esc(conf[1])}">${esc(conf[0])}</span> <span class="faint small">${esc(conf[1])}${p.sources ? ' · Source: ' + esc(p.sources) : ''}</span>` : '<span class="faint small">Confidence not set</span>'}
      ${p.summary ? `<p class="psum">${esc(p.summary)}</p>` : ''}
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
      <dt>System</dt><dd>${esc(t ? t.name : 'No system')}</dd><dt>Mode</dt><dd>${s.automated ? 'Automated' : 'Manual'}</dd><dt>Time</dt><dd>${num(s.durationMins) ? num(s.durationMins) + ' min per run' : '<span class="warn-t">Not measured</span>'}</dd>
      ${s.input || s.output ? `<dt>In → out</dt><dd>${esc(s.input || '—')} → ${esc(s.output || '—')}</dd>` : ''}</dl>
    ${nb(next, 'to')}
    ${mine.length ? `<h5>Warnings here (${mine.length})</h5><ol class="flags">${mine.map(flagLi).join('')}</ol>` : '<p class="small muted">No warnings on this step.</p>'}
    ${own ? `<h5>Flags you can clear</h5><ul class="ownf">${own}</ul>` : ''}
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
  const holder = document.createElement('div');
  holder.style.cssText = 'position:fixed;left:-100000px;top:0;width:2400px';
  Object.entries(LIGHT_TOKENS).forEach(([k, v]) => holder.style.setProperty(k, v));
  holder.innerHTML = flowSchematic(proc, st.people, st.tools, st.departments, { cols: ui.flowCols || ui.flowColsAuto || 3, interactive: false, clientSafe, anonymise: ui.anon });
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
    const conf = CONFIDENCE[p.confidence];
    const untimed = live(steps).filter((x) => !num(x.durationMins)).length;
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
    <button class="btn sm ghost" data-action="exportFlow" data-id="all">All flows + journey (PDF)</button></div>`;
}
