# CryptoInvest database authorization and financial safety review

## Status

**Review package only. Nothing in this folder has been applied to the authoritative Supabase project.** It is not a production migration. It must be independently reviewed and tested on an isolated database with synthetic identities before any live change is considered.

Authoritative project inspected read-only: `yniphceoofuwzpelpksd`.

## Verified baseline

- PostgreSQL 17; all inspected public tables have RLS enabled.
- `platform_control.financial_operations_enabled` currently reads `false`.
- There is currently one enabled CEO record.
- `private.is_ceo()` checks the enabled CEO allowlist but does not itself require AAL2.
- Several CEO policies still rely on `private.is_ceo()` without an AAL2 condition. Other admin policies already include AAL2.
- Customer ownership columns on deposit requests, withdrawal requests, investments, ledger entries, investment events, and investment outcome proposals reference `auth.users(id)`; their policies use the authenticated UID as the ownership boundary.
- `order_intents` has a customer-owned preview-only insert policy that requires `execution_enabled = false`.
- `investment_outcome_proposals` already has CEO/AAL2 policy conditions.
- The prior six-table proposal omitted `investment_outcome_proposals` and `order_intents`.
- API roles currently have `TRUNCATE` and `TRIGGER` privileges on the eight target tables. In particular, `authenticated` can currently TRUNCATE `investment_outcome_proposals` and `order_intents`; `service_role` can TRUNCATE all eight. Row triggers and RLS alone do not block TRUNCATE.
- `ceo_admins` has a primary key on `user_id`, but no partial unique index limiting enabled CEO rows to one. API/service-role write grants currently exist on the allowlist.

## Proposed controls

1. Add a validated CHECK constraint that requires `financial_operations_enabled IS FALSE`. This makes the current disabled state a database invariant. Enabling it later would require a separate reviewed change.
2. Add a partial unique index allowing at most one enabled CEO record. Zero enabled CEOs remains a fail-closed lockout state.
3. Remove INSERT/UPDATE/DELETE/TRUNCATE/TRIGGER privileges on `ceo_admins` from API roles. CEO allowlist maintenance becomes owner-controlled; no customer can self-administer.
4. Add a restrictive AAL2 policy to every public table whose existing policies grant CEO access. Existing customer ownership policies remain the permissive row filter; the new policy only requires AAL2 when the request resolves as the enabled CEO.
5. Add restrictive INSERT/UPDATE/DELETE gates to eight tables:
   - `deposit_requests`
   - `withdrawal_requests`
   - `investment_plans`
   - `investments`
   - `ledger_entries`
   - `investment_events`
   - `investment_outcome_proposals`
   - `order_intents`
6. Add a fail-closed row trigger to the same eight tables so ordinary service-role DML is also blocked while the flag is false.
7. Revoke TRUNCATE and TRIGGER privileges from PUBLIC, anon, authenticated, and service_role on the eight guarded tables. TRUNCATE bypasses both RLS and row-level triggers.
8. Keep demo-only tables separate from live customer/financial records. The proposal does not change demo data or demo-only routines.

## Files

- `ceo-database-authorization-gate-proposal.sql`: proposed DDL with preflight checks and no application-row DML.
- `ceo-database-authorization-gate-verification.sql`: catalog assertions and a temporary-table trigger probe; rolls back.
- This README: findings, scope, test requirements, and limitations.

## Required isolated test matrix before production consideration

Use synthetic customer A, synthetic customer B, one synthetic CEO with controlled AAL1/AAL2 sessions, and a service-role test client. Do not copy production customer data.

| Test | Expected result |
|---|---|
| Customer A reads own profile and permitted customer-owned rows | Allowed only where existing policies permit |
| Customer A reads customer B's rows by guessed UUID | Denied / zero rows |
| Customer reads active investment plans | Read-only access follows existing plan policy |
| Customer attempts to update ownership/customer_id to B | Denied |
| Customer attempts deposit/withdrawal request insert while flag false | Denied |
| Customer attempts order-intent insert while flag false | Denied |
| CEO at AAL1 accesses a CEO-protected table | Denied |
| CEO at AAL2 accesses a CEO-protected table | Allowed only where existing CEO policy permits |
| Non-CEO at AAL2 attempts CEO-only access | Denied |
| Service-role INSERT/UPDATE/DELETE on any of the eight gated tables while false | Trigger rejects |
| anon/authenticated/service_role attempts TRUNCATE on gated tables | Privilege denied |
| API role attempts to create a trigger on gated tables | Privilege denied |
| API role attempts to insert/update/delete CEO allowlist rows | Privilege denied |
| Second enabled CEO row is added | Unique index rejects |
| Financial flag is changed to true by any ordinary DML role | CHECK constraint rejects |
| Missing platform_control row is simulated in isolated DB | Helper returns false; writes remain blocked |

The SQL verification file does not prove these identity/ownership scenarios by itself. They require controlled JWT claims and synthetic auth users in an isolated environment.

## Important limitations

- Database owners/superusers can alter or remove constraints, policies, grants, and triggers. No in-database control can protect against a fully privileged database owner. Use change approvals, backups, and audit controls.
- Service-role keys remain highly privileged secrets and must never be placed in browser code or `NEXT_PUBLIC_*` variables.
- Edge Functions and SECURITY DEFINER RPCs need a separate review for authentication, AAL2, ownership, and side effects. This package does not modify them.
- AAL2 in RLS is based on the JWT `aal` claim. Test refresh/revocation behavior and ensure no user-editable `user_metadata` is used for authorization.
- The hard false constraint intentionally prevents any financial table writes, including customer-submitted deposit/withdrawal requests and preview order-intent inserts. Read paths remain governed by existing RLS policies.

## Release gates

1. Independent SQL review by a qualified database/security reviewer.
2. Apply only to an isolated dev database rebuilt from the repository's canonical migrations.
3. Run the verification SQL and the full synthetic identity test matrix.
4. Run Supabase security advisors and review every new warning.
5. Generate a proper versioned migration from the tested schema diff.
6. Obtain explicit approval from the project owner before considering any production migration. Do not enable financial operations.
