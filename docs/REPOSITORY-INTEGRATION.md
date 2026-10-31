# Repository integration map

## Purpose

This repository is the current application/deployment source for the CryptoInvest Next.js/OpenNext work. The separate [CryptoInvest repository](https://github.com/udofiaasianubong738-droid/CryptoInvest) is retained as a UI/reference project; it is not a production data source or a backend dependency.

## Source-of-truth boundaries

- **Application, authentication and deployment:** this repository's `nextjs/` application.
- **Authentication and authorization:** Supabase server/session checks and the CEO allowlist/MFA implementation in this repository. Client-side UI checks are never sufficient authorization.
- **Deployment target:** Cloudflare Workers using OpenNext. Do not switch to Vercel.
- **Reference UI:** the separate CryptoInvest repository. Its current source contains PulseOps infrastructure-monitoring concepts and mock server telemetry, not verified CryptoInvest customer, portfolio or ledger data.

## Safe integration rules

1. Keep both repositories and their Git histories intact.
2. Reuse only neutral presentation patterns after adapting them to this app's components, accessibility requirements and design tokens.
3. Do not import PulseOps mock telemetry, server reboot/instance actions, simulated operational metrics or unrelated infrastructure workflows into the investment app.
4. All dashboard values must come from verified backend responses or be explicitly labelled demo fixtures. Never present mock values as live account or investment data.
5. Keep all money movement, deposits, withdrawals, trading, payouts and other financial execution disabled. The production safety gate remains `financial_operations_enabled = false`.
6. Preserve the existing Supabase project and data. Do not apply migrations, alter DNS, change custom domains, or deploy production as part of UI integration.
7. Run typecheck, Next.js build and OpenNext preview checks before proposing a production release.

## Current integration status

This document establishes the repository relationship and source-of-truth boundary. It does not claim that the two applications share runtime code, data, authentication sessions or deployment. Any future shared component must be copied/adapted deliberately and tested in this repository before use.