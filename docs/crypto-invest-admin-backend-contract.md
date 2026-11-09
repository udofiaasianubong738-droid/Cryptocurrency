# CryptoInvest Admin Backend Contract (Prepared, Not Connected)

Status: design contract only. This document does not create database objects, deploy APIs, connect the preview UI, or enable financial operations.

## Scope boundary

The admin preview remains a static, frontend-only workspace. No Supabase URL, anon key, service-role key, access token, database credentials, or API base URL is embedded in the browser. No login or credential-enrolment screen is part of this phase.

The authoritative Supabase project is `yniphceoofuwzpelpksd`. Existing data must be preserved. Do not run migrations, create tables, change RLS policies, create users, or modify authentication factors until the live schema and current policies have been inspected and the proposed changes have been approved.

## Required server-side architecture

- Cloudflare Worker/API is the only public application API boundary.
- Supabase service credentials, if ever required, stay in Worker secrets and are never sent to the browser.
- Supabase Auth validates the session; every admin request independently enforces the single CEO allowlist and MFA assurance level AAL2.
- Authorization is deny-by-default. No client-supplied role, email, user ID, or route parameter is trusted as proof of CEO authority.
- Customer-facing access remains isolated from admin access. Enforce the existing row-level security model; do not weaken policies for convenience.
- All admin data endpoints are read-only in this scope. No deposits, withdrawals, transfers, payouts, trade execution, investment creation, balance edits, or other financial mutations.
- `financial_operations_enabled=false` must remain a server-enforced invariant, not merely a disabled button.
- Audit events are append-only and record actor, action, target, outcome, request correlation ID and timestamp. Never log credentials, tokens, MFA secrets, or full sensitive customer payloads.
- Apply bounded pagination, input validation, response minimisation, rate limiting and security headers.
- CORS allowlist must be explicit. Do not use wildcard origins with credentials.

## Proposed read-only API contract

All routes are versioned under `/admin/api/v1`. All routes require a valid Supabase session, CEO allowlist match and AAL2. These are proposed contracts, not live endpoints.

| Route | Purpose |
|---|---|
| `GET /session` | Return the server-verified administrator session and assurance state |
| `GET /overview` | Return verified aggregate counters and data freshness metadata |
| `GET /customers` | Search and paginate customer directory metadata |
| `GET /customers/:id` | Return the minimum authorised customer profile fields |
| `GET /customers/:id/status` | Return account and verification status |
| `GET /investment-records` | Search and paginate existing investment records |
| `GET /investment-records/:id` | Return an authorised record detail |
| `GET /investment-plans` | Return existing CEO-approved plan metadata |
| `GET /reports/performance` | Return verified performance aggregates and reporting period |
| `GET /reports/customers` | Return authorised customer report metadata |
| `GET /reports/platform` | Return platform report metadata |
| `GET /activity` | Return verified platform activity events |
| `GET /audit` | Return permitted audit-log entries |
| `GET /security/status` | Return non-secret security posture indicators |
| `GET /sessions` | Return the current CEO's permitted session metadata |
| `GET /system/health` | Return safe service health and data freshness |
| `GET /notifications` | Return notification delivery metadata; no send endpoint |
| `GET /data-quality` | Return validation job summaries and issues |
| `GET /review-queue` | Return items requiring human review; no mutation endpoint |

## Response conventions

- Use a stable envelope: `{ "data": ..., "meta": { "requestId": "...", "generatedAt": "...", "source": "verified" } }`.
- Empty datasets return an empty collection, not fabricated demo rows.
- Unavailable or stale data is identified explicitly; never substitute sample balances, customer identities, returns or market values.
- Use opaque identifiers in lists and expose personal data only on a detail endpoint when necessary and authorised.
- Pagination uses bounded `limit` and opaque `cursor` values. Reject oversized limits and invalid filters.
- Errors use a stable code and safe message; never expose stack traces or database details.

## Frontend connection gate

Do not connect the frontend until all of the following have been completed and reviewed:

1. Read-only inspection of the live Supabase schema, views, functions, grants and RLS policies.
2. Confirmation of the CEO's immutable auth user ID and the existing single-admin allowlist source.
3. Verification of current MFA factor state and server-observed AAL2 behavior; do not delete or replace verified factors.
4. Approved mapping from existing tables/views to the API contract above. Do not guess column names or add migrations to make a mock UI work.
5. Worker secrets and explicit origin allowlist configured without exposing them to the browser.
6. Automated tests prove unauthorised, non-CEO and non-AAL2 requests are denied.
7. Automated tests prove every endpoint is read-only and the financial-operation gate cannot be bypassed.
8. A separate approval is given to connect the preview frontend to the API.

## Explicitly out of scope for this phase

- Admin login, password reset, authenticator enrolment or MFA challenge UI.
- Any live Supabase connection from the browser.
- Database migrations or policy changes.
- AI execution or external AI-provider calls.
- Notification sending.
- Financial operations or state-changing admin actions.
