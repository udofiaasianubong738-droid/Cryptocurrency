"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

type Section = "home" | "profile" | "plans" | "investments" | "deposit" | "withdrawals" | "performance" | "transactions" | "notifications" | "documents" | "support" | "security";
type Row = Record<string, unknown>;

const nav: { id: Section; label: string; icon: string }[] = [
  { id: "home", label: "Overview", icon: "⌂" },
  { id: "profile", label: "My profile", icon: "♙" },
  { id: "plans", label: "Investment plans", icon: "◇" },
  { id: "investments", label: "My investments", icon: "▥" },
  { id: "deposit", label: "Deposit request", icon: "↓" },
  { id: "withdrawals", label: "Withdrawals", icon: "↑" },
  { id: "performance", label: "Profit & loss", icon: "↗" },
  { id: "transactions", label: "Transactions", icon: "≋" },
  { id: "notifications", label: "Notifications", icon: "♧" },
  { id: "documents", label: "Documents", icon: "▤" },
  { id: "support", label: "Support", icon: "?" },
  { id: "security", label: "Security", icon: "⬡" },
];

const titles: Record<Section, string> = {
  home: "Your overview",
  profile: "My profile",
  plans: "Investment plans",
  investments: "My investments",
  deposit: "Deposit request",
  withdrawals: "Withdrawal requests",
  performance: "Profit and loss",
  transactions: "Transactions",
  notifications: "Notifications",
  documents: "My documents",
  support: "Customer support",
  security: "Account security",
};

const sources: Partial<Record<Section, { table: string; columns: string; ownerColumn?: "customer_id" | "user_id"; activeOnly?: boolean }>> = {
  home: { table: "investments", columns: "id, asset_code, principal_amount, currency_code, status, created_at", ownerColumn: "customer_id" },
  plans: { table: "investment_plans", columns: "id, name, asset_code, network, description, risk_level, minimum_amount, maximum_amount, currency_code, risk_disclosure", activeOnly: true },
  investments: { table: "investments", columns: "id, plan_id, asset_code, principal_amount, currency_code, status, approved_return, realized_profit_loss, opened_at, closed_at, created_at", ownerColumn: "customer_id" },
  deposit: { table: "deposit_requests", columns: "id, amount, currency_code, asset_code, network, status, created_at, updated_at", ownerColumn: "customer_id" },
  withdrawals: { table: "withdrawal_requests", columns: "id, amount, currency_code, asset_code, network, status, created_at, updated_at", ownerColumn: "customer_id" },
  performance: { table: "investments", columns: "id, asset_code, principal_amount, currency_code, status, realized_profit_loss, closed_at, created_at", ownerColumn: "customer_id" },
  transactions: { table: "ledger_entries", columns: "id, entry_type, amount, currency_code, created_at", ownerColumn: "customer_id" },
  notifications: { table: "user_notifications", columns: "id, category, title, body, read_at, created_at", ownerColumn: "user_id" },
  support: { table: "support_tickets", columns: "id, subject, message, status, created_at, updated_at, closed_at", ownerColumn: "user_id" },
};

function displayValue(row: Row, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).length) return String(value);
  }
  return "—";
}

function RecordList({ rows, empty, valueKeys }: { rows: Row[]; empty: string; valueKeys?: string[] }) {
  if (!rows.length) {
    return <div className="customer-empty"><strong>Nothing to show yet</strong><p>{empty}</p></div>;
  }
  return <div className="customer-record-list">
    {rows.map((row, index) => (
      <article className="customer-record" key={String(row.id ?? row.created_at ?? index)}>
        <div>
          <strong>{displayValue(row, ["plan_name", "name", "title", "asset_code", "asset", "type", "subject", "reference", "id"])}</strong>
          <small>{displayValue(row, ["description", "message", "created_at", "updated_at", "reference"])}</small>
        </div>
        <div className="customer-record-side">
          <strong>{displayValue(row, valueKeys ?? ["amount", "principal_amount", "realized_profit_loss", "total", "value", "status", "profit_loss"])}</strong>
          <small>{displayValue(row, ["status", "currency_code", "asset_code"])}</small>
        </div>
      </article>
    ))}
  </div>;
}

export default function CustomerPortal({ activeSection = "home" }: { activeSection?: string }) {
  const router = useRouter();
  const section = (nav.some((item) => item.id === activeSection) ? activeSection : "home") as Section;
  const [user, setUser] = useState<{ id: string; email?: string; name?: string } | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  useEffect(() => {
    try {
      setSupabase(createSupabaseBrowserClient());
    } catch {
      setError("Customer sign-in is not configured yet. The portal is available after the Supabase public URL and publishable key are configured.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!supabase) return;
      setLoading(true);
      setError("");
      setRows([]);
      const { data: { user: current }, error: authError } = await supabase.auth.getUser();
      if (!alive) return;
      if (authError || !current) {
        router.replace("/customer/login");
        return;
      }

      let displayName = String(current.user_metadata?.full_name ?? current.user_metadata?.name ?? "");
      if (section === "profile") {
        const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", current.id).maybeSingle();
        if (profile?.display_name) displayName = profile.display_name;
      }
      if (!alive) return;
      setUser({ id: current.id, email: current.email, name: displayName });

      const source = sources[section];
      if (source) {
        let request = supabase.from(source.table).select(source.columns);
        if (source.ownerColumn) request = request.eq(source.ownerColumn, current.id);
        if (source.activeOnly) request = request.eq("is_active", true);
        const { data, error: queryError } = await request.limit(50);
        if (!alive) return;
        if (queryError) setError("This information is not available right now. Your account has not been changed.");
        else setRows((data ?? []) as unknown as Row[]);
      } else {
        setRows([]);
      }
      if (alive) setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [section, router, supabase]);

  async function signOut() {
    setSigningOut(true);
    if (!supabase) {
      router.replace("/customer/login");
      return;
    }
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError("Sign out could not be completed. Please try again.");
      setSigningOut(false);
      return;
    }
    router.replace("/customer/login");
    router.refresh();
  }

  const greeting = user?.name?.trim().split(/\s+/)[0] || "there";
  const sectionLabel = titles[section];

  return <div className="customer-shell">
    <a className="customer-skip" href="#customer-main">Skip to content</a>
    <aside className={mobileOpen ? "customer-sidebar customer-sidebar-open" : "customer-sidebar"}>
      <Link href="/customer" className="customer-brand"><img className="customer-brand-mark" src="/logo.svg" alt=""/><span className="customer-brand-copy"><b>CryptoInvest</b><small>MORE THAN INVESTING. BUILT ON TRUST.</small></span></Link>
      <div className="customer-account-chip">
        <span className="customer-avatar">{(greeting[0] || "C").toUpperCase()}</span>
        <span><strong>Customer account</strong><small>Personal workspace</small></span>
      </div>
      <nav className="customer-nav" aria-label="Customer navigation">
        <p>MY ACCOUNT</p>
        {nav.map((item) => (
          <Link key={item.id} href={item.id === "home" ? "/customer" : "/customer/" + item.id}
            onClick={() => setMobileOpen(false)}
            className={section === item.id ? "customer-nav-item customer-nav-active" : "customer-nav-item"}>
            <span>{item.icon}</span>{item.label}
          </Link>
        ))}
      </nav>
      <div className="customer-sidebar-bottom">
        <div className="customer-private-note"><strong>Private account</strong><p>You can only access information permitted for your own account.</p></div>
        <button className="customer-signout" onClick={signOut} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"}</button>
      </div>
    </aside>

    <div className="customer-main">
      <header className="customer-topbar">
        <button className="customer-menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">☰</button>
        <span>Customer portal <span className="customer-crumb">/ {sectionLabel}</span></span>
        <span className="customer-user-email">{user?.email ?? "Secure account"}</span>
      </header>

      <main className="customer-content" id="customer-main">
        <div className="customer-heading">
          <div>
            <p className="customer-eyebrow">CUSTOMER WORKSPACE</p>
            <h1>{section === "home" ? "Welcome, " + greeting : sectionLabel}</h1>
            <p className="customer-muted">{section === "home" ? "Your personal account, investment information and updates." : "Information shown here is limited to your authenticated customer account."}</p>
          </div>
          <span className="customer-readonly">Personal account</span>
        </div>

        {error && <div className="customer-alert" role="alert">{error}</div>}

        {section === "home" && <>
          <div className="customer-safety-banner"><strong>Financial activity is currently limited</strong><p>Live deposits, withdrawals and financial processing are disabled while platform verification is completed.</p></div>
          <div className="customer-metrics">
            <article><small>My investments</small><strong>{loading ? "—" : rows.length}</strong><span>Personal investment records</span></article>
            <article><small>Deposit requests</small><strong>—</strong><span>Personal account records</span></article>
            <article><small>Withdrawal requests</small><strong>—</strong><span>Personal account records</span></article>
            <article><small>Notifications</small><strong>—</strong><span>Updates for your account</span></article>
          </div>
          <section className="customer-panel"><h2>My investment activity</h2>{loading ? <p className="customer-muted">Loading your account…</p> : <RecordList rows={rows} empty="Your verified investment activity will appear here." />}</section>
        </>}

        {section === "profile" && <section className="customer-panel">
          <h2>Account information</h2>
          <div className="customer-detail-grid">
            <div><small>Full name</small><strong>{user?.name || "Not provided"}</strong></div>
            <div><small>Email address</small><strong>{user?.email || "—"}</strong></div>
            <div><small>Customer ID</small><strong>{user?.id || "—"}</strong></div>
            <div><small>Account access</small><strong>Authenticated customer</strong></div>
          </div>
          <p className="customer-muted">Contact support if your account details need to be corrected. Changes to identity records are not made from this preview.</p>
        </section>}

        {section === "plans" && <section className="customer-panel"><h2>Published investment plans</h2>{loading ? <p>Loading…</p> : <RecordList rows={rows} empty="No published plans are available to this account yet." />}</section>}
        {section === "investments" && <section className="customer-panel"><h2>My investment records</h2>{loading ? <p>Loading…</p> : <RecordList rows={rows} empty="Your investment records will appear here when available." />}</section>}
        {section === "deposit" && <section className="customer-panel">
          <h2>Deposit request</h2>
          <div className="customer-safety-banner"><strong>Request submission is not enabled yet</strong><p>This screen is prepared for the deposit workflow. No payment details are collected and no deposit is recorded until the request API and its database contract are verified.</p></div>
          <p className="customer-muted">You can review your existing requests below.</p>
          {loading ? <p>Loading…</p> : <RecordList rows={rows} empty="You have no deposit requests to display." />}
        </section>}
        {section === "withdrawals" && <section className="customer-panel">
          <h2>My withdrawal requests</h2>
          <div className="customer-safety-banner"><strong>Withdrawal submission is not enabled</strong><p>Live withdrawals and payout processing remain disabled. This page only displays records authorized for your account.</p></div>
          {loading ? <p>Loading…</p> : <RecordList rows={rows} empty="You have no withdrawal requests to display." />}
        </section>}
        {section === "performance" && <section className="customer-panel">
          <h2>Recorded profit and loss</h2>
          <div className="customer-safety-banner"><strong>Verified figures only</strong><p>Only recorded investment results are displayed. No estimated or guaranteed returns are shown.</p></div>
          {loading ? <p>Loading…</p> : <RecordList rows={rows} empty="No verified performance records are available yet." valueKeys={["realized_profit_loss", "status"]} />}
        </section>}
        {section === "transactions" && <section className="customer-panel"><h2>My transaction history</h2>{loading ? <p>Loading…</p> : <RecordList rows={rows} empty="No personal ledger entries are available yet." />}</section>}
        {section === "notifications" && <section className="customer-panel"><h2>Account notifications</h2>{loading ? <p>Loading…</p> : <RecordList rows={rows} empty="You have no notifications yet." />}</section>}
        {section === "documents" && <section className="customer-panel"><h2>My documents</h2><div className="customer-empty"><strong>Documents are not connected yet</strong><p>Only documents explicitly assigned to your account will be shown once the secure document service is connected.</p></div></section>}
        {section === "support" && <section className="customer-panel"><h2>Contact customer support</h2><p className="customer-muted">Support ticket submission will be enabled after the customer ticket API and required fields are verified.</p>{loading ? <p>Loading…</p> : <RecordList rows={rows} empty="You have no support conversations to display." />}</section>}
        {section === "security" && <section className="customer-panel">
          <h2>Account security</h2>
          <div className="customer-detail-grid">
            <div><small>Signed-in email</small><strong>{user?.email || "—"}</strong></div>
            <div><small>Session</small><strong>Authenticated</strong></div>
            <div><small>Administrative access</small><strong>Not available in customer portal</strong></div>
          </div>
          <p className="customer-muted">Password reset and multi-factor settings will be connected to the approved customer authentication flow. Never share your password or verification codes.</p>
          <Link className="customer-inline-link" href="/customer/login">Return to sign-in</Link>
        </section>}

        <footer className="customer-footer">CryptoInvest · Customer portal · Your account data is protected by database access policies.</footer>
      </main>
    </div>
  </div>;
}
