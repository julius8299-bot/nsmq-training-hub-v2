# Exact Phase 1 File Map

Paths below are relative to this isolated V3 checkout.

## Modified existing files

| File | Reason |
| --- | --- |
| .env.example | Origin and proposed PostgreSQL connection placeholders |
| .gitignore | Secrets, archives, private storage, databases and test/build outputs excluded |
| package.json | Safe startup and foundation/HTTP/bootstrap commands; security dependency patches |
| package-lock.json | Locked dependency changes |
| next.config.mjs | Retain upstream config with isolated tracing root and separate test output |
| next.config.ts | Remove duplicate so the MJS config is the single source of truth |
| prisma/schema.prisma | Additive foundation models and restrictive history FKs |
| prisma/seed.ts | Idempotent role setup; no destructive seed or auto-generation |
| scripts/ensure-database.ts | Explicit metadata initialization, no bank replacement |
| lib/ensure-question-bank.ts | Read-only compatibility helper |
| app/api/questions/route.ts | Membership/staff checks, input allowlist, draft review state |
| app/api/questions/[id]/route.ts | Permission checks, private edits, archival |
| app/api/attempts/route.ts | Current session ownership, bounded input, visibility checks |
| app/api/dashboard/route.ts | Per-student results and visible POTD |
| app/admin/page.tsx | Server-side staff gate around extracted existing dashboard |
| app/layout.tsx | Training page membership gate and account controls |
| README.md | V3 operation and honest phase boundaries |

## Added files

- middleware.ts
- app/login/page.tsx
- app/accept-invite/page.tsx
- app/api/auth/login/route.ts
- app/api/auth/logout/route.ts
- app/api/auth/session/route.ts
- app/api/auth/accept-invitation/route.ts
- app/api/admin/invitations/route.ts
- app/api/questions/[id]/review/route.ts
- components/admin-dashboard.tsx (the existing Admin interface extracted intact)
- components/auth-form.tsx
- components/account-controls.tsx
- components/invitation-form.tsx
- lib/auth/policy.ts
- lib/auth/crypto.ts
- lib/auth/service.ts
- lib/auth/http.ts
- lib/questions/input.ts
- lib/questions/seed-import.ts
- prisma/postgresql/schema.prisma
- scripts/bootstrap-admin.ts
- scripts/prepare-postgres-schema.ts
- scripts/check-legacy-preservation.ts
- scripts/check-v3-foundation.ts
- scripts/check-v3-routes.ts
- docs/v3/01-repository-audit.md
- docs/v3/02-schema-and-migration.md
- docs/v3/03-implementation-plan.md
- docs/v3/04-auth-and-review-contracts.md
- docs/v3/05-file-map.md
- docs/v3/06-verification.md
- docs/v3/07-pull-request-testing.md

## Deliberately retained

The homepage, header/logo, gallery mappings/assets, MotivationCorner, Question Bank
page and clue rendering, all standalone practice pages, Full Contest and its
difficulty mix, answer checker, timers and feedback components are unchanged.
Changes to their shared APIs establish authentication while retaining response
shapes. No production data file is included in a deliverable.
