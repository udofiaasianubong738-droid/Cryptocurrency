-- CryptoInvest database authorization and financial safety gate
-- REVIEW ONLY. NOT A MIGRATION. DO NOT APPLY TO THE LIVE PROJECT.
-- Target project was inspected read-only; this file must first be reviewed and
-- tested on an isolated schema/database with synthetic identities.
--
-- Invariants:
--   * financial_operations_enabled remains FALSE and is constrained to FALSE.
--   * at most one enabled CEO row exists.
--   * CEO policy paths require AAL2.
--   * authenticated customer ownership policies remain in place.
--   * all live financial/order-intent writes are blocked while disabled.
--   * service_role cannot bypass the row triggers with TRUNCATE or trigger DDL.
--
-- This DDL does not insert, update, or delete application rows.

BEGIN;

DO $preflight$
DECLARE
  v_flag boolean;
  v_enabled_ceos integer;
  v_table text;
  v_targets text[] := ARRAY[
    'deposit_requests',
    'withdrawal_requests',
    'investment_plans',
    'investments',
    'ledger_entries',
    'investment_events',
    'investment_outcome_proposals',
    'order_intents'
  ];
BEGIN
  IF to_regclass('public.platform_control') IS NULL
     OR to_regclass('public.ceo_admins') IS NULL THEN
    RAISE EXCEPTION 'Required CryptoInvest control tables are missing';
  END IF;

  SELECT financial_operations_enabled
    INTO v_flag
  FROM public.platform_control
  WHERE id = 1;

  IF v_flag IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Preflight refused: financial_operations_enabled must already be false';
  END IF;

  SELECT count(*) INTO v_enabled_ceos
  FROM public.ceo_admins
  WHERE enabled IS TRUE;

  IF v_enabled_ceos > 1 THEN
    RAISE EXCEPTION 'Preflight refused: found % enabled CEO records; resolve manually first', v_enabled_ceos;
  END IF;

  FOREACH v_table IN ARRAY v_targets LOOP
    IF to_regclass(format('public.%I', v_table)) IS NULL THEN
      RAISE EXCEPTION 'Required table public.% is missing', v_table;
    END IF;

    IF NOT (
      SELECT c.relrowsecurity
      FROM pg_class c
      WHERE c.oid = to_regclass(format('public.%I', v_table))
    ) THEN
      RAISE EXCEPTION 'RLS is not enabled on public.%', v_table;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.platform_control'::regclass
      AND conname = 'ci_financial_operations_must_remain_disabled'
  ) THEN
    RAISE EXCEPTION 'Named financial safety constraint already exists; inspect before proceeding';
  END IF;

  IF to_regprocedure('private.financial_operations_are_enabled()') IS NOT NULL
     OR to_regprocedure('private.block_financial_writes_when_disabled()') IS NOT NULL THEN
    RAISE EXCEPTION 'A proposed safety helper already exists; inspect it rather than replacing it';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname IN (
      'ci_ceo_aal2_restrictive_guard',
      'ci_financial_gate_insert',
      'ci_financial_gate_update',
      'ci_financial_gate_delete'
    )
  ) THEN
    RAISE EXCEPTION 'A proposed policy name already exists; inspect it rather than replacing it';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = ANY(v_targets)
      AND t.tgname = 'ci_financial_safety_gate'
      AND NOT t.tgisinternal
  ) THEN
    RAISE EXCEPTION 'A proposed financial trigger already exists; inspect it rather than replacing it';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'ci_ceo_admins_single_enabled_uidx'
  ) THEN
    RAISE EXCEPTION 'The proposed CEO uniqueness index name already exists; inspect it rather than replacing it';
  END IF;
END;
$preflight$;

-- A hard database constraint prevents accidental toggling of the global
-- financial flag by authenticated, service-role, or ordinary owner-level DML.
-- Enabling financial operations later requires a separate, explicitly
-- reviewed change that removes this constraint.
ALTER TABLE public.platform_control
  ADD CONSTRAINT ci_financial_operations_must_remain_disabled
  CHECK (financial_operations_enabled IS FALSE) NOT VALID;

ALTER TABLE public.platform_control
  VALIDATE CONSTRAINT ci_financial_operations_must_remain_disabled;

-- Allow zero enabled CEOs as a safe lockout state, but never two enabled CEOs.
CREATE UNIQUE INDEX ci_ceo_admins_single_enabled_uidx
  ON public.ceo_admins (enabled)
  WHERE enabled IS TRUE;

-- Do not allow application/API roles to self-administer the CEO allowlist.
-- CEO allowlist maintenance remains an owner-controlled administrative task.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER
  ON TABLE public.ceo_admins
  FROM PUBLIC, anon, authenticated, service_role;

-- Read-only helper. Missing control row fails closed to FALSE.
CREATE FUNCTION private.financial_operations_are_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  SELECT COALESCE(
    (
      SELECT pc.financial_operations_enabled
      FROM public.platform_control AS pc
      WHERE pc.id = 1
    ),
    false
  );
$function$;

REVOKE ALL PRIVILEGES
  ON FUNCTION private.financial_operations_are_enabled()
  FROM PUBLIC, anon, service_role;

GRANT EXECUTE
  ON FUNCTION private.financial_operations_are_enabled()
  TO authenticated;

-- AAL2 is an additional restrictive condition, not a replacement for the
-- existing permissive customer-ownership or CEO policies. Non-CEO customer
-- sessions continue to be evaluated by their existing row-ownership policies.
-- This covers every public table whose current policy grants CEO access.
DO $ceo_aal2_guards$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT DISTINCT schemaname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname <> 'ci_ceo_aal2_restrictive_guard'
      AND (
        COALESCE(qual, '') ILIKE '%private.is_ceo%'
        OR COALESCE(with_check, '') ILIKE '%private.is_ceo%'
      )
    ORDER BY schemaname, tablename
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR ALL TO authenticated
       USING (
         (NOT private.is_ceo())
         OR ((SELECT auth.jwt() ->> ''aal'') = ''aal2'')
       )
       WITH CHECK (
         (NOT private.is_ceo())
         OR ((SELECT auth.jwt() ->> ''aal'') = ''aal2'')
       )',
      'ci_ceo_aal2_restrictive_guard',
      target.schemaname,
      target.tablename
    );
  END LOOP;
END;
$ceo_aal2_guards$;

-- These eight tables can represent requests, investment records, ledger
-- entries, investment outcomes, or order intents. While the global flag is
-- false, authenticated writes are denied, including customer-submitted
-- deposit/withdrawal requests and preview-only order-intent inserts.
DO $financial_rls_guards$
DECLARE
  target_table text;
  targets text[] := ARRAY[
    'deposit_requests',
    'withdrawal_requests',
    'investment_plans',
    'investments',
    'ledger_entries',
    'investment_events',
    'investment_outcome_proposals',
    'order_intents'
  ];
BEGIN
  FOREACH target_table IN ARRAY targets LOOP
    EXECUTE format(
      'CREATE POLICY ci_financial_gate_insert ON public.%I AS RESTRICTIVE
       FOR INSERT TO authenticated
       WITH CHECK ((SELECT private.financial_operations_are_enabled()))',
      target_table
    );

    EXECUTE format(
      'CREATE POLICY ci_financial_gate_update ON public.%I AS RESTRICTIVE
       FOR UPDATE TO authenticated
       USING ((SELECT private.financial_operations_are_enabled()))
       WITH CHECK ((SELECT private.financial_operations_are_enabled()))',
      target_table
    );

    EXECUTE format(
      'CREATE POLICY ci_financial_gate_delete ON public.%I AS RESTRICTIVE
       FOR DELETE TO authenticated
       USING ((SELECT private.financial_operations_are_enabled()))',
      target_table
    );
  END LOOP;
END;
$financial_rls_guards$;

-- RLS is bypassable by service_role. This trigger is the second line of
-- defence for ordinary INSERT/UPDATE/DELETE statements from any API role.
CREATE FUNCTION private.block_financial_writes_when_disabled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
BEGIN
  IF NOT COALESCE(private.financial_operations_are_enabled(), false) THEN
    RAISE EXCEPTION 'CryptoInvest financial operations are disabled'
      USING ERRCODE = '55000';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL PRIVILEGES
  ON FUNCTION private.block_financial_writes_when_disabled()
  FROM PUBLIC, anon, authenticated, service_role;

DO $financial_triggers$
DECLARE
  target_table text;
  targets text[] := ARRAY[
    'deposit_requests',
    'withdrawal_requests',
    'investment_plans',
    'investments',
    'ledger_entries',
    'investment_events',
    'investment_outcome_proposals',
    'order_intents'
  ];
BEGIN
  FOREACH target_table IN ARRAY targets LOOP
    EXECUTE format(
      'CREATE TRIGGER ci_financial_safety_gate
       BEFORE INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW
       EXECUTE FUNCTION private.block_financial_writes_when_disabled()',
      target_table
    );
  END LOOP;
END;
$financial_triggers$;

-- TRUNCATE bypasses row-level triggers and RLS. Remove that path from API
-- roles. Remove TRIGGER privilege too, so API roles cannot add their own
-- triggers to the guarded tables. These revokes do not delete or rewrite rows.
REVOKE TRUNCATE, TRIGGER
  ON TABLE
    public.deposit_requests,
    public.withdrawal_requests,
    public.investment_plans,
    public.investments,
    public.ledger_entries,
    public.investment_events,
    public.investment_outcome_proposals,
    public.order_intents
  FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
