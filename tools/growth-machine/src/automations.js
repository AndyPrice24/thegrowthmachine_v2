/* ============================================================
   Automation opportunities: where work could run itself.
   First prize is automating inside the systems the client already uses or is moving to; AI where it does the job better.
   Record: { id, title, removes, system, usesExisting: 'Yes'|'No', approach: 'native'|'connect'|'ai', processId, findingIds,
             recommendationId, valueMonthly, hoursMonthly, basis, effort: 'Low'|'Medium'|'High', status, owner, nextStep,
             description, questions (feasibility checks: array or one per line), recommendationId (required: the fix it belongs to), private }
   ============================================================ */
const AUTO_APPROACH = { native: ['⚙', 'Built into a system they already use'], connect: ['⇄', 'Connect systems they already use'], ai: ['✦', 'AI'] };
const AUTO_STATUS = ['Idea', 'Proposed', 'Agreed', 'In progress', 'Live'];
const AUTO_STATUS_ORDER = ['In progress', 'Agreed', 'Proposed', 'Idea', 'Live'];
function autoKey(a) {
  return [a.usesExisting === 'No' ? 1 : 0, Math.max(0, AUTO_STATUS_ORDER.indexOf(a.status || 'Idea')), -(num(a.valueMonthly) || 0), -(num(a.hoursMonthly) || 0), Math.max(0, ['Low', 'Medium', 'High'].indexOf(a.effort || 'Medium'))];
}
function autoCmp(a, b) { const x = autoKey(a), y = autoKey(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1; return 0; }
/* Chain: finding (what's wrong) -> recommendation (the fix) -> automation (which parts of the fix run themselves, and how).
   Every automation names its recommendation; unlinked ones are flagged until they are attached. */
const autosFor = (e, recId) => (e.automations || []).filter((a) => a.recommendationId === recId && !(ui.share && a.private));
const unlinkedAutos = (e) => (e.automations || []).filter((a) => !a.recommendationId && !(ui.share && a.private));
/** Findings an automation helps solve: those whose fix is its recommendation, plus any it names itself. */
function autoFindings(e, a) {
  const ids = new Set(e.findings.filter((f) => a.recommendationId && f.fixId === a.recommendationId).map((f) => f.id));
  splitList(a.findingIds).forEach((id) => ids.add(id));
  return e.findings.filter((f) => ids.has(f.id));
}
/** Jump to a recommendation on Plan, or to an automation on Leaks & opportunities, and bring it into view. */
function focusEl(id) { setTimeout(() => { const el = document.getElementById(id); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600); } }, 60); }
function goRec(id) { ui.tab = 'plan'; ui.all = Object.assign({}, ui.all); ['Identified', 'Approved', 'In progress', 'Realised'].forEach((s) => { ui.all['plan_' + s] = true; }); saveUI(); render(); focusEl('rec-' + id); }
function goAuto(id) { ui.tab = 'home'; ui.auOpen = id; ui.all = Object.assign({}, ui.all, { auto: true }); saveUI(); render(); focusEl('au-' + id); }
/** Feasibility questions: an array, or one per line when typed in the data editor. */
function autoQs(a) { return (Array.isArray(a.questions) ? a.questions : String(a.questions || '').split('\n')).map((q) => String(q).trim()).filter(Boolean); }
function automationCard(e) {
  const all = (e.automations || []).filter((a) => !(ui.share && a.private));
  if (!all.length) return '';
  const list = all.slice().sort(autoCmp);
  const shown = topN('auto', list);
  const existing = list.filter((a) => a.usesExisting !== 'No').length;
  const sized = sum(list, (a) => num(a.valueMonthly));
  const hours = sum(list, (a) => num(a.hoursMonthly));
  const proc = (id) => (e.processes.find((p) => p.id === id) || {}).name || '';
  const val = (a) => num(a.valueMonthly) ? `<b>${fmtMoney(num(a.valueMonthly))}</b>/mo` : num(a.hoursMonthly) ? `<b>~${Math.round(num(a.hoursMonthly))} h</b>/mo` : '<span class="faint">Not sized</span>';
  const row = (a, i) => {
    const ap = AUTO_APPROACH[a.approach] || AUTO_APPROACH.native;
    const rec = a.recommendationId && e.recommendations.find((r) => r.id === a.recommendationId);
    const fs = autoFindings(e, a);
    return `<details class="au-row" id="au-${esc(a.id)}" ${ui.auOpen === a.id ? 'open' : ''}><summary class="au-main">
      <span class="au-rank">${i + 1}</span>
      <span class="au-ap au-${esc(a.approach || 'native')}" title="${esc(ap[1])}">${ap[0]}</span>
      <span class="au-title">${esc(a.title)}${a.usesExisting === 'No' ? ' <span class="chip">new tool</span>' : ''}${autoQs(a).length ? ` <span class="chip" title="Questions to answer before deciding">${autoQs(a).length} to check</span>` : ''}${rec ? '' : ' <span class="chip lo-nofix" title="Every automation should sit under a recommendation (the fix it belongs to)">No fix linked</span>'}<span class="au-sys">${esc(a.system || '')}</span></span>
      <span class="au-val">${val(a)}</span>
      <span class="au-st"><span class="chip au-s-${esc((a.status || 'Idea').toLowerCase().replace(/\s+/g, '-'))}">${esc(a.status || 'Idea')}</span> <span class="faint small">${esc(a.effort || 'Medium')} effort</span></span>
    </summary><div class="au-detail">
      <p class="au-chain">${rec ? `<b>Part of the fix:</b> <button class="link" data-action="goRec" data-id="${esc(rec.id)}">${esc(rec.title)} →</button> <span class="chip">${esc(rec.status || 'Identified')}</span>` : '<b>Part of the fix:</b> <span class="faint">not linked yet; set its recommendation in Sources &amp; data → Automation opportunities</span>'}</p>
      ${fs.length ? `<p class="au-chain"><b>Solves:</b> ${fs.slice(0, 3).map((f) => esc(trunc(f.title, 80))).join(' · ')}${fs.length > 3 ? ` <span class="faint">+${fs.length - 3} more</span>` : ''}</p>` : ''}
      ${a.removes ? `<p><b>Takes away:</b> ${esc(a.removes)}</p>` : ''}
      ${a.description ? `<p>${esc(a.description)}</p>` : ''}
      ${autoQs(a).length ? `<div class="au-qs"><b>To check first (does it work here?)</b><ol>${autoQs(a).map((q) => `<li>${esc(q)}</li>`).join('')}</ol></div>` : ''}
      ${a.nextStep ? `<p><b>Next step:</b> ${esc(a.nextStep)}</p>` : ''}
      <p class="faint small">${[ap[1], proc(a.processId) && 'Process: ' + proc(a.processId), a.owner && 'Owner: ' + a.owner, a.basis && 'Size: ' + a.basis].filter(Boolean).map(esc).join(' · ')}</p>
    </div></details>`;
  };
  return card('Automation opportunities', `
    <p class="small muted" style="margin:0 0 8px">Where work could run itself. First prize is the systems ${esc(e.client.name)} already uses or is moving to; AI where it does the job better. ${existing} of ${list.length} use current systems${sized ? ` · ${fmtMoney(sized)}/mo sized` : ''}${hours ? ` · ~${Math.round(hours)} hours a month` : ''}.</p>
    <div class="au-legend small faint">${Object.values(AUTO_APPROACH).map(([i, n]) => `<span>${i} ${esc(n)}</span>`).join('')}</div>
    <div class="au-head"><span>#</span><span></span><span>What could run itself</span><span>Worth</span><span>Status</span></div>
    ${shown.map(row).join('')}
    ${showAllBtn('auto', list.length)}`, { sub: 'Ranked: current systems first, then work already under way, then size. Click a row for the detail.' });
}
