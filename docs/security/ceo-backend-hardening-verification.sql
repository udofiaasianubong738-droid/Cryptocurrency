-- CryptoInvest backend-hardening verification
-- Run ONLY against an isolated development database after reviewing and
-- applying the companion proposal there. Do not run against production.
-- This script performs catalog reads and a TEMP-table trigger probe only.
-- The transaction is rolled back at the end.

BEGIN;

SELECT
  pc.financial_operations_enabled,
  private.financial_operations_are_enabled() AS helper_result
FROM public.platform_control AS pc
WHERE pc.id = 1;

DO $checks$
DECLARE
  v_flag boolean;
  v_helper boolean;
  v_trigger_count integer;
  v_financial_policy_count integer;
  v_expected_ceo_tables integer;
  v_actual_ceo_guards integer;
  v_bad_ceo_guards integer;
BEGIN
  SELECT financial_operations_enabled INTO v_flag
  FROM public.platform_control WHERE id = 1;

  IF v_flag IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Safety check failed: financial_operations_enabled must remain false';
  END IF;

  SELECT private.financial_operations_are_enabled() INTO v_helper;
  IF v_helper IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Safety check failed: financial operations helper must fail closed to false';
  END IF;

  SELECT count(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = ANY (ARRAY[
      'deposit_requests','withdrawal_requests','investment_plans',
      'investments','ledger_entries','investment_events'
    ])
    AND t.tgname = 'financial_ops_write_guard'
    AND NOT t.tgisinternal;

  IF v_trigger_count <> 6 THEN
    RAISE EXCEPTION 'Expected 6 financial write-guard triggers; found %', v_trigger_count;
  END IF;

  SELECT count(*) INTO v_financial_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = ANY (ARRAY[
      'deposit_requests','withdrawal_requests','investment_plans',
      'investments','ledger_entries','investment_events'
    ])
    AND policyname IN (
      'financial_ops_insert_guard',
      'financial_ops_update_guard',
      'financial_ops_delete_guard'
    );

  IF v_financial_policy_count <> 18 THEN
    RAISE EXCEPTION 'Expected 18 restrictive financial-write policies; found %', v_financial_policy_count;
  END IF;

  SELECT count(DISTINCT tablename) INTO v_expected_ceo_tables
  FROM pg_policies
  WHERE schemaname = 'public'
    AND (
      COALESCE(qual, '') ILIKE '%private.is_ceo%'
      OR COALESCE(with_check, '') ILIKE '%private.is_ceo%'
    );

  SELECT count(*) INTO v_actual_ceo_guards
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname = 'ceo_aal2_guard';

  IF v_actual_ceo_guards <> v_expected_ceo_tables THEN
    RAISE EXCEPTION 'CEO AAL2 guard coverage mismatch: expected %, found %',
      v_expected_ceo_tables, v_actual_ceo_guards;
  END IF;

  SELECT count(*) INTO v_bad_ceo_guards
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname = 'ceo_aal2_guard'
    AND (
      COALESCE(qual, '') NOT ILIKE '%aal2%'
      OR COALESCE(with_check, '') NOT ILIKE '%aal2%'
    );

  IF v_bad_ceo_guards <> 0 THEN
    RAISE EXCEPTION 'Found % CEO AAL2 guard policies missing an AAL2 predicate', v_bad_ceo_guards;
  END IF;
END;
$checks$;

-- Probe the trigger using a temporary table. This verifies that the trigger
-- rejects writes while the authoritative platform_control flag is false.
CREATE TEMP TABLE ci_financial_guard_probe (id integer);

CREATE TRIGGER financial_ops_write_guard
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

SELECT 'PASS: catalog guards and disabled-write trigger probe verified' AS verification_result;

ROLLBACK;
