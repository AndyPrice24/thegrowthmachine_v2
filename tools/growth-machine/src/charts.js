/* ============================================================
   Charts, org chart and swimlane renderers (return HTML/SVG strings)
   ============================================================ */
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const slotVar = (i) => (i >= 0 && i < 8 ? `var(--s${i + 1})` : 'var(--s-other)');
const SEQ = ['var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)', 'var(--seq-5)', 'var(--seq-6)', 'var(--seq-7)'];

function deptColor(depts, id) {
  const i = depts.findIndex((d) => d.id === id);
  return slotVar(i);
}

function wrapText(text, maxChars, maxLines) {
  const words = String(text || '').split(/\s+/); const lines = []; let cur = '';
  words.forEach((w) => {
    if ((cur + ' ' + w).trim().length > maxChars) { if (cur) lines.push(cur); cur = w; }
    else cur = (cur + ' ' + w).trim();
  });
  if (cur) lines.push(cur);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,2}$/, '…'); }
  return lines;
}
const trunc = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1) + '…' : s; };

/* ---- Horizontal bars (magnitude comparison) ---- */
function hbars(items, { fmt = (v) => v, color = 'var(--s1)', max } = {}) {
  if (!items.length) return '<p class="empty">No data yet.</p>';
  const mx = max || Math.max(1, ...items.map((i) => Math.abs(i.value)));
  return `<div class="hbars">${items.map((i) => `
    <div class="hbar" data-tip="${esc(i.label)}: ${esc(fmt(i.value))}${i.tip ? ' · ' + esc(i.tip) : ''}">
      <span class="hb-label">${i.swatch ? `<i class="swatch" style="background:${i.swatch}"></i>` : ''}${esc(i.label)}</span>
      <span class="hb-track"><span class="hb-fill" style="display:block;width:${Math.max(0.5, Math.abs(i.value) / mx * 100)}%;background:${i.color || color}"></span></span>
      <span class="hb-val">${esc(fmt(i.value))}</span>
    </div>`).join('')}</div>`;
}

function niceMax(v) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

/* ---- Line chart (change over time, one shared y-axis) ---- */
function lineChart(labels, series, { fmt = (v) => v, height = 240 } = {}) {
  if (!labels.length) return '<p class="empty">Add finance periods to see trends.</p>';
  const W = 640, H = height, L = 64, R = 16, T = 12, B = 28;
  const all = series.flatMap((s) => s.values.map(num));
  const ymax = niceMax(Math.max(0, ...all)); const ymin = 0;
  const x = (i) => L + (labels.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (labels.length - 1));
  const y = (v) => T + (H - T - B) * (1 - (v - ymin) / (ymax - ymin));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ymin + f * (ymax - ymin));
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  svg += `<g class="grid">${ticks.map((t) => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  svg += `<g class="axis">${ticks.map((t) => `<text x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${esc(fmt(t))}</text>`).join('')}`;
  svg += labels.map((l, i) => `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`).join('') + '</g>';
  series.forEach((s) => {
    const pts = s.values.map((v, i) => `${x(i)},${y(num(v))}`).join(' ');
    svg += `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    svg += s.values.map((v, i) => `<circle cx="${x(i)}" cy="${y(num(v))}" r="4" fill="${s.color}" stroke="var(--surface)" stroke-width="2"/>`).join('');
  });
  const colW = labels.length > 1 ? (W - L - R) / (labels.length - 1) : W - L - R;
  svg += labels.map((l, i) => `<rect class="hit" x="${x(i) - colW / 2}" y="${T}" width="${colW}" height="${H - T - B}" data-tip="${esc(l)} — ${series.map((s) => `${esc(s.name)}: ${esc(fmt(s.values[i]))}`).join(' · ')}"/>`).join('');
  svg += '</svg>';
  return `<div class="chart">${legend(series)}${svg}</div>`;
}

function legend(series) {
  return `<div class="legend">${series.map((s) => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
}

/* ---- Stacked columns (composition over time) ---- */
function stackedColumns(labels, stacks, { fmt = (v) => v, height = 260 } = {}) {
  if (!labels.length) return '<p class="empty">No data yet.</p>';
  const W = 640, H = height, L = 64, R = 16, T = 12, B = 28;
  const totals = labels.map((_, i) => sum(stacks, (s) => num(s.values[i])));
  const ymax = niceMax(Math.max(1, ...totals));
  const y = (v) => T + (H - T - B) * (1 - v / ymax);
  const band = (W - L - R) / labels.length; const bw = Math.min(56, band * 0.6);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * ymax);
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
  svg += `<g class="grid">${ticks.map((t) => `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  svg += `<g class="axis">${ticks.map((t) => `<text x="${L - 8}" y="${y(t) + 4}" text-anchor="end">${esc(fmt(t))}</text>`).join('')}`;
  svg += labels.map((l, i) => `<text x="${L + band * i + band / 2}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`).join('') + '</g>';
  labels.forEach((l, i) => {
    let acc = 0; const cx = L + band * i + (band - bw) / 2;
    const visible = stacks.filter((s) => num(s.values[i]) > 0);
    visible.forEach((s, k) => {
      const v = num(s.values[i]); const y0 = y(acc), y1 = y(acc + v); acc += v;
      const h = Math.max(0, y0 - y1 - (k < visible.length - 1 ? 2 : 0));
      const isTop = k === visible.length - 1;
      const r = isTop ? Math.min(4, h / 2) : 0;
      const top = y1 + (k < visible.length - 1 ? 0 : 0);
      svg += isTop
        ? `<path d="M${cx},${top + h} V${top + r} Q${cx},${top} ${cx + r},${top} H${cx + bw - r} Q${cx + bw},${top} ${cx + bw},${top + r} V${top + h} Z" fill="${s.color}" data-tip="${esc(l)} · ${esc(s.name)}: ${esc(fmt(v))}"/>`
        : `<rect x="${cx}" y="${top + 2}" width="${bw}" height="${h}" fill="${s.color}" data-tip="${esc(l)} · ${esc(s.name)}: ${esc(fmt(v))}"/>`;
    });
  });
  svg += '</svg>';
  return `<div class="chart">${legend(stacks)}${svg}</div>`;
}

/* ---- Heatmap (sequential, one hue) ---- */
function heatmap(rowLabels, colLabels, matrix, { fmt = (v) => v } = {}) {
  const mx = Math.max(0, ...matrix.flat().map(num));
  if (!mx) return '<p class="empty">No mapped process steps yet. Add steps with an actor to see who carries which work.</p>';
  let h = '<table class="heat"><tr><th></th>' + colLabels.map((c) => `<th class="col">${esc(trunc(c, 22))}</th>`).join('') + '</tr>';
  rowLabels.forEach((r, i) => {
    h += `<tr><th>${esc(r)}</th>` + matrix[i].map((v, j) => {
      const n = num(v); if (!n) return '<td style="background:var(--surface-2)"></td>';
      const k = Math.min(6, Math.floor(n / mx * 6.999));
      return `<td style="background:${SEQ[k]};color:${k >= 4 ? '#fff' : 'var(--ink)'}" data-tip="${esc(r)} · ${esc(colLabels[j])}: ${esc(fmt(n))}">${esc(fmt(n))}</td>`;
    }).join('') + '</tr>';
  });
  return h + '</table>';
}

/* ---- Org chart ---- */
function orgChart(people, departments, { anonymise = false, showGhosts = true, fmtMoney = (v) => v, showCost = true } = {}) {
  const nodes = people.filter((p) => showGhosts || !p._removed);
  if (!nodes.length) return '<p class="empty">No people added yet.</p>';
  const ids = new Set(nodes.map((n) => n.id));
  const kids = {}; const roots = [];
  nodes.forEach((n) => { if (n.managerId && ids.has(n.managerId) && n.managerId !== n.id) (kids[n.managerId] = kids[n.managerId] || []).push(n); else roots.push(n); });
  const NW = 184, NH = 66, HG = 16, VG = 46, LEAF_GAP = 10, MAX_STACK = 6;
  const deptName = byId(departments);
  const isLeafGroup = (n) => (kids[n.id] || []).length > 3 && (kids[n.id] || []).every((k) => !(kids[k.id] || []).length);
  const memo = {};
  function width(n, seen = new Set()) {
    if (memo[n.id]) return memo[n.id];
    if (seen.has(n.id)) return NW; seen.add(n.id);
    const ks = kids[n.id] || []; let w;
    if (!ks.length) w = NW;
    else if (isLeafGroup(n)) { const cols = Math.ceil(ks.length / MAX_STACK); w = Math.max(NW, cols * NW + (cols - 1) * HG + 24); }
    else w = Math.max(NW, sum(ks, (k) => width(k, seen)) + HG * (ks.length - 1));
    return (memo[n.id] = w);
  }
  const pos = []; const edges = []; let maxY = 0;
  function place(n, x, y, seen = new Set()) {
    if (seen.has(n.id)) return; seen.add(n.id);
    const w = width(n); const nx = x + w / 2 - NW / 2; pos.push({ n, x: nx, y }); maxY = Math.max(maxY, y + NH);
    const ks = kids[n.id] || []; if (!ks.length) return;
    if (isLeafGroup(n)) {
      const cols = Math.ceil(ks.length / MAX_STACK); const gw = cols * NW + (cols - 1) * HG; const gx = x + (w - gw) / 2 + 12;
      ks.forEach((k, i) => {
        const c = Math.floor(i / MAX_STACK), r = i % MAX_STACK; const kx = gx + c * (NW + HG), ky = y + NH + VG + r * (NH + LEAF_GAP);
        pos.push({ n: k, x: kx, y: ky }); maxY = Math.max(maxY, ky + NH);
        edges.push(`M${nx + NW / 2},${y + NH} V${y + NH + VG / 2} H${kx - 8} V${ky + NH / 2} H${kx}`);
      });
      return;
    }
    let cx = x + (w - (sum(ks, (k) => width(k)) + HG * (ks.length - 1))) / 2;
    ks.forEach((k) => {
      const kw = width(k); const kx = cx + kw / 2;
      edges.push(`M${nx + NW / 2},${y + NH} V${y + NH + VG / 2} H${kx} V${y + NH + VG}`);
      place(k, cx, y + NH + VG, seen); cx += kw + HG;
    });
  }
  let x0 = 0; roots.forEach((r) => { place(r, x0, 0); x0 += width(r) + HG * 3; });
  const W = Math.max(NW, x0 - HG * 3), H = maxY;
  let svg = `<svg width="${W + 20}" height="${H + 20}" viewBox="-10 -10 ${W + 20} ${H + 20}" role="img" aria-label="Organisation chart">`;
  svg += edges.map((d) => `<path class="edge" d="${d}"/>`).join('');
  pos.forEach(({ n, x, y }) => {
    const st = n._removed ? 'removed' : n._added ? 'added' : (n._changed && n._changed.length) ? 'changed' : '';
    const d = deptName[n.departmentId];
    const title = n.title || '';
    const label = anonymise ? (title || 'Role') : (n.name || 'Unnamed');
    const sub = anonymise ? (d ? d.name : '') : title;
    const meta = [anonymise ? '' : (d ? d.name : ''), n.employmentType && n.employmentType !== 'Full-time' ? n.employmentType : '', showCost && num(n.annualCost) ? fmtMoney(num(n.annualCost)) : ''].filter(Boolean).join(' · ');
    const tip = [label, sub, meta, st === 'removed' ? 'Removed by: ' + (n._by || '') : '', st === 'added' ? 'New role: ' + (n._by || '') : '', st === 'changed' ? 'Changed (' + n._changed.join(', ') + ')' : ''].filter(Boolean).join(' · ');
    svg += `<g class="node ${st}" transform="translate(${x},${y})" data-tip="${esc(tip)}">`;
    svg += `<rect class="card" width="${NW}" height="${NH}" rx="8"/>`;
    svg += `<rect x="0" y="0" width="5" height="${NH}" rx="2" fill="${deptColor(departments, n.departmentId)}"/>`;
    svg += `<text class="n-name" x="14" y="21">${esc(trunc(label, 24))}</text>`;
    svg += `<text class="n-title" x="14" y="38">${esc(trunc(sub, 28))}</text>`;
    svg += `<text class="n-meta" x="14" y="54">${esc(trunc(meta, 32))}</text>`;
    if (st) {
      const txt = st === 'removed' ? '✕ REMOVED' : st === 'added' ? '+ NEW' : '~ CHANGED'; const bw = txt.length * 6 + 10;
      svg += `<g class="badge b-${st}" transform="translate(${NW - bw - 6},-8)"><rect width="${bw}" height="16" rx="8"/><text x="${bw / 2}" y="11.5" text-anchor="middle">${txt}</text></g>`;
    }
    svg += '</g>';
  });
  svg += '</svg>';
  return `<div class="org">${svg}</div>`;
}

function orgLegend(departments) {
  return `<div class="legend">${live(departments).map((d, i) => `<span><i style="background:${deptColor(departments, d.id)}"></i>${esc(d.name)}</span>`).join('')}
    <span><span class="chip st-added">+ New</span></span><span><span class="chip st-changed">~ Changed</span></span><span><span class="chip st-removed">✕ Removed</span></span></div>`;
}

/* ---- Swimlane process map ---- */
function swimlane(proc, people, tools, { anonymise = false, exec = true } = {}) {
  const steps = proc.steps || [];
  if (!steps.length) return '<p class="empty">This process has no steps yet. Add steps in Data → Processes, or paste them from Claude.</p>';
  const pById = byId(people), tById = byId(tools);
  const laneKey = (s) => s.automated && !s.actorId ? 'sys' : s.actorId ? 'p:' + s.actorId : s.actorLabel ? 'r:' + s.actorLabel : 'none';
  const lanes = [];
  steps.forEach((s) => { const k = laneKey(s); if (!lanes.find((l) => l.key === k)) lanes.push({ key: k, s }); });
  const laneInfo = (l) => {
    if (l.key === 'sys') return ['System / automation', ''];
    if (l.key === 'none') return ['Unassigned', ''];
    if (l.key.startsWith('r:')) return [l.s.actorLabel, 'role'];
    const p = pById[l.s.actorId];
    if (!p) return ['Unknown person', ''];
    return anonymise ? [p.title || 'Role', ''] : [p.name, p.title || ''];
  };
  const LW = 160, CW = 186, LH = 100, BW = 162, BH = 72, TOP = 34;
  const W = LW + steps.length * CW + 20, H = TOP + lanes.length * LH + 10;
  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Process map: ${esc(proc.name)}">`;
  svg += `<defs><marker id="arr-${esc(proc.id)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--faint)"/></marker></defs>`;
  svg += `<text class="io" x="${LW + 8}" y="20">▶ Input: ${esc(trunc(proc.inputs || steps[0].input || '—', 60))}</text>`;
  svg += `<text class="io" x="${W - 12}" y="20" text-anchor="end">Output: ${esc(trunc(proc.outputs || steps[steps.length - 1].output || '—', 60))} ■</text>`;
  lanes.forEach((l, i) => {
    const [a, b] = laneInfo(l);
    svg += `<rect class="band ${i % 2 ? 'alt' : ''}" x="0" y="${TOP + i * LH}" width="${W}" height="${LH}"/>`;
    svg += `<text class="lane-label" x="12" y="${TOP + i * LH + LH / 2 - 2}">${esc(trunc(a, 20))}</text>`;
    if (b) svg += `<text class="lane-sub" x="12" y="${TOP + i * LH + LH / 2 + 13}">${esc(trunc(b, 24))}</text>`;
  });
  const cpos = steps.map((s, i) => ({ x: LW + i * CW + (CW - BW) / 2, y: TOP + lanes.findIndex((l) => l.key === laneKey(s)) * LH + (LH - BH) / 2 }));
  steps.forEach((s, i) => {
    if (!i) return; const a = cpos[i - 1], b = cpos[i];
    const ghost = s._removed || steps[i - 1]._removed;
    const x1 = a.x + BW, y1 = a.y + BH / 2, x2 = b.x, y2 = b.y + BH / 2, mx = (x1 + x2) / 2;
    svg += `<path class="flow ${ghost ? 'ghost' : ''}" d="M${x1},${y1} H${mx} V${y2} H${x2 - 2}" marker-end="url(#arr-${esc(proc.id)})"/>`;
  });
  steps.forEach((s, i) => {
    const { x, y } = cpos[i];
    const st = s._removed ? 'removed' : s._added ? 'added' : (s._changed && s._changed.length) ? 'changed' : '';
    const t = tById[s.toolId];
    const lines = wrapText(s.name, 24, 2);
    const time = `${num(s.durationMins) ? num(s.durationMins) + ' min' : '—'} · ${s.automated ? 'automated' : 'manual'}`;
    const tip = [s.name, t ? 'Tool: ' + t.name : '', time, s.input ? 'In: ' + s.input : '', s.output ? 'Out: ' + s.output : '', exec && s.painPoint ? 'Pain: ' + s.painPoint : '', s._by ? 'Change: ' + s._by : ''].filter(Boolean).join(' · ');
    svg += `<g class="step ${s.automated ? 'auto' : 'manual'} ${st}" transform="translate(${x},${y})" data-tip="${esc(tip)}">`;
    svg += `<rect class="box" width="${BW}" height="${BH}" rx="8"/>`;
    svg += lines.map((ln, k) => `<text class="s-name" x="10" y="${18 + k * 14}">${esc(ln)}</text>`).join('');
    svg += `<text class="s-tool" x="10" y="${BH - 22}">${esc(trunc(t ? t.name : (s.toolLabel || 'No tool'), 26))}${t && t._removed ? ' (removed)' : ''}</text>`;
    svg += `<text class="s-time" x="10" y="${BH - 9}">${esc(time)}</text>`;
    if (exec && s.painPoint) svg += `<g class="pain" transform="translate(${BW - 4},4)"><circle r="8"/><text y="3.5" text-anchor="middle">!</text></g>`;
    if (st) svg += `<text x="${BW - 8}" y="${BH - 9}" text-anchor="end" style="font-size:9.5px;font-weight:800;fill:${st === 'removed' ? 'var(--crit-ink)' : st === 'added' ? 'var(--good-ink)' : 'var(--warn-ink)'}">${st === 'removed' ? '✕ REMOVED' : st === 'added' ? '+ NEW' : '~ CHANGED'}</text>`;
    svg += '</g>';
  });
  svg += '</svg>';
  return `<div class="lane">${svg}</div>`;
}
