# CryptoInvest CEO backend hardening review

This folder contains review artifacts only. Nothing here has been applied to the
authoritative Supabase project.

## Current verified baseline

- Supabase project: `yniphceoofuwzpelpksd` (active, PostgreSQL 17).
- `platform_control.financial_operations_enabled` currently reads `false`.
- The `private.is_ceo()` helper checks for an enabled CEO record but does not
  itself require AAL2.
- Several existing public-table policies call `private.is_ceo()` without an
  AAL2 condition.
- The financial request/plan/investment/ledger/event tables have no database
  trigger that reads the financial safety flag before writes.
- No database routine inspected in the current review was found to reference
  `financial_operations_enabled`.

## Files

- `ceo-backend-hardening-proposal.sql`: proposed restrictive AAL2 policies
  for tables with CEO policies, a fail-closed financial flag helper, restrictive
  RLS write gates, and database triggers that block financial-table writes
  while the flag is false.
- `ceo-backend-hardening-verification.sql`: catalog assertions and a
  temporary-table trigger probe. It rolls back its transaction.

## Important limits

1. These SQL files are not a timestamped Supabase migration and must not be
   applied to production.
2. First test against an isolated development database created from migrations.
   That environment should contain no production customer data.
3. Review generated policy coverage and test both CEO AAL1 denial and CEO AAL2
   access using controlled test identities.
4. Verify that customer-owned read policies continue to work, while all writes
   to the six guarded financial tables fail when the flag is false.
5. Test service-role table writes too; the database trigger is intended to
   block those ordinary writes even though service-role bypasses RLS.
6. Only after those checks pass should a proper migration be generated with the
   Supabase CLI and independently reviewed. Do not change the flag to true.

No production rows, policies, functions, Edge Functions, secrets, DNS records,
Cloudflare settings, or deployment settings were changed as part of this work.
