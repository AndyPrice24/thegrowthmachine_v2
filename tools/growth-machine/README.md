# Growth Machine Studio

The Growth Machine's internal diagnostic tool, built for use across every client. You put a client's business into it (profile, finances, people and org, tools, processes, customers and markets, interviews) and it shows:

- **Client register and client health** (Business & market): loads a client's own contract register (contracts, renewals due, out-of-contract, check-ins overdue, satisfaction, upsells, clients per CSM, watchlist) and their Client Success scoring (effort to serve × adoption). Personal contact details are never loaded.
- **Visuals of the current state.** Org chart, process flows, tool stack and overlap, finance trends, customer concentration.
- **Business processes and flows.** Choose **Department view** (one primary department, then tick the processes it is involved in; other departments' steps are shown in full, the primary department highlighted) or **Process view** (tick processes, then the departments to show; unticked departments shrink to grey markers). Processes have no fixed stages: each has an optional group label (e.g. Client lifecycle, Product, Finance) and can **trigger** other processes; linked processes are drawn as one chain with "triggers" markers, unlinked ones side by side. Then pick **Flow** (snaking, colour-coded by department) or **Swimlane** (one row per department, hand-offs crossing rows, a tools strip showing shared tools), **Executive view** and **Anonymise**; size and steps-per-row controls and **Export** sit above the visual. The right-hand panel shows key takeaways, or the clicked step in context (comes from / goes to, hand-offs, warnings, edit, flags). Summaries underneath: at a glance, tools and systems, still to measure, linked findings, and process details (edit name, group, trigger links, summary, talking points). Operations can be split into departments such as Ops: Onboarding and Ops: Tech & maintenance.
- **Top break points.** In Executive view, steps are scored (issues by severity: high ×4, medium ×2, low ×1; weak hand-offs ×1.5; time hotspots ×1). Only the top 3, 5 or 10 (your choice) get the strong red highlight and a numbered "#1 BREAK POINT" label; other steps with problems are just outlined. Ties show as "#1=". Set an issue's severity in ✎ Edit step.
- **Executive view** (on/off, single process and journey views): on shows issues, weaknesses, decision points, management involvement and time hotspots (≥2 days waiting or ≥1 hour hands-on, marked ⏱); off shows only steps, people, systems and hand-offs.
- **Find and replace** (Data & Claude): corrects a word everywhere in a client (e.g. a misspelt product name) across findings, recommendations, processes, interviews, questions and notes. It shows the count per area before changing anything and never touches IDs or the merge history.
- **Assume, then sense-check.** Build your assumed flow in the step panel (✎ Edit step: name, team, who, system, manual/automated, hands-on minutes, waiting days, who else gets involved, decision points with what happens if not; add, move or delete steps). Times you enter are marked ≈ (assumed). Then **▶ Sense-check** walks the flow live with a decision maker: for each step they say ✓ yes, ✎ mostly (you correct it on the spot), ? not sure, or ✕ doesn't happen; you can add missing steps, concerns they raise and notes, and tick off your own questions (hidden by default, for screen-sharing). Step numbers turn green when confirmed, amber when unsure, red when they don't happen; the process shows who checked it and becomes *Corroborated*. **Sense-check sheet (PDF)** prints the assumed flow plus a table per step (Is this right? ☐ Yes ☐ Partly ☐ No, corrections) for anyone you can't walk through it live.
- **Crossover signals.** It crosses the data sets, e.g. payroll against revenue, people against processes (who carries what, single points of failure, overload), tools against pain points, interview themes against departments.
- **Ranked recommendations.** Each one is scored on value, effort, risk and confidence.
- **Scenarios.** A scenario is a set of recommendations applied to the current state. Every view can switch between "current" and any scenario, with changes flagged as New / Changed / Removed.
- **A founder report.** Print it to PDF or download it as one self-contained HTML file. It holds no raw data and needs neither this tool nor Claude to open.

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

1. **Data & Claude → Copy Claude prompt.** Paste it into Claude, then paste your raw material underneath: interview notes or transcripts, an org list, a P&L export, a process description.
2. Claude returns JSON in the Studio's format.
3. **Data & Claude → Paste from Claude → Merge.** New records are added, and records with the same `id` are updated. Nothing is deleted.
4. To get Claude's analysis, use **Copy client JSON for Claude**, paste it into a conversation and ask, e.g., "draft recommendations with ops for the onboarding process".

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
- "Gaps in the diagnosis" lists items with no fix, items with no size, and open data requests. The Overview page shows the top 5.

### Revenue leaks (Business & market)
Digests a client's own churn and new-business sheets into `revenueMovements` (lost, downgrade, new, growth; cause; rand per month).
The card shows the takeaways first (findings with `lens: 'Revenue leaks'`), then the leak and win per year, where revenue leaks by
cause, the biggest single leaks and, if `client.locationTrend` is set, a location trend. Figures are estimates until they are
checked against billing.
