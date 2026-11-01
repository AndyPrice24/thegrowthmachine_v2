/* Builds a client kick-off pack from a (git-ignored) client config:
     node tools/growth-machine/pack/build-pack.cjs clients/location-bank/pack.config.json
   Outputs into the config's folder:
     leave-behind.html/.pdf   founder-facing approach + what we need (shareable)
     kickoff-script.html/.pdf private talk track for the consultant (never share)
     intake-form.gs           Google Apps Script that creates the founder questionnaire as a Google Form
*/
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const cfgPath = process.argv[2];
if (!cfgPath) { console.error('Usage: node build-pack.cjs <pack.config.json>'); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const outDir = path.dirname(cfgPath);
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'questions.js'), 'utf8') + '\n;this.Q={CRITERIA,INTAKE_SECTIONS,STAFF_SECTIONS,DOCUMENT_REQUESTS,standardPlan};', ctx);
const { INTAKE_SECTIONS, STAFF_SECTIONS, DOCUMENT_REQUESTS, standardPlan } = ctx.Q;

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtDate = (iso, opts = { day: 'numeric', month: 'short' }) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', opts);
const longDate = (iso) => fmtDate(iso, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const money = (n) => cfg.currency + Number(n).toLocaleString('en-GB');
const plan = standardPlan(cfg.start);

/* ---------- shared print styles ---------- */
const CSS = `
@page{size:A4;margin:0}
*{box-sizing:border-box}
body{margin:0;font-family:Inter,ui-sans-serif,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;color:#171715;font-size:10.5pt;line-height:1.5;background:#fff}
.page{width:210mm;min-height:297mm;padding:16mm 17mm 18mm;position:relative;page-break-after:always;background:#fffdf9}
.page:last-child{page-break-after:auto}
.brand{display:flex;justify-content:space-between;align-items:center;font-size:7.5pt;letter-spacing:.22em;color:#665f57;border-bottom:1px solid #d7cfc3;padding-bottom:8px;margin-bottom:22px}
.brand b{color:#171715}.brand b i{font-style:normal;color:#c8221c}
.foot{position:absolute;bottom:9mm;left:17mm;right:17mm;font-size:7.5pt;color:#8a8074;display:flex;justify-content:space-between;border-top:1px solid #e6dfd4;padding-top:6px}
h1{font-family:Georgia,"Times New Roman",serif;font-weight:400;font-size:34pt;line-height:1.02;letter-spacing:-.02em;margin:0 0 10px}
h2{font-family:Georgia,"Times New Roman",serif;font-weight:400;font-size:20pt;letter-spacing:-.01em;margin:0 0 10px}
h3{font-size:9pt;text-transform:uppercase;letter-spacing:.14em;color:#c8221c;margin:18px 0 8px}
p{margin:0 0 8px}
.eyebrow{font-size:8pt;text-transform:uppercase;letter-spacing:.18em;color:#c8221c;font-weight:700;margin-bottom:8px}
.lede{font-size:12.5pt;color:#3d3833;max-width:150mm}
.muted{color:#665f57}.small{font-size:8.5pt}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.grid4{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
.box{border:1px solid #d7cfc3;border-radius:10px;padding:12px 14px;background:#fff}
.box h4{margin:0 0 4px;font-size:10.5pt}
.box .n{font-family:Georgia,serif;color:#c8221c;font-size:16pt;line-height:1}
.facts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:16px 0}
.fact{border-top:2px solid #171715;padding-top:6px}
.fact b{display:block;font-family:Georgia,serif;font-weight:400;font-size:15pt}
.fact span{font-size:8pt;color:#665f57;text-transform:uppercase;letter-spacing:.08em}
table{width:100%;border-collapse:collapse;font-size:9pt}
th{text-align:left;font-size:7.5pt;text-transform:uppercase;letter-spacing:.08em;color:#665f57;border-bottom:1px solid #171715;padding:5px 6px}
td{border-bottom:1px solid #e6dfd4;padding:6px;vertical-align:top}
td.nowrap,th.nowrap{white-space:nowrap}
.tick{display:inline-block;width:10px;height:10px;border:1px solid #8a8074;border-radius:2px;margin-right:6px;vertical-align:-1px}
.gantt{margin:6px 0 4px}
.g-row{display:grid;grid-template-columns:62mm 1fr;align-items:center;min-height:30px;border-bottom:1px solid #eee7dd}
.g-name{font-size:9pt;font-weight:650;padding-right:8px}.g-name small{display:block;font-weight:400;color:#665f57;font-size:7.5pt}
.g-track{position:relative;height:30px}
.g-bar{position:absolute;top:8px;height:14px;border-radius:4px;background:#171715}
.g-bar.m1{background:#c8221c}.g-bar.m2{background:#3d3833}.g-bar.m3{background:#8a8074}
.g-head{display:grid;grid-template-columns:62mm 1fr;font-size:7.5pt;color:#665f57;text-transform:uppercase;letter-spacing:.08em}
.g-months{position:relative;height:16px}
.g-months span{position:absolute;top:0}
.g-review{position:absolute;top:0;bottom:0;width:0;border-left:1.5px dashed #c8221c}
.stage{display:flex;gap:6px;align-items:stretch;margin:8px 0}
.stage div{flex:1;border:1px solid #d7cfc3;border-radius:8px;padding:8px 10px;background:#fff}
.stage div b{display:block;font-size:9.5pt}
.stage .arrow{flex:0 0 auto;border:0;background:none;padding:0;align-self:center;color:#c8221c;font-size:14pt}
.q-sec{break-inside:avoid;margin-bottom:10px}
.q-sec h4{font-size:9.5pt;margin:10px 0 4px;border-bottom:1px solid #d7cfc3;padding-bottom:3px}
.q-sec ol{margin:0;padding-left:18px}.q-sec li{margin:2px 0;font-size:9pt}
.q-sec li em{color:#665f57;font-style:normal;font-size:8pt}
.callout{border-left:3px solid #c8221c;background:#f6f1e9;padding:10px 14px;border-radius:0 8px 8px 0;margin:10px 0}
.quote{font-family:Georgia,serif;font-style:italic;font-size:10.5pt;color:#3d3833}
/* script-only */
.time{display:inline-block;font-size:7.5pt;font-weight:700;letter-spacing:.08em;background:#171715;color:#fff;border-radius:999px;padding:2px 8px;margin-left:8px;vertical-align:3px}
.say{border-left:3px solid #c8221c;padding:2px 0 2px 12px;margin:8px 0;font-family:Georgia,serif;font-size:11pt;color:#171715}
.say p{margin:0 0 6px}
.note{font-size:9pt;color:#665f57;margin:4px 0 8px}
.ask li{margin:3px 0}
.faq{break-inside:avoid;margin-bottom:9px}.faq b{display:block;font-size:9.5pt}.faq p{margin:2px 0 0;font-size:9.5pt;color:#3d3833}
.private{position:absolute;top:9mm;right:17mm;font-size:7pt;letter-spacing:.2em;color:#c8221c;font-weight:800}
`;
const brand = (right) => `<div class="brand"><span>THE <b>GROWTH</b> <b><i>MACHINE</i></b></span><span>${esc(right)}</span></div>`;
const foot = (n, left) => `<div class="foot"><span>${esc(left)}</span><span>${n}</span></div>`;
const doc = (title, pages) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>${pages.join('')}</body></html>`;

/* ---------- Gantt (pure HTML, prints reliably) ---------- */
function gantt() {
  const s = new Date(cfg.start + 'T00:00:00').getTime(), e = new Date(cfg.end + 'T00:00:00').getTime() + 864e5;
  const pos = (iso) => ((new Date(iso + 'T00:00:00').getTime() - s) / (e - s) * 100);
  const months = [0, 1, 2].map((k) => { const d = new Date(cfg.start + 'T00:00:00'); d.setMonth(d.getMonth() + k); return d.toISOString().slice(0, 10); });
  const reviews = cfg.reviewDates.map((r) => `<div class="g-review" style="left:${pos(r)}%"></div>`).join('');
  return `<div class="gantt"><div class="g-head"><span></span><div class="g-months">${months.map((m, i) => `<span style="left:${pos(m)}%">Month ${i + 1} · ${fmtDate(m)}</span>`).join('')}</div></div>
  ${plan.map((p) => `<div class="g-row"><div class="g-name">${esc(p.name)}<small>${fmtDate(p.start)} – ${fmtDate(p.end)}</small></div><div class="g-track">${reviews}<div class="g-bar m${p.month}" style="left:${pos(p.start)}%;width:${Math.max(1.5, pos(addDays(p.end, 1)) - pos(p.start))}%"></div></div></div>`).join('')}
  </div><p class="small muted">Red dashed lines mark the fortnightly reviews with ${esc(cfg.contact)}. Phases overlap on purpose: quick wins start as soon as they are found.</p>`;
}

/* ================= LEAVE-BEHIND (shareable) ================= */
function leaveBehind() {
  const L = `${cfg.client} × The Growth Machine · Confidential`;
  const p1 = `<section class="page">${brand('Engagement approach')}
    <div class="eyebrow">${esc(cfg.client)} × The Growth Machine</div>
    <h1>How we'll work together</h1>
    <p class="lede">Operational efficiency and cost-reduction engagement, ${fmtDate(cfg.start, { day: 'numeric', month: 'long', year: 'numeric' })} to ${fmtDate(cfg.end, { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
    <div class="facts">
      <div class="fact"><b>3 months</b><span>Diagnose · Execute · Embed</span></div>
      <div class="fact"><b>${cfg.daysTotal} days</b><span>Senior consulting capacity</span></div>
      <div class="fact"><b>~${money(cfg.targetMonthly)}</b><span>Monthly recurring savings target</span></div>
      <div class="fact"><b>Fortnightly</b><span>Reviews with ${esc(cfg.contact)}</span></div>
    </div>
    <h3>The objective</h3>
    <p>Find, design and put in place improvements to how ${esc(cfg.client)} runs and what it costs. The shared target is around <b>${money(cfg.targetMonthly)} a month in sustainable, recurring operating-cost reductions</b>, and a business that is simpler to run and easier for its founders to oversee.</p>
    <h3>How I work</h3>
    <div class="grid4">
      <div class="box"><span class="n">01</span><h4>Listen before recommending</h4><p class="small muted">I start by understanding how work actually flows, from the people doing it, before proposing any change.</p></div>
      <div class="box"><span class="n">02</span><h4>Evidence, not opinion</h4><p class="small muted">Every recommendation shows its numbers: monthly impact, one-off cost, effort and risk.</p></div>
      <div class="box"><span class="n">03</span><h4>You decide</h4><p class="small muted">I recommend and help implement. You approve, fund and make all people decisions.</p></div>
      <div class="box"><span class="n">04</span><h4>Full transparency</h4><p class="small muted">You will always know where we are, what's next, the days used, and any delay and its cause.</p></div>
    </div>
    <h3>Who's involved</h3>
    <table><tr><td class="nowrap"><b>${esc(cfg.contact)}</b></td><td>${esc(cfg.contactRole)}. Approves priorities, spend and staffing changes.</td></tr>
    <tr><td class="nowrap"><b>Managers</b></td><td>Day-to-day contacts for information, interviews and implementation.</td></tr>
    <tr><td class="nowrap"><b>${esc(cfg.consultant)}</b></td><td>${esc(cfg.consultantRole)}. Leads the work.</td></tr></table>
    ${foot(1, L)}</section>`;

  const p2 = `<section class="page">${brand('The plan')}
    <div class="eyebrow">The plan</div><h2>Three months, six phases</h2>
    <p class="muted">The structure follows our Statement of Work. Month 1 diagnoses and prioritises, Month 2 designs and executes, Month 3 embeds and measures.</p>
    ${gantt()}
    <table style="margin-top:10px"><thead><tr><th>Phase</th><th class="nowrap">When</th><th>What happens</th><th>You get</th></tr></thead><tbody>
      <tr><td><b>1 · Kick-off</b></td><td class="nowrap">Week 1</td><td>Agree goals, priorities and sensitivities. Information request and questionnaire issued.</td><td>Shared plan; communication agreed</td></tr>
      <tr><td><b>2 · Foundations</b></td><td class="nowrap">Weeks 1–2</td><td>Review finances, costs, contracts and subscriptions. Map systems and where data lives.</td><td>Systems & data map; draft cost baseline</td></tr>
      <tr><td><b>3 · Listening</b></td><td class="nowrap">Weeks 2–3</td><td>Interviews with managers and team members. Key processes mapped step by step.</td><td>How work really flows, and where it gets stuck</td></tr>
      <tr><td><b>4 · Diagnose & prioritise</b></td><td class="nowrap">Weeks 3–4</td><td>Cross the data: costs, people, processes, tools. Quantify each opportunity.</td><td><b>Month-1 readout:</b> agreed baseline, ranked opportunities with monthly impact, roadmap</td></tr>
      <tr><td><b>5 · Design & execute</b></td><td class="nowrap">Month 2</td><td>Put approved initiatives in place: process changes, supplier and software savings, automation, dashboards, structure.</td><td>Working improvements and implementation notes</td></tr>
      <tr><td><b>6 · Embed & measure</b></td><td class="nowrap">Month 3</td><td>Adoption, training, refinement, handover. Measure what has been realised.</td><td>Savings report, handover, next-step roadmap</td></tr>
    </tbody></table>
    <p class="small muted" style="margin-top:8px">December falls over the festive period. We will plan days around it, and by agreement unused December days can move into January. We meet by ${fmtDate(cfg.continuationMeetingBy, { day: 'numeric', month: 'long' })} to discuss what happens after 1 February.</p>
    ${foot(2, L)}</section>`;

  const p3 = `<section class="page">${brand('Staying informed')}
    <div class="eyebrow">Staying informed</div><h2>You'll always know where we are</h2>
    <div class="grid2">
      <div class="box"><h4>Fortnightly review with ${esc(cfg.contact)}</h4><p class="small muted">30–45 minutes: progress, decisions needed, days used, savings and anything delayed.</p>
        <p class="small"><b>Proposed dates:</b> ${cfg.reviewDates.map((d) => fmtDate(d)).join(' · ')}</p></div>
      <div class="box"><h4>Status report</h4><p class="small muted">Sent after every review, and on request at any time. One page showing:</p>
        <p class="small">✓ Where we are in the plan<br>✓ What's done, and what's next<br>✓ What we're waiting on from you<br>✓ Consulting days used of ${cfg.daysTotal}<br>✓ <b>Delays & changes log</b><br>✓ Savings tracker</p></div>
    </div>
    <h3>Delays & changes log</h3>
    <p>Every delay is recorded as soon as it happens, whatever its cause: late information, access, approvals, new findings, or my side. Each entry has the date, the reason, the effect on the timeline and what we're doing about it. The log is in every status report. It isn't about blame. It keeps the timeline honest, so decisions are made on facts.</p>
    <h3>Savings tracker</h3>
    <p>In Month 1, together with your finance representative, we agree a baseline of recurring operating costs. Every initiative is then tracked through three stages:</p>
    <div class="stage"><div><b>Identified</b><span class="small muted">Found and estimated</span></div><span class="arrow">→</span><div><b>Approved</b><span class="small muted">You have approved it</span></div><span class="arrow">→</span><div><b>Realised</b><span class="small muted">Showing in actual spend</span></div></div>
    <p class="small muted">Savings are reported net of any new recurring costs. Recurring savings, one-off savings, implementation costs and time freed up (capacity) are always reported separately, so the monthly figure is never overstated.</p>
    <h3>How the interviews work</h3>
    <div class="grid2">
      <div class="box"><h4>Who and how long</h4><p class="small muted">Founders and managers: one-to-one, 60–75 minutes. Team members: 30–45 minutes, one-to-one or in small groups. With around ${esc(cfg.headcountEstimate)} people, that is roughly two to three days of conversations across Weeks 2–3.</p></div>
      <div class="box"><h4>Consistent and confidential</h4><p class="small muted">Everyone gets the same core questions, plus questions for their role and department, so answers can be compared. Findings are reported as themes, not attributed to individuals.</p></div>
    </div>
    <p class="small muted" style="margin-top:8px">Before their interview, each team member receives a short questionnaire (about 10 minutes), so the conversation can go straight to what matters.</p>
    ${foot(3, L)}</section>`;

  const p4 = `<section class="page">${brand('What I need from you')}
    <div class="eyebrow">What I need from you</div><h2>Getting started this week</h2>
    <div class="grid2">
      <div class="box"><span class="n">1</span><h4>Founder questions</h4><p class="small muted">We'll work through the key questions together, starting today, and I'll capture your answers as we talk. Nothing to fill in. Anything we don't cover comes to you afterwards as a short list or online form, to finish when convenient. The full list is at the back of this pack.</p></div>
      <div class="box"><span class="n">2</span><h4>Tell the team</h4><p class="small muted">Before interviews start, please introduce the engagement to the team. Hearing it from you first makes people more open. There is suggested wording on the last page.</p></div>
      <div class="box"><span class="n">3</span><h4>Information & documents</h4><p class="small muted">Please share the items below through the secure folder link I'll send (not by email: some of it is personal information, protected under POPIA).</p></div>
      <div class="box"><span class="n">4</span><h4>Time & decisions</h4><p class="small muted">Help scheduling interviews, and decisions within about five business days once a recommendation is ready, so momentum holds.</p></div>
    </div>
    <h3>Information & documents</h3>
    <table><thead><tr><th style="width:22px"></th><th>Item</th><th class="nowrap">Needed by</th></tr></thead><tbody>
      ${DOCUMENT_REQUESTS.map((d) => `<tr><td><span class="tick"></span></td><td>${esc(d.item)}</td><td class="nowrap">${fmtDate(addDays(cfg.start, d.dueDays), { weekday: 'short', day: 'numeric', month: 'short' })}</td></tr>`).join('')}
    </tbody></table>
    <p class="small muted" style="margin-top:8px">Approximate is better than nothing: if something doesn't exist or will take longer, tell me and I'll work around it.</p>
    ${foot(4, L)}</section>`;

  const qs = INTAKE_SECTIONS.filter((s) => s.id !== 'about');
  const qcol = (arr) => arr.map((s) => `<div class="q-sec"><h4>${esc(s.title)}</h4><ol>${s.questions.map((q) => `<li>${q.p ? '<b style="color:#c8221c">★</b> ' : ''}${esc(q.q)}${q.options ? ` <em>(${esc(q.options.join(' / '))}${q.other ? ' / other' : ''})</em>` : ''}</li>`).join('')}</ol></div>`).join('');
  const byId = (ids) => qs.filter((s) => ids.includes(s.id));
  const p5 = `<section class="page">${brand('Founder questionnaire')}
    <div class="eyebrow">Appendix A</div><h2>Founder questionnaire: the questions</h2>
    <p class="muted small">We'll cover these together, so there's nothing to prepare. Questions marked <b>★</b> are the ones we'll start with. Short answers are fine, and "don't know" is a useful answer too.</p>
    <div class="grid2" style="align-items:start"><div>${qcol(byId(['goals', 'revenue']))}</div><div>${qcol(byId(['cost', 'people']))}</div></div>
    ${foot(5, L)}</section>
    <section class="page">${brand('Founder questionnaire')}
    <div class="eyebrow">Appendix A, continued</div>
    <div class="grid2" style="align-items:start"><div>${qcol(byId(['tech']))}</div><div>${qcol(byId(['reporting', 'pain', 'practical']))}</div></div>
    ${foot(6, L)}</section>`;

  const p6 = `<section class="page">${brand('Team announcement')}
    <div class="eyebrow">Appendix B</div><h2>Suggested team announcement</h2>
    <p class="muted">Edit freely. It works best coming from the founders, by email or at a team meeting, before interviews begin.</p>
    <div class="callout quote">
      <p>Hi everyone,</p>
      <p>We've brought in Andrew Price from The Growth Machine for the next three months. He'll help us look at how ${esc(cfg.client)} works: our processes, systems and costs. The aim is to make the business simpler and more efficient to run.</p>
      <p>Andrew will speak with each of you over the next few weeks to understand how your work flows: what helps, what gets in the way, and what you would change. Please be open with him. Your experience is exactly what he needs.</p>
      <p>Before your conversation, you'll receive a short questionnaire from Andrew (about 10 minutes). It helps make the interview quicker and more useful.</p>
      <p>Conversations are confidential. Andrew reports themes, not who said what. If you have questions, speak to ${esc(cfg.contact)} or to us directly.</p>
    </div>
    <h3>Why this matters</h3>
    <p>People talk more openly when they hear about a review from leadership first, and understand why it is happening. The wording is honest about the focus (processes, systems and costs) without speculating about outcomes, because none have been decided.</p>
    ${foot(7, L)}</section>`;
  return doc(`${cfg.client} × The Growth Machine: How we'll work together`, [p1, p2, p3, p4, p5, p6]);
}

/* ================= PRIVATE SCRIPT ================= */
function script() {
  const L = `PRIVATE: ${cfg.consultant} only · Kick-off with ${cfg.client}`;
  const P = '<div class="private">PRIVATE · DO NOT SHARE</div>';
  const p1 = `<section class="page">${P}${brand('Kick-off meeting · talk track')}
    <div class="eyebrow">${esc(cfg.client)} kick-off · ${longDate(cfg.start)}</div>
    <h1>Your talk track</h1>
    <p class="lede">About 60 minutes. Goal: walk out signed, trusted, with a shared plan, and with the information requests and next dates agreed.</p>
    <h3>Before you walk in</h3>
    <p><span class="tick"></span>Contract blanks filled: client legal name, registration number, address, both notice emails, client signatory name and title.<br>
    <span class="tick"></span>Two printed leave-behinds (or the PDF ready to send).<br>
    <span class="tick"></span>Laptop charged. Studio open: ${esc(cfg.client)} → Discovery → <b>▶ Live founder session</b> (★ priority questions only switched on).<br>
    <span class="tick"></span>Founder Google Form tested (backup for anything you don't cover). Staff questionnaire form created, to send only after the team has been told.<br>
    <span class="tick"></span>Secure shared folder created for the documents (one folder per client, founder-only).<br>
    <span class="tick"></span>Studio → Progress & time set up (Create plan), so you can log the meeting straight afterwards.</p>
    <h3>Running order</h3>
    <table><thead><tr><th>#</th><th>Section</th><th class="nowrap">Time</th><th>Outcome</th></tr></thead><tbody>
      <tr><td>0</td><td>Housekeeping: sign the agreement</td><td>5</td><td>Signed. The meeting becomes Day 1, not a sales call</td></tr>
      <tr><td>1</td><td>Open</td><td>3</td><td>Set the tone</td></tr>
      <tr><td>2</td><td>Founder session, part 1: their view (typed live)</td><td>10</td><td>Their words anchor everything that follows</td></tr>
      <tr><td>3</td><td>How I work + the plan</td><td>8</td><td>Confidence in the structure</td></tr>
      <tr><td>4</td><td>Target, measurement & transparency</td><td>5</td><td>No surprises later about R150k or delays</td></tr>
      <tr><td>5</td><td>Founder session, part 2: ★ priority questions</td><td>20</td><td>Enough to start Monday's work; gaps flagged automatically</td></tr>
      <tr><td>6</td><td>What I need & agree dates</td><td>6</td><td>Owners and dates for every request</td></tr>
      <tr><td>7</td><td>Close</td><td>3</td><td>Recap, next contact, first review booked</td></tr>
    </tbody></table>
    <div class="callout"><b>Mindset:</b> you're there to understand, not to impress. Say less than you want to in the first 20 minutes. The founders should leave feeling heard <i>and</i> that you have a firm grip on the process.</div>
    ${foot(1, L)}</section>`;

  const p2 = `<section class="page">${P}${brand('Talk track')}
    <h2>0 · Housekeeping <span class="time">5 MIN</span></h2>
    <div class="say"><p>"Before we get into it, let's get the paperwork done, so this meeting is officially day one."</p></div>
    <p class="note">Sign first. It changes the dynamic from "selling" to "working". Confirm ${esc(cfg.contact)} as the single point of contact and decision-maker (clause 5.1).</p>
    <h2>1 · Open <span class="time">3 MIN</span></h2>
    <div class="say"><p>"Thank you for trusting us with this. Over the next three months my job is to understand how ${esc(cfg.client)} really runs, find where money and time leak, and help you fix what matters most. I'm not here to hand you a deck and disappear: I'll be in it with you."</p>
    <p>"Today I want to do three things: hear your view first, walk you through how I'll run this, and agree what I need from you so we can move fast from Monday. I'll type as you talk, so nothing gets lost and you won't have to fill in a long form later."</p></div>
    <h2>2 · Founder session, part 1: their view <span class="time">10 MIN</span></h2>
    <p class="note">Studio → Discovery → ▶ Live founder session → pick the person. It saves as you type. Start with <b>1. Goals & success</b>. Ask, then stop talking, and capture their exact words: you'll quote them back in the Month-1 readout.</p>
    <ol class="ask">
      <li>Warm-up (type into "Anything else they raised"): "What made now the right time to bring someone in?" and "What worries you most about this process?"</li>
      <li>★ "If we're sitting here on 1 February and this has gone brilliantly, what has changed?"</li>
      <li>★ "What are the three things you most want fixed or improved?"</li>
      <li>★ "Is anything off-limits, already decided or sensitive that I should know before I start?"</li>
    </ol>
    <h2>3 · How I work + the plan <span class="time">8 MIN</span></h2>
    <p class="note">Hand over the leave-behind. Page 1 (principles), then page 2 (plan).</p>
    <div class="say"><p>"Four principles. I listen before I recommend. Everything I recommend comes with numbers. You make the decisions, especially anything involving people. And you'll always know where we are."</p>
    <p>"Month 1 is diagnosis: information, systems, interviews and a cost baseline, ending in a readout with ranked opportunities and their monthly value. Month 2 we execute what you approve. Month 3 we embed it, measure it and hand it over. Quick wins don't wait for the readout: if I find an unused subscription in week one, we cancel it in week one."</p></div>
    ${foot(2, L)}</section>`;

  const p3 = `<section class="page">${P}${brand('Talk track')}
    <h2>4 · Target, measurement & transparency <span class="time">5 MIN</span></h2>
    <div class="say"><p>"The target is around ${money(cfg.targetMonthly)} a month in recurring savings. I take it seriously. To keep it honest, we'll agree a cost baseline in Month 1 with whoever looks after your finances. Every initiative is then tracked through three stages: identified, approved, realised. Savings are net of any new costs, and one-off savings or time freed up are reported separately, so the number is never inflated."</p>
    <p>"You get a status report after every fortnightly review, or whenever you ask. It shows the days used out of ${cfg.daysTotal}, what's done, what's next, what I'm waiting on, and a <b>delays and changes log</b>. If something slips, whether it's my side or yours, a document arriving late or a decision taking longer, it's logged with the date, reason and impact. Not to point fingers, but so we always decide on facts."</p></div>
    <p class="note">This is your protection under clauses 3.3 and 5.6–5.7. Frame it as mutual accountability, which it genuinely is. Log your own slips too: that's what makes the log credible.</p>
    <h2>5 · Founder session, part 2: ★ priority questions <span class="time">20 MIN</span></h2>
    <p class="note">Back to the Studio. With "★ Priority questions only" on, the screen shows the ~15 that shape next week, in order: revenue (strongest, weakest, top-client share), costs (biggest lines, upcoming renewals), people (headcount, structure), systems (CRM, accounting, where the platform is hosted), top frustrations, and which managers to see first plus how to tell the team.</p>
    <table><tbody>
      <tr><td><b>Pace</b></td><td>About a minute per question. Capture the gist, not every word. Choice questions take a dropdown; you can also type freely.</td></tr>
      <tr><td><b>Switching to the MD</b></td><td>Click <b>Switch person</b> and start a new respondent. Questions someone else has answered show "answered by …", so skip them unless a second view is useful.</td></tr>
      <tr><td><b>Out of time?</b></td><td>Click <b>Done for now</b>. Whatever was answered is saved; everything else is listed under Discovery as <b>⚑ Still needed</b>. Send it afterwards with <b>Copy outstanding questions</b>, or send the Google Form link. Form answers merge in without overwriting anything.</td></tr>
      <tr><td><b>If you only get 5 minutes</b></td><td>★ What success looks like · ★ biggest costs · ★ contracts renewing soon · ★ main systems · ★ which managers first.</td></tr>
    </tbody></table>
    ${foot(3, L)}</section>`;

  const p4 = `<section class="page">${P}${brand('Talk track')}
    <h2>6 · What I need & agree dates <span class="time">6 MIN</span></h2>
    <p class="note">Leave-behind page 4. Get a name and a date against every item. If they hesitate on payroll data, see the FAQ.</p>
    <div class="say"><p>"Here's what I need to start properly. Anything we didn't get to today, I'll send as a short list, five minutes at most. The documents go into a secure folder I'll share, not over email. And it would help a lot if you could tell the team before I start. There's suggested wording at the back. Once you have, I'll send each team member a 10-minute questionnaire before their interview."</p></div>
    <p><span class="tick"></span>Who sends the org chart / staff list, and the payroll?<br><span class="tick"></span>Who owns finance data (the baseline validator)?<br><span class="tick"></span>Who grants read-only system access?<br><span class="tick"></span>Team announcement: who sends it, and when?<br><span class="tick"></span>Staff list with email addresses, for the 10-minute questionnaire (sent after the announcement)?<br><span class="tick"></span>Decision turnaround of about 5 business days: agreed?<br><span class="tick"></span>Fortnightly review slot booked with ${esc(cfg.contact)} (first: ${fmtDate(cfg.reviewDates[0], { weekday: 'short', day: 'numeric', month: 'short' })}).</p>
    <h2>7 · Close <span class="time">3 MIN</span></h2>
    <div class="say"><p>"So: documents by the dates on page 4, the team hears from you first, then I send each person the short questionnaire, and our first review is on ${fmtDate(cfg.reviewDates[0], { weekday: 'long', day: 'numeric', month: 'long' })}. You'll get a short written summary of today by tomorrow. Anything you'd like me to do differently from what you've heard?"</p></div>
    <h3>Straight after the meeting</h3>
    <p><span class="tick"></span>Send the email: thank-you, secure folder link, leave-behind PDF, the date list, plus any outstanding founder questions (Discovery → Copy outstanding questions) or the founder form link.<br>
    <span class="tick"></span>After the team announcement: send the staff questionnaire link to each person individually.<br>
    <span class="tick"></span>Studio → Progress: log the time, mark Kick-off in progress, record requests as "issued" with due dates.<br>
    <span class="tick"></span>Studio → Business: add what you learned (sector, goals, sensitivities, systems).<br>
    <span class="tick"></span>Note anything that should become a delay or risk entry.</p>
    ${foot(4, L)}</section>`;

  const faqs = [
    ['"Will people lose their jobs?"', "I can't promise either way, and I won't pretend to. My job is to find the best way for the business to run, and that usually starts with processes, tools and supplier costs. If roles are affected, that's your decision, made properly with HR and legal advice and handled fairly. I'd suggest we're honest with the team without creating alarm. Nothing has been decided."],
    ['"Can you guarantee the R150k a month?"', "It's a shared target, not a guarantee, and the agreement says so. What I can promise is that every opportunity will be quantified, tracked through identified, approved and realised, and reported honestly, so you always know where we stand."],
    ['"Why do you need salary information?"', "People are usually the biggest cost line. Without payroll I can't build an honest baseline or compare options. It stays confidential: secure folder, founder-only reporting, never shown to staff."],
    ['"How much of your time do we actually get?"', `Up to ${cfg.daysPerMonth} days a month, ${cfg.daysTotal} in total. You'll see the days used at every fortnightly review.`],
    ['"What if someone won\'t cooperate or info is slow?"', `I'll raise it with ${cfg.contact} in writing, quickly and with specifics. It goes in the delays log so its effect on the timeline is visible. The agreement asks for intervention within two business days.`],
    ['"What about December?"', 'We plan around the festive period. By agreement, unused December days can move into January. The total stays at 30.'],
    ['"Will you build software for us?"', "Where it's the best fix. Often configuring what you already have, or buying something off the shelf, is cheaper. Anything built specifically for you is yours, documented, and runs in your own accounts."],
    ['"Who sees what staff tell you?"', 'You see themes and evidence, not who said what. That confidentiality is what makes people honest, and honest input is what makes the recommendations right.']
  ];
  const p5 = `<section class="page">${P}${brand('If they ask…')}
    <h2>If they ask…</h2>
    ${faqs.map(([q, a]) => `<div class="faq"><b>${esc(q)}</b><p>${esc(a)}</p></div>`).join('')}
    <h3>Watch for</h3>
    <p class="small">• Founders disagreeing on priorities: note both views, don't resolve it in the room. It's diagnostic gold.<br>
    • "We already know the answer": ask what stopped them doing it. That's usually the real problem.<br>
    • Anyone named as a problem person: listen, don't agree. Form your own view from the interviews.<br>
    • The headcount: confirm the real number. It changes the interview plan (2 days for ~20 people, more beyond 25).</p>
    ${foot(5, L)}</section>`;
  return doc(`PRIVATE · Kick-off talk track · ${cfg.client}`, [p1, p2, p3, p4, p5]);
}

/* ================= GOOGLE FORM GENERATOR (Apps Script) ================= */
function appsScript(kind) {
  const staff = kind === 'staff';
  const sections = staff ? STAFF_SECTIONS : INTAKE_SECTIONS;
  const title = staff ? `${cfg.client}: Team questionnaire (10 minutes)` : `${cfg.client} × The Growth Machine: Founder questionnaire`;
  const fn = staff ? 'createStaffForm' : 'createIntakeForm';
  const desc = staff
    ? "Thanks for taking about 10 minutes. Short answers are perfect. Your answers go to Andrew Price (The Growth Machine) to prepare your conversation with him. Findings are reported as themes, not attributed to individuals."
    : "Thank you for taking the time. Answer what you can; short answers are fine and \"don't know\" is useful too. You can come back and edit your answers after submitting. Your responses go straight to Andrew Price (The Growth Machine) and are kept confidential.";
  const spec = sections.map((s) => ({ title: s.title, intro: s.intro || '', questions: s.questions.map((q) => ({ id: q.id, q: q.q, type: q.type, required: !!q.required, options: q.options || [], other: !!q.other, help: q.help || '', low: q.low, high: q.high })) }));
  return `/**
 * Creates the "${title}" Google Form, plus a linked Google Sheet that collects every response.
 *
 * HOW TO USE (about 3 minutes):
 *  1. Go to https://script.google.com and click "New project".
 *  2. Delete the sample code, paste this whole file in, and press Cmd+S (save).
 *  3. Choose the function "${fn}" in the toolbar and click Run. Approve the permissions (it's your own script).
 *  4. Open "Execution log": it prints the link to send, the edit link and the responses Sheet.
 * Run it ONCE: every run creates another form.
 * Generated by Growth Machine Studio. Question titles map answers back to the Studio when you import the responses CSV.
 */
var SPEC = ${JSON.stringify(spec, null, 1)};

function ${fn}() {
  var form = FormApp.create(${JSON.stringify(title)});
  form.setDescription(${JSON.stringify(desc)});
  form.setProgressBar(true);
  form.setAllowResponseEdits(true);
  form.setCollectEmail(false);
  try { form.setRequireLogin(false); } catch (e) { /* only applies to Google Workspace accounts */ }
  SPEC.forEach(function (sec, i) {
    if (i > 0) form.addPageBreakItem().setTitle(sec.title).setHelpText(sec.intro || '');
    else form.addSectionHeaderItem().setTitle(sec.title).setHelpText(sec.intro || '');
    sec.questions.forEach(function (q) {
      var item;
      if (q.type === 'short') item = form.addTextItem();
      else if (q.type === 'long') item = form.addParagraphTextItem();
      else if (q.type === 'choice') { item = form.addMultipleChoiceItem(); item.setChoiceValues(q.options); if (q.other) item.showOtherOption(true); }
      else if (q.type === 'checkbox') { item = form.addCheckboxItem(); item.setChoiceValues(q.options); if (q.other) item.showOtherOption(true); }
      else if (q.type === 'scale') { item = form.addScaleItem(); item.setBounds(1, 5).setLabels(q.low || '', q.high || ''); }
      else item = form.addParagraphTextItem();
      item.setTitle(q.q);
      if (q.help) item.setHelpText(q.help);
      if (q.required) item.setRequired(true);
    });
  });
  var ss = SpreadsheetApp.create(${JSON.stringify(title + ': responses')});
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  Logger.log('${staff ? 'SEND THIS LINK TO EACH TEAM MEMBER' : 'SEND THIS LINK TO THE FOUNDERS'}: ' + form.getPublishedUrl());
  Logger.log('Edit the form: ' + form.getEditUrl());
  Logger.log('Responses sheet: ' + ss.getUrl());
}
`;
}

fs.writeFileSync(path.join(outDir, 'leave-behind.html'), leaveBehind());
fs.writeFileSync(path.join(outDir, 'kickoff-script.html'), script());
fs.writeFileSync(path.join(outDir, 'intake-form.gs'), appsScript('intake'));
fs.writeFileSync(path.join(outDir, 'intake-form (paste into Google Apps Script).txt'), appsScript('intake')); // .txt opens in any text editor
fs.writeFileSync(path.join(outDir, 'staff-form (paste into Google Apps Script).txt'), appsScript('staff'));

(async () => {
  let chromium;
  try { chromium = require('playwright').chromium; } catch (e) { console.log('Playwright not available: HTML written, PDFs skipped.'); return; }
  const browser = await chromium.launch();
  for (const f of ['leave-behind', 'kickoff-script']) {
    const page = await browser.newPage();
    await page.goto('file://' + path.resolve(outDir, f + '.html'));
    await page.pdf({ path: path.join(outDir, f + '.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
    await page.close();
  }
  await browser.close();
  console.log('Pack written to ' + outDir);
})();
