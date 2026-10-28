"use client";
import Link from "next/link";
import { useState } from "react";

function Brand(){return <span className="brand-lockup"><span className="brand-mark" aria-hidden="true"><span/></span><span className="brand-name">Crypto<span>Invest</span></span></span>}

export default function LoginPage(){
 const [email,setEmail]=useState("AdminCEO@cryptoInvest.com");
 const [password,setPassword]=useState("");
 return <main className="auth-welcome-shell"><section className="auth-login-card"><Link href="/" className="auth-back-link">← Welcome screen</Link><Brand/><span className="auth-eyebrow">CEO ADMINISTRATION</span><h1>Sign in securely</h1><p className="auth-welcome-copy">Use the single authorized CEO account. There is no public create-account option.</p><form onSubmit={e=>e.preventDefault()}><label className="auth-field-label" htmlFor="ceo-email">CEO email</label><input className="auth-field" id="ceo-email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/><label className="auth-field-label" htmlFor="ceo-password">Password</label><input className="auth-field" id="ceo-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="auth-primary-button" type="button" disabled>Continue to one-time password</button></form><div className="auth-setup-warning"><strong>Secure sign-in is not connected yet</strong><p>The verified Supabase Auth project, CEO user, and TOTP MFA enrollment must be configured before this form can authenticate anyone or display a real QR code.</p></div><div className="auth-flow-steps"><span className="auth-step-active">1&nbsp; Email &amp; password</span><span>2&nbsp; Authenticator code</span></div><p className="auth-footnote">Password confirmation belongs to first-time password setup or password reset—not routine login. Never share your password or one-time code.</p></section><footer className="auth-welcome-footer">© {new Date().getFullYear()} CryptoInvest · Financial operations disabled</footer></main>
}
