"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

type Plan = { id: string; name: string; asset_code: string; network: string | null; description: string; risk_level: string; minimum_amount: number; maximum_amount: number | null; currency_code: string; risk_disclosure: string };
type Investment = { id: string; plan_id: string | null; asset_code: string; principal_amount: number; currency_code: string; status: string; created_at: string; opened_at: string | null; closed_at: string | null };
type LedgerEntry = { id: string; entry_type: string; amount: number; currency_code: string; memo: string | null; created_at: string };
type EventRow = { id: string; event_type: string; status: string | null; message: string; created_at: string };
type Notification = { id: string; category: string; title: string; body: string; created_at: string; read_at: string | null };

const panel: CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 20, boxShadow: "0 8px 28px rgba(15,23,42,.04)" };
const muted: CSSProperties = { color: "#64748b", fontSize: 13, lineHeight: 1.6 };
const money = (value: number, currency: string) => new Intl.NumberFormat(undefined, { style: "currency", currency: /^[A-Z]{3}$/.test(currency) ? currency : "USD", maximumFractionDigits: 2 }).format(Number(value || 0));

export default function AccountPortal() {
  const router = useRouter();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("Customer");
  const [email, setEmail] = useState("");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const load = useCallback(async () => {
    setBusy(true); setError("");
    try {
      const client = createSupabaseBrowserClient();
      const { data: userData, error: userError } = await client.auth.getUser();
      if (userError || !userData.user) { router.replace("/account/login"); return; }
      setEmail(userData.user.email || "");
      const [profile, planRows, investmentRows, ledgerRows, eventRows, notificationRows] = await Promise.all([
        client.from("profiles").select("display_name").eq("id", userData.user.id).maybeSingle(),
        client.from("investment_plans").select("id,name,asset_code,network,description,risk_level,minimum_amount,maximum_amount,currency_code,risk_disclosure").eq("is_active", true).order("name").limit(50),
        client.from("investments").select("id,plan_id,asset_code,principal_amount,currency_code,status,created_at,opened_at,closed_at").eq("customer_id", userData.user.id).order("created_at", { ascending: false }).limit(50),
        client.from("ledger_entries").select("id,entry_type,amount,currency_code,memo,created_at").eq("customer_id", userData.user.id).order("created_at", { ascending: false }).limit(50),
        client.from("investment_events").select("id,event_type,status,message,created_at").eq("customer_id", userData.user.id).eq("visible_to_customer", true).order("created_at", { ascending: false }).limit(30),
        client.from("user_notifications").select("id,category,title,body,created_at,read_at").eq("user_id", userData.user.id).order("created_at", { ascending: false }).limit(30),
      ]);
      const failures = [profile, planRows, investmentRows, ledgerRows, eventRows, notificationRows].filter((result) => result.error);
      if (failures.length) throw new Error(failures.map((result) => result.error?.message).join("; "));
      setName(profile.data?.display_name?.trim() || "Customer");
      setPlans((planRows.data || []) as Plan[]);
      setInvestments((investmentRows.data || []) as Investment[]);
      setLedger((ledgerRows.data || []) as LedgerEntry[]);
      setEvents((eventRows.data || []) as EventRow[]);
      setNotifications((notificationRows.data || []) as Notification[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your account data could not be loaded.");
    } finally { setBusy(false); }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function signOut() {
    const client = createSupabaseBrowserClient();
    await client.auth.signOut();
    router.replace("/account/login");
    router.refresh();
  }

  return <main style={{ minHeight: "100vh", background: "#f5f7fb", color: "#0f172a", padding: "24px 16px 56px" }}>
    <div style={{ maxWidth: 1120, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div><div style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".12em", color: "#2563eb" }}>CRYPTOINVEST</div><h1 style={{ margin: "6px 0", fontSize: 30 }}>Your account</h1><p style={muted}>Welcome, {name}. Your information is private to your signed-in account.</p></div>
        <button type="button" onClick={() => void signOut()} style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>Sign out</button>
      </header>
      <section style={{ ...panel, borderColor: "#fcd34d", background: "#fffbeb", marginBottom: 18 }}>
        <strong>Read-only account view</strong>
        <p style={{ ...muted, color: "#78350f", marginBottom: 0 }}>This portal displays records already associated with your account. Deposits, withdrawals, trading, investment purchases and money transfers are not available here. Displayed records are not a promise of returns or current market value.</p>
      </section>
      {error && <section role="alert" style={{ ...panel, borderColor: "#fecaca", color: "#991b1b", marginBottom: 18 }}><strong>Unable to load account information</strong><p>{error}</p><button onClick={() => void load()} type="button">Retry</button></section>}
      {busy && <section style={panel} aria-live="polite">Loading your protected account records…</section>}
      {!busy && !error && <>
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 18 }}>
          <article style={panel}><div style={muted}>Email</div><strong style={{ display: "block", marginTop: 8, overflowWrap: "anywhere" }}>{email || "Verified account"}</strong></article>
          <article style={panel}><div style={muted}>Investment records</div><strong style={{ display: "block", marginTop: 8, fontSize: 26 }}>{investments.length}</strong></article>
          <article style={panel}><div style={muted}>Published plans available to view</div><strong style={{ display: "block", marginTop: 8, fontSize: 26 }}>{plans.length}</strong></article>
          <article style={panel}><div style={muted}>Ledger entries</div><strong style={{ display: "block", marginTop: 8, fontSize: 26 }}>{ledger.length}</strong></article>
        </section>
        <section style={{ ...panel, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>Your investment records</h2>
          <p style={muted}>Principal amounts are historical record values, not a live portfolio valuation.</p>
          {investments.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}><thead><tr>{["Asset","Recorded principal","Status","Created"].map(x=><th key={x} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e2e8f0", fontSize: 12 }}>{x}</th>)}</tr></thead><tbody>{investments.map(item=><tr key={item.id}>{[item.asset_code,money(Number(item.principal_amount),item.currency_code),item.status.replaceAll("_"," "),new Date(item.created_at).toLocaleDateString()].map((x,i)=><td key={i} style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{x}</td>)}</tr>)}</tbody></table></div> : <p style={muted}>No investment records are currently associated with this account.</p>}
        </section>
        <section style={{ ...panel, marginBottom: 18 }}>
          <h2 style={{ marginTop: 0 }}>Published investment plans</h2>
          {plans.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12 }}>{plans.map(plan=><article key={plan.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}><strong>{plan.name}</strong><p style={muted}>{plan.asset_code}{plan.network ? " · "+plan.network : ""} · {plan.risk_level.replaceAll("_"," ")} risk</p><p>{plan.description}</p><p style={muted}>Minimum: {money(Number(plan.minimum_amount),plan.currency_code)}{plan.maximum_amount !== null ? " · Maximum: "+money(Number(plan.maximum_amount),plan.currency_code) : ""}</p><p style={{ ...muted, color: "#92400e" }}>{plan.risk_disclosure}</p></article>)}</div> : <p style={muted}>There are no published plans available to view right now.</p>}
        </section>
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14, marginBottom: 18 }}>
          <article style={panel}><h2 style={{ marginTop: 0 }}>Recent account activity</h2>{events.length ? events.map(event=><div key={event.id} style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}><strong>{event.event_type.replaceAll("_"," ")}</strong><p style={{ margin: "4px 0", ...muted }}>{event.message}</p><small style={muted}>{new Date(event.created_at).toLocaleString()}</small></div>) : <p style={muted}>No customer-visible activity has been recorded.</p>}</article>
          <article style={panel}><h2 style={{ marginTop: 0 }}>Notifications</h2>{notifications.length ? notifications.map(item=><div key={item.id} style={{ padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}><strong>{item.title}</strong><p style={{ margin: "4px 0", ...muted }}>{item.body}</p><small style={muted}>{new Date(item.created_at).toLocaleString()} · {item.read_at ? "Read" : "Unread"}</small></div>) : <p style={muted}>No notifications are available.</p>}</article>
        </section>
        <section style={panel}>
          <h2 style={{ marginTop: 0 }}>Ledger history</h2>
          <p style={muted}>This is an entry history only. It is not a reconciled account balance or proof of available funds.</p>
          {ledger.length ? <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}><thead><tr>{["Entry","Amount","Memo","Date"].map(x=><th key={x} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #e2e8f0", fontSize: 12 }}>{x}</th>)}</tr></thead><tbody>{ledger.map(item=><tr key={item.id}><td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{item.entry_type.replaceAll("_"," ")}</td><td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{money(Number(item.amount),item.currency_code)}</td><td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{item.memo || "—"}</td><td style={{ padding: 10, borderBottom: "1px solid #f1f5f9" }}>{new Date(item.created_at).toLocaleString()}</td></tr>)}</tbody></table></div> : <p style={muted}>No ledger entries are currently associated with this account.</p>}
        </section>
      </>}
      <footer style={{ ...muted, textAlign: "center", marginTop: 28 }}>CryptoInvest · Customer portal · Read-only mode</footer>
    </div>
  </main>;
}
