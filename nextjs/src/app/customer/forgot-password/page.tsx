"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

export default function CustomerForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/customer/reset-password`,
      });
      if (resetError) throw resetError;
      setNotice("If an account exists for that email, password reset instructions will be sent.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not start password recovery. Please try again.");
    } finally { setBusy(false); }
  }

  return <main className="customer-auth-shell"><section className="customer-auth-card">
    <Link href="/customer/welcome" className="customer-brand"><img className="customer-brand-mark" src="/logo.svg" alt=""/><span className="customer-brand-copy"><b>CryptoInvest</b><small>MORE THAN INVESTING. BUILT ON TRUST.</small></span></Link>
    <p className="customer-eyebrow">ACCOUNT RECOVERY</p><h1>Reset your password</h1>
    <p className="customer-muted">Enter the email address associated with your customer account. We will send a secure recovery link if the account is eligible.</p>
    {error && <div className="customer-alert" role="alert">{error}</div>}
    {notice && <div className="customer-success" role="status">{notice}</div>}
    <form className="customer-form" onSubmit={submit}>
      <label>Email address<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
      <button className="customer-primary" disabled={busy}>{busy ? "Sending…" : "Send recovery email"}</button>
    </form>
    <Link className="customer-inline-link" href="/customer/login">Return to sign in</Link>
  </section></main>;
}
