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
- The overview displays public Binance Spot prices for BTC/USDT, ETH/USDT and BNB/USDT, including rolling 24-hour percentage changes.
- Market data is fetched server-side from Binance's public Spot API without API keys or personal-account access. Feed state is explicitly shown as fresh, stale or unavailable; failed initial fetches show no prices, and failed refreshes are labelled stale.
- Market prices are informational only; they are not user balances, confirmed trades, realized returns or investment guarantees.
- All customer, ledger, balance and financial record lists remain empty placeholders until the authoritative backend is verified.
- No authentication or live financial actions are implemented in this front-end.
- No Supabase project is configured until the authoritative backend is confirmed.
- `FINANCIAL_OPERATIONS_ENABLED=false` remains a non-negotiable safety setting.

## Checks

Run `npm test`, `npm run typecheck` and `npm run build` from this directory. The market-feed unit tests use Node's built-in test runner and do not need credentials or network access.

## Before backend integration or release

1. Confirm the authoritative Supabase project and compare its schema.
2. Implement server-side authentication, CEO-only authorization, MFA and customer-role isolation.
3. Audit ledger integrity, idempotency, reconciliation, provider confirmations and audit history.
4. Test keyboard navigation, screen-reader landmarks, contrast and responsive layouts.
5. Keep deposits, withdrawals, trading, approvals and payouts disabled until independent verification is complete.

Never commit `.env.local`, service-role keys, database passwords or provider secrets. Do not use this UI as evidence that a financial operation succeeded.
