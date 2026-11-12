/* ============================================================
   Live report: a curated report each recipient opens in the browser from their own link (a Google Apps Script
   web app on TGM's Google account). Recipients expand, comment on and red-flag any item; the web app records who
   opened it and when. Everything comes back as one stamped update file in the updates folder, so ⟳ Updates
   brings it into the Report feedback section here, with a link that opens the live report at that item.

   Records:  liveReports     { id, title, preparedFor, intro, nextSteps, itemIds[], roles, recipients[{id,label,email,token,revoked}],
                               ownerToken, version, publishedAt }
             reportFeedback  { id, reportId, type: view|comment|flag|unflag|pdf, by, byLabel, at, elementId, elementLabel,
                               section, text, parentId, version, seen (set here) }
   Publishing writes <updates folder>/reports/<id>.json, which the web app reads (Drive for desktop syncs it).
   Only items ticked here go in. Anything that reads as sensitive is never added by the quick-add buttons.
   ============================================================ */
const LR_SENSITIVE = /sensitiv|privately|related party|confidential|not in the cro|shareholder loan|payslip|salar|commission|personal (accounts?|card|api|banking)|own banking/i;
const LR_TAG = { leak: 'Leak', weakness: 'Weakness', hole: 'Gap', opportunity: 'Opportunity', tool: 'Tool' };
const LR_LENS_ORDER = ['leak', 'weakness', 'hole', 'opportunity', 'tool'];
const lrList = (e) => e.liveReports || [];
const lrCur = (e) => lrList(e).find((x) => x.id === ui.lrId) || lrList(e)[0] || null;
const lrSensitive = (o) => LR_SENSITIVE.test([o.title, o.evidence, o.description, o.stick].join(' '));
function lrToken() { const a = new Uint8Array(12); crypto.getRandomValues(a); return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join(''); }
function lrFirst(t) {
  const s = String(t || '').replace(/\s+/g, ' ').trim(); if (s.length <= 240) return s;
  const m = s.slice(0, 240).match(/^(.{60,}?[.!?])\s/); return m ? m[1] : trunc(s, 240);
}

/** Everything that could go in: findings and opportunities (what's wrong or possible) and recommendations (the fixes). */
function lrCandidates(e) {
  const sc = {}; scoreRecommendations(e).forEach((x) => { sc[x.rec.id] = x; });
  const out = [];
  e.findings.forEach((f) => {
    const k = f.kind || guessLens(f); if (k === 'context') return;
    out.push({ id: f.id, src: 'finding', o: f, kind: k, title: f.title || f.id, value: num(f.valueMonthly), basis: f.basis || (num(f.valueMonthly) ? 'Leaking' : ''), pinned: !!f.pinned, sev: f.severity || 'low', sensitive: lrSensitive(f) });
  });
  e.opportunities.forEach((o) => out.push({ id: o.id, src: 'opportunity', o, kind: 'opportunity', title: o.title, value: num(o.valueMonthly), basis: num(o.valueMonthly) ? 'Upside' : '', pinned: !!o.pinned, sev: ({ High: 'high', Medium: 'medium', Low: 'low' })[o.impact] || 'low', sensitive: lrSensitive(o) }));
  e.recommendations.filter((r) => r.status !== 'Rejected').forEach((r) => { const x = sc[r.id] || {}; out.push({ id: r.id, src: 'recommendation', o: r, kind: 'rec', title: r.title, value: (x.cash || 0) + (x.revenue || 0), score: x.score || 0, pinned: !!r.pinned, sensitive: lrSensitive(r), x }); });
  return out;
}
const lrRank = (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (a.src === 'recommendation' ? (b.score || 0) - (a.score || 0) : stake(b) - stake(a)) || (SEV_W[b.sev] || 0) - (SEV_W[a.sev] || 0);

/** Names to roles in free text: full names, nicknames (the person's "aka") and unambiguous first names. First names that
    also appear in a client, tool, segment or competitor name are left alone (e.g. "Guy" in "The Courier Guy"). */
function lrRoleFn(e) {
  const skip = new Set(); [...(e.topClients || []), ...(e.competitors || []), ...(e.segments || []), ...(e.tools || [])].forEach((c) => String(c.name || '').split(/[^A-Za-z'-]+/).forEach((w) => w && skip.add(w)));
  const firstCount = {}; e.people.forEach((p) => { const f = String(p.name || '').split(/\s+/)[0]; if (f) firstCount[f] = (firstCount[f] || 0) + 1; });
  const map = {};
  e.people.forEach((p) => {
    if (!p.name || !p.title || /role to confirm/i.test(p.title)) return;
    const acr = (p.title.match(/\(([A-Z]{2,5})\)/) || [])[1];
    const role = acr || p.title.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
    map[p.name] = role;
    splitList(p.aka).forEach((a) => { map[a] = role; });
    const first = p.name.split(/\s+/)[0];
    if (first.length > 2 && firstCount[first] === 1 && !skip.has(first)) map[first] = role;
  });
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);
  if (!keys.length) return (s) => String(s || '');
  const re = new RegExp(`\\b(${keys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b('s)?`, 'g');
  return (s) => String(s || '').replace(re, (m, name, poss, at, str) => {
    const role = map[name]; const before = str.slice(Math.max(0, at - 2), at);
    const start = at === 0 || /[.!?:]\s$|^\n|\($/.test(before) || /^\s*$/.test(str.slice(0, at));
    const art = /^[A-Z]{2,5}$/.test(role) || !/^(the |a )/i.test(role) ? (start ? 'The ' : 'the ') : '';
    return art + role + (poss ? (role.endsWith('s') ? "'" : "'s") : '');
  }).replace(/\b(the |The )?([A-Z]{2,5}) \(\2, /g, '$1$2 (').replace(/\b(the |The )?([A-Z]{2,5}) \(\2\)/g, '$1$2');
}

/** The founder portal's data: the engagement minus TGM-only material (interviews, questions, diary, to-dos, merge history),
    minus anything sensitive that wasn't ticked; the ticked items; the decisions asked of the founders; counts for the overview. */
function lrPortalEng(e, lr) {
  const ticked = new Set(lr.itemIds || []);
  const sens = (o) => lrSensitive(o) && !ticked.has(o.id);
  const DROP = new Set(['interviews', 'customQuestions', 'intake', 'feedback', 'staffSurvey', 'liveReports', 'reportFeedback', 'report']);
  const x = JSON.parse(JSON.stringify(e, (k, v) => (k === 'updatedAt' || k === 'mergeLog' || k === 'deleted' || k.startsWith('_') ? undefined : v)));
  Object.keys(x).forEach((k) => { if (DROP.has(k)) delete x[k]; });
  x.meta = { currency: e.meta.currency, consultant: e.meta.consultant, engagementStart: e.meta.engagementStart, tsMigrated: true };
  x.findings = (x.findings || []).filter((f) => !sens(f));
  x.recommendations = (x.recommendations || []).filter((r) => !sens(r));
  x.opportunities = (x.opportunities || []).filter((o) => !sens(o));
  x.automations = (x.automations || []).filter((a) => !a.private && !sens(a));
  x.people = (x.people || []).map((pp) => (LR_SENSITIVE.test(pp.notes || '') ? Object.assign({}, pp, { notes: '' }) : pp));
  const g = x.engagement || {};
  x.engagement = Object.assign({}, g, { timeLog: [], activities: [], requests: (g.requests || []).map((r) => ({ id: r.id, item: r.item, crit: r.crit, owner: r.owner, requestedDate: r.requestedDate, dueDate: r.dueDate, receivedDate: r.receivedDate, status: r.status })) });
  return x;
}
function lrAsks(lr) {
  return String(lr.asks || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const [t, ...d] = l.split('|'); return { id: 'ask-' + hashStr(t.trim()), title: t.trim(), detail: d.join('|').trim() }; });
}
function lrCapacity(e) {
  const g = e.engagement; if (!(g.phases || []).length) return '';
  const st = engagementStatus(e); const m = Math.max(1, Math.min(3, st.thisMonth)); const f = (v) => (v % 1 ? v.toFixed(1) : String(v));
  return `Month ${m}: ${f(num(st.byMonth[m] || 0))} of ${num(g.daysPerMonth)} days used · ${f(Math.max(0, st.remaining))} of ${num(g.daysTotal)} remaining overall`;
}
function lrSnapshot(e, lr) {
  const C = lrCandidates(e); const byC = {}; C.forEach((c) => { byC[c.id] = c; });
  const chosen = (lr.itemIds || []).map((id) => byC[id]).filter(Boolean);
  const found = chosen.filter((c) => c.src !== 'recommendation'); const recs = chosen.filter((c) => c.src === 'recommendation');
  const asks = lrAsks(lr);
  const procs = e.processes || []; const steps = procs.flatMap((pr) => pr.steps || []);
  const elements = [...asks.map((a) => ({ id: a.id, label: a.title, section: 'Needs your decision' })),
    ...found.map((c) => ({ id: c.id, label: c.title, section: 'Leaks & opportunities' })), ...recs.map((c) => ({ id: c.id, label: c.title, section: 'What we suggest' })),
    { id: 'report', label: 'The portal as a whole', section: '' }];
  return { kind: 'tgm-founder-portal', v: 2, reportId: lr.id, client: e.client.name, clientSlug: slugify(e.client.name), feedbackFile: lrFeedbackFile(e, lr), appFile: lr.id + '.html',
    title: lr.title || 'Founder portal', preparedFor: lr.preparedFor || '', intro: lr.intro || '', version: lr.version || 1, publishedAt: lr.publishedAt || nowISO(),
    ownerToken: lr.ownerToken, recipients: (lr.recipients || []).filter((r) => !r.revoked).map((r) => ({ id: r.id, label: r.label, token: r.token })),
    itemIds: found.map((c) => c.id), recIds: recs.map((c) => c.id), asks, prev: lr.lastValues || {},
    stats: { conversations: (e.interviews || []).length, processes: procs.length, steps: steps.length, flags: steps.reduce((n, st) => n + (st.flags || []).length, 0), sources: (e.sources || []).length, capacity: lrCapacity(e) },
    elements, eng: lrPortalEng(e, lr) };
}
/** The portal page: the Studio's own code and styles, plus a slot the web app fills with the viewer's data. */
function lrPortalHtml() {
  const css = ['viz-css', 'report-css', 'app-css', 'portal-css'].map((id) => (document.getElementById(id) || {}).textContent || '').join('\n');
  const js = (document.getElementById('app-js') || {}).textContent || '';
  if (!js) throw new Error('This copy of the Studio cannot build the portal (no app script found)');
  return '<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">'
    + '<title>Founder portal</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap">'
    + '<style>' + css + '</style></head><body class="portal"><script>window.PORTAL = "__TGM_STATE__";</' + 'script><div id="pt-app"></div><div id="modal" hidden></div><div id="toast" role="status" aria-live="polite"></div><div id="tip" hidden></div>'
    + '<script>' + js + '</' + 'script></body></html>';
}
/** The label of an item in this report, from the data (for summaries that name items nobody commented on). */
function lrLabel(e, lr, id) { if (id === 'summary') return 'Summary'; if (id === 'report') return 'The portal as a whole'; if (String(id).startsWith('ask-')) { const a = lrAsks(lr).find((x) => x.id === id); if (a) return a.title; } const c = lrCandidates(e).find((x) => x.id === id); return c ? c.title : (String(id).startsWith('ns-') ? 'A next step' : id); }
const lrFeedbackFile = (e, lr) => `${slugify(e.client.name)}-report-feedback-${lr.id}.json`;
function lrLink(e, lr, token, el) {
  const base = String((e.meta || {}).liveReportUrl || '').trim(); if (!base) return '';
  return `${base}${base.includes('?') ? '&' : '?'}r=${encodeURIComponent(lr.id)}&t=${encodeURIComponent(token)}${el ? '&el=' + encodeURIComponent(el) : ''}`;
}

/* ---------- actions ---------- */
function lrNew() {
  const e = E(); e.liveReports = e.liveReports || [];
  const lr = { id: 'lr_' + lrToken().slice(0, 8), title: 'Founder portal', preparedFor: '', intro: '', asks: '', itemIds: [], roles: false, recipients: [], ownerToken: lrToken(), version: 0, publishedAt: '', lastValues: {} };
  touch(lr); e.liveReports.push(lr); ui.lrId = lr.id; save(); render(); window.scrollTo(0, 0); toast('New founder portal created: name it, tick what goes in, add who gets a link');
}
function lrToggleItem(id, on) {
  const lr = lrCur(E()); if (!lr) return; const s = new Set(lr.itemIds || []);
  if (on) s.add(id); else s.delete(id);
  lr.itemIds = [...s]; touch(lr); save(); render();
}
function lrQuick(k) {
  const e = E(); const lr = lrCur(e); if (!lr) return;
  const C = lrCandidates(e).filter((c) => !c.sensitive); const s = new Set(lr.itemIds || []);
  if (k === 'clear') s.clear();
  if (k === 'pinned') C.filter((c) => c.pinned).forEach((c) => s.add(c.id));
  if (k === 'top') C.filter((c) => c.src !== 'recommendation').sort(lrRank).slice(0, 10).forEach((c) => s.add(c.id));
  if (k === 'fixes') { const recs = byId(e.recommendations); e.findings.filter((f) => s.has(f.id) && f.fixId && recs[f.fixId] && recs[f.fixId].status !== 'Rejected' && !lrSensitive(recs[f.fixId])).forEach((f) => s.add(f.fixId)); }
  lr.itemIds = [...s]; touch(lr); save(); render();
}
function lrAddRecipient() {
  const lr = lrCur(E()); if (!lr) return;
  const label = (document.getElementById('lrNewLabel').value || '').trim(); const email = (document.getElementById('lrNewEmail').value || '').trim();
  if (!label) return toast('Add the name people will see on their comments');
  lr.recipients = (lr.recipients || []).concat([{ id: 'rc_' + lrToken().slice(0, 8), label, email, token: lrToken(), revoked: false }]); touch(lr); save(); render();
}
async function lrPublish() {
  const e = E(); const lr = lrCur(e); if (!lr) return;
  if (!(lr.itemIds || []).length) return toast('Tick what goes in the report first');
  if (!syncState.handle) { toast('Pick the updates folder first; then click Publish again'); return syncConnect(); }
  if (!(await syncPermitted())) return toast('Allow access to the updates folder, then click Publish again');
  lr.version = (lr.version || 0) + 1; lr.publishedAt = nowISO(); touch(lr);
  const snap = lrSnapshot(e, lr);
  try {
    const dir = await syncState.handle.getDirectoryHandle('reports', { create: true });
    const put = async (name, body) => { const fh = await dir.getFileHandle(name, { create: true }); const w = await fh.createWritable(); await w.write(body); await w.close(); };
    await put(lr.id + '.html', lrPortalHtml());
    await put(lr.id + '.json', JSON.stringify(snap));
  } catch (err) { lr.version -= 1; return toast('Could not write the portal: ' + err.message); }
  // Remember this version's values, so the next one can show what went up or down.
  const rows = {}; savingsTracker(e).rows.forEach((r) => { rows[r.rec.id] = Math.max(0, r.monthlyNet); });
  lr.lastValues = {}; lrCandidates(e).filter((c) => (lr.itemIds || []).includes(c.id)).forEach((c) => { lr.lastValues[c.id] = c.src === 'recommendation' ? (rows[c.id] || 0) : num(c.value); });
  save(); render(); toast(`Published version ${lr.version} to ${syncState.name}/reports. Links work once Google Drive has synced it (usually under a minute).`);
}
function lrDelete() {
  const e = E(); const lr = lrCur(e); if (!lr) return;
  if (!confirm(`Delete "${lr.title}" from the Studio?${lr.publishedAt ? ' Its links will keep working until you delete its files from the updates folder (reports/' + lr.id + '.json and .html).' : ''}`)) return;
  e.liveReports = e.liveReports.filter((x) => x.id !== lr.id); e.meta.deleted = Object.assign({}, e.meta.deleted, { ['liveReports:' + lr.id]: nowISO() });
  ui.lrId = ''; save(); render(); toast('Deleted');
}
function lrDownload(kind) {
  const e = E(); const fid = String((e.meta || {}).liveReportFolderId || '').trim();
  if (kind === 'code' && !fid) return toast('Paste the updates folder ID first (from its Google Drive address)');
  if (kind === 'code') downloadFile('Code.gs', LIVE_REPORT_FILES.code.replace('%%FOLDER_ID%%', fid), 'text/plain');
  else downloadFile('Report.html', LIVE_REPORT_FILES.html, 'text/html');
}
function lrMail(e, lr, r) {
  const link = lrLink(e, lr, r.token); const first = String(r.label).split(/[\s(]/)[0];
  const body = `Hi ${first},\n\nHere is your personal link to "${lr.title}" for ${e.client.name}:\n${link}\n\nOpen any item to see the detail and where each figure comes from. You can comment on anything, and red-flag what matters most to you. Everyone the report is shared with sees comments and flags, so it works as one conversation. You can also download a short summary PDF for your team.\n\nThe link is personal to you, so please don't forward it; I'm happy to send one to anyone else who should see it.\n\nThanks,\nAndrew`;
  return `mailto:${encodeURIComponent(r.email || '')}?subject=${encodeURIComponent(`${lr.title} · ${e.client.name}`)}&body=${encodeURIComponent(body)}`;
}

/* ---------- feedback ---------- */
const lrEvents = (e, lr) => (e.reportFeedback || []).filter((x) => !lr || x.reportId === lr.id);
const lrUnseen = (e) => lrEvents(e).filter((x) => (x.type === 'comment' || x.type === 'flag') && !x.seen).length;
function lrFlagState(evs) {
  const last = {}; evs.forEach((x) => { if (x.type === 'flag' || x.type === 'unflag') last[x.elementId + '|' + x.by] = x; });
  const by = {}; Object.values(last).forEach((x) => { if (x.type === 'flag') (by[x.elementId] = by[x.elementId] || []).push(x); }); return by;
}
function lrFeedbackCard(e, lr) {
  const evs = lrEvents(e, lr).slice().sort((a, b) => String(b.at).localeCompare(String(a.at)));
  const url = (e.meta || {}).liveReportUrl;
  const rcps = (lr.recipients || []);
  const vrow = (r) => {
    const v = evs.filter((x) => x.by === r.id && x.type === 'view'); const pdf = evs.filter((x) => x.by === r.id && x.type === 'pdf').length;
    const c = evs.filter((x) => x.by === r.id && x.type === 'comment').length; const f = Object.values(lrFlagState(evs)).filter((l) => l.some((x) => x.by === r.id)).length;
    return `<tr><td><b>${esc(r.label)}</b>${r.revoked ? ' <span class="chip">link stopped</span>' : ''}</td><td>${v.length ? `${v.length} visit${v.length > 1 ? 's' : ''}` : '<span class="faint">Not opened yet</span>'}</td><td>${v.length ? esc(new Date(v[v.length - 1].at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) : ''}</td><td>${v.length ? esc(new Date(v[0].at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })) : ''}</td><td class="r">${c || ''}</td><td class="r">${f || ''}</td><td class="r">${pdf || ''}</td></tr>`;
  };
  const flags = lrFlagState(evs);
  const talk = {}; evs.filter((x) => x.type === 'comment').forEach((x) => { talk[x.elementId] = (talk[x.elementId] || 0) + 1; });
  const hot = [...new Set([...Object.keys(flags), ...Object.keys(talk)])].map((id) => ({ id, f: (flags[id] || []).length, c: talk[id] || 0, label: (evs.find((x) => x.elementId === id) || {}).elementLabel || id }))
    .sort((a, b) => b.f - a.f || b.c - a.c).slice(0, 6);
  const open = (id) => url ? `<a class="btn sm" href="${esc(lrLink(e, lr, lr.ownerToken, id))}" target="_blank" rel="noopener" title="Opens the live report at this item, with your owner link">Open in live report ↗</a>` : '';
  const items = evs.filter((x) => x.type === 'comment' || x.type === 'flag' || x.type === 'unflag' || x.type === 'pdf');
  const F = ui.lrFb || 'all';
  const shown = items.filter((x) => F === 'all' || (F === 'new' && !x.seen && x.type !== 'unflag') || (F === 'flags' && (x.type === 'flag' || x.type === 'unflag')) || (F === 'comments' && x.type === 'comment') || (F === 'pdf' && x.type === 'pdf'));
  const parent = byId(items);
  const row = (x) => `<div class="lr-fb ${x.seen ? 'seen' : ''} lr-fb-${x.type}" id="lrf-${esc(x.id)}">
      <div class="lr-fb-i" aria-hidden="true">${x.type === 'comment' ? '💬' : x.type === 'flag' ? '🚩' : x.type === 'pdf' ? '📄' : '⚐'}</div>
      <div class="lr-fb-b"><div class="small"><b>${esc(x.byLabel)}</b> ${x.type === 'pdf' ? `downloaded a summary for their team${(x.items || []).length ? ` (${x.items.length} item${x.items.length === 1 ? '' : 's'})` : ''}` : `${x.type === 'flag' ? 'red-flagged' : x.type === 'unflag' ? 'removed their red flag from' : x.parentId ? 'replied on' : 'commented on'} <b>${esc(x.elementLabel || x.elementId)}</b>${x.section ? ` <span class="faint">in ${esc(x.section)}</span>` : ''}`} <span class="faint">· ${esc(new Date(x.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))} · version ${esc(x.version || 1)}</span></div>
        ${x.parentId && parent[x.parentId] ? `<div class="faint small">↳ replying to ${esc(parent[x.parentId].byLabel)}: “${esc(trunc(parent[x.parentId].text, 120))}”</div>` : ''}
        ${x.text ? `<p class="lr-fb-t">${esc(x.text)}</p>` : ''}${x.type === 'pdf' && (x.items || []).length ? `<details class="small"><summary>What they included</summary><ul>${x.items.map((id) => `<li>${esc((lrEvents(e, lr).find((y) => y.elementId === id) || {}).elementLabel || lrLabel(e, lr, id))}</li>`).join('')}</ul></details>` : ''}
        <div class="btn-row">${x.type === 'pdf' ? '' : open(x.elementId)}${x.type !== 'unflag' ? `<button class="btn sm ghost" data-action="lrSeen" data-id="${esc(x.id)}">${x.seen ? 'Mark as new' : 'Mark seen'}</button>` : ''}</div></div></div>`;
  return card(`Report feedback${lrUnseen(e) ? ` <span class="chip lo-nofix">${lrUnseen(e)} new</span>` : ''}`, `
    ${rcps.length ? `<h5>Who opened it, and when</h5><div class="scroll-x"><table class="tbl"><thead><tr><th>Recipient</th><th>Opened</th><th>Last visit</th><th>First visit</th><th class="r">Comments</th><th class="r">Flags</th><th class="r">PDFs</th></tr></thead><tbody>${rcps.map(vrow).join('')}</tbody></table></div>` : '<p class="faint small">Add recipients below to see who opens the report.</p>'}
    ${hot.length ? `<h5>What they care about</h5><ol class="small lr-hot">${hot.map((h) => `<li><b>${esc(h.label)}</b> ${h.f ? `<span class="chip lo-nofix">🚩 ${h.f}</span>` : ''} ${h.c ? `<span class="chip">💬 ${h.c}</span>` : ''} ${url ? `<a class="link" href="${esc(lrLink(e, lr, lr.ownerToken, h.id))}" target="_blank" rel="noopener">open ↗</a>` : ''}</li>`).join('')}</ol>` : ''}
    <h5>Comments and red flags, newest first</h5>
    <div class="toolbar">${[['all', 'All'], ['new', 'New'], ['flags', 'Red flags'], ['comments', 'Comments'], ['pdf', 'Summaries they sent']].map(([k, n]) => `<button class="btn sm ${F === k ? 'on' : ''}" data-action="lrFb" data-id="${k}">${n}</button>`).join('')}${items.some((x) => !x.seen) ? '<button class="btn sm ghost" data-action="lrSeenAll">Mark all seen</button>' : ''}</div>
    ${shown.length ? shown.map(row).join('') : `<p class="faint small">${items.length ? 'Nothing in this filter.' : 'No comments or flags yet. They arrive with ⟳ Updates.'}</p>`}
    ${url ? '' : '<p class="small warn-t">Add the web app address under Set-up to open feedback in the live report.</p>'}`,
    { sub: 'Views, comments and red flags arrive with ⟳ Updates. Each keeps what it was attached to (item, section, version), so the trail survives later edits. “Open in live report” jumps to that item.' });
}

/* ---------- the page ---------- */
function viewLiveReport(e, toggle) {
  const lrs = lrList(e); const lr = lrCur(e);
  const head = `<div class="page-h"><div><span class="eyebrow">Report</span><h1>Founder portal</h1><p class="muted">What each founder sees from their own link: an overview, our work, the leaks and opportunities you tick, and read-only Processes and Evidence. They can comment, red-flag and download a summary for their team. You see who opened it and when, and every comment, below.</p></div>
    <div class="btn-row">${lrs.length > 1 ? `<select id="lrSel" class="inline">${lrs.map((x) => `<option value="${esc(x.id)}" ${lr && x.id === lr.id ? 'selected' : ''}>${esc(x.title)}</option>`).join('')}</select>` : ''}<button class="btn ${lrs.length ? 'ghost' : ''}" data-action="lrNew">+ New founder portal</button>${lrs.length ? '<button class="btn ghost" data-action="lrDelete" title="Delete this portal from the Studio">Delete</button>' : ''}</div></div>`;
  if (!lr) return head + toggle + empty('No founder portal yet. Click “New founder portal” to choose what goes in it and who gets a link.');
  const C = lrCandidates(e); const sel = new Set(lr.itemIds || []);
  const evs = lrEvents(e, lr); const flags = lrFlagState(evs); const talk = {}; evs.filter((x) => x.type === 'comment').forEach((x) => { talk[x.elementId] = (talk[x.elementId] || 0) + 1; });
  const tab = ui.lrPick || 'found';
  const list = C.filter((c) => (tab === 'recs' ? c.src === 'recommendation' : c.src !== 'recommendation')).sort(lrRank);
  const q = String(ui.lrQ || '').toLowerCase();
  const rows = list.filter((c) => !q || (c.title + ' ' + (c.o.evidence || c.o.description || '')).toLowerCase().includes(q));
  const pick = (c) => `<label class="lr-pick ${sel.has(c.id) ? 'on' : ''}"><input type="checkbox" data-action="lrItem" data-id="${esc(c.id)}" ${sel.has(c.id) ? 'checked' : ''}>
    <span>${c.pinned ? '<span class="chip pin-chip">★</span> ' : ''}${c.src === 'recommendation' ? `<span class="chip">${esc(c.o.status || 'Identified')}</span>` : `<span class="chip">${esc(LR_TAG[c.kind] || c.kind)}</span>`} ${esc(c.title)}
    ${c.value ? `<span class="faint small"> · ${fmtMoney(c.value)}${c.src === 'recommendation' ? '/yr' : '/mo'}</span>` : ''}${c.sensitive ? ' <span class="chip lo-nofix" title="The text mentions something sensitive (pay, commission, related parties, personal accounts or a confidential remark). Quick-add skips it; read it before ticking.">⚠ check before sharing</span>' : ''}${flags[c.id] ? ` <span class="chip lo-nofix">🚩 ${flags[c.id].length}</span>` : ''}${talk[c.id] ? ` <span class="chip">💬 ${talk[c.id]}</span>` : ''}</span></label>`;
  const nSens = C.filter((c) => sel.has(c.id) && c.sensitive).length;
  const nF = C.filter((c) => sel.has(c.id) && c.src !== 'recommendation').length, nR = C.filter((c) => sel.has(c.id) && c.src === 'recommendation').length;
  const url = (e.meta || {}).liveReportUrl;
  const changed = lr.publishedAt && lr.updatedAt && lr.updatedAt > lr.publishedAt;
  const rc = (r) => {
    const link = lrLink(e, lr, r.token);
    return `<tr class="${r.revoked ? 'row-removed' : ''}"><td><input class="inline" data-lrrcp="${esc(r.id)}|label" value="${esc(r.label)}" style="min-width:260px"></td><td><input class="inline" type="email" data-lrrcp="${esc(r.id)}|email" value="${esc(r.email || '')}" placeholder="email (optional)"></td>
      <td>${link && !r.revoked ? `<button class="btn sm" data-action="lrCopy" data-id="${esc(r.id)}">Copy link</button> <a class="btn sm ghost" href="${esc(lrMail(e, lr, r))}">Email</a>` : r.revoked ? '<span class="faint small">Stopped</span>' : '<span class="faint small">Add the web app address first</span>'}</td>
      <td><button class="btn sm ghost" data-action="lrRevoke" data-id="${esc(r.id)}" title="${r.revoked ? 'Give this person access again (after you publish)' : 'Stop this link working (after you publish)'}">${r.revoked ? 'Restore' : 'Stop link'}</button></td></tr>`;
  };
  return `${head}${toggle}
  ${lrFeedbackCard(e, lr)}
  ${card('1. What goes in', `
    <div class="grid-2"><label class="fld"><span>Name (shown under the client's name)</span><input data-lr="title" value="${esc(lr.title)}"></label><label class="fld"><span>Prepared for</span><input data-lr="preparedFor" value="${esc(lr.preparedFor || '')}" placeholder="e.g. the founders"></label></div>
    <label class="fld"><span>Opening line on the overview (two or three sentences; if empty, the status report's headline is used)</span><textarea data-lr="intro" rows="3">${esc(lr.intro || '')}</textarea></label>
    <label class="fld"><span>Needs your decision (one per line: what you need | a short line of detail)</span><textarea data-lr="asks" rows="4" placeholder="Pulse sign-off criteria | What you and Neil want to see before it runs on a schedule">${esc(lr.asks || '')}</textarea></label>
    <p class="faint small">The overview also shows: the engagement timeline, savings identified, the headline numbers (Sources &amp; data → Headline numbers), this fortnight from the status report, and links into Processes and Evidence (read only).</p>
    <h5>Items: ${nF} finding${nF === 1 ? '' : 's'} and ${nR} recommendation${nR === 1 ? '' : 's'} ticked${nSens ? ` · <span class="warn-t">${nSens} marked “check before sharing”</span>` : ''}</h5>
    <div class="toolbar"><button class="btn sm ${tab === 'found' ? 'on' : ''}" data-action="lrPick" data-id="found">Findings &amp; opportunities</button><button class="btn sm ${tab === 'recs' ? 'on' : ''}" data-action="lrPick" data-id="recs">Recommendations</button>
      <input class="inline" id="lrQ" placeholder="Filter" value="${esc(ui.lrQ || '')}" style="max-width:180px">
      <button class="btn sm ghost" data-action="lrQuick" data-id="pinned">+ Founder priorities</button><button class="btn sm ghost" data-action="lrQuick" data-id="top">+ Top 10 by size</button><button class="btn sm ghost" data-action="lrQuick" data-id="fixes">+ Fixes for ticked findings</button><button class="btn sm ghost" data-action="lrQuick" data-id="clear">Clear</button></div>
    <div class="lr-list">${rows.map(pick).join('') || '<p class="faint small">Nothing matches.</p>'}</div>`,
    { sub: 'Only what you tick goes in. Quick-add skips anything marked “check before sharing”. Founder priorities lead; findings are grouped by kind and ranked by size; recommendations by score.' })}
  ${card('2. Who gets a link', `
    <div class="scroll-x"><table class="tbl"><thead><tr><th>Name shown on their comments</th><th>Email</th><th>Their link</th><th></th></tr></thead><tbody>${(lr.recipients || []).map(rc).join('')}
      <tr><td><input class="inline" id="lrNewLabel" placeholder="e.g. Sam (Managing Director)" style="min-width:260px"></td><td><input class="inline" id="lrNewEmail" type="email" placeholder="email (optional)"></td><td><button class="btn sm" data-action="lrAddRcp">+ Add recipient</button></td><td></td></tr></tbody></table></div>
    <p class="faint small">Each person gets their own link, so views and comments show who they came from. A forwarded link shows as the original recipient. “Email” opens a draft in your mail app. Your own owner link: ${url ? `<button class="link" data-action="lrCopy" data-id="owner">copy</button> · <a class="link" href="${esc(lrLink(e, lr, lr.ownerToken))}" target="_blank" rel="noopener">open ↗</a>` : 'add the web app address first'}.</p>`)}
  ${card('3. Publish', `
    <p class="small">${lr.publishedAt ? `Version <b>${lr.version}</b> published ${esc(new Date(lr.publishedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }))}.${changed ? ' <span class="warn-t">Changed since then: publish again so recipients see it.</span>' : ''}` : 'Not published yet.'} Publishing writes the report into the updates folder (reports/${esc(lr.id)}.json); recipients' links always show the latest version, and comments stay on their items.</p>
    <div class="btn-row"><button class="btn" data-action="lrPublish">${lr.publishedAt ? 'Publish again' : 'Publish'}</button>${syncState.handle ? '' : '<span class="faint small">You will be asked to pick the updates folder.</span>'}</div>
    <details class="small lr-setup" ${url ? '' : 'open'}><summary><b>Set-up (once): the web app</b></summary>
      <ol>
        <li>Paste the updates folder's ID (the part of its Google Drive address after <code>/folders/</code>): <input class="inline" data-bind="meta.liveReportFolderId" value="${esc((e.meta || {}).liveReportFolderId || '')}" style="max-width:320px"></li>
        <li>Download <button class="link" data-action="lrDl" data-id="code">Code.gs</button> and <button class="link" data-action="lrDl" data-id="html">Report.html</button>.</li>
        <li>At script.google.com, create a project called “TGM live report”. Replace Code.gs with the downloaded one; add an HTML file named <b>Report</b> and paste Report.html into it.</li>
        <li>Deploy → New deployment → Web app. Execute as: <b>Me</b>. Who has access: <b>Anyone</b>. Approve the Drive access it asks for.</li>
        <li>Paste the web app address here: <input class="inline" data-bind="meta.liveReportUrl" value="${esc(url || '')}" placeholder="https://script.google.com/macros/s/…/exec" style="max-width:420px"></li>
      </ol>
      <p class="faint">The folder stays private: the web app reads and writes it on your behalf. After changing the script, use Deploy → Manage deployments → Edit → New version, so the address stays the same.</p></details>`)}`;
}
