import Link from "next/link";

export const metadata = { title: "Welcome | CryptoInvest Customer", robots: { index: false, follow: false } };

export default function CustomerWelcomePage() {
  return <main className="customer-auth-shell">
    <section className="customer-auth-card">
      <Link href="/customer/welcome" className="customer-brand"><img className="customer-brand-mark" src="/logo.svg" alt=""/><span className="customer-brand-copy"><b>CryptoInvest</b><small>MORE THAN INVESTING. BUILT ON TRUST.</small></span></Link>
      <p className="customer-eyebrow">CUSTOMER PORTAL</p>
      <h1>Your investments, in one place.</h1>
      <p className="customer-muted">Sign in to access your personal account, published investment plans, account activity and support.</p>
      <div className="customer-safety-banner"><strong>Your account is private</strong><p>The customer portal is separate from CEO administration. Your access is limited by your authenticated account and database permissions.</p></div>
      <Link className="customer-primary customer-welcome-link" href="/customer/register">Create a customer account</Link>
      <Link className="customer-switch customer-welcome-link-secondary" href="/customer/login">I already have an account</Link>
      <p className="customer-footnote">Live deposits, withdrawals and financial processing are disabled until the platform's security and backend verification is complete.</p>
    </section>
  </main>;
}
