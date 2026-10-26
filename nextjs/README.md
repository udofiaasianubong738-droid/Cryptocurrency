# CryptoInvest Next.js foundation

This is an isolated Next.js application under `nextjs/`. The existing Vite application at the repository root is intentionally left untouched.

## Local development

```bash
cd nextjs
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Current scope

- Responsive CryptoInvest dashboard starter UI.
- No authentication or financial actions are implemented.
- All metrics are placeholders, not real account records.
- No Supabase project is configured until the authoritative backend is confirmed.
- `FINANCIAL_OPERATIONS_ENABLED=false` is the required safety setting.
- No deployment or DNS configuration is included in this folder.

## Before connecting a backend

1. Confirm the authoritative Supabase project and compare it with existing schema/data.
2. Implement server-side session verification and role checks; never trust a client-side role.
3. Verify CEO-only administration, MFA for sensitive actions, and row-level security.
4. Audit the ledger, idempotency, reconciliation, and payment-provider integration.
5. Add tests for unauthorized access and cross-account isolation.
6. Keep deposits, withdrawals, trading, investment approvals and payouts disabled until independently verified.

Never commit `.env.local`, service-role keys, database passwords, or provider secrets. Do not use this UI as evidence that a financial operation succeeded.
