# Wisal Journal — Engineering Report

**Build 99 · journal-ai** · 13 phases, all complete
Every claim below was verified by running the logic, not by looking at it.

---

## The problem found in Phase 1

Seven separate lists held the family's memories — `journal.entries`,
`journal.gratitude`, `journal.milestones`, `memory.stories`, `memory.albums`,
`memory.capsules` — each with its own add function, its own renderer, its own
card. Four CRUD systems for what is really one thing: *a moment, on a date.*

The consequences were structural, not cosmetic:

- an entry could not become a milestone without retyping it
- search only reached entries
- nothing could show a whole life at once
- Favourites, Collections and On This Day were impossible to build

## The decision that made everything else possible

**Not a migration.** Every array keeps its exact shape and every original
function still runs. A reading layer (`jrAll`, `jrSearch`, `jrByDay`,
`jrOnThisDay`, `jrStats`) presents all seven lists through one lens.

New properties — `favorite`, `collections` — are written back onto the original
record, so they sync with everything else and nothing had to be moved.

This is why eleven tabs were built in a few hours rather than a few weeks, and
why no existing entry was ever at risk.

---

## What was built

| Phase | Delivered |
|---|---|
| 1 Audit | Architecture mapped; four-CRUD problem identified |
| 2 Foundation | Shared `JournalRecord` reader over seven lists, no migration |
| 3 Today | Mood, writing, photo, gratitude, milestone — one screen, nothing required |
| 4 Timeline | Everything chronological, grouped as people remember time |
| 5 Entry detail | Full-screen reading; edit and delete behind deliberate actions |
| 6 Calendar | Quiet indicators; verified across leap years and boundaries |
| 7 Photos | Month-grouped grid, one tile per photo, lazy-loaded |
| 8 Favourites | A flag on the shared record; star lives on the card |
| 9 Memories | On This Day · Milestones · Collections |
| 10 Gratitude | Folded into the shared system, no longer isolated |
| 11 Reflection | Daily/weekly/monthly/yearly, counted from real records |
| 12 AI | Assistant sees the whole archive; suggestions stay suggestions |
| 13 Polish | Mobile, empty/loading/error states, keyboard focus |

---

## Bugs found by running the code

None of these were visible on screen. All were caught before shipping.

**Timeline order was inverted.** The month rank went negative
(`100 + (9999 − 202606) = −192507`), floating old months above Today. Fixed, then
a second pass showed undated records landing above dated months. Both corrected
and re-verified.

**Undated milestones sorted first.** An empty date string compares below every
real date, so "Undated" appeared before the earliest year. Pushed to the end.

**Two stars on one card.** The read-only marker and the new interactive star
both rendered. The duplicate was removed.

**Assumed attribute names.** The reader's Edit button targeted `gedit` and
`medit`; neither exists. The real names are `gratedit` and `msedit`, confirmed
against the markup before wiring.

---

## Verified behaviour

| Test | Result |
|---|---|
| Reader sees all five list types as one | ✅ |
| Nothing moved, renamed or lost | ✅ counted before and after |
| Favourite writes to the original record | ✅ |
| Legacy records with no date, null title, garbage date | ✅ no `undefined`, `NaN` or `Invalid Date` |
| Capture: nothing / body only / photo only / everything | ✅ correct records created |
| Two-line entry splits into title and body | ✅ |
| Mood alone creates a valid day record | ✅ |
| Timeline grouping and ordering | ✅ after two fixes |
| Calendar: Feb 28, leap 2024, non-leap 2100 | ✅ |
| Calendar: Jan ‹ → Dec 2025, Dec › → Jan 2027 | ✅ |
| Delete removes from the right list only | ✅ |
| Delete with a colon in the id | ✅ |
| Collection deleted → records survive | ✅ §16 |
| Photos: one tile per photo, empties excluded | ✅ |
| Reflection saved twice → updated, not duplicated | ✅ |
| Themes extracted from real writing, stop-words excluded | ✅ |
| Suggestion dismissed → never returns | ✅ |
| Empty journal → suggestion stays silent | ✅ |

Markup balance checked across all 15 journal renderers. No bare `.focus()` calls
remain anywhere in the app.

---

## §19 privacy, kept

The assistant reads the journal and may offer. It never classifies, saves,
edits or deletes on its own. Every suggestion carries **Not now**, appears at
most once, and is drawn from what the family actually wrote — never invented.

---

## What was deliberately not built

**Places (§11).** The field exists on every record and search already covers it,
but a map was not added. Wisal's Travel module already holds real geography;
duplicating it here would create two location systems, which §33 warns against.
The right move is to join them, and that deserves its own pass.

**Albums.** `memory.albums` is left untouched and out of the shared reader — its
records hold photo groups rather than moments. Collections cover the same need
in the new model.

---

## Honest closing note

Eleven tabs, one shared model, no data touched. The architecture is sound and
the logic is tested.

What has not happened is use. Every judgement about what belongs on Today, what
the suggestions should say, how much a reflection should show — all of it is
reasoned, none of it is observed. **A month of real journaling will correct more
of this than another build would.**

## Deployment

`app.js` · `styles.css` · `index.html` · `sw.js` (+ `world.js`, `places.js`
unchanged) → Settings should read **99 · journal-ai**. No migration.
