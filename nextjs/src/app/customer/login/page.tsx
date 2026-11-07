"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "register") setMode("register");
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim(), account_type: "customer" } },
        });
        if (signUpError) throw signUpError;
        if (data.session) router.replace("/customer");
        else setMessage("Registration received. Check your email if confirmation is required, then sign in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
        router.replace("/customer"); router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not complete your request. Please try again.");
    } finally { setBusy(false); }
  }

  return <main className="customer-auth-shell">
    <section className="customer-auth-card">
      <Link href="/customer/welcome" className="customer-brand"><span className="customer-brand-mark">C</span><span>CryptoInvest</span></Link>
      <p className="customer-eyebrow">CUSTOMER ACCOUNT</p>
      <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
      <p className="customer-muted">Sign in to view your own account and investment records.</p>
      {error && <div className="customer-alert" role="alert">{error}</div>}
      {message && <div className="customer-success" role="status">{message}</div>}
      <form className="customer-form" onSubmit={submit}>
        {mode === "register" && <label>Full name<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" required maxLength={100}/></label>}
        <label>Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></label>
        <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required/></label>
        <button className="customer-primary" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in securely" : "Create customer account"}</button>
      </form>
      <button className="customer-switch" type="button" onClick={()=>{setMode(mode === "login" ? "register" : "login");setError("");setMessage("");}}>
        {mode === "login" ? "New to CryptoInvest? Create an account" : "Already registered? Sign in"}
      </button>
      <p className="customer-footnote">Your access is governed by customer account permissions. Administrative tools and other customers’ records are not available here.</p>
    </section>
  </main>;
}
