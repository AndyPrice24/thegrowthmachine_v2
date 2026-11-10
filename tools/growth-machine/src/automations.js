/* ============================================================
   Automation opportunities: where work could run itself.
   First prize is automating inside the systems the client already uses or is moving to; AI where it does the job better.
   Record: { id, title, removes, system, usesExisting: 'Yes'|'No', approach: 'native'|'connect'|'ai', processId, findingIds,
             recommendationId, valueMonthly, hoursMonthly, basis, effort: 'Low'|'Medium'|'High', status, owner, nextStep,
             description, questions (feasibility checks: array or one per line), private }
   ============================================================ */
const AUTO_APPROACH = { native: ['⚙', 'Built into a system they already use'], connect: ['⇄', 'Connect systems they already use'], ai: ['✦', 'AI'] };
const AUTO_STATUS = ['Idea', 'Proposed', 'Agreed', 'In progress', 'Live'];
const AUTO_STATUS_ORDER = ['In progress', 'Agreed', 'Proposed', 'Idea', 'Live'];
function autoKey(a) {
  return [a.usesExisting === 'No' ? 1 : 0, Math.max(0, AUTO_STATUS_ORDER.indexOf(a.status || 'Idea')), -(num(a.valueMonthly) || 0), -(num(a.hoursMonthly) || 0), Math.max(0, ['Low', 'Medium', 'High'].indexOf(a.effort || 'Medium'))];
}
function autoCmp(a, b) { const x = autoKey(a), y = autoKey(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1; return 0; }
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
    return `<details class="au-row"><summary class="au-main">
      <span class="au-rank">${i + 1}</span>
      <span class="au-ap au-${esc(a.approach || 'native')}" title="${esc(ap[1])}">${ap[0]}</span>
      <span class="au-title">${esc(a.title)}${a.usesExisting === 'No' ? ' <span class="chip">new tool</span>' : ''}${autoQs(a).length ? ` <span class="chip" title="Questions to answer before deciding">${autoQs(a).length} to check</span>` : ''}<span class="au-sys">${esc(a.system || '')}</span></span>
      <span class="au-val">${val(a)}</span>
      <span class="au-st"><span class="chip au-s-${esc((a.status || 'Idea').toLowerCase().replace(/\s+/g, '-'))}">${esc(a.status || 'Idea')}</span> <span class="faint small">${esc(a.effort || 'Medium')} effort</span></span>
    </summary><div class="au-detail">
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
