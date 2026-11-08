# NSMQ Training Hub V3

Training platform for the Ghanata SHS Science and Maths Quiz team: five NSMQ rounds, element drills,
a study-mode question bank, student dashboards, and coach tools for reviewing questions and following progress.

**To put the site online for coaches, follow [DEPLOY.md](DEPLOY.md)** (Vercel + Neon, about 15 minutes, no coding).

## What changed in the Phase 1 fixes (branch claude/v3-phase1-fixes)

- **Fair training.** Answers, solutions and unseen riddle clues are sent only after a student answers. The server
  records when each question was shown and how many clues were revealed, so points, time limits and
  double submissions cannot be faked from the browser. A timeout scores 0, never a penalty.
- **Real variety.** Every round draws a random set of *distinct* questions and favours ones the student has not
  seen this week. The legacy bank repeats items heavily (4,226 rows but only 369 distinct question/answer pairs;
  e.g. 680 riddle rows are 68 distinct riddles), so new content is the main Phase 2 priority.
- **Problem of the Day** is the same for everyone and changes daily at midnight GMT.
- **Answer checking** accepts 1,000 / 1000, 2.4 × 10³, x = 3 → 3, metre/meter, Carbon-14 / carbon 14, and units
  written several ways, but rejects a wrong stated unit (24 kg for 24 m/s). Spelling slips are not forgiven on
  purpose (ethane/ethene differ by one letter). A catalog-wide test checks no question accepts another's answer.
- **Element drills**: all 118 elements, 1,387 generated questions (symbols, atomic numbers, groups/periods/blocks,
  families, states, configurations, ions, isotopes, formula masses, riddles) with shortcuts, plus a clickable table.
- **Coach tools**: review queue (coaches cannot approve their own questions; edits to live questions wait as drafts
  while the live version stays in use), searchable question list, one-answer-per-line form (commas are safe),
  server-validated bulk import with a CSV template, student progress, members with password-reset links,
  disable/re-enable, saved team-contest results.
- **Accounts**: password reset links, 10-character minimum with a common-password block, sign-in throttling that
  counts only wrong passwords (per account and per network), a class can sign in at once, `/setup` for the first admin.
- **Hosting**: runs on SQLite locally and PostgreSQL online through Prisma driver adapters. The hosted build loads the
  full bank and element drills automatically and never duplicates them. `npm run db:copy-local` brings existing
  student records across.

## Phase 1 deliverables

- [Repository audit](docs/v3/01-repository-audit.md)
- [Schema and migration strategy](docs/v3/02-schema-and-migration.md)
- [Small testable implementation plan](docs/v3/03-implementation-plan.md)
- [Authentication and content review contracts](docs/v3/04-auth-and-review-contracts.md)
- [Exact changed-file map](docs/v3/05-file-map.md)
- [Verification and limitations](docs/v3/06-verification.md)
- [Pull request testing and production prerequisites](docs/v3/07-pull-request-testing.md)
- [Pre-merge security review and CI](docs/v3/08-pre-merge-review.md)

## Local setup

Use Node.js 22+ and npm. Copy .env.example to .env and set APP_URL to the
actual origin (scheme, host and port). On PowerShell:

```powershell
npm install
Copy-Item .env.example .env
npm run db:generate
npm run db:ensure      # creates/updates tables, loads the 4,226-question bank and element drills (skips existing)
$env:BOOTSTRAP_ADMIN_EMAIL = "your-private-email@example.com"
npm run auth:bootstrap
npm run dev
```

Tests: `npm run test:foundation`, `test:answers`, `test:elements`, `test:hosted-import`, `test:preservation`,
`test:v3-routes`, and `npm run typecheck`.

Open the one-use activation link printed by auth:bootstrap, set a passphrase,
and sign in. The first Admin can then invite team members from /admin.
No password or activated account is provided by default. The bootstrap command
refuses to issue a new admin invite once an active Admin exists.

db:ensure is the local setup command. It only adds: missing tables and columns, roles, any of the 4,226 bank
questions not already present (existing copies are matched, never duplicated), and the element drills. It never
deletes or edits questions, users or attempts. npm run dev and npm start never migrate or seed the database.

## Identity and permissions

The homepage and gallery remain public. Training pages/APIs require an activated
invited account. Coach and Admin can author/import/review; Quizmaster has a separate
hosting permission for the future synchronized contest. Student attempts and
dashboard results are owned by the current session, not a shared demo identity.

Session/invitation tokens are stored only as hashes. Browser mutations require the
configured origin. In production, set an HTTPS APP_URL; session cookies are Secure.
Deliver invitation and password-reset links privately (e.g. WhatsApp) to the person they are for.
Automatic email delivery and staff two-factor sign-in are planned for a later phase.



## Questions and review

Existing legacy questions are retained as LEGACY_UNREVIEWED during transition.
This label does not certify scientific quality. New/edited questions are private
PENDING_REVIEW. The review endpoint records a Coach/Admin decision and requires
permission evidence before imported material can be published. Deleting in Admin
archives the question and retains every attempt.

The existing CSV/JSON preview and question APIs retain their public response shapes
for authenticated clients. PDF/DOCX extraction, a full review queue UI, the
Shortcuts Academy, AI workers and synchronized live contests are designed but not
implemented in this foundation. The existing Full Contest is still local practice.

## Checks

```powershell
npx prisma validate
npx tsx scripts/prepare-postgres-schema.ts
npx prisma validate --schema prisma/postgresql/schema.prisma
npm run test:foundation
npm run test:preservation
npm run test:v3-routes
npm run test:answers
npm run build
```

The foundation tests use disposable SQLite databases. The V3 HTTP test copies the
existing development database into an ignored test directory, creates fixture
accounts there, starts npm run dev on loopback, checks access boundaries/routes,
and shuts down the process tree.

test:preservation reconstructs only the existing unchanged catalog in a disposable
legacy-schema database, applies the additive V3 schema, seeds twice and verifies
all original IDs/fields including attempt fixtures. It never populates the app's
database. Use work/ci-bank-path.txt as NSMQ_TEST_DATABASE_PATH to run route checks
against this test fixture instead of a private development database.

GitHub Actions runs TypeScript, authentication/security, bank preservation and
production build/start checks on pull requests to main. Jobs use read-only
repository permissions and no production database or secrets. No job deploys or
merges. npm audit checks the complete locked dependency tree, including tooling.

Legacy V2 tests that call training APIs anonymously now need authenticated fixture
sessions; use the V3 suite for authorization-aware checks. test:answers remains
provider-independent. Never run legacy destructive setup against permanent data.

## PostgreSQL and cloud

prisma/postgresql/schema.prisma is a validated proposal, not an applied migration.
Follow the staged migration/parity/rollback plan before changing connection secrets.
Keep archives and diagrams in private versioned object storage, with provenance
and permission evidence. Do not put student exports, source archives, database
backups, password links or environment secrets in Git or public/.
