"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Stage = "password" | "mfa" | "enroll";
function Brand(){return <span className="brand-lockup"><span className="brand-mark" aria-hidden="true"><span/></span><span className="brand-name">Crypto<span>Invest</span></span></span>}

export default function LoginPage(){
 const router=useRouter();
 const [email,setEmail]=useState("Cyrrenza@outlook.com");
 const [password,setPassword]=useState("");
 const [code,setCode]=useState("");
 const [stage,setStage]=useState<Stage>("password");
 const [factorId,setFactorId]=useState("");
 const [qr,setQr]=useState("");
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 const supabase=createClient();

 async function prepareMfa(){
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user){setStage("password");return;}
  const {data:ceo,error:ceoError}=await supabase.from("ceo_admins").select("user_id").eq("user_id",user.id).eq("enabled",true).maybeSingle();
  if(ceoError||!ceo){await supabase.auth.signOut();setMessage("This account is not authorized for CEO administration.");setStage("password");return;}
  const {data:aal}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if(aal?.currentLevel==="aal2"){router.replace("/");return;}
  const {data:factors,error:factorError}=await supabase.auth.mfa.listFactors();
  if(factorError)throw factorError;
  const verified=factors?.totp?.find(f=>f.status==="verified");
  if(verified){setFactorId(verified.id);setStage("mfa");return;}
  // Remove only this signed-in CEO user's unfinished TOTP enrollments before
  // starting a fresh setup. Use Supabase Auth rather than editing auth tables.
  const pending=factors?.totp?.filter(f=>f.status!=="verified") ?? [];
  for(const factor of pending){
   const {error:removeError}=await supabase.auth.mfa.unenroll({factorId:factor.id});
   if(removeError)throw new Error("Could not clear an unfinished authenticator setup. Please sign out and contact support.");
  }
  const {data:enrolled,error:enrollError}=await supabase.auth.mfa.enroll({factorType:"totp",friendlyName:"CryptoInvest CEO authenticator"});
  if(enrollError||!enrolled)throw enrollError||new Error("Could not start authenticator setup.");
  setFactorId(enrolled.id);setQr(enrolled.totp.qr_code);setStage("enroll");
 }

 useEffect(()=>{prepareMfa().catch(err=>setMessage(err instanceof Error?err.message:"Could not check the current session."));},[]);

 async function signIn(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage("");
  try{
   const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
   if(error)throw error;
   await prepareMfa();
  }catch(err){setMessage(err instanceof Error?err.message:"Sign-in failed.");}
  finally{setBusy(false);}
 }
 async function verify(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage("");
  try{
   const {data:challenge,error:challengeError}=await supabase.auth.mfa.challenge({factorId});
   if(challengeError||!challenge)throw challengeError||new Error("Could not start MFA challenge.");
   const {error}=await supabase.auth.mfa.verify({factorId,challengeId:challenge.id,code:code.trim()});
   if(error)throw error;
   const {data:aal}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
   if(aal?.currentLevel!=="aal2")throw new Error("MFA was not elevated to AAL2. Please try again.");
   router.replace("/");
  }catch(err){setMessage(err instanceof Error?err.message:"Authenticator verification failed.");}
  finally{setBusy(false);}
 }
 async function verifyEnrollment(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage("");
  try{
   const {data:challenge,error:challengeError}=await supabase.auth.mfa.challenge({factorId});
   if(challengeError||!challenge)throw challengeError||new Error("Could not start authenticator challenge.");
   const {error}=await supabase.auth.mfa.verify({factorId,challengeId:challenge.id,code:code.trim()});
   if(error)throw error;
   const {data:aal}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
   if(aal?.currentLevel!=="aal2")throw new Error("Authenticator enrollment did not reach AAL2.");
   router.replace("/");
  }catch(err){setMessage(err instanceof Error?err.message:"Could not verify authenticator setup.");}
  finally{setBusy(false);}
 }
 async function signOut(){await supabase.auth.signOut();setStage("password");setCode("");setQr("");setFactorId("");setMessage("Signed out.");}

 return <main className="auth-welcome-shell"><section className="auth-login-card"><Link href="/" className="auth-back-link">← Welcome screen</Link><Brand/><span className="auth-eyebrow">CEO ADMINISTRATION</span><h1>{stage==="password"?"Sign in securely":stage==="enroll"?"Set up authenticator":"Verify authenticator"}</h1><p className="auth-welcome-copy">Only the enabled CEO account can access this workspace. Authenticator verification is required for AAL2 access.</p>
 {stage==="password"?<form onSubmit={signIn}><label className="auth-field-label" htmlFor="ceo-email">CEO email</label><input className="auth-field" id="ceo-email" type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/><label className="auth-field-label" htmlFor="ceo-password">Password</label><input className="auth-field" id="ceo-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button className="auth-primary-button" type="submit" disabled={busy}>{busy?"Signing in…":"Continue securely"}</button></form>:<form onSubmit={stage==="enroll"?verifyEnrollment:verify}>{stage==="enroll"&&qr?<div className="auth-setup-warning"><strong>Scan this QR code privately</strong><p>Use your authenticator app, then enter its current six-digit code below.</p><img alt="Authenticator setup QR code" src={qr} style={{display:"block",width:"min(100%,260px)",margin:"16px auto",background:"#fff",padding:12,borderRadius:10}}/></div>:null}<label className="auth-field-label" htmlFor="totp-code">Authenticator code</label><input className="auth-field" id="totp-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} required/><button className="auth-primary-button" type="submit" disabled={busy||code.length!==6}>{busy?"Verifying…":"Verify and continue"}</button><button className="auth-primary-button" type="button" onClick={signOut} style={{background:"#eef2f7",color:"#344761",marginTop:8}}>Cancel and sign out</button></form>}
 {message?<p role="alert" className="auth-setup-warning">{message}</p>:null}
 <p className="auth-footnote">Never share your password, QR code, authenticator secret or one-time code. Financial operations remain disabled.</p></section><footer className="auth-welcome-footer">© {new Date().getFullYear()} CryptoInvest · Financial operations disabled</footer></main>
}
