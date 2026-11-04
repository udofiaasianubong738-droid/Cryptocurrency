-- CEO-only complaint review and retention policy registry.
-- Retention rules are stored as drafts; no automatic deletion is enabled.
alter table public.support_tickets add column if not exists admin_notes text check (admin_notes is null or length(admin_notes) <= 5000);
alter table public.support_tickets add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.support_tickets add column if not exists reviewed_at timestamptz;
alter table public.support_tickets add column if not exists closed_at timestamptz;
grant select on public.support_tickets to authenticated;
grant update(status,admin_notes,reviewed_by,reviewed_at,closed_at) on public.support_tickets to authenticated;
drop policy if exists support_tickets_ceo_aal2_read on public.support_tickets;
create policy support_tickets_ceo_aal2_read on public.support_tickets for select to authenticated using (private.is_ceo() and (select auth.jwt()->>'aal')='aal2');
drop policy if exists support_tickets_ceo_aal2_update on public.support_tickets;
create policy support_tickets_ceo_aal2_update on public.support_tickets for update to authenticated using (private.is_ceo() and (select auth.jwt()->>'aal')='aal2') with check (private.is_ceo() and (select auth.jwt()->>'aal')='aal2');

create table if not exists public.admin_retention_policies (
 id uuid primary key default gen_random_uuid(), policy_key text not null unique check (policy_key ~ '^[a-z0-9][a-z0-9_-]{2,99}$'),
 data_category text not null check (length(trim(data_category)) between 2 and 120), jurisdiction text not null check (length(trim(jurisdiction)) between 2 and 120),
 retention_days integer not null check (retention_days between 1 and 36500), rationale text not null check (length(trim(rationale)) between 10 and 5000),
 status text not null default 'draft' check (status in ('draft','approved','suspended')), legal_hold boolean not null default false,
 created_by uuid references auth.users(id) on delete set null, reviewed_by uuid references auth.users(id) on delete set null,
 reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check ((status='draft' and reviewed_by is null and reviewed_at is null) or (status<>'draft' and reviewed_by is not null and reviewed_at is not null))
);
create index if not exists admin_retention_policies_status_idx on public.admin_retention_policies(status,data_category);
alter table public.admin_retention_policies enable row level security;
revoke all on public.admin_retention_policies from anon;
grant select,insert,update on public.admin_retention_policies to authenticated;
drop policy if exists admin_retention_policies_ceo_aal2_all on public.admin_retention_policies;
create policy admin_retention_policies_ceo_aal2_all on public.admin_retention_policies for all to authenticated using (private.is_ceo() and (select auth.jwt()->>'aal')='aal2') with check (private.is_ceo() and (select auth.jwt()->>'aal')='aal2');

create or replace function public.set_admin_retention_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end;
$$;
revoke all on function public.set_admin_retention_updated_at() from public,anon,authenticated;
drop trigger if exists admin_retention_policies_set_updated_at on public.admin_retention_policies;
create trigger admin_retention_policies_set_updated_at before update on public.admin_retention_policies for each row execute function public.set_admin_retention_updated_at();
