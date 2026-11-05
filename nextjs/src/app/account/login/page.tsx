"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; "expired-callback"?: () => void; "error-callback"?: () => void }) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId: string) => void;
    };
  }
}

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaContainer = useRef<HTMLDivElement>(null);
  const captchaWidgetId = useRef<string | null>(null);
  const captchaSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  useEffect(() => {
    if (!captchaSiteKey) return;
    let cancelled = false;
    const mount = () => {
      if (cancelled || !window.turnstile || !captchaContainer.current || captchaWidgetId.current) return;
      captchaWidgetId.current = window.turnstile.render(captchaContainer.current, {
        sitekey: captchaSiteKey,
        callback: (token) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => setCaptchaToken(""),
      });
    };
    if (window.turnstile) mount();
    else {
      let script = document.getElementById("ci-customer-turnstile") as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = "ci-customer-turnstile";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true; script.defer = true; document.head.appendChild(script);
      }
      script.addEventListener("load", mount);
    }
    return () => {
      cancelled = true;
      document.getElementById("ci-customer-turnstile")?.removeEventListener("load", mount);
      if (captchaWidgetId.current && window.turnstile) {
        window.turnstile.remove?.(captchaWidgetId.current);
        captchaWidgetId.current = null;
      }
    };
  }, [captchaSiteKey]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const client = createSupabaseBrowserClient();
      if (!captchaSiteKey) throw new Error("Customer sign-in is blocked until the Turnstile site key is configured.");
      if (!captchaToken) throw new Error("Complete the CAPTCHA challenge before signing in.");
      const { error: signInError } = await client.auth.signInWithPassword({ email: email.trim(), password, options: { captchaToken } });
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
      if (captchaWidgetId.current && window.turnstile) {
        window.turnstile.reset(captchaWidgetId.current);
        setCaptchaToken("");
      }
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
        <div style={{ marginTop: 16, minHeight: 64 }}>
          {captchaSiteKey ? <div ref={captchaContainer} /> : <p role="alert" style={{ color: "#991b1b", fontSize: 12 }}>Turnstile is not configured. Sign-in is blocked until the public site key is added to the deployment environment.</p>}
        </div>
        <button disabled={busy || !captchaSiteKey || !captchaToken} type="submit" style={{ width: "100%", marginTop: 22, border: 0, borderRadius: 10, padding: 14, color: "#fff", background: "#1d4ed8", fontWeight: 800, cursor: busy ? "wait" : "pointer" }}>{busy ? "Verifying…" : "Sign in securely"}</button>
      </form>
      <p style={{ color: "#64748b", fontSize: 12, lineHeight: 1.6, marginTop: 18 }}>New customer access is not self-service in this build. Account onboarding must be approved and configured by the platform administrator.</p>
    </section>
  </main>;
}
