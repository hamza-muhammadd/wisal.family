# Wisal Family: audit and Phase 1 plan

This follows the ten steps of the blueprint. It is a plan for a careful, staged reform of the existing app, not a rebuild.
Stage 1 is already built and tested (migration 005). Everything else waits for your review, one stage at a time.

## 0. An honest scope check
- **Phase 1 is realistic.** It is mostly structure: family, members, roles, requests, dashboards.
- **Phase 3 (food, rides, hospitals) depends on other companies.** Foodpanda, Uber and similar platforms do not offer open public ordering APIs. Real ordering needs a partnership or an approved integration. What can be built honestly, as the blueprint itself says, is a directory of providers with deep links and a request workflow. No dummy integrations will be presented as working.
- **Phase 6 (voice device) is far away.** Nothing in Phase 1 blocks it: every action goes through server functions that a device can call later.
- **One architectural fact shapes everything.** Today the whole family's data (finance, health, journal, documents) is one JSON document per family. A database cannot hide "finance" from a child while the finance lives inside the same document. So permissions are built in two layers:
  1. **Now (Stage 1, done):** roles decide access to the shared document as a whole. Owner, admin and adult can read and write it. Teen, child and guest cannot read it at all (they use chat and, later, their own requests and dashboard).
  2. **Phase 2:** finance, health and the household inventory move into their own tables with their own rules, so a teen can have a personal budget and see only that, enforced by the server.
- **"Members" are two different things today.** A member in the app is a profile inside the document (name, relation, health lists). It can exist without an account (a small child). A login account is separate, and the app links them only by matching email. The reform links them properly by a user id on the profile (Stage 4).

## 1 and 2. Audit of the existing application
| | Finding |
|---|---|
| **Works** | Sign-up, sign-in, password reset (v133+), welcome email, family chat with live updates, join with a code, 20 modules (Home, My Day, Family, Planning, Journal, Finance, Health, Travel and more), AI chat with daily limit, Wisal Plus payment functions, privacy and pricing pages, install as an app |
| **Partly works** | Joining a family: a joined person can be detached on the next sign-in (the app reads only its own row); sync is last write wins, so two editors can overwrite each other; paywall sits inside onboarding |
| **Redundant** | Finance "All money" and "Transactions"; Memory Vault and Journal overlap; four separate health style dashboards (Health, Fitness, Nutrition, Wellbeing) |
| **Needs restructuring** | Navigation (20 flat screens); onboarding (family type and size questions, but no real family creation); the single JSON document for everything sensitive |
| **Preserve** | Every module and its data, chat, AI, payments, offline use, the visual identity |
| **Missing** | Roles and permissions, member management, suspensions, invitations with roles, plan limits in the database, the Request Center, notifications, the member dashboard, an admin area, audit logs |
| **Database** | Existing: `family_data`, `family_members`, `family_messages`, `family_reads`, `subscriptions`, `ai_usage`, `welcome_emails`. Added in Stage 1: `plans`, `family_invitations`, plus family profile columns and member role, status and overrides |

## 3. Information architecture and navigation
The 20 screens are grouped under the blueprint's headings. Nothing is deleted. A heading appears only if the person's role may use something under it.

| Heading | Existing screens placed here | New |
|---|---|---|
| HOME | Home, My Day | Family overview, activity feed |
| FAMILY | Family Management (members, calendar, governance, meetings, documents, tree), Relationship | Roles and permissions, invitations, Request Center, announcements |
| DAILY LIFE | Planning, Journal, Memory Vault, Learning, Travel | Reminders |
| HOME MANAGEMENT | Home Management, Cooking | Rooms and spaces, inventory |
| HEALTH AND WELLBEING (kept, not in the blueprint) | Health and Medical, Fitness, Nutrition, Wellbeing, Legacy | none |
| FINANCE | Finance (reorganized: one money screen, budget, savings, statistics) | Individual spending, allowances, reports |
| SERVICES | none yet | Directory of food, transport, healthcare providers with external links (Phase 3) |
| AI ASSISTANT | Wisal AI | Request history |
| SETTINGS | Settings, Secure Vault | Family settings, integrations, billing |

Health keeps its own heading because those four modules exist and are used; folding them into "Daily life" would bury them.

## 4. Account creation and family onboarding
1. Create an account: email, password, optional first name (done).
2. Choose **Create a new family** or **Join a family** (invitation code or link).
3. Create: family name, avatar, country, currency, time zone are the only required items. Description and preferences are optional and can be set later from the dashboard.
4. Land on the Family Dashboard with a short checklist ("invite someone", "add your first task") instead of a long form.
5. The paywall leaves onboarding. The blueprint says no payment requirement at sign-up, and it matches the free plan promise. Plan information moves to Settings and to the moment a limit is reached.

## 5. Family creation and membership (built in Stage 1)
- The family is the row in `family_data`; the family id is the owner's user id. This avoids moving any data.
- **Roles:** Owner (implicit), Admin, Adult, Teen, Child, Guest. A person belongs to one family at a time.
- **Permission matrix (the defaults, changeable in one database function):**

| Permission | Owner | Admin | Adult | Teen | Child | Guest |
|---|---|---|---|---|---|---|
| Read and write the shared family data | yes | yes | yes | no | no | no |
| Family chat | yes | yes | yes | yes | yes | no |
| Create requests | yes | yes | yes | yes | yes | no |
| Approve requests | yes | yes | no | no | no | no |
| Manage members and invitations | yes | yes | no | no | no | no |
| Edit the family profile | yes | yes | no | no | no | no |
- **Per-member overrides:** the owner or an admin can widen or narrow one person's data, chat and request permissions. Management rights can never be granted by override.
- **Admins** cannot create or change other admins, cannot invite admins and cannot remove admins. Only the owner can.
- **Invitations:** a role, an optional email lock, an expiry (1 to 30 days, default 7), a use limit (1 to 50), revocable. The old six letter code still works and gives the Adult role.
- **Suspending** a member removes access to data and chat immediately and cannot be bypassed by rejoining with a code.
- **Limits come from the `plans` table** (Free 6 members, Premium 12, Family Plus 25 are proposals, editable any time, never overwritten by re-running the migration). One family can also have its own override. A family can never change its own plan from a browser, only the server (billing) can.

## 6. Family Dashboard (design)
A single scrolling page of cards, most important first, each hidden when the viewer's role has no access.
Members and roles, upcoming events, today's tasks, pending requests (with approve and reject), budget and spending this month, recent transactions, health and appointment reminders, announcements, notifications.
Sources: most cards already have data in the shared document (tasks, calendar, finance, health). Requests, announcements and notifications are new tables.

## 7. Individual Member Dashboard (design)
The person's own page: profile, today's schedule, assigned responsibilities, personal spending and allowance, study or work items, medication reminders, shopping list, their requests and their status.
Until Phase 2 gives personal finance and health their own tables, a teen or child sees what the server can safely give them: their requests, their chat, their assigned tasks (from the new request and task tables), not the shared document.

## 8. Request and Approval Center (design, Stage 2)
- Fields: category, title, description, destination, estimated cost, preferred date and time, priority, notes.
- Status path: Pending, Under review, Approved or Rejected, Processing, Completed (plus Needs information and Cancelled). Every change is written to a history table by the database itself.
- Approvers (owner, admin) can approve, reject, ask for information, change the arrangement, approve with a budget limit, or assign to another member.
- **Automatic approval rules** per family: category plus maximum amount.
- A notification row is created for the requester on every decision.
- Backend rules: a member creates and cancels only their own requests; only approvers decide; invalid status jumps are refused by a trigger.
- New tables: `family_requests`, `family_request_events`, `family_request_rules`, `family_notifications`.

## 9. Database schema and migration strategy
- **Additive migrations only**, numbered, safe to run twice, each tested on a scratch Postgres before it reaches you (tests are in `supabase/tests/`).
- Existing data is never moved or rewritten. Everyone already in a family becomes an Adult, which equals today's access.
- Order: 005 family core (done), 006 requests and notifications, 007 announcements, 008 onward: finance, health, inventory and tasks out of the shared document into tables (Phase 2), each with its own role rules and a one way copy of existing data.
- Platform administration (Phase 5) uses a separate admin role and an audit log table, with no access to family data by default.

## 10. Implementation stages
Each stage is small, tested, and shipped before the next one starts.

| Stage | What | Why | Files | Database | Must keep working | How it is tested |
|---|---|---|---|---|---|---|
| **1 (done)** | Roles, permissions, plans and limits, invitations, member management functions | Everything else depends on who can do what, enforced by the server | `supabase/migrations/005_family_core.sql`, `app.js` (friendlier join errors) | 005 | Sign-in, join with the old code, chat, shared data for everyone already in a family | 73 new checks, plus the earlier 43 and 16 still pass |
| 2 | Requests, history, rules, notifications | The core of the approval workflow | new migration 006 | 4 tables, triggers | Stage 1 rules | Database test suite for every status path and every role |
| 3 | Onboarding: create or join a family, invitation links, fix the "joined person gets detached" bug, remove paywall from onboarding | Start the new journey; stop losing members | `index.html`, `app.js`, `styles.css` | none or small | Existing sign-in and sign-up tests, onboarding data | Simulated browser tests and a screen scan |
| 4 | Members screen and Family Dashboard; link profile to account | Owner manages people and sees the family at a glance | same three files | small | Existing Family tabs and data | Same |
| 5 | Individual Member Dashboard | Every person gets their own space | same | small | Same | Same |
| 6 | Request Center screens | Members ask, owners decide | same | none | Same | Same |
| 7 | Navigation regrouped as in section 3 | Calmer, role aware menu | `index.html`, `app.js`, `styles.css` | none | All 20 screens reachable | Screen scan of every page and tab |
| 8 | Finance moves to its own tables (start of Phase 2) | Real privacy for money | migration, `app.js` | new tables plus one way copy | Existing finance data | Copy checks plus role tests |

## What Stage 1 changes for you today
- Run `005_family_core.sql` once in the Supabase SQL Editor (after 001 to 004). Nothing visible changes in the app.
- Everyone who already joined a family is now an Adult. Joining with the old code still works.
- New in the database: a 7th person cannot join a Free family (limit 6) and sees "This family is full"; a suspended person is told their access is paused.
- The member management and invitation functions exist but have no screen yet (Stages 3 and 4).

## Three decisions I need from you
1. **Starting limits:** Free 6 members, Premium 12, Family Plus 25. Keep, or give me your numbers? (Editable later without code.)
2. **Teens and children before Phase 2:** until finance and health have their own tables, they get chat, their own requests and their dashboard, not the shared document. Is that acceptable for now?
3. **Paywall:** remove it from onboarding (as the blueprint says) and offer plans from Settings instead?
