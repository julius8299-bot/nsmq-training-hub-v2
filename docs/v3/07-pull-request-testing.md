# Pull Request Testing and Production Prerequisites

## Scope and preservation

The foundation branch contains the original 194e118 commit and integrates upstream
main at b8df959 without reverting its Ghanata homepage, crest, browser icon, NSMQ
logo, gallery, Question Bank page or existing five-round practice/contest pages.
This is a source-only change, not a ZIP replacement or production deployment.
Do not merge automatically. Check any branch-preview deployment rules before
adding secrets; an isolated preview must never point at the production database.

## Prepare an isolated review checkout

```powershell
git clone --branch codex/v3-foundation --single-branch https://github.com/julius8299-bot/nsmq-training-hub-v2.git nsmq-v3-review
Set-Location nsmq-v3-review
npm ci
Copy-Item .env.example .env
```

Use Node.js 22+ and edit the ignored .env file. Set APP_URL=http://localhost:3000
and DATABASE_URL=file:./dev.db for this SQLite review checkout only. The latter
is relative to prisma/schema.prisma, so it addresses prisma/dev.db.

Obtain a private, consistent backup of the existing V2 database. Keep an unchanged
copy outside this checkout and put a second copy at prisma/dev.db. Stop writes
before making a raw SQLite copy, or use SQLite's backup API; never copy an active
database without its transaction state. Do not commit or upload these backups.

```powershell
npx prisma validate
npx prisma generate
npx prisma db push
npm run db:seed
$env:ORIGINAL_SQLITE_PATH = "C:\private-backups\unchanged-v2.db"
npx tsx scripts/check-legacy-preservation.ts
npx tsc --noEmit
npm run test:answers
npm run test:foundation
npm run test:v3-routes
npm run build
```

Run db push only on the disposable SQLite copy, without --accept-data-loss and
without migrate reset. Stop if Prisma proposes destructive changes. The parity
check compares original columns and IDs, including all 4,226 questions, against
the unchanged source snapshot. db:seed only initializes roles; it does not
repopulate an empty database. A source-only checkout therefore has no questions
until an existing database is copied or reviewed content is imported.

test:foundation creates its own synthetic database. test:v3-routes requires the
copied bank; it makes another disposable copy, creates fixture accounts there,
starts a loopback-only server on port 3143 and shuts it down. It checks the
homepage/crest/icon/gallery assets, all practice routes, all round filters, Ghana
filters, clue payloads and authorization boundaries. It does not touch the
production database.

## Test accounts and permissions manually

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL = "your-personal-test-email@example.com"
npm run auth:bootstrap
Remove-Item Env:\BOOTSTRAP_ADMIN_EMAIL
npm run dev
```

1. Open the private one-use activation link, which expires in 30 minutes. Set a
   passphrase, then sign in. Do not put the link into GitHub comments or logs.
   Bootstrap refuses once an active Admin exists; use that Admin's invitation
   flow for subsequent staff instead.
2. In /admin, invite distinct personal test emails for Student, Coach and
   Quizmaster. Deliver each invitation privately to the named email owner.
   Accept each in a separate browser profile with a new passphrase.
3. Signed out, / and /gallery must work; training routes must redirect to /login
   and /api/questions must return 401. Expired, revoked, mismatched-email and
   already-used invitation links must fail.
4. A Student must be able to train but not open /admin, create invitations or
   request /api/questions?includePrivate=true. A Coach can author/review and
   invite Students only, not grant staff/Admin access. A Quizmaster must not
   gain Coach/Admin authoring access; synchronized hosting is not implemented.
5. Clear Question Bank filters: expect 4,226 visible legacy questions in the
   unmodified snapshot. Ghana-context only: expect 1,001. Add Round 5: expect
   161 Ghana riddles with clue boxes and 5/4/3/3/3 scoring, not just Who am I?.
   Check every round and the existing search/subject/difficulty/topic filters.
6. Submit an attempt as Student A. Student B's dashboard must not show it. New
   or edited questions remain private pending review; an authorized approval
   makes an original question available. Imported content also requires source
   permission evidence. Archiving a question must not delete historical attempts.
7. Sign out, then verify the old session cannot access APIs. Re-run db:seed and
   confirm existing users, questions and attempts remain; do not re-run the
   original parity check after deliberately adding manual fixture records.

Run npm run build in clean CI and test npm start behind HTTPS before approval.
The earlier Windows build failed with EPERM; do not treat successful dev tests
as evidence of a production build. Dependency audit findings also need resolution.

## Environment variables

| Variable | Scope and requirement |
| --- | --- |
| DATABASE_URL | Required by the current runtime Prisma client. Currently SQLite; use only the review copy for these tests. A PostgreSQL URL alone does not convert the SQLite schema/client. |
| APP_URL | Required production canonical HTTPS origin, including the correct host and port. Used for invitation links and strict mutation Origin checks. No wildcard or alternate preview origin. |
| NODE_ENV | Set by Next.js/hosting; production must run the production build with NODE_ENV=production so cookies are Secure. Do not override production with development. |
| BOOTSTRAP_ADMIN_EMAIL | Temporary first-Admin CLI input only. Remove after secure bootstrap; it is not a default user or password. |
| POSTGRES_DATABASE_URL | Migration-design tooling only, used by prisma/postgresql/schema.prisma. The application still imports the SQLite-generated client until the planned, tested cutover. |
| ORIGINAL_SQLITE_PATH | Read-only parity-test input pointing to the unchanged private V2 backup. Not needed at runtime. |
| NSMQ_TEST_DIST | Set internally by the HTTP test to isolate test build output. Not a production setting. |
| IMPORT_LEGACY_QUESTION_FACTORY | Leave unset/false. Deliberately refused in production; do not use it to inflate question counts. |

There is no NEXTAUTH_SECRET, SESSION_SECRET, GitHub OAuth setting or AI API key
used by this foundation. It uses database-backed opaque random sessions and
passwords. Do not invent extra environment variables or expose secrets via
NEXT_PUBLIC_*.

## External services and deployment gates

- HTTPS-capable Node hosting, secrets management and a private staging environment
  with sufficient memory for scrypt. No production deployment is performed here.
- Managed PostgreSQL with access controls, encrypted backups, point-in-time
  recovery and tested restores for the intended permanent-record deployment.
  Complete the separate staged schema/client/data cutover in
  02-schema-and-migration.md; never run production db push or reset.
- Private, versioned object storage with quarantine and short-lived authorized
  access before enabling document/diagram imports. Public gallery images are not
  a substitute. This integration is not implemented yet.
- Verified email delivery, account recovery and staff MFA before relying on
  self-service production account administration. Invitations currently need
  private manual delivery; there is no SMTP/API adapter or mail configuration yet.
- Operational monitoring, protected audit retention, abuse controls and deployment
  CI. Fix the documented dependency advisories and achieve a clean production
  build before production approval.
- AI provider credentials, document extraction/scanning workers and a durable
  realtime event transport will be needed for later V3 features. They are not
  wired up and are not required merely to run this Phase 1 authentication demo.

The full V3 objectives are not implemented by merging this foundation. Keep the
current website running until production blockers, data migration, restore tests
and coach acceptance are complete.
