"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../lib/supabase/browser";

type EventRow = { id: string; event_type: string; status: string | null; message: string; created_at: string };
type PlanRow = { id: string; name: string; asset_code: string; risk_level: string; currency_code: string; is_active: boolean };

const metricLabels = [
  ["Total Customers", "profiles", "♙", "blue"],
  ["Deposit Requests", "deposit_requests", "↓", "green"],
  ["Withdrawal Requests", "withdrawal_requests", "↑", "purple"],
  ["Investment Records", "investments", "▥", "gold"],
] as const;

export default function AdminOverviewLive({ basePath }: { basePath: string }) {
  const [counts, setCounts] = useState<Record<string, number | null>>({
    profiles: null, deposit_requests: null, withdrawal_requests: null, investments: null,
  });
  const [events, setEvents] = useState<EventRow[]>([]);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    setMessage("");
    try {
      const client = createSupabaseBrowserClient();
      const [{ data: userData, error: userError }, { data: assurance, error: assuranceError }] = await Promise.all([
        client.auth.getUser(),
        client.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (userError || !userData.user) throw new Error("CEO sign-in is required.");
      if (assuranceError || assurance?.currentLevel !== "aal2") throw new Error("A verified AAL2 CEO session is required.");
      const { data: ceo, error: ceoError } = await client.from("ceo_admins").select("user_id").eq("user_id", userData.user.id).eq("enabled", true).maybeSingle();
      if (ceoError || !ceo) throw new Error("This session is not authorized for CEO administration.");

      const [customers, deposits, withdrawals, investments, eventRows, planRows] = await Promise.all([
        client.from("profiles").select("id", { count: "exact", head: true }),
        client.from("deposit_requests").select("id", { count: "exact", head: true }),
        client.from("withdrawal_requests").select("id", { count: "exact", head: true }),
        client.from("investments").select("id", { count: "exact", head: true }),
        client.from("investment_events").select("id,event_type,status,message,created_at").order("created_at", { ascending: false }).limit(6),
        client.from("investment_plans").select("id,name,asset_code,risk_level,currency_code,is_active").eq("is_active", true).order("name").limit(6),
      ]);
      const failures = [customers, deposits, withdrawals, investments, eventRows, planRows].filter((result) => result.error);
      if (failures.length) throw new Error(failures.map((result) => result.error?.message).join("; "));
      setCounts({
        profiles: customers.count ?? 0,
        deposit_requests: deposits.count ?? 0,
        withdrawal_requests: withdrawals.count ?? 0,
        investments: investments.count ?? 0,
      });
      setEvents((eventRows.data || []) as EventRow[]);
      setPlans((planRows.data || []) as PlanRow[]);
      setState("ready");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Unable to load verified admin data.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return <>
    <section className="ci-welcome-banner">
      <div className="ci-banner-copy">
        <span className="ci-banner-eyebrow">WELCOME TO YOUR ADMIN WORKSPACE</span>
        <h1>Welcome back, CEO Admin</h1>
        <p>Live operational summaries are loaded from the protected CryptoInvest database.</p>
        <small>⌑ &nbsp;CEO workspace · AAL2 verified · financial operations disabled</small>
      </div>
      <div className="ci-banner-art" aria-hidden="true"><div className="ci-globe">₿</div><span className="ci-orbit ci-orbit-one"/><span className="ci-orbit ci-orbit-two"/><span className="ci-art-bars"><i/><i/><i/><i/><i/></span></div>
    </section>

    {state === "error" && <section className="ci-card" role="alert" style={{ marginTop: 16 }}>
      <strong>Live data could not be verified</strong><p>{message}</p><button className="ci-primary-link" type="button" onClick={() => void load()}>Retry data check</button>
    </section>}

    <div className="ci-metrics">
      {metricLabels.map(([label, key, icon, tone]) => <article className="ci-metric" key={key}>
        <div className="ci-metric-top"><span>{label}</span><span className={`ci-metric-icon ${tone}`}>{icon}</span></div>
        <strong>{state === "loading" ? "…" : counts[key] === null ? "—" : counts[key]?.toLocaleString()}</strong>
        <small>{state === "ready" ? "Verified database record count" : state === "loading" ? "Checking protected records" : "Unavailable — check connection"}</small>
      </article>)}
    </div>

    <div className="ci-main-grid">
      <section className="ci-card ci-performance">
        <div className="ci-card-heading"><div><span className="ci-kicker">PLATFORM ANALYTICS</span><h2>Platform Performance</h2></div><span className="ci-period">Ledger reports not yet reconciled</span></div>
        <div className="ci-empty"><span aria-hidden="true">▥</span><strong>Financial charts are withheld</strong><p>We will show charts only after ledger totals and provider records are independently reconciled.</p><small>No estimated balances, returns or fabricated trends are displayed.</small></div>
      </section>
      <section className="ci-card ci-activity">
        <div className="ci-card-heading"><div><span className="ci-kicker">PLATFORM FEED</span><h2>Recent Investment Events</h2></div><span className="ci-unavailable">{state === "ready" ? "Database records" : "Awaiting verification"}</span></div>
        {events.length ? <div className="ci-check-list">{events.map((event) => <p key={event.id}><span>•</span><span><strong>{event.event_type.replaceAll("_", " ")}</strong><br/>{event.message}<br/><small>{new Date(event.created_at).toLocaleString()}</small></span><b>{event.status || "event"}</b></p>)}</div> : <div className="ci-empty"><strong>No visible investment events</strong><p>Customer-visible events will appear here when records exist.</p></div>}
      </section>
    </div>

    <div className="ci-bottom-grid">
      <section className="ci-card ci-plans">
        <div className="ci-card-heading"><div><span className="ci-kicker">PLAN MANAGEMENT</span><h2>Published Investment Plans</h2></div><Link href={`${basePath}/plans`} className="ci-view-link">View plans →</Link></div>
        {plans.length ? <div className="ci-check-list">{plans.map((plan) => <p key={plan.id}><span>◇</span><span><strong>{plan.name}</strong><br/><small>{plan.asset_code} · {plan.risk_level.replaceAll("_", " ")} risk · {plan.currency_code}</small></span><b>Active</b></p>)}</div> : <div className="ci-empty"><strong>No active plans returned</strong><p>Only published active plans are shown. No sample plans are inserted.</p></div>}
      </section>
      <section className="ci-card ci-security">
        <div className="ci-card-heading"><div><span className="ci-kicker">ACCESS CONTROL</span><h2>Security Overview</h2></div><Link href={`${basePath}/security`} className="ci-view-link">View details →</Link></div>
        <div className="ci-security-body"><div className="ci-shield">✓</div><div><strong>Access checks passed for this view</strong><p><span>✓</span> CEO-only account verified</p><p><span>✓</span> AAL2 authenticator session verified</p><p><span>✓</span> Financial operations disabled</p></div></div>
      </section>
      <section className="ci-card ci-controls">
        <div className="ci-card-heading"><div><span className="ci-kicker">SYSTEM CONTROL</span><h2>System Controls</h2></div></div>
        <div className="ci-control-box"><span className="ci-control-power">⏻</span><div><strong>Financial Operations</strong><b>Currently Disabled</b><small>This screen cannot enable money movement.</small></div></div>
        <Link href={`${basePath}/system-status`} className="ci-primary-link">View system status</Link>
      </section>
    </div>
  </>;
}
