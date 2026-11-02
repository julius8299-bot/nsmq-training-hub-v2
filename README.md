# NSMQ Training Hub V3 Foundation

An incremental foundation for the Ghanata SHS Science and Maths Quiz team.
This checkout retains the V2 training pages, branding and gallery. The local
v2-baseline branch records the supplied source; V3 changes are on
codex/v3-foundation. The branch also includes the upstream main branding updates,
including the Ghanata crest and browser icon. No cloud cutover has been performed.

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
npm run db:ensure
npm run db:seed
$env:BOOTSTRAP_ADMIN_EMAIL = "your-private-email@example.com"
npm run auth:bootstrap
npm run dev
```

Open the one-use activation link printed by auth:bootstrap, set a passphrase,
and sign in. The first Admin can then invite team members from /admin.
No password or activated account is provided by default. The bootstrap command
refuses to issue a new admin invite once an active Admin exists.

db:ensure is an explicit SQLite development setup command, not a production
migration command. npm run dev and npm start never migrate or seed the database.
The source ZIP contains no database; use an encrypted copy of the existing V2
database to retain its question bank. A new empty database intentionally starts
with zero questions until reviewed content is imported. db:seed initializes role
metadata only and never deletes student records.

## Identity and permissions

The homepage and gallery remain public. Training pages/APIs require an activated
invited account. Coach and Admin can author/import/review; Quizmaster has a separate
hosting permission for the future synchronized contest. Student attempts and
dashboard results are owned by the current session, not a shared demo identity.

Session/invitation tokens are stored only as hashes. Browser mutations require the
configured origin. In production, set an HTTPS APP_URL; session cookies are Secure.
Deliver invitation links privately to the invited email owner. Email provider
integration, account recovery and staff MFA are planned deployment work.

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
