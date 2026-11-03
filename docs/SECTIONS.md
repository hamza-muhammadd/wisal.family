# Wisal — every section in the app (from the code, build in this package)

20 screens, 77 sub-tabs, 13 Settings panes. Order below = sidebar order.

| # | Screen | Sub-tabs |
|---|---|---|
| 1 | **Home** | At-a-glance cards (no sub-tabs) |
| 2 | **My Day** (`dashboard`) | Single page |
| 3 | **Wisal AI / Chats** (`ai`) | AI chat · Family chat |
| 4 | **Family Management** | Overview · Members · Calendar · Governance · Goals · Meetings · Responsibilities · Documents · Family Tree |
| 5 | **Relationship** | Us · Love notes · Special dates · Date ideas |
| 6 | **Planning** | Overview · Tasks · Projects · Week |
| 7 | **Memory Vault** | Overview · Albums · Stories · Time capsule |
| 8 | **Secure Vault** | PIN-locked notes (no sub-tabs) |
| 9 | **Health & Medical** | Overview · Profiles · Medications · Appointments · Records · Vitals |
| 10 | **Fitness** | Overview · Workouts · Goals · Routines |
| 11 | **Nutrition** | Overview · Food diary · Water · Habits |
| 12 | **Cooking** | Overview · Recipes · Meal plan · Shopping |
| 13 | **Home Management** | Overview · Chores · Maintenance · Supplies |
| 14 | **Finance** | Overview · All money · Transactions · Planned · Debts · Budget · Savings · Statistics |
| 15 | **Learning** | Overview · Courses · Books · Skills |
| 16 | **Journal & Memories** | Today · Timeline · Entries · Calendar · Photos · Favourites · Memories · Reflection · Gratitude · Milestones (+ a second tab also labelled "Timeline", id `dashboard`: check) |
| 17 | **Travel** | Overview · Trips · Bucket list |
| 18 | **Wellbeing & Growth** | Overview · Check-ins · Self-care · Growth |
| 19 | **Legacy & Akhirah** | Overview · Du'ās · Good deeds · Wisdom |
| 20 | **Settings** | Panes: account · household · family · plan · spaces · avatar · appearance · notifications · backup · install · legal · reset · about |

## Not screens, but part of the experience
Sign-in gate (now with forgot / reset password) · Onboarding (6 steps, last = paywall) ·
Notifications panel · Quick-add menu · Chat pop-up · Avatar cropper · Photo lightbox ·
Wisal Plus paywall + `pricing.html` · `privacy.html`.

## Overlaps to resolve while reviewing
- Finance: **All money** and **Transactions** both show money movement.
- Memory Vault vs Journal & Memories: Albums / Stories / Time capsule live in one, Entries / Memories / Milestones in the other.
- Health Overview, Fitness, Nutrition and Wellbeing each have their own dashboard.
- Finance default currency is `USD`, while Travel falls back to `BDT`.

## Suggested review order (one screen at a time)
1. Sign-in  ✅ (done in this build)
2. Onboarding + paywall
3. Home
4. Finance
5. Family Management
6. Planning
7. Health & Medical
8. Journal & Memories
9. the rest, using the usage numbers from real families
