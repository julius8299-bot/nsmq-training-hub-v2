# PR 1 Pre-Merge Security Review and CI

Review date: 2026-11-02. Branch: codex/v3-foundation. No merge or deployment.
This follow-up supersedes the dependency findings in the initial audit; those
earlier records remain historical evidence, not the current dependency status.

## Findings addressed

1. High: concurrent unauthenticated scrypt calls could multiply the roughly
   128 MiB derivation cost and exhaust process memory. lib/auth/crypto.ts now
   admits one active operation and four queued operations per process. Further
   requests fail closed with 503 and Retry-After, without weakening password
   hashing. Tests verify overload, recovery and salted/password checks.
2. High: a pending invitation could still grant a role after its issuer was
   disabled or lost permission. Acceptance now checks current issuer status and
   grants inside the claim transaction. Bootstrap invitations also require no
   active Admin. Disabled/downgraded-issuer regressions verify no account is made.
3. High: approval could publish a draft edited since the reviewer saw it.
   Question.revision and QuestionReview.questionRevision are additive fields.
   Edits/archival advance the server-owned revision. Review requires the displayed
   revision and atomically compares revision, review state and archival status.
   A stale review returns 409 and cannot make the question public.
4. Medium: the shared 200-attempt/15-minute login budget let one attacker lock
   out the whole team. The persistent global budget is removed. Per-account
   throttling and the bounded hashing admission queue remain. A regression
   verifies unrelated activity cannot cause a persistent team-wide lockout.
5. Production/gallery: identical public assets were tracked under case-colliding
   NSMQ-trophy.jpg and nsmq-trophy.jpg names. On Windows, next start returned 404
   for the lowercase URL even though development mode worked. Keep the canonical
   lowercase file and its original blob; a fallback rewrite preserves the old
   uppercase URL. Tests verify every original asset hash and prohibit case
   collisions rather than deleting any unique gallery image.

## Dependency repairs

- Keep Next 15.5.28 and Prisma 6.19.3 rather than introduce unrelated major
  framework/database migrations in this review.
- Pin PostCSS 8.5.32 and override all nested PostCSS copies with that same patch.
- Scope deepmerge-ts 8.0.0 to @prisma/config. Prisma uses its unchanged deepmerge
  API. Validate/generate/push, legacy migration tests and a real defineConfig
  loader fixture verify compatibility rather than ignoring the advisory.
- Scope esbuild 0.28.2 to tsx; exercise TypeScript scripts in every CI job.
- Refresh compatible Browserslist, baseline-browser-mapping and selector-parser
  patches in the lockfile. No audit suppression or forced major audit fix.

Both full-tree npm audit --audit-level=low and npm install report zero known
vulnerabilities on the reviewed lockfile. This is advisory evidence at a point in
time, not proof that all application security risks have been eliminated.

Primary advisory references:
- https://github.com/advisories/GHSA-ggr8-5vv4-36mx
- https://github.com/advisories/GHSA-fxqj-rqcc-2cmp
- https://github.com/advisories/GHSA-c83g-rgw3-j3cx
- https://github.com/advisories/GHSA-rj75-hqrm-r3gf

## GitHub Actions

.github/workflows/v3-foundation.yml adds four independent named checks:

| Check | Coverage |
| --- | --- |
| TypeScript | Locked clean install, Prisma generation, strict tsc |
| Authentication and Security | Full dependency audit, patched config-loader validation, PostgreSQL proposal parity/validation, authentication/authorization/review/data tests, answer regression tests |
| Question Bank Preservation | Upstream source/branding parity, all 4,226 legacy catalog entries migrated and re-seeded with full ID/field hashes, fake student/attempt/contest history, authenticated HTTP/filter/clue checks |
| Production Build | Clean Linux npm run build, then npm start and production HTTP checks including Secure cookies against a disposable migrated catalog fixture |

Actions are pinned by full official commit SHAs. Workflow permissions are
contents:read, checkout credentials are not persisted, no production secrets are
used, and the workflow never deploys or merges. It uses pull_request, not the
privileged pull_request_target event. The fake PostgreSQL URL is validation-only;
no cloud database is contacted.

An administrator should require these four checks on main using repository
rules. This change does not alter branch protection or grant administration.

## Preservation and build evidence

The protected source matches main at b8df959: homepage, Ghanata crest, NSMQ logo,
browser icon, gallery image content/mappings, Question Bank UI and five existing
practice/contest round pages. The original private SQLite snapshot and its V3
copy still match every legacy-field hash: 4,226 questions, 2,720 clues, two users
and 57 topics. Original student data is never uploaded to CI.

CI reconstructs only the existing unchanged catalog in an owned disposable
database with the original main schema, adds synthetic students/attempts/contest
records, upgrades the schema and runs role-only seeding twice. It verifies every
original field and ID before authenticated route checks. This is not a new
training-content batch or a claim of scientific review.

Local tests pass: 13 authentication/security scenarios, 10 answer cases,
TypeScript, schema, preservation and development HTTP checks. The Windows EPERM
error was an execution-permission
problem: after explicit write permission was granted to the generated .next
directory, two npm run build attempts passed compilation, type checking, all 27
generated pages and build tracing. Repeated clean Windows builds can still hit
intermittent EPERM during directory creation. No ignoreBuildErrors or skipped
validation was added. CI requires a clean Linux build and HTTP checks against
next start, not only development mode. Inspect current PR results before merging.

## Remaining production gates

This is still the Phase 1 foundation. Managed PostgreSQL cutover/restore proof,
private import storage, email delivery/recovery, staff MFA and reviewed-only
content policy are not implemented by this change. Edge-level IP rate limiting,
throttle/session retention and resource monitoring are needed before production;
per-account throttling and local hashing limits do not replace those controls.
The existing Full Contest is self-study and does not provide authoritative live
multi-team scoring. Do not deploy or treat this PR as the completed V3 platform.
