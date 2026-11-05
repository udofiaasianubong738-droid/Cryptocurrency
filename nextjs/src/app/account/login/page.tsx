"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const client = createSupabaseBrowserClient();
      const { error: signInError } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
      const { data, error: userError } = await client.auth.getUser();
      if (userError || !data.user) throw new Error("The signed-in account could not be verified.");
      const { data: ceo, error: ceoError } = await client.from("ceo_admins").select("user_id").eq("user_id", data.user.id).eq("enabled", true).maybeSingle();
      if (ceoError) throw ceoError;
      if (ceo) {
        await client.auth.signOut();
        throw new Error("CEO administrator accounts must use the secure administration sign-in page.");
      }
      router.replace("/account");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in could not be completed.");
    } finally { setBusy(false); }
  }

  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f5f7fb", padding: 18, color: "#0f172a" }}>
    <section style={{ width: "100%", maxWidth: 440, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 28, boxShadow: "0 12px 36px rgba(15,23,42,.07)" }}>
      <Link href="/" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 700 }}>← CryptoInvest</Link>
      <p style={{ color: "#2563eb", letterSpacing: ".14em", fontSize: 12, fontWeight: 800, marginTop: 26 }}>CUSTOMER PORTAL</p>
      <h1 style={{ fontSize: 30, margin: "8px 0" }}>Sign in to your account</h1>
      <p style={{ color: "#64748b", lineHeight: 1.6 }}>Access your existing account records and published plan information.</p>
      {error && <p role="alert" style={{ background: "#fef2f2", color: "#991b1b", borderRadius: 10, padding: 12 }}>{error}</p>}
      <form onSubmit={submit}>
        <label htmlFor="customer-email" style={{ display: "block", fontWeight: 700, fontSize: 13, marginTop: 18 }}>Email address</label>
        <input id="customer-email" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: 13, border: "1px solid #cbd5e1", borderRadius: 10, marginTop: 7 }}/>
        <label htmlFor="customer-password" style={{ display: "block", fontWeight: 700, fontSize: 13, marginTop: 16 }}>Password</label>
        <input id="customer-password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: 13, border: "1px solid #cbd5e1", borderRadius: 10, marginTop: 7 }}/>
        <button disabled={busy} type="submit" style={{ width: "100%", marginTop: 22, border: 0, borderRadius: 10, padding: 14, color: "#fff", background: "#1d4ed8", fontWeight: 800, cursor: busy ? "wait" : "pointer" }}>{busy ? "Verifying…" : "Sign in securely"}</button>
      </form>
      <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6, marginTop: 18 }}>New customer access is not self-service in this build. Account onboarding must be approved and configured by the platform administrator.</p>
    </section>
  </main>;
}
