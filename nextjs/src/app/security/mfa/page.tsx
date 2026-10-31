"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; friendly_name: string | null; status: string };
type Enrollment = { qrCode: string; secret: string };

export default function MfaSetupPage() {
  const router = useRouter();
  const [safeNext, setSafeNext] = useState("/overview");
  useEffect(() => {
    const requestedNext = new URLSearchParams(window.location.search).get("next");
    if (requestedNext?.startsWith("/") && !requestedNext.startsWith("//")) setSafeNext(requestedNext);
  }, []);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isCeo, setIsCeo] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [currentLevel, setCurrentLevel] = useState("unknown");
  const [selectedFactorId, setSelectedFactorId] = useState("");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const refreshStatus = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) {
        setSignedIn(false);
        setIsCeo(false);
        setFactors([]);
        return;
      }

      setSignedIn(true);
      const { data: ceo, error: ceoError } = await supabase
        .from("ceo_admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .eq("enabled", true)
        .maybeSingle();

      if (ceoError) throw ceoError;
      if (!ceo) {
        setIsCeo(false);
        setFactors([]);
        return;
      }

      setIsCeo(true);
      const [{ data: factorData, error: factorError }, { data: aalData, error: aalError }] =
        await Promise.all([
          supabase.auth.mfa.listFactors(),
          supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        ]);
      if (factorError) throw factorError;
      if (aalError) throw aalError;

      setFactors(factorData.totp.map((factor) => ({
        id: factor.id,
        friendly_name: factor.friendly_name ?? null,
        status: factor.status,
      })));
      setCurrentLevel(aalData.currentLevel ?? "aal1");
    } catch {
      setError("We could not verify this session. Sign in again or contact the system owner.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => { void refreshStatus(); }, [refreshStatus]);

  async function startEnrollment() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `CryptoInvest CEO authenticator ${new Date().toISOString()}`,
      });
      if (enrollError) throw enrollError;
      setEnrollment({ qrCode: data.totp.qr_code, secret: data.totp.secret });
      setSelectedFactorId(data.id);
      setCode("");
      setNotice("Scan this QR code with your authenticator app, then enter its current six-digit code.");
      await refreshStatus(false);
    } catch {
      setError("Authenticator setup could not be started. Existing unfinished factors were not changed.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyFactor() {
    if (!selectedFactorId || !/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your authenticator app.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: selectedFactorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: selectedFactorId,
        challengeId: challenge.id,
        code,
      });
      if (verifyError) throw verifyError;

      const { data: assurance, error: assuranceError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) throw assuranceError;

      setCode("");
      setSelectedFactorId("");
      setEnrollment(null);
      await refreshStatus(false);

      if (assurance.currentLevel === "aal2") {
        setCurrentLevel("aal2");
        setNotice("Authenticator verified. Supabase confirms this session is now AAL2.");
      } else {
        setNotice("The code was accepted, but this session has not yet reached AAL2. Refresh and verify the session before entering the dashboard.");
      }
    } catch {
      setError("The code was not accepted. Check the authenticator clock and enter a new current code.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await createClient().auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  if (loading) {
    return <main className="auth-welcome-shell"><section className="auth-login-card"><p>Checking your secure session…</p></section></main>;
  }

  return (
    <main className="auth-welcome-shell">
      <section className="auth-login-card mfa-setup-card">
        <Link href="/login" className="auth-back-link">← Back to sign in</Link>
        <span className="auth-eyebrow">CRYPTOINVEST SECURITY</span>
        <h1>Authenticator verification</h1>
        <p className="auth-welcome-copy">Only the signed-in, enabled CEO account can manage this authenticator. The admin dashboard requires AAL2.</p>

        {!signedIn ? (
          <div className="auth-setup-warning"><strong>Sign-in required</strong><p>Sign in with the authorized CEO account first. Customer accounts cannot use this setup screen.</p></div>
        ) : !isCeo ? (
          <div className="auth-setup-warning"><strong>CEO authorization not confirmed</strong><p>Setup is blocked because this signed-in account is not the enabled CEO account.</p></div>
        ) : (
          <>
            <div className="mfa-status-row"><span>Current session assurance</span><strong>{currentLevel.toUpperCase()}</strong></div>
            {currentLevel === "aal2" ? (
              <button type="button" className="auth-primary-button" onClick={() => router.replace(safeNext)}>Continue to CEO dashboard</button>
            ) : null}

            <h2 className="mfa-section-heading">Authenticator factors</h2>
            {factors.length === 0 ? <p className="mfa-muted">No authenticator factors are currently registered.</p> : (
              <ul className="mfa-factor-list">
                {factors.map((factor) => (
                  <li key={factor.id}>
                    <span><strong>{factor.friendly_name || "Authenticator"}</strong><small>{factor.status === "verified" ? "Verified factor" : "Unfinished setup"}</small></span>
                    <button type="button" className="mfa-secondary-button" disabled={busy} onClick={() => {
                      setSelectedFactorId(factor.id);
                      setEnrollment(null);
                      setCode("");
                      setError("");
                      setNotice(factor.status === "verified" ? "Enter the current code from this verified authenticator." : "Continue with the authenticator originally paired with this unfinished setup.");
                    }}>{factor.status === "verified" ? "Verify" : "Continue setup"}</button>
                  </li>
                ))}
              </ul>
            )}

            {selectedFactorId ? (
              <div className="mfa-verify-panel">
                {enrollment ? (
                  <>
                    <p className="mfa-muted">Scan this QR code with your authenticator app. Keep this screen private.</p>
                    <img className="mfa-qr-code" src={enrollment.qrCode} alt="Authenticator setup QR code" />
                    <details className="mfa-secret-details"><summary>Show manual setup key</summary><code>{enrollment.secret}</code><p>Anyone with this key can generate your codes. Never share it.</p></details>
                  </>
                ) : <p className="mfa-muted">Use the authenticator app paired with the selected factor. If an unfinished factor's original setup key is unavailable, leave it unchanged and ask the system owner to review the recovery options.</p>}
                <label className="auth-field-label" htmlFor="mfa-code">Six-digit authenticator code</label>
                <input id="mfa-code" className="auth-field" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
                <button type="button" className="auth-primary-button" disabled={busy || code.length !== 6} onClick={() => void verifyFactor()}>{busy ? "Verifying…" : "Verify authenticator"}</button>
                <button type="button" className="mfa-text-button" disabled={busy} onClick={() => { setSelectedFactorId(""); setEnrollment(null); setCode(""); setNotice(""); setError(""); }}>Cancel</button>
              </div>
            ) : null}

            {!selectedFactorId && currentLevel !== "aal2" ? (
              <button type="button" className="auth-primary-button mfa-start-button" disabled={busy} onClick={() => void startEnrollment()}>{busy ? "Starting setup…" : "Start a new authenticator setup"}</button>
            ) : null}
            <p className="mfa-muted mfa-warning">Unfinished factors are not automatically deleted. No existing MFA record is changed by this screen. Financial operations remain disabled.</p>
          </>
        )}

        {error ? <p className="mfa-error" role="alert">{error}</p> : null}
        {notice ? <p className="mfa-notice" role="status">{notice}</p> : null}
        <button type="button" className="mfa-text-button" disabled={busy} onClick={() => void signOut()}>Sign out</button>
        <p className="auth-footnote">Never share your authenticator code or setup key. MFA does not enable deposits, withdrawals, trading or payouts.</p>
      </section>
    </main>
  );
}
