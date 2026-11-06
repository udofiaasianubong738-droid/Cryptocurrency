# Separate admin and customer application boundaries

## Status

Architecture and implementation specification only. This file does not change the live Supabase project, application code, DNS, Cloudflare, or deployment configuration. The existing financial safety gate remains disabled.

## Required application split

The CEO admin and customer portal are two separate web applications with separate build/deploy targets, route trees, authentication entry points, session handling, and UI bundles.

- Admin application: CEO-only entry point, independent server-side authorization on every protected route and API request, mandatory MFA/AAL2 for privileged access.
- Customer application: customer-only entry point, no admin navigation, no admin API client, no admin credentials, and no ability to select or change a role.
- Shared identity provider: Supabase Auth may authenticate both applications, but the server must resolve the role from trusted database state. A user being signed in does not make them an administrator.
- Shared data: the two applications may refer to the same underlying investment record by opaque UUID, but they must not share unrestricted table access or credentials.

Separate apps do not require duplicate copies of the same investment data. Duplicating customer and investment tables would create synchronization and reconciliation errors. Instead, use a private write model and a narrowly scoped customer read model.

## Database separation model

### 1. Private administrative write model

Create a non-exposed schema such as `admin_private` for administrative workflows and review records. Do not add this schema to Supabase's exposed API schemas.

Proposed entities (subject to schema review against existing tables):

- `customer_investment_records`: internal linkage and administrative status for an investment/customer pair.
- `investment_record_drafts`: draft updates entered by the CEO, including proposed principal metadata, period, currency, and supporting explanation.
- `investment_outcome_reviews`: proposed profit/loss outcome, evidence references, review status, author, reviewer, and timestamps.
- `payment_evidence_metadata`: metadata and private Storage object keys for uploaded payment evidence; never store card data, wallet secrets, or payment credentials.
- `admin_audit_events`: append-only actor/action/target/time/outcome history for sensitive record changes.

Do not duplicate canonical customer identity or create a second role table. Link records to the existing `auth.users.id` and the existing investment identifiers using foreign keys after verifying the canonical schema.

### 2. Customer-facing read model

Expose only a restricted view or dedicated read-only API projection, for example `customer_api.my_investment_records`. It must return only records where `customer_id = auth.uid()` and only fields intended for that customer.

Customer-visible fields may include:
- investment reference and plan label;
- customer-owned principal and currency;
- status and relevant dates;
- approved, published profit/loss entries with period and explanatory note;
- payment evidence status (for example, received / under review / verified), not internal evidence URLs;
- customer-safe notices and history.

Never expose internal review notes, staff identities beyond approved display fields, fraud/security flags, other customers' records, private evidence object paths, admin audit metadata, or unapproved outcomes.

The customer app must have SELECT-only access to the projection. It must not insert, update, or delete canonical investment, ledger, payment, or outcome records directly.

### 3. Controlled administrative write path

The admin app must submit proposed record changes to server-side endpoints or tightly scoped database functions. Every request must independently verify:
1. authenticated session;
2. the caller is the enabled CEO from the trusted allowlist;
3. JWT AAL is aal2;
4. the target customer and investment relationship exists;
5. the requested change is valid and within the record's permitted state transition;
6. the financial safety gate remains false.

During the disabled phase, administrative endpoints may save non-executable drafts or review metadata only if the security review explicitly allows those draft tables. They must not post ledger credits/debits, mark real funds as received, execute trades, or trigger payouts. No ordinary API role may write the CEO allowlist.

## Payment evidence and outcome recording

Payment evidence upload is a document-recording workflow, not payment processing. Store files in a private Supabase Storage bucket with object-level authorization. Keep only object key, file hash, MIME type, byte size, uploader, timestamp, and review status in metadata. Downloads must use a server-authorized short-lived link after checking CEO permission; customer access to any receipt must be separately scoped to the record owner and approved evidence.

Profit/loss entries must be treated as reported outcomes, not promised returns or proof of cash payment. Record each as a dated, currency-specific, traceable event with:
- investment ID and customer ID;
- amount and currency;
- period / effective date;
- classification (profit, loss, correction);
- source/evidence reference;
- explanatory note;
- created_by and created_at;
- review state and reviewer metadata;
- immutable revision/audit linkage.

Customer views must show only approved/published outcomes. Corrections should create a new revision or reversal record with an audit trail; do not silently overwrite historical values. Do not label an outcome as paid or realized unless independently supported by the relevant evidence and business rules.

## Application and credential boundaries

- Use distinct hostnames and deployment targets for admin and customer applications.
- Use separate environment-variable sets and server-side API clients. Never ship a Supabase service-role key to either browser bundle.
- Do not rely on frontend route hiding, separate hostnames, or CORS as authorization controls.
- Configure redirect URLs and cookie/session behavior explicitly for both apps; prevent an admin session from silently granting customer or admin privileges in the other app.
- The admin server checks CEO + AAL2 on every privileged operation.
- The customer server checks authenticated customer identity and ownership on every customer data request.
- Keep admin-only tables, functions, buckets, and schemas out of the customer API surface.
- Use explicit grants and RLS policies. Default deny; no broad grants to anon or authenticated.
- Do not create a generic endpoint that accepts arbitrary table names, SQL, customer IDs, or role values from the browser.

## Existing schema observations that must be reconciled

The current database already has shared public tables including `investment_plans`, `investments`, `deposit_requests`, `withdrawal_requests`, `ledger_entries`, `investment_events`, and `investment_outcome_proposals`. Some customer-owned rows reference `auth.users(id)`. This is a starting point, not proof that the admin/customer split is correctly enforced.

The current front-end README describes one Next.js app containing a CEO workspace and a customer-portal design preview, with no live authentication or data connection. The root repository README also says the admin portal is the first implementation target and customer portal should follow after admin acceptance. This does not yet satisfy the requested two independently deployed applications.

Before writing migrations, inspect the actual current routes, Worker bindings, Supabase exposed-schema configuration, grants, policies, Storage buckets, and all functions/RPCs. Preserve existing data and avoid renaming or moving live tables in place.

## Acceptance tests

Use an isolated development database and synthetic users only:

1. Customer A cannot read Customer B's investments, ledger rows, events, payment metadata, or outcome records, even with guessed UUIDs.
2. Customer A cannot call any admin endpoint or function.
3. Customer A cannot assign themselves an admin role or alter the CEO allowlist.
4. A non-CEO cannot access admin routes or APIs.
5. CEO at AAL1 is denied privileged operations; CEO at AAL2 is allowed only for explicitly permitted draft/review operations.
6. Customer-facing API exposes only approved fields and approved outcomes.
7. Customer cannot write investment, ledger, deposit verification, withdrawal, or outcome records directly.
8. Admin-only schemas, tables, functions, and Storage objects are not accessible to customer API roles.
9. Payment evidence uploads are private, size/type constrained, malware-scanned where available, and auditable.
10. Profit/loss corrections preserve prior revisions and identify the author and reviewer.
11. All reads and writes are scoped to a validated customer/investment relationship.
12. No endpoint, trigger, job, or function can enable financial operations or execute a real financial action.
13. `financial_operations_enabled` remains false throughout.
14. Cross-app session and redirect tests prove that the customer app cannot inherit admin authorization.

## Work sequence

1. Audit current app structure and Supabase schema read-only.
2. Implement two independent app entry points and deployment configurations on a review branch.
3. Design private admin schema and customer-safe projection without altering existing production tables.
4. Write migration and RLS/GRANT proposal with rollback notes.
5. Test all identity, ownership, AAL2, Storage, audit, and fail-closed cases in isolated development.
6. Independently review the SQL and API contracts.
7. Obtain explicit project-owner approval before any production application.

No production migration, merge, deployment, live financial operation, or DNS/Cloudflare change is authorized by this specification.
