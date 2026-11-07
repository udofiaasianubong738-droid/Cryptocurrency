"use client";

import { useState } from "react";

const sections = [
  ["overview", "Overview"],
  ["profile", "My profile"],
  ["plans", "Published plans"],
  ["investments", "My investments"],
  ["deposits", "Deposit requests"],
  ["withdrawals", "Withdrawal requests"],
  ["performance", "Performance"],
  ["transactions", "Transactions"],
  ["notifications", "Notifications"],
  ["documents", "Documents"],
  ["support", "Support"],
  ["security", "Security"],
] as const;

type Section = (typeof sections)[number][0];

const descriptions: Record<Section, string> = {
  overview: "A sample summary of the customer workspace.",
  profile: "A preview of the personal profile area.",
  plans: "Only plans published by the platform would appear here.",
  investments: "A customer-only view of assigned records.",
  deposits: "Request submission is disabled in this preview.",
  withdrawals: "Payout and withdrawal actions are disabled.",
  performance: "Only verified records would appear in a connected account.",
  transactions: "A read-only example of account activity.",
  notifications: "Updates intended for this customer account.",
  documents: "Documents would be scoped to the signed-in customer.",
  support: "A preview of the customer support area.",
  security: "Account security settings will be connected after authentication review.",
};

export default function CustomerPreviewPage() {
  const [active, setActive] = useState<Section>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="customer-shell">
      <aside className={mobileOpen ? "customer-sidebar customer-sidebar-open" : "customer-sidebar"}>
        <a href="#preview-home" className="customer-brand">
          <span className="customer-brand-mark">C</span><span>CryptoInvest</span>
        </a>
        <div className="customer-account-chip">
          <span className="customer-avatar">D</span>
          <span><strong>Sample customer</strong><small>Preview workspace</small></span>
        </div>
        <nav className="customer-nav" aria-label="Preview navigation">
          <p>MY ACCOUNT</p>
          {sections.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => { setActive(id); setMobileOpen(false); }}
              className={active === id ? "customer-nav-item customer-nav-active" : "customer-nav-item"}
              style={{ width: "100%", border: 0, textAlign: "left", cursor: "pointer", background: active === id ? undefined : "transparent" }}
            >
              <span aria-hidden="true">{id === "overview" ? "⌂" : "◇"}</span>{label}
            </button>
          ))}
        </nav>
        <div className="customer-sidebar-bottom">
          <div className="customer-private-note">
            <strong>Demo data only</strong>
            <p>This preview does not connect to customer accounts or the database.</p>
          </div>
        </div>
      </aside>

      <div className="customer-main">
        <header className="customer-topbar">
          <button className="customer-menu-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">☰</button>
          <span>Customer portal <span className="customer-crumb">/ Preview</span></span>
          <span className="customer-user-email">DEMO MODE</span>
        </header>
        <main className="customer-content" id="preview-home">
          <div className="customer-safety-banner" role="note">
            <strong>DEMO PREVIEW — fictional sample content</strong>
            <p>No real customer records, authentication, database connection, deposits, withdrawals, or financial processing are used on this page.</p>
          </div>

          <div className="customer-heading">
            <div>
              <p className="customer-eyebrow">CUSTOMER WORKSPACE · PREVIEW</p>
              <h1>{sections.find(([id]) => id === active)?.[1]}</h1>
              <p className="customer-muted">{descriptions[active]}</p>
            </div>
            <span className="customer-readonly">Read-only demo</span>
          </div>

          {active === "overview" ? (
            <>
              <div className="customer-metrics">
                <article><small>Investment records</small><strong>02</strong><span>Fictional sample count</span></article>
                <article><small>Open requests</small><strong>01</strong><span>Sample only</span></article>
                <article><small>Notifications</small><strong>03</strong><span>Sample messages</span></article>
                <article><small>Account status</small><strong>Demo</strong><span>No live account connected</span></article>
              </div>
              <section className="customer-panel">
                <h2>Welcome to your customer portal</h2>
                <p className="customer-muted">Use the navigation on the left to explore each customer screen. This preview is intentionally isolated from the CEO administration area.</p>
              </section>
            </>
          ) : (
            <section className="customer-panel">
              <h2>{sections.find(([id]) => id === active)?.[1]}</h2>
              <div className="customer-empty">
                <strong>{active === "plans" ? "Sample published-plan view" : "Preview screen ready"}</strong>
                <p>{descriptions[active]} Real records will only be displayed after secure sign-in and verified customer-level database permissions are connected.</p>
              </div>
              {(active === "deposits" || active === "withdrawals") && (
                <div className="customer-safety-banner">
                  <strong>Actions unavailable</strong>
                  <p>This is a visual preview only. No request can be submitted and no funds can be moved.</p>
                </div>
              )}
            </section>
          )}
          <footer className="customer-footer">CryptoInvest · Customer portal preview · Demo content only</footer>
        </main>
      </div>
    </div>
  );
}
