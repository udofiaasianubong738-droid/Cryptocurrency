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
- Financial figures and record lists remain placeholders until each screen is connected to an authorized backend query.
- Supabase password authentication, TOTP enrollment/challenge and CEO/AAL2 route checks are implemented in the Next.js application; these still require full browser end-to-end verification.
- The public root route is a neutral access page and does not render the admin dashboard or account data.
- Existing unverified TOTP factors are preserved by the login flow; it does not automatically unenroll or delete authenticator factors.
- `financial_operations_enabled = false` remains a non-negotiable safety setting.

## Backend and release status

The authoritative Supabase project is maintained separately from this UI. The current repository contains client-side auth and middleware integration, but database policies, API handlers, edge functions and operational workflows must be reviewed independently. Do not infer backend security from the presence of a protected page.

Before release:

1. Verify the authoritative Supabase project and compare schema, policies and data.
2. Enforce CEO-only authorization and AAL2 in every privileged server/database operation, not only page middleware.
3. Verify customer-role isolation and every Row Level Security policy.
4. Audit ledger integrity, idempotency, reconciliation, provider confirmations and audit history.
5. Test keyboard navigation, screen-reader landmarks, contrast and responsive layouts.
6. Keep deposits, withdrawals, trading, approvals and payouts disabled until independent verification is complete.
7. Run typecheck, production build and browser end-to-end tests before deployment.

Never commit `.env.local`, service-role keys, database passwords or provider secrets. Do not use this UI as evidence that a financial operation succeeded. Do not change DNS or production configuration as part of local UI work.
