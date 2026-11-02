# V3 Schema and Non-Destructive Migration

The implemented additive schema is prisma/schema.prisma (SQLite rehearsal).
prisma/postgresql/schema.prisma is a mechanically derived PostgreSQL proposal;
generate it with npx tsx scripts/prepare-postgres-schema.ts. Both validate under
the pinned Prisma version. No PostgreSQL service has been provisioned or migrated.

## Models

| Model | Purpose and integrity |
| --- | --- |
| User | Existing IDs/email/name retained; activation status, password hash, verified email and role reference added |
| Role | STUDENT, COACH, QUIZMASTER, ADMIN catalog; legacy User.role retained during backfill |
| Invitation | Canonical personal email, role, hash-only token, inviter/acceptor, expiry, use and revocation times |
| AuthSession | Hash-only bearer verifier, user, absolute expiry and revocation |
| AuthThrottle | Shared database counters for account and global authentication budgets |
| AuditEvent | Actor, action, entity, safe metadata, timestamp; no plaintext credentials |
| Question | Existing columns retained; seedKey, review status, archive time, preamble, source and concept references |
| Concept | Subject/slug unique; explanation and prerequisite IDs |
| QuestionVariant | Concept, base question, candidate JSON, parameters, verification evidence, generator/model/prompt versions and review state |
| SourceDocument | Private storage key, MIME, hash, uploader, permission evidence, provenance and quarantine state |
| QuestionAsset | Diagram storage key, hash, MIME, alt text/caption, source page and question reference |
| QuestionReview | Reviewer, immutable decision/notes/evidence, timestamp |
| Shortcut | Applicability, method, explanation, memory aid, traps, examples and timed-drill question IDs |
| Attempt (PracticeAttempt) | Existing physical table and Prisma delegate retained; immutable student/question link and measured outcome |
| Team / TeamMember | Named roster, unique seat per team, archived team retention |
| ContestSession | Legacy board fields retained; quizmaster, state version, server state and lifecycle times added |
| ContestTeam | Contest lane, team and hash-only device credential |
| ContestResponse | Unique idempotency key and contest/team/question/round-instance submission |
| ContestEvent | Ordered durable event stream, unique contest/version |
| StudyRecommendation | User/concept, difficulty, evidence, algorithm version and completion time |

Strings represent workflow statuses during SQLite/PostgreSQL coexistence. Role and
request values are allowlisted server-side. The PostgreSQL migration should add
CHECK constraints for statuses, seat IN (1,2), lane IN (1,2,3), nonnegative scores
where relevant, and the subject/round/difficulty domains after validation.
Mixed is a query mode, never a stored difficulty.

The Attempt table is deliberately not renamed. Product documentation calls it
PracticeAttempt; retaining the physical name and delegate preserves old history
and scripts. The optional roleId relation permits additive migration; ensureRoles
backfills known legacy roles but never activates existing demo accounts.

## SQLite rehearsal

1. Stop writes or take a consistent SQLite backup using the SQLite backup API.
2. Work on a copy. Record counts, all primary keys, clue/attempt relationships and a
   canonical hash of legacy columns. Keep the backup encrypted and outside Git.
3. Validate and generate Prisma Client, then inspect the schema diff. Apply only
   to the rehearsal copy. SQLite may rebuild tables to change FK actions; assert
   every original row and legacy column remains identical afterward.
4. Run npm run db:seed twice. This only initializes role metadata by default.
   Assert all existing users, questions, attempts and clue IDs are retained.
5. Do not run migrate reset, accept-data-loss, or destructive reseeding.

## PostgreSQL cutover (operator-run, not performed here)

1. Choose a private managed PostgreSQL service with TLS, automatic backups,
   point-in-time recovery, regional retention and a tested restore procedure.
   Create least-privilege app and migration identities. Configure secrets outside Git.
2. Produce a consistent encrypted SQLite snapshot and a manifest of table counts,
   primary keys, foreign keys and canonical legacy-field hashes.
3. Create a new staging PostgreSQL database. Generate/review the initial DDL from
   the proposed schema with the pinned Prisma CLI. Apply the DDL to this new target.
   Existing PostgreSQL installations must be introspected and baselined first;
   never apply an empty-database baseline over existing tables.
4. Copy records in dependency order, preserving IDs and UTC timestamps:
   Role, User, Concept, SourceDocument, Question, RiddleClue, Attempt, then dependent
   auth/review/team/contest/recommendation records. Resolve circular variant links
   in a second pass. Preserve JSON-string fields initially; convert to JSONB only
   in a later serializer migration with round-trip tests.
5. Backfill roleId, review statuses and Ghana aliases without changing identities.
   Normalize emails in an audited staging pass; report case-fold collisions for
   human resolution. Never merge students or assign demo attempts to real users.
6. Assert count, ID, content-hash and FK parity, UTF-8 maths/clues, timestamp precision,
   Ghana filter counts and personal attempt ownership. Run the foundation suite.
7. Put V2 into a brief write-maintenance window, replay/export the final delta,
   compare manifests, then switch the app secret to PostgreSQL. Keep the source
   SQLite snapshot read-only. Revoke old auth sessions and issue new sessions.
8. Rehearse rollback before cutover: restore the old connection only if no new
   PostgreSQL writes occurred, otherwise export/reconcile the post-cutover delta.

Do not run SQLite migrations against PostgreSQL or change only the provider and
assume the data moved. Database files are not cloud storage.

## Permanent records

No question/user hard-delete route is supplied. Question archival preserves
attempts and contest references. Import and variant publication add new IDs and
link to their sources; they never replace the bank. Versioned object storage
retains original archives and diagrams privately, using opaque keys rather than
public URLs or local file paths.

Reference: https://www.prisma.io/docs/orm/prisma-migrate/workflows/baselining
