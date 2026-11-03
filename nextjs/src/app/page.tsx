"use client";

import Link from "next/link";

const capabilities = [
  { icon: "▦", title: "Platform overview", body: "A single workspace for verified account, plan, and operational status." },
  { icon: "⇄", title: "Review workflows", body: "Dedicated areas for deposit and withdrawal requests, kept locked while financial operations are disabled." },
  { icon: "⌁", title: "Security first", body: "CEO-only access, authenticator MFA, and server-side authorization for protected screens." },
];

function Brand() {
  return (
    <span className="ci-brand">
      <span className="ci-brand-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48"><path d="M8 35V27M18 35V20M28 35V15M38 35V8" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/><path d="M7 18 18 13 26 17 40 5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M32 5h8v8" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </span>
      <span><strong>CryptoInvest</strong><small>CEO ADMINISTRATION</small></span>
    </span>
  );
}

export default function LandingPage() {
  return (
    <main className="ci-landing">
      <header className="ci-landing-header">
        <Link href="/" aria-label="CryptoInvest admin home" className="ci-landing-brand"><Brand /></Link>
        <div className="ci-landing-header-actions">
          <span className="ci-secure-label"><span aria-hidden="true">●</span> Secure admin workspace</span>
          <Link href="/login" className="ci-landing-signin">CEO sign in <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <section className="ci-landing-hero">
        <div className="ci-landing-copy">
          <span className="ci-landing-eyebrow"><span /> PRIVATE ADMINISTRATION PORTAL</span>
          <h1>Your platform.<br /><em>One secure</em> workspace.</h1>
          <p className="ci-landing-intro">Manage CryptoInvest from a clear, security-first workspace built for authorized CEO administration.</p>
          <div className="ci-landing-actions">
            <Link href="/login" className="ci-landing-primary">Continue to CEO sign in <span aria-hidden="true">→</span></Link>
            <Link href="/preview/admin" className="ci-landing-secondary">Explore admin preview</Link>
          </div>
          <div className="ci-landing-trust"><span className="ci-trust-icon">✓</span><span><strong>Protected access</strong><small>CEO authorization and authenticator verification required</small></span></div>
        </div>

        <div className="ci-landing-visual" aria-label="Illustration of the secure CryptoInvest administration dashboard">
          <div className="ci-visual-glow" />
          <div className="ci-orb ci-orb-a" /><div className="ci-orb ci-orb-b" />
          <div className="ci-preview-window">
            <div className="ci-preview-top"><span className="ci-preview-dots"><i/><i/><i/></span><span>CRYPTOINVEST / ADMIN</span><span className="ci-preview-live"><i/> PRIVATE</span></div>
            <div className="ci-preview-content">
              <div className="ci-preview-heading"><span><small>CEO WORKSPACE</small><strong>Platform overview</strong></span><span className="ci-preview-avatar">CI</span></div>
              <div className="ci-preview-stat-grid"><div><small>Customers</small><strong>—</strong><i>Awaiting verified data</i></div><div><small>Deposits</small><strong>—</strong><i>Not connected</i></div><div><small>Withdrawals</small><strong>—</strong><i>Operations locked</i></div></div>
              <div className="ci-preview-chart"><div><strong>Platform activity</strong><small>Verified activity will appear here</small></div><svg viewBox="0 0 360 90" role="img" aria-label="Decorative dashboard chart illustration"><path d="M0 70H360M0 45H360M0 20H360" stroke="currentColor" strokeOpacity=".12" strokeDasharray="3 5" fill="none"/><path d="M0 72 C25 68 28 42 52 50 S87 75 110 52 S145 25 170 39 S202 58 226 31 S268 47 290 22 S330 35 360 8" fill="none" stroke="#6698f1" strokeWidth="3" strokeLinecap="round"/><path d="M0 72 C25 68 28 42 52 50 S87 75 110 52 S145 25 170 39 S202 58 226 31 S268 47 290 22 S330 35 360 8V90H0Z" fill="url(#ciLandingFill)" opacity=".22"/><defs><linearGradient id="ciLandingFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#6698f1"/><stop offset="1" stopColor="#6698f1" stopOpacity="0"/></linearGradient></defs></svg></div>
              <div className="ci-preview-lock"><span>✓</span><div><strong>Production safety gate active</strong><small>Financial operations remain disabled</small></div><b>LOCKED</b></div>
            </div>
          </div>
          <div className="ci-float-chip ci-float-security"><span>✓</span><div><strong>Access protected</strong><small>MFA required</small></div></div>
          <div className="ci-float-chip ci-float-status"><span className="ci-status-dot" /><div><strong>Safety controls</strong><small>Financial actions paused</small></div></div>
        </div>
      </section>

      <section className="ci-landing-safety"><span className="ci-landing-safety-icon">!</span><div><strong>Financial operations are disabled</strong><p>Live deposits, withdrawals, payouts, and balance changes stay unavailable until authentication, ledger, reconciliation, and provider checks are verified.</p></div><span className="ci-landing-locked">PRODUCTION SAFETY GATE</span></section>

      <section className="ci-landing-capabilities">
        <div className="ci-landing-section-heading"><span>BUILT FOR RESPONSIBLE OPERATIONS</span><h2>Everything starts with verified access.</h2><p>Use the admin workspace to review platform readiness without mistaking sample UI for live financial records.</p></div>
        <div className="ci-landing-cards">{capabilities.map((item) => <article className="ci-landing-card" key={item.title}><span className="ci-landing-card-icon">{item.icon}</span><h3>{item.title}</h3><p>{item.body}</p><span className="ci-landing-card-arrow" aria-hidden="true">↗</span></article>)}</div>
      </section>

      <footer className="ci-landing-footer"><Link href="/" className="ci-landing-footer-brand"><Brand /></Link><span>© {new Date().getFullYear()} CryptoInvest. Private administration only.</span><span className="ci-footer-status"><i/> Financial operations disabled</span></footer>
    </main>
  );
}
