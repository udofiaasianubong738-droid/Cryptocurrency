"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase-browser";

type Stage = "password" | "mfa" | "enroll" | "cleanup";
type TotpFactor = { id: string; friendly_name?: string | null; status: string; factor_type: string };

const CEO_EMAIL = "cyrrenza@outlook.com";

function Brand() {
  return <span className="brand-lockup"><span className="brand-mark" aria-hidden="true"><span /></span><span className="brand-name">Crypto<span>Invest</span></span></span>;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(CEO_EMAIL);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<Stage>("password");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [pendingFactors, setPendingFactors] = useState<TotpFactor[]>([]);

  function supabase() {
    try {
      return createSupabaseBrowserClient();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Supabase configuration is missing.");
      return null;
    }
  }

  async function verifyCEOAccess() {
    const client = supabase();
    if (!client) return;
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user || user.email?.toLowerCase() !== CEO_EMAIL) {
      await client.auth.signOut();
      setMessage("This account is not authorized for CEO administration.");
      setStage("password");
      return;
    }

    const { data: admin, error: adminError } = await client
      .from("ceo_admins")
      .select("user_id, enabled")
      .eq("user_id", user.id)
      .eq("enabled", true)
      .maybeSingle();

    if (adminError || !admin) {
      await client.auth.signOut();
      setMessage("CEO authorization could not be verified. Access is blocked; check the ceo_admins row-level security policy.");
      setStage("password");
      return;
    }

    const { data: assurance, error: assuranceError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance?.currentLevel !== "aal2") {
      setMessage("Authenticator verification is required before opening the admin workspace.");
      setStage("mfa");
      return;
    }

    router.replace("/");
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      const client = supabase();
      if (!client) return;
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error || !data.user) {
        setMessage("Sign-in failed. Check the CEO email and password, then try again.");
        return;
      }
      if (data.user.email?.toLowerCase() !== CEO_EMAIL) {
        await client.auth.signOut();
        setMessage("This account is not authorized for CEO administration.");
        return;
      }

      const { data: factors, error: factorsError } = await client.auth.mfa.listFactors();
      if (factorsError) {
        setMessage("Could not read MFA status. Admin access remains blocked; check Supabase MFA settings.");
        return;
      }

      const verified = factors.totp.find((factor) => factor.status === "verified");
      if (verified) {
        const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId: verified.id });
        if (challengeError || !challenge) {
          setMessage("Could not start the authenticator challenge. Check the Supabase MFA configuration.");
          return;
        }
        setFactorId(verified.id);
        setChallengeId(challenge.id);
        setStage("mfa");
        return;
      }

      const pending = factors.totp.filter((factor) => factor.status !== "verified");
      if (pending.length) {
        setPendingFactors(pending);
        setStage("cleanup");
        setMessage("Supabase has unfinished authenticator setups. Remove a stale setup you no longer use, then start a fresh enrollment.");
        return;
      }

      await startEnrollment(client);
    } finally {
      setBusy(false);
    }
  }

  async function startEnrollment(existingClient?: ReturnType<typeof createSupabaseBrowserClient>) {
    const client = existingClient ?? supabase();
    if (!client) return;
    setMessage("");
    setBusy(true);
    try {
      const { data: factors, error: listError } = await client.auth.mfa.listFactors();
      if (listError) {
        setMessage("Could not check existing MFA setups. Admin access remains blocked.");
        return;
      }
      const pending = factors.totp.filter((factor) => factor.status !== "verified");
      if (pending.length) {
        setPendingFactors(pending);
        setStage("cleanup");
        setMessage("Remove the unfinished authenticator setup before creating a new one.");
        return;
      }
      const { data, error } = await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "CryptoInvest CEO authenticator",
      });
      if (error || !data) {
        setMessage(error?.message ?? "Could not start authenticator setup. Check Supabase MFA settings and retry.");
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setCode("");
      setStage("enroll");
    } finally {
      setBusy(false);
    }
  }

  async function removePendingFactor(id: string) {
    const client = supabase();
    if (!client) return;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await client.auth.mfa.unenroll({ factorId: id });
      if (error) {
        setMessage("Supabase would not remove that unfinished factor. No factor was marked verified. Sign out and review the pending MFA factors in Supabase Auth if this continues.");
        return;
      }
      const { data, error: listError } = await client.auth.mfa.listFactors();
      if (listError) {
        setMessage("The factor removal was requested, but the remaining MFA status could not be refreshed. Please sign in again.");
        return;
      }
      const pending = data.totp.filter((factor) => factor.status !== "verified");
      setPendingFactors(pending);
      if (pending.length === 0) {
        await startEnrollment(client);
      } else {
        setMessage("Pending factor removed. Remove the remaining stale setup before enrolling.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      const client = supabase();
      if (!client) return;
      if (!/^[0-9]{6}$/.test(code.trim())) {
        setMessage("Enter the six-digit code from your authenticator app.");
        return;
      }
      if (stage === "mfa") {
        const { error } = await client.auth.mfa.verify({ factorId, challengeId, code: code.trim() });
        if (error) {
          setMessage("That authenticator code could not be verified. Check your device time and try the current six-digit code.");
          return;
        }
      } else {
        const { error } = await client.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
        if (error) {
          setMessage("Authenticator verification failed. Confirm the code and try again.");
          return;
        }
      }
      await verifyCEOAccess();
    } finally {
      setBusy(false);
    }
  }

  async function cancelSignIn() {
    const client = supabase();
    if (client) await client.auth.signOut();
    setPassword("");
    setCode("");
    setStage("password");
    setMessage("You have been signed out.");
  }

  return <main className="auth-welcome-shell">
    <section className="auth-login-card">
      <Link href="/" className="auth-back-link">← Welcome screen</Link>
      <Brand />
      <span className="auth-eyebrow">CEO ADMINISTRATION</span>
      <h1>{stage === "password" ? "Sign in securely" : stage === "cleanup" ? "Finish MFA setup" : stage === "enroll" ? "Set up your authenticator" : "Verify it’s you"}</h1>
      <p className="auth-welcome-copy">{stage === "password" ? "Sign in with the single authorized CEO account. Public account creation is disabled." : stage === "cleanup" ? "Old unfinished TOTP enrollments cannot be used for sign-in. Remove only the pending setups you no longer need." : stage === "enroll" ? "Scan this QR code with your authenticator app, then enter the six-digit code it generates." : "Enter the current six-digit code from your enrolled authenticator app."}</p>

      {stage === "password" && <form onSubmit={handlePasswordSubmit}>
        <label className="auth-field-label" htmlFor="ceo-email">CEO email</label>
        <input className="auth-field" id="ceo-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className="auth-field-label" htmlFor="ceo-password">Password</label>
        <input className="auth-field" id="ceo-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="auth-primary-button" type="submit" disabled={busy}>{busy ? "Signing in…" : "Continue securely"}</button>
      </form>}

      {stage === "cleanup" && <div className="auth-mfa-panel">
        <p className="auth-field-label">Unverified authenticator setups</p>
        {pendingFactors.map((factor) => <div className="auth-pending-factor" key={factor.id}><span>{factor.friendly_name || "Unfinished authenticator"} · Not verified</span><button type="button" className="auth-secondary-button" disabled={busy} onClick={() => removePendingFactor(factor.id)}>Remove pending setup</button></div>)}
        <p className="auth-footnote">Only remove a pending setup if you are sure you no longer need it. Verified factors are not listed here and will not be removed.</p>
        <button type="button" className="auth-secondary-button" disabled={busy} onClick={cancelSignIn}>Cancel and sign out</button>
      </div>}

      {stage === "enroll" && <div className="auth-mfa-panel">
        {qrCode ? <img className="auth-mfa-qr" src={qrCode} alt="QR code for CryptoInvest CEO authenticator enrollment" /> : null}
        <label className="auth-field-label" htmlFor="totp-code">Six-digit authenticator code</label>
        <form onSubmit={handleCodeSubmit}>
          <input className="auth-field" id="totp-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required />
          <button className="auth-primary-button" type="submit" disabled={busy}>{busy ? "Verifying…" : "Verify and enable MFA"}</button>
        </form>
        <details className="auth-secret-details"><summary>Can’t scan the QR code?</summary><p>Enter this setup key manually in your authenticator app:</p><code>{secret}</code></details>
        <p className="auth-footnote">The setup is not complete until Supabase verifies your code. Do not share the QR code or setup key.</p>
      </div>}

      {stage === "mfa" && <div className="auth-mfa-panel">
        <form onSubmit={handleCodeSubmit}>
          <label className="auth-field-label" htmlFor="mfa-code">Authenticator code</label>
          <input className="auth-field" id="mfa-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} required />
          <button className="auth-primary-button" type="submit" disabled={busy}>{busy ? "Verifying…" : "Verify and continue"}</button>
        </form>
        <button type="button" className="auth-secondary-button" disabled={busy} onClick={cancelSignIn}>Cancel and sign out</button>
      </div>}

      {message && <div className="auth-setup-warning" role="alert"><strong>Sign-in status</strong><p>{message}</p></div>}
      <div className="auth-flow-steps"><span className={stage === "password" ? "auth-step-active" : ""}>1&nbsp; Email &amp; password</span><span className={stage !== "password" ? "auth-step-active" : ""}>2&nbsp; Authenticator</span></div>
      <p className="auth-footnote">Never share your password, authenticator code, QR code, or setup key. Financial operations remain disabled.</p>
    </section>
    <footer className="auth-welcome-footer">© {new Date().getFullYear()} CryptoInvest · Financial operations disabled</footer>
  </main>;
}
