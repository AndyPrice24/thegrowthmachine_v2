/**
 * TGM live report: a Google Apps Script web app.
 *
 * Serves a report published from the Growth Machine Studio. Each recipient opens it from their own link,
 * can expand any item, comment on it and red-flag it. The app records who opened it and when, and keeps
 * every comment and flag. All of that is written into ONE stamped update file in the TGM Studio updates
 * folder, so "⟳ Updates" in the Studio pulls it into the Report feedback section.
 *
 * Deploy: Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone.
 * The Drive folder itself stays private: this script reads and writes it on your behalf, nobody else gets access.
 *
 * The Studio writes each report to <updates folder>/reports/<reportId>.json (through Google Drive for desktop), and, for a
 * founder portal, the page itself as reports/<reportId>.html, so the portal's look and features update without redeploying this script.
 * This script writes <updates folder>/<client>-report-feedback-<reportId>.json.
 */
var FOLDER_ID = '%%FOLDER_ID%%'; // the TGM Studio updates folder (the Studio fills this in when you download the file)
var OWNER_LABEL = 'The Growth Machine';
var VIEW_GAP_MINUTES = 30; // repeat opens by the same person within this gap count as one view
var MAX_TEXT = 4000;
var MAX_EVENTS = 5000;

function doGet(e) {
  var p = (e && e.parameter) || {};
  var rep = loadReport_(p.r);
  if (!rep) return notice_('This report is not available', 'The link may be out of date. Please ask The Growth Machine for a new one.');
  var who = whoIs_(rep, p.t);
  if (!who) return notice_('This link is not valid', 'Please ask The Growth Machine for a new link.');
  var events = who.owner ? readEvents_(rep) : (logView_(rep, who) || readEvents_(rep));
  var state = { report: publicReport_(rep), me: who, events: events, focus: String(p.el || ''), r: rep.reportId, t: String(p.t) };
  var html = appHtml_(rep) || HtmlService.createHtmlOutputFromFile('Report').getContent();
  html = html.replace('"__TGM_STATE__"', function () { return JSON.stringify(state).replace(/</g, '\\u003c'); });
  return HtmlService.createHtmlOutput(html)
    .setTitle(rep.title + ' · ' + rep.client)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** The page's only server call. req = { r, t, op: 'refresh' | 'comment' | 'flag' | 'pdf', el, text, parent, on, comments } */
function api(req) {
  req = req || {};
  var rep = loadReport_(req.r);
  if (!rep) throw new Error('This report is no longer available.');
  var who = whoIs_(rep, req.t);
  if (!who) throw new Error('This link is not valid.');
  if (req.op === 'refresh') return { events: readEvents_(rep) };
  if (req.op === 'comment' || req.op === 'flag') {
    var el = elementOf_(rep, req.el);
    if (!el) throw new Error('That part of the report is no longer in it.');
    var ev = { type: req.op === 'flag' ? (req.on ? 'flag' : 'unflag') : 'comment', elementId: el.id, elementLabel: el.label, section: el.section || '' };
    if (req.op === 'comment') {
      var text = String(req.text || '').trim();
      if (!text) throw new Error('Write a comment first.');
      ev.text = text.slice(0, MAX_TEXT);
      if (req.parent) ev.parentId = String(req.parent).slice(0, 40);
    }
    return { events: append_(rep, who, [ev]) };
  }
  if (req.op === 'pdf') {
    // The page builds the summary the viewer chose (the items they ticked, their title and note); the server only
    // turns it into a PDF and records what was chosen. Scripts, handlers and outside links are stripped first.
    var html = String(req.html || '');
    if (!html || html.length > 1500000) throw new Error('The summary is empty or too large.');
    html = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '').replace(/\s(src|href)\s*=\s*("|')\s*(https?:|javascript:)[^"']*\2/gi, '');
    var pdf = Utilities.newBlob(html, 'text/html', 'summary.html').getAs('application/pdf');
    var ids = (Array.isArray(req.items) ? req.items : []).filter(function (id) { return !!elementOf_(rep, id); }).slice(0, 500);
    if (!who.owner) append_(rep, who, [{ type: 'pdf', items: ids, text: String(req.summaryTitle || '').slice(0, 200) + ' · ' + ids.length + ' of ' + ((rep.elements || []).length - 1) + ' items' + (req.comments ? ', with comments' : '') }]);
    var name = (String(req.summaryTitle || (rep.client + ' ' + rep.title + ' summary'))).replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-').slice(0, 120) + '.pdf';
    return { pdf: Utilities.base64Encode(pdf.getBytes()), name: name };
  }
  throw new Error('Unknown request.');
}

/* ---------------- storage ---------------- */
function folder_() { return DriveApp.getFolderById(FOLDER_ID); }
function newest_(it) { var best = null; while (it.hasNext()) { var f = it.next(); if (!best || f.getLastUpdated() > best.getLastUpdated()) best = f; } return best; }
function loadReport_(id) {
  id = String(id || '');
  if (!/^[A-Za-z0-9_-]{3,64}$/.test(id)) return null;
  var subs = folder_().getFoldersByName('reports');
  if (!subs.hasNext()) return null;
  var file = newest_(subs.next().getFilesByName(id + '.json'));
  if (!file) return null;
  var rep; try { rep = JSON.parse(file.getBlob().getDataAsString('UTF-8')); } catch (err) { return null; }
  if (!rep || (rep.kind !== 'tgm-live-report' && rep.kind !== 'tgm-founder-portal') || rep.reportId !== id || rep.revoked) return null;
  return rep;
}
/** The portal page the Studio published next to the report (reports/<id>.html), or null to use the built-in Report page. */
function appHtml_(rep) {
  var name = String(rep.appFile || '');
  if (!/^[A-Za-z0-9_-]{3,64}\.html$/.test(name)) return null;
  var subs = folder_().getFoldersByName('reports');
  if (!subs.hasNext()) return null;
  var file = newest_(subs.next().getFilesByName(name));
  return file ? file.getBlob().getDataAsString('UTF-8') : null;
}
function feedbackName_(rep) {
  var n = String(rep.feedbackFile || '');
  return /^[a-z0-9-]+-report-feedback-[A-Za-z0-9_-]+\.json$/.test(n) ? n : 'report-feedback-' + rep.reportId + '.json';
}
function readEvents_(rep) {
  var file = newest_(folder_().getFilesByName(feedbackName_(rep)));
  if (!file) return [];
  try { var o = JSON.parse(file.getBlob().getDataAsString('UTF-8')); return (o && o.reportFeedback) || []; } catch (err) { return []; }
}
/** Add events and rewrite the feedback file as one stamped Studio update. Returns all events. */
function append_(rep, who, list) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var events = readEvents_(rep);
    if (events.length + list.length > MAX_EVENTS) throw new Error('This report has reached its comment limit. Please contact The Growth Machine.');
    var now = new Date().toISOString();
    list.forEach(function (ev) {
      ev.id = 'rf_' + Utilities.getUuid().replace(/-/g, '').slice(0, 16);
      ev.reportId = rep.reportId; ev.at = now; ev.by = who.id; ev.byLabel = who.label; ev.version = rep.version || 1;
      events.push(ev);
    });
    var body = JSON.stringify({
      _meta: { generatedAt: now, client: rep.client, note: 'Live report feedback: views, comments and red flags (' + rep.title + ')' },
      reportFeedback: events
    }, null, 1);
    var name = feedbackName_(rep);
    var file = newest_(folder_().getFilesByName(name));
    if (file) file.setContent(body); else folder_().createFile(name, body, 'application/json');
    return events;
  } finally { lock.releaseLock(); }
}
function logView_(rep, who) {
  var events = readEvents_(rep); var cut = Date.now() - VIEW_GAP_MINUTES * 60000;
  for (var i = events.length - 1; i >= 0; i--) {
    var ev = events[i];
    if (ev.type === 'view' && ev.by === who.id) { if (new Date(ev.at).getTime() > cut) return null; break; }
  }
  return append_(rep, who, [{ type: 'view' }]);
}

/* ---------------- who is this, and what may they see ---------------- */
function whoIs_(rep, token) {
  token = String(token || '');
  if (token.length < 16) return null;
  if (token === rep.ownerToken) return { id: 'owner', label: OWNER_LABEL, owner: true };
  var list = rep.recipients || [];
  for (var i = 0; i < list.length; i++) if (list[i].token === token && !list[i].revoked) return { id: list[i].id, label: list[i].label, owner: false };
  return null;
}
function publicReport_(rep) {
  var out = JSON.parse(JSON.stringify(rep));
  delete out.ownerToken;
  out.recipients = (rep.recipients || []).filter(function (x) { return !x.revoked; }).map(function (x) { return { id: x.id, label: x.label }; });
  return out;
}
function elementOf_(rep, id) {
  var list = rep.elements || [];
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

/* ---------------- notices ---------------- */
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function notice_(title, msg) {
  return HtmlService.createHtmlOutput('<div style="font-family:Arial,sans-serif;max-width:520px;margin:60px auto;padding:0 16px;color:#171715">'
    + '<div style="font-size:11px;letter-spacing:.2em">THE <b style="color:#c8221c">GROWTH</b> MACHINE</div>'
    + '<h1 style="font-family:Georgia,serif;font-weight:400">' + esc_(title) + '</h1><p>' + esc_(msg) + '</p></div>')
    .setTitle(title).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
