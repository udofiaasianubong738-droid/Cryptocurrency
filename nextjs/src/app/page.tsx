const summaryCards = [
  { label: "Total portfolio", value: "—", note: "Awaiting verified backend" },
  { label: "Active plans", value: "—", note: "No live data connected" },
  { label: "Pending requests", value: "—", note: "Unavailable in preview" },
];

const setupChecks = [
  "Confirm the authoritative Supabase project",
  "Implement and verify server-side authentication",
  "Enforce CEO-only admin access and MFA",
  "Review ledger, audit trail and reconciliation",
];

export default function HomePage() {
  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Main navigation">
        <a className="brand" href="/" aria-label="CryptoInvest home">
          <span className="brand-mark">C</span>
          <span>Crypto<span className="brand-light">Invest</span></span>
        </a>
        <div className="nav-caption">WORKSPACE</div>
        <a className="nav-link active" href="#overview"><span>◫</span> Overview</a>
        <a className="nav-link" href="#plans"><span>◈</span> Investment plans</a>
        <a className="nav-link" href="#activity"><span>↗</span> Activity</a>
        <div className="sidebar-bottom">
          <div className="support-card">
            <div className="support-icon">i</div>
            <strong>Safety first</strong>
            <p>This preview does not process deposits, withdrawals or trades.</p>
          </div>
          <div className="profile-row">
            <div className="avatar">CI</div>
            <div><strong>CryptoInvest</strong><small>Preview environment</small></div>
          </div>
        </div>
      </aside>

      <section className="main-panel" id="overview">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark">C</span> CryptoInvest</div>
          <div className="breadcrumb">Workspace <span>/</span> Overview</div>
          <div className="topbar-right"><span className="status-dot" /> Safe preview <div className="avatar small">CI</div></div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">YOUR FINANCIAL WORKSPACE</p>
              <h1>Portfolio overview</h1>
              <p className="subtitle">A clear view of your account, plans and recent activity.</p>
            </div>
            <span className="preview-tag">DEVELOPMENT PREVIEW</span>
          </div>

          <section className="safety-banner" aria-label="Financial operations status">
            <div className="shield">✓</div>
            <div>
              <strong>Financial operations are disabled</strong>
              <p>Deposits, withdrawals, trading and investment approvals are unavailable until security and backend checks are complete.</p>
            </div>
            <span className="disabled-pill">DISABLED</span>
          </section>

          <div className="section-heading">
            <div><h2>At a glance</h2><p>Verified account data will appear here after secure backend integration.</p></div>
            <span className="muted-label">NO LIVE DATA</span>
          </div>

          <div className="summary-grid">
            {summaryCards.map((card) => (
              <article className="summary-card" key={card.label}>
                <div className="card-top"><span>{card.label}</span><span className="card-symbol">↗</span></div>
                <div className="metric">{card.value}</div>
                <p>{card.note}</p>
              </article>
            ))}
          </div>

          <div className="lower-grid">
            <section className="panel-card" id="plans">
              <div className="panel-heading"><div><h2>Investment plans</h2><p>Plan information will load from the verified backend.</p></div><span className="outline-tag">NOT CONNECTED</span></div>
              <div className="empty-state">
                <div className="empty-icon">◈</div>
                <strong>No verified plans to display</strong>
                <p>This starter page intentionally contains no fabricated investments, balances or returns.</p>
              </div>
            </section>
            <section className="panel-card" id="activity">
              <div className="panel-heading"><div><h2>Setup checklist</h2><p>Required before real account data is enabled.</p></div></div>
              <ul className="check-list">
                {setupChecks.map((item, index) => (
                  <li key={item}><span className="check-number">{String(index + 1).padStart(2, "0")}</span><span>{item}</span><span className="pending">Pending</span></li>
                ))}
              </ul>
            </section>
          </div>

          <footer className="footer"><span>© {new Date().getFullYear()} CryptoInvest</span><span>Secure foundation · No live financial operations</span></footer>
        </div>
      </section>
    </main>
  );
}
