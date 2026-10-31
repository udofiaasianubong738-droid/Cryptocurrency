"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Factor = {
  id: string;
  friendly_name: string | null;
  status: string;
};

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export default function MfaSetupPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isCeo, setIsCeo] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [currentLevel, setCurrentLevel] = useState<string>("unknown");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [selectedFactorId, setSelectedFactorId] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const refreshStatus = useCallback(async () => {
    setLoading(true);
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
      const { data: ceoRow, error: ceoError } = await supabase
        .from("ceo_admins")
        .select("user_id")
        .eq("user_id", userData.user.id)
        .eq("enabled", true)
        .maybeSingle();

      if (ceoError) throw new Error("Could not verify the CEO account. Access is blocked.");
      if (!ceoRow) {
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

      setFactors(
        factorData.totp.map((factor) => ({
          id: factor.id,
          friendly_name: factor.friendly_name ?? null,
          status: factor.status,
        }))
      );
      setCurrentLevel(aalData.currentLevel ?? "aal1");
    } catch {
      setError("We could not verify this session. Sign in again or contact the system owner.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  async function startEnrollment() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "CryptoInvest CEO authenticator",
      });
      if (enrollError) throw enrollError;

      setEnrollment({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setSelectedFactorId(data.id);
      setCode("");
      setNotice("Scan this QR code with your authenticator app, then enter its current six-digit code.");
    } catch {
      setError("Authenticator setup could not be started. Existing unfinished factors were not changed.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyFactor(factorId: string) {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the six-digit code from your authenticator app.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      const supabase = createClient();
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });
      if (verifyError) throw verifyError;

      await supabase.auth.refreshSession();
      const { data: aalData, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;

      setCode("");
      setEnrollment(null);
      await refreshStatus();

      if (aalData.currentLevel === "aal2") {
        setNotice("Authenticator verified. This session now reports AAL2.");
      } else {
        setNotice("The authenticator was accepted. Refresh or sign in again, then confirm the session reaches AAL2.");
      }
    } catch {
      setError("The code was not accepted. Check the authenticator clock and try a new current code.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="auth-welcome-shell">
        <section className="auth-login-card"><p>Checking your secure session…</p></section>
      </main>
    );
  }

  return (
    <main className="auth-welcome-shell">
      <section className="auth-login-card mfa-setup-card">
        <Link href="/login" className="auth-back-link">← Back to sign in</Link>
        <span className="auth-eyebrow">CRYPTOINVEST SECURITY</span>
        <h1>Authenticator setup</h1>
        <p className="auth-welcome-copy">
          This page only manages the signed-in account’s authenticator. Admin access still requires CEO authorization and an AAL2 session.
        </p>

        {!signedIn ? (
          <div className="auth-setup-warning">
            <strong>Sign-in required</strong>
            <p>Sign in with the authorized CEO account first. This page does not create accounts or accept customer access.</p>
          </div>
        ) : !isCeo ? (
          <div className="auth-setup-warning">
            <strong>CEO authorization not confirmed</strong>
            <p>Setup is blocked because this signed-in account is not confirmed as the enabled CEO account.</p>
          </div>
        ) : (
          <>
            <div className="mfa-status-row">
              <span>Current session assurance</span>
              <strong>{currentLevel.toUpperCase()}</strong>
            </div>

            <h2 className="mfa-section-heading">Existing authenticator factors</h2>
            {factors.length === 0 ? (
              <p className="mfa-muted">No authenticator factors were returned for this account.</p>
            ) : (
              <ul className="mfa-factor-list">
                {factors.map((factor) => (
                  <li key={factor.id}>
                    <span>
                      <strong>{factor.friendly_name || "Authenticator"}</strong>
                      <small>{factor.status === "verified" ? "Verified" : "Unfinished setup"}</small>
                    </span>
                    {factor.status === "unverified" ? (
                      <button
                        type="button"
                        className="mfa-secondary-button"
                        disabled={busy}
                        onClick={() => {
                          setSelectedFactorId(factor.id);
                          setEnrollment(null);
                          setCode("");
                          setError("");
                          setNotice("Enter a current code from the authenticator app originally paired with this unfinished setup.");
                        }}
                      >
                        Continue setup
                      </button>
                    ) : (
                      <span className="mfa-verified-label">Verified</span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {selectedFactorId && (
              <div className="mfa-verify-panel">
                {enrollment ? (
                  <>
                    <p className="mfa-muted">Scan the QR code using your authenticator app. Keep this screen private.</p>
                    <img className="mfa-qr-code" src={enrollment.qrCode} alt="Authenticator setup QR code" />
                    <details className="mfa-secret-details">
                      <summary>Show manual setup key</summary>
                      <code>{enrollment.secret}</code>
                      <p>Anyone with this key can generate your authenticator codes. Do not share it or save it in a public place.</p>
                    </details>
                  </>
                ) : (
                  <p className="mfa-muted">Use the authenticator app already paired with this unfinished factor. If its original setup key is unavailable, leave this record untouched and start a separate setup below.</p>
                )}
                <label className="auth-field-label" htmlFor="mfa-code">Six-digit authenticator code</label>
                <input
                  id="mfa-code"
                  className="auth-field"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <button
                  type="button"
                  className="auth-primary-button"
                  disabled={busy || code.length !== 6}
                  onClick={() => void verifyFactor(selectedFactorId)}
                >
                  {busy ? "Verifying…" : "Verify authenticator"}
                </button>
                <button
                  type="button"
                  className="mfa-text-button"
                  disabled={busy}
                  onClick={() => {
                    setEnrollment(null);
                    setSelectedFactorId("");
                    setCode("");
                    setNotice("");
                    setError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {!enrollment && (
              <button
                type="button"
                className="auth-primary-button mfa-start-button"
                disabled={busy}
                onClick={() => void startEnrollment()}
              >
                {busy ? "Starting setup…" : "Start a new authenticator setup"}
              </button>
            )}
            <p className="mfa-muted mfa-warning">
              Unfinished factors are never automatically deleted. Verifying a new factor may sign out other active sessions; keep your account recovery method available.
            </p>
          </>
        )}

        {error && <p className="mfa-error" role="alert">{error}</p>}
        {notice && <p className="mfa-notice" role="status">{notice}</p>}
        <p className="auth-footnote">Financial operations remain disabled. MFA setup does not enable deposits, withdrawals, trading, or payouts.</p>
      </section>
    </main>
  );
}
