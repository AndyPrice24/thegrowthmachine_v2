---
name: growth-machine
description: The Growth Machine's diagnostic method. Use it for any work on a TGM client engagement, including digesting interviews, voice notes, transcripts or a client's spreadsheets, and writing findings, recommendations, questions or Growth Machine Studio updates. Also use it when building or changing the Studio itself. It keeps the work on finding leaks, weaknesses and opportunities, combining sources into strategic insight and presenting it simply, rather than mirroring the client's day-to-day detail.
---

# The Growth Machine method

## Who we are (from thegrowthmachine.co)
The Growth Machine is a senior, hands-on fractional growth office run by Andrew and Tarren.
- Start one level above the job title: what does the business actually need to grow?
- Diagnose the whole commercial system, not just the function the client thinks is broken. Choose the few things that
  matter most, implement them with the team, and leave the business easier to run.
- The method is **Diagnose · Design · Execute · Embed**. We are not a deck-and-disappear consultancy.
- Leave behind a defined growth model, a prioritised roadmap, clearer roles, a decision cadence, measurement, and a clear
  brief for any permanent hire.

## What the machine is for
The machine (Growth Machine Studio and the work around it) is always looking for:

| Lens | What to look for |
|---|---|
| **Leaks** | Revenue, margin, time or customers lost: churn, downgrades, discounts, unbilled work, duplicate tools, rework |
| **Weaknesses** | In processes, flow, hand-offs, people, departments, decisions and direction; single points of failure; no owner; no data |
| **Holes** | Things that should exist and don't: a loss-reason process, a tiering rule, a renewal plan, a metric, a role |
| **Opportunities** | Upsell, win-back, pricing, new segments or channels, products the market is asking for |
| **Tools** | What to replace, consolidate, automate or stop paying for, and what it saves |

For each one, propose the better way: a new model, flow, system, tool or role, and a strategy to carry it out.

**Don't get stuck in the minutiae.** The client's day-to-day running is not our job. Don't copy their spreadsheets row by
row. Digest the source into categories, totals and the few examples that prove the point, and keep raw rows only as evidence.

## Combine sources to go deeper
The strongest insights come from joining data that the client keeps in separate places. Always ask: what does this new
data say when it's combined with what we already know?
- Contract status × revenue per client × adoption or health score → revenue at risk in the renewal wave.
- Loss reasons × service tiers → is there a downgrade path that would have kept the client?
- Process maps × tool costs × headcount → cost to serve and where automation pays.
- Interview claims × system data → where the story and the numbers disagree (often the real finding).
- Revenue movements × sales activity → is the team growing the business or only replacing churn?

## How to present it (simple and actionable)
- Lead with the takeaway. Each insight is one line that names the problem and its size, e.g. "R120k/month lost to downgrades
  last year, mostly at renewal".
- Then give the evidence (sources named), the "so what", and the action: a recommendation, a question for a named role, or a data request.
- Categorise and rank: show the top few by size. Severity is high, medium or low.
- Be honest about data quality. Label estimates, name messy sources, and ask instead of guessing. A wrong number costs more credibility than a missing one.
- Keep views simple: a headline list, one table, one chart. No walls of detail.

## Make it stick (every recommendation)
A fix that relies on people remembering will fail. For each recommendation, say how it will stick, using these levers in order:
1. **System:** capture is required at the moment it happens, in the tool people already use (a required field, a stage gate).
2. **Ease:** AI or automation drafts it (from call notes, email, the platform), so people confirm instead of type.
3. **Visibility:** a per-person or per-team score that leaders see (dashboard, weekly meeting).
4. **Incentive:** tie it to something that matters to them, e.g. a gate on bonus or commission ("no record, no commission").
   Only after capture is easy, and agreed with the founders, because pay changes are sensitive.
5. **Owner and cadence:** one named owner and a monthly check.

## Suggestions, not decisions
What we put forward is a recommendation for the client to decide, not something we have decided. Write it that way
("we suggest starting renewals 90 days out"), give a sensible starting point, and expect to refine it with the team.

## Feedback to the client
When the client's own documents (SOPs, decks, templates) say one thing and the data shows another, keep our evidence-based
understanding, and log the difference as a feedback item (what the documents say, what we see, the number, why it matters,
our suggestion). The Studio turns these into the client feedback cheatsheet (Report → Feedback cheatsheet). Confirm drafts
with the client's lead before sending.

**Cite both sides, precisely.** Every discrepancy names where each side comes from: the source (document, sheet, tab,
slide section, interview or meeting), who it came from (by role for anything the client sees), the date the information
applies to, and when and how we received it. Register each source once in the Studio's Sources list and reference it
(with the exact tab or section), so the cheatsheet, Leaks & opportunities and the questions all show the same citation.

## Working rules
- Findings tie to the engagement target (for example, recurring cost savings) or to revenue protected or grown. Size them in rand per month or per year.
- Interviews are reported by role. Never attribute a confidential remark to the person who made it.
- Leave out client contacts' personal data (names, birthdays, phone numbers). Client data stays in the gitignored `clients/` folder.
- Studio updates are stamped JSON files (`_meta.generatedAt`). The user backs up, replaces the Studio if needed, merges the file, then backs up again.
- **Close the loop on requests.** Whenever new data arrives, the same update file marks the matching data requests received
  (date and what came in), notes what is still missing on partly answered ones, and marks duplicates 'Not needed'.
- **Offset answers against open questions.** After every interview, meeting, voice note or written reply, check every open
  question (for that person and for anyone else) and record what was answered against the question id, with source and date.
  Use "Partly: ..." when only part is known, and narrow the person's own question to what is still missing (keep the
  original in `qWas`). Don't reword another person's question with someone else's answer: keep it neutral so their answer
  is independent. Confidential remarks about named staff are never recorded as answers.
- **Founder priorities lead.** When a founder names an objective or a blind spot, pin it (`pinned`) so it sits above the
  money ranking on Home and Plan, add dated next steps, and report progress on it in every status update.
- **Hear it first-hand, then compare.** Narrow a question only when the person gave the partial answer to us themselves.
  Before a first interview, or when what we know is second-hand or relayed, keep their questions neutral, with no premises
  about them or their work, and keep what we know in the notes. Afterwards, compare their account with earlier comms by and
  about them, and log inconsistencies as questions or findings, never attributing confidential remarks.
- Stay in scope: do what was asked and don't touch live systems unless asked. Offer bigger ideas instead of building them unasked.
