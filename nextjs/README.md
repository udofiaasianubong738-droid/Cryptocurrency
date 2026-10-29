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


## Supabase CEO authentication and read-only data

- Set `NEXT_PUBLIC_SUPABASE_URL` to the verified Supabase project URL and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to that project's publishable/anon key in the local environment and Cloudflare build environment. These are public-client values; never put a service-role key in a `NEXT_PUBLIC_*` variable.
- CEO sign-in uses Supabase password authentication, verifies the caller has an enabled row in `public.ceo_admins`, then requires a verified TOTP authenticator and an `aal2` session.
- The dashboard overview reads counts and latest market quotes from Supabase through an authenticated read-only endpoint that refreshes every 60 seconds. No fake market values are substituted when the endpoint fails.
- Other detail screens remain read-only placeholders until their individual queries and permissions have been tested. Deposits, withdrawals, trading, approvals and payouts remain disabled. Keep `financial_operations_enabled = false`.
- Cloudflare's custom domain is not considered live until the zone is active, the correct Worker serves the app, and the canonical URL passes end-to-end login checks.
