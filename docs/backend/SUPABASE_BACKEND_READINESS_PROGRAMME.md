# CryptoInvest Supabase Backend Readiness Programme

Status: planning and read-only baseline captured; implementation is gated.
Target repository: `udofiaasianubong738-droid/Cryptocurrency`
Authoritative Supabase project: `yniphceoofuwzpelpksd`
Last inspected: 2026-11-06

## Operating rules

- This programme is backend-only. Do not start frontend UI work until all seven gates are passed and signed off.
- Admin and customer applications remain separate security principals and deployment entry points. They may use the same Supabase project, but never share a privileged browser client or service-role credential.
- Customer identity is always `auth.uid()`; customer queries and storage access are limited to records owned by that identity.
- CEO administration is server-enforced, allowlist-based and requires Supabase MFA assurance level AAL2 on every privileged server/API action. Middleware is not the only authorization layer.
- Do not trust user-editable metadata, request body role fields, client-side route guards, or customer-supplied customer IDs for authorization.
- Preserve existing data. No destructive migrations, table drops, data rewrites, DNS changes, production deployment changes, or live schema/policy/grant/secret changes under this programme.
- Keep `platform_control.financial_operations_enabled = false`. No payment processing, deposits/withdrawals execution, ledger posting, payouts, order execution, trading, or money movement is enabled. This programme concerns controlled records and read-only views only.
- All SQL changes are review artifacts until independently reviewed and run against an isolated test database. Never run verification probes against production.
- Do not expose Supabase service-role keys in browser code, public environment variables, or customer app bundles.

## Architecture target

### Separate applications
- Admin application: dedicated host/build target, dedicated auth entry point, CEO-only server routes, server-only privileged data access where strictly necessary.
- Customer application: separate host/build target and auth entry point; no CEO role, admin route, admin RPC, or service-role access.
- Shared backend: one canonical customer identity and canonical investment/record entities. Apps receive different views and permissions. Do not duplicate customer identities or financial record sources of truth.

### Record model
- Existing canonical tables include `profiles`, `investment_plans`, `investments`, `deposit_requests`, `withdrawal_requests`, `ledger_entries`, `investment_events`, and `investment_outcome_proposals`.
- Admin-only records and review metadata must not be directly writable by customers.
- Payment evidence must be private object storage, with metadata linked to a customer/request and access audited. A URL string alone is not proof of a private object or authorization.
- Profit/loss is an auditable, dated record or proposal. Customers see only approved/published records belonging to them. It must not silently create a ledger posting or trigger a payout.
- Market tables are informational/read-only for both apps. Market data must not be connected to order execution.

## Seven gated phases

### Phase 1 — Identity, roles and application boundary
Scope:
- Map all Next.js routes, API handlers, middleware, server clients, Edge Functions and Worker bindings.
- Establish distinct admin/customer auth contexts and server-side authorization helpers.
- Confirm customer cannot call admin APIs, admin data endpoints, or CEO-only RPCs.
- Confirm CEO allowlist is not writable by anon/authenticated/service-role API paths.
Exit tests:
- Unauthenticated admin access denied.
- Non-CEO AAL2 user denied from all admin APIs.
- CEO AAL1 denied from all privileged actions.
- CEO AAL2 allowed only for explicitly authorized admin operations.
- Customer A cannot read or mutate Customer B records.
- No service-role secret in client bundles or public environment variables.

### Phase 2 — Private admin record model and evidence storage
Scope:
- Review current admin/customer records and avoid duplicate canonical tables.
- Define a private admin write model for customer-linked plan/investment record maintenance and audit metadata.
- Define private evidence bucket, object key conventions, MIME/size constraints, metadata linkage and access rules.
- Keep customer submissions separate from CEO-reviewed record changes.
Exit tests:
- Customer cannot list/read another customer's evidence.
- Customer cannot write into admin evidence paths or overwrite reviewed records.
- CEO AAL2 can access only authorized evidence through server-side operations.
- Storage objects and metadata have matching customer/request ownership.
- Audit record identifies actor, action, target and timestamp.

### Phase 3 — Customer-only read projection
Scope:
- Build restricted read-only database views/RPCs or equivalent server-side queries for customer-facing approved records.
- Include only customer-owned profile, approved plan, investment status, visible events, approved outcomes and permitted payment evidence metadata.
- Exclude admin notes, internal review fields, other customers, raw evidence URLs, privileged flags and internal audit payloads.
Exit tests:
- Customer A sees only A's approved records.
- Customer B sees only B's approved records.
- Pending/rejected/unpublished outcomes are not visible unless explicitly designated customer-visible.
- Customer-facing projection exposes no admin-only fields.
- Customer has no direct write access to admin record tables.

### Phase 4 — CEO AAL1/AAL2 and authorization matrix
Scope:
- Enforce server-side user identity, enabled CEO allowlist and AAL2 on every admin API/RPC/storage operation.
- Review JWT assurance freshness, session refresh, revoked sessions, MFA enrollment and fail-closed behavior.
- Restrict API grants and service-role usage to the smallest necessary surface.
Exit tests:
- CEO AAL1 denied.
- CEO AAL2 permitted for approved admin record operations.
- Disabled CEO denied immediately.
- Non-CEO AAL2 denied.
- Missing/invalid JWT and auth service errors fail closed.
- API roles cannot modify CEO allowlist or bypass financial safety restrictions.
- TRUNCATE and trigger privileges are explicitly reviewed; RLS alone is not treated as protection from TRUNCATE.

### Phase 5 — Market-data integrity and read-only flow
Scope:
- Verify market asset, candle/quote and news tables, provider ingestion functions, timestamps, uniqueness/idempotency and stale-data handling.
- Keep market data informational. Disable all order execution, trading, broker routing and exchange credentials.
- Ensure customer views cannot mutate market data.
Exit tests:
- Public/customer market reads expose only intended market fields.
- Only approved ingestion path can write market data.
- Duplicate provider events are handled idempotently.
- Stale or missing market data is identified, not presented as current.
- No market-data path can create an executable order or financial transaction.

### Phase 6 — Build, typecheck, deployment-package and test verification
Scope:
- Run clean install, lint (if configured), typecheck, unit tests, production build and Cloudflare/OpenNext build for each app independently.
- Run API integration tests and browser E2E tests against isolated synthetic users.
- Inspect generated bundles for secrets and check environment bindings.
Exit tests:
- Admin app build green.
- Customer app build green.
- Typecheck and configured test suites green.
- Cloudflare Worker/OpenNext preview build green for each app.
- No live deployment performed as part of verification.
- All test output and commit SHAs recorded.

### Phase 7 — Final backend readiness review and frontend handoff
Scope:
- Re-run Supabase security/performance/health advisors.
- Review every RLS policy, table grant, function EXECUTE grant, storage policy, Edge Function and Worker binding.
- Resolve or explicitly accept every warning with owner and rationale.
- Produce a final backend inventory, evidence pack, remaining dependency list and front-end contract.
Exit tests:
- All critical/high security findings fixed or formally blocked with documented reason.
- All identity-isolation and authorization tests pass.
- No unreviewed production changes.
- Financial safety flag remains false.
- Independent review complete.
- Frontend handoff approved only after all seven gates pass.

## Read-only baseline captured on 2026-11-06

### Confirmed
- `platform_control.financial_operations_enabled` is `false`.
- Existing canonical tables include profiles, CEO allowlist, investment plans, investments, deposit/withdrawal requests, ledger entries, investment events, investment outcome proposals, order intents, market assets, market candles and market news.
- Existing market policies are read-only SELECT policies for anon/authenticated on market assets/candles/news.
- Existing profile/investment/request policies include combined customer ownership and CEO branches on some SELECT paths. These need deliberate policy separation and AAL2 review, not blanket replacement.
- Existing investment outcome proposal policies explicitly check CEO and AAL2 for the observed INSERT/SELECT policies.
- Existing order intent insert policy is customer-owned and requires `status='preview_only'` and `execution_enabled=false`.
- Only one Storage bucket was listed: private `avatars`. Its current object policies are scoped to the authenticated user's own avatar folder. No dedicated payment-evidence bucket exists.
- API table grants are broader than RLS policies alone would suggest: anon/authenticated have table privileges on several financial tables; service_role has broad DML/TRUNCATE/TRIGGER privileges. This needs least-privilege review.
- The current Next.js `middleware.ts` protects `/admin` and `/dashboard` using user lookup, CEO allowlist lookup and MFA assurance level. Middleware is not sufficient by itself; every API/route handler and privileged data operation needs equivalent server-side checks.
- Existing `nextjs/package.json` includes Next.js build/typecheck and OpenNext Cloudflare build/preview/deploy scripts.

### Known unresolved findings
- Supabase security advisor reported multiple security findings, including leaked-password protection disabled and a public-schema extension finding. Re-fetch and triage the exact current advisor list during Phase 7.
- Performance advisor reported RLS init-plan warnings, unindexed foreign keys, unused indexes and multiple permissive SELECT policies on support tickets and notifications. Do not drop unused indexes without workload evidence.
- No synthetic-user isolation tests have yet been demonstrated.
- No private payment-evidence bucket exists.
- The customer portal is a static preview and is not yet a fully authenticated, live-data customer application.
- Existing PRs #22, #23 and #24 are drafts; they are not production implementations and must not be represented as complete.
- CI statuses previously included Vercel build-rate-limit failures. This does not prove Cloudflare/OpenNext builds pass or fail.

## Current gate status

| Phase | Status | Evidence required next |
|---|---|---|
| 1 Identity/app boundary | In progress | Full route/API/Edge Function/Worker inventory and isolation tests |
| 2 Admin records/evidence | Not started | Reviewed schema/storage proposal and isolated tests |
| 3 Customer read projection | Not started | Restricted projection and cross-customer tests |
| 4 CEO AAL matrix | Not started | Synthetic AAL1/AAL2 and revoked-session tests |
| 5 Market data | Partial baseline | Ingestion and freshness verification |
| 6 Builds/tests | Not verified | Clean build/typecheck/test logs for both targets |
| 7 Readiness/handoff | Blocked | All previous gates pass and independent review |

## Change control

Any proposed migration must:
1. be additive or narrowly scoped and preserve existing data;
2. include preflight assertions and rollback/recovery notes;
3. be reviewed by a second engineer/security reviewer;
4. be tested on an isolated database with synthetic identities and no production data;
5. preserve the financial safety flag as false;
6. remain unmerged and unapplied until explicitly approved by the project owner.

This document is a programme plan and read-only baseline, not evidence that the backend is complete or production-ready.
