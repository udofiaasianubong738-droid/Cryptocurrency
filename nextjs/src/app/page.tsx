import Link from "next/link";

function Brand(){return <span className="brand-lockup"><span className="brand-mark" aria-hidden="true"><span/></span><span className="brand-name">Crypto<span>Invest</span></span></span>}

export default function WelcomePage(){
 return <main className="auth-welcome-shell"><section className="auth-welcome-card"><div className="auth-welcome-brand"><Brand/></div><span className="auth-eyebrow">PRIVATE ADMINISTRATOR WORKSPACE</span><div className="auth-welcome-mark" aria-hidden="true">CI</div><p className="auth-eyebrow">WELCOME BACK</p><h1>Welcome, CEO Admin.</h1><p className="auth-welcome-copy">Your CryptoInvest administration workspace is reserved for one authorized CEO account. Sign in securely to continue.</p><div className="auth-security-note"><span aria-hidden="true">◈</span><div><strong>One administrator. Protected access.</strong><p>Multi-factor authentication is required before privileged access is enabled.</p></div></div><Link className="auth-primary-link" href="/login">Continue to secure login <span aria-hidden="true">→</span></Link><p className="auth-footnote">Financial operations remain disabled until the production safety checks are complete.</p></section><footer className="auth-welcome-footer">© {new Date().getFullYear()} CryptoInvest · Secure CEO access</footer></main>
}
