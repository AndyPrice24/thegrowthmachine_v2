/* ============================================================
   Big moves: the few changes with the biggest knock-on effect, told as stories (before, what changed, impact, next),
   grouped in four buckets. They lead the founder portal's Overview and the Studio's Big moves page; the findings,
   recommendations and automations behind each move are its evidence, one click down.
   Record (collection "moves"): id, order, bucket, title, pinned, stage, stageNotes {aligned: '12 Nov', ...}, why, before,
   now, nowLabel, impact, impactTbc, impacts [{label, value, tbc}], timeline [{date, text, next}], next, nextDate,
   links [ids], sources, portal (false = TGM only), private (TGM only), days (TGM only).
   ============================================================ */
const MV_BUCKETS = {
  friction: { label: 'Remove friction', sub: 'Frustration costing time and goodwill', c: 'var(--mv-fr)', soft: 'var(--mv-fr-soft)' },
  light: { label: 'Bring light', sub: 'Areas nobody could see into', c: 'var(--mv-li)', soft: 'var(--mv-li-soft)' },
  empower: { label: 'Unblock & empower', sub: 'Stalled projects and people', c: 'var(--mv-em)', soft: 'var(--mv-em-soft)' },
  leaks: { label: 'Stop the leaks', sub: 'Money and risk going out', c: 'var(--mv-lk)', soft: 'var(--mv-lk-soft)' }
};
const MV_STAGES = [['aligned', 'Agreed'], ['unblocked', 'Under way'], ['live', 'Live'], ['measured', 'Measured']];
const mvB = (m) => MV_BUCKETS[m.bucket] || MV_BUCKETS.friction;
const mvOn = (v) => v === true || v === 'true';
function mvList(e, { portal = false } = {}) {
  return live(e.moves).filter((m) => m.title && (!portal || String(m.portal) !== 'false'))
    .sort((a, b) => (mvOn(b.pinned) - mvOn(a.pinned)) || num(a.order) - num(b.order));
}
const mvVars = (m) => `--c:${mvB(m).c};--soft:${mvB(m).soft}`;
function mvTrack(m, { notes = false } = {}) {
  const cur = m.stage === 'done' ? MV_STAGES.length : Math.max(0, MV_STAGES.findIndex(([k]) => k === m.stage));
  const sn = (m.stageNotes && typeof m.stageNotes === 'object') ? m.stageNotes : {};
  return `<div class="mv-track" aria-label="Stage: ${esc(m.stage === 'done' ? 'measured' : m.stage || 'aligned')}">${MV_STAGES.map(([k, l], i) =>
    `<span class="${i < cur ? 'done' : i === cur ? 'now' : ''}">${esc(l)}${notes && sn[k] ? ` · ${esc(sn[k])}` : ''}</span>`).join('')}</div>`;
}
const mvTbc = (t) => (t ? `<span class="mv-tbc">${esc(t === true || t === 'true' ? 'to confirm' : t)}</span>` : '');
function mvCounts(e, m) {
  const ids = splitList(m.links); const n = { f: 0, r: 0, a: 0, o: 0 };
  ids.forEach((id) => { if (e.findings.some((x) => x.id === id)) n.f++; else if (e.recommendations.some((x) => x.id === id)) n.r++; else if ((e.automations || []).some((x) => x.id === id)) n.a++; else if ((e.opportunities || []).some((x) => x.id === id)) n.o++; });
  const p = (k, s, pl) => (n[k] ? `${n[k]} ${n[k] === 1 ? s : pl}` : '');
  return [p('f', 'finding', 'findings'), p('r', 'rec', 'recs'), p('a', 'automation', 'automations'), p('o', 'opportunity', 'opportunities')].filter(Boolean).join(' · ');
}
/** One move as a card. open: the attribute string that opens it; acts: flag/comment buttons; extra: Studio-only lines. */
function mvCard(e, m, { open = '', acts = '', extra = '' } = {}) {
  const b = mvB(m);
  return `<article class="mv-card ${mvOn(m.pinned) ? 'pinned' : ''}" style="${mvVars(m)}" id="mv-${esc(m.id)}">
    <div class="mv-top"><span class="mv-bucket">${esc(b.label)}</span>${mvOn(m.pinned) ? '<span class="mv-pin">★ Founder priority</span>' : ''}${acts}</div>
    <h3 class="mv-h"><button type="button" class="mv-open" ${open}>${esc(m.title)}</button></h3>
    ${mvTrack(m)}
    <div class="mv-ba"><div><b>Before</b>${esc(m.before || '')}</div><div class="after"><b>${esc(m.nowLabel || 'Now')}</b>${esc(m.now || '')}</div></div>
    ${extra}
    <div class="mv-foot"><span class="mv-impact">${esc(m.impact || '')}${mvTbc(m.impactTbc)}</span><span>${m.next ? `Next: ${esc(m.next)}${m.nextDate ? ' · ' + esc(m.nextDate) : ''}` : ''}</span></div>
  </article>`;
}
/** Bucket tiles with counts (and a lead tile, e.g. savings identified). */
function mvHero(moves, lead = '') {
  return `<div class="mv-hero">${lead}${Object.entries(MV_BUCKETS).map(([k, b]) => { const n = moves.filter((m) => (m.bucket || 'friction') === k).length;
    return `<div class="mv-tile" style="--c:${b.c}"><div class="k">${esc(b.label)}</div><div class="v">${n} change${n === 1 ? '' : 's'}</div><div class="s">${esc(b.sub)}</div></div>`; }).join('')}</div>`;
}
/** Bucket filter chips; attr(k) returns the attribute string for a chip. */
function mvFilters(moves, cur, attr) {
  return `<div class="mv-filters"><button type="button" class="mv-chip ${!cur ? 'on' : ''}" ${attr('')}>All ${moves.length}</button>${Object.entries(MV_BUCKETS).filter(([k]) => moves.some((m) => (m.bucket || 'friction') === k))
    .map(([k, b]) => `<button type="button" class="mv-chip ${cur === k ? 'on' : ''}" style="--c:${b.c}" ${attr(k)}><i></i>${esc(b.label.split(' ').slice(-1)[0].replace(/^./, (c) => c.toUpperCase()))}</button>`).join('')}</div>`;
}
function mvLinkRows(e, m) {
  return splitList(m.links).map((id) => {
    const f = e.findings.find((x) => x.id === id); if (f) return { t: f.title, k: 'Finding', s: (f.sources || []).length ? `${f.sources.length} source${f.sources.length > 1 ? 's' : ''}` : '' };
    const r = e.recommendations.find((x) => x.id === id); if (r) return { t: r.title, k: 'Recommendation', s: r.status || '' };
    const a = (e.automations || []).find((x) => x.id === id); if (a) return { t: a.title, k: 'Automation', s: a.status || '' };
    const o = (e.opportunities || []).find((x) => x.id === id); if (o) return { t: o.title, k: 'Opportunity', s: o.status || '' };
    return null;
  }).filter(Boolean);
}
/** One move, opened. back: the back button; acts: flag/comment; side: extra boxes (discussion, private note). */
function mvDetail(e, m, { back = '', acts = '', side = '' } = {}) {
  const tl = Array.isArray(m.timeline) ? m.timeline : [];
  const imp = Array.isArray(m.impacts) ? m.impacts : [];
  const links = mvLinkRows(e, m);
  return `<div class="mv-detail" style="${mvVars(m)}">${back}
    <div class="mv-dhead"><div class="mv-top"><span class="mv-bucket">${esc(mvB(m).label)}</span>${mvOn(m.pinned) ? '<span class="mv-pin">★ Founder priority</span>' : ''}${acts}</div>
      <h1 class="mv-dh">${esc(m.title)}</h1>${m.why ? `<p class="mv-why"><b>Why it matters:</b> ${esc(m.why)}</p>` : ''}
      <div class="mv-dtrack">${mvTrack(m, { notes: true })}</div></div>
    <div class="mv-dgrid">
      <div class="mv-box"><h3>What has happened</h3>${tl.length ? `<ul class="mv-tl">${m.before ? `<li class="mv-pre"><span class="dt">Before</span><span class="dot"></span><span class="tx">${esc(m.before)}</span></li>` : ''}${tl.map((t) =>
        `<li class="${mvOn(t.next) ? 'nx' : ''}"><span class="dt">${esc(t.date || '')}</span><span class="dot"></span><span class="tx">${esc(t.text || '')}</span></li>`).join('')}</ul>`
        : `<div class="mv-ba"><div><b>Before</b>${esc(m.before || '')}</div><div class="after"><b>${esc(m.nowLabel || 'Now')}</b>${esc(m.now || '')}</div></div>`}</div>
      <div class="mv-side">
        <div class="mv-box"><h3>Impact</h3><div class="mv-kv">${(imp.length ? imp : [{ label: 'Impact', value: m.impact, tbc: m.impactTbc }]).map((r) =>
          `<div class="row"><span>${esc(r.label || '')}</span><span>${esc(r.value || '')}${mvTbc(r.tbc)}</span></div>`).join('')}
          ${m.next ? `<div class="row"><span>Next</span><span>${esc(m.next)}${m.nextDate ? ' · ' + esc(m.nextDate) : ''}</span></div>` : ''}</div></div>
        ${links.length ? `<div class="mv-box"><h3>Behind this move</h3><div class="mv-links">${links.map((l) => `<div><span>${esc(l.t)}</span><small>${esc(l.k)}${l.s ? ' · ' + esc(l.s) : ''}</small></div>`).join('')}</div></div>` : ''}
        ${side}
      </div>
    </div></div>`;
}

/* ---------- Studio ---------- */
function viewMoves(e) {
  const founders = !!ui.mvFounder || ui.share;
  const all = mvList(e, { portal: founders });
  const m = ui.moveId && all.find((x) => x.id === ui.moveId);
  if (m) {
    const priv = !founders && (m.private || m.days) ? `<div class="mv-box mv-private"><h3>TGM only</h3>${m.private ? `<p>${esc(m.private)}</p>` : ''}<p class="muted small">Our time: ${num(m.days) ? `<b>${num(m.days)} day${num(m.days) === 1 ? '' : 's'}</b>` : 'not logged yet'}</p></div>` : '';
    return mvDetail(e, m, { back: '<button class="link mv-back" data-action="mvOpen" data-id="">← All key changes</button>', side: priv + (refsFor(e, 'finding', m).length ? `<details class="mv-box ed-src"><summary>Sources (${refsFor(e, 'finding', m).length})</summary>${citeBlock(e, 'finding', m, '')}</details>` : '') });
  }
  const list = all.filter((x) => !ui.mvBucket || (x.bucket || 'friction') === ui.mvBucket);
  const sv = savingsTracker(e);
  const lead = `<div class="mv-tile mv-lead"><div class="k">Savings identified</div><div class="v">${esc(fmtShort(sv.identified))}<small> / mo</small></div><div class="s">against ${esc(fmtShort(sv.target))} / mo target · ${esc(fmtShort(sv.approved))} approved</div></div>`;
  const head = `<div class="page-h mv-page-h"><div><span class="eyebrow">Key changes${founders ? '' : ' · TGM view'}</span><h1>What's changing, and where it stands</h1><p class="muted">Each change: before, what has happened, the effect and what's next, with the findings, recommendations and automations behind it.</p></div>
    ${ui.share ? '' : `<div class="mv-seg"><button class="mv-seg-b ${founders ? '' : 'on'}" data-action="mvView" data-id="ours">Our view</button><button class="mv-seg-b ${founders ? 'on' : ''}" data-action="mvView" data-id="founders">As founders see it</button></div>`}</div>`;
  if (!all.length) return head + card('Key changes', empty('No moves yet. They arrive in an update file (collection "moves") or can be added in Sources & data.'));
  const extra = (x) => (founders ? '' : `${x.private ? `<div class="mv-private-line"><b>Private</b>${esc(x.private)}</div>` : ''}<div class="mv-meta">Our time: ${num(x.days) ? `<b>${num(x.days)} day${num(x.days) === 1 ? '' : 's'}</b>` : '<span class="mv-tbc">log it</span>'}${mvCounts(e, x) ? ' · ' + esc(mvCounts(e, x)) : ''}${String(x.portal) === 'false' ? ' · <span class="chip">TGM only</span>' : ''}</div>`);
  return head + mvHero(all, lead) + `<div class="mv-sh"><h2>The key changes</h2>${mvFilters(all, ui.mvBucket || '', (k) => `data-action="mvBucket" data-id="${k}"`)}</div>
    <div class="mv-grid">${list.map((x) => mvCard(e, x, { open: `data-action="mvOpen" data-id="${esc(x.id)}"`, extra: extra(x) })).join('')}</div>
    ${card('The journey so far', journeyHTML(e, { portal: founders, open: (m) => `data-action="mvOpen" data-id="${esc(m.id)}"` }), { sub: 'What has happened, by week; what comes next; and the projects starting next.' })}
    <div class="mv-evid"><span><b>Behind these changes:</b> ${live(e.findings).length} findings, ${live(e.recommendations).length} recommendations and ${live(e.automations).length} automations, each with its sources.</span><button class="link" data-action="tab" data-id="home">Open Leaks &amp; opportunities →</button></div>`;
}

/* ---------- The journey: what has happened (by week), what's coming, and projects starting next ----------
   Built from each move's dated timeline plus engagement.milestones [{ id, date (ISO), title, detail }]. Move dates are
   free text ('12 Nov', 'By 13 Nov', '24/25 Nov', 'Mid-Dec', 'Late Nov', 'Next'); undated ones are listed as coming up. */
const MV_MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
function mvDate(e, s) {
  const t = String(s || '').toLowerCase(); const st = (e.engagement && e.engagement.start) || todayISO(); const y0 = +st.slice(0, 4), m0 = +st.slice(5, 7) - 1;
  const iso = (d, mi) => { const y = mi >= m0 ? y0 : y0 + 1; return `${y}-${String(mi + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`; };
  let m = t.match(/(\d{1,2})(?:\s*[\/–-]\s*\d{1,2})?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/); if (m) return iso(+m[1], MV_MON[m[2]]);
  m = t.match(/(early|mid|late)[\s-]*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/); if (m) return iso(m[1] === 'early' ? 5 : m[1] === 'mid' ? 15 : 25, MV_MON[m[2]]);
  return null;
}
function journey(e, { portal = false } = {}) {
  const today = todayISO(); const moves = mvList(e, { portal }); const past = [], next = [];
  moves.forEach((m) => (Array.isArray(m.timeline) ? m.timeline : []).forEach((t, i) => {
    const d = mvDate(e, t.date); const item = { key: m.id + ':' + i, date: d, label: t.date, text: t.text, move: m };
    if (mvOn(t.next) || !d || d > today) next.push(item); else past.push(item);
  }));
  live((e.engagement || {}).milestones).forEach((x) => { const item = { key: x.id, date: x.date, label: x.date ? fmtD(x.date, { day: 'numeric', month: 'short' }) : '', text: x.title + (x.detail ? ': ' + x.detail : ''), move: null, milestone: true };
    if (x.date && x.date <= today) past.push(item); else next.push(item); });
  past.sort((a, b) => (a.date || '').localeCompare(b.date || '') || (a.milestone ? -1 : 0));
  next.sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  const projects = moves.filter((m) => m.nowLabel && m.nowLabel !== 'Now');
  return { past, next, projects, moves };
}
/** open(m) returns the attribute string that opens a move (portal or Studio). */
function journeyHTML(e, { portal = false, open = () => '', latest = 0 } = {}) {
  const J = journey(e, { portal }); const g = e.engagement || {};
  const chip = (it) => (it.move ? `<button type="button" class="jr-chip" style="--c:${mvB(it.move).c}" ${open(it.move)}><i></i>${esc(trunc(it.move.title, 46))}</button>` : '<span class="jr-chip jr-ms"><i></i>Engagement milestone</span>');
  const row = (it) => `<li class="jr-it ${it.milestone ? 'ms' : ''}" style="--c:${it.move ? mvB(it.move).c : 'var(--ink)'}"><span class="jr-d">${esc(it.label || '')}</span><span class="jr-dot"></span><div class="jr-t"><p>${esc(it.text)}</p>${chip(it)}</div></li>`;
  if (latest) { const L = J.past.slice(-latest).reverse(); return L.length ? `<ul class="jr-list jr-latest">${L.map(row).join('')}</ul>` : ''; }
  const wk = (d) => (g.start ? Math.floor(daysBetween(g.start, d) / 7) + 1 : 1);
  const weeks = {}; J.past.forEach((it) => { const w = it.date ? wk(it.date) : 1; (weeks[w] = weeks[w] || []).push(it); });
  const wkLabel = (w) => { if (!g.start) return `Week ${w}`; const s = addDaysISO(g.start, (w - 1) * 7), en = addDaysISO(s, 6); return `Week ${w} · ${fmtD(s, { day: 'numeric', month: 'short' })} – ${fmtD(en, { day: 'numeric', month: 'short' })}`; };
  const past = Object.keys(weeks).sort((a, b) => b - a).map((w) => `<div class="jr-week"><div class="jr-wh"><b>${esc(wkLabel(+w))}</b><span>${weeks[w].length} step${weeks[w].length === 1 ? '' : 's'}</span></div><ul class="jr-list">${weeks[w].map(row).join('')}</ul></div>`).join('');
  const nextL = J.next.slice(0, 12);
  const proj = J.projects.map((m) => { const nx = (m.timeline || []).find((t) => mvOn(t.next)); return `<div class="jr-proj" style="--c:${mvB(m).c}"><div class="jr-pt"><span class="mv-bucket">${esc(mvB(m).label)}</span><span class="jr-pl">${esc(m.nowLabel)}</span></div>
      <button type="button" class="jr-ph" ${open(m)}>${esc(m.title)}</button><p>${esc(m.now || '')}</p>${m.next ? `<p class="jr-first"><b>First step:</b> ${esc(m.next)}${m.nextDate ? ' · ' + esc(m.nextDate) : nx && mvDate(e, nx.date) ? ' · ' + esc(nx.date) : ''}</p>` : ''}</div>`; }).join('');
  return `<div class="jr">
    <div class="jr-col"><h3 class="jr-h">What has happened <span>${J.past.length} steps, newest week first</span></h3>${past || '<p class="muted">Nothing recorded yet.</p>'}</div>
    <div class="jr-col"><h3 class="jr-h">Coming up <span>${J.next.length} dated and planned steps</span></h3><ul class="jr-list jr-next">${nextL.map(row).join('')}</ul>${J.next.length > nextL.length ? `<p class="muted small">and ${J.next.length - nextL.length} more on the key changes.</p>` : ''}
      ${proj ? `<h3 class="jr-h" style="margin-top:18px">Starting next <span>agreed or proposed, not yet under way</span></h3><div class="jr-projs">${proj}</div>` : ''}</div></div>`;
}
