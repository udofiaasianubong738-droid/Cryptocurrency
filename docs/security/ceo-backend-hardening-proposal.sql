-- CryptoInvest CEO backend hardening proposal
-- REVIEW-ONLY: this file is NOT a production migration and must not be applied
-- to the authoritative project without independent review and approval.
--
-- Goals:
--   1. Require AAL2 for every authenticated policy path that grants CEO access.
--   2. Fail closed for financial-table writes while platform_control says false.
--   3. Enforce the financial switch below RLS too, so service-role clients cannot
--      accidentally bypass the disabled state through ordinary table writes.
--
-- No rows are inserted, updated, or deleted by this proposal. The only data read
-- is the single platform_control flag. The trigger blocks writes; it does not
-- perform financial operations.

BEGIN;

-- A missing control row must be interpreted as disabled.
CREATE OR REPLACE FUNCTION private.financial_operations_are_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
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

REVOKE ALL ON FUNCTION private.financial_operations_are_enabled() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.financial_operations_are_enabled() TO authenticated;

-- Add a restrictive policy to each table whose existing policies include
-- private.is_ceo(). Permissive policies continue to decide which rows a
-- customer may access; this restrictive policy only adds the CEO AAL2 gate.
DO $policy_guard$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT DISTINCT schemaname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        COALESCE(qual, '') ILIKE '%private.is_ceo%'
        OR COALESCE(with_check, '') ILIKE '%private.is_ceo%'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      'ceo_aal2_guard', target.schemaname, target.tablename
    );

    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR ALL TO authenticated
       USING ((NOT private.is_ceo()) OR ((SELECT auth.jwt() ->> ''aal'') = ''aal2''))
       WITH CHECK ((NOT private.is_ceo()) OR ((SELECT auth.jwt() ->> ''aal'') = ''aal2''))',
      'ceo_aal2_guard', target.schemaname, target.tablename
    );
  END LOOP;
END;
$policy_guard$;

-- These tables contain financial requests, plans, investments, events, or
-- ledger records. Keep all authenticated writes blocked while the switch is
-- false, including customer-submitted requests. Reads remain governed by the
-- existing ownership/CEO policies.
DO $financial_policy_guard$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'deposit_requests',
    'withdrawal_requests',
    'investment_plans',
    'investments',
    'ledger_entries',
    'investment_events'
  ]
  LOOP
    IF to_regclass(format('public.%I', target_table)) IS NULL THEN
      RAISE EXCEPTION 'Required financial table public.% is missing', target_table;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS financial_ops_insert_guard ON public.%I', target_table);
    EXECUTE format('DROP POLICY IF EXISTS financial_ops_update_guard ON public.%I', target_table);
    EXECUTE format('DROP POLICY IF EXISTS financial_ops_delete_guard ON public.%I', target_table);

    EXECUTE format(
      'CREATE POLICY financial_ops_insert_guard ON public.%I AS RESTRICTIVE
       FOR INSERT TO authenticated
       WITH CHECK ((SELECT private.financial_operations_are_enabled()))',
      target_table
    );
    EXECUTE format(
      'CREATE POLICY financial_ops_update_guard ON public.%I AS RESTRICTIVE
       FOR UPDATE TO authenticated
       USING ((SELECT private.financial_operations_are_enabled()))
       WITH CHECK ((SELECT private.financial_operations_are_enabled()))',
      target_table
    );
    EXECUTE format(
      'CREATE POLICY financial_ops_delete_guard ON public.%I AS RESTRICTIVE
       FOR DELETE TO authenticated
       USING ((SELECT private.financial_operations_are_enabled()))',
      target_table
    );
  END LOOP;
END;
$financial_policy_guard$;

-- RLS can be bypassed by privileged service-role clients. A BEFORE trigger
-- supplies a second, fail-closed control for ordinary INSERT/UPDATE/DELETE
-- statements on the six financial tables.
CREATE OR REPLACE FUNCTION private.block_financial_writes_when_disabled()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
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

REVOKE ALL ON FUNCTION private.block_financial_writes_when_disabled() FROM PUBLIC, anon, authenticated;

DO $financial_trigger_guard$
DECLARE
  target_table text;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'deposit_requests',
    'withdrawal_requests',
    'investment_plans',
    'investments',
    'ledger_entries',
    'investment_events'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS financial_ops_write_guard ON public.%I',
      target_table
    );
    EXECUTE format(
      'CREATE TRIGGER financial_ops_write_guard
       BEFORE INSERT OR UPDATE OR DELETE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION private.block_financial_writes_when_disabled()',
      target_table
    );
  END LOOP;
END;
$financial_trigger_guard$;

-- Deliberately do not update platform_control. Its current false value must
-- remain false throughout this phase.
COMMIT;
