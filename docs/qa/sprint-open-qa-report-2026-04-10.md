# Sprint QA report — open sprint(s), project SCRUM (Lanka-Fix)

**Date:** 2026-04-10  
**Jira JQL:** `project = SCRUM AND sprint in openSprints() ORDER BY rank ASC`  
**Incomplete work in sprint:** none (`statusCategory != Done` returned 0 issues).  
**Sprint scope:** 14 stories, all **Done** in Jira at time of query.

**Overall verdict:** **NEEDS FIXES** — regression automation is red on the backend; frontend smoke test passes. Full end-to-end and API matrix tests were **not** run against a live server in this pass (code review + targeted file review + `mvn test` / `npm test` only).

---

## Automated test results

| Suite | Command | Result |
|--------|---------|--------|
| Backend | `mvn test` (from `backend/WedaLK/demo`) | **FAIL** — `WedaLkApplicationTests.contextLoads` does not start: `UserRepository` bean missing when `DataSourceAutoConfiguration` and `HibernateJpaAutoConfiguration` are excluded in the test. |
| Frontend | `CI=true npm test -- --watchAll=false` (from `frontend`) | **PASS** — `App.test.js` only (minimal coverage). |

---

## Stories in current open sprint

| Key | Summary (short) | Jira status | QA notes |
|-----|-----------------|-------------|----------|
| SCRUM-83 | Worker: submit verification, see status | Done | `WorkerDashboard.jsx` includes verification UX; **full upload/API path not exercised** in this run. |
| SCRUM-84 | Admin: review verification submissions | Done | Admin verification flows exist in app; **not exercised** against API. |
| SCRUM-85 | Seeker: verified badge on worker profile | Done | `WorkerProfilePanel.jsx` shows `FaCheckCircle` when `verificationStatus === 'APPROVED'`; tooltip text via `title` / `aria-label` matches AC3 intent. |
| SCRUM-86 | Seeker: rate/review after completion | Done | **Not re-verified** in UI/API this run. |
| SCRUM-87 | Seeker: see my submitted reviews | Done | **Not re-verified** this run. |
| SCRUM-88 | Seeker: ratings/reviews on worker profile | Done | `WorkerProfilePanel` supports `reviews` list + average; **sort/date order** not validated in this run. |
| SCRUM-89 | Seeker: mark job not completed with reason | Done | **Not re-verified** this run. |
| SCRUM-90 | Admin: view open disputes | Done | **Not re-verified** this run. |
| SCRUM-91 | Admin: resolve disputes with outcome | Done | **Not re-verified** this run. |
| SCRUM-92 | Worker: dispute status on dashboard | Done | `WorkerDashboard.jsx` loads `getMyWorkerDisputes()`, shows Open/Resolved and expandable details — **spot-check PASS** on code. |
| SCRUM-93 | System: verification submit RBAC (worker JWT) | Done | **Requires** live API calls (401/403/200); not run here. |
| SCRUM-94 | System: review/dispute ownership RBAC | Done | Same as above. |
| SCRUM-95 | System: admin-only verification/dispute resolution | Done | Same as above. |
| SCRUM-96 | UX: ErrorBanner for 401/403 trust actions | Done | `ErrorBanner.jsx` present; **exact copy** vs Jira AC strings and all call sites **not audited** in this run. |

---

## Lanka Fix core workflow (spot-check reminder)

Per product rules: SEEKER must not submit quotations; WORKER must not accept quotations; only one quotation accepted per request; accept transitions request to ASSIGNED and rejects others. **These were not re-tested** in this sprint-focused pass.

---

## Recommended follow-ups

1. **Fix `WedaLkApplicationTests`:** either enable a test datasource (e.g. H2 + JPA for tests), or replace the smoke test with a slice test / `@MockBean` for `UserRepository` so CI reflects a loadable context.  
2. **Manual/API regression:** run Postman or UI flows for SCRUM-83/84/86/87/89/90/91/93/94/95/96 against a running backend.  
3. **Optional:** add Jira comments on SCRUM-83–SCRUM-96 linking this report and noting backend CI failure.

---

## Definition of Done (sprint-level)

- [x] Stories in open sprint identified in Jira  
- [x] Automated tests executed where applicable  
- [ ] Backend automated tests green  
- [ ] Full AC-by-AC sign-off with live environment