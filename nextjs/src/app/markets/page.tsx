"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Quote = { symbol:string; pair:string; price:number; change24hPct:number; high24h:number; low24h:number; volume24hQuote:number; quoteCurrency:string; source:string; sourceTimestamp:string };
type Feed = { provider:string; updatedAt:string|null; quotes?:Quote[]; error?:string };
const money = (value:number) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:value<1?6:2}).format(value);
const compact = (value:number) => new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:2}).format(value);
export default function MarketsPage(){
 const [feed,setFeed]=useState<Feed>({provider:"Binance Spot",updatedAt:null});
 const [busy,setBusy]=useState(true);
 const refresh=useCallback(async()=>{try{const res=await fetch("/api/market",{cache:"no-store"});const body=await res.json() as Feed;setFeed(body);}catch{setFeed({provider:"Binance Spot",updatedAt:null,error:"Market feed unavailable. Please retry."});}finally{setBusy(false);}},[]);
 useEffect(()=>{void refresh();const id=window.setInterval(()=>void refresh(),15000);return()=>window.clearInterval(id);},[refresh]);
 return <main style={{maxWidth:1180,margin:"0 auto",padding:"28px 18px 48px",color:"var(--ink)"}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap",marginBottom:24}}>
   <div><Link href="/" style={{color:"var(--brand)",fontWeight:700,fontSize:12}}>← CryptoInvest overview</Link><p style={{color:"var(--brand)",fontWeight:800,fontSize:10,letterSpacing:1.5,margin:"22px 0 8px"}}>MARKET INTELLIGENCE</p><h1 style={{fontSize:32,marginBottom:8}}>Live crypto market</h1><p style={{color:"var(--muted)",margin:0}}>Live public spot-market data. Informational only — no trading or money movement.</p></div>
   <button onClick={()=>{setBusy(true);void refresh();}} style={{padding:"10px 14px",border:"1px solid var(--line)",borderRadius:10,background:"var(--surface)",color:"var(--ink)",cursor:"pointer"}}>{busy?"Refreshing…":"Refresh now"}</button>
  </div>
  <section style={{padding:14,border:"1px solid var(--line)",borderRadius:14,background:"var(--surface)",marginBottom:18,display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap",fontSize:12}}>
   <span><strong>Source:</strong> {feed.provider}</span><span><strong>Status:</strong> {feed.error?"Unavailable":feed.quotes?.length?"Live":"Connecting"}</span><span><strong>Auto-refresh:</strong> every 15 seconds</span><span><strong>Last update:</strong> {feed.updatedAt?new Date(feed.updatedAt).toLocaleTimeString():"—"}</span>
  </section>
  {feed.error?<section role="alert" style={{padding:18,border:"1px solid var(--notice-border)",borderRadius:12,background:"var(--notice)",color:"var(--notice-ink)"}}>{feed.error}. Data is not fabricated; prices will appear when the provider responds.</section>:null}
  <section style={{border:"1px solid var(--line)",borderRadius:16,background:"var(--surface)",overflow:"hidden"}}>
   <div style={{padding:"17px 18px",borderBottom:"1px solid var(--line)"}}><h2 style={{fontSize:17,margin:0}}>Spot prices · USDT pairs</h2><p style={{fontSize:11,color:"var(--muted)",margin:"6px 0 0"}}>Market prices fluctuate. Data may be delayed or temporarily unavailable.</p></div>
   <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:700}}><thead><tr>{["Asset","Last price","24h change","24h high","24h low","24h volume"].map(h=><th key={h} scope="col" style={{textAlign:h==="Asset"?"left":"right",padding:"13px 15px",color:"var(--muted)",background:"var(--surface-raised)",fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
   <tbody>{(feed.quotes||[]).map(q=><tr key={q.pair} style={{borderTop:"1px solid var(--line)"}}><th scope="row" style={{textAlign:"left",padding:"14px 15px"}}><strong>{q.symbol}</strong><span style={{display:"block",fontSize:10,color:"var(--muted)",fontWeight:400}}>{q.pair}</span></th><td style={{textAlign:"right",padding:"14px 15px",fontVariantNumeric:"tabular-nums"}}>{money(q.price)}</td><td style={{textAlign:"right",padding:"14px 15px",fontVariantNumeric:"tabular-nums",color:q.change24hPct>=0?"#21805b":"#c24747"}}>{q.change24hPct>0?"+":""}{q.change24hPct.toFixed(2)}%</td><td style={{textAlign:"right",padding:"14px 15px"}}>{money(q.high24h)}</td><td style={{textAlign:"right",padding:"14px 15px"}}>{money(q.low24h)}</td><td style={{textAlign:"right",padding:"14px 15px"}}>{compact(q.volume24hQuote)} USDT</td></tr>)}
   {!feed.quotes?.length&&!feed.error?[1,2,3,4,5].map(n=><tr key={n}><td colSpan={6} style={{padding:16,color:"var(--muted)"}}> {busy?"Loading live quote…":"Waiting for market data…"} </td></tr>):null}
   </tbody></table></div>
  </section>
  <p style={{fontSize:10,color:"var(--muted)",lineHeight:1.7,marginTop:14}}>Provider: Binance Spot public market endpoint. Prices are informational and not execution quotes, investment advice, or guaranteed real-time values. CryptoInvest financial operations remain disabled. Market snapshots are currently served from the provider API; persistent database ingestion and other asset classes require a separate server-side ingestion job/provider integration.</p>
 </main>;
}
