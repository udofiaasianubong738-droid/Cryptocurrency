"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

type Section = "home" | "profile" | "wallet" | "plans" | "investments" | "deposit" | "withdrawals" | "performance" | "transactions" | "notifications" | "documents" | "support" | "security";
type Row = Record<string, unknown>;

const nav: { id: Section; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "investments", label: "Investment", icon: "↗" },
  { id: "wallet", label: "Wallet", icon: "▣" },
  { id: "profile", label: "Profile", icon: "♙" },
  { id: "plans", label: "Investment plans", icon: "◇" },
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
  investments: "Investment",
  wallet: "Wallet",
  profile: "My profile",
  plans: "Investment plans",
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
  investments: { table: "investments", columns: "id, plan_id, asset_code, principal_amount, currency_code, status, approved_return, realized_profit_loss, opened_at, closed_at, created_at", ownerColumn: "customer_id" },
  wallet: { table: "ledger_entries", columns: "id, entry_type, amount, currency_code, created_at", ownerColumn: "customer_id" },
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
  const [metrics, setMetrics] = useState({ investments: 0, deposits: 0, withdrawals: 0, unread: 0 });
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportBusy, setSupportBusy] = useState(false);
  const [supportNotice, setSupportNotice] = useState("");
  const [customerDocuments, setCustomerDocuments] = useState<{ name: string; signedUrl: string; createdAt?: string }[]>([]);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [documentNotice, setDocumentNotice] = useState("");
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

      // The CEO has a separate admin workspace. Check the signed-in user's own
      // CEO record before any customer reads, because CEO RLS policies can see
      // all customer rows.
      const { data: ceoRecord, error: ceoCheckError } = await supabase
        .from("ceo_admins")
        .select("user_id, enabled")
        .eq("user_id", current.id)
        .maybeSingle();
      if (!alive) return;
      if (ceoCheckError) {
        setError("Customer access could not be verified. Please try again.");
        setLoading(false);
        return;
      }
      if (ceoRecord) {
        router.replace("/admin");
        return;
      }

      let displayName = String(current.user_metadata?.full_name ?? current.user_metadata?.name ?? "");
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", current.id).maybeSingle();
      if (profile?.display_name) displayName = profile.display_name;
      if (!alive) return;
      setUser({ id: current.id, email: current.email, name: displayName });

      if (section === "home") {
        const [investmentCount, depositCount, withdrawalCount, unreadCount] = await Promise.all([
          supabase.from("investments").select("id", { count: "exact", head: true }).eq("customer_id", current.id),
          supabase.from("deposit_requests").select("id", { count: "exact", head: true }).eq("customer_id", current.id),
          supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).eq("customer_id", current.id),
          supabase.from("user_notifications").select("id", { count: "exact", head: true }).eq("user_id", current.id).is("read_at", null),
        ]);
        if (!alive) return;
        const metricError = investmentCount.error || depositCount.error || withdrawalCount.error || unreadCount.error;
        if (metricError) setError("Some account summary information is temporarily unavailable.");
        else setMetrics({
          investments: investmentCount.count ?? 0,
          deposits: depositCount.count ?? 0,
          withdrawals: withdrawalCount.count ?? 0,
          unread: unreadCount.count ?? 0,
        });
      }

      if (section === "documents") {
        const { data: files, error: filesError } = await supabase.storage
          .from("customer-documents")
          .list(current.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
        if (!alive) return;
        if (filesError) {
          setError("Your private documents could not be loaded. Please try again later.");
        } else {
          const signedFiles = await Promise.all((files ?? []).filter((file) => file.name && !file.name.startsWith(".")).map(async (file) => {
            const { data: signed, error: signedError } = await supabase.storage
              .from("customer-documents")
              .createSignedUrl(`${current.id}/${file.name}`, 300);
            return signedError || !signed?.signedUrl ? null : { name: file.name, signedUrl: signed.signedUrl, createdAt: file.created_at };
          }));
          if (!alive) return;
          setCustomerDocuments(signedFiles.filter((file): file is { name: string; signedUrl: string; createdAt?: string } => Boolean(file)));
        }
      }

      if (section === "plans") {
        // A plan is visible here only when the CEO has attached it to one of this customer's investment records.
        const { data: assignments, error: assignmentError } = await supabase
          .from("investments")
          .select("plan_id")
          .eq("customer_id", current.id)
          .not("plan_id", "is", null);
        if (!alive) return;
        if (assignmentError) {
          setError("Your assigned plan information is not available right now.");
        } else {
          const planIds = [...new Set((assignments ?? []).map((item) => item.plan_id).filter((id): id is string => Boolean(id)))];
          if (planIds.length) {
            const { data, error: planError } = await supabase
              .from("investment_plans")
              .select("id, name, asset_code, network, description, risk_level, minimum_amount, maximum_amount, currency_code, risk_disclosure")
              .eq("is_active", true)
              .in("id", planIds)
              .order("created_at", { ascending: false });
            if (!alive) return;
            if (planError) setError("Your assigned plan information is not available right now.");
            else setRows((data ?? []) as unknown as Row[]);
          }
        }
      } else {
        const source = sources[section];
        if (source) {
          let request = supabase.from(source.table).select(source.columns);
          if (source.ownerColumn) request = request.eq(source.ownerColumn, current.id);
          if (source.activeOnly) request = request.eq("is_active", true);
          const { data, error: queryError } = await request.order("created_at", { ascending: false }).limit(50);
          if (!alive) return;
          if (queryError) setError("This information is not available right now. Your account has not been changed.");
          else setRows((data ?? []) as unknown as Row[]);
        } else {
          setRows([]);
        }
      }
      if (alive) setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [section, router, supabase]);

  async function uploadCustomerDocument(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !supabase || !user) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type) || file.size > 10 * 1024 * 1024) {
      setDocumentNotice("Choose a PDF, JPG, PNG or WebP file no larger than 10 MB.");
      return;
    }
    setDocumentBusy(true);
    setDocumentNotice("");
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100) || "document";
    const objectPath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("customer-documents")
      .upload(objectPath, file, { contentType: file.type, upsert: false });
    if (uploadError) {
      setDocumentNotice("The document could not be uploaded. Check the file and try again.");
      setDocumentBusy(false);
      return;
    }
    const { data: files, error: listError } = await supabase.storage
      .from("customer-documents")
      .list(user.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    if (listError) {
      setDocumentNotice("The upload was received, but the document list could not be refreshed.");
    } else {
      const signedFiles = await Promise.all((files ?? []).filter((item) => item.name && !item.name.startsWith(".")).map(async (item) => {
        const { data: signed } = await supabase.storage.from("customer-documents").createSignedUrl(`${user.id}/${item.name}`, 300);
        return signed?.signedUrl ? { name: item.name, signedUrl: signed.signedUrl, createdAt: item.created_at } : null;
      }));
      setCustomerDocuments(signedFiles.filter((item): item is { name: string; signedUrl: string; createdAt?: string } => Boolean(item)));
      setDocumentNotice("Your document has been uploaded to your private account storage.");
    }
    setDocumentBusy(false);
  }

  async function markNotificationRead(notificationId: string) {
    if (!supabase || !user) return;
    const { error: updateError } = await supabase
      .from("user_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .is("read_at", null);
    if (updateError) {
      setError("That notification could not be updated. Please try again.");
      return;
    }
    setRows((current) => current.map((row) => row.id === notificationId ? { ...row, read_at: new Date().toISOString() } : row));
    setMetrics((current) => ({ ...current, unread: Math.max(0, current.unread - 1) }));
  }

  async function submitSupportTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) return;
    const subject = supportSubject.trim();
    const message = supportMessage.trim();
    if (subject.length < 3 || message.length < 10) {
      setSupportNotice("Please enter a subject and a message with at least 10 characters.");
      return;
    }
    setSupportBusy(true);
    setSupportNotice("");
    const { data, error: insertError } = await supabase
      .from("support_tickets")
      .insert({ user_id: user.id, subject, message, status: "open" })
      .select("id, subject, message, status, created_at, updated_at, closed_at")
      .single();
    setSupportBusy(false);
    if (insertError) {
      setSupportNotice("Your support message could not be submitted. Please try again later.");
      return;
    }
    setRows((current) => [data as unknown as Row, ...current]);
    setSupportSubject("");
    setSupportMessage("");
    setSupportNotice("Your support message has been submitted.");
  }

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
    {section === "home" && <><button className={mobileOpen ? "customer-drawer-backdrop is-open" : "customer-drawer-backdrop"} aria-label="Close navigation" onClick={() => setMobileOpen(false)} /><aside className={mobileOpen ? "customer-sidebar customer-sidebar-open" : "customer-sidebar"}>
      <Link href="/customer" className="customer-brand"><img className="customer-brand-mark" src="/logo.svg" alt=""/><span className="customer-brand-copy"><b>CryptoInvest</b><small>MORE THAN INVESTING. BUILT ON TRUST.</small></span></Link>
      <div className="customer-account-chip">
        <span className="customer-avatar">{(greeting[0] || "C").toUpperCase()}</span>
        <span><strong>Customer account</strong><small>Personal workspace</small></span>
      </div>
      <nav className="customer-nav" aria-label="More customer pages">
        <p>MORE SERVICES</p>
        {nav.filter((item) => !["home", "investments", "wallet", "profile"].includes(item.id)).map((item) => (
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
    </aside></>}

    <div className={section === "home" ? "customer-main customer-main-home" : "customer-main"}>
      <header className="customer-topbar">
        {section === "home" ? <button className="customer-menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open more services" aria-expanded={mobileOpen}>☰</button> : <Link className="customer-back-home" href="/customer">← <span>Home</span></Link>}
        <span className="customer-topbar-title">CryptoInvest <span className="customer-crumb">/ {sectionLabel}</span></span>
        <span className="customer-user-email">{user?.email ?? "Secure account"}</span>
      </header>

      <main className="customer-content" id="customer-main">
        <div className="customer-heading">
          <div>
            <p className="customer-eyebrow">{section === "home" ? "YOUR PRIVATE CUSTOMER SPACE" : "CUSTOMER ACCOUNT"}</p>
            <h1>{section === "home" ? "Welcome, " + greeting : sectionLabel}</h1>
            <p className="customer-muted">{section === "home" ? "Your investments, account records and important updates — all in one place." : "Information shown here is limited to your authenticated customer account."}</p>
          </div>
          <span className="customer-readonly">Secure customer view</span>
        </div>

        {error && <div className="customer-alert" role="alert">{error}</div>}

        {section === "home" && <>
          <section className="customer-home-hero"><div className="customer-home-copy"><span>MORE THAN INVESTING · BUILT ON TRUST</span><h2>Your financial picture,<br/><em>made clearer.</em></h2><p>Follow the investment information and account updates shared with you by CryptoInvest.</p><Link href="/customer/investments">Explore investment <b>→</b></Link></div><div className="customer-home-art" aria-hidden="true"><span className="customer-orbit orbit-one"/><span className="customer-orbit orbit-two"/><span className="customer-home-emblem">◈</span></div></section>
          <div className="customer-safety-banner"><strong>Financial activity is currently limited</strong><p>Live deposits, withdrawals and financial processing are disabled while platform verification is completed.</p></div>
          <div className="customer-metrics">
            <article><small>My investments</small><strong>{loading ? "—" : metrics.investments}</strong><span>Personal investment records</span></article>
            <article><small>Deposit requests</small><strong>{loading ? "—" : metrics.deposits}</strong><span>Request history only</span></article>
            <article><small>Withdrawal requests</small><strong>{loading ? "—" : metrics.withdrawals}</strong><span>Request history only</span></article>
            <article><small>Unread updates</small><strong>{loading ? "—" : metrics.unread}</strong><span>Notifications for your account</span></article>
          </div>
          <section className="customer-panel"><h2>My investment activity</h2>{loading ? <p className="customer-muted">Loading your account…</p> : <RecordList rows={rows} empty="Your verified investment activity will appear here." />}</section>
        </>}

        {section === "wallet" && <><section className="customer-wallet-hero"><div><small>WALLET OVERVIEW</small><strong>— — —</strong><p>Verified account balance will appear when available.</p></div><span>◈</span></section><section className="customer-panel"><h2>Recent wallet records</h2>{loading ? <p className="customer-muted">Loading your records…</p> : <RecordList rows={rows} empty="Your verified wallet records will appear here." valueKeys={["amount", "currency_code", "entry_type"]} />}</section><div className="customer-wallet-links"><Link href="/customer/transactions">View transaction history <b>→</b></Link><Link href="/customer/notifications">Account updates <b>→</b></Link></div></>}

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
        {section === "investments" && <><section className="customer-panel"><h2>My investment records</h2><p className="customer-muted">Review investment information and records shared with your account.</p>{loading ? <p>Loading…</p> : <RecordList rows={rows} empty="Your investment records will appear here when available." />}</section><div className="customer-wallet-links"><Link href="/customer/plans">View published investment plans <b>→</b></Link><Link href="/customer/performance">View profit and reports <b>→</b></Link></div></>}
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
        {section === "notifications" && <section className="customer-panel"><h2>Account notifications</h2>{loading ? <p>Loading…</p> : !rows.length ? <div className="customer-empty"><strong>Nothing to show yet</strong><p>You have no notifications yet.</p></div> : <div className="customer-record-list">{rows.map((row) => <article className="customer-record" key={String(row.id)}><div><strong>{displayValue(row, ["title"])}</strong><small>{displayValue(row, ["body", "created_at"])}</small><small>{displayValue(row, ["category"])} · {row.read_at ? "Read" : "Unread"}</small></div><div className="customer-record-side">{!row.read_at && <button className="customer-inline-action" type="button" onClick={() => markNotificationRead(String(row.id))}>Mark read</button>}</div></article>)}</div>}</section>}
        {section === "documents" && <section className="customer-panel"><h2>My private documents</h2><p className="customer-muted">Files are private by default. You can access only documents stored under your own customer account. CEO document review requires an authenticated AAL2 session.</p>{documentNotice && <div className={documentNotice.startsWith("Your document has") ? "customer-success" : "customer-alert"} role="status">{documentNotice}</div>}<form className="customer-support-form" onSubmit={(event) => event.preventDefault()}><label>Upload a document<input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={uploadCustomerDocument} disabled={documentBusy}/></label><small className="customer-muted">PDF, JPG, PNG or WebP · maximum 10 MB</small><p className="customer-muted">{documentBusy ? "Uploading your document securely…" : "Selecting a supported file starts a private upload."}</p></form><div className="customer-record-list">{loading ? <p className="customer-muted">Loading your private documents…</p> : customerDocuments.length ? customerDocuments.map((file) => <article className="customer-record" key={file.name}><div><strong>{file.name.replace(/^.*?-/, "")}</strong><small>{file.createdAt ? new Date(file.createdAt).toLocaleString() : "Private customer document"}</small></div><a className="customer-inline-action" href={file.signedUrl} target="_blank" rel="noreferrer">Open securely</a></article>) : <div className="customer-empty"><strong>No documents uploaded</strong><p>Documents uploaded here remain private to your account.</p></div>}</div></section>}
        {section === "support" && <><section className="customer-panel"><h2>Contact customer support</h2><p className="customer-muted">Send a message to the CryptoInvest support team. Your message is linked to your signed-in account.</p>{supportNotice && <div className={supportNotice.startsWith("Your support message has") ? "customer-success" : "customer-alert"} role="status">{supportNotice}</div>}<form className="customer-support-form" onSubmit={submitSupportTicket}><label>Subject<input value={supportSubject} onChange={(event) => setSupportSubject(event.target.value)} minLength={3} maxLength={180} required /></label><label>How can we help?<textarea value={supportMessage} onChange={(event) => setSupportMessage(event.target.value)} minLength={10} maxLength={4000} rows={5} required /></label><button className="customer-primary" type="submit" disabled={supportBusy}>{supportBusy ? "Sending…" : "Send support message"}</button></form></section><section className="customer-panel"><h2>My support history</h2>{loading ? <p>Loading…</p> : <RecordList rows={rows} empty="You have no support conversations to display." valueKeys={["status"]} />}</section></>}
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
      {["home", "investments", "wallet", "profile"].includes(section) && <nav className="customer-primary-nav" aria-label="Primary navigation">{[{id:"home",label:"Home",icon:"⌂",href:"/customer"},{id:"investments",label:"Investment",icon:"↗",href:"/customer/investments"},{id:"wallet",label:"Wallet",icon:"▣",href:"/customer/wallet"},{id:"profile",label:"Profile",icon:"♙",href:"/customer/profile"}].map(item => <Link key={item.id} href={item.href} aria-current={section===item.id?"page":undefined} className={section===item.id?"is-active":""}><span>{item.icon}</span>{item.label}</Link>)}</nav>}
    </div>
  </div>;
}
