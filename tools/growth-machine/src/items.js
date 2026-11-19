/* Items: one record per issue or change, moving along one stage path (the department-first board).
   An item owns its stage, departments, types, label and next step. It links to the records that hold the evidence:
   findings (what's wrong), recommendations (the fix), automations, opportunities and the key-change story.
   Step 1 of the department-first build: the data and a coverage check. Nothing here changes the other pages yet. */

const ITEM_DEPTS = [['lead', 'Leadership & direction'], ['sales', 'Sales'], ['cs', 'Client Success'], ['ops', 'Operations'],
  ['prod', 'Product & platform'], ['admin', 'Admin, finance & people']];
const ITEM_TYPES = [['proc', '⇄', 'Process'], ['auto', '⚙', 'Automation'], ['sys', '▦', 'Systems & tools'], ['data', '◉', 'Data'],
  ['people', '☺', 'People & capacity'], ['svc', '★', 'Service delivery'], ['change', '↻', 'Change management'], ['comm', 'R', 'Commercial']];
const ITEM_STAGES = [['found', 'Found'], ['investigating', 'Investigating'], ['proposed', 'Proposed'], ['approved', 'Approved'],
  ['underway', 'Under way'], ['live', 'Live'], ['parked', 'Parked']];
const ITEM_LABELS = ['', 'leak', 'opportunity', 'weakness'];
const ITEM_DEPT_NAME = Object.fromEntries(ITEM_DEPTS);
const ITEM_STAGE_NAME = Object.fromEntries(ITEM_STAGES);

/** Every record an item stands for. Findings, automations and opportunities follow their recommendation, so a new
    finding linked to a recommendation lands in that recommendation's item without editing the item. */
function itemLinks(e, it) {
  const recs = new Set(splitList(it.recIds));
  const f = new Set(splitList(it.findingIds)), a = new Set(splitList(it.automationIds)), o = new Set(splitList(it.opportunityIds));
  live(e.findings).forEach((x) => { if (x.fixId && recs.has(x.fixId)) f.add(x.id); });
  live(e.automations).forEach((x) => { if (x.recommendationId && recs.has(x.recommendationId)) a.add(x.id); });
  live(e.opportunities).forEach((x) => { if (x.recommendationId && recs.has(x.recommendationId)) o.add(x.id); });
  return { findings: f, recommendations: recs, automations: a, opportunities: o, moves: new Set(it.moveId ? [it.moveId] : []) };
}

const ITEM_COVER = [['findings', 'Findings'], ['recommendations', 'Recommendations'], ['automations', 'Automations'], ['opportunities', 'Opportunities'], ['moves', 'Key changes']];

/** Which records sit in no item, or in more than one; broken links; fields out of range. */
function itemCoverage(e) {
  const items = live(e.items || []);
  const where = {}; ITEM_COVER.forEach(([c]) => { where[c] = {}; });
  const broken = [], invalid = [];
  items.forEach((it) => {
    const L = itemLinks(e, it);
    ITEM_COVER.forEach(([c]) => L[c].forEach((id) => {
      if (!live(e[c]).some((x) => x.id === id)) broken.push({ item: it, coll: c, id });
      (where[c][id] = where[c][id] || []).push(it.id);
    }));
    const bad = [];
    const ds = splitList(it.depts); if (!ds.length || ds.some((d) => !ITEM_DEPT_NAME[d])) bad.push('departments');
    const ts = splitList(it.types); if (!ts.length || ts.some((t) => !ITEM_TYPES.some((x) => x[0] === t))) bad.push('types');
    if (!ITEM_STAGE_NAME[it.stage]) bad.push('stage');
    if (!ITEM_LABELS.includes(it.label || '')) bad.push('label');
    if (!it.title) bad.push('title');
    if (bad.length) invalid.push({ item: it, bad });
  });
  const rows = ITEM_COVER.map(([c, name]) => {
    const all = live(e[c]);
    const context = c === 'findings' ? all.filter((x) => x.kind === 'context') : [];
    const ctxIds = new Set(context.map((x) => x.id));
    const missing = all.filter((x) => !where[c][x.id] && !ctxIds.has(x.id));
    const dup = all.filter((x) => (where[c][x.id] || []).length > 1);
    return { c, name, total: all.length, inItem: all.filter((x) => where[c][x.id]).length, context: context.filter((x) => !where[c][x.id]).length, missing, dup };
  });
  const ok = rows.every((r) => !r.missing.length && !r.dup.length) && !broken.length && !invalid.length;
  return { items, rows, broken, invalid, where, ok };
}

/** Sources & data → the coverage check. Shown only once items exist. */
function itemsCheckCard(e) {
  const C = itemCoverage(e);
  if (!C.items.length) return '';
  const label = (c, id) => { const x = live(e[c]).find((y) => y.id === id); return x ? esc(x.title || x.name || id) : esc(id); };
  const stageN = ITEM_STAGES.map(([k, n]) => [n, C.items.filter((i) => i.stage === k).length]).filter(([, v]) => v);
  const deptN = ITEM_DEPTS.map(([k, n]) => [n, C.items.filter((i) => splitList(i.depts).includes(k)).length]);
  const chips = (arr) => arr.map(([n, v]) => `<span class="chip">${esc(n)} <b>${v}</b></span>`).join(' ');
  const table = `<table class="tbl"><thead><tr><th>Records</th><th>Total</th><th>In an item</th><th>Context only</th><th>In no item</th><th>In two or more</th></tr></thead><tbody>
    ${C.rows.map((r) => `<tr><td>${r.name}</td><td>${r.total}</td><td>${r.inItem}</td><td>${r.context || ''}</td><td>${r.missing.length ? `<b style="color:#c8221c">${r.missing.length}</b>` : '0'}</td><td>${r.dup.length ? `<b style="color:#c8221c">${r.dup.length}</b>` : '0'}</td></tr>`).join('')}</tbody></table>`;
  const probs = [
    ...C.rows.flatMap((r) => r.missing.map((x) => `In no item: ${r.name.toLowerCase()} <code>${esc(x.id)}</code> ${esc(x.title || x.name || '')}`)),
    ...C.rows.flatMap((r) => r.dup.map((x) => `In ${C.where[r.c][x.id].length} items (${C.where[r.c][x.id].map(esc).join(', ')}): <code>${esc(x.id)}</code> ${esc(x.title || '')}`)),
    ...C.broken.map((b) => `Item <code>${esc(b.item.id)}</code> links to ${b.coll} <code>${esc(b.id)}</code>, which doesn't exist`),
    ...C.invalid.map((v) => `Item <code>${esc(v.item.id)}</code>: check ${v.bad.join(', ')}`)];
  const list = C.items.slice().sort((a, b) => num(a.order) - num(b.order)).map((it) => {
    const L = itemLinks(e, it);
    return `<tr><td><b>${esc(it.title)}</b>${String(it.pinned) === 'true' ? ' <span class="chip">Pinned</span>' : ''}${String(it.portal) === 'false' ? ' <span class="chip">TGM only</span>' : ''}<div class="faint small">${esc(it.line || '')}</div></td>
      <td class="small">${splitList(it.depts).map((d) => esc(ITEM_DEPT_NAME[d] || d)).join('<br>')}</td>
      <td class="small">${splitList(it.types).map((t) => { const x = ITEM_TYPES.find((y) => y[0] === t); return x ? `${x[1]} ${x[2]}` : esc(t); }).join('<br>')}</td>
      <td class="small">${esc(it.label || '')}</td><td class="small nowrap">${esc(ITEM_STAGE_NAME[it.stage] || it.stage)}</td>
      <td class="small faint">${[...L.recommendations].map((id) => label('recommendations', id)).join('; ')}${L.moves.size ? `<div>Key change: ${label('moves', it.moveId)}</div>` : ''}<div>${L.findings.size} findings · ${L.automations.size} automations · ${L.opportunities.size} opportunities</div></td></tr>`;
  }).join('');
  return card(`Items: one record per issue or change (${C.items.length})`, `
    <p>${C.ok ? '<span class="chip st-added">✓ Every finding, recommendation, automation, opportunity and key change sits in exactly one item.</span>' : `<span class="chip sev-high">${probs.length} to fix</span>`}</p>
    <p class="small">${chips(stageN)}</p><p class="small">${chips(deptN)}</p>
    ${table}
    ${probs.length ? `<ul class="small">${probs.slice(0, 60).map((p) => `<li>${p}</li>`).join('')}</ul>` : ''}
    <details ${ui.itemsOpen ? 'open' : ''}><summary class="small"><b>All items</b></summary><div class="scroll-x"><table class="tbl"><thead><tr><th>Item</th><th>Departments</th><th>Types</th><th>Label</th><th>Stage</th><th>Behind it</th></tr></thead><tbody>${list}</tbody></table></div></details>`,
  { sub: 'Context findings don\'t need an item. Findings, automations and opportunities follow their recommendation into its item.' });
}
