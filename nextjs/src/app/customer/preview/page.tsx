"use client";
import { useEffect, useState } from "react";
type Tab = "Home" | "Investment" | "Wallet" | "Profile";
type Sub = "Deposit" | "Withdraw" | "Wallet transactions" | "Investment details" | "Security" | "Close account";
const tabs: {name:Tab;icon:string}[]=[{name:"Home",icon:"⌂"},{name:"Investment",icon:"↗"},{name:"Wallet",icon:"◈"},{name:"Profile",icon:"♙"}];
const wallet=[["↓","Deposit record","Demo · Oct 28, 2026","+$1,000.00","Pending"],["↑","Withdrawal record","Demo · Oct 25, 2026","−$250.00","Review"],["₿","Bitcoin wallet entry","Demo · Oct 21, 2026","+0.002 BTC","Recorded"],["⇄","Wallet conversion","Demo · Oct 18, 2026","−$80.00","Recorded"]];
const investments=[["Growth portfolio","Sample plan · Oct 12, 2026","$2,500.00","Profit"],["Balanced portfolio","Sample plan · Sep 04, 2026","$1,200.00","Win"],["Long-term portfolio","Sample plan · Aug 19, 2026","$900.00","Loss"]];
export default function CustomerPreviewPage(){
 const [tab,setTab]=useState<Tab>("Home"),[sub,setSub]=useState<Sub|null>(null),[filter,setFilter]=useState("All"),[notice,setNotice]=useState(""),[requested,setRequested]=useState(false);
 const go=(t:Tab)=>{setTab(t);setSub(null);setNotice("");};
 const open=(s:Sub)=>{setSub(s);setNotice("");};
 return <div className="ci-v2">
  {tab==="Home"&&!sub&&<aside className="ci-v2-sidebar"><a className="ci-v2-brand" aria-label="CryptoInvest"><img src="/cryptoinvest-mark.svg" alt="CryptoInvest shield logo"/><span>Crypto<strong>Invest</strong><small>MORE THAN INVESTING. BUILT ON TRUST.</small></span></a><p>CUSTOMER MENU</p>{tabs.map(t=><button key={t.name} className={tab===t.name?"selected":""} onClick={()=>go(t.name)}><i>{t.icon}</i>{t.name}</button>)}<p className="ci-v2-sidegroup">SECONDARY SCREENS</p><button onClick={()=>{go("Investment");open("Investment details")}}><i>↗</i>Investment history</button><button onClick={()=>{go("Wallet");open("Deposit")}}><i>↓</i>Deposit</button><button onClick={()=>{go("Wallet");open("Withdraw")}}><i>↑</i>Withdraw</button><button onClick={()=>{go("Wallet");open("Wallet transactions")}}><i>⇄</i>Wallet transactions</button><button onClick={()=>{go("Profile");open("Security")}}><i>◇</i>Security settings</button><div className="ci-v2-sidefoot">◇ Demo workspace<br/><small>Sample data only</small></div></aside>}
  <div className="ci-v2-main"><header className="ci-v2-header"><b className="ci-v2-mobilebrand"><img src="/cryptoinvest-mark.svg" alt=""/>Crypto<strong>Invest</strong></b><span>Customer portal / {sub||tab}</span><div><InstallAppButton/><em>● DEMO MODE</em><b className="ci-v2-avatar">JD</b><small>John Doe</small></div></header>
  <main className="ci-v2-content"><div className="ci-v2-demo"><b>DEMO PREVIEW — FICTIONAL SAMPLE CONTENT</b><span>Balances, coin values and activity are illustrative. No live market feed or financial service is connected.</span></div>{notice&&<div className="ci-v2-notice">{notice}</div>}
  {sub?<section className="ci-v2-section"><button className="ci-v2-back" onClick={()=>setSub(null)}>← Back to {tab}</button><p className="ci-v2-kicker">CUSTOMER WORKSPACE · SECONDARY SCREEN</p><h1>{sub}</h1>
   {sub==="Deposit"&&<><p>Review deposit methods and submitted deposit records.</p><Warning title="Deposits are disabled in this preview." body="No funds can be sent or accepted here. A future approved release can display verified deposit methods and request status."/><Card title="Deposit records"><Rows rows={wallet.slice(0,1)}/></Card></>}
   {sub==="Withdraw"&&<><p>Review withdrawal requests and their status.</p><Warning title="Withdrawals are disabled in this preview." body="No withdrawal, transfer or payment can be initiated here."/><Card title="Withdrawal records"><Rows rows={wallet.slice(1,2)}/></Card></>}
   {sub==="Wallet transactions"&&<Card title="Complete wallet transaction history"><Rows rows={wallet}/></Card>}
   {sub==="Investment details"&&<Card title="Investment record details"><div className="ci-v2-details"><Info label="Plan" value="Growth portfolio (sample)"/><Info label="Status" value="Illustrative active record"/><Info label="Recorded amount" value="$2,500.00 (fictional)"/><Info label="Performance" value="Not connected to live returns"/></div><Warning title="Investment information only" body="This preview does not place trades, promise returns or calculate real profits and losses."/></Card>}
   {sub==="Security"&&<Card title="Security settings"><Setting title="Password & sign-in" detail="Authentication is not connected in preview."/><Setting title="Two-step verification" detail="MFA setup belongs in the secure account release."/><div className="ci-v2-setting"><span><b>Account closure</b><small>Request account closure and review the data-retention notice.</small></span><button className="ci-v2-danger-outline" onClick={()=>open("Close account")}>Close account</button></div></Card>}
   {sub==="Close account"&&<Card title="Request account closure"><Warning title="This demo cannot delete your account or server data." body="A real closure flow must verify identity, revoke sessions and explain any records that must be retained under applicable requirements. No data is deleted by this preview."/><p>Request closure only after reviewing the information above.</p>{requested?<div className="ci-v2-success">Demo request recorded on this screen only. No server request was sent.</div>:<button className="ci-v2-danger" onClick={()=>setRequested(true)}>Preview closure request</button>}</Card>}
  </section>:tab==="Home"?<>
   <section className="ci-v2-hero"><p className="ci-v2-kicker">YOUR ACCOUNT OVERVIEW</p><h1>Welcome back, <strong>John Doe</strong></h1><p>Here is a quick view of your customer workspace.</p><button className="ci-v2-gold" onClick={()=>go("Investment")}>Explore investments →</button></section>
   <div className="ci-v2-metrics"><Metric title="Wallet balance" value="$12,500.00" note="Fictional sample balance"/><Metric title="Invested amount" value="$10,000.00" note="Sample portfolio amount"/><Metric title="Profit / loss" value="+$1,250.00" note="Illustrative only"/><Metric title="Active investments" value="02" note="Sample records"/></div>
   <div className="ci-v2-columns"><Card title="Portfolio snapshot"><div className="ci-v2-chart"><div className="ci-v2-bars">{[28,38,34,50,45,64,58,72,66,86].map((h,i)=><i key={i} style={{height:h+"%"}}/>)}</div><small>Illustrative chart — not calculated from live holdings.</small></div></Card><Card title="Quick navigation"><Quick title="Open wallet" detail="Coins & transactions" onClick={()=>go("Wallet")}/><Quick title="Track investments" detail="Performance & history" onClick={()=>go("Investment")}/><Quick title="Manage profile" detail="Personal details & security" onClick={()=>go("Profile")}/></Card></div>
   <Card title="Recent wallet activity"><Rows rows={wallet.slice(0,3)}/><button className="ci-v2-link" onClick={()=>open("Wallet transactions")}>All transactions →</button></Card>
  </>:tab==="Investment"?<>
   <Heading title="Investment" kicker="PORTFOLIO CENTRE" desc="Track investment records, performance and portfolio activity."/>
   <div className="ci-v2-metrics three"><Metric title="Total recorded" value="$4,600.00" note="Fictional sample"/><Metric title="Profit / loss" value="+$320.00" note="Illustrative only"/><Metric title="Investment records" value="03" note="Sample entries"/></div>
   <Card title="Market overview"><div className="ci-v2-market"><b>◈</b><strong>Live market data will appear here when an approved public market feed is connected.</strong><small>No live coin prices are shown in this preview.</small></div></Card>
   <Card title="Investment history"><div className="ci-v2-filters">{["All","Profit","Loss","Win"].map(f=><button className={filter===f?"on":""} key={f} onClick={()=>setFilter(f)}>{f}</button>)}</div>{investments.filter(r=>filter==="All"||(filter==="Profit"&&r[3]==="Profit")||(filter==="Loss"&&r[3]==="Loss")||(filter==="Win"&&r[3]==="Win")).map((r,i)=><div className="ci-v2-row" key={i}><span className="ci-v2-coin">↗</span><span className="ci-v2-grow"><b>{r[0]}</b><small>{r[1]}</small></span><span className="ci-v2-value"><b>{r[2]}</b><small>{r[3]}</small></span><button onClick={()=>open("Investment details")}>→</button></div>)}</Card>
  </>:tab==="Wallet"?<>
   <Heading title="Wallet" kicker="WALLET CENTRE" desc="Coins, deposits, withdrawals and your complete wallet transaction history."/>
   <div className="ci-v2-wallet"><span><small>TOTAL WALLET BALANCE · SAMPLE</small><b>$12,500.00</b><small>Fictional display balance — not spendable funds</small></span><div><button onClick={()=>open("Deposit")}>↓ Deposit</button><button onClick={()=>open("Withdraw")}>↑ Withdraw</button></div></div>
   <Card title="Coins & wallet assets"><Coin name="Bitcoin" ticker="BTC" amount="0.125 BTC" value="$8,250.00"/><Coin name="Ethereum" ticker="ETH" amount="1.40 ETH" value="$3,500.00"/><Coin name="USD Coin" ticker="USDC" amount="750 USDC" value="$750.00"/></Card>
   <Card title="Wallet transaction history"><Rows rows={wallet}/><button className="ci-v2-link" onClick={()=>open("Wallet transactions")}>View all transactions →</button></Card>
  </>:<>
   <Heading title="Profile" kicker="ACCOUNT CENTRE" desc="Manage personal information, account preferences and security."/>
   <div className="ci-v2-profile"><b>JD</b><span><strong>John Doe</strong><small>john.doe@example.test</small><em>DEMO CUSTOMER PROFILE</em></span></div>
   <Card title="Personal information"><div className="ci-v2-details"><Info label="Full name" value="John Doe (sample)"/><Info label="Email address" value="john.doe@example.test"/><Info label="Phone number" value="Not provided"/><Info label="Account ID" value="DEMO-CUSTOMER-001"/></div></Card>
   <Card title="Account & security"><Setting title="Security settings" detail="Password, sign-in and two-step verification." action="Open security →" onClick={()=>open("Security")}/><Setting title="Account closure" detail="Find account closure under Security settings." action="View security →" onClick={()=>open("Security")}/></Card>
   <div className="ci-v2-logout"><button onClick={()=>setNotice("Logout is a demo control. No authenticated session is connected, so no sign-out action was performed.")}>↪ Log out</button><small>Secure sign-out will be connected when authentication is approved.</small></div>
  </>}
  <footer className="ci-v2-footer">© 2026 CryptoInvest <span>Customer experience · Demo preview only</span></footer></main></div>
  <nav className="ci-v2-bottom" aria-label="Primary navigation">{tabs.map(t=><button key={t.name} className={tab===t.name&&!sub?"active":""} onClick={()=>go(t.name)} aria-current={tab===t.name&&!sub?"page":undefined}><b>{t.icon}</b><small>{t.name}</small></button>)}</nav>
 </div>
}
function Heading({title,kicker,desc}:{title:string;kicker:string;desc:string}){return <div className="ci-v2-heading"><p className="ci-v2-kicker">{kicker}</p><h1>{title}</h1><p>{desc}</p></div>}
function Card({title,children}:{title:string;children:React.ReactNode}){return <section className="ci-v2-card"><h2>{title}</h2>{children}</section>}
function Metric({title,value,note}:{title:string;value:string;note:string}){return <article className="ci-v2-metric"><small>{title}</small><b>{value}</b><span>{note}</span></article>}
function Info({label,value}:{label:string;value:string}){return <div className="ci-v2-info"><small>{label}</small><b>{value}</b></div>}
function Rows({rows}:{rows:string[][]}){return <div>{rows.map((r,i)=><div className="ci-v2-row" key={i}><span className="ci-v2-coin">{r[0]}</span><span className="ci-v2-grow"><b>{r[1]}</b><small>{r[2]}</small></span><span className="ci-v2-value"><b>{r[3]}</b><small>{r[4]}</small></span></div>)}</div>}
function Coin({name,ticker,amount,value}:{name:string;ticker:string;amount:string;value:string}){return <div className="ci-v2-row"><span className="ci-v2-coin">{ticker==="BTC"?"₿":ticker==="ETH"?"Ξ":"◎"}</span><span className="ci-v2-grow"><b>{name}</b><small>{ticker} · {amount}</small></span><span className="ci-v2-value"><b>{value}</b><small>Sample value</small></span></div>}
function Quick({title,detail,onClick}:{title:string;detail:string;onClick:()=>void}){return <button className="ci-v2-quick" onClick={onClick}><span><b>{title}</b><small>{detail}</small></span>→</button>}
function Setting({title,detail,action,onClick}:{title:string;detail:string;action?:string;onClick?:()=>void}){return <div className="ci-v2-setting"><span><b>{title}</b><small>{detail}</small></span>{action&&<button onClick={onClick}>{action}</button>}</div>}
function Warning({title,body}:{title:string;body:string}){return <div className="ci-v2-warning"><b>{title}</b><span>{body}</span></div>}

function InstallAppButton(){
 const [installPrompt,setInstallPrompt]=useState<any>(null);
 const [installed,setInstalled]=useState(false);
 useEffect(()=>{
  const installedNow=window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone===true;
  setInstalled(installedNow);
  const capture=(event:Event)=>{event.preventDefault();setInstallPrompt(event as any);};
  const done=()=>{setInstalled(true);setInstallPrompt(null);};
  window.addEventListener("beforeinstallprompt",capture);
  window.addEventListener("appinstalled",done);
  return ()=>{window.removeEventListener("beforeinstallprompt",capture);window.removeEventListener("appinstalled",done);};
 },[]);
 if(installed)return <span className="ci-v2-installed" aria-label="App installed">✓ Installed</span>;
 return <button className="ci-v2-install" onClick={async()=>{
  if(installPrompt){await installPrompt.prompt();const choice=await installPrompt.userChoice;if(choice?.outcome==="accepted")setInstalled(true);setInstallPrompt(null);}
  else setInstallPrompt(null);
 }} title={installPrompt?"Install CryptoInvest on this device":"On Android Chrome, open the browser menu and choose Install app or Add to Home screen"}>↓ Install app</button>;
}
