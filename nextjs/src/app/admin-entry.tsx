"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import DashboardApp from "./dashboard-app";
import type { DemoDashboardData } from "../lib/admin-types";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

type Mode = "loading" | "signed_out" | "mfa" | "checking_admin" | "ready" | "denied" | "config_error";
type DashboardData = DemoDashboardData;

function DemoWorkflowPanel({ data, onRefresh }: { data: DemoDashboardData; onRefresh: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeError, setNoticeError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.action = action;
    payload.idempotency_key = crypto.randomUUID();
    setBusy(true);
    setNotice("");
    setNoticeError(false);
    try {
      const response = await fetch("/api/admin/demo", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setNotice(result.error || "The demo action could not be completed.");
        setNoticeError(true);
        return;
      }
      setNotice("Demo-only action completed. The backend summary has been refreshed.");
      form.reset();
      await onRefresh();
    } catch {
      setNotice("The demo backend could not be reached.");
      setNoticeError(true);
    } finally {
      setBusy(false);
    }
  }

  const accounts = data.accounts ?? [];
  const investments = data.recent_investments ?? [];
  return <section className="surface-card demo-workflow-panel">
    <div className="section-title-row"><div><p className="section-kicker">SIMULATION CONTROLS</p><h2>Admin demo workflows</h2><p className="section-description">These actions change virtual demo records only. No wallet, exchange, deposit or payout is connected.</p></div><span className="status-pill status-locked">Demo only</span></div>
    {notice && <p className={noticeError ? "demo-action-notice demo-action-error" : "demo-action-notice"} role="status">{notice}</p>}
    <div className="demo-workflow-grid">
      <form className="demo-action-card" onSubmit={(event) => void submit(event, "create_demo_account")}>
        <h3>Create virtual account</h3><p>Creates a test account with a virtual starting balance.</p>
        <label>Account label<input name="label" maxLength={120} placeholder="QA demo account" required /></label>
        <label>Starting virtual balance<input name="initial_balance" type="number" min="1" max="1000000000" step="any" defaultValue="10000" required /></label>
        <input type="hidden" name="currency_code" value="USDT" />
        <button type="submit" disabled={busy}>{busy ? "Working…" : "Create demo account"}</button>
      </form>
      <form className="demo-action-card" onSubmit={(event) => void submit(event, "create_demo_investment")}>
        <h3>Create demo investment</h3><p>Allocates virtual funds from a selected demo account.</p>
        <label>Demo account<select name="demo_account_id" required defaultValue=""><option value="" disabled>Select an account</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.label} · {a.currency_code}</option>)}</select></label>
        <label>Asset code<input name="asset_code" minLength={2} maxLength={15} pattern="[A-Za-z0-9]{2,15}" placeholder="BTC" required /></label>
        <label>Plan label<input name="plan_name" maxLength={120} defaultValue="Demo plan" required /></label>
        <label>Virtual principal<input name="principal_amount" type="number" min="0.000001" max="1000000000" step="any" required /></label>
        <input type="hidden" name="currency_code" value="USDT" />
        <button type="submit" disabled={busy || accounts.length===0}>{busy ? "Working…" : "Create demo investment"}</button>
      </form>
      <form className="demo-action-card" onSubmit={(event) => void submit(event, "record_demo_outcome")}>
        <h3>Record demo outcome</h3><p>Records a simulated profit or loss for a demo investment.</p>
        <label>Demo investment<select name="investment_id" required defaultValue=""><option value="" disabled>Select an investment</option>{investments.filter(x=>x.status!=="completed"&&x.status!=="loss_recorded").map(x=><option key={x.id} value={x.id}>{x.asset_code} · {x.plan_name} · {x.currency_code}</option>)}</select></label>
        <label>Simulated outcome amount<input name="outcome_amount" type="number" step="any" min="-1000000000" max="1000000000" placeholder="25 or -20" required /></label>
        <label>Admin note<input name="outcome_note" maxLength={1000} placeholder="Test scenario result" /></label>
        <label>Customer-facing note<input name="customer_message" maxLength={1000} placeholder="Demo result recorded" /></label>
        <button type="submit" disabled={busy || investments.length===0}>{busy ? "Working…" : "Record demo outcome"}</button>
      </form>
      <form className="demo-action-card" onSubmit={(event) => void submit(event, "execute_demo_order")}>
        <h3>Simulate spot order</h3><p>Uses a fresh public quote and virtual funds. It never submits an exchange order.</p>
        <label>Demo account<select name="demo_account_id" required defaultValue=""><option value="" disabled>Select an account</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.label} · {a.currency_code}</option>)}</select></label>
        <label>Asset code<input name="asset_code" minLength={2} maxLength={15} pattern="[A-Za-z0-9]{2,15}" placeholder="BTC" required /></label>
        <label>Side<select name="side" defaultValue="buy"><option value="buy">Simulated buy</option><option value="sell">Simulated sell</option></select></label>
        <label>Quantity<input name="quantity" type="number" min="0.00000001" max="1000000000" step="any" required /></label>
        <button type="submit" disabled={busy || accounts.length===0}>{busy ? "Working…" : "Simulate order"}</button>
      </form>
    </div>
    <p className="demo-workflow-disclaimer">Safety gate: financial_operations_enabled remains false. These forms are limited to isolated demo RPCs protected by CEO authorization and MFA.</p>
  </section>;
}

export default function AdminEntry({ activeSection = "overview" }: { activeSection?: string }) {
  const [mode, setMode] = useState<Mode>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const getClient = useCallback(() => getSupabaseBrowserClient(), []);

  const loadAdminDashboard = useCallback(async () => {
    setMode("checking_admin");
    setError("");
    try {
      const response = await fetch("/api/admin/demo", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dashboard" }),
      });
      const result = (await response.json()) as DashboardData;
      if (!response.ok || !result.ok) {
        setData(null);
        setError(result.error || "CEO authorization could not be verified.");
        setMode("denied");
        return;
      }
      setData(result);
      setMode("ready");
    } catch {
      setData(null);
      setError("Could not contact the protected admin backend.");
      setMode("denied");
    }
  }, []);

  const startMfa = useCallback(async () => {
    const supabase = getClient();
    const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) {
      setError("Unable to verify your authentication level. Sign in again.");
      setMode("signed_out");
      return;
    }
    if (aal.currentLevel === "aal2") {
      await loadAdminDashboard();
      return;
    }
    const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();
    const factor = factorData?.totp?.find((item: { id: string; status: string }) => item.status === "verified");
    if (factorError || !factor) {
      setError("Admin access requires a verified authenticator factor. Set up MFA in your account security settings, then sign in again.");
      setMode("denied");
      return;
    }
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challengeError || !challenge?.id) {
      setError("Could not start the authenticator challenge. Please sign in again.");
      setMode("signed_out");
      return;
    }
    setFactorId(factor.id);
    setChallengeId(challenge.id);
    setMode("mfa");
  }, [getClient, loadAdminDashboard]);

  useEffect(() => {
    let active = true;
    try {
      const supabase = getClient();
      supabase.auth.getSession().then((sessionResult) => {
        if (!active) return;
        if (sessionResult.error) {
          setError("Unable to restore your session. Please sign in again.");
          setMode("signed_out");
        } else if (sessionResult.data.session) {
          void startMfa();
        } else {
          setMode("signed_out");
        }
      }).catch(() => {
        if (active) {
          setError("Could not initialize authentication. Check the public Supabase environment settings.");
          setMode("config_error");
        }
      });
    } catch {
      setError("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the app environment.");
      setMode("config_error");
    }
    return () => { active = false; };
  }, [getClient, startMfa]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error: signInError } = await getClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError("Sign-in failed. Check the email and password, then try again.");
        return;
      }
      setPassword("");
      await startMfa();
    } catch {
      setError("Could not sign in. Check the Supabase connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMfa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error: verifyError } = await getClient().auth.mfa.verify({
        factorId,
        challengeId,
        code: otp.replace(/\s/g, ""),
      });
      if (verifyError) {
        setError("That authenticator code could not be verified. Try the current code from your authenticator app.");
        return;
      }
      setOtp("");
      await loadAdminDashboard();
    } catch {
      setError("MFA verification could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    try { await getClient().auth.signOut(); } catch { /* Local gate still closes. */ }
    setData(null);
    setPassword("");
    setOtp("");
    setError("");
    setMode("signed_out");
  }

  if (mode === "ready") {
    return (
      <>
        <div className="admin-session-bar">
          <div><strong>CEO session verified</strong><span>Backend connected · MFA required · demo data only</span></div>
          <div className="admin-session-actions"><span className="admin-lock-pill">Live operations disabled</span><button type="button" onClick={handleSignOut}>Sign out</button></div>
        </div>
        <div className="admin-data-strip" aria-label="Verified demo backend summary">
          <div><span>Demo accounts</span><strong>{data?.accounts?.length ?? 0}</strong></div>
          <div><span>Demo investments</span><strong>{data?.recent_investments?.length ?? 0}</strong></div>
          <div><span>Demo orders</span><strong>{data?.recent_orders?.length ?? 0}</strong></div>
          <div><span>Demo positions</span><strong>{data?.positions?.length ?? 0}</strong></div>
          <p>These counts come from the protected backend. All amounts and order results are simulated.</p>
        </div>
        {activeSection === "overview" && data && <div className="admin-demo-controls"><DemoWorkflowPanel data={data} onRefresh={loadAdminDashboard} /></div>}\n        <DashboardApp activeSection={activeSection} backendData={data ?? undefined} />
      </>
    );
  }

  if (mode === "loading" || mode === "checking_admin") {
    return <main className="admin-auth-screen"><section className="admin-auth-card"><div className="admin-auth-mark">CI</div><p className="admin-auth-kicker">CRYPTOINVEST · CEO WORKSPACE</p><h1>{mode === "loading" ? "Checking secure session" : "Verifying CEO access"}</h1><p className="admin-auth-copy">Checking your authenticated session, MFA level and server-side CEO authorization.</p><div className="admin-spinner" aria-hidden="true" /><p className="admin-auth-footnote">Financial operations are disabled.</p></section></main>;
  }

  if (mode === "mfa") {
    return <main className="admin-auth-screen"><section className="admin-auth-card"><div className="admin-auth-mark">CI</div><p className="admin-auth-kicker">SECOND FACTOR REQUIRED</p><h1>Verify your authenticator</h1><p className="admin-auth-copy">Enter the current six-digit code from your verified authenticator app to continue to the CEO workspace.</p><form onSubmit={handleMfa} className="admin-auth-form"><label htmlFor="admin-otp">Authenticator code</label><input id="admin-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,8}" maxLength={8} value={otp} onChange={(event) => setOtp(event.target.value)} required /><button type="submit" disabled={busy || otp.replace(/\s/g, "").length < 6}>{busy ? "Verifying…" : "Verify and continue"}</button></form>{error && <p className="admin-auth-error" role="alert">{error}</p>}<button className="admin-text-button" type="button" onClick={handleSignOut}>Sign out</button><p className="admin-auth-footnote">A verified CEO account is required; customers cannot self-promote.</p></section></main>;
  }

  return <main className="admin-auth-screen"><section className="admin-auth-card"><div className="admin-auth-mark">CI</div><p className="admin-auth-kicker">CRYPTOINVEST · PROTECTED ACCESS</p><h1>{mode === "config_error" ? "Authentication setup required" : mode === "denied" ? "Admin access is not available" : "Sign in to your workspace"}</h1><p className="admin-auth-copy">{mode === "config_error" ? "The app needs its public Supabase URL and publishable/anon key in the hosting environment." : mode === "denied" ? "Your session could not be authorized as the CEO administrator. No admin actions are available." : "Sign in with the existing account registered for the CEO workspace."}</p>{mode === "signed_out" && <form onSubmit={handleSignIn} className="admin-auth-form"><label htmlFor="admin-email">Email address</label><input id="admin-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /><label htmlFor="admin-password">Password</label><input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}</button></form>}{error && <p className="admin-auth-error" role="alert">{error}</p>}{mode === "denied" && <div className="admin-auth-actions"><button type="button" onClick={handleSignOut}>Sign out and try another account</button><button className="admin-text-button" type="button" onClick={() => { setError(""); setMode("signed_out"); }}>Return to sign-in</button></div>}<div className="admin-auth-safety"><span>✓</span><p><strong>Safety gate active</strong><br />Live deposits, withdrawals, trading and balance changes are disabled.</p></div><p className="admin-auth-footnote">No customer sign-up or role promotion is provided on the admin screen.</p></section></main>;
}
