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
