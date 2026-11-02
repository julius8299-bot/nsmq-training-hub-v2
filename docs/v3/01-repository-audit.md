# V3 Repository Audit

Audit date: 2026-11-01 (America/New_York).

## Source and isolation

The supplied folder is an existing Next.js application, but it has no .git metadata,
remote, or directory named nsmq-training-hub-v2. V3 therefore lives in a separate
checkout at work/nsmq-training-hub-v3, with a local v2-baseline snapshot and branch
codex/v3-foundation. No remote was created or pushed. The original source and
prisma/dev.db are retained in place.

## Capabilities and gaps

| Area | Existing V2 capability | Foundation / remaining work |
| --- | --- | --- |
| Framework | Next 15.5.19, React 19.1.1, TypeScript, Prisma 6.19.3, SQLite | V3 patches Next to 15.5.28 and validation to Zod 4.6.7; remaining dependency maintenance is a deployment gate |
| Subjects and rounds | Mathematics, Physics, Chemistry, Biology; five rounds and route aliases /potd and /tf | Retained |
| Difficulty | Four stored levels; Mixed means no difficulty constraint | Retained |
| Question Bank | Pagination, search, difficulty/topic/Ghana filters, direct riddle clue boxes | Retained behind membership checks |
| Branding | NSMQ header logo, Ghanata team/gallery images and motivation components | Preserved byte-for-byte; the source contains no standalone Ghanata crest or custom favicon, so neither can be claimed present |
| Seed content | Legacy factories target 4,226 records, 1,001 Ghana flags, 680 riddles, 1,205 final-level labels | Counts are not scientific review evidence; no new factory batch generated in Phase 1 |
| Quality | Formulas, solution/trap fields, clue points, answer regression cases | No human approval, no proof of depth, substantial template reuse; review is required |
| Shortcuts | shortcutSolution fields in question feedback | Academy concepts, lessons, prerequisites and drills need implementation |
| Admin/import | Client-side CSV/JSON preview; manual question author/edit/delete | Previously public writes and private-data reads; foundation adds staff authorization, validation and review gating |
| PDF/DOCX | None | Quarantined extraction worker and staff review UI proposed |
| Auth | No login, invitation, password or session models | Foundation adds invitation activation, login/logout, session revocation, four roles |
| Attempts | All users write to student@nsmqhub.local | Foundation assigns attempts to authenticated identity; legacy demo history remains separate |
| Dashboard | Basic topic/difficulty summaries for the shared demo user | Foundation scopes summaries to each student; persisted recommendations model added |
| Contest | Client-side solo/three-team board, weighted round selection | No network sync, roster, server deadlines or authoritative live adjudication; designed for later phase |
| Storage | SQLite and local public images | Private object storage, backups and PostgreSQL cutover need deployment configuration |
| AI | Deterministic factory scripts | No AI API calls or verification/approval queue worker; design provided |

## Important code findings

1. prisma/seed.ts formerly deleted Attempt, RiddleClue, Question, Topic and User.
   It now initializes role metadata and preserves records. Legacy factory import is
   explicit, development-only, idempotent and creates private review candidates.
2. lib/ensure-question-bank.ts formerly seeded during a GET. Read paths no longer
   seed or modify questions.
3. API writes formerly spread client JSON directly into Prisma data. The new input
   allowlist strips identity, review and relation fields.
4. includePrivate=true formerly bypassed student visibility. It now requires staff.
5. Question deletion formerly cascaded into attempts. DELETE now archives; Attempt
   foreign keys use Restrict. User deletion also cannot silently remove history.
6. Existing answers are delivered to practice clients by design. This is acceptable
   for self-study but must never be reused as the team payload for future live contests.
7. Existing contest scoring trusts the locally revealed clue count. A synchronized
   contest must use server-recorded clue reveals, deadlines and a separate protocol.

## Review status policy

Legacy questions default to LEGACY_UNREVIEWED, not APPROVED. They remain available
to invited members to preserve existing practice. New/edited questions are
PENDING_REVIEW and private. APPROVED material can be published; REJECTED material
remains private. Before a reviewed-only production launch, coaches must review or
archive every legacy question and remove the transitional visibility allowance.

No unpublished question archive, student export, secret, database or dependency
tree is tracked in the new local Git repository.
