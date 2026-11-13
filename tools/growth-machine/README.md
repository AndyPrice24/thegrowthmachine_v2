# Growth Machine Studio

The Growth Machine's internal diagnostic tool, built for use across every client. You put a client's business into it (profile, finances, people and org, tools, processes, customers and markets, interviews) and it shows:

- **Client register and client health** (Evidence → Clients): loads a client's own contract register (contracts, renewals due, out-of-contract, check-ins overdue, satisfaction, upsells, clients per CSM, watchlist) and their Client Success scoring (effort to serve × adoption). Personal contact details are never loaded.
- **Visuals of the current state.** Org chart, process flows, tool stack and overlap, finance trends, customer concentration.
- **Business processes and flows.** Choose **Department view** (one primary department, then tick the processes it is involved in; other departments' steps are shown in full, the primary department highlighted) or **Process view** (tick processes, then the departments to show; unticked departments shrink to grey markers). Processes have no fixed stages: each has an optional group label (e.g. Client lifecycle, Product, Finance) and can **trigger** other processes; linked processes are drawn as one chain with "triggers" markers, unlinked ones side by side. Then pick **Flow** (snaking, colour-coded by department) or **Swimlane** (one row per department, hand-offs crossing rows, a tools strip showing shared tools), **Executive view**; size controls and **Export** (with Anonymise, and SVG/HTML under More) sit above the visual. Steps per row are set automatically. The right-hand panel shows key takeaways, or the clicked step in context (comes from / goes to, hand-offs, warnings, edit, flags). Summaries underneath: at a glance, tools and systems, still to measure, linked findings, and process details (edit name, group, trigger links, summary, talking points). Operations can be split into departments such as Ops: Onboarding and Ops: Tech & maintenance.
- **Top break points.** In Executive view, steps are scored (issues by severity: high ×4, medium ×2, low ×1; weak hand-offs ×1.5; time hotspots ×1). A step is marked as a break point only when it stands out (at least half the top score); a tie is never split, ties show as "#1=", and when every step scores the same none is singled out. Other steps with problems are just outlined. Issues can be resolved or put on hold. Set an issue's severity in ✎ Edit step.
- **Executive view** (on/off, single process and journey views): on shows issues, weaknesses, decision points, management involvement and time hotspots (≥2 days waiting or ≥1 hour hands-on, marked ⏱); off shows only steps, people, systems and hand-offs.
- **Automation opportunities** (Leaks & opportunities): where work could run itself, ranked with the client's current or planned systems first (⚙ built in, ⇄ connect systems), then AI (✦), then work already under way and size. Each item says what it takes away, the system it uses, status, effort and the next step. Each one sits under the recommendation it belongs to (`recommendationId`): the row links to it on Plan ("Part of the fix") and lists the findings it solves; on Plan each recommendation lists its automations ("Runs itself"), and the leak list shows ⚙ on fixes that can partly run themselves. Unlinked automations are flagged in "Needs your input". "To check first" lists the questions that decide whether it works here (`questions`). Stored in the `automations` collection; private items are hidden in screen share.
- **Where every figure comes from.** Findings, recommendations, automations and opportunities show a numbered "Where this comes from" index; each entry opens that source in the Source register (which shows how many items cite it). Recommendations inherit the sources of the findings they fix, and automations those of their recommendation. Items that state a figure with no source are flagged ("No source yet", and "figures with no source" in Needs your input, which filters the leak list). The status report numbers its citations and ends with "Where the figures come from".
- **Updates folder** (Sources & data, and **⟳ Updates** in the top bar; Chrome or Edge): Claude puts each stamped update file into the private **TGM Studio updates** folder in Google Drive, which Google Drive for desktop syncs to your computer. Pick that folder once per session (the picker opens in it); **Check for updates** then merges every new file oldest first, each into the client its `_meta.client` names, skips files already in the merge history, ignores backups and unreadable files, and saves a full backup into the folder's `backups/` subfolder. The folder itself isn't remembered between sessions (reading a stored folder handle back crashed the browser in testing); only its name is.
- **Find and replace** (Sources & data): corrects a word everywhere in a client (e.g. a misspelt product name) across findings, recommendations, processes, interviews, questions and notes. It shows the count per area before changing anything and never touches IDs or the merge history.
- **Assume, then sense-check.** Build your assumed flow in the step panel (✎ Edit step: name, team, who, system, manual/automated, hands-on minutes, waiting days, who else gets involved, decision points with what happens if not; add, move or delete steps). Times you enter are marked ≈ (assumed). Then **▶ Sense-check** walks the flow live with a decision maker: for each step they say ✓ yes, ✎ mostly (you correct it on the spot), ? not sure, or ✕ doesn't happen; you can add missing steps, concerns they raise and notes, and tick off your own questions (hidden by default, for screen-sharing). Step numbers turn green when confirmed, amber when unsure, red when they don't happen; the process shows who checked it and becomes *Corroborated*. **Sense-check sheet (PDF)** prints the assumed flow plus a table per step (Is this right? ☐ Yes ☐ Partly ☐ No, corrections) for anyone you can't walk through it live.
- **Crossover signals** (shown on Home, marked "auto"). It crosses the data sets, e.g. payroll against revenue, people against processes (who carries what, single points of failure, overload), tools against pain points, interview themes against departments.
- **Ranked recommendations** (Plan). Each one is scored on value, effort, risk and confidence, and says how it will stick (`stick`) and who owns it (`owner`).
- **Scenarios** (Plan). A scenario is a set of recommendations applied to the current state. Plan, Processes and Evidence can switch between "current" and any scenario, with changes flagged as New / Changed / Removed.
- **A founder report.** Print it to PDF or download it as one self-contained HTML file. It holds no raw data and needs neither this tool nor Claude to open.

## The seven pages
Each page answers one question. Older page names still work as links and redirect.

| Page | The question it answers | What's on it |
|---|---|---|
| **Leaks & opportunities** (home) | What's leaking, what's it worth, and what needs me today? | Money at stake (leaking, at risk, spend to review, upside), savings approved against the target, a **Needs your input** strip (overdue client items, items with no action, items not sized, to-dos past their date), then the ranked list (top 5, "Show all"). |
| **Plan** | What do we suggest, how will it stick, and what will it save? | Savings against the target, recommendations by stage (Identified → Approved → In progress → Realised; top 5 per stage), each with "How it sticks" and owner; scenarios as bundles of recommendations. |
| **Processes** | Where does work break? | Department view and Process view (unchanged). |
| **Evidence** | What proves it? | Tabs: Money (finance), Clients (segments, concentration, revenue leaks, register, health), People (org, department scorecard, who carries which process), Tools, Market (competitors, opportunities, business profile). |
| **Conversations** | Who do we ask what next? | **By person**: prepared questions in run order (★ first), what they've answered, and the data requests they owe; Start interview. Plus Interviews and Discovery. |
| **Progress & reports** | Are we on track, and who owes whom? | Progress & time; Reports (status report, founder report, feedback cheatsheet). |
| **Sources & data** | Where did every number come from? | Source register, back up / restore / merge, paste from Claude, find and replace, edit data. |

**Answers and open questions.** An answer counts wherever it was given (an interview's `answers`, keyed by question id),
so one person can answer another's question; By person shows who answered and when. An answer that starts with
"Partly" records what is known and leaves the question open; the question is then narrowed to what is still missing
(`qWas` keeps the original). The interview form keeps the person's earlier answers folded under each question (open to see), so they don't lead the conversation. Answers given
by someone else are hidden in screen-share mode. Founder questionnaire answers that start with "Partly" stay outstanding.
Merging an update adds answers to an interview; it never wipes answers captured in the Studio.

**View as** (current state or a scenario) appears only on Plan, Processes and Evidence. Empty sections fold away (no delays
logged, no staff survey responses).

**Screen share** (top bar): names show as roles, and TGM-only material is hidden: 🔒 reminders, the work diary and
confidential interview points. Switching it off restores your Anonymise setting.

## Running an engagement (Progress & time, Discovery)

- **Progress & time.** Enter the contract basics once: point of contact, start and end dates, day allowance, savings target. The Studio then creates the standard three-month plan, the client information requests (with due dates) and the first activities. From then on it tracks:
  - **⚑ Delays & changes log.** Its own section, flagged in red. Each entry records the date raised, phase, cause (client information, access, decisions, cooperation, new findings, scope, TGM side), days of impact, the date written notice was sent, status and resolution. Open delays show as a badge on every screen and in every status report. Logged slips appear on the timeline.
  - **TGM-only activities.** An activity with `"private": true` shows a 🔒 TGM only chip and is never suggested into the client status report (use it for internal reminders such as proposals).
  - **Work diary (private).** One line per working day: half or full day, plus what happened. No hours, no durations. Things recorded in the Studio that day (interviews by role, founder sessions, documents received, activities done, delays) appear automatically. Export it as CSV only if someone asks to see it.
  - **Waiting on client.** Requests turn *Overdue* automatically. One click turns an overdue item into a delay entry.
  - **Done / in progress / next.** Marking an activity Done stamps the date.
  - **Savings tracker.** Monthly recurring savings net of new recurring costs, by stage (Identified → Approved → Realised), against the target. One-off savings, one-off costs and time freed are reported separately.
- **Status report** (Report → Status report). Output-led by design: a headline, what was delivered (3–6 outputs), the next fortnight, interviews by role (never names), what we need from the client, **Delays & changes** (always included), the savings tracker, and **one capacity line** ("Month 1: 9.5 of 10 days used"). The work diary is attached only if you switch it on. Print it to PDF or download it as HTML.
- **Discovery.** Every answer is stored against a discovery criterion (`src/questions.js`). The coverage matrix shows which criteria are well evidenced and which are gaps.
  - **Capture an interview.** Pick a person from the org chart. Their level (founder, manager or staff) and department choose the questions: core questions for everyone, plus level and department sets. "Unexpected points" are tagged to a criterion too. Drafts save as you type, and the interview's duration can go straight into the time log.
  - **Founder questionnaire.** `pack/build-pack.cjs` generates a Google Apps Script that creates the Google Form. To bring responses in, export the response Sheet as CSV and import it. Columns map back to question ids by title.

## Client kick-off pack

```bash
node tools/growth-machine/pack/build-pack.cjs clients/<client>/pack.config.json
```

This builds the founder leave-behind PDF, a private talk-track PDF and the Google Form script, from a per-client config. `clients/` is git-ignored: client material never goes into this repository.

## How to open it

Open `dist/growth-machine-studio.html` in Chrome, Edge or Safari. That's it: no server, no install, no login. It works offline.

It loads with two clients:
- **Location Bank.** An empty shell with only public facts filled in.
- **Demo Co (fictional sample).** Invented data that shows every feature. Delete it once you're comfortable.

## Where the data lives (read this)

- The tool auto-saves into **this browser's local storage**. That is convenient, but it is **not a backup**. Clearing the browser, or switching computer or browser, loses it.
- **Back up after every working session** (top bar → *Back up*; it downloads everything saved for that client). Keep the `.tgm.json` files in a **private** folder you control, e.g. a Google Drive folder per client.
- **Never commit client files to this repository.** This repo deploys the public website. `.gitignore` blocks `*.tgm.json` and `tools/growth-machine/clients/` as a safety net.
- Client files contain salaries, names and possibly redundancy scenarios. Treat them as confidential HR data (POPIA applies to South African clients).

## Working with Claude

The tool is deliberately **Claude-friendly but not Claude-dependent**:

1. **Sources & data → Copy Claude prompt.** Paste it into Claude, then paste your raw material underneath: interview notes or transcripts, an org list, a P&L export, a process description.
2. Claude returns JSON in the Studio's format.
3. **Sources & data → Paste from Claude → Merge.** New records are added, and records with the same `id` are updated. Nothing is deleted.
4. To get Claude's analysis, use **Copy client JSON for Claude**, paste it into a conversation and ask, e.g., "draft recommendations with ops for the onboarding process".

5. Update files Claude produces in a Claude Code session also go into the **TGM Studio updates** Drive folder: click **⟳ Updates** instead of merging them one by one.

Tip: keep one Claude Project per client, holding the interview transcripts and the latest exported JSON.

## The data model (schema `tgm.engagement/1`)

One JSON file per client:

| Section | What it holds |
|---|---|
| `client` | name, sector, sub-sector, business model, revenue model, goals, constraints |
| `meta` | currency (ISO code, e.g. `ZAR`), engagement start, last export |
| `departments` | id, name, head |
| `people` | id, name, title, department, manager, employment type, FTE, annual cost |
| `tools` | id, name, category, monthly cost, seats, active users, departments using it |
| `processes` | id, name, owner, runs per month, inputs/outputs, **steps** (actor, tool, minutes, manual/automated, pain point) |
| `segments`, `markets`, `topClients` | customer segments (customers, revenue, churn), market share, largest accounts |
| `financePeriods` | label, months covered, revenue, COGS, payroll, tools, marketing, premises, other |
| `interviews` | person, date, summary, **themes** (consistent tags), pain points, ideas, quotes |
| `findings` | evidenced findings with severity |
| `recommendations` | title, type, horizon, effort/risk/confidence (1–5), one-off cost, other savings, revenue uplift, status, **ops** |
| `scenarios` | name, description, list of recommendation ids |
| `report` | title, audience, scenario to present, sections, summary, next steps, anonymise flag |

### Recommendation "ops": how proposed changes are modelled

A recommendation's `ops` describe exactly what it changes. The Studio applies them to the current state to build each scenario:

```json
{"op":"removePerson","personId":"p12"}
{"op":"addPerson","person":{"id":"p_new","name":"(Hire) RevOps lead","title":"RevOps Lead","departmentId":"d_ops","managerId":"p2","annualCost":700000}}
{"op":"updatePerson","personId":"p17","changes":{"managerId":"p2","fte":1}}
{"op":"removeTool","toolId":"t2"}
{"op":"addTool","tool":{"id":"t_new","name":"Billing automation","category":"Billing","monthlyCost":3000}}
{"op":"updateTool","toolId":"t1","changes":{"seats":6,"monthlyCost":13500}}
{"op":"updateStep","processId":"pr1","stepId":"s3","changes":{"durationMins":30,"automated":true}}
{"op":"removeStep","processId":"pr2","stepId":"s2"}
{"op":"addStep","processId":"pr2","afterStepId":"s1","step":{"name":"Auto-send report","automated":true}}
{"op":"addProcess" | "removeProcess" | "updateProcess" | "addDepartment" | "updateDepartment" | "removeDepartment", ...}
```

When a person is removed, their direct reports move up to that person's manager.

### How the numbers are calculated (so you can defend them)

- **Process hours/month** = Σ(step minutes) × runs per month ÷ 60. Staff cost per step uses the actor's hourly rate (annual cost ÷ (FTE × 1,760 h)).
- **Cash saving** = payroll removed + tool spend removed + any `otherAnnualSaving`.
- **Hours freed** are shown as *capacity*. They become cash only when headcount changes. The model never pretends otherwise.
- **Priority score (0–100)** = 50% value + 20% low effort + 15% low risk + 15% confidence. Value = cash + revenue uplift + 50% of the freed-capacity value.
- Each recommendation is scored on its own, against the current state. Scenario totals apply the recommendations together.

## Editing the tool

The source is in `src/`. Rebuild the single file after changes:

```bash
node tools/growth-machine/build.mjs
```

| File | Purpose |
|---|---|
| `src/model.js` | schema, scenario engine, metrics, scoring, crossover rules |
| `src/charts.js` | bars, lines, stacked columns, heatmap, org chart, swimlane |
| `src/flows.js` | flow schematic, warnings (issue / unverified / weakness), sense-check, exports |
| `src/processes.js` | Business processes page: department / process view, chains, swimlane, takeaways, summaries |
| `src/views.js` | each tab |
| `src/report.js` | founder report + HTML export |
| `src/app.js` | storage, navigation, data editor, Claude bridge |
| `src/demo.js` | fictional demo + Location Bank shell |
| `src/*.css` | styles (`viz.css` and `report.css` are also embedded in exported reports) |

## Known limits of v1 (honest list)

- Single user, single browser. There is no shared editing with Tarren yet. For now, share the exported JSON file.
- Data entry is a spreadsheet-style grid plus JSON for nested lists. Claude is the fast route for bulk input.
- Crossover rules use fixed thresholds (e.g. "more than 60% manual"). Tune them in `src/model.js` → `insights()` as we learn what matters.
- Org charts over ~80 people get wide. Use zoom, or filter by department (not built yet).

### Leaks & opportunities (the machine's main view)
One ranked list of everything found, sorted into five lenses: leaks, weaknesses, holes, opportunities and tools.
- Sources: findings (`kind`, `valueMonthly`, `basis`, `partOf`, `fixId`), opportunities, and signals the crossover rules spot automatically.
- Each row shows severity, money at stake per month and its basis (leaking, at risk, spend to review, upside), plus the linked fix,
  or "No action yet".
- Click a row to see the evidence and set its lens, size, basis, fix, or the bigger item it belongs to. A nested item is never
  counted twice in the totals.
- "Biggest first" ranks by money at stake: leaking counts in full, at risk and upside at half, spend to review at a fifth.
- An item counts as actioned when it has a fix (a recommendation) or a next step (a question for a named role or a data request).
- The "Needs your input" strip counts items with no action and items not sized; click a count to filter the list.

### Client growth (NRR) (Evidence → Client growth; also Reports → Client growth)
Answers "are clients and resellers growing or shrinking?" for an NRR objective (`client.nrr.target`). Version 1 is built
from `revenueMovements` (New & Lost), monthly revenue in `financePeriods` and the client register: NRR and gross retention
for the last 12 months of revenue data, expansion vs contraction and churn by month and by financial year, managed vs
resellers, locations by channel, accounts growing, shrinking or lost, upsell candidates (adoption of 63% or more, no
PercepXion, no warning signs) and shrink risk at renewal. A client that left and re-signed counts as a downgrade or
growth. Every figure is an estimate until billing per account arrives (version 2). Home's NRR tile uses the same figure.

### Revenue leaks (Evidence → Clients)
Digests a client's own churn and new-business sheets into `revenueMovements` (lost, downgrade, new, growth; cause; rand per month).
The card shows the takeaways first (findings with `lens: 'Revenue leaks'`), then the leak and win per year, where revenue leaks by
cause, the biggest single leaks and, if `client.locationTrend` is set, a location trend. Figures are estimates until they are
checked against billing.

### Merging process updates keeps your edits
When an update file changes a process, its steps are merged by id. The file sets the order and the fields it sends, and
anything set only in the Studio (times, notes, review results) is kept. Flags you added are kept, and so is an issue
severity you chose (your judgement wins over the file's suggestion). Steps the file leaves out are removed.

### Process view: index, focus and sub-processes
- **Step by step.** The page always opens on Department view. In Process view, press **Choose process**, pick a section
  (Client lifecycle, Product, Admin & finance, People; each shows how many of its processes are mapped and any break
  points), then pick a process. Each row shows its owner, status (not mapped / assumed / checked with the team), and top
  break points or issues. "◂ Choose another process" goes back to that section.
- **One process at a time.** Pick a row to see that process on its own, with links to what it comes from and leads to
  (click to move along), plus "Show the whole journey" when you want the end-to-end chain.
- **Who touches it.** Department chips with step counts. Click one to highlight its steps and fade the rest. A
  "Hand-offs between departments" table shows from → to counts and how many are weak.
- **Sub-processes.** A step can open into its own process (`subProcessId`; ⊞ on the card). Issues inside count on the
  parent step. Use "⊞ Map as sub-process" only where a step is a break point or has a serious issue.
- **Not mapped yet.** Processes with no steps show the question to ask and "Start mapping".
- **Break points are automatic.** Every step that clearly stands out (at least half the top score) is marked; there is no
  Top-N setting. Nothing is marked when every step scores the same.
- **Resolve or hold issues.** Each warning in the step panel has ✓ Resolve (fixed or not a problem; gone for good, with a
  note) and On hold (set aside, with a reason). Either way it stops counting until ↺ Reopen. Flags you added can also be
  deleted if they were a mistake. Merges keep these decisions, and editing an issue's text reopens it.

### Client feedback cheatsheet (Report → Feedback cheatsheet)
`feedback` records hold where the client's own documents and the evidence disagree: topic, area, a headline number,
what the documents say, what we see, why it matters, our suggestion, priority and status (Draft / Confirmed with
client / Sent). The report puts the four biggest numbers on top and groups items by area. It is worded as suggestions,
not decisions. Print or download it once the drafts are confirmed.

### Sources (where every number comes from)
`sources` is a register of every document, sheet, interview and meeting: name, type, from (role), person (internal
only), the date the information applies to, when and how it was received, and a link. Feedback items and findings carry
`sources: [{id, part, side}]`, where `side` is `says` (the client's documents) or `seen` (the evidence that disagrees)
and `part` is the exact tab, section or point. The cheatsheet prints both sides under "Where this comes from" (roles only),
and the Leaks & opportunities detail lists them (with names).

### Founder portal (Reports → Founder portal)
What each founder sees from their own link, served by TGM's Apps Script web app (`live-report/Code.gs`): an app with a left menu
(bottom tabs on phones) and six sections.
- **Overview:** where the engagement is (week, phases, next review), savings identified against the target, the headline numbers
  (Sources & data → Headline numbers: value, trend, sparkline or bar, sources), the decisions asked of the founders, the biggest
  leaks, this fortnight (from the status report) and doorways into Processes and Evidence.
- **Our work:** the plan by phase and review dates, delivered and next, the savings tracker, what we need from them (decisions and
  overdue information requests), delays and the capacity line.
- **Leaks & opportunities:** the ticked findings and recommendations, ranked; each opens to the detail, the fix, what runs itself,
  sources and the discussion. Values show what changed since the last published version.
- **Processes and Evidence:** the Studio's own pages, read only. Navigation works; editing controls are hidden and inputs disabled;
  share mode hides TGM-only notes. The portal data leaves out interviews, questions, the diary, to-dos, merge history and anything
  sensitive that wasn't ticked.
- **Insights:** placeholder for the cross-referenced views, still to design.
- Comments, red flags, replies to decisions and the summary PDF for their team work as before; feedback returns via ⟳ Updates.
- **Publishing** writes `reports/<id>.json` (data) and `reports/<id>.html` (the portal page, built from this Studio's own code), so the
  portal's look and features update with the Studio, with no need to redeploy the web app. Code.gs serves the page if present, else
  the older Report page. Both the page and the data are written as plain ASCII (non-ASCII characters escaped).
  A portal page is large (about 1.6 MB with the data), and Google garbled it when served directly ("Invalid or unexpected token").
  So Code.gs (v4+) serves a tiny loader; the loader fetches the full page through `google.script.run` (`api` op `page`) and draws
  it into itself (styles to the head, scripts re-created in order). It does not use `document.write`, which would drop the
  listeners `google.script.run` needs for comments and flags.

### Retiring records from an update file
An update file can remove an obsolete or duplicate record by sending `{"id": "...", "_delete": true}` in its collection.
The record is removed and a tombstone is kept, so an older file can't bring it back. Records edited in the Studio after
the file was made are left alone.

### Savings tracker
"Identified" savings are TGM's estimates (from recommendation changes) until the client approves them; only Approved and
Realised count towards the target. The baseline is `engagement.baselineMonthly`.
