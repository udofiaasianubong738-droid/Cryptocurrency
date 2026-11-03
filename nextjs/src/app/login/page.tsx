"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

function Brand(){return <span className="brand-lockup"><span className="brand-mark" aria-hidden="true"><span/></span><span className="brand-name">Crypto<span>Invest</span></span></span>}

type Mode = "password" | "totp" | "enroll";

export default function LoginPage(){
 const router = useRouter();
 const [email,setEmail]=useState("Cyrrenza@outlook.com");
 const [password,setPassword]=useState("");
 const [code,setCode]=useState("");
 const [mode,setMode]=useState<Mode>("password");
 const [factorId,setFactorId]=useState("");
 const [qrCode,setQrCode]=useState("");
 const [secret,setSecret]=useState("");
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");

 async function startMfa(client: ReturnType<typeof createSupabaseBrowserClient>) {
  const { data: factors, error: factorsError } = await client.auth.mfa.listFactors();
  if (factorsError) throw factorsError;
  const verified = factors.totp.find((factor) => factor.status === "verified");
  if (verified) {
   setFactorId(verified.id);
   setMode("totp");
   setNotice("Enter the current six-digit code from your verified authenticator app.");
   return;
  }
  const { data, error: enrollError } = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "CryptoInvest CEO authenticator" });
  if (enrollError) throw enrollError;
  setFactorId(data.id);
  setQrCode(data.totp.qr_code);
  setSecret(data.totp.secret);
  setMode("enroll");
  setNotice("Scan this fresh QR code with your authenticator app, then enter its six-digit code to verify enrollment.");
 }

 async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  setBusy(true); setError(""); setNotice("");
  const nextPath = new URLSearchParams(window.location.search).get("next");
  const destination = nextPath && (nextPath.startsWith("/admin") || nextPath.startsWith("/dashboard")) ? nextPath : "/";
  try {
   const client=createSupabaseBrowserClient();
   if (mode === "password") {
    const { error: signInError } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) throw signInError;
    await startMfa(client);
   } else if (mode === "enroll") {
    const { error: verifyError } = await client.auth.mfa.verify({ factorId, code: code.trim() });
    if (verifyError) throw verifyError;
    setNotice("Authenticator verified. Checking CEO authorization and session assurance…");
    const { data: assurance, error: assuranceError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) throw assuranceError;
    if (assurance.currentLevel !== "aal2") throw new Error("Authenticator verification did not establish AAL2. Sign in again and complete the MFA challenge.");
    router.replace(destination); router.refresh();
   } else {
    const { error: challengeError } = await client.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    if (challengeError) throw challengeError;
    const { data: assurance, error: assuranceError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) throw assuranceError;
    if (assurance.currentLevel !== "aal2") throw new Error("The session did not reach AAL2. Access remains blocked.");
    router.replace(destination); router.refresh();
   }
  } catch (e) {
   setError(e instanceof Error ? e.message : "Sign-in could not be completed. Check the Supabase configuration and try again.");
  } finally { setBusy(false); }
 }

 return <main className="auth-welcome-shell"><section className="auth-login-card"><Link href="/" className="auth-back-link">← Welcome screen</Link><Brand/><span className="auth-eyebrow">CEO ADMINISTRATION</span><h1>{mode==="password"?"Sign in securely":mode==="enroll"?"Set up authenticator":"Verify authenticator"}</h1><p className="auth-welcome-copy">Only the enabled CEO account can access administration. Authenticator verification is required for privileged routes.</p>
 {error && <div className="auth-setup-warning" role="alert"><strong>Sign-in failed</strong><p>{error}</p></div>}
 {notice && <p role="status" className="auth-welcome-copy">{notice}</p>}
 {mode==="enroll" && <div className="auth-setup-warning"><strong>Scan this QR code</strong>{qrCode ? <img src={qrCode} alt="Fresh CryptoInvest TOTP enrollment QR code" width="220" height="220" style={{display:"block",maxWidth:"100%",margin:"16px auto",background:"#fff",padding:8}}/> : null}<p>If scanning is unavailable, enter this secret manually into your authenticator app:</p><code style={{overflowWrap:"anywhere"}}>{secret}</code></div>}
 <form onSubmit={handleSubmit}>
 {mode==="password" ? <><label className="auth-field-label" htmlFor="ceo-email">CEO email</label><input className="auth-field" id="ceo-email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/><label className="auth-field-label" htmlFor="ceo-password">Password</label><input className="auth-field" id="ceo-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></> : <><label className="auth-field-label" htmlFor="totp-code">Six-digit authenticator code</label><input className="auth-field" id="totp-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} required/></>}
 <button className="auth-primary-button" type="submit" disabled={busy}>{busy?"Please wait…":mode==="password"?"Continue securely":mode==="enroll"?"Verify authenticator":"Verify and sign in"}</button>
 </form>
 {mode!=="password" && <button className="auth-back-link" type="button" onClick={()=>{setMode("password");setCode("");setQrCode("");setSecret("");setFactorId("");setNotice("");setError("");}}>Back to sign in</button>}
 <div className="auth-setup-warning"><strong>Security checks</strong><p>Supabase manages the session cookies. Privileged routes separately verify the authenticated user, enabled CEO authorization, and AAL2 on the server. Financial operations remain disabled.</p></div>
 <p className="auth-footnote">Never share your password or authenticator code. If an existing factor is unverified, this flow enrolls a fresh factor and requires verification before continuing.</p></section><footer className="auth-welcome-footer">© {new Date().getFullYear()} CryptoInvest · Financial operations disabled</footer></main>
}
