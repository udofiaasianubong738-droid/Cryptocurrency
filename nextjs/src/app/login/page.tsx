"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback"?: () => void;
        "error-callback"?: () => void;
      }) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

function Brand() {
  return <span className="brand-lockup"><span className="brand-mark" aria-hidden="true"><span /></span><span className="brand-name">Crypto<span>Invest</span></span></span>;
}

export default function LoginPage() {
  const router = useRouter();
  const [reason, setReason] = useState("");
  useEffect(() => {
    setReason(new URLSearchParams(window.location.search).get("reason") ?? "");
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const captchaContainer = useRef<HTMLDivElement>(null);
  const captchaWidgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !captchaReady || !captchaContainer.current || !window.turnstile || captchaWidgetId.current) return;
    captchaWidgetId.current = window.turnstile.render(captchaContainer.current, {
      sitekey: siteKey,
      callback: (token) => setCaptchaToken(token),
      "expired-callback": () => setCaptchaToken(""),
      "error-callback": () => setCaptchaToken(""),
    });
    return () => {
      if (captchaWidgetId.current && window.turnstile) {
        window.turnstile.remove(captchaWidgetId.current);
        captchaWidgetId.current = null;
      }
    };
  }, [siteKey, captchaReady]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (siteKey && !captchaToken) {
      setError("Complete the security check before signing in.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
        options: captchaToken ? { captchaToken } : undefined,
      });
      if (signInError) {
        const message = signInError.message.toLowerCase();
        if (message.includes("captcha")) {
          throw new Error("The security check was not accepted. Confirm that the Turnstile site key and Supabase Auth CAPTCHA secret belong to the same configuration.");
        }
        throw new Error("Sign-in was not accepted. Check the email and password, then try again.");
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        await supabase.auth.signOut();
        throw new Error("The signed-in account could not be verified.");
      }

      const { data: ceo, error: ceoError } = await supabase
        .from("ceo_admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .eq("enabled", true)
        .maybeSingle();

      if (ceoError || !ceo) {
        await supabase.auth.signOut();
        throw new Error("This account is not authorized for the CEO workspace.");
      }

      router.replace("/security/mfa");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Secure sign-in failed. Please try again.");
      if (captchaWidgetId.current && window.turnstile) window.turnstile.reset(captchaWidgetId.current);
      setCaptchaToken("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-welcome-shell">
      {siteKey ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onReady={() => setCaptchaReady(true)} /> : null}
      <section className="auth-login-card">
        <Link href="/" className="auth-back-link">← Welcome screen</Link>
        <Brand />
        <span className="auth-eyebrow">CEO ADMINISTRATION</span>
        <h1>Sign in securely</h1>
        <p className="auth-welcome-copy">Use the single authorized CEO account. There is no public create-account option.</p>
        {reason === "configuration" ? <div className="auth-setup-warning"><strong>Secure connection not configured</strong><p>Set the public Supabase URL and publishable key in the Cloudflare Worker environment before signing in.</p></div> : null}
        {reason === "not-authorized" ? <div className="auth-setup-warning"><strong>CEO access not confirmed</strong><p>This session is not authorized for the CEO workspace.</p></div> : null}
        <form onSubmit={handleSubmit}>
          <label className="auth-field-label" htmlFor="ceo-email">CEO email</label>
          <input className="auth-field" id="ceo-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label className="auth-field-label" htmlFor="ceo-password">Password</label>
          <input className="auth-field" id="ceo-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {siteKey ? <div className="mfa-captcha-wrap"><div ref={captchaContainer} /><p className="mfa-muted">Complete the Cloudflare security check.</p></div> : null}
          <button className="auth-primary-button" type="submit" disabled={busy || (Boolean(siteKey) && !captchaToken)}>{busy ? "Signing in…" : "Continue securely"}</button>
        </form>
        {error ? <p className="mfa-error" role="alert">{error}</p> : null}
        <div className="auth-setup-warning"><strong>Authenticator verification required</strong><p>After password sign-in, the app checks the CEO authorization record and routes to the authenticator step. Dashboard pages require an AAL2 session.</p></div>
        <div className="auth-flow-steps"><span className="auth-step-active">1&nbsp; Email &amp; password</span><span>2&nbsp; Authenticator code</span></div>
        <p className="auth-footnote">Never share your password, authenticator code or setup key. Financial operations remain disabled.</p>
      </section>
      <footer className="auth-welcome-footer">© {new Date().getFullYear()} CryptoInvest · Financial operations disabled</footer>
    </main>
  );
}
