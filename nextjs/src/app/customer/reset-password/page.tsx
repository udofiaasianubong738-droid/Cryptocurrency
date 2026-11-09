"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "../../../../lib/supabase/browser";

export default function CustomerResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (password !== confirm) { setError("The passwords do not match."); return; }
    if (password.length < 12) { setError("Use at least 12 characters for your new password."); return; }
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("This recovery link is invalid or expired. Request a new password reset email.");
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Your password could not be updated. Request a new recovery link.");
    } finally { setBusy(false); }
  }

  return <main className="customer-auth-shell"><section className="customer-auth-card">
    <Link href="/customer/welcome" className="customer-brand"><img className="customer-brand-mark" src="/logo.svg" alt=""/><span className="customer-brand-copy"><b>CryptoInvest</b><small>MORE THAN INVESTING. BUILT ON TRUST.</small></span></Link>
    <p className="customer-eyebrow">SECURE ACCOUNT ACCESS</p><h1>Choose a new password</h1>
    {done ? <><div className="customer-success" role="status">Your password has been updated. Sign in with your new password.</div><Link className="customer-primary customer-welcome-link" href="/customer/login">Continue to sign in</Link></> : <>
      <p className="customer-muted">Use a unique password with at least 12 characters.</p>
      {error && <div className="customer-alert" role="alert">{error}</div>}
      <form className="customer-form" onSubmit={submit}>
        <label>New password<input type="password" autoComplete="new-password" minLength={12} value={password} onChange={e=>setPassword(e.target.value)} required/></label>
        <label>Confirm new password<input type="password" autoComplete="new-password" minLength={12} value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label>
        <button className="customer-primary" disabled={busy}>{busy ? "Updating…" : "Update password"}</button>
      </form>
    </>}
  </section></main>;
}
