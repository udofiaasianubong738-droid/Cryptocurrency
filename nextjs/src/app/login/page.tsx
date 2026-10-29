"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function Brand(){return <span className="brand-lockup"><span className="brand-mark" aria-hidden="true"><span/></span><span className="brand-name">Crypto<span>Invest</span></span></span>}

type Mode = "password" | "challenge" | "enroll";
export default function LoginPage(){
 const [email,setEmail]=useState("cyrrenza@outlook.com");
 const [password,setPassword]=useState("");
 const [code,setCode]=useState("");
 const [mode,setMode]=useState<Mode>("password");
 const [factorId,setFactorId]=useState("");
 const [challengeId,setChallengeId]=useState("");
 const [qrCode,setQrCode]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const router=useRouter();
 const searchParams=useSearchParams();
 const reason=searchParams.get("reason");
 const configurationError=reason==="configuration"?"This deployment is missing its Supabase public URL or publishable key.":reason==="unauthorized"?"This account is not authorized for the CEO workspace.":reason==="mfa"?"Complete authenticator verification to continue.":reason==="callback"?"The secure sign-in callback failed. Please sign in again.":"";

 async function handlePassword(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault(); setBusy(true); setMessage("");
  try{
   const supabase=createClient();
   const {data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
   if(error||!data.user) throw new Error("Sign-in failed. Check your email and password.");
   const {data:role,error:roleError}=await supabase.from("ceo_admins").select("enabled").eq("user_id",data.user.id).eq("enabled",true).maybeSingle();
   if(roleError||!role?.enabled){await supabase.auth.signOut();throw new Error("This account is not enabled for CEO administration.");}
   const {data:factors,error:factorError}=await supabase.auth.mfa.listFactors();
   if(factorError) throw new Error("Could not check authenticator setup. Please try again.");
   const verified=(factors.totp||[]).find(f=>f.status==="verified");
   if(verified){
    const {data:challenge,error:challengeError}=await supabase.auth.mfa.challenge({factorId:verified.id});
    if(challengeError||!challenge) throw new Error("Could not start authenticator verification.");
    setFactorId(verified.id); setChallengeId(challenge.id); setMode("challenge");
    setMessage("Enter the current code from your authenticator app.");
   }else{
    const {data:enrollment,error:enrollError}=await supabase.auth.mfa.enroll({factorType:"totp",friendlyName:"CryptoInvest CEO authenticator"});
    if(enrollError||!enrollment) throw new Error("Could not start authenticator enrollment. Please try again.");
    const {data:challenge,error:challengeError}=await supabase.auth.mfa.challenge({factorId:enrollment.id});
    if(challengeError||!challenge) throw new Error("Authenticator setup started, but verification could not be started. Try again.");
    setFactorId(enrollment.id); setChallengeId(challenge.id); setQrCode(enrollment.totp.qr_code); setMode("enroll");
    setMessage("Scan this QR code with your authenticator app, then enter the six-digit code.");
   }
  }catch(err){setMessage(err instanceof Error?err.message:"Unable to sign in right now.");}
  finally{setBusy(false);}
 }
 async function handleCode(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault(); setBusy(true); setMessage("");
  try{
   const supabase=createClient();
   const {error}=await supabase.auth.mfa.verify({factorId,challengeId,code:code.trim()});
   if(error) throw new Error("That authenticator code was not accepted. Check the code and try again.");
   const {data:{user}}=await supabase.auth.getUser();
   if(!user) throw new Error("Your session expired. Please sign in again.");
   const {data:role,error:roleError}=await supabase.from("ceo_admins").select("enabled").eq("user_id",user.id).eq("enabled",true).maybeSingle();
   const {data:assurance,error:assuranceError}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
   if(roleError||!role?.enabled||assuranceError||assurance?.currentLevel!=="aal2") throw new Error("CEO authorization or MFA assurance could not be verified.");
   router.replace("/"); router.refresh();
  }catch(err){setMessage(err instanceof Error?err.message:"Authenticator verification failed.");}
  finally{setBusy(false);}
 }
 async function restart(){try{await createClient().auth.signOut();}catch{} setPassword("");setCode("");setMode("password");setFactorId("");setChallengeId("");setQrCode("");setMessage("");}
 return <main className="auth-welcome-shell"><section className="auth-login-card"><Brand/><span className="auth-eyebrow">CEO ADMINISTRATION</span><h1>{mode==="password"?"Sign in securely":mode==="enroll"?"Set up your authenticator":"Verify your identity"}</h1><p className="auth-welcome-copy">Only the authorized CEO account can enter this workspace. There is no public account-creation option.</p>
 {configurationError&&<div className="auth-setup-warning" role="alert"><strong>Configuration required</strong><p>{configurationError}</p></div>}
 {mode==="password"?<form onSubmit={handlePassword}><label className="auth-field-label" htmlFor="ceo-email">CEO email</label><input className="auth-field" id="ceo-email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/><label className="auth-field-label" htmlFor="ceo-password">Password</label><input className="auth-field" id="ceo-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="auth-primary-button" type="submit" disabled={busy}>{busy?"Checking securely…":"Continue securely"}</button></form>:<form onSubmit={handleCode}>{mode==="enroll"&&qrCode&&<div className="auth-qr-wrap"><img src={qrCode} alt="Authenticator enrollment QR code"/><p>Keep this QR code private. Do not send it to anyone.</p></div>}<label className="auth-field-label" htmlFor="ceo-code">Six-digit authenticator code</label><input className="auth-field" id="ceo-code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} required/><button className="auth-primary-button" type="submit" disabled={busy||code.length!==6}>{busy?"Verifying…":mode==="enroll"?"Verify and finish setup":"Verify and sign in"}</button><button className="auth-secondary-button" type="button" onClick={restart} disabled={busy}>Cancel and sign out</button></form>}
 {message&&<p className="auth-status-message" role="status" aria-live="polite">{message}</p>}
 <div className="auth-flow-steps"><span className={mode==="password"?"auth-step-active":""}>1&nbsp; Email &amp; password</span><span className={mode!=="password"?"auth-step-active":""}>2&nbsp; Authenticator</span></div><p className="auth-footnote">Never share your password, QR code, authenticator secret or one-time code. Financial operations remain disabled.</p></section><footer className="auth-welcome-footer">© {new Date().getFullYear()} CryptoInvest · Financial operations disabled</footer></main>
}
