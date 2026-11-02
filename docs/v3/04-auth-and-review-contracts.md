# Invitation, Access and Review Contracts

## Role permissions

| Permission | Student | Coach | Quizmaster | Admin |
| --- | --- | --- | --- | --- |
| Train / own dashboard | Yes | Yes | Yes | Yes |
| Author/import/review questions | No | Yes | No | Yes |
| Invite students | No | Yes | No | Yes |
| Invite staff/admins | No | No | No | Yes |
| Host future synchronized contests | No | No | Yes | Yes |

Role policy lives in lib/auth/policy.ts. The server reads the current database
role for every session; cookie claims do not grant a role. An ACTIVE account is
required. Legacy demo records have no passwords and remain inactive.

## Implemented endpoints

- POST /api/auth/login: canonical email and password; generic credential failure.
- POST /api/auth/accept-invitation: invited email, one-use token, name, passphrase.
  Role comes from the invitation, never the request. Acceptance is atomic.
- POST /api/auth/logout: revoke the session verifier and clear the cookie.
- GET /api/auth/session: minimal identity; no password/session hash.
- POST /api/admin/invitations: staff creates an email-bound expiring invitation.
  Only the authorized creator receives the bearer link once. Coaches can assign
  only STUDENT. A new invite revokes earlier pending links for that email.
- DELETE /api/admin/invitations?id=...: revoke an unaccepted invitation.
- POST /api/questions and PUT /api/questions/:id: staff-only allowlisted input;
  content becomes private PENDING_REVIEW.
- POST /api/questions/:id/review: reviewer decision plus notes, permission check,
  immutable review event and audit entry. Imported publication needs a source
  document with recorded permission evidence.
- DELETE /api/questions/:id: archive, preserving all attempts.

Public pages: homepage branding, gallery, login and invitation activation. Training
pages and all training data APIs require membership. The layout gate is backed by
API authorization on every data read/write; an interface link is not a permission.

## Credentials and sessions

Passwords use Node's asynchronous scrypt (N=131072, r=8, p=1), a random 16-byte salt
and timing-safe comparison. Session and invitation tokens contain 32 random bytes;
only SHA-256 verifiers are stored. Sessions expire after eight hours and support
immediate revocation or account disablement. Cookies are HttpOnly, SameSite=Lax,
path=/ and Secure in production. All browser mutations require an exact configured
APP_URL origin and JSON content (except DELETE). Production fails closed if APP_URL
is missing. Passwords are 15-128 characters, with no forced composition rules.

Authentication budgets are persisted in the database (per account plus a global
login cap). A deployment should add proxy-level IP/abuse protection, staff MFA,
reset/recovery and alerting. These are deployment gates, not claimed implemented.

Invitation links carry the token in a fragment, removed immediately by the
activation form. Email delivery is intentionally provider-neutral in this phase:
staff must privately deliver it to the named email owner. Possession of a link is
the activation factor; supplying an email address alone is not proof of identity.
No SMTP service is configured and no emails have been sent. Before wide rollout,
configure transactional mail or a managed invitation identity provider.

Initial admin: set BOOTSTRAP_ADMIN_EMAIL to the operator-controlled personal email,
then npm run auth:bootstrap. The command issues a 30-minute activation link only
while there is no active Admin. It creates no default password. Remove the
temporary bootstrap environment variable afterward.

## Content workflows

Original drafts: DRAFT -> PENDING_REVIEW -> APPROVED or REJECTED.
Imported archives: QUARANTINED -> SCANNED -> EXTRACTED -> HUMAN_CORRECTED ->
PERMISSION_CONFIRMED -> PENDING_REVIEW -> APPROVED.
Variants: DRAFT -> NUMERIC_VERIFIED -> SCIENCE_CHECKED -> DIFFICULTY_REVIEWED ->
HUMAN_APPROVED -> new Question row. Those worker stages are designed, not yet run.

Treat document contents and AI output as untrusted data. Do not execute macros,
evaluate extracted code, accept document instructions, or fetch embedded URLs.
Workers get no production user credentials. Private storage must authorize
short-lived asset delivery; never place trial archives or student exports in public/.

References:
- https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html
