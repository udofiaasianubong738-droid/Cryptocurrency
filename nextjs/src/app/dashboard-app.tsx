"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const screens = [
  ["overview", "Home Dashboard", "Your platform at a glance", "⌂", "Workspace"],
  ["customers", "Customers", "Customer accounts and access", "♙", "Workspace"],
  ["deposits", "Deposits", "Incoming deposit requests", "↓", "Operations"],
  ["withdrawals", "Withdrawals", "Withdrawal requests and checks", "↑", "Operations"],
  ["plans", "Investment Plans", "Plan terms and publication status", "◇", "Operations"],
  ["orders", "Orders", "Order lifecycle and provider status", "⇄", "Operations"],
  ["portfolio", "Portfolio", "Verified account and investment summaries", "▥", "Operations"],
  ["reports", "Reports", "Reports from verified records", "▤", "Insights"],
  ["ledger", "Ledger", "Accounting entries and balances", "≋", "Controls"],
  ["reconciliation", "Reconciliation", "Provider and ledger comparison", "⟳", "Controls"],
  ["audit", "Audit Logs", "Administrative events and audit history", "◷", "Controls"],
  ["integrations", "Integrations", "Backend and provider connectivity", "⌘", "Controls"],
  ["security", "Security", "Identity, access and safety gates", "⬡", "Controls"],
  ["settings", "Settings", "Workspace preferences and configuration", "⚙", "Controls"],
  ["system-status", "System Status", "Readiness and service checks", "✦", "Controls"],
] as const;

type ScreenId = typeof screens[number][0];
const descriptions: Record<string, string> = {
  customers: "Review customer access and profile information after authenticated, verified records are available.",
  deposits: "Incoming deposit requests will appear here when real provider evidence and transaction records are connected.",
  withdrawals: "Review requests only after balance checks, server-side approval rules and audit logging are verified.",
  plans: "Create and review plan definitions from the authoritative backend. No fabricated returns or performance claims are shown.",
  orders: "Order history and provider states will be populated from verified integrations.",
  portfolio: "Account balances and investment summaries must be sourced from the authoritative ledger.",
  reports: "Generate reports from verified platform data; this preview does not invent customer or financial figures.",
  ledger: "Accounting entries and balances must be read from the authoritative backend and reconciled before being treated as financial truth.",
  reconciliation: "Compare provider activity against internal ledger entries after integration and idempotency checks are complete.",
  audit: "Review administrative events, timestamps and actors after the verified audit source is connected.",
  integrations: "Connection health must be established from real server-side checks; no provider is currently claimed as verified here.",
  settings: "Workspace preferences can be configured here. Identity and financial safety controls remain protected.",
  "system-status": "A readiness view for authentication, database connectivity, build health and financial safety gates.",
};

function Brand() {
  return <span className="ci-brand"><span className="ci-brand-icon" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M8 35V27M18 35V20M28 35V15M38 35V8" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/><path d="M7 18 18 13 26 17 40 5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M32 5h8v8" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span><strong>CryptoInvest</strong><small>Invest · Grow · Prosper</small></span></span>;
}

function SafetyNotice() {
  return <section className="ci-safety"><span className="ci-safety-icon">✓</span><div><strong>Financial operations are currently disabled</strong><p>Live deposits, withdrawals, payouts and balance changes are paused until backend, ledger and security checks are verified.</p></div><span className="ci-locked">LOCKED</span></section>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="ci-empty"><span aria-hidden="true">◇</span><strong>{title}</strong><p>{detail}</p><small>No sample financial records are displayed.</small></div>;
}

function ChartPlaceholder() {
  return <div className="ci-chart-placeholder"><div className="ci-chart-legend"><span><i className="blue-dot"/> Deposits</span><span><i className="purple-dot"/> Withdrawals</span><span><i className="green-dot"/> Investments</span></div><div className="ci-chart-area"><div className="ci-chart-lines"><span/><span/><span/><span/></div><div className="ci-chart-message"><span>▥</span><strong>Platform performance</strong><small>Verified transaction history will appear here after reconciliation.</small></div></div><div className="ci-chart-labels"><span>Awaiting verified data</span><span>Live metrics unavailable</span></div></div>;
}

function Overview({ basePath }: { basePath: string }) {
  return <>
    <section className="ci-welcome-banner"><div className="ci-banner-copy"><span className="ci-banner-eyebrow">WELCOME TO YOUR ADMIN WORKSPACE</span><h1>Welcome back, CEO Admin</h1><p>Here’s what’s happening with your CryptoInvest platform today.</p><small>⌑ &nbsp;CEO workspace · verified data only · financial operations disabled</small></div><div className="ci-banner-art" aria-hidden="true"><div className="ci-globe">₿</div><span className="ci-orbit ci-orbit-one"/><span className="ci-orbit ci-orbit-two"/><span className="ci-art-bars"><i/><i/><i/><i/><i/></span></div></section>
    <div className="ci-metrics">
      {[["Total Customers","—","Awaiting verified records","♙","blue"],["Total Deposits","—","No verified totals available","↓","green"],["Total Withdrawals","—","No verified totals available","↑","purple"],["Total Investments","—","Awaiting ledger verification","▥","gold"]].map(([label,value,note,icon,tone])=><article className="ci-metric" key={label}><div className="ci-metric-top"><span>{label}</span><span className={`ci-metric-icon ${tone}`}>{icon}</span></div><strong>{value}</strong><small>{note}</small><div className={`ci-sparkline ${tone}`}><i/><i/><i/><i/><i/><i/></div></article>)}
    </div>
    <div className="ci-main-grid">
      <section className="ci-card ci-performance"><div className="ci-card-heading"><div><span className="ci-kicker">PLATFORM ANALYTICS</span><h2>Platform Performance</h2></div><span className="ci-period">Verified period data only</span></div><ChartPlaceholder/></section>
      <section className="ci-card ci-activity"><div className="ci-card-heading"><div><span className="ci-kicker">PLATFORM FEED</span><h2>Recent Activity</h2></div><span className="ci-unavailable">Awaiting backend data</span></div><EmptyState title="Activity will appear here" detail="Verified deposit, withdrawal and account events will appear after the audit source is connected."/></section>
    </div>
    <div className="ci-bottom-grid">
      <section className="ci-card ci-plans"><div className="ci-card-heading"><div><span className="ci-kicker">PLAN MANAGEMENT</span><h2>Investment Plans</h2></div><Link href={`${basePath}/plans`} className="ci-view-link">View plans →</Link></div><EmptyState title="No verified plans to display" detail="Connect and verify the plan records before publishing plan terms or returns."/></section>
      <section className="ci-card ci-security"><div className="ci-card-heading"><div><span className="ci-kicker">ACCESS CONTROL</span><h2>Security Overview</h2></div><Link href={`${basePath}/security`} className="ci-view-link">View details →</Link></div><div className="ci-security-body"><div className="ci-shield">✓</div><div><strong>Production safety gate is active</strong><p><span>✓</span> CEO-only access required</p><p><span>✓</span> MFA verification required</p><p><span>✓</span> Financial operations disabled</p></div></div></section>
      <section className="ci-card ci-controls"><div className="ci-card-heading"><div><span className="ci-kicker">SYSTEM CONTROL</span><h2>System Controls</h2></div></div><div className="ci-control-box"><span className="ci-control-power">⏻</span><div><strong>Financial Operations</strong><b>Currently Disabled</b><small>Live money movement is paused for safety.</small></div></div><Link href={`${basePath}/system-status`} className="ci-primary-link">View system status</Link></section>
    </div>
  </>;
}

function SectionContent({ id, label }: { id: string; label: string }) {
  if (id === "security") return <div className="ci-section-grid"><section className="ci-card"><span className="ci-kicker">ACCESS CONTROL</span><h2>Identity and permissions</h2><div className="ci-check-list">{["CEO-only administration","Verified authenticator MFA","Customer and admin role isolation","Session expiry and audit events"].map(x=><p key={x}><span>✓</span>{x}<b>Verify</b></p>)}</div></section><section className="ci-card"><span className="ci-kicker">PRODUCTION GATE</span><h2>Financial controls</h2><div className="ci-gate"><span>✓</span><div><strong>Financial operations disabled</strong><p>Do not enable deposits, withdrawals, payouts or balance changes until independent verification is complete.</p></div></div></section></div>;
  if (id === "settings") return <section className="ci-card"><span className="ci-kicker">WORKSPACE</span><h2>Settings</h2><p className="ci-section-copy">Branding, installation and navigation are configured for this workspace. Security-critical settings remain server-controlled.</p><div className="ci-settings-list"><div><span>Application name</span><strong>CryptoInvest</strong></div><div><span>Installation support</span><strong>Web app manifest and app icon</strong></div><div><span>Financial operations</span><strong className="ci-red-text">Disabled</strong></div></div></section>;
  if (id === "system-status") return <section className="ci-card"><span className="ci-kicker">READINESS</span><h2>System Status</h2><p className="ci-section-copy">This screen does not claim service health until it can read real health checks.</p><div className="ci-check-list">{["Cloudflare Worker deployment","Supabase connectivity","CEO login and MFA","Audit trail and reconciliation","Financial operations safety gate"].map(x=><p key={x}><span>•</span>{x}<b>Needs verification</b></p>)}</div></section>;
  if (id === "integrations") return <section className="ci-card"><span className="ci-kicker">CONNECTIONS</span><h2>Integrations</h2><p className="ci-section-copy">Connected providers must be verified from server-side status checks before they are shown as healthy.</p><EmptyState title="No provider health confirmed" detail="Supabase and external provider connection statuses are not fabricated."/></section>;
  return <section className="ci-card ci-secondary-content"><div className="ci-secondary-symbol">{screens.find(s => s[0] === id)?.[3] ?? "◇"}</div><span className="ci-kicker">{screens.find(s => s[0] === id)?.[4].toUpperCase() ?? "WORKSPACE"}</span><h2>{label}</h2><p className="ci-section-copy">{descriptions[id] || "This screen is ready to display verified platform information when its authorized backend source is connected."}</p><EmptyState title={id === "plans" ? "No verified plans available" : "Ready for verified data"} detail={descriptions[id] || "Connect this screen to its authorized data source before showing records."}/><div className="ci-readonly-note">▣ &nbsp; Read-only preview · no live financial actions</div></section>;
}

export default function DashboardApp({ activeSection = "overview", basePath = "/admin", previewMode = false }: { activeSection?: string; basePath?: string; previewMode?: boolean }) {
  const current = screens.find(s => s[0] === activeSection) || screens[0];
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const filtered = useMemo(() => screens.filter(s => s[1].toLowerCase().includes(query.toLowerCase())), [query]);
  const href = (id: ScreenId) => id === "overview" ? basePath : `${basePath}/${id}`;
  return <div className="ci-app-shell">
    <a className="ci-skip-link" href="#ci-main">Skip to main content</a>
    <aside className="ci-sidebar" aria-label="Admin navigation">
      <Link href={basePath} className="ci-sidebar-brand" aria-label="CryptoInvest home dashboard"><Brand/></Link>
      <nav className="ci-side-nav" aria-label="Primary navigation">
        {screens.map(s => <Link key={s[0]} href={href(s[0])} className={s[0] === current[0] ? "ci-nav-item active" : "ci-nav-item"} aria-current={s[0] === current[0] ? "page" : undefined}><span>{s[3]}</span>{s[1]}</Link>)}
      </nav>
      <div className="ci-sidebar-status"><span className="ci-status-shield">✓</span><div><strong>Safety gate active</strong><small>Financial operations disabled</small></div><Link href={`${basePath}/security`} aria-label="Review security">↗</Link></div>
      <div className="ci-sidebar-version">CryptoInvest · Admin Workspace</div>
    </aside>
    <main id="ci-main" className="ci-main with-sidebar">
      <header className="ci-topbar">
        <div className="ci-topbar-left">{current[0] === "overview" ? <span className="ci-home-crumb">Home Dashboard</span> : <Link href={basePath} className="ci-back-home">← Home Dashboard</Link>}</div>
        <div className="ci-topbar-actions">
          <label className="ci-search"><span aria-hidden="true">⌕</span><input value={query} onChange={e => setQuery(e.target.value)} aria-label="Search admin screens" placeholder="Search customers, transactions…"/><kbd>/</kbd></label>
          <details className="ci-screen-menu"><summary aria-label="Open admin navigation">☷ <span>Navigate</span></summary><div className="ci-screen-menu-panel"><strong>Admin screens</strong>{filtered.map(s=><Link href={href(s[0])} key={s[0]}>{s[3]} &nbsp;{s[1]}{s[0] === current[0] && <small>Current</small>}</Link>)}{filtered.length === 0 && <p>No screens match “{query}”.</p>}</div></details>
          <div className="ci-user"><span className="ci-user-avatar">CI</span><span><strong>CEO workspace</strong><small>{previewMode ? "Read-only design preview" : "CEO access · AAL2 required"}</small></span></div>
          <button className="ci-mobile-nav-button" type="button" onClick={() => setMobileOpen(v => !v)} aria-expanded={mobileOpen}>{mobileOpen ? "Close" : "Menu"}</button>
        </div>
      </header>
      {mobileOpen && <nav className="ci-mobile-nav" aria-label="Admin screens">{screens.map(s=><Link key={s[0]} href={href(s[0])} onClick={() => setMobileOpen(false)} aria-current={s[0] === current[0] ? "page" : undefined}>{s[3]} {s[1]}</Link>)}</nav>}
      <div className="ci-page-content">
        {current[0] !== "overview" && <div className="ci-secondary-heading"><div><span className="ci-kicker">{current[4].toUpperCase()}</span><h1>{current[1]}</h1><p>{current[2]}</p></div><Link href={basePath} className="ci-home-button">⌂ Home dashboard</Link></div>}
        <SafetyNotice/>
        {current[0] === "overview" ? <Overview basePath={basePath}/> : <SectionContent id={current[0]} label={current[1]}/>}
        <footer className="ci-footer"><span>© {new Date().getFullYear()} CryptoInvest</span><span>{previewMode ? "Read-only preview · live records not connected" : "CEO access required · financial operations disabled"}</span></footer>
      </div>
    </main>
  </div>;
}
