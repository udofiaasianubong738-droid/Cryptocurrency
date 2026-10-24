# Cryptocurrency
MASTER IMPLEMENTATION PROMPT — INVEST BROKER ADMIN PORTAL

Project objective
https://ddselkwekvdvwlpeddzq.supabase.co
ddselkwekvdvwlpeddzq
Work on the existing repository:
Build and verify the complete Invest Broker CEO Admin Portal, including its frontend, backend foundation, database integration, navigation, screens, buttons, forms, investment-management workflows, and automated tests.

The admin portal is the first and only implementation target for this phase. Do not start building or redesigning the customer portal until the admin portal passes its acceptance tests.

Do not merely create a design or describe what should be done. Inspect the existing project, implement the necessary changes, run tests, fix failures, and report verifiable results.

1. Inspect the existing foundation first

Before modifying files, inspect and document:

- Existing repository structure, main branch, frameworks, dependencies and build commands.
- Existing admin portal screens, components, layouts, routing and styles.
- Existing API endpoints, Cloudflare Workers and backend integrations.
- Supabase authentication, database schema, row-level security policies and migration history.
- Existing GitHub Actions and CI configuration.
- Existing errors, incomplete functions, broken links and failing tests.

Reuse working components and existing architecture where appropriate. Do not replace the entire project unnecessarily.

Do not guess missing configuration, invent backend functionality, expose secrets, or recreate missing historical database migrations without verified evidence.

Produce a concise audit and prioritized implementation plan before making significant changes.

2. Build the complete admin frontend foundation

Implement the complete CEO admin interface using the existing project's framework and design conventions.

Create a consistent design system for:

- Typography, spacing, colors and component states.
- Responsive layouts for desktop, tablet and mobile.
- Cards, tables, filters, search fields, dropdowns and dialogs.
- Form validation, loading states, empty states, errors and success feedback.
- Accessible labels, keyboard navigation, focus states and appropriate contrast.

Use reusable components instead of duplicating screen implementations.

Primary screen: Admin Home / Dashboard

The home dashboard must be the primary landing screen after successful CEO authentication.

It should contain:

- Portfolio overview with clearly labelled simulated financial data during development.
- Customer account summary.
- Deposit and withdrawal request summaries.
- Investment and transaction activity.
- Crypto asset allocation and market-price information where available.
- Realized and unrealized profit/loss, displayed separately.
- System health, integration status and pending administrative actions.
- Appropriate charts and recent activity tables.

Never fabricate real customer balances, completed transactions, execution records or profits. Clearly label test fixtures and simulated trading results.

Sidebar requirement

Display the main sidebar only on the Admin Home screen.

On secondary screens, hide the home sidebar and use a suitable page header with a back-to-home or navigation control where appropriate. Preserve clear, working navigation between all authorized screens.

The sidebar must not appear unexpectedly on secondary screens or mobile layouts.

3. Build all primary and secondary screens

Implement the following admin routes or their equivalent in the existing routing architecture:

1. Admin login and authentication status.
2. Home dashboard.
3. Customer management and customer account details.
4. Deposit requests and verification.
5. Withdrawal requests and approval review.
6. Investment plans and asset configuration.
7. Buy and sell order management in simulation mode.
8. Portfolio and asset holdings.
9. Profit/loss and performance reports.
10. Transaction history and ledger inspection.
11. Reconciliation and discrepancy reports.
12. Audit logs and administrative activity.
13. System integrations and service health.
14. Security settings and CEO account controls.
15. Admin-only AI interface, if already required by the project.
16. Error, unauthorized, not-found and unavailable-service screens.

For every screen, define its purpose, route, data requirements, user actions, validation rules, loading state, error state and successful outcome.

Do not create placeholder screens that look finished but have no functioning implementation. If a service is not available, provide an honest unavailable state and document the missing dependency.

4. Make every button, form and navigation functional

Audit every visible interactive element.

For each button, link, tab, menu, filter, form and table action:

- Define its intended action.
- Connect it to the correct route or workflow.
- Validate user input.
- Prevent accidental duplicate submissions.
- Show progress while an operation is running.
- Display useful success or error messages.
- Handle empty responses, network failures and expired sessions.
- Prevent actions when the user lacks permission.
- Add confirmation dialogs for sensitive or irreversible actions.
- Ensure browser back navigation and direct URL access behave correctly.

Remove dead buttons, misleading links, fake success notifications and nonfunctional controls.

Do not make a button appear successful merely because it was clicked. Its result must be confirmed by the relevant operation.

5. Connect the frontend to the backend

Inspect the existing backend before adding or changing endpoints.

Use the project's existing Cloudflare Pages and Cloudflare Worker architecture, with Supabase for supported authentication and data services.

Establish clear, validated API contracts for:

- CEO authentication and session validation.
- Dashboard summaries.
- Customer and account records.
- Deposit and withdrawal request records.
- Simulated buy and sell orders.
- Portfolio holdings and transaction history.
- Profit/loss calculations.
- Reconciliation reports.
- Audit logs.
- Administrative configuration and service health.

Use typed request and response models where supported by the existing stack.

Implement consistent error handling, request validation, pagination where appropriate, secure configuration, and server-side authorization.

Never expose Supabase service-role credentials, private keys, wallet seed phrases or provider secrets in frontend code.

Do not bypass row-level security or use client-side role checks as the sole authorization mechanism.

6. Enforce CEO-only access and financial safety

There must be one authorized CEO administrator, with no public administrator registration and no customer self-promotion.

Enforce privileged operations on the server, not just by hiding frontend controls.

Preserve strong authentication and MFA/AAL2 where supported by the current environment.

Ensure that:

- Unauthorized users cannot access protected routes or APIs.
- Customer accounts cannot obtain administrative privileges.
- Sensitive actions are logged with actor, timestamp, outcome and relevant transaction reference.
- Repeated requests cannot duplicate financial ledger entries.
- Balances cannot become negative through unauthorized or concurrent operations.
- Failed operations do not leave partially updated records.
- Secrets are handled through approved environment or secret-management facilities.

Keep AI functionality exclusive to the admin portal. Do not expose admin AI endpoints or credentials to customers.

7. Build the investment foundation in simulation mode

The investment engine is the primary business workflow, but real financial operations must remain disabled.

Implement testable simulated workflows for:

1. Creating a deposit request.
2. Recording its verification status.
3. Approving or rejecting the simulated deposit.
4. Creating a simulated cryptocurrency buy order.
5. Recording simulated execution price, quantity, fees and timestamp.
6. Updating the simulated ledger and portfolio.
7. Creating a simulated sell order.
8. Calculating realized and unrealized profit/loss.
9. Submitting a simulated withdrawal request.
10. Reviewing and approving or rejecting the request.
11. Recording simulated payout completion.
12. Reconciliation and audit review.

Clearly distinguish pending, verified, rejected, executed, failed and simulated statuses.

Do not treat an unverified payment as received funds. Do not record a real crypto purchase without execution evidence. Do not represent a market-price movement as a realized profit or guaranteed return.

Preserve "financial_operations_enabled = false" during this phase. Do not enable live trading, real deposits, real withdrawals or production payout execution.

8. Test the entire admin portal screen by screen

Create a written test checklist and automated tests using the tools already supported by the repository.

Frontend tests

- Every admin route renders correctly.
- The sidebar appears on the home screen only.
- Secondary screens provide working navigation back to the home screen.
- Every visible button has a valid action.
- Every form validates input and handles failures.
- Search, filters, tables, dialogs and pagination work where implemented.
- Responsive layouts work on mobile and desktop.
- Loading, empty, success and error states render correctly.
- Direct URL access and browser navigation behave correctly.

Backend and integration tests

- CEO authentication and authorization.
- MFA/session requirements where supported.
- Unauthorized API requests are rejected.
- Customers cannot access administrative records.
- Invalid and duplicate transactions are rejected.
- Simulated deposits, purchases, sales and withdrawals follow the intended state transitions.
- Ledger balances and portfolio calculations reconcile.
- Failed operations do not corrupt balances.
- Audit events are recorded correctly.
- Supabase connection and query failures are handled safely.
- Frontend API responses match the documented contracts.

Build and security tests

- Install dependencies using the repository's existing lockfile.
- Run linting, type checks, unit tests and integration tests.
- Run production builds for the relevant admin application and Worker.
- Run configured security and dependency checks.
- Fix errors introduced by the implementation.
- Run the complete applicable test suite again after fixes.

Do not claim tests passed unless their actual results confirm it.

9. Follow a strict implementation sequence

Work in this order:

Stage A: Read-only repository and backend audit.

Stage B: Routing, layout, responsive design system and admin home screen.

Stage C: All secondary screens, navigation and reusable UI components.

Stage D: Audit and repair every button, link, form and interaction.

Stage E: Backend API contracts, Supabase connectivity, authorization and database integration.

Stage F: Simulated investment engine and ledger.

Stage G: Automated tests, security checks, production builds and end-to-end verification.

Stage H: Fix all identified issues, rerun the full applicable suite, and produce a verification report.

Do not begin the customer portal until Stage H meets the acceptance criteria below.

10. Deployment and workflow constraints

- Keep Cloudflare Pages and Cloudflare Workers as the intended hosting architecture.
- Keep Supabase as the existing backend service where appropriate.
- Remove Vercel from the project workflow as previously requested; inspect existing configuration before changing it.
- Do not change production DNS, production financial settings or live payout configuration without explicit authorization.
- Do not claim a deployment or external integration is connected unless it has been verified.
- Do not publish an incomplete or insecure admin interface to production.

If a GitHub, Cloudflare or Supabase action is blocked by missing permissions, report the exact blocker and the required authorization instead of pretending the operation succeeded.

11. Definition of done

The admin foundation is accepted only when:

- All defined screens exist and render correctly.
- The sidebar is restricted to the home screen.
- All intended navigation and interactive controls work.
- Frontend and backend integrations have been verified.
- CEO-only authorization is enforced server-side.
- Simulated investment workflows produce correct, traceable records.
- Ledger and portfolio calculations pass their tests.
- Errors, duplicate requests and failed integrations are handled safely.
- Required builds, tests and security checks have documented results.
- Financial operations remain disabled.
- No unresolved critical or high-severity implementation defects remain.

If any acceptance criterion fails, fix it and retest before proceeding.

12. Final report

At completion, provide:

1. What was already present in the repository.
2. What files and components were created or changed.
3. Every screen and route implemented.
4. Navigation and button verification results.
5. Backend endpoints and Supabase connections verified.
6. Database and migration issues discovered.
7. Build, test and security-check results.
8. Remaining defects, permissions or configuration blockers.
9. Deployment status, with verified URLs only.
10. A clear pass/fail checklist for the admin acceptance criteria.

Start now with Stage A: inspect the existing repository and backend. Then implement and verify the admin portal incrementally. Do not move on to the customer portal until the admin portal has passed its tests.
