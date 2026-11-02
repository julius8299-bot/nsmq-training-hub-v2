# Phase 1 Verification Record

Date: 2026-11-01 (America/New_York).
Branch: codex/v3-foundation in the isolated work/nsmq-training-hub-v3 checkout.
No external service was provisioned, no email was sent, and no source was pushed.

## Checks run

| Check | Result |
| --- | --- |
| npm install | Passed in isolated dependency tree |
| npx prisma validate | Passed, SQLite foundation schema |
| npx prisma generate | Passed, pinned Prisma 6.19.3 |
| npx prisma db push --skip-generate | Passed against the V3 database copy only |
| Proposed PostgreSQL schema generation/validation | Passed; no PostgreSQL connection or migration |
| npx tsc --noEmit | Passed |
| npm run test:foundation | Passed 9 grouped security/data scenarios |
| npm run test:v3-routes | Passed on the patched dependency set |
| npm run test:answers | Passed 10 existing answer-checker cases |
| Repeated npm run db:seed | Passed; no question/user/attempt replacement |
| Legacy SQLite parity check | Passed counts and content hashes for original columns |
| git diff --check | Passed |
| npm run build / direct Next CLI build | NOT PASSED: Windows EPERM creating build output folders |
| npm audit --omit=dev | NOT CLEAN: 4 high and 1 moderate entries, no critical entries |

## Preserved legacy data

- User: 2 rows, legacy-field hash matches.
- Question: 4,226 rows, legacy-field hash matches.
- RiddleClue: 2,720 rows, legacy-field hash matches.
- Attempt: 0 source rows; fixture attempts were created and retained by regression tests.
- ContestSession: 0 source rows.
- Topic: 57 rows, legacy-field hash matches.

No new legacy factory batch was generated. Ghana counts remain 1,001 questions and
161 riddles in the copied bank. Those counts are regression evidence, not proof
of scientific review.

## Foundation security scenarios

Tests exercise email-bound invitation activation; expired/revoked/replayed links;
uninvited login denial; salted password verification; hash-only session storage;
Student/Coach/Quizmaster/Admin permission boundaries; staff role-assignment limits;
anonymous and private-query denial; CSRF origin denial; input mass-assignment
protection; pending-review visibility; human approval of original questions;
import permission-evidence requirements; Ghana filter/clue response compatibility;
session-owned attempts; cross-student dashboard isolation; exact riddle scoring;
archival; repeated seed idempotency; disabled/expired/revoked session denial; and
database-backed login throttling.

The HTTP suite starts npm run dev on loopback with a disposable copy of the bank.
It verifies public branding/gallery/login/assets, unauthenticated redirects,
authenticated access to all existing training routes, student Admin denial,
private-query denial, login cookie attributes and the bank filter counts.

## Build failure evidence

Repeated build attempts failed while Windows denied mkdir under .next/types/app/api,
.next/server/app/api, or an alternate output directory. Explicit output permissions,
folder preparation, direct CLI invocation and a single-process build were tried.
One intermediate run compiled TypeScript/webpack but later encountered a manifest
conflict when dev/build shared output; that was fixed by giving HTTP tests separate
output. It is not counted as a successful production build.

The final source passes TypeScript and runtime development tests, but the optimized
production bundle has not been verified in this environment. Re-run npm run build
in an unrestricted clean checkout/CI environment before production use.

## Dependency audit

The inherited Next 15.5.19 and Zod 3 dependencies had current advisories. V3 pins
Next 15.5.28 and Zod 4.6.7 and refreshes compatible nanoid, source-map-js and sharp
transitives. The final npm audit still reports:

- Prisma / @prisma/config / deepmerge-ts: high (three linked entries).
- Next's nested PostCSS: high, and the resulting Next dependency entry: moderate.

Resolve these through a tested dependency update/override or version migration
before deployment. No clean-audit or production-security claim is made.
Advisory evidence comes from the npm audit run and:
https://github.com/advisories/GHSA-p293-qw3h-jr36
https://github.com/advisories/GHSA-mrhx-c7xc-m3w5

## Scope limits

The initial audit snapshot lacked a standalone Ghanata crest and browser icon.
The subsequent upstream integration retains both from GitHub main, along with
its existing homepage and gallery. No replacement branding was invented.
Legacy questions remain explicitly unreviewed. PDF/DOCX extraction, full review
queue UI, Academy, AI verification workers, realtime contests, managed email/MFA,
PostgreSQL cutover, private cloud object storage and backup/restore operations
remain planned work. This deliverable is the initial foundation, not the complete
V3 platform or a production deployment.

## Upstream integration checks (2026-11-02)

The branch integrates main at b8df959 and retains 194e118 in its history.
Homepage, icon, gallery mappings/assets, Question Bank page and all existing
practice/contest page sources match upstream main. A duplicate Next.js config
was consolidated into next.config.mjs so test-output isolation takes effect.
The public /icon endpoint was exempted from the login redirect and regression
tested; the icon source itself is unchanged.

The expanded HTTP suite passed for the public crest, logo, icon, every configured
gallery image, all training routes and all five round filters. Bank results:
4,226 total; 1,001 Ghana-context; 161 Ghana-context riddles. Round totals:
1,186 Round 1; 1,000 Speed Race; 520 POTD; 840 True/False; 680 Riddles.
The nine foundation scenarios, ten answer cases, TypeScript and legacy parity
checks also passed. The production build still fails with Windows EPERM under
.next/types/app/accept-invite; the dependency audit remains four high and one
moderate entry. These are not resolved by preparing a pull request.

Publishing from the isolated desktop session cannot use the account's Windows
GitHub credentials. No login was reset, production secret changed or automatic
merge attempted. The prepared branch can instead be pushed from an authenticated
normal PowerShell terminal; private databases remain outside Git.
