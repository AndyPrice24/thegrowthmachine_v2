/* Flow schematics: a serpentine process flow with warning markers, sense-check and exports.
   Data (all optional, backward compatible):
   process: stage, confidence ('heard'|'corroborated'|'measured'), sources, summary, talkingPoints, findingIds
   step:    team, actorLabel/actorId, toolId, automated, durationMins, painPoint, flags:[{type,text,by,date}] */

const TEAMS = [
  ['client', 'Client', 'var(--s-other)'], ['marketing', 'Marketing', 'var(--s5)'], ['sales', 'Sales', 'var(--s1)'],
  ['cs', 'Client Success', 'var(--s3)'], ['ops_onb', 'Ops: Onboarding', 'var(--s2)'], ['ops_tech', 'Ops: Tech & maintenance', 'var(--s9)'], ['ops', 'Operations', 'var(--s2)'], ['product', 'Product & Dev', 'var(--s7)'],
  ['leadership', 'Leadership', 'var(--s4)'], ['finance', 'Finance', 'var(--s6)'], ['system', 'System', 'var(--faint)']
];
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
/** Rank steps by how badly they break: 2 per issue, 1.5 per weakness, 1 for a time hotspot. Top N get the strong highlight. */
function breakPoints(steps, flags, topN) {
  const n = topN == null ? (ui.bpTop == null ? 5 : ui.bpTop) : topN;
  const score = {}, why = {}; const pos = {}; steps.forEach((s, i) => { pos[s.id] = i; });
  steps.forEach((s) => {
    if (!s || s.collapsed || s._removed) return;
    const f = flags.filter((x) => x.stepId === s.id && x.type !== 'unverified');
    const W = { high: 4, medium: 2, low: 1 };
    const issues = f.filter((x) => x.type === 'issue'); const wk = f.filter((x) => x.type === 'weakness').length, hot = isHotspot(s) ? 1 : 0;
    const iw = sum(issues, (x) => (x.on === 'node' && x.idx == null ? W[s.painSeverity] || 2 : W[x.severity] || 2));
    const sc = iw + wk * 1.5 + hot;
    const sev = s.painSeverity && s.painPoint ? ` (${s.painSeverity})` : '';
    if (sc > 0) { score[s.id] = sc; why[s.id] = [issues.length && `${issues.length} issue${issues.length > 1 ? 's' : ''}${sev}`, wk && `${wk} weak hand-off${wk > 1 ? 's' : ''}`, hot && 'time hotspot'].filter(Boolean).join(' · '); }
  });
  const order = Object.keys(score).sort((a, c) => score[c] - score[a] || pos[a] - pos[c]);
  const ranks = {}; const label = {}; const picked = order.slice(0, n ? n : order.length);
  picked.forEach((id, i) => { const first = order.findIndex((x) => score[x] === score[id]); const tied = order.filter((x) => score[x] === score[id]).length > 1; ranks[id] = i + 1; label[id] = `#${first + 1}${tied ? '=' : ''}`; });
  return { ranks, label, order, score, why };
}
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
function flowSchematic(proc, people, tools, departments, { cols = 3, selected = '', anonymise = false, interactive = true, zoom = 0, clientSafe = false, exec = true, ranks = null } = {}) {
  const steps = proc.steps || [];
  if (!steps.length) return '<p class="empty">This process has no steps yet.</p>';
  const pById = byId(people), tById = byId(tools), dById = byId(departments);
  const flags = exec ? flowFlags(proc, people, tools, departments, clientSafe) : [];
  const bpx = exec ? (ranks ? { ranks, label: (ranks._label || {}) } : breakPoints(steps, flags)) : { ranks: {}, label: {} }; const rk = bpx.ranks;
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
    if (lf.length) svg += lf.map((f, k) => `<g data-tip="${esc(`${f.n}. ${f.text}`)}" ${interactive ? `data-action="flowStep" data-id="${esc(s.id)}" data-flag="link"` : ''} class="clk">${flagShape('weakness', f.n, mx + k * 26, my)}</g>`).join('');
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
    const flagged = exec && flags.some((f) => f.stepId === s.id && f.type !== 'unverified'); const rank = rk[s.id];
    const rv = (s.review && s.review.status) || 'assumed';
    const hot = exec && isHotspot(s);
    svg += `<g class="fnode ${rank ? 'bp-top' : flagged ? 'bp-lite' : ''} ${s._focus ? 'focus' : ''} ${s.collapsed ? 'collapsed' : ''} ${s.automated ? 'auto' : 'manual'} ${exec && s.kind === 'decision' ? 'decision' : ''} rvs-${rv} ${st} ${selected === s.id ? 'sel' : near && near.has(i) ? 'nbr' : near ? 'dim' : ''} ${interactive ? 'clk' : ''}" transform="translate(${x},${y})" ${interactive ? `data-action="flowStep" data-id="${esc(s.id)}"` : ''} data-tip="${esc([s.name, actor, t ? 'Tool: ' + t.name : 'No system', s.automated ? 'Automated' : 'Manual', stepTimeText(s, true), REVIEW_STATUS[rv][0] + (s.review && s.review.by ? ' by ' + s.review.by : '')].filter(Boolean).join(' · '))}">`;
    svg += `<rect class="nb" width="${NW}" height="${NH}" rx="12"/>`;
    if (s._procStart) svg += `<text class="pstart" x="2" y="${rank ? -27 : -9}">▸ triggers: ${esc(trunc(s._procStart, 34))}</text>`;
    if (rank) svg += `<g class="bp-pill"><rect x="${NW / 2 - 56}" y="-12" width="112" height="21" rx="10.5"/><text x="${NW / 2}" y="3" text-anchor="middle">${bpx.label[s.id] || '#' + rank} BREAK POINT</text></g>`;
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
  const props = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'font-size', 'font-weight', 'letter-spacing'];
  const parts = [...holder.querySelectorAll('svg.flow-svg')].map((svg) => {
    const W = +svg.dataset.w, H = +svg.dataset.h;
    const els = [...svg.querySelectorAll('*')];
    const styles = els.map((el) => { const cs = getComputedStyle(el); const out = props.map((pr) => `${pr}:${cs.getPropertyValue(pr)}`); if (el.tagName === 'text' || el.tagName === 'tspan') out.push('font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif'); return out.join(';'); });
    els.forEach((el, i) => { el.setAttribute('style', styles[i]); el.removeAttribute('class'); });
    const h = svg.closest('.flow-wrap') && svg.closest('.flow-wrap').previousElementSibling;
    return { svg, W, H, label: h && h.classList.contains('chain-h') ? h.textContent.replace(/\s+/g, ' ').trim() : '' };
  });
  const NS = 'http://www.w3.org/2000/svg';
  const W = Math.max(...parts.map((p) => p.W)); const LBL = parts.length > 1 ? 34 : 0;
  const H = parts.reduce((a, p) => a + p.H + LBL, 0);
  const out = document.createElementNS(NS, 'svg'); out.setAttribute('xmlns', NS); out.setAttribute('width', W); out.setAttribute('height', H); out.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const bg = document.createElementNS(NS, 'rect'); bg.setAttribute('width', W); bg.setAttribute('height', H); bg.setAttribute('fill', '#fffdf9'); out.appendChild(bg);
  let y = 0;
  parts.forEach((p) => {
    if (LBL) { const t = document.createElementNS(NS, 'text'); t.setAttribute('x', 24); t.setAttribute('y', y + 24); t.setAttribute('style', 'font:700 15px Inter,Segoe UI,Arial,sans-serif;fill:#171715'); t.textContent = p.label; out.appendChild(t); y += LBL; }
    p.svg.setAttribute('x', 0); p.svg.setAttribute('y', y); p.svg.setAttribute('width', p.W); p.svg.setAttribute('height', p.H); p.svg.removeAttribute('style'); out.appendChild(p.svg); y += p.H;
  });
  const xml = new XMLSerializer().serializeToString(out); holder.remove();
  return { xml, W, H };
}

/** A printable page for one or more flows. Internal adds sources, unverified points and what is still to measure. */
function flowExportDoc(e, procs, st, { internal = false } = {}) {
  const css = (document.getElementById('viz-css') || {}).textContent || '';
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const part = (p) => {
    const flags = flowFlags(p, st.people, st.tools, st.departments, !internal);
    const steps = p.steps || []; const idx = Object.fromEntries(steps.map((x, i) => [x.id, i]));
    const tps = String(p.talkingPoints || '').split('\n').map((x) => x.trim()).filter(Boolean);
    const conf = CONFIDENCE[effConfidence(p)];
    const untimed = live(steps).filter((x) => !num(x.durationMins) && !num(x.elapsedDays)).length;
    return `<section class="fx-sec"><div class="eyebrow">${esc(procGroup(p))}</div><h2>${esc(p.name)}</h2>
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
<div class="eyebrow">${esc(e.client.name)} · ${internal ? 'TGM internal' : 'Process flows'}</div><h1>${procs.length === 1 ? esc(procs[0].name) : 'Processes and flows'}</h1><p class="muted">${date}${internal ? ' · Internal working view: includes unverified points and sources' : ''}</p>
${procs.map(part).join('')}
<div class="foot">The Growth Machine · ${date} · ${internal ? 'Internal working document: not for client distribution.' : `Confidential. Prepared for ${esc(e.client.name)}.`}</div>
</main></body></html>`;
}


/** Editable fields for one step (used by the step editor and the live sense-check). */
function stepFields(s, st, attr) {
  const toolOpts = st.tools.filter((t) => !t._removed).map((t) => [t.id, t.name]);
  return `<label class="fld"><span>Step</span><input ${attr}="name" value="${esc(s.name || '')}"></label>
    <div class="rv-grid">
      <label class="fld"><span>Department</span>${sel(TEAMS.map((t) => [t[0], t[1]]), s.team || stepTeam(s, byId(st.people), byId(st.departments)), `${attr}="team"`)}</label>
      <label class="fld"><span>Who does it</span><input ${attr}="actorLabel" value="${esc(s.actorLabel || '')}"></label>
      <label class="fld"><span>System used</span>${sel(toolOpts, s.toolId || '', `${attr}="toolId"`)}</label>
      <label class="fld"><span>Automated?</span>${sel([['no', 'Manual'], ['yes', 'Automated']], s.automated ? 'yes' : 'no', `${attr}="automated"`, false)}</label>
      <label class="fld"><span>Hands-on time (minutes)</span><input type="number" min="0" ${attr}="durationMins" value="${esc(s.durationMins || '')}"></label>
      <label class="fld"><span>Waiting / elapsed (days)</span><input type="number" min="0" step="0.5" ${attr}="elapsedDays" value="${esc(s.elapsedDays || '')}"></label>
    </div>
    <div class="rv-grid"><label class="fld"><span>Issue at this step (pain point)</span><input ${attr}="painPoint" value="${esc(s.painPoint || '')}" placeholder="What goes wrong here?"></label>
      <label class="fld"><span>How serious?</span>${sel([['high', 'High: costs money, clients or a lot of time'], ['medium', 'Medium (default)'], ['low', 'Low: an annoyance']], s.painSeverity || 'medium', `${attr}="painSeverity"`, false)}</label></div>
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
    return `<section class="fx-sec"><div class="eyebrow">${esc(procGroup(p))} · for checking</div><h2>${esc(p.name)}</h2>
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


/** Executive summary strip: what the executive view is surfacing for the steps shown. */
function execBar(steps, flags, bpCount) {
  const live2 = steps.filter((x) => !x._removed && !x.collapsed);
  const n = (t) => flags.filter((f) => f.type === t).length;
  const dec = live2.filter((x) => x.kind === 'decision').length, mg = live2.filter((x) => x.involves).length, hot = live2.filter(isHotspot).length;
  const timed = live2.filter((x) => num(x.durationMins) || num(x.elapsedDays)).length;
  const item = (v, label, hint) => `<div class="eb-i ${v ? '' : 'eb-z'}"><b>${v}</b><span>${label}</span>${!v && hint ? `<em>${hint}</em>` : ''}</div>`;
  return `<div class="exec-bar"><span class="eb-t">Executive view</span>${bpCount != null ? `<div class="eb-i eb-bp"><b>${bpCount}</b><span>top break points</span><em>highlighted below</em></div>` : ''}${item(n('issue'), 'issues')}${item(n('weakness'), 'weaknesses')}${item(live2.filter((x) => flags.some((f) => f.stepId === x.id && f.type !== 'unverified')).length, 'steps affected')}${item(dec, 'decision points', 'none mapped yet')}${item(mg, 'management touchpoints', 'none mapped yet')}${item(hot, 'time hotspots', timed ? '' : 'add times to steps')}</div>`;
}
