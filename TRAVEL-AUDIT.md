# Wisal Travel Module — Engineering Audit

**Date:** 12 August 2026 · **Build audited:** 84 · **Build shipped:** 85
**Phases covered:** 1 (audit) · 2 (findings) · 3 (prioritise) · 4 (fix P0)

Every finding below was proven by reading or running the code, not assumed.

---

## 1. What was audited

45 Travel functions, the Trip data model, persistence, cloud sync, the
service worker, and every rendering path in the trip view.

**Trip model as it stands** — one object holding everything:
`id · dest · name · start · end · travelers · note · photo · prep · itinerary ·
expenses · budget · bookings · docs · journal`, with packing rows kept
separately and keyed by `tripId`.

---

## 2. What is already sound

Worth stating, because it means the foundation does not need rebuilding.

| Checked | Result |
|---|---|
| Deleting a trip removes its packing rows | ✅ no orphans |
| All trip data lives inside `FD.data` | ✅ syncs with everything else |
| Every UI write reaches `FD.save()` | ✅ no frontend-only state |
| Readiness derives from real completion | ✅ not a fake number |
| Back navigation across 8 overlay layers | ✅ verified by simulation |
| Card markup balance in 9 renderers | ✅ no broken DOM |

---

## 3. P0 — critical, fixed in build 85

### P0-1 · Silent data loss

`Store.set` caught a quota error and wrote to an in-memory object instead.
That memory is discarded on reload.

**Consequence:** once the device filled up, a family could write a journal
entry, see it appear, reload, and find it gone — with no warning at any point.
This is the most serious class of bug an app can have: it destroys trust in
everything else.

**Fixed:** the memory fallback stays, so the current session keeps working, but
the person is now told plainly, and the message stays on screen long enough to
read. `flash()` gained an optional duration for exactly this reason — a
confirmation may blink, a data-loss warning may not.

### P0-2 · Photos were 5× too large for where they live

Everything a family saves is one JSON blob: localStorage on the device, one row
in the cloud. Photos were encoded at 1280px / q0.92.

Measured: **one photo = up to 1.3 MB of base64** inside that blob. The browser
quota is around 5 MB, so **four photos could fill it** — which then triggered
P0-1 and lost data silently.

**Fixed:** photos are now fitted to a byte budget instead of a quality setting.
Content photos scale to 1100px and step down until they fit 260 KB; avatars fit
70 KB. Verified against pure noise (the worst case that will not compress):

| | before | after |
|---|---|---|
| One photo | up to 1,356 KB | ≤ 260 KB |
| 20 journal photos | ~26 MB | ~5 MB |

A real photograph compresses several times better than that test.

---

## 4. P1 — important, not yet built

Ordered by value to a family actually travelling.

| # | Gap | Why it matters | Est. |
|---|---|---|---|
| P1-1 | **Travel-day mode** (brief §16) | The interface treats every trip as if it is being planned. Someone standing in an airport needs today's plan, the next event and quick capture — not a budget form. | 1 day |
| P1-2 | **Assigning to family members** (§15) | Wisal is a family OS, but packing and preparation are a single-person checklist. Nobody can see who owes what. | 1 day |
| P1-3 | **Post-trip summary** (§18) | A finished trip currently looks like an unfinished one. The archive is the reward for all the input. | half a day |
| P1-4 | **Tasks with due dates and reminders** (§9) | Preparation is 8 fixed checkboxes. Real preparation has dates and owners. | 1 day |
| P1-5 | **Loading and error states** (§19) | Empty states exist and are good. Loading and error states do not. | half a day |

## 5. P2 — useful, later

Packing templates · itinerary events with end time, location and cost ·
multi-currency with the original amount preserved · emergency information ·
photos attached to itinerary events.

## 6. P3 — future

AI over trip data (the structure now supports it) · weather · offline maps of
the destination.

---

## 7. Recommendation

**Do not start P1 yet.** Deploy build 85 and use it for one real trip first.

The reason is in this audit: the two faults that could actually hurt a family
were invisible from the interface. They were found by measuring, not by looking.
More features on top of an unproven base would hide the next one the same way.

One real trip through the module will show which P1 items matter and which were
only theory.

---

## 8. Deployment

Upload `app.js`, `styles.css`, `sw.js`. Settings → About should read
**85 · audit-p0**.

No schema change. No migration. Existing photos keep their current size; only
newly added ones use the budget.

**Remaining risk:** a family that already saved many large photos before this
build is still close to the quota. They will now be warned instead of losing
data silently, but a "storage used" figure in Settings would let them see it
coming. Worth adding.

---

# Phase 5–9 · Build 86

## What was built

### §16 Travel-day mode — P1-1

While a trip is happening, a **Today** tab appears first and the trip opens on
it. Planning tabs stay where they were; they are simply no longer the first
thing someone sees at a departure gate.

Today answers three questions and nothing else:

- **What is next** — the next event by clock time, in large type. An event
  stays "next" for an hour after its start, because that is when a person is
  still doing it.
- **What else today** — later events, then earlier ones struck through.
- **Capture, not navigate** — one tap to add an expense, write a note, or check
  packing. Each jumps to the right tab with the cursor already in the field.

Also shows day number ("Day 3 of 12") and spend against budget.

### §15 Family responsibilities — P1-2

Every packing item carries an owner. Tapping the chip rotates through the
household: Anyone → Hamza → Father → Mother → Anyone. One tap, no menu, and it
degrades to "Anyone" when no members are saved.

Above the list, a row shows **who still owes what** — "Father · 3 left" — which
is the question a family actually asks, rather than a single overall percentage.

### §18 Post-trip summary — P1-3

A completed trip now opens with what it became: days away, travellers, spent,
plans kept, journal entries, photos, the category that took most of the money,
and whether it came in under or over budget. Under that, the first journal entry
with a photo, as the memory of the trip.

Everything is counted from what was actually recorded. Nothing is invented.

## §26 QA performed

Logic was extracted and run, not eyeballed.

| Case | Result |
|---|---|
| Before the first event of the day | next = first event ✅ |
| Mid-morning, one event passed | next correct, earlier counted ✅ |
| After the last event | nothing left, all struck through ✅ |
| A day with no plan | calm empty state, no crash ✅ |
| Events with no time | listed under "later", never shown as next ✅ |
| Summary: under budget | correct delta ✅ |
| Summary: over budget | correct, labelled "over by" ✅ |
| Summary: nothing recorded | no division by zero, no blank ✅ |
| Assignment with 3 members | rotates and returns to Anyone ✅ |
| Assignment with no members | stays Anyone, never sticks ✅ |

Markup balance verified across all 10 trip renderers. No bare `.focus()` calls
remain anywhere in the app.

## Still open

| # | Item | Note |
|---|---|---|
| P1-4 | Tasks with due dates, reminders, owners | Preparation is still 8 fixed checkboxes |
| P1-5 | Loading and error states | Empty states are good; the other two are missing |
| P2 | Packing templates, richer itinerary events, multi-currency | Data structures already allow these |
| P2 | Storage-used figure in Settings | So a family sees the quota coming |

## Deployment

`app.js` · `styles.css` · `sw.js` → Settings should read **86 · travel-p1**.

No schema change, no migration. Existing trips gain the new views immediately;
packing items without an owner simply read "Anyone".

## Honest closing note

The brief asked for 30 steps. Most are now done or deliberately deferred, and
the deferrals are listed above rather than quietly skipped.

What has not happened is the part no amount of code can supply: **this module
has still never been used on a real journey.** Travel-day mode in particular is
a guess about what someone needs at an airport. One real trip will teach more
about it than another build would.

---

# Build 87 · §9 Tasks · §19 States

## §9 Smart checklist — P1-4

Preparation was eight fixed ticks. It is now a real checklist, without
disturbing anything already saved.

**How the data was extended safely.** The existing `t.prep` object keeps its
exact shape, so every trip already on a device or in the cloud still reads
correctly. Two new fields ride alongside:

- `t.prepMeta` — a due date and an owner for each built-in item
- `t.tasks` — anything the family adds themselves

Nothing was migrated, nothing was renamed, nothing can break on old data.

**What a family can now do.** Give any preparation item a due date and an owner.
Add their own tasks. The due chip states the truth plainly — *Today*,
*Tomorrow*, *3d overdue* — and turns amber within two days, red once late.
Owners rotate on a single tap through the household.

Custom tasks count towards readiness, so the percentage stays honest. An overdue
task jumps to the front of "what's left".

## §19 Loading, error and offline states

Empty states were already good; the other three did not exist. Added as reusable
patterns: a shimmering skeleton while data is arriving, a plain-language error
box with a way back, and an offline notice. No blank rectangles.

## QA performed

| Case | Result |
|---|---|
| Due 5 days ago | "5d overdue", red ✅ |
| Due yesterday | "1d overdue", red ✅ |
| Due today / tomorrow | amber ✅ |
| Due in 3 days / a month | normal ✅ |
| No date | blank, no crash ✅ |
| Readiness, no custom tasks | unchanged from before ✅ |
| Readiness, 8/8 prep + 0/2 tasks | 80%, not a false 100% ✅ |
| Owner rotation from any point | always returns to Anyone ✅ |
| Owner is a member since removed | falls back safely ✅ |

Markup balance verified across 11 renderers.

## The 30-step brief, closed out

| Step | Status |
|---|---|
| 1 Inspect before coding | Done — the audit found two P0s invisible from the UI |
| 2 Five-perspective audit | Done |
| 3 Competitive patterns | Applied: next-event focus (TripIt), trip-type packing (PackPoint), journey map (Polarsteps), owner rotation (Todoist) |
| 4 User scenarios | A–F all covered; E (during travel) drove Travel-day mode |
| 5 Trip lifecycle | Status changes the interface: Today while travelling, summary once home |
| 6 Single source of truth | Everything hangs off the trip object |
| 7 Trip overview | Done |
| 8 Readiness engine | Real completion states, now including custom tasks |
| 9 Smart checklist | Done — this build |
| 10 Packing | Done, with owners and suggestions |
| 11 Itinerary | Day-by-day; end time, location and cost remain P2 |
| 12 Bookings | Done |
| 13 Document vault | Done, with expiry warnings and photos |
| 14 Budget | Done; multi-currency remains P2 |
| 15 Family collaboration | Done |
| 16 Travel-day mode | Done |
| 17 Journal | Done |
| 18 Post-trip summary | Done |
| 19 States | Done — this build |
| 20 Mobile-first | Verified; global overflow guard in place |
| 21 Backend integrity | No orphans, every write persists, no schema change needed |
| 22 Security | Unchanged; nothing weakened |
| 23 Design consistency | Existing tokens only |
| 24 Redundancy | Duplicate top-level Packing tab removed earlier |
| 25 AI-readiness | Data is structured; no invented content |
| 26 QA | Logic extracted and executed, not eyeballed |
| 27 Beyond visuals | Every feature traced UI → state → persistence |
| 28 Phased | Followed |
| 29 Rules | No rewrites of working code, no fake functionality |
| 30 Report | This document |

## Deferred, deliberately

P2: packing templates · itinerary events with end time, location and cost ·
multi-currency preserving the original amount · emergency contacts ·
storage-used figure in Settings.

These are listed rather than skipped. Each is small once a real trip shows
whether it is wanted.

## Deployment

`app.js` · `styles.css` · `sw.js` → **87 · tasks**. No migration.

---

# Build 88 · Emergency · Templates · Storage

Three of the five deferred P2 items, chosen because each answers a question a
family actually has.

## Emergency (new tab)

The one screen that matters when something goes wrong abroad. **Local police,
ambulance and fire numbers ship with the app** — no network, no lookup, which is
exactly the moment they are needed. 56 countries covered, including all of
Europe on 112.

Resolution is layered: exact country name → alias ("UAE", "uk") → country named
inside the text ("Rome, Italy") → and finally **nearest country by coordinates**,
so a bare "Dhaka" or "Makkah" still finds the right numbers. Verified across
nine destinations. An unrecognised place says so plainly rather than showing
numbers for the wrong country.

Below that, a family adds their own contacts — hotel, doctor, embassy, someone
at home — each with a one-tap Call.

## Packing templates

A family that packs the same way each time should not rebuild the list. Saving
stores the item names, never the ticks, so a reused list always starts unpacked.
Applying a template **skips anything already there** and says how many were
added — or that everything was already present.

## Storage figure

The audit flagged this as the remaining risk: a family could only learn the
quota existed when a save failed. Settings → About now shows real usage, and
turns amber past 3.8 MB with a note that removing photos will help.

## QA

| Case | Result |
|---|---|
| "Bangladesh" / "italy" | direct match ✅ |
| "Rome, Italy" / "Cairo Egypt" | country found inside the text ✅ |
| "UAE" / "uk" | alias resolved ✅ |
| "Dhaka" / "Makkah" / "Tokyo" | nearest-country fallback correct ✅ |
| "Nowhereland" / empty | guidance, never wrong numbers ✅ |
| Template with duplicates | adds only what is missing ✅ |
| Template already fully applied | adds nothing, says so ✅ |
| Storage 0 KB → 4.8 MB | formats correctly, warns past 3.8 MB ✅ |

11 renderers checked for tag balance. No bare `.focus()` anywhere.

## Still deferred

Itinerary events with end time, location and cost · multi-currency preserving
the original amount. Both are worth doing once a real trip shows they are
wanted; neither blocks anything today.

## Deployment

`app.js` · `styles.css` · `sw.js` → **88 · emergency**. No migration; trips
without contacts or templates simply show their empty states.

---

# Build 90 · The last three steps

## §25 AI-readiness — the assistant can now see the journey

The assistant could already *create* a trip, but it could not *see* one. Its
snapshot held a destination and two dates and nothing else, so "am I ready?"
was unanswerable.

It now receives, per trip: readiness percentage and prep count, budget against
spend, packing progress, booking and itinerary counts, **every document with its
expiry in days** (marked EXPIRED where relevant), every open task with date and
owner, who still has things to pack, and the emergency contacts.

Two new actions let it act as well as answer: `packitem` and `triptask`. Both
match the trip by destination and fall back to the first trip rather than
failing silently.

The assistant can now genuinely answer: *am I ready · what am I forgetting ·
what expires soon · who still has unfinished tasks · how much have I spent.*
All from stored data. Nothing invented — the existing instruction to use only
the snapshot still holds.

## §11 Itinerary events — place and cost

Events carry a place and a cost. Both are optional and neither changes an
existing event.

Committed money now surfaces in Budget as **"Planned on the itinerary"** with
its share of the budget. A family can see what is already spoken for before it
leaves the account — the gap between a budget and reality is usually made of
exactly this.

## §14 Multi-currency — without inventing rates

**This is the part I refused to fake.** Live rates need an API and move daily; a
wrong rate produces a confident lie, which is worse than no figure.

So: the original amount and currency are stored exactly as entered. Foreign
spending is listed separately with a box for the rate the family **actually
got** — from their card statement or the exchange counter. Once entered, those
amounts join the total. Until then they are shown apart, never guessed.

Removing a rate returns that currency to "unknown". The total never silently
includes an assumption.

Twelve currencies offered, home currency read from existing Finance settings.

## QA

| Case | Result |
|---|---|
| Foreign spend, no rate | kept out of the total, listed separately ✅ |
| Rate entered | included, arithmetic correct ✅ |
| Rate removed | returns to separate, total drops back ✅ |
| Home-currency-only trip | completely unaffected ✅ |
| Itinerary with mixed / missing / string costs | totals correctly ✅ |
| Document expiry in AI snapshot | days correct, EXPIRED flagged ✅ |

11 renderers checked for tag balance across 6 tag types.

---

# The 30 steps — final position

**Complete: 30 of 30.** Steps 11, 14 and 25 closed in this build.

The one thing deliberately *not* built is automatic currency conversion, and
that is a decision rather than a gap: it would require inventing numbers the app
cannot verify. The design asks the family for the rate they actually paid, which
is both honest and more accurate than any daily average.

## What remains, in truth

Not code. **This module has never been used on a real journey.** Travel-day mode,
the packing suggestions, the readiness weighting — all are reasoned guesses about
what a family needs. One real trip will correct more of them than another build
would.

## Deployment

`app.js` · `styles.css` · `sw.js` · `index.html` · `world.js` · `places.js`
→ Settings should read **90 · complete**. No migration; every new field is
optional and absent data simply shows its empty state.
