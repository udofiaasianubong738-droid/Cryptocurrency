-- CryptoInvest admin workspace control plane.
-- Additive only. Does not enable money movement or write balances.
create table if not exists public.admin_ai_findings (
 id uuid primary key default gen_random_uuid(),
 finding_type text not null check (finding_type in ('security','auth','data_quality','market_data','compliance','service_health','workflow')),
 severity text not null check (severity in ('info','low','medium','high','critical')),
 status text not null default 'open' check (status in ('open','triaged','resolved','dismissed')),
 title text not null check (length(trim(title)) between 3 and 200),
 summary text not null check (length(trim(summary)) between 3 and 5000),
 recommendation text check (recommendation is null or length(recommendation) <= 5000),
 source_table text, source_record_id uuid, evidence jsonb not null default '{}'::jsonb,
 detected_at timestamptz not null default now(),
 reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz,
 resolution_note text check (resolution_note is null or length(resolution_note) <= 2000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists admin_ai_findings_status_detected_idx on public.admin_ai_findings(status,severity,detected_at desc);
create index if not exists admin_ai_findings_type_detected_idx on public.admin_ai_findings(finding_type,detected_at desc);
alter table public.admin_ai_findings enable row level security;
revoke all on public.admin_ai_findings from anon;
grant select,insert,update on public.admin_ai_findings to authenticated;
create policy admin_ai_findings_ceo_aal2_select on public.admin_ai_findings for select to authenticated using (private.is_ceo() and (select auth.jwt()->>'aal')='aal2');
create policy admin_ai_findings_ceo_aal2_insert on public.admin_ai_findings for insert to authenticated with check (private.is_ceo() and (select auth.jwt()->>'aal')='aal2');
create policy admin_ai_findings_ceo_aal2_update on public.admin_ai_findings for update to authenticated using (private.is_ceo() and (select auth.jwt()->>'aal')='aal2') with check (private.is_ceo() and (select auth.jwt()->>'aal')='aal2');

create table if not exists public.admin_email_templates (
 id uuid primary key default gen_random_uuid(),
 template_key text not null unique check (template_key ~ '^[a-z0-9][a-z0-9_-]{2,79}$'),
 name text not null check (length(trim(name)) between 3 and 160),
 subject_template text not null check (length(trim(subject_template)) between 1 and 250),
 body_text_template text not null check (length(trim(body_text_template)) between 1 and 20000),
 category text not null default 'service' check (category in ('security','account','investment','support','service','marketing')),
 enabled boolean not null default true,
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.admin_email_templates enable row level security;
revoke all on public.admin_email_templates from anon;
grant select,insert,update,delete on public.admin_email_templates to authenticated;
create policy admin_email_templates_ceo_aal2_all on public.admin_email_templates for all to authenticated using (private.is_ceo() and (select auth.jwt()->>'aal')='aal2') with check (private.is_ceo() and (select auth.jwt()->>'aal')='aal2');

create table if not exists public.admin_email_outbox (
 id uuid primary key default gen_random_uuid(), recipient_user_id uuid references auth.users(id) on delete set null,
 recipient_email text not null check (length(trim(recipient_email)) between 3 and 320 and recipient_email ~ '^[^[:space:]@]+@[^[:space:]@]+\\.[^[:space:]@]+$'),
 category text not null check (category in ('security','account','investment','support','service','marketing')),
 subject text not null check (length(trim(subject)) between 1 and 250),
 body_text text not null check (length(trim(body_text)) between 1 and 20000),
 status text not null default 'draft' check (status in ('draft','queued','sending','sent','failed','cancelled')),
 template_id uuid references public.admin_email_templates(id) on delete set null, provider_message_id text, provider_error text,
 created_by uuid references auth.users(id) on delete set null, approved_by uuid references auth.users(id) on delete set null,
 queued_at timestamptz, sent_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check ((status <> 'sent') or sent_at is not null)
);
create index if not exists admin_email_outbox_status_created_idx on public.admin_email_outbox(status,created_at desc);
create index if not exists admin_email_outbox_recipient_idx on public.admin_email_outbox(recipient_user_id,created_at desc);
alter table public.admin_email_outbox enable row level security;
revoke all on public.admin_email_outbox from anon;
grant select,insert,update on public.admin_email_outbox to authenticated;
create policy admin_email_outbox_ceo_select on public.admin_email_outbox for select to authenticated using (private.is_ceo() and (select auth.jwt()->>'aal')='aal2');
create policy admin_email_outbox_ceo_insert_draft on public.admin_email_outbox for insert to authenticated with check (private.is_ceo() and (select auth.jwt()->>'aal')='aal2' and status='draft' and created_by=auth.uid());
create policy admin_email_outbox_ceo_update_draft on public.admin_email_outbox for update to authenticated using (private.is_ceo() and (select auth.jwt()->>'aal')='aal2' and status='draft') with check (private.is_ceo() and (select auth.jwt()->>'aal')='aal2' and status='draft');

create table if not exists public.investment_outcome_proposals (
 id uuid primary key default gen_random_uuid(), investment_id uuid not null references public.investments(id) on delete restrict,
 customer_id uuid not null references auth.users(id) on delete restrict,
 proposed_profit_loss numeric(30,10) not null check (proposed_profit_loss<>0),
 currency_code text not null check (currency_code ~ '^[A-Z0-9]{2,12}$'),
 rationale text not null check (length(trim(rationale)) between 3 and 3000),
 customer_message text not null check (length(trim(customer_message)) between 3 and 3000),
 evidence jsonb not null default '{}'::jsonb,
 status text not null default 'pending_review' check (status in ('pending_review','approved_for_display','rejected')),
 created_by uuid not null references auth.users(id) on delete restrict, reviewed_by uuid references auth.users(id) on delete restrict,
 reviewed_at timestamptz, review_note text check (review_note is null or length(review_note)<=2000),
 idempotency_key text not null unique check (length(idempotency_key) between 8 and 200),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check ((status='pending_review' and reviewed_by is null and reviewed_at is null) or (status<>'pending_review' and reviewed_by is not null and reviewed_at is not null))
);
create index if not exists investment_outcome_proposals_investment_idx on public.investment_outcome_proposals(investment_id,created_at desc);
create index if not exists investment_outcome_proposals_status_idx on public.investment_outcome_proposals(status,created_at desc);
alter table public.investment_outcome_proposals enable row level security;
revoke all on public.investment_outcome_proposals from anon;
grant select,insert on public.investment_outcome_proposals to authenticated;
create policy investment_outcome_proposals_ceo_select on public.investment_outcome_proposals for select to authenticated using (private.is_ceo() and (select auth.jwt()->>'aal')='aal2');
create policy investment_outcome_proposals_ceo_insert_pending on public.investment_outcome_proposals for insert to authenticated with check (private.is_ceo() and (select auth.jwt()->>'aal')='aal2' and status='pending_review' and created_by=auth.uid() and reviewed_by is null and reviewed_at is null);

create table if not exists public.admin_compliance_documents (
 id uuid primary key default gen_random_uuid(), document_key text not null, version integer not null check (version>0),
 jurisdiction text not null check (length(trim(jurisdiction)) between 2 and 120),
 document_type text not null check (document_type in ('terms','privacy','risk_disclosure','aml_policy','complaints_policy','retention_policy','other')),
 title text not null check (length(trim(title)) between 3 and 200), content_markdown text not null check (length(trim(content_markdown)) between 10 and 50000),
 status text not null default 'draft' check (status in ('draft','review','published','retired')), effective_at timestamptz,
 reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz,
 created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(),
 unique(document_key,version)
);
alter table public.admin_compliance_documents enable row level security;
revoke all on public.admin_compliance_documents from anon;
grant select,insert,update on public.admin_compliance_documents to authenticated;
create policy admin_compliance_documents_ceo_aal2_all on public.admin_compliance_documents for all to authenticated using (private.is_ceo() and (select auth.jwt()->>'aal')='aal2') with check (private.is_ceo() and (select auth.jwt()->>'aal')='aal2');

create table if not exists public.admin_inbound_messages (
 id uuid primary key default gen_random_uuid(), provider text not null check (provider in ('microsoft_graph','manual_import','other')),
 provider_message_id text, sender_email text not null check (length(trim(sender_email)) between 3 and 320),
 recipient_email text not null check (length(trim(recipient_email)) between 3 and 320),
 subject text not null check (length(subject)<=500), body_text text not null default '' check (length(body_text)<=30000),
 received_at timestamptz not null, status text not null default 'untriaged' check (status in ('untriaged','triaged','replied','archived','spam')),
 linked_user_id uuid references auth.users(id) on delete set null, linked_ticket_id uuid references public.support_tickets(id) on delete set null,
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), unique(provider,provider_message_id)
);
create index if not exists admin_inbound_messages_received_idx on public.admin_inbound_messages(received_at desc);
create index if not exists admin_inbound_messages_status_idx on public.admin_inbound_messages(status,received_at desc);
alter table public.admin_inbound_messages enable row level security;
revoke all on public.admin_inbound_messages from anon,authenticated;
grant select on public.admin_inbound_messages to authenticated;
create policy admin_inbound_messages_ceo_aal2_read on public.admin_inbound_messages for select to authenticated using (private.is_ceo() and (select auth.jwt()->>'aal')='aal2');

create or replace function public.set_admin_workspace_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;
revoke all on function public.set_admin_workspace_updated_at() from public,anon,authenticated;
create trigger admin_ai_findings_set_updated_at before update on public.admin_ai_findings for each row execute function public.set_admin_workspace_updated_at();
create trigger admin_email_templates_set_updated_at before update on public.admin_email_templates for each row execute function public.set_admin_workspace_updated_at();
create trigger admin_email_outbox_set_updated_at before update on public.admin_email_outbox for each row execute function public.set_admin_workspace_updated_at();
create trigger investment_outcome_proposals_set_updated_at before update on public.investment_outcome_proposals for each row execute function public.set_admin_workspace_updated_at();
