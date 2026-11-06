import Link from "next/link";

export const metadata = {
  title: "CryptoInvest | Secure Administration",
  description: "Secure entry point for the CryptoInvest CEO administration portal.",
  robots: { index: false, follow: false },
};

export default function PublicLandingPage() {
  return (
    <main className="auth-welcome-shell">
      <section className="auth-welcome-card">
        <div className="auth-welcome-brand">
          <span className="brand-lockup">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span className="brand-name">Crypto<span>Invest</span></span>
          </span>
        </div>
        <span className="auth-eyebrow">SECURE PLATFORM ACCESS</span>
        <div className="auth-welcome-mark" aria-hidden="true">CI</div>
        <h1>CryptoInvest administration</h1>
        <p className="auth-welcome-copy">
          The CEO administration workspace is protected by account authorization and
          multi-factor authentication. Sign in to continue.
        </p>
        <div className="auth-security-note">
          <span aria-hidden="true">◆</span>
          <div>
            <strong>Security-first access</strong>
            <p>Only the enabled CEO account with a verified AAL2 session can access protected administration pages.</p>
          </div>
        </div>
        <Link className="auth-primary-link" href="/login">Continue to CEO sign in →</Link>
        <p className="auth-footnote">
          Financial operations are disabled. This entry page does not display account or customer data.
        </p>
      </section>
      <footer className="auth-welcome-footer">© {new Date().getFullYear()} CryptoInvest</footer>
    </main>
  );
}
