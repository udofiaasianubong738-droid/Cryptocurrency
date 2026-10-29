"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const screens = [
  ["overview","Overview","A calm, clear view of platform readiness.","⌂","Workspace"],
  ["customers","Customers","Customer access and profile review.","♙","Workspace"],
  ["deposits","Deposit requests","Incoming-funds requests and evidence review.","↓","Operations"],
  ["withdrawals","Withdrawal requests","Payout requests and verification status.","↑","Operations"],
  ["plans","Investment plans","Plan information and publication readiness.","◇","Operations"],
  ["portfolio","Portfolio","Investment visibility and account summaries.","▥","Operations"],
  ["orders","Orders","Order lifecycle and provider readiness.","⇄","Operations"],
  ["reports","Reports","Operational summaries from verified data.","▤","Insights"],
  ["ledger","Ledger","Accounting records and balances.","≋","Controls"],
  ["reconciliation","Reconciliation","Compare provider activity with internal records.","⟳","Controls"],
  ["audit","Audit trail","Security and administrative events.","◷","Controls"],
  ["integrations","Integrations","Backend and provider connection status.","⌘","Controls"],
  ["security","Security","Access controls and production safety gates.","⬡","Controls"],
  ["customer-portal","Customer portal","Customer-facing experience preview.","◎","Portal"],
] as const;
type ScreenId = typeof screens[number][0];
const setup = [
  ["Confirm the authoritative backend","Identify the correct Supabase project and compare its schema.","Needs review"],
  ["Verify authentication and CEO access","Enforce server-side roles and MFA before privileged access.","Not started"],
  ["Validate ledger and reconciliation","Verify idempotency, balances, audit history and provider records.","Not started"],
  ["Complete accessibility and device checks","Review keyboard use, contrast, mobile layouts and system theme.","In progress"],
] as const;
const descriptions: Record<string,string> = {
 customers:"Customer lists and account details appear only after real authentication and verified records are connected.",
 deposits:"Payment evidence and provider confirmations will be shown here. Approval controls are intentionally unavailable.",
 withdrawals:"Requests require balance validation, protected approvals and a complete audit trail before this screen is active.",
 plans:"Plan terms and eligibility must come from the verified backend. No returns are estimated in this preview.",
 portfolio:"Balances and performance must come from verified ledger records, not browser-side calculations.",
 orders:"Order history appears after provider integration and idempotent processing are verified.",
 reports:"Reports will be generated from validated platform data. No sample performance figures are displayed.",
 ledger:"Ledger entries must be read from the authoritative backend and reconciled before being treated as financial truth.",
 reconciliation:"Provider transactions and internal ledger entries will be compared after integrations are independently verified.",
 audit:"Administrative actions, timestamps and actors will be recorded in the verified audit trail.",
 integrations:"Connection health will be confirmed from real server-side checks. No provider is claimed as connected.",
};
type LiveQuote = { symbol:string; name:string; provider:string; price:string|number; change24hPct:string|number|null; quoteCurrency:string|null; receivedAt:string; sourceTimestamp:string|null; delayed:boolean };
type DashboardLiveData = { fetchedAt:string; latestQuoteAt:string|null; counts:{customers:number;activePlans:number;pendingDeposits:number;pendingWithdrawals:number}; quotes:LiveQuote[]; providers:{provider:string;status:string;last_success_at:string|null;last_error_at:string|null;latency_ms:number|null;updated_at:string|null}[] };
function Brand(){return <span className="brand-lockup"><span className="brand-mark" aria-hidden="true"><span/></span><span className="brand-name">Crypto<span>Invest</span></span></span>}
function SafetyNotice(){return <section className="safety-notice" aria-label="Financial operations status"><span className="safety-icon" aria-hidden="true">✓</span><div className="safety-copy"><strong>Protected preview · financial operations are disabled</strong><p>No deposits, withdrawals, trades, approvals or balance changes can be performed here.</p></div><span className="status-pill status-locked">Locked</span></section>}
function EmptyState({title,detail}:{title:string;detail:string}){return <div className="empty-state"><span className="empty-orbit" aria-hidden="true">◇</span><h3>{title}</h3><p>{detail}</p><span className="empty-note">No sample financial records are shown</span></div>}
function Overview({live}:{live:DashboardLiveData|null}){
 const latest = live?.latestQuoteAt ? new Date(live.latestQuoteAt) : null;
 const isFresh = latest ? Date.now()-latest.getTime() < 15*60*1000 : false;
 return <>
  <div className="metric-grid">
   {[
    ["Customer accounts",live?String(live.counts.customers):"—",live?"Live database count":"Waiting for secure connection","♙"],
    ["Published plans",live?String(live.counts.activePlans):"—",live?"Active plans from Supabase":"Waiting for secure connection","◇"],
    ["Requests to review",live?String(live.counts.pendingDeposits+live.counts.pendingWithdrawals):"—",live?live.counts.pendingDeposits+" deposits · "+live.counts.pendingWithdrawals+" withdrawals":"Waiting for secure connection","◷"],
    ["Market feed",live?String(live.quotes.length):"—",live?(isFresh?"Latest quote within 15 minutes":"No fresh quote in last 15 minutes"):"Waiting for secure connection","⬡"]
   ].map(([label,value,note,icon])=><article className="metric-card" key={label}><div className="metric-top"><span>{label}</span><span className="metric-icon" aria-hidden="true">{icon}</span></div><div className="metric-value">{value}</div><p>{note}</p></article>)}
  </div>
  <section className="surface-card live-market-card">
   <div className="section-title-row"><div><p className="section-kicker">LIVE READ-ONLY FEED</p><h2>Latest market quotes</h2><p className="section-description">Values are read from the Supabase market quote tables. They are informational and do not trigger trades.</p></div><span className={isFresh?"status-pill status-live":"status-pill status-pending"}>{live?(isFresh?"Feed recent":"Feed may be stale"):"Waiting for backend"}</span></div>
   {!live?<div className="empty-state"><h3>Market data unavailable</h3><p>The authenticated read-only endpoint has not returned data yet. No sample values are substituted.</p></div>:live.quotes.length===0?<div className="empty-state"><h3>No quotes returned</h3><p>The backend responded, but there are no enabled assets with quotes to display.</p></div>:<div className="live-quotes-list">{live.quotes.map(q=><div className="live-quote-row" key={q.symbol}><div className="live-quote-asset"><strong>{q.symbol}</strong><span>{q.name}</span></div><div className="live-quote-price"><strong>{Number(q.price).toLocaleString(undefined,{maximumFractionDigits:8})} {q.quoteCurrency||""}</strong><span>{q.provider}{q.delayed?" · delayed":""}</span></div><span className={Number(q.change24hPct)>=0?"quote-change quote-up":"quote-change quote-down"}>{q.change24hPct===null?"—":Number(q.change24hPct).toFixed(2)+"%"}</span><span className="live-quote-time">{new Date(q.receivedAt).toLocaleTimeString()}</span></div>)}</div>}
   <p className="live-market-footnote">Last quote received: {latest?latest.toLocaleString():"not available"} · Auto-refresh every 60 seconds · Data freshness is not guaranteed.</p>
  </section>
  <div className="content-grid overview-grid">
   <section className="surface-card"><div className="section-title-row"><div><p className="section-kicker">PLATFORM CONTENT</p><h2>Investment plans</h2><p className="section-description">A clean overview, ready for verified plan data.</p></div><Link className="text-link" href="/plans">View plans →</Link></div><EmptyState title="Plans will appear here" detail="Verify the authoritative backend before displaying plan terms or account values."/></section>
   <section className="surface-card"><div className="section-title-row"><div><p className="section-kicker">BEFORE GO-LIVE</p><h2>Readiness checklist</h2><p className="section-description">Safeguards required for a trustworthy platform.</p></div><span className="count-badge">04</span></div><ol className="readiness-list">{setup.map((step,i)=><li key={step[0]}><span className="step-number">{String(i+1).padStart(2,"0")}</span><div className="step-copy"><strong>{step[0]}</strong><p>{step[1]}</p><span className={i===3?"status-pill status-progress":"status-pill status-pending"}>{step[2]}</span></div></li>)}</ol></section>
  </div>
  <section className="surface-card quick-links"><div className="section-title-row"><div><p className="section-kicker">QUICK ACCESS</p><h2>Move around your workspace</h2></div><p className="section-description">All screens are available from the screen menu.</p></div><div className="quick-link-grid">{screens.filter(s=>["deposits","withdrawals","ledger","security"].includes(s[0])).map(s=><Link className="quick-link" href={`/${s[0]}`} key={s[0]}><span className="quick-link-icon" aria-hidden="true">{s[3]}</span><span><strong>{s[1]}</strong><small>{s[2]}</small></span><span className="quick-arrow" aria-hidden="true">↗</span></Link>)}</div></section>
 </>;
}
function Content({id,label,icon,live}:{id:string;label:string;icon:string;live:DashboardLiveData|null}){
 if(id==="overview")return <Overview live={live}/>;
 if(id==="security")return <div className="content-grid detail-grid"><section className="surface-card"><p className="section-kicker">ACCESS CONTROL</p><h2>Identity and permissions</h2><p className="section-description">Production access remains blocked until backend verification.</p><div className="detail-list">{["CEO-only administration","Multi-factor authentication","Customer role isolation"].map(x=><div key={x}><span>{x}</span><span className="status-pill status-pending">Needs verification</span></div>)}</div></section><section className="surface-card"><p className="section-kicker">PRODUCTION GATE</p><h2>Financial controls</h2><div className="gate-state"><span aria-hidden="true">✓</span><div><strong>Financial operations disabled</strong><p>This must remain off until independent verification is complete.</p></div></div><p className="section-description">No control on this preview can enable live financial operations.</p></section></div>;
 if(id==="customer-portal")return <section className="surface-card customer-preview"><div className="customer-preview-hero"><span className="preview-eyebrow">CUSTOMER EXPERIENCE</span><h2>A clearer way to follow your account</h2><p>Customers can view verified plan information, track account activity and submit requests after secure sign-in is implemented.</p><span className="status-pill status-pending">Design preview · no sign-in</span></div><div className="customer-preview-grid">{[["Account summary","Verified data only"],["Active plans","Awaiting backend"],["Requests","No live actions"]].map(x=><div key={x[0]}><span>{x[0]}</span><strong>—</strong><small>{x[1]}</small></div>)}</div></section>;
 return <section className="surface-card section-placeholder"><div className="placeholder-top"><span className="placeholder-symbol" aria-hidden="true">{icon}</span><span className="status-pill status-pending">Backend not verified</span></div><h2>{label}</h2><p className="section-description placeholder-description">{descriptions[id]||"This screen will show verified platform information."}</p><EmptyState title={id==="integrations"?"No connections verified":"Ready for verified data"} detail="This is a working UI placeholder. It contains no fabricated customer records, balances, transactions or performance figures."/><div className="placeholder-footer"><span aria-hidden="true">▣</span> Read-only preview · no live financial actions</div></section>;
}
export default function DashboardApp({activeSection="overview"}:{activeSection?:string}){
 const [live,setLive]=useState<DashboardLiveData|null>(null);
 const [liveError,setLiveError]=useState("");
 useEffect(()=>{
  let active=true;
  const refresh=async()=>{try{const response=await fetch("/api/market",{cache:"no-store"});const payload=await response.json();if(!response.ok)throw new Error(payload.error||"Read-only backend query failed.");if(active){setLive(payload);setLiveError("");}}catch(err){if(active)setLiveError(err instanceof Error?err.message:"Backend connection failed.");}};
  void refresh();const timer=window.setInterval(()=>void refresh(),60000);return()=>{active=false;window.clearInterval(timer);};
 },[]);
 const current=screens.find(s=>s[0]===activeSection)||screens[0];
 const [query,setQuery]=useState(""); const [mobileOpen,setMobileOpen]=useState(false);
 const filtered=useMemo(()=>screens.filter(s=>s[1].toLowerCase().includes(query.toLowerCase())),[query]);
 const groups=Array.from(new Set(filtered.map(s=>s[4])));
 const href=(id:string)=>id==="overview"?"/":`/${id}`;
 return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to main content</a>
 {current[0]==="overview"&&<aside className="sidebar" aria-label="Workspace sidebar"><Link className="brand-link" href="/" aria-label="CryptoInvest overview"><Brand/></Link><div className="workspace-chip"><span className="workspace-avatar">CI</span><span><strong>CEO workspace</strong><small>Safe preview</small></span><span className="workspace-chevron" aria-hidden="true">⌄</span></div><nav className="sidebar-nav" aria-label="Primary navigation">{groups.map(group=><div className="nav-group" key={group}><p className="nav-group-title">{group}</p>{filtered.filter(s=>s[4]===group).map(s=><Link key={s[0]} href={href(s[0])} className={s[0]===current[0]?"nav-item nav-active":"nav-item"} aria-current={s[0]===current[0]?"page":undefined}><span className="nav-icon" aria-hidden="true">{s[3]}</span><span>{s[1]}</span></Link>)}</div>)}</nav><div className="sidebar-bottom"><div className="sidebar-safety"><span aria-hidden="true">✦</span><strong>Safety comes first</strong><p>Live money movement is disabled while the platform is being verified.</p><Link href="/security">Review safeguards →</Link></div><div className="sidebar-profile"><span className="profile-avatar">CI</span><span><strong>CryptoInvest</strong><small>Development preview</small></span></div></div></aside>}
 <main className={current[0]==="overview"?"main-panel with-sidebar":"main-panel"} id="main-content"><header className="topbar"><div className="topbar-leading">{current[0]!=="overview"?<Link className="back-home" href="/"><span aria-hidden="true">←</span> Overview</Link>:<span className="breadcrumb">Workspace <span aria-hidden="true">/</span> Overview</span>}<div className="mobile-brand"><Brand/></div></div><div className="topbar-actions"><label className="nav-search"><span aria-hidden="true">⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search workspace screens" placeholder="Find a screen…"/><kbd>/</kbd></label><details className="screen-menu"><summary aria-label="Open screen navigation"><span aria-hidden="true">☷</span><span className="menu-summary-label">Screens</span></summary><div className="screen-menu-panel"><strong>Go to a screen</strong><p>Choose a workspace area.</p>{filtered.map(s=><Link key={s[0]} href={href(s[0])}><span aria-hidden="true">{s[3]}</span>{s[1]}{s[0]===current[0]?<span className="current-mark">Current</span>:null}</Link>)}{filtered.length===0?<p className="no-results">No screens match “{query}”.</p>:null}</div></details><span className="preview-indicator"><span aria-hidden="true"/>{live?"Live backend · read-only":"Connecting to backend"}</span><button className="mobile-menu-button" type="button" aria-expanded={mobileOpen} aria-controls="mobile-screen-menu" onClick={()=>setMobileOpen(v=>!v)}>{mobileOpen?"Close":"Menu"}</button></div></header>
 {mobileOpen&&<nav id="mobile-screen-menu" className="mobile-screen-menu" aria-label="Screen navigation">{screens.map(s=><Link key={s[0]} href={href(s[0])} onClick={()=>setMobileOpen(false)} aria-current={s[0]===current[0]?"page":undefined}>{s[3]} {s[1]}</Link>)}</nav>}
 <div className="page-content">{liveError&&<div className="auth-setup-warning" role="status"><strong>Live data unavailable</strong><p>{liveError} Displayed values are not replaced with sample data.</p></div>}<div className="page-heading"><div><p className="eyebrow">{current[0]==="overview"?"YOUR PLATFORM AT A GLANCE":current[4].toUpperCase()}</p><h1>{current[0]==="overview"?"Good to see you.":current[1]}</h1><p className="page-subtitle">{current[2]}</p></div><span className="environment-badge"><span aria-hidden="true">●</span> Development preview</span></div><SafetyNotice/><Content id={current[0]} label={current[1]} icon={current[3]} live={live}/><footer className="page-footer"><span>© {new Date().getFullYear()} CryptoInvest</span><span><span className="footer-lock" aria-hidden="true">▣</span> Secure preview · financial operations disabled</span></footer></div></main></div>;
}
