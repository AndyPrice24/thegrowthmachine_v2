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
const teamInfo = (id) => TEAMS.find((t) => t[0] === id) || ['', 'Unassigned', 'var(--line)'];

function stepTeam(s, pById, dById) {
  if (s.team) return s.team;
  const p = s.actorId && pById[s.actorId]; const d = p && dById[p.departmentId];
  const map = { revenue: 'sales', tech: 'product' };
  if (d && d.type) return map[d.type] || d.type;
  return s.automated ? 'system' : '';
}

/** Every warning along a process, numbered in path order. Hand-off weaknesses sit on the connector into a step. */
function flowFlags(proc, people, tools, departments) {
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
    (s.flags || []).forEach((f, k) => add({ type: FLAG_TYPES[f.type] ? f.type : 'issue', on: 'node', stepId: s.id, text: f.text, by: f.by || 'Team', date: f.date, idx: k }));
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
function flowSchematic(proc, people, tools, departments, { cols = 3, selected = '', anonymise = false, interactive = true } = {}) {
  const steps = proc.steps || [];
  if (!steps.length) return '<p class="empty">This process has no steps yet.</p>';
  const pById = byId(people), tById = byId(tools), dById = byId(departments);
  const flags = flowFlags(proc, people, tools, departments);
  cols = Math.max(1, Math.min(cols, steps.length));
  const NW = 262, NH = 136, GX = 78, GY = 96, PX = 34, TOP = 74;
  const rows = Math.ceil(steps.length / cols);
  const W = PX * 2 + cols * NW + (cols - 1) * GX, H = TOP + rows * (NH + GY) - GY + 92;
  const pos = steps.map((s, i) => { const r = Math.floor(i / cols); let c = i % cols; if (r % 2) c = cols - 1 - c; return { x: PX + c * (NW + GX), y: TOP + r * (NH + GY), r }; });
  const mid = `fa-${esc(proc.id)}`;
  let svg = `<svg class="flow-svg" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px" role="img" aria-label="Flow: ${esc(proc.name)}">`;
  svg += `<defs><marker id="${mid}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="fa"/></marker></defs>`;
  // start / end pills
  const pill = (x, y, label, text) => `<g class="pill"><rect x="${x}" y="${y}" width="${NW}" height="34" rx="17"/><text x="${x + 16}" y="${y + 22}"><tspan class="pl">${label}</tspan> ${esc(trunc(text, 34))}</text></g>`;
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
    svg += `<path class="link${handoff ? ' handoff' : ''}${ghost}" d="${d}" marker-end="url(#${mid})"/>`;
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
    svg += `<g class="fnode ${s.automated ? 'auto' : 'manual'} ${st} ${selected === s.id ? 'sel' : ''} ${interactive ? 'clk' : ''}" transform="translate(${x},${y})" ${interactive ? `data-action="flowStep" data-id="${esc(s.id)}"` : ''} data-tip="${esc([s.name, actor, t ? 'Tool: ' + t.name : 'No system', s.automated ? 'Automated' : 'Manual', num(s.durationMins) ? num(s.durationMins) + ' min' : 'Time not measured'].filter(Boolean).join(' · '))}">`;
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
  return `<div class="flow-wrap">${svg}</div>`;
}

const flowLegend = () => `<div class="legend flow-legend">
  <span>${flagIcon('issue')} Issue <span class="faint">(team / interviews)</span></span>
  <span>${flagIcon('unverified')} Unverified <span class="faint">(to confirm)</span></span>
  <span>${flagIcon('weakness')} Weakness <span class="faint">(flagged by the machine)</span></span>
  <span><span class="ho-ico">⇄</span> Hand-off between teams</span>
  <span><span class="chip" style="border-style:dashed">⚙ Automated</span></span></div>`;

/** Client journey strip: stages left to right, the processes mapped in each, with warning counts. */
function journeyStrip(procs, people, tools, departments, current) {
  const counts = (p) => { const f = flowFlags(p, people, tools, departments); return ['issue', 'unverified', 'weakness'].map((t) => [t, f.filter((x) => x.type === t).length]); };
  const pBtn = (p) => `<button class="jp ${p.id === current ? 'on' : ''}" data-action="proc" data-id="${esc(p.id)}"><strong>${esc(p.name)}</strong><span class="jc">${counts(p).filter(([, n]) => n).map(([t, n]) => `<span class="jcn jcn-${t}" title="${FLAG_TYPES[t][0]}">${flagIcon(t)}${n}</span>`).join('') || '<span class="faint small">No warnings</span>'}</span>${p.confidence ? `<span class="conf conf-${CONFIDENCE[p.confidence] ? CONFIDENCE[p.confidence][2] : 'warn'}">${esc((CONFIDENCE[p.confidence] || [p.confidence])[0])}</span>` : ''}</button>`;
  const stageCards = STAGES.map(([id, label], i) => {
    const ps = procs.filter((p) => p.stage === id);
    return `<div class="jstage ${ps.length ? '' : 'jempty'}"><div class="jh"><span class="jn">${i + 1}</span>${esc(label)}</div>${ps.length ? ps.map(pBtn).join('') : '<p class="faint small">Not mapped yet</p>'}</div>`;
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

/** Numbered warnings list + selected step detail. */
function flowSidePanels(e, p, people, tools, departments) {
  const flags = flowFlags(p, people, tools, departments);
  const steps = p.steps || []; const idx = Object.fromEntries(steps.map((s, i) => [s.id, i]));
  const list = flags.length ? `<ol class="flags">${flags.map((f) => `<li class="clk ${f.stepId === ui.stepId ? 'on' : ''}" data-action="flowStep" data-id="${esc(f.stepId)}">${flagIcon(f.type, f.n)}<div><div class="small"><b>${FLAG_TYPES[f.type][0]}</b> · ${f.on === 'link' ? 'into ' : ''}step ${idx[f.stepId] + 1}: ${esc(trunc((steps[idx[f.stepId]] || {}).name, 60))}</div><div>${esc(f.text)}</div><div class="faint small">${esc(f.by || '')}${f.date ? ' · ' + esc(f.date) : ''}</div></div></li>`).join('')}</ol>` : '<p class="empty">No warnings on this flow.</p>';
  const s = steps.find((x) => x.id === ui.stepId);
  let detail = '<p class="empty">Click a step in the flow to see its detail, and to flag an issue or something unverified.</p>';
  if (s) {
    const pById = byId(people), dById = byId(departments), t = byId(tools)[s.toolId]; const pp = s.actorId && pById[s.actorId];
    const tm = teamInfo(stepTeam(s, pById, dById));
    const own = (s.flags || []).map((f, k) => `<li>${flagIcon(FLAG_TYPES[f.type] ? f.type : 'issue')} <span>${esc(f.text)} <span class="faint small">${esc(f.by || '')}${f.date ? ' · ' + esc(f.date) : ''}</span></span> <button class="btn sm ghost" data-action="removeFlowFlag" data-id="${k}" title="Remove (e.g. once verified)">✕</button></li>`).join('');
    detail = `<h4 style="margin-top:0">Step ${idx[s.id] + 1}: ${esc(s.name)}</h4>
      <dl class="sd"><dt>Team</dt><dd><i class="tdot" style="background:${tm[2]}"></i>${esc(tm[1])}</dd><dt>Who</dt><dd>${esc(pp ? (ui.anon ? pp.title : pp.name) : (s.actorLabel || '—'))}</dd>
      <dt>System</dt><dd>${esc(t ? t.name : 'No system')}</dd><dt>Mode</dt><dd>${s.automated ? 'Automated' : 'Manual'}</dd><dt>Time</dt><dd>${num(s.durationMins) ? num(s.durationMins) + ' min per run' : '<span class="warn-t">Not measured</span>'}</dd>
      ${s.input || s.output ? `<dt>In → out</dt><dd>${esc(s.input || '—')} → ${esc(s.output || '—')}</dd>` : ''}
      ${s.painPoint ? `<dt>Pain point</dt><dd>${esc(s.painPoint)}</dd>` : ''}</dl>
      ${own ? `<h5>Flags added</h5><ul class="ownf">${own}</ul>` : ''}
      <div class="btn-row"><button class="btn sm" data-action="addFlowFlag" data-id="issue">+ Flag issue</button><button class="btn sm" data-action="addFlowFlag" data-id="unverified">+ Flag unverified</button><button class="btn sm" data-action="addFlowFlag" data-id="weakness">+ Flag weakness</button></div>`;
  }
  return `<div class="flow-panels">${card(`Warnings along this flow (${flags.length})`, list)}${card('Step detail', detail)}</div>`;
}
