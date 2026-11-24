# Department-first Studio: build plan

**Status:** draft for Andrew's approval, 19 Nov 2026. Nothing here is built until Andrew agrees the plan and the open
decisions below.

**Already decided (19 Nov 2026)**
- Layout: Option 1, "Departments hold everything". Home → a department → tabs: Board, Processes, Evidence,
  Conversations, Data.
- One item, one path. A finding, its recommendation, its automations and its key-change story become one item that
  moves through Found → Investigating → Proposed → Approved → Under way → Live.
- Board: direction A. Department tiles, then a Trello-style board with one column per stage, large cards, type icons,
  a small Leak / Opportunity / Weakness label, and items that appear in every department they touch.
- Processes: keep today's flow view, simplified. Show one process at a time, with a "Show all" link. Each break point
  links to the board item that fixes it, and a break point with no item is flagged as a gap.
- Six departments: Leadership & direction; Sales (with partners, resellers and marketing); Client Success; Operations
  (onboarding, tech teams, reputation management); Product & platform; Admin, finance & people (billing, contracts,
  suppliers, compliance, HR).
- Eight types: ⇄ Process, ⚙ Automation, ▦ Systems & tools, ◉ Data, ☺ People & capacity, ★ Service delivery,
  ↻ Change management, R Commercial.

The mock-ups are kept with the client's files. They are not in this repository.

---

## Decisions needed before step 1

Each decision has a recommendation. Andrew's answer replaces it.

1. **How big an item is.** Today's records would become about one item per recommendation, plus the findings that have
   no recommendation yet. That is too many for a founder board. *Recommendation:* merge recommendations that are really
   one fix, and aim for 30 to 35 items. Claude drafts the list; Andrew reviews it as a table before anything changes.
2. **The four key-change buckets** (Remove friction, Bring light, Unblock & empower, Stop the leaks). *Recommendation:*
   drop them. Departments, types and the label now do that job. CLAUDE.md is updated to match.
3. **Measured.** *Recommendation:* make it a mark on a Live item (what was measured, the result and the date), not a
   seventh column.
4. **Parked items** (the client's decision not to go ahead for now). *Recommendation:* keep them off the board and
   list them in a short "Parked" strip at the end of each department board. Founders see the strip.
5. **Headline numbers on each department page.** *Recommendation:* up to four per department, each with a source.
   Claude proposes them, Andrew approves them, and any number we don't have yet says "to confirm".
6. **Changeover.** *Recommendation:* keep today's pages behind a "Classic view" switch until the next fortnightly
   review, then remove them.

---

## The item (data model)

Each item is a new record in a new `items` collection. It holds what the board needs and links to the existing records
that hold the evidence.

| Field | What it holds |
|---|---|
| `id`, `title` | Plain title of the issue or change |
| `line` | One sentence of fact (shown on the card) |
| `depts` | One or more of the six departments; the first one is the owner |
| `types` | One or more of the eight types |
| `label` | `leak`, `opportunity`, `weakness`, or empty |
| `stage` | `found`, `investigating`, `proposed`, `approved`, `underway`, `live`, or `parked` |
| `measured` | On Live items only: what was measured, the result and the date |
| `next`, `nextDate`, `owner` | The next step, its date, and the owner's role |
| `pinned` | A founder priority; it leads Home and its department |
| `private` | TGM-only note (people dynamics); never sent to the portal |
| `portal` | `false` hides the item from founders |
| `findingIds`, `recId`, `automationIds`, `opportunityIds`, `moveId` | Links to the records behind the item |
| `steps` | Process steps the item fixes (`{procId, stepId}`); this is how break points link to items |

**Why links rather than a rewrite:**
- Nothing is lost. Findings keep their evidence, recommendations keep their costs and "how it sticks", automations
  keep their details, and key changes keep their before → now → next story and timeline.
- Every figure keeps its source, so the source appendix and the "no source" flags work as they do today.
- Update files written the old way still merge.

The item is the only record with a stage. Today's status fields on recommendations, automations and key changes are set
from the item's stage, and the Studio no longer shows them separately.

**Stage mapping for the first migration** (Andrew reviews every item afterwards):

| Today | Item stage |
|---|---|
| Finding with no recommendation | Found |
| Recommendation, Identified, not yet put to the founders | Investigating |
| Recommendation put to the founders for a decision | Proposed |
| Key change at Agreed | Approved |
| Key change at Under way, automation In progress | Under way |
| Key change at Live or Measured, automation Live | Live (plus the Measured mark where we have a measure) |
| Recommendation at Parked | Parked |
| Context findings | Not items; they stay as evidence |

**Departments.** Today the client's department records and the process maps' team list are separate. Both map onto
the six departments. For example, operations sub-teams become Operations; marketing and reseller teams become Sales;
finance becomes Admin, finance & people; and outsourced development becomes Product & platform. People with no
department stay visible as "Unassigned" until that is resolved.

---

## Look and feel (agreed 19 Nov 2026)

**Graphite, with raised cards.** One style across the Studio and the founder portal:
- **Background:** near-black page, with the app sitting on it as one large rounded tray.
- **Cards:** charcoal cards raised off the tray.
  - A light rim on the top and left edges, a dark rim on the bottom and right.
  - A tight shadow plus a long soft shadow falling down and to the right.
  - Cards lift slightly on hover.
- **Wells:** lists, charts and stage bars sit in recessed wells inside the cards.
- **Knobs:** raised round buttons sit on the card edge. They are grey by default, coral and glowing for anything urgent, and blue for progress.
- **Colour:**
  - Coral and blue accents.
  - The six department colours mark department edges and dots.
  - Glow only on the active or urgent element.
- **Left menu:** Home, the six departments, Whole business, and Our engagement. On a tablet it shrinks to icons; on a phone it becomes a strip across the top.
- **Section headings** organise each page.
- **PDFs and printed reports stay light.**

**Two home pages, each written for its reader.**
- **Our view** (TGM, per client), with a client switcher in the menu:
  - At a glance: my overdue to-dos, the next fortnightly review, what we're waiting on from the client, my days.
  - To do and in motion: what needs me now, and key changes with their next step and date.
  - Departments.
  - Ahead: what's coming up; their headline numbers, each dated "as at"; founder portal activity.
- **Founders' view:**
  - At a glance: their own target, changes made or under way, decisions for them, information we need.
  - Progress and decisions: what has changed (before and now), and the decisions waiting for them.
  - Their business by department, counted as Found, Planned, Fixing and Done.
  - Ahead: what's coming up, what we need from them, our time with them.
  - The Leak / Opportunity / Weakness labels appear on the department board, not on Home.

**Founders' view: eight pages, by topic (agreed 23 Nov 2026; replaces the department-first founders' Home).**
Departments become a filter on every page. The pages, in build order:
1. **Company health:** five areas (revenue, clients, delivery, people, cost). Each has one or two numbers with an
   "as at" date, green/amber/red, and a trend arrow.
2. **Concerns and wins:** the top five concerns (biggest leaks and risks, stuck or late projects) and the latest
   dated wins.
3. **Optimisation projects:** every item at Approved, Under way or Live, showing:
   - why it matters, and its knock-on effects in words until measured;
   - its stage;
   - the owner by name, and the departments involved;
   - was → now → will be. Each item gains a `willBe` field, written as an aim, not a promised result.
4. **Lowest-hanging fruit:** the top five low-effort, clear-benefit items. Founders can approve one from the portal,
   and it moves to Approved on the next update.

Then:

6. **Report:** TGM's weekly timeline, wins, finished tasks in plain words, the plan, days used. No private to-dos. **Built 24 Nov**: week-by-week
   cards from `engagement.weeks`, days used by month, the plan and reviews, coming up, wins, and what we need from you.
8. **Processes and systems:** client-safe flows, a systems map (owner, cost, users, overlap), and automation
   opportunities shown on the steps they would remove.
5. **Insights:** joined-up views.
7. **Department efficiency:** for each department, 4–6 measures at team level, never per person.
   - Each measure is green/amber/red with a trend.
   - The score is measures on target out of measures tracked, shown next to the measures not tracked yet.
   - Baseline: Mar–Sep 2026 where history exists; otherwise the first four full weeks of data.
   - Each department page prints as a one-page PDF for the founders to share with that department's head.

**Built 23 Nov 2026:** pages 1 to 4, in the portal, with founders' approval from page 4 (Code.gs `approve` op).

Kept from the earlier portal: ticks, comments and red flags; the key-change detail page; what we need from the client;
personal links and the printable summary; "as at" dates and sources on every figure.

---

## Build steps

Each step ships on its own, is tested in Playwright at desktop and phone widths, and is sent to Andrew for review
(with screenshots for steps 2, 3, 4 and 8).

1. **Items and migration (data only).**
   - Add the `items` collection, its fields, and merge support.
   - Write a client builder that drafts the items from today's records.
   - Add a check page under Sources & data. It shows every finding, recommendation, automation, opportunity and key
     change, and confirms each one sits in exactly one item or is marked as context.
   - Fix any figures that disagree between records before they are merged.
   - *Gate:* Andrew reviews the item table (department, type, label, stage) before step 2.
2. **New navigation and Home.**
   - Left menu: Home; the six departments with item counts; Whole business; Our engagement.
   - Home: the pinned priority; the six department tiles; "Where everything stands" (one count per stage); For your
     decision; Latest; Waiting on.
   - Clicking a stage count opens every item at that stage across all departments. This replaces today's Key changes
     page.
3. **Department page: header and Board.**
   - Header: headline numbers.
   - Board: columns by stage, type and label filters, and large cards.
   - Detail panel: the evidence and sources, the before → now → next story, process steps, the private note (Studio
     only) and editing.
4. **Processes tab.**
   - Today's flow, simplified: one process at a time, one badge per type on each step, a short toolbar with the rest
     under "More", and a collapsed "About this process".
   - "Show all" link.
   - Break points list the item that fixes them, or "No item on the board yet".
5. **Evidence, Conversations and Data tabs.**
   - Tag each Insights view, data request and question with its department(s).
   - Each tab shows only what belongs to that department.
   - Conversations are listed by role.
6. **Whole business.**
   - "How work flows": every process placed on the client lifecycle (win, start, run, keep and grow, bill and collect).
     Each process gets a lifecycle field.
   - The hand-offs between departments, each linked to its item.
   - "Insights & value": today's Evidence tabs (Insights, True value, Money, Clients, Market).
7. **Our engagement.** Our work (timeline, wins, plan, days), Reports and Sources & data. These are mostly moved, not
   new.
8. **Founder portal on the same structure.**
   - Home and the six departments, read-only and client-safe.
   - Hidden from founders: private notes, days, conversations, true value, unverified flow points, and items marked
     `portal: false`.
   - Founders' ticks, comments and red flags attach to items. Existing ones carry over to the item that now holds them.
   - Republish, and send the links once Andrew has checked it.
9. **Reports.** The PDF report and the status report are organised by department and keep the source appendix.
10. **Clean-up.** *Done 24 Nov 2026: Classic view and the old pages removed; docs and the method skill updated.*
    - Remove Classic view and the old Key changes, Leaks & opportunities and Plan pages.
    - Update the README, CLAUDE.md, the growth-machine method skill and the backlog.
    - The skill must say that every new finding goes into an item, with departments, types, a label and a stage.

**Checks at every step**
- Every past update file still merges in order.
- No record is lost: counts before and after match.
- The portal end-to-end test passes, extended for items.
- No horizontal scroll at phone width.
- No client data in the repository.

**Order and timing.** Steps 1 to 4 and step 8 come first, because they are what the founders see. The aim is to have
them ready for the next fortnightly review. That depends on how quickly the item table is reviewed at the end of step 1.
Steps 5 to 7, 9 and 10 follow.

---

## Risks

- **Grouping records into items is judgement.** Andrew's review of the item table is the control. Nothing reaches the
  founders before it.
- **Founders lose a page they know.** Key changes are no longer their own page. On Home, Under way and Live are one
  click away.
- **The single Studio file grows** while Classic view is kept. Step 10 removes the old modules.
- **New work written the old way** (a finding with no item) would not appear on the board. The check page flags it,
  and the method skill is updated in step 10.
