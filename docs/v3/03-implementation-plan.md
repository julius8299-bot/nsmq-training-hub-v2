# Small, Testable V3 Changes

## 1. Database and identity foundation (implemented locally)

Add schema and four role records; rehearse migration on the copied database.
Add invitation acceptance, hash-only sessions, login/logout, shared throttles,
same-origin checks, protected APIs/pages, and student-owned attempts/dashboard.
Archive questions; preserve old records; gate newly written questions for review.
Tests cover session revocation/expiry/disabled users, invitations, role boundaries,
CSRF, cross-student isolation, visibility, seeding and migration preservation.

## 2. Reviewed bank and secure imports

Add staff review list/detail UI, source-evidence editor, bounded bulk jobs and
versioned question corrections. Keep current CSV/JSON workflow with staff-only
server validation. Build quarantined PDF/DOCX extraction as a worker with size,
MIME/magic-byte, archive-expansion and malware limits. Preserve original bytes,
page/paragraph coordinates, preambles, diagrams, answer alternatives and marking
schemes. Extraction creates drafts. Coaches correct OCR/layout/math and approve.
Test malformed uploads, duplicate files/rows, missing evidence, equations, diagram
association and retry idempotency. Only approved permitted material is published.

## 3. Concepts and Shortcuts Academy

Write a small reviewed lesson set for four subjects. Each shortcut explains why it
works, its limits, a memory aid, worked examples, common traps and timed drills.
Link questions to concepts and prerequisite concepts. Measure recall time and
accuracy independently. Test applicability and equivalent answer handling.

## 4. AI-assisted variants and approval queue

Use an asynchronous provider adapter with server-only credentials and job budgets.
Input a reviewed concept/template, parameter domain and source permission policy,
not an unpublished archive by default. Store prompt/model/generator versions,
parameter draws, output and provenance. Independently calculate numeric answers
with exact rational/decimal arithmetic, dimensions, bounds and edge-case tests.
Validate scientific assumptions and difficulty against a human-authored rubric.
Use a second independent verifier for explanatory text; agreement is evidence,
not proof. Reject unsupported claims, ambiguity and failed verification.
Require coach approval with recorded evidence. No automatic publication or
thousands-of-questions count target. Add approved candidates as new linked IDs.

## 5. Personal assessment and recommendations

Create immutable attempt events plus rubric/answer-version evidence. Persist
explainable recommendations by concept, difficulty, accuracy, response time,
spacing and sample size. Test two students never see each other's private history.
Coach dashboards need explicit scoped permission and audit events.

## 6. Synchronized live contest

Three lanes, two named students per lane, one authenticated device per team;
separate Quizmaster UI. Server is authoritative for current question, clue reveals,
timer, buzzer order, submissions and scores. Use compare-and-swap ContestSession
version, monotonic server deadlines, idempotency keys and an ordered event log.
Broadcast through a private realtime channel/SSE/WebSocket service; clients replay
from last event version after reconnect. Team payloads exclude answers and schemes.
Quizmaster mutations require contest:host; judges record partial POTD marks with a
10-mark rubric and audit trail. Test reconnects, duplicate/late submissions, role
spoofing, event ordering and exactly three teams of two.
The current local Full Contest remains a practice simulator until this ships.

## 7. Cloud deployment and operational readiness

Select managed PostgreSQL, private versioned object storage, email delivery and
realtime providers. Complete the migration parity/restore rehearsal, HTTPS origin
configuration, staff MFA (or managed identity), recovery, observability and
dependency/security review before production cutover. These external services
are not configured by this local Phase 1 implementation.

## Approval boundaries

The supplied request authorizes this local foundation. PostgreSQL data movement,
external email delivery, deployment, archive uploading, and publishing AI content
remain separate operations. No such operation was performed during Phase 1.
