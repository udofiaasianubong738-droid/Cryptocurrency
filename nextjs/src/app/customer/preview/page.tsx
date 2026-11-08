"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./customer-preview.css";

type Screen = "Home" | "Investment" | "Wallet" | "Profile" | "Activity" | "Profit" | "Market" | "Security" | "Support" | "Settings" | "Legal" | "Deposit" | "Withdraw";
type MarketQuote = { id:string; asset_id:string; price:number|string; change_24h_pct:number|string|null; volume_24h:number|string|null; market_cap:number|string|null; received_at:string; is_delayed:boolean; market_assets?:{symbol?:string;name?:string}|null };
const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase=url&&key?createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}):null;
const cash=(v:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:v<1?6:2}).format(v);
const age=(v:string)=>{const n=Date.now()-new Date(v).getTime();return !Number.isFinite(n)?"Time unavailable":n<60000?"Just now":n<3600000?Math.floor(n/60000)+"m ago":n<86400000?Math.floor(n/3600000)+"h ago":Math.floor(n/86400000)+"d ago"};

function Header({home,secondary,onMenu,onActivity,onHome}:{home:boolean;secondary:boolean;onMenu:()=>void;onActivity:()=>void;onHome:()=>void}){
 if(!home&&!secondary)return null;
 return <header className="ci-header"><div className="ci-head-left">{home?<button className="ci-icon-btn" aria-label="Open sidebar" onClick={onMenu}>☰</button>:<button className="ci-home-back" onClick={onHome}>← Home</button>}<div className="ci-brand"><span className="ci-logo">↗</span><span>Crypto<span>Invest</span></span></div></div>{home&&<div className="ci-head-actions"><button className="ci-icon-btn" aria-label="Open activity and notifications" onClick={onActivity}>♧</button></div>}</header>
}
function BottomNav({screen,go}:{screen:Screen;go:(s:Screen)=>void}){
 const items:[Screen,string,string][]=[["Home","⌂","Home"],["Investment","↗","Investment"],["Wallet","▣","Wallet"],["Profile","♙","Profile"]];
 return <nav className="ci-bottom-nav" aria-label="Primary navigation">{items.map(([s,icon,label])=><button key={s} className={screen===s?"active":""} aria-current={screen===s?"page":undefined} onClick={()=>go(s)}><span>{icon}</span>{label}</button>)}</nav>
}
function Sidebar({open,close,go,screen}:{open:boolean;close:()=>void;go:(s:Screen)=>void;screen:Screen}){
 if(!open)return null;
 const secondary:[string,Screen,string][]=[["Activity & Notifications","Activity","♧"],["Profit & Reports","Profit","▤"],["Market Details","Market","◈"],["Account Security","Security","♢"],["Help & Support","Support","? "],["Settings","Settings","⚙"],["Legal & Policies","Legal","§"]];
 const link=([label,s,ico]:[string,Screen,string])=><button className="ci-side-item" key={s} aria-current={screen===s?"page":undefined} onClick={()=>go(s)}><i aria-hidden="true">{ico}</i><span>{label}</span>{secondary.some(x=>x[1]===s)&&<b className="ci-side-chevron">›</b>}</button>;
 return <><button className="ci-backdrop" aria-label="Close navigation menu" onClick={close}/><aside className="ci-sidebar" aria-label="Customer navigation"><div className="ci-side-brand"><div className="ci-side-brandmark">⬡<span>↗</span></div><div className="ci-side-brandcopy"><strong>Crypto<span>Invest</span></strong><small>MORE THAN INVESTING. BUILT ON TRUST.</small></div><button className="ci-side-close" onClick={close} aria-label="Close menu">×</button></div><div className="ci-side-rule"/><p className="ci-side-label">MORE SERVICES</p><nav aria-label="More services">{secondary.map(link)}</nav><div className="ci-side-spacer"/><div className="ci-side-note"><span>♙</span><div><b>Secure customer portal</b><small>Private access · Customer portal</small></div><i>✓</i></div></aside></>
}
function Home({quotes,loading,error}:{quotes:MarketQuote[];loading:boolean;error:string|null}){
  const [search,setSearch]=useState("");
  const sorted=[...quotes]
    .filter(q=>`${q.market_assets?.name??""} ${q.market_assets?.symbol??""}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a,b)=>Number(b.change_24h_pct??0)-Number(a.change_24h_pct??0));
  return <main className="ci-main ci-home-main">
    <section className="ci-home-welcome">
      <div><small>ACCOUNT OVERVIEW</small><h1>Welcome to CryptoInvest</h1><p>Your account information and market direction, clearly organised.</p></div>
    </section>
    <section className="ci-home-hero">
      <div className="ci-home-hero-copy"><small>YOUR ACCOUNT AT A GLANCE</small><h2>Clarity in every<br/><em>account detail.</em></h2><p>View your balance, investment performance and the latest market direction in one secure place.</p></div>
      <article className="ci-home-balance" aria-label="Available balance">
        <span className="ci-home-metric-icon">◈</span><small>Available balance</small><strong>— — —</strong><i>Awaiting verified account data</i>
      </article>
    </section>
    <section className="ci-market-card ci-home-market">
      <div className="ci-section-head"><div><small>MARKET OVERVIEW</small><h2>Market position</h2><p>Review the latest available market direction. Market rows are informational and do not open another screen.</p></div><span>{quotes.length} assets</span></div>
      <label className="ci-home-search"><span aria-hidden="true">⌕</span><input aria-label="Search markets" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search market or asset"/></label>
      {error?<div className="ci-empty"><b>Market readings unavailable</b><p>{error}</p></div>:loading&&!quotes.length?<div className="ci-empty">Loading market readings…</div>:!sorted.length?<div className="ci-empty">{search?"No markets match your search.":"No market readings are currently available."}</div>:<div>{sorted.map(q=>{const c=Number(q.change_24h_pct??0);const state=q.change_24h_pct==null?"UNAVAILABLE":c>0?"HIGH":c<0?"LOW":"UNCHANGED";const tone=c>0?"positive":c<0?"negative":"market-neutral";return <div className="ci-market-row ci-market-row-static" key={q.asset_id}><span className="ci-coin">{(q.market_assets?.symbol??"?").slice(0,1)}</span><span className="ci-asset"><b>{q.market_assets?.name??"Market asset"}</b><small>{q.market_assets?.symbol??"—"} · Updated {age(q.received_at)}{q.is_delayed?" · Delayed reading":""}</small></span><span className="ci-quote"><b className={`ci-market-state ${tone}`}>{state}</b><small className={tone}>{q.change_24h_pct==null?"No movement data":`${c>0?"+":""}${c.toFixed(2)}% · 24h`}</small></span></div>})}</div>}
      <p className="ci-disclaimer">Readings show the latest data received by CryptoInvest and refresh periodically. Delayed readings are labelled. Market status is informational only.</p>
    </section>
  </main>
}
function Investment(){
 return <main className="ci-main ci-page-investment">
  <PageTitle eyebrow="YOUR PORTFOLIO" title="Investment" sub="A clear view of your invested balance, portfolio value and recorded performance."/>
  <section className="ci-investment-overview">
   <article className="ci-investment-primary"><small>INVESTED BALANCE</small><strong>— — —</strong><span>Verified investment records will appear here</span></article>
   <article><small>CURRENT PORTFOLIO VALUE</small><b>— — —</b><span>Based on the latest verified valuation</span></article>
   <article><small>TOTAL GAIN / LOSS</small><b>— — —</b><span>Calculated from recorded investment activity</span></article>
  </section>
  <section className="ci-card ci-performance-card">
   <div className="ci-section-head"><div><small>PERFORMANCE</small><h2>Investment history</h2><p>Track how your portfolio value has changed over time.</p></div><span className="ci-data-status">VERIFIED DATA ONLY</span></div>
   <div className="ci-performance-empty"><span className="ci-empty-icon">↗</span><b>Your performance timeline will appear here</b><p>Once verified investment records and dated valuations are connected, this section will show your balance history, gains and losses over time.</p></div>
  </section>
  <section className="ci-card ci-history-card">
   <div className="ci-section-head"><div><small>ACCOUNT RECORDS</small><h2>Investment activity</h2><p>A chronological record of your investment movements and valuations.</p></div></div>
   <div className="ci-table-wrap"><table className="ci-history-table"><thead><tr><th>Date</th><th>Activity</th><th>Invested amount</th><th>Gain / loss</th><th>Status</th></tr></thead><tbody><tr><td colSpan={5}><div className="ci-table-empty">No verified investment history is available yet.</div></td></tr></tbody></table></div>
   <p className="ci-disclaimer">All balances and performance figures will be read-only and sourced from verified account records. No sample returns are displayed.</p>
  </section>
 </main>
}
function Wallet({quotes,loading,error,go}:{quotes:MarketQuote[];loading:boolean;error:string|null;go:(s:Screen)=>void}){
 const sorted=[...quotes].sort((a,b)=>(a.market_assets?.symbol??"").localeCompare(b.market_assets?.symbol??""));
 return <main className="ci-main ci-page-wallet">
  <PageTitle eyebrow="ACCOUNT WALLET" title="Wallet" sub="View your total account balance, recorded activity and available account services."/>
  <section className="ci-wallet-total ci-wallet-premium"><div><small>TOTAL ACCOUNT BALANCE</small><strong>— — —</strong><p>Your verified account balance will appear here</p></div><span className="ci-wallet-emblem">◈</span></section>
  <div className="ci-wallet-actions ci-wallet-actions-premium"><button onClick={()=>go("Deposit")}><span>＋</span><b>Deposit</b><small>View deposit information</small></button><button onClick={()=>go("Withdraw")}><span>↗</span><b>Withdraw</b><small>View withdrawal information</small></button></div>
  <div className="ci-wallet-summary ci-wallet-summary-premium"><article><small>INVESTED BALANCE</small><b>— — —</b><span>Awaiting verified investment records</span></article><article><small>PROFIT / LOSS</small><b>— — —</b><span>Based on recorded valuation changes</span></article></div>
  <section className="ci-card ci-wallet-market">
   <div className="ci-section-head"><div><small>MARKET PULSE</small><h2>Cryptocurrency market direction</h2><p>See which markets are moving higher or lower.</p></div><span>{quotes.length} assets</span></div>
   {error?<div className="ci-empty"><b>Market information unavailable</b><p>{error}</p></div>:loading&&!quotes.length?<div className="ci-empty">Loading market information…</div>:!sorted.length?<div className="ci-empty">No market information is available.</div>:<div>{sorted.map(q=>{const c=Number(q.change_24h_pct??0);const state=q.change_24h_pct==null?"UNAVAILABLE":c>0?"HIGHER":c<0?"LOWER":"UNCHANGED";const tone=c>0?"positive":c<0?"negative":"market-neutral";return <div className="ci-market-row ci-market-row-static" key={q.asset_id}><span className="ci-coin">{(q.market_assets?.symbol??"?").slice(0,1)}</span><span className="ci-asset"><b>{q.market_assets?.name??"Market asset"}</b><small>{q.market_assets?.symbol??"—"} · Updated {age(q.received_at)}{q.is_delayed?" · Delayed":""}</small></span><span className="ci-quote"><b className={`ci-market-state ${tone}`}>{state}</b><small className={tone}>{q.change_24h_pct==null?"Movement unavailable":`${c>0?"+":""}${c.toFixed(2)}% · 24h`}</small></span></div>})}</div>}
   <p className="ci-disclaimer">Market direction is informational only. Readings may be delayed and are not a recommendation to trade.</p>
  </section>
  <section className="ci-card ci-wallet-activity"><div className="ci-section-head"><div><small>RECENT RECORDS</small><h2>Wallet activity</h2><p>Your deposit and withdrawal records will appear here.</p></div></div><div className="ci-performance-empty"><span className="ci-empty-icon">▤</span><b>No wallet activity to show yet</b><p>Verified account activity will be listed here in date order.</p></div></section>
 </main>
}
function Profile(){
 return <main className="ci-main ci-page-profile">
  <PageTitle eyebrow="YOUR ACCOUNT" title="Profile" sub="Review your customer profile and account preferences. Personal details will appear after secure sign-in."/>
  <section className="ci-card ci-profile-card"><div className="ci-profile-heading"><span className="ci-profile-symbol">♙</span><div><small>CUSTOMER PROFILE</small><h2>Personal information</h2><p>Your verified profile details will be displayed here.</p></div></div><div className="ci-profile-fields"><article><small>FULL NAME</small><b>Not available yet</b></article><article><small>EMAIL ADDRESS</small><b>Not available yet</b></article><article><small>PHONE NUMBER</small><b>Not available yet</b></article><article><small>ACCOUNT STATUS</small><b>Awaiting secure sign-in</b></article></div></section>
  <section className="ci-card ci-profile-options"><div className="ci-section-head"><div><small>ACCOUNT PREFERENCES</small><h2>Profile & preferences</h2><p>These settings will be available when your customer account is connected.</p></div></div><div className="ci-profile-option"><span>♢</span><div><b>Personal details</b><small>View and update verified contact information</small></div><em>Coming soon</em></div><div className="ci-profile-option"><span>⚙</span><div><b>Preferences</b><small>Manage language and notification preferences</small></div><em>Coming soon</em></div><div className="ci-profile-option"><span>⌑</span><div><b>Account security</b><small>Review sign-in protection and account security</small></div><em>Available in secondary screens</em></div></section>
 </main>
}
function DepositPage({go}:{go:(s:Screen)=>void}){
 const [asset,setAsset]=useState("Bitcoin (BTC)");
 const [step,setStep]=useState<"method"|"review">("method");
 return <main className="ci-main"><PageTitle eyebrow="WALLET SERVICE" title="Deposit" sub="Deposit information will be provided here when the secure account service is configured."/><section className="ci-flow-card"><div className="ci-flow-step"><span className="active">1</span><i/><span className={step==="review"?"active":""}>2</span></div>{step==="method"?<><h2>Choose a cryptocurrency</h2><p>Deposit options are not yet available for this account.</p><label className="ci-flow-label">Cryptocurrency<select value={asset} onChange={e=>setAsset(e.target.value)}><option>Bitcoin (BTC)</option><option>Ethereum (ETH)</option><option>Solana (SOL)</option><option>USD Coin (USDC)</option><option>Other supported asset (placeholder)</option></select></label><div className="ci-flow-note"><b>Deposit service unavailable</b><span>Payment providers, card collection, exchange quotes and wallet delivery are not connected. No payment details or wallet addresses are requested.</span></div><div className="ci-flow-actions"><button className="secondary" onClick={()=>go("Wallet")}>Back to wallet</button><button onClick={()=>setStep("review")}>View information</button></div></>:<><h2>Deposit information</h2><div className="ci-flow-review"><span>Deposit service</span><b>{asset}</b><span>Order status</span><b>Not configured</b><span>Payment status</span><b>Unavailable</b></div><div className="ci-flow-note"><b>No deposit has been made</b><span>This review step does not submit an order, request payment or create a deposit address.</span></div><div className="ci-flow-actions"><button className="secondary" onClick={()=>setStep("method")}>Back</button><button onClick={()=>go("Wallet")}>Return to wallet</button></div></>}</section></main>
}
function WithdrawPage({go}:{go:(s:Screen)=>void}){
 const [asset,setAsset]=useState("Bitcoin (BTC)");
 const [step,setStep]=useState<"details"|"review">("details");
 return <main className="ci-main"><PageTitle eyebrow="WALLET SERVICE" title="Withdraw" sub="Withdrawal information will be provided here when the secure account service is configured."/><section className="ci-flow-card"><div className="ci-flow-step"><span className="active">1</span><i/><span className={step==="review"?"active":""}>2</span></div>{step==="details"?<><h2>Choose an asset</h2><p>Withdrawal options are not yet available for this account.</p><label className="ci-flow-label">Cryptocurrency<select value={asset} onChange={e=>setAsset(e.target.value)}><option>Bitcoin (BTC)</option><option>Ethereum (ETH)</option><option>Solana (SOL)</option><option>USD Coin (USDC)</option><option>Other supported asset (placeholder)</option></select></label><div className="ci-flow-note"><b>Withdrawals are disabled</b><span>This prototype does not collect destination addresses, calculate network fees, validate balances or send cryptocurrency.</span></div><div className="ci-flow-actions"><button className="secondary" onClick={()=>go("Wallet")}>Back to wallet</button><button onClick={()=>setStep("review")}>View information</button></div></>:<><h2>Withdrawal information</h2><div className="ci-flow-review"><span>Selected asset</span><b>{asset}</b><span>Request status</span><b>Not submitted · not available</b><span>Network status</span><b>Not connected</b></div><div className="ci-flow-note"><b>No withdrawal has been submitted</b><span>No funds or digital assets have moved. This is a customer information screen only.</span></div><div className="ci-flow-actions"><button className="secondary" onClick={()=>setStep("details")}>Back</button><button onClick={()=>go("Wallet")}>Return to wallet</button></div></>}</section></main>
}
function PageTitle({eyebrow,title,sub}:{eyebrow:string;title:string;sub:string}){return <div className="ci-heading"><div><small>{eyebrow}</small><h1>{title}</h1><p>{sub}</p></div></div>}
function Activity(){const [filter,setFilter]=useState<"All activity"|"Transactions"|"Notifications">("All activity");const detail=filter==="Transactions"?"No authenticated transaction records are available.":filter==="Notifications"?"No account notifications are available.":"No account activity to display.";return <main className="ci-main"><PageTitle eyebrow="ACCOUNT CENTRE" title="Activity & Notifications" sub="Transactions and account notifications are brought together in one place."/><section className="ci-card"><div className="ci-tabs">{(["All activity","Transactions","Notifications"] as const).map(x=><button key={x} className={filter===x?"selected":""} onClick={()=>setFilter(x)}>{x}</button>)}</div><div className="ci-empty"><b>{detail}</b><p>Sign in to view verified account records and notifications. New alerts will appear here when available.</p></div><p className="ci-disclaimer">This combined activity screen is read-only. It does not create or process transactions.</p></section></main>}
function Profit(){return <main className="ci-main"><PageTitle eyebrow="REPORTING" title="Profit & Reports" sub="See how profit and loss are kept separate from the original amount allocated to an investment."/><div className="ci-wallet-summary"><article><small>INVESTED PRINCIPAL</small><b>— — —</b><span>Original amount allocated</span></article><article><small>PROFIT / LOSS</small><b>— — —</b><span>Calculated from verified valuation changes</span></article><article><small>CURRENT VALUE</small><b>— — —</b><span>Principal plus or minus profit/loss</span></article></div><section className="ci-card"><h2>How the figures relate</h2><div className="ci-flow-review"><span>Invested principal</span><b>Original allocated amount</b><span>Profit / loss</span><b>Current valuation − invested principal</b><span>Current investment value</span><b>Invested principal + profit / loss</b></div><p className="ci-disclaimer">All amounts remain placeholders until verified account records and valuation data are available. No sample profit is presented as real.</p></section></main>}
function SecondaryPage({screen}:{screen:"Security"|"Support"|"Settings"|"Legal"}){
 const [showCloseInfo,setShowCloseInfo]=useState(false);
 const content={
  Security:{eyebrow:"PRIVACY & PROTECTION",title:"Account Security",sub:"Review the security features intended to protect your customer account.",cards:[["Sign-in protection","Secure sign-in status will be shown after authentication.","Not verified"],["Multi-factor authentication","Authenticator and additional verification settings require a signed-in session.","Session required"],["Active sessions","Review and manage recognised devices after secure sign-in.","Unavailable Customer portal"],["Account recovery","Recovery options are provided through the verified account recovery process.","Session required"]]},
  Support:{eyebrow:"CUSTOMER CARE",title:"Help & Support",sub:"Find guidance and support options for using your CryptoInvest account.",cards:[["Help centre","Guides for account access, profile settings, security and understanding the customer portal.","Help content portal"],["Contact support","Verified support contact details will be displayed here when configured by CryptoInvest.","Not configured"],["Frequently asked questions","Answers about account access, notifications, market information and reports.","Coming soon"],["Report a problem","A secure support request form will be available after the support channel is configured.","Unavailable Customer portal"]]},
  Settings:{eyebrow:"YOUR PREFERENCES",title:"Settings",sub:"Manage customer portal preferences. Account-specific controls require authentication.",cards:[["Display preferences","Choose how information is presented in the customer portal.","Customer portal"],["Notification preferences","Choose which account updates you would like to receive after sign-in.","Session required"],["Language & region","Language and regional display options will be available here.","Coming soon"],["Privacy preferences","Review available privacy controls and account data choices.","Session required"]]},
  Legal:{eyebrow:"TRANSPARENCY",title:"Legal & Policies",sub:"Review the policy documents and important disclosures for the CryptoInvest service.",cards:[["Terms of service","The governing terms for use of the CryptoInvest customer platform.","Document pending"],["Privacy notice","How personal information is collected, used, stored and protected.","Document pending"],["Risk disclosure","Important information about the risks associated with digital-asset markets.","Document pending"],["Cookies & data","Information about cookies, analytics and data retention practices.","Document pending"]]}
 }[screen];
 return (
  <main className="ci-main">
   <PageTitle eyebrow={content.eyebrow} title={content.title} sub={content.sub}/>
   <div className="ci-secondary-intro">
    <span className="ci-secondary-mark">{screen==="Security"?"♢":screen==="Support"?"?":screen==="Settings"?"⚙":"§"}</span>
    <div>
     <b>{screen==="Security"?"Security comes first":screen==="Support"?"We're here to help":screen==="Settings"?"A portal that suits you":"Clear information, in one place"}</b>
     <p>{screen==="Security"?"Your private account controls are not exposed until a verified customer session is active.":screen==="Support"?"Support channels will appear here once official contact details are configured.":screen==="Settings"?"Your preferences are shown separately from private account data.":"Official policy documents will be published here when approved."}</p>
    </div>
   </div>
   <div className="ci-secondary-grid">
    {content.cards.map(([title,description,status])=>(
     <section className="ci-card ci-secondary-tile" key={title}>
      <div className="ci-tile-icon">{screen==="Security"?"✓":screen==="Support"?"✦":screen==="Settings"?"⚙":"▤"}</div>
      <h2>{title}</h2><p>{description}</p><span>{status}</span>
     </section>
    ))}
   </div>
   <div className="ci-readonly-banner"><b>Customer portal</b><p>This section is a designed customer-facing screen. No account settings are changed and no private records are displayed in Customer portal.</p></div>
   {screen==="Security" ? (
    <>
     <section className="ci-close-account">
      <div><b>Close your account</b><p>If you no longer wish to use CryptoInvest, you can review the account-closure process here. Customer portal does not submit a closure request or change account data.</p></div>
      <button type="button" onClick={()=>setShowCloseInfo(v=>!v)}>Close account</button>
     </section>
     {showCloseInfo ? (
      <div className="ci-close-info" role="status">
       <b>Account closure is not connected yet</b>
       <p>No request has been sent and your account remains unchanged. Once the account services are connected and verified, this area can guide customers through identity verification, outstanding obligations, data-retention information and a final confirmation step.</p>
       <button type="button" onClick={()=>setShowCloseInfo(false)}>Dismiss</button>
      </div>
     ) : null}
    </>
   ) : null}
  </main>
 );
}

function MarketDetail({quote,back}:{quote:MarketQuote|null;back:()=>void}){if(!quote)return <main className="ci-main"><PageTitle eyebrow="MARKET" title="Market details" sub="Select an asset from the Home market feed."/></main>;const c=Number(quote.change_24h_pct??0);return <main className="ci-main"><button className="ci-home-back" onClick={back}>← Back to markets</button><PageTitle eyebrow="MARKET DETAILS" title={`${quote.market_assets?.name??"Market"} (${quote.market_assets?.symbol??"—"})`} sub="Latest stored market quote."/><section className="ci-card ci-detail"><small>Latest quoted price</small><strong>{cash(Number(quote.price))}</strong><b className={c>=0?"positive":"negative"}>{c>=0?"+":""}{c.toFixed(2)}% · 24h</b><div className="ci-detail-grid"><span>24h volume<b>{quote.volume_24h==null?"Not reported":cash(Number(quote.volume_24h))}</b></span><span>Market cap<b>{quote.market_cap==null?"Not reported":cash(Number(quote.market_cap))}</b></span><span>Quote received<b>{new Date(quote.received_at).toLocaleString()}</b></span><span>Feed status<b>{quote.is_delayed?"Delayed":"Latest stored quote"}</b></span></div></section></main>}
export default function CustomerPreviewPage(){
 const [screen,setScreen]=useState<Screen>("Home"),[menu,setMenu]=useState(false),[quotes,setQuotes]=useState<MarketQuote[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[selected,setSelected]=useState<MarketQuote|null>(null);
 useEffect(()=>{let active=true;const load=async()=>{if(!supabase){if(active){setError("Market feed connection is not configured.");setLoading(false)}return}try{const {data,error}=await supabase.from("market_quotes").select("id,asset_id,price,change_24h_pct,volume_24h,market_cap,received_at,is_delayed,market_assets(symbol,name)").order("received_at",{ascending:false}).limit(700);if(error)throw error;const latest=new Map<string,MarketQuote>();for(const q of (data??[]) as unknown as MarketQuote[])if(!latest.has(q.asset_id))latest.set(q.asset_id,q);if(active){setQuotes([...latest.values()]);setError(null)}}catch(e){if(active)setError(e instanceof Error?e.message:"Unable to read market quotes.")}finally{if(active)setLoading(false)}};void load();const timer=window.setInterval(load,60000);return()=>{active=false;window.clearInterval(timer)}},[]);
 useEffect(()=>{const read=():Screen=>{const s=new URLSearchParams(location.search).get("screen");return (["Investment","Wallet","Profile","Activity","Profit","Market","Security","Support","Settings","Legal","Deposit","Withdraw"].includes(s??"")?s:"Home") as Screen};setScreen(read());const pop=()=>setScreen(read());addEventListener("popstate",pop);return()=>removeEventListener("popstate",pop)},[]);
 const go=(s:Screen)=>{setMenu(false);const u=new URL(location.href);if(s==="Home")u.searchParams.delete("screen");else u.searchParams.set("screen",s);history.pushState({screen:s},"",u.pathname+u.search+u.hash);setScreen(s);scrollTo({top:0,behavior:"smooth"})};
 const home=screen==="Home",secondary=!["Home","Investment","Wallet","Profile"].includes(screen);
 return <div className="ci-app"><Header home={home} secondary={secondary} onMenu={()=>setMenu(true)} onActivity={()=>go("Activity")} onHome={()=>go("Home")}/><Sidebar open={menu} close={()=>setMenu(false)} go={go} screen={screen}/>{screen==="Home"?<Home quotes={quotes} loading={loading} error={error}/>:screen==="Investment"?<Investment/>:screen==="Wallet"?<Wallet quotes={quotes} loading={loading} error={error} go={go}/>:screen==="Profile"?<Profile/>:screen==="Deposit"?<DepositPage go={go}/>:screen==="Withdraw"?<WithdrawPage go={go}/>:screen==="Activity"?<Activity/>:screen==="Profit"?<Profit/>:screen==="Market"?<MarketDetail quote={selected} back={()=>go("Home")}/>:<SecondaryPage screen={screen}/>{(["Home","Investment","Wallet","Profile"] as Screen[]).includes(screen)?<BottomNav screen={screen} go={go}/>:null}</div>
}
