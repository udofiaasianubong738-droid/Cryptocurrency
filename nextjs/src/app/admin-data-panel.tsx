"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

type Row = Record<string, string | number | boolean | null>;

const configs: Record<string, { title: string; table: string; columns: string[]; headings: string[] }> = {
  customers: { title: "Customer records", table: "profiles", columns: ["id", "display_name", "created_at"], headings: ["Customer ID", "Display name", "Created"] },
  deposits: { title: "Deposit requests", table: "deposit_requests", columns: ["id", "customer_id", "amount", "currency_code", "asset_code", "status", "created_at"], headings: ["Request ID", "Customer", "Amount", "Currency", "Asset", "Status", "Created"] },
  withdrawals: { title: "Withdrawal requests", table: "withdrawal_requests", columns: ["id", "customer_id", "amount", "currency_code", "asset_code", "status", "created_at"], headings: ["Request ID", "Customer", "Amount", "Currency", "Asset", "Status", "Created"] },
  plans: { title: "Investment plans", table: "investment_plans", columns: ["id", "name", "asset_code", "risk_level", "minimum_amount", "maximum_amount", "currency_code", "is_active", "updated_at"], headings: ["Plan ID", "Name", "Asset", "Risk", "Minimum", "Maximum", "Currency", "Published", "Updated"] },
  portfolio: { title: "Investment records", table: "investments", columns: ["id", "customer_id", "asset_code", "principal_amount", "currency_code", "status", "created_at"], headings: ["Investment ID", "Customer", "Asset", "Recorded principal", "Currency", "Status", "Created"] },
  ledger: { title: "Ledger entries", table: "ledger_entries", columns: ["id", "customer_id", "entry_type", "amount", "currency_code", "memo", "created_at"], headings: ["Entry ID", "Customer", "Type", "Amount", "Currency", "Memo", "Created"] },
  audit: { title: "Audit history", table: "audit_logs", columns: ["id", "actor_user_id", "action", "entity_type", "entity_id", "created_at"], headings: ["Event ID", "Actor", "Action", "Entity", "Entity ID", "Created"] },
  orders: { title: "Order intents (preview only)", table: "order_intents", columns: ["id", "user_id", "asset_code", "side", "quantity", "quote_price", "quote_currency", "status", "execution_enabled", "created_at"], headings: ["Intent ID", "User", "Asset", "Side", "Quantity", "Quote", "Currency", "Status", "Execution", "Created"] },
};

function display(value: Row[string], key: string) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key.endsWith("_at")) return new Date(String(value)).toLocaleString();
  if (key === "risk_level" || key === "entry_type") return String(value).replaceAll("_", " ");
  return String(value);
}

export default function AdminDataPanel({ section }: { section: string }) {
  const config = configs[section];
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [refreshed, setRefreshed] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const client = createSupabaseBrowserClient();
      const [{ data: userData, error: userError }, { data: assurance, error: assuranceError }] = await Promise.all([
        client.auth.getUser(),
        client.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (userError || !userData.user) throw new Error("Sign in with the authorized CEO account.");
      if (assuranceError || assurance?.currentLevel !== "aal2") throw new Error("A verified AAL2 session is required.");
      const { data: ceo, error: ceoError } = await client.from("ceo_admins").select("user_id").eq("user_id", userData.user.id).eq("enabled", true).maybeSingle();
      if (ceoError || !ceo) throw new Error("CEO authorization could not be verified.");
      if (!config) throw new Error("This admin data section is not configured.");
      const result = await client.from(config.table).select(config.columns.join(",")).order(config.columns.includes("created_at") ? "created_at" : config.columns[0], { ascending: false }).limit(100);
      if (result.error) throw new Error(result.error.message);
      setRows((result.data || []) as Row[]);
      setRefreshed(new Date().toLocaleString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load verified admin records.");
      setRows([]);
    } finally { setBusy(false); }
  }, [config]);

  useEffect(() => { void load(); }, [load]);

  if (!config) return null;
  return <section className="ci-card" style={{ overflow: "hidden" }}>
    <span className="ci-kicker">CEO-ONLY · AAL2 · READ-ONLY</span>
    <h2>{config.title}</h2>
    <p className="ci-section-copy">Records are loaded from the authoritative Supabase project and filtered by its row-level security policies. This screen does not approve, reject, create or modify financial records.</p>
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", margin: "12px 0" }}>
      <button type="button" className="ci-primary-link" onClick={() => void load()} disabled={busy}>{busy ? "Loading…" : "Refresh records"}</button>
      {refreshed && <small>Last refreshed {refreshed}</small>}
      <small>{rows.length} record(s) returned · maximum 100</small>
    </div>
    {error && <p role="alert" style={{ color: "#991b1b", background: "#fef2f2", padding: 12, borderRadius: 8 }}>{error}</p>}
    {busy ? <p>Checking CEO session and loading records…</p> : rows.length === 0 ? <div className="ci-empty"><strong>No records returned</strong><p>The table may be empty, or the connected session has no permitted rows.</p></div> :
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720, fontSize: 13 }}><thead><tr>{config.headings.map(h=><th key={h} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid var(--ci-border,#e2e8f0)", whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={String(row.id ?? i)}>{config.columns.map((column)=><td key={column} style={{ padding: 10, borderBottom: "1px solid var(--ci-border,#e2e8f0)", maxWidth: 280, overflowWrap: "anywhere" }}>{display(row[column],column)}</td>)}</tr>)}</tbody></table></div>}
    <p className="ci-readonly-note">Read-only record view · no money movement or balance mutation is available.</p>
  </section>;
}
