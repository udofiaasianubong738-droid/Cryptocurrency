# CryptoInvest Admin Operations Setup

This change adds admin-only operations panels and protected Supabase Edge Functions. It does not enable financial operations.

## Required setup before the admin UI can be used

### 1. Turnstile and Supabase Auth CAPTCHA

1. Create a Cloudflare Turnstile widget for the exact admin hostname(s) that will serve the login page.
2. In Supabase Dashboard → Authentication → CAPTCHA, select Cloudflare Turnstile and enter its **secret key**. Confirm the provider matches the code; do not disable CAPTCHA to bypass missing tokens.
3. Add the public widget site key as the GitHub Actions repository variable `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
4. Confirm the GitHub Actions variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured. The admin deployment workflow intentionally fails before deploy if the Turnstile site key is missing.
5. Re-run the Next.js build verification and test password login, CAPTCHA token submission, TOTP challenge/enrollment, AAL2, and CEO-only access using a test session.

The Turnstile site key is public; the Turnstile secret is not. Never commit secrets or paste them into chat.

### 2. Microsoft 365 / Microsoft Graph

Create or select an Entra ID app registration for server-side mailbox integration. Configure application permissions for `Mail.Send` and `Mail.Read`, grant tenant admin consent, and restrict the app to the intended CryptoInvest mailbox using the tenant's supported Exchange application-access controls.

In Supabase Dashboard → Edge Functions → Secrets, configure these values:

- `MICROSOFT_TENANT_ID`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MICROSOFT_SENDER_EMAIL` (the approved sender mailbox, e.g. the configured CryptoInvest support address)

Do not add these values to GitHub source, `.env.example`, or browser variables. The functions fail closed when credentials are absent. Test inbox sync and one explicitly confirmed email to a registered user with a confirmed address before broader use. Graph accepting a send request does not prove inbox delivery.

### 3. Supabase Auth hardening

In Supabase Dashboard → Authentication → Settings / Password Security, enable leaked-password protection after reviewing the project's password policy. The connected security advisor still reports this control as disabled. Do not disable CAPTCHA to work around the missing-token error.

### 4. New admin operations

- `admin-ai-monitor`: manual rule-based market freshness, quote coverage, failed email, pending outcome review, and user-bootstrap checks. Not a generative AI model and not scheduled.
- `admin-email-send`: sends one explicitly confirmed draft through Microsoft Graph; it only targets a registered user with a confirmed email.
- `admin-mail-sync`: fetches recent inbox message previews and deduplicates provider message IDs.
- `admin-notification-create`: creates in-app notifications only; it does not send email.
- `admin-review-action`: audited review actions for AI findings and support tickets.

All functions require a valid session, enabled CEO row, and AAL2. RLS remains enabled on admin tables. Financial operations stay disabled.

### 5. Production gate

Do not deploy the frontend until the Next.js type-check/build passes, the login/MFA flow passes end-to-end tests, Microsoft Graph secrets/permissions are configured and tested, and security-advisor warnings are reviewed. Do not turn on deposits, withdrawals, payouts, or balance mutations as part of this setup.
