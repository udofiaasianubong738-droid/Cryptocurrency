# CryptoInvest unified front-end

The Next.js application in `nextjs/` is the primary UI. It brings the dashboard concepts from the existing root-level Vite prototype into one navigable experience, while preserving the original Vite source for safe comparison.

## Run locally

```bash
cd nextjs
npm install
npm run dev
```

Open http://localhost:3000.

## CEO authentication and MFA

- The login form uses Supabase password authentication; it does not create users or allow self-promotion.
- The signed-in user must have an enabled row in `public.ceo_admins`. This check is performed by the login flow and again by server-side route guards.
- Supabase sessions are stored in cookies using `@supabase/ssr`; `middleware.ts` refreshes the session and protects the CEO MFA and dashboard routes.
- The MFA page supports TOTP enrollment, QR/manual setup key display, challenge, and verification.
- Dashboard sections require a server-verified CEO identity and `aal2`. An `aal1` session is redirected to the MFA page.
- Unfinished TOTP factors are listed and can be continued if the user still has the original authenticator entry. They are never automatically deleted.
- Successful Supabase MFA verification promotes the current session to `aal2`; Supabase may sign out other sessions as part of factor verification.
- No service-role key is used in browser code. The client uses only the public publishable key (or legacy anon key).

## Environment configuration

Set these values in local `.env.local` and in the Cloudflare Worker environment. Never commit secrets.

- `NEXT_PUBLIC_SUPABASE_URL`: URL of the confirmed Supabase project.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: preferred public key; the legacy anon key is accepted as fallback.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: optional public Cloudflare Turnstile site key if Supabase Auth CAPTCHA is enabled.

If Supabase Auth CAPTCHA is enabled, configure the matching Turnstile secret privately in Supabase Auth CAPTCHA settings. The secret must never be stored in a `NEXT_PUBLIC_*` variable or committed to Git. The site key and secret must belong to the same Turnstile configuration.

## UI scope and safety

- Responsive CEO workspace with overview, customers, deposits, withdrawals, plans, portfolio, orders, reports, ledger, reconciliation, audit, integrations and security screens.
- Sidebar appears on the overview/home screen only. Secondary screens use a screen menu and a return-to-overview link.
- Customer-portal design preview is not an authenticated customer account.
- Financial figures and record lists remain empty placeholders until the authoritative backend is verified.
- `FINANCIAL_OPERATIONS_ENABLED=false` remains a non-negotiable safety setting.
- No deposits, withdrawals, trading, approvals or payouts are enabled by this UI.

## Verification before release

1. Install dependencies and run `npm run typecheck` and `npm run build`.
2. Configure the public Supabase URL/key and, if enabled, the matching Turnstile site/secret pair.
3. Sign in with the existing CEO account and verify that non-CEO accounts are rejected.
4. Complete a user-driven TOTP enrollment, challenge and verification; confirm Supabase reports `currentLevel = aal2`.
5. Confirm `aal1`, expired sessions, unauthenticated users and non-CEO accounts cannot access any dashboard section.
6. Test session refresh, logout, CAPTCHA rejection and mobile layout.
7. Independently review ledger integrity, idempotency, reconciliation, provider confirmations and audit history before considering any financial feature.

The actual TOTP enrollment test requires the authorized account holder to scan the QR code and enter a current authenticator code in the app. Do not automate or share that code in CI or chat.

Never commit `.env.local`, service-role keys, database passwords or provider secrets. Do not use this UI as evidence that a financial operation succeeded.
