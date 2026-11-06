-- CryptoInvest authorization/safety verification
-- Run ONLY against an isolated development database after the proposal has
-- been independently reviewed and applied there. Never run against production.
-- Catalog checks are read-only. The only DML is a TEMP-table trigger probe.
-- The transaction is rolled back.

BEGIN;

DO $verify$
DECLARE
  v_flag boolean;
  v_enabled_ceos integer;
  v_expected_ceo_tables integer;
  v_actual_ceo_guards integer;
  v_financial_policy_count integer;
  v_trigger_count integer;
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
  SELECT financial_operations_enabled
    INTO v_flag
  FROM public.platform_control
  WHERE id = 1;

  IF v_flag IS DISTINCT FROM false
     OR private.financial_operations_are_enabled() IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'FAIL: financial operations must remain disabled';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.platform_control'::regclass
      AND conname = 'ci_financial_operations_must_remain_disabled'
      AND convalidated
  ) THEN
    RAISE EXCEPTION 'FAIL: validated disabled-flag constraint is missing';
  END IF;

  SELECT count(*) INTO v_enabled_ceos
  FROM public.ceo_admins
  WHERE enabled IS TRUE;

  IF v_enabled_ceos > 1 THEN
    RAISE EXCEPTION 'FAIL: more than one enabled CEO record exists';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'ci_ceo_admins_single_enabled_uidx'
      AND indexdef ILIKE '%UNIQUE%'
      AND indexdef ILIKE '%WHERE (enabled IS TRUE)%'
  ) THEN
    RAISE EXCEPTION 'FAIL: single-enabled-CEO unique index is missing';
  END IF;

  SELECT count(DISTINCT tablename) INTO v_expected_ceo_tables
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname <> 'ci_ceo_aal2_restrictive_guard'
    AND (
      COALESCE(qual, '') ILIKE '%private.is_ceo%'
      OR COALESCE(with_check, '') ILIKE '%private.is_ceo%'
    );

  SELECT count(*) INTO v_actual_ceo_guards
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname = 'ci_ceo_aal2_restrictive_guard'
    AND permissive = 'RESTRICTIVE'
    AND cmd = 'ALL'
    AND COALESCE(qual, '') ILIKE '%aal2%'
    AND COALESCE(with_check, '') ILIKE '%aal2%';

  IF v_actual_ceo_guards <> v_expected_ceo_tables THEN
    RAISE EXCEPTION 'FAIL: CEO AAL2 guard coverage expected %, found %',
      v_expected_ceo_tables, v_actual_ceo_guards;
  END IF;

  SELECT count(*) INTO v_financial_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = ANY(v_targets)
    AND policyname IN (
      'ci_financial_gate_insert',
      'ci_financial_gate_update',
      'ci_financial_gate_delete'
    )
    AND permissive = 'RESTRICTIVE';

  IF v_financial_policy_count <> 24 THEN
    RAISE EXCEPTION 'FAIL: expected 24 restrictive financial policies, found %',
      v_financial_policy_count;
  END IF;

  SELECT count(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = ANY(v_targets)
    AND t.tgname = 'ci_financial_safety_gate'
    AND NOT t.tgisinternal;

  IF v_trigger_count <> 8 THEN
    RAISE EXCEPTION 'FAIL: expected 8 financial safety triggers, found %',
      v_trigger_count;
  END IF;

  FOREACH v_table IN ARRAY v_targets LOOP
    IF NOT (
      SELECT c.relrowsecurity
      FROM pg_class c
      WHERE c.oid = to_regclass(format('public.%I', v_table))
    ) THEN
      RAISE EXCEPTION 'FAIL: RLS is not enabled on public.%', v_table;
    END IF;

    IF has_table_privilege('anon', format('public.%I', v_table), 'TRUNCATE')
       OR has_table_privilege('authenticated', format('public.%I', v_table), 'TRUNCATE')
       OR has_table_privilege('service_role', format('public.%I', v_table), 'TRUNCATE') THEN
      RAISE EXCEPTION 'FAIL: API role retains TRUNCATE on public.%', v_table;
    END IF;

    IF has_table_privilege('anon', format('public.%I', v_table), 'TRIGGER')
       OR has_table_privilege('authenticated', format('public.%I', v_table), 'TRIGGER')
       OR has_table_privilege('service_role', format('public.%I', v_table), 'TRIGGER') THEN
      RAISE EXCEPTION 'FAIL: API role retains TRIGGER privilege on public.%', v_table;
    END IF;
  END LOOP;

  IF has_table_privilege('authenticated', 'public.ceo_admins', 'INSERT')
     OR has_table_privilege('authenticated', 'public.ceo_admins', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.ceo_admins', 'DELETE')
     OR has_table_privilege('service_role', 'public.ceo_admins', 'INSERT')
     OR has_table_privilege('service_role', 'public.ceo_admins', 'UPDATE')
     OR has_table_privilege('service_role', 'public.ceo_admins', 'DELETE') THEN
    RAISE EXCEPTION 'FAIL: API role retains CEO allowlist write privileges';
  END IF;
END;
$verify$;

-- Confirm the row trigger blocks a write while the control flag is false.
CREATE TEMP TABLE ci_financial_guard_probe (id integer);

CREATE TRIGGER ci_financial_safety_gate
BEFORE INSERT OR UPDATE OR DELETE ON ci_financial_guard_probe
FOR EACH ROW EXECUTE FUNCTION private.block_financial_writes_when_disabled();

DO $trigger_probe$
DECLARE
  v_message text;
BEGIN
  BEGIN
    INSERT INTO ci_financial_guard_probe (id) VALUES (1);
    RAISE EXCEPTION 'TEST_INSERT_WAS_NOT_BLOCKED';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    IF v_message <> 'CryptoInvest financial operations are disabled' THEN
      RAISE;
    END IF;
  END;
END;
$trigger_probe$;

SELECT 'PASS: catalog controls and disabled-write trigger probe' AS verification_result;

ROLLBACK;
