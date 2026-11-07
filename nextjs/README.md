# CryptoInvest unified front-end

The Next.js application in `nextjs/` is the proposed primary UI. It brings the best dashboard concepts from the existing root-level Vite prototype into one navigable experience, while preserving the original Vite source for safe comparison until the new app is reviewed.

## Run locally

```bash
cd nextjs
npm install
npm run dev
```

Open http://localhost:3000.

## UI scope

- Responsive CEO workspace with overview, customers, deposits, withdrawals, plans, portfolio, orders, reports, ledger, reconciliation, audit, integrations and security screens.
- Customer-portal design preview, clearly marked as a preview rather than an authenticated customer account.
- Sidebar appears on the overview/home screen only. Secondary screens use a screen menu and a return-to-overview link.
- Keyboard focus indicators, skip-to-content link, labelled search, semantic navigation and reduced-motion support.
- Automatically follows the device's light/dark system preference, with a balanced neutral-blue palette.
- All financial figures and record lists remain empty placeholders until the authoritative backend is verified.
- No authentication, live financial actions or provider connections are implemented in this front-end.
- No Supabase project is configured until the authoritative backend is confirmed.
- `financial_operations_enabled = false` remains a non-negotiable safety setting.

## Before backend integration or release

1. Confirm the authoritative Supabase project and compare schema/data.
2. Implement server-side authentication, CEO-only authorization, MFA and customer-role isolation.
3. Audit ledger integrity, idempotency, reconciliation, provider confirmations and audit history.
4. Test keyboard navigation, screen-reader landmarks, contrast and responsive layouts.
5. Keep deposits, withdrawals, trading, approvals and payouts disabled until independent verification is complete.

Never commit `.env.local`, service-role keys, database passwords or provider secrets. Do not use this UI as evidence that a financial operation succeeded.


## Customer portal foundation

A separate customer-facing workspace is available under `/customer`:

- `/customer/login` supports customer password sign-in and registration through Supabase Auth.
- `/customer` is the personal customer overview.
- `/customer/profile`, `/customer/plans`, `/customer/investments`, `/customer/deposit`, `/customer/withdrawals`, `/customer/performance`, `/customer/transactions`, `/customer/notifications`, `/customer/documents`, `/customer/support` and `/customer/security` are separate customer screens.
- Customer pages use the public Supabase client only. Data reads rely on database RLS and never use the service-role key.
- The customer route group is authenticated separately from the CEO routes. CEO routes continue to require the enabled CEO registry record and AAL2; customer routes do not inherit CEO privileges.
- Registration metadata is descriptive only and must never be treated as authorization. Database policies remain authoritative.
- Deposit and withdrawal submission, document retrieval, support-ticket creation and password/MFA management are intentionally not activated until their exact backend contracts and policies are verified. No live financial operation is enabled.
- The customer portal does not expose the admin dashboard, admin AI or administrative approval workflows.

Before production use, verify that RLS policies restrict every customer-readable table to `auth.uid()`, test cross-customer denial with two separate test accounts, and complete the customer browser E2E suite. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the appropriate environment; never put a service-role key in the browser.
