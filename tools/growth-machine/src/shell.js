/* The Studio's shell (graphite): the left menu and shared helpers. Home, the board, departments, My days and Waiting on
   live in home.js. The earlier layout ("Classic view") and its pages were removed in the clean-up (step 10, 24 Nov). */

const SHELL_TABS = ['hub'];
const shellOn = () => !PORTAL_ON;
const DEPT_ICON = { lead: '◆', sales: '↗', cs: '♥', ops: '⚙︎', prod: '▣', admin: '▤' };
const STAGE_FLOW = ITEM_STAGES.filter(([k]) => k !== 'parked');
const shellItems = (e) => live(e.items || []).filter((i) => !(ui.share && String(i.portal) === 'false')).sort((a, b) => num(a.order) - num(b.order));
const deptItems = (e, k) => shellItems(e).filter((i) => splitList(i.depts).includes(k));
const typeIcon = (t) => { const x = ITEM_TYPES.find((y) => y[0] === t); return x ? `<span class="gs-ty" title="${esc(x[2])}">${x[1]}</span>` : ''; };
const LABEL_TXT = { leak: 'Leak', opportunity: 'Opportunity', weakness: 'Weakness' };
const longDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const dayMon = (iso) => { const d = new Date(iso + 'T00:00:00'); return [d.getDate(), d.toLocaleString('en-GB', { month: 'short' })]; };

function gsRing(pct, centre, sub, { size = 78, w = 9, hot = false } = {}) {
  const r = (size - w) / 2, c = size / 2, C = 2 * Math.PI * r, id = 'gr' + Math.random().toString(36).slice(2, 8);
  return `<svg class="gs-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(centre)} ${esc(sub)}">
    <defs><linearGradient id="${id}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#35c2e0"/><stop offset="1" stop-color="#ff6a4d"/></linearGradient></defs>
    <circle cx="${c}" cy="${c}" r="${r}" stroke="rgba(0,0,0,.45)" stroke-width="${w + 4}" fill="none"/><circle cx="${c}" cy="${c}" r="${r}" stroke="rgba(255,255,255,.06)" stroke-width="${w}" fill="none"/>
    <circle cx="${c}" cy="${c}" r="${r}" stroke="${hot ? '#ff6a4d' : `url(#${id})`}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-dasharray="${(C * Math.min(Math.max(pct, .02), 1)).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${c} ${c})"/>
    <text x="${c}" y="${c + (sub ? 2 : 6)}" text-anchor="middle" font-size="${String(centre).length > 3 ? size / 5 : size / 4.2}" font-weight="600" fill="currentColor">${esc(centre)}</text>
    ${sub ? `<text x="${c}" y="${c + size / 5.6}" text-anchor="middle" font-size="${size / 9.5}" class="gs-ring-sub">${esc(sub)}</text>` : ''}</svg>`;
}

/* ---------- left menu ---------- */
function railHTML(e) {
  const engOpts = Object.values(db.engagements).map((x) => `<option value="${x.id}" ${x.id === db.activeId ? 'selected' : ''}>${esc(x.client.name)}</option>`).join('');
  const scOpts = [['current', 'Current state'], ...e.scenarios.map((s) => [s.id, s.name]), ['all', 'All recommendations']].map(([id, n]) => `<option value="${id}" ${ui.scenario === id ? 'selected' : ''}>${esc(n)}</option>`).join('');
  const sub = (t) => (ui.sub || {})[t];
  const b = (o, t, attrs, on, c) => `<button class="gs-rl ${on ? 'on' : ''}" ${attrs}><span class="o">${o}</span><span class="t">${t}</span>${c !== undefined ? `<span class="c">${c}</span>` : ''}</button>`;
  const its = shellItems(e);
  const st = e.engagement.phases.length ? engagementStatus(e) : null;
  const initials = (e.client.name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return `<div class="gs-brand"><b></b><span>The Growth Machine</span></div>
    <label class="gs-client"><span class="lg">${esc(initials)}</span><span class="cn"><select id="engSel" aria-label="Client">${engOpts}</select><span class="s">${st ? `Week ${Math.max(1, Math.ceil(st.elapsed / 7))} of ${Math.max(1, Math.round(st.termDays / 7))}` : 'Client'}</span></span><span class="dd">▾</span></label>
    ${SCENARIO_TABS.includes(ui.tab) || ui.scenario !== 'current' ? `<label class="gs-scn"><span>View as</span><select id="scSel">${scOpts}</select></label>` : ''}
    ${(() => { const hv = ui.tab === 'hub' ? HX[HX.length - 1] : { v: '', p: {} }; return `${b('⌂', 'Home', 'data-hx="home" data-hxreset="1"', ui.tab === 'hub' && hv.v === 'home')}${b('▦', 'Board', `data-hx="board" data-hxreset="1" data-hp='{}'`, ui.tab === 'hub' && hv.v === 'board' && !hv.p.d, its.filter((i) => i.stage !== 'parked').length)}
    <div class="gs-h">Departments</div>
    ${ITEM_DEPTS.map(([k, n]) => b(`<i style="--c:var(--gd-${k})"></i>`, esc(n), `data-hx="dept" data-hxreset="1" data-hp='{"d":"${k}"}'`, ui.tab === 'hub' && hv.v === 'dept' && hv.p.d === k, its.filter((i) => splitList(i.depts).includes(k)).length)).join('')}`; })()}
    <div class="gs-h">Whole business</div>
    ${b('⇄', 'How work flows', 'data-action="tab" data-id="processes"', ui.tab === 'processes')}
    ${b('◔', 'Insights &amp; value', 'data-action="tab" data-id="evidence"', ui.tab === 'evidence')}
    <div class="gs-h">Our engagement</div>
    ${(() => { const hv = ui.tab === 'hub' ? HX[HX.length - 1] : { v: '' }; return b('◷', 'My days', 'data-hx="days" data-hxreset="1"', hv.v === 'days') + b('⇆', 'Waiting on', 'data-hx="people" data-hxreset="1"', hv.v === 'people' || hv.v === 'person', (e.engagement.requests || []).filter((r) => !r.receivedDate && !['Received', 'Not needed', 'Not available'].includes(r.status)).length); })()}
    ${b('◷', 'Our work', 'data-action="tab" data-id="progress" data-sub="progress"', ui.tab === 'progress' && sub('progress') !== 'report')}
    ${b('☺︎', 'Conversations', 'data-action="tab" data-id="talk"', ui.tab === 'talk')}
    ${b('▤', 'Reports', 'data-action="tab" data-id="progress" data-sub="report"', ui.tab === 'progress' && sub('progress') === 'report')}
    ${b('◎', 'Sources &amp; data', 'data-action="tab" data-id="data"', ui.tab === 'data')}
    <div class="gs-foot">
      ${syncSupported() && (syncState.handle || syncState.name) ? b('⟳', 'Updates', 'data-action="syncCheck"', false) : ''}
      ${b('◐', ui.share ? 'Screen share on' : 'Screen share', 'data-action="share" title="Names become roles; TGM-only notes and items are hidden"', ui.share)}
      ${b('⤓', 'Back up', 'data-action="exportJSON"', false)}
      ${b('+', 'New client', 'data-action="newEng"', false)}
      ${b(ui.hxMini ? '⇥' : '⇤', ui.hxMini ? 'Expand menu' : 'Collapse menu', 'data-hxrail="1"', false)}
      <div class="gs-meta"><div id="status">Saved in this browser</div><div>Last backup: ${e.meta.lastExported ? new Date(e.meta.lastExported).toLocaleString('en-GB') : 'never'}</div><div>Studio ${typeof STUDIO_BUILD === 'undefined' ? 'dev' : STUDIO_BUILD}</div></div>
    </div>`;
}
