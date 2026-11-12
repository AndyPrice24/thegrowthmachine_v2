/* ============================================================
   Where every figure comes from. Any item that states a number, a rand value or a time shows a numbered index of its
   sources; each entry opens the exact source in the source register (and, in the report, the appendix).
   Sources travel down the chain: a recommendation cites its own sources plus those of the findings it fixes; an
   automation cites its own, its recommendation's and those of any findings it names.
   ============================================================ */
const FIGURE_RE = /(\bR\s?\d|\d[\d\s,.]*\s?(%|k\b|m\b|h\b|hours?|days?|weeks?|months?|minutes?|locations?|clients?|stores?)|\b\d{2,}\b)/i;
/** Does this item state a figure (in its text or in its sized value)? */
function hasFigure(...parts) { return parts.some((p) => (typeof p === 'number' ? p > 0 : FIGURE_RE.test(String(p || '')))); }
function refKey(r) { return r.id + '|' + (r.part || ''); }
function dedupeRefs(list) { const seen = new Set(); return list.filter((r) => r && r.id && !seen.has(refKey(r)) && seen.add(refKey(r))); }
const ownRefs = (o) => (Array.isArray(o && o.sources) ? o.sources : []);
/** The sources behind an item, following the chain finding -> recommendation -> automation. */
function refsFor(e, kind, o) {
  if (!o) return [];
  if (kind === 'finding' || kind === 'opportunity' || kind === 'signal') return dedupeRefs(ownRefs(o));
  if (kind === 'recommendation') return dedupeRefs([...ownRefs(o), ...e.findings.filter((f) => f.fixId === o.id).flatMap(ownRefs)]);
  if (kind === 'automation') {
    const rec = o.recommendationId && e.recommendations.find((r) => r.id === o.recommendationId);
    const named = splitList(o.findingIds).map((id) => e.findings.find((f) => f.id === id)).filter(Boolean);
    return dedupeRefs([...ownRefs(o), ...(rec ? refsFor(e, 'recommendation', rec) : []), ...named.flatMap(ownRefs)]);
  }
  return [];
}
/** Does the item state a figure without any source behind it? */
function unsourced(e, kind, o) {
  const text = kind === 'recommendation' ? [o.title, o.description, num(o.otherAnnualSaving), num(o.revenueUplift), num(o.oneOffCost)]
    : kind === 'automation' ? [o.title, o.removes, o.description, num(o.valueMonthly), num(o.hoursMonthly)]
    : [o.title, o.evidence || o.description, num(o.valueMonthly)];
  return hasFigure(...text) && !refsFor(e, kind, o).length;
}
/** Studio: a numbered, clickable index. Each entry opens the source in the register. */
function citeBlock(e, kind, o, label = 'Where this comes from') {
  const refs = refsFor(e, kind, o);
  if (!refs.length) return unsourced(e, kind, o) ? `<p class="cite-none small"><span class="chip lo-nofix">No source yet</span> <span class="faint">This states a figure; add the source it came from.</span></p>` : '';
  return `<div class="cite small"><b>${esc(label)}</b><ol>${refs.map((r) => `<li>${r.side === 'says' ? '<span class="chip">documents say</span> ' : r.side === 'seen' ? '<span class="chip">evidence</span> ' : ''}<button class="link" data-action="goSrc" data-id="${esc(r.id)}" title="Open this source in the source register">${esc(sourceLine(e, r, !ui.share))}</button></li>`).join('')}</ol></div>`;
}
function goSrc(id) { if (PORTAL_ON) { PT.modal = 'src:' + id; return ptModalRender(); } ui.tab = 'data'; ui.all = Object.assign({}, ui.all, { sources: true }); saveUI(); render(); focusEl('src-' + id); }
/** How many items cite each source (for the register). */
function citeCounts(e) {
  const n = {};
  const add = (refs) => new Set(refs.map((r) => r.id)).forEach((id) => { n[id] = (n[id] || 0) + 1; });
  e.findings.forEach((f) => add(refsFor(e, 'finding', f)));
  e.recommendations.forEach((r) => add(ownRefs(r)));
  (e.automations || []).forEach((a) => add(ownRefs(a)));
  (e.opportunities || []).forEach((o) => add(ownRefs(o)));
  (e.feedback || []).forEach((f) => add(ownRefs(f)));
  return n;
}
/** Report: numbered citations across the whole report, with one appendix at the end. */
function makeCiter(e) {
  const order = []; const index = {};
  return {
    mark(refs) {
      if (!refs.length) return '';
      const marks = refs.map((r) => { if (!(r.id in index)) { order.push(r.id); index[r.id] = order.length; } return `<a href="#rs-${index[r.id]}" title="${esc(sourceLine(e, r, false))}">${index[r.id]}</a>`; });
      const parts = refs.filter((r) => r.part).map((r) => `[${index[r.id]}] ${r.part}`);
      return `<span class="rpt-cite"><sup>${[...new Set(marks)].join(', ')}</sup>${parts.length ? `<span class="rpt-cite-parts">${esc(parts.join(' · '))}</span>` : ''}</span>`;
    },
    appendix() {
      if (!order.length) return '';
      return `<section class="rpt-sec rpt-break"><h2>Where the figures come from</h2><p class="muted small">Each number in this report links to the source it was taken from: what it is, who supplied it, the date the information relates to, and when we received it.</p>
        <ol class="rpt-sources">${order.map((id, i) => `<li id="rs-${i + 1}">${esc(sourceLine(e, { id }, false))}</li>`).join('')}</ol></section>`;
    },
  };
}

/** Plan rows: the index folded away, or a flag when a figure has no source. */
function citeFold(e, kind, o) {
  const refs = refsFor(e, kind, o);
  if (!refs.length) return unsourced(e, kind, o) ? '<div class="small cite-none"><span class="chip lo-nofix">No source yet</span></div>' : '';
  return `<details class="small cite-fold"><summary>Based on ${refs.length} source${refs.length > 1 ? 's' : ''}</summary>${citeBlock(e, kind, o, '')}</details>`;
}
/** Items that state a figure with nothing behind it. */
function noSrcCount(e) {
  return e.findings.filter((f) => f.kind !== 'context' && unsourced(e, 'finding', f)).length
    + e.recommendations.filter((r) => r.status !== 'Rejected' && unsourced(e, 'recommendation', r)).length
    + (e.automations || []).filter((a) => !(ui.share && a.private) && unsourced(e, 'automation', a)).length;
}
