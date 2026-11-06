# CryptoInvest customer portal — safe foundation

## Current scope

The `/portal` route is a public, non-authenticated preview only. It intentionally displays no customer records, balances, holdings, deposits, withdrawals, transactions, or invented sample data.

The CEO administration login remains separate. The customer portal must not reuse the CEO login or treat a signed-in customer as an administrator.

## Safety invariants

- Preserve all existing Supabase records and schema.
- Keep `financial_operations_enabled=false`.
- Do not enable deposits, withdrawals, transfers, trading, approvals, payouts, or other money movement.
- Do not make production DNS, Cloudflare, Supabase, or deployment-setting changes.
- Never expose a service-role key or privileged server credential to the browser.
- Do not trust client-side role checks. Customer identity and ownership must be enforced server-side and by database policies.
- Do not display account data until the customer authentication flow, role separation, row-level ownership policies, and read-only queries have been independently verified.

## Next implementation gates

1. Inspect the authoritative schema and confirm the customer identity/profile relationship without modifying data.
2. Design customer authentication independently from the CEO-only AAL2 route.
3. Verify that customer sessions can read only their own permitted profile and account records.
4. Add read-only server endpoints and test cross-customer isolation using synthetic accounts in an isolated environment.
5. Keep all financial mutations unavailable while the global financial safety flag is false.
6. Add customer UI data only after the server-side checks pass.

## Verification status

This foundation is a static UI and documentation change. It does not authenticate customers, query Supabase, or perform financial actions. A production build and browser test are still required before merging.
