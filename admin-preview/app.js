(() => {
  const navGroups = [
    ["CUSTOMER MANAGEMENT", [["customers","Customer directory","♙"],["customer-detail","Customer profile","◉"],["customer-verification","Customer verification","✓"],["customer-status","Account status","◎"]]],
    ["INVESTMENT RECORDS", [["investment-records","Investment records","▤"],["investment-plans","Investment plans","◇"],["investment-detail","Record details","▣"],["investment-history","Investment history","↺"]]],
    ["REPORTING", [["performance","Performance reports","⌁"],["customer-reports","Customer reports","♧"],["platform-reports","Platform reports","▥"],["report-history","Report history","◷"]]],
    ["PLATFORM OPERATIONS", [["market-monitor","Live market monitor","↗"],["ai-operations","AI operations centre","✧"],["data-quality","Data quality","⌗"],["review-queue","Review queue","☷"],["platform-activity","Platform activity","≡"]]],
    ["SECURITY & GOVERNANCE", [["security","Security centre","⬡"],["mfa","CEO identity & MFA","◈"],["profile","Administrator profile","♙"],["session-management","Session management","◷"],["audit","Audit logs","≡"]]],
    ["SYSTEM CONFIGURATION", [["system-status","System status","◉"],["backend-config","Backend configuration","⌘"],["settings","Application settings","⚙"],["notification-settings","Notification settings","♧"]]],
    ["SUPPORT", [["support","Help & support","?"],["documentation","Documentation","▧"],["system-info","System information","ⓘ"]]]
  ];
  const labels = Object.fromEntries(navGroups.flatMap(g=>g[1].map(x=>[x[0],x[1]])));
  labels.overview="Home dashboard"; labels.notifications="Notifications";
  const view=document.getElementById("view"), sidebar=document.getElementById("sidebar"), crumb=document.getElementById("crumb");
  let activeScreen="overview";
  let marketOverview=null;
  let marketLoading=false;
  let marketCandleLoading=false;

  let marketTickerSocket=null,marketTickerReconnect=null,marketTickerEnabled=false,marketTickerConnected=false,marketTickerRetry=1000,marketLastTickAt=null;
  let marketCandleSocket=null,marketCandleReconnect=null,marketCandleEnabled=false,marketCandleLive=false,marketCandleRetry=1000,marketCandleRows=[],marketCandleStreamKey="";
  function setMarketBadge(id,label,state){const el=document.getElementById(id);if(el){el.className="market-status-pill "+state;el.textContent=label;}}
  function startMarketTicker(){
    marketTickerEnabled=true;
    if(marketTickerSocket&&(marketTickerSocket.readyState===WebSocket.OPEN||marketTickerSocket.readyState===WebSocket.CONNECTING))return;
    clearTimeout(marketTickerReconnect);
    try{
      const socket=new WebSocket("wss://data-stream.binance.vision/ws/!ticker@arr");
      marketTickerSocket=socket;
      socket.onopen=()=>{marketTickerConnected=true;marketTickerRetry=1000;setMarketBadge("market-home-provider","Live · Binance stream","connected");setMarketBadge("market-monitor-provider","Live · Binance stream","connected");};
      socket.onmessage=event=>{
        let packet;try{packet=JSON.parse(event.data);}catch{return;}
        const updates=Array.isArray(packet)?packet:(packet?.data?[packet.data]:[packet]);
        let changed=false;
        for(const tick of updates){
          if(!tick||!tick.s||!marketOverview)continue;
          const quote=marketOverview.quotes.find(q=>(q.provider_symbol||((q.symbol||"")+(q.quote_currency||"USDT"))).toUpperCase()===String(tick.s).toUpperCase());
          if(!quote)continue;
          const price=Number(tick.c),change=Number(tick.P),high=Number(tick.h),low=Number(tick.l),volume=Number(tick.v);
          if(![price,change,high,low,volume].every(Number.isFinite)||price<=0)continue;
          quote.price=price;quote.change_24h_pct=change;quote.high_24h=high;quote.low_24h=low;quote.volume_24h=volume;
          quote.source_timestamp=new Date(Number(tick.E||Date.now())).toISOString();quote.received_at=new Date().toISOString();quote.is_delayed=false;quote.fresh=true;
          changed=true;
          document.querySelectorAll("tr[data-market-symbol]").forEach(row=>{
            if(String(row.dataset.marketSymbol).toUpperCase()!==String(tick.s).toUpperCase())return;
            const cells=row.children;
            if(cells[1])cells[1].textContent=priceText(price)+" "+(quote.quote_currency||"USDT");
            if(cells[2]){cells[2].className=changeClass(change);cells[2].textContent=changeText(change);}
            if(cells[3])cells[3].textContent=priceText(high);
            if(cells[4])cells[4].textContent=priceText(low);
            if(cells[5])cells[5].textContent=numberText(volume,2);
            if(cells[6])cells[6].textContent=dateText(quote.source_timestamp);
          });
        }
        if(changed){
          marketLastTickAt=new Date();
          if(marketOverview?.summary){marketOverview.summary.latest_source_timestamp=marketLastTickAt.toISOString();marketOverview.summary.latest_received_at=marketLastTickAt.toISOString();}
          const stamp="Last live tick: "+dateText(marketLastTickAt);
          const home=document.getElementById("market-home-updated");if(home)home.textContent=stamp+" · Supabase snapshots remain enabled";
          const monitor=document.getElementById("market-monitor-updated");if(monitor)monitor.textContent=stamp+" · Live Binance WebSocket";
          setMarketBadge("market-home-provider","Live · "+dateText(marketLastTickAt),"connected");
          setMarketBadge("market-monitor-provider","Live · "+dateText(marketLastTickAt),"connected");
        }
      };
      socket.onerror=()=>{try{socket.close();}catch{}};
      socket.onclose=()=>{
        if(marketTickerSocket===socket)marketTickerSocket=null;
        marketTickerConnected=false;
        if(marketTickerEnabled){
          setMarketBadge("market-home-provider","Reconnecting live stream…","warning");
          setMarketBadge("market-monitor-provider","Reconnecting live stream…","warning");
          marketTickerReconnect=setTimeout(startMarketTicker,marketTickerRetry);
          marketTickerRetry=Math.min(marketTickerRetry*2,30000);
        }else{
          setMarketBadge("market-home-provider","Snapshot feed","pending");
          setMarketBadge("market-monitor-provider","Snapshot feed","pending");
        }
      };
    }catch{
      marketTickerConnected=false;
      if(marketTickerEnabled){marketTickerReconnect=setTimeout(startMarketTicker,marketTickerRetry);marketTickerRetry=Math.min(marketTickerRetry*2,30000);}
    }
  }
  function stopMarketTicker(){
    marketTickerEnabled=false;clearTimeout(marketTickerReconnect);marketTickerReconnect=null;
    if(marketTickerSocket){const socket=marketTickerSocket;marketTickerSocket=null;socket.close();}
    marketTickerConnected=false;
  }
  function stopMarketCandleSocket(){
    marketCandleEnabled=false;clearTimeout(marketCandleReconnect);marketCandleReconnect=null;marketCandleStreamKey="";
    if(marketCandleSocket){const socket=marketCandleSocket;marketCandleSocket=null;socket.close();}
    marketCandleLive=false;
  }
  function startMarketCandleSocket(providerSymbol,interval){
    const symbol=String(providerSymbol||"").toLowerCase();
    if(!symbol||!["5m","1h"].includes(interval))return;
    const key=symbol+"@kline_"+interval;
    if(marketCandleStreamKey===key&&marketCandleSocket&&(marketCandleSocket.readyState===WebSocket.OPEN||marketCandleSocket.readyState===WebSocket.CONNECTING))return;
    stopMarketCandleSocket();marketCandleEnabled=true;marketCandleStreamKey=key;
    const connect=()=>{
      if(!marketCandleEnabled||marketCandleStreamKey!==key)return;
      try{
        const socket=new WebSocket("wss://data-stream.binance.vision/ws/"+key);
        marketCandleSocket=socket;
        socket.onopen=()=>{marketCandleLive=true;marketCandleRetry=1000;setMarketBadge("market-candle-status","Live candle stream","connected");};
        socket.onmessage=event=>{
          let packet;try{packet=JSON.parse(event.data);}catch{return;}
          const k=packet?.k||packet?.data?.k;if(!k)return;
          const row={open_time:new Date(Number(k.t)).toISOString(),close_time:new Date(Number(k.T)).toISOString(),open_price:Number(k.o),high_price:Number(k.h),low_price:Number(k.l),close_price:Number(k.c),volume:Number(k.v),quote_volume:Number(k.q),received_at:new Date().toISOString(),live:true};
          if(![row.open_price,row.high_price,row.low_price,row.close_price,row.volume].every(Number.isFinite))return;
          const index=marketCandleRows.findIndex(c=>c.open_time===row.open_time);
          if(index>=0)marketCandleRows[index]=row;else marketCandleRows.push(row);
          marketCandleRows.sort((a,b)=>Date.parse(a.open_time)-Date.parse(b.open_time));marketCandleRows=marketCandleRows.slice(-60);
          marketCandleLive=true;renderMarketCandles();
        };
        socket.onerror=()=>{try{socket.close();}catch{}};
        socket.onclose=()=>{
          if(marketCandleSocket===socket)marketCandleSocket=null;
          marketCandleLive=false;
          if(marketCandleEnabled&&marketCandleStreamKey===key){
            setMarketBadge("market-candle-status","Reconnecting candle stream…","warning");
            marketCandleReconnect=setTimeout(connect,marketCandleRetry);marketCandleRetry=Math.min(marketCandleRetry*2,30000);
          }
        };
      }catch{
        if(marketCandleEnabled){marketCandleReconnect=setTimeout(connect,marketCandleRetry);marketCandleRetry=Math.min(marketCandleRetry*2,30000);}
      }
    };
    connect();
  }
  function renderMarketCandles(){
    const target=document.getElementById("market-candle-table");if(!target)return;
    const rows=marketCandleRows;
    const chart=document.getElementById("market-candle-chart");
    if(chart){
      if(!rows.length)chart.innerHTML='<div class="market-loading">No candle history is available.</div>';
      else{
        const width=1000,height=250,pad=18,high=Math.max(...rows.map(r=>Number(r.high_price))),low=Math.min(...rows.map(r=>Number(r.low_price))),range=Math.max(high-low,Math.abs(high)*0.00001,0.00000001),y=v=>pad+(high-v)/range*(height-pad*2),step=(width-pad*2)/Math.max(rows.length,1),body=Math.max(3,Math.min(10,step*.62));
        const candles=rows.map((r,i)=>{const x=pad+i*step+step/2,up=Number(r.close_price)>=Number(r.open_price),top=y(Math.max(r.open_price,r.close_price)),bottom=y(Math.min(r.open_price,r.close_price)),h=Math.max(1,bottom-top);return '<g class="'+(up?"candle-up":"candle-down")+'"><line x1="'+x+'" y1="'+y(r.high_price)+'" x2="'+x+'" y2="'+y(r.low_price)+'"/><rect x="'+(x-body/2)+'" y="'+top+'" width="'+body+'" height="'+h+'" rx="1"/></g>';}).join("");
        const grid=[0,.25,.5,.75,1].map(p=>{const v=high-range*p;return '<line class="chart-grid" x1="'+pad+'" y1="'+y(v)+'" x2="'+(width-pad)+'" y2="'+y(v)+'"/><text class="chart-label" x="'+(width-pad)+'" y="'+(y(v)-4)+'" text-anchor="end">'+escapeHtml(priceText(v))+'</text>';}).join("");
        chart.innerHTML='<svg class="market-candles-svg" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Live candlestick price chart">'+grid+candles+'</svg>';
      }
    }
    target.innerHTML=rows.length?'<table class="data-table market-data-table"><thead><tr><th>Open time</th><th>Open</th><th>High</th><th>Low</th><th>Close</th><th>Volume</th><th>Received</th></tr></thead><tbody>'+rows.slice().reverse().map(c=>'<tr><td>'+escapeHtml(dateText(c.open_time))+'</td><td>'+priceText(c.open_price)+'</td><td>'+priceText(c.high_price)+'</td><td>'+priceText(c.low_price)+'</td><td>'+priceText(c.close_price)+'</td><td>'+numberText(c.volume,4)+'</td><td>'+escapeHtml(dateText(c.received_at))+(c.live?' · LIVE':'')+'</td></tr>').join("")+'</tbody></table>':'<div class="market-loading">No candlesticks returned.</div>';
    if(marketCandleLive)setMarketBadge("market-candle-status","Live candle stream","connected");
  }

  const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const numberText=(value,digits=2)=>Number.isFinite(Number(value))?Number(value).toLocaleString(undefined,{maximumFractionDigits:digits}):"—";
  const priceText=value=>Number.isFinite(Number(value))?Number(value).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:Number(value)<1?6:2}):"—";
  const dateText=value=>value?new Date(value).toLocaleString():"—";
  const changeClass=value=>Number(value)>0?"market-positive":Number(value)<0?"market-negative":"market-neutral";
  const changeText=value=>Number.isFinite(Number(value))?(Number(value)>0?"+":"")+Number(value).toFixed(2)+"%":"—";
  function marketStatsHtml(summary){
    return '<div class="market-stat"><small>Tracked assets</small><b>'+numberText(summary?.tracked_assets,0)+'</b></div><div class="market-stat"><small>Fresh quotes</small><b>'+numberText(summary?.fresh_quotes,0)+' / '+numberText(summary?.tracked_assets,0)+'</b></div><div class="market-stat"><small>Average 24h move</small><b class="'+changeClass(summary?.average_change_24h_pct)+'">'+changeText(summary?.average_change_24h_pct)+'</b></div>';
  }
  function marketRowsHtml(rows,limit){
    const items=limit?rows.slice(0,limit):rows;
    if(!items.length)return '<div class="market-loading">No market readings were returned by the backend.</div>';
    return '<table class="data-table market-data-table"><thead><tr><th>Asset</th><th>Last price</th><th>24h change</th><th>24h high</th><th>24h low</th><th>24h volume</th><th>Source time</th></tr></thead><tbody>'+items.map(q=>'<tr data-market-symbol="'+escapeHtml(q.provider_symbol||((q.symbol||"")+(q.quote_currency||"USDT")))+'"><td><b>'+escapeHtml(q.symbol)+'</b><small class="market-asset-name">'+escapeHtml(q.name||q.asset_class||"")+'</small></td><td>'+priceText(q.price)+' '+escapeHtml(q.quote_currency||"USDT")+'</td><td class="'+changeClass(q.change_24h_pct)+'">'+changeText(q.change_24h_pct)+'</td><td>'+priceText(q.high_24h)+'</td><td>'+priceText(q.low_24h)+'</td><td>'+numberText(q.volume_24h,2)+'</td><td>'+escapeHtml(dateText(q.source_timestamp))+'</td></tr>').join("")+'</tbody></table>';
  }
  function renderMarketOverview(){
    if(!marketOverview)return;
    const {summary,provider,quotes,candle_freshness:candles}=marketOverview;
    const state=marketTickerConnected?"connected":(provider?.status==="healthy"&&summary?.fresh_quotes>0?"pending":"warning");
    const homeBadge=document.getElementById("market-home-provider");
    const monitorBadge=document.getElementById("market-monitor-provider");
    if(homeBadge){homeBadge.className="market-status-pill "+state;homeBadge.textContent=marketTickerConnected?"Live · Binance stream":(state==="pending"?"Supabase snapshot healthy":"Feed needs attention");}
    if(monitorBadge){monitorBadge.className="market-status-pill "+state;monitorBadge.textContent=marketTickerConnected?"Live · Binance stream":(state==="pending"?"Supabase snapshot healthy":"Feed needs attention");}
    const homeSummary=document.getElementById("market-home-summary");if(homeSummary)homeSummary.innerHTML=marketStatsHtml(summary);
    const monitorSummary=document.getElementById("market-monitor-summary");if(monitorSummary)monitorSummary.innerHTML=marketStatsHtml(summary);
    const sorted=[...quotes].sort((a,b)=>Math.abs(Number(b.change_24h_pct)||0)-Math.abs(Number(a.change_24h_pct)||0));
    const homeTable=document.getElementById("market-home-table");if(homeTable)homeTable.innerHTML=marketRowsHtml(sorted,12);
    const fullTable=document.getElementById("market-monitor-table");if(fullTable)fullTable.innerHTML=marketRowsHtml(quotes);
    const count=document.getElementById("market-monitor-count");if(count)count.textContent=numberText(quotes.length,0)+" verified asset quotes";
    const updated=document.getElementById("market-home-updated");if(updated)updated.textContent=marketLastTickAt?"Last live tick: "+dateText(marketLastTickAt):"Latest source: "+dateText(summary?.latest_source_timestamp)+" · Received: "+dateText(summary?.latest_received_at);
    const monitorUpdated=document.getElementById("market-monitor-updated");if(monitorUpdated)monitorUpdated.textContent=marketLastTickAt?"Last live tick: "+dateText(marketLastTickAt):"Latest backend receipt: "+dateText(summary?.latest_received_at);
    const system=document.getElementById("market-system-status");
    if(system){
      const rows=["5m","1h"].map(interval=>{const item=candles?.[interval]||{};return '<div class="settings-row"><span><b>'+interval+' candlesticks</b><small>Latest stored reading: '+escapeHtml(dateText(item.latest_received_at))+'</small></span><span class="market-status-pill '+(item.fresh?"connected":"warning")+'">'+(item.fresh?"Fresh":"Stale / unavailable")+'</span></div>';}).join("");
      system.innerHTML='<div class="panel-head"><div><h2>Market feed health</h2><p>Provider and candlestick freshness from Supabase</p></div><span class="market-status-pill '+state+'">'+escapeHtml(provider?.status||"unknown")+'</span></div><div class="settings-row"><span><b>Binance quote provider</b><small>Last successful ingestion: '+escapeHtml(dateText(provider?.last_success_at))+'</small></span><span class="market-status-pill '+state+'">'+escapeHtml(provider?.status||"unknown")+'</span></div><div class="settings-row"><span><b>Provider latency</b><small>Recorded backend latency</small></span><b>'+numberText(provider?.latency_ms,0)+' ms</b></div>'+rows;
    }
  }
  async function refreshMarketOverview(){
    if(marketLoading)return;
    marketLoading=true;
    try{
      const response=await fetch("/api/market/overview",{cache:"no-store"});
      if(!response.ok)throw new Error("Market API returned HTTP "+response.status);
      marketOverview=await response.json();
      renderMarketOverview();
    }catch(error){
      const message=escapeHtml(error instanceof Error?error.message:"Market data unavailable");
      ["market-home-table","market-monitor-table"].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML='<div class="market-loading market-error">Live market feed unavailable: '+message+'</div>';});
      ["market-home-provider","market-monitor-provider"].forEach(id=>{const el=document.getElementById(id);if(el){el.className="market-status-pill warning";el.textContent="Feed unavailable";}});
    }finally{marketLoading=false;}
  }
  async function refreshMarketCandles(){
    if(marketCandleLoading||activeScreen!=="market-monitor")return;
    const symbol=document.getElementById("market-candle-symbol")?.value||"BTC";
    const interval=document.getElementById("market-candle-interval")?.value||"5m";
    const target=document.getElementById("market-candle-table");if(!target)return;
    marketCandleLoading=true;
    try{
      const response=await fetch("/api/market/candles?symbol="+encodeURIComponent(symbol)+"&interval="+encodeURIComponent(interval),{cache:"no-store"});
      if(!response.ok)throw new Error("Candlestick API returned HTTP "+response.status);
      const payload=await response.json();
      marketCandleRows=payload.candles||[];
      const badge=document.getElementById("market-candle-status");
      if(badge){const fresh=payload.fresh===true;badge.className="market-status-pill "+(fresh?"connected":"warning");badge.textContent=fresh?"Stored candles fresh":"Stored candles stale";}
      renderMarketCandles();
      startMarketCandleSocket(payload.provider_symbol||((symbol+"USDT")),interval);
    }catch(error){target.innerHTML='<div class="market-loading market-error">'+escapeHtml(error instanceof Error?error.message:"Candlestick data unavailable")+'</div>';}
    finally{marketCandleLoading=false;}
  }

  const empty=(title,msg)=>`<div class="empty-state"><div class="empty-icon">◇</div><b>${title}</b><p>${msg}</p></div>`;
  const head=(eyebrow,title,subtitle,actions="")=>`<div class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="subtitle">${subtitle}</p></div><div class="head-actions">${actions}</div></div>`;
  const panel=(title,sub,body)=>`<section class="panel"><div class="panel-head"><div><h2>${title}</h2><p>${sub}</p></div><span class="tag">Backend pending</span></div>${body}</section>`;
  const metric=(title,desc)=>`<article class="metric"><div class="metric-label">${title}</div><div class="metric-value waiting">— — —</div><div class="metric-note">${desc}</div></article>`;
  const table=cols=>`<div class="table-tools"><label class="table-search"><span>⌕</span><input type="search" data-table-filter placeholder="Search this register" aria-label="Search this register" disabled></label><span class="table-count">0 records · backend not connected</span></div><div class="table-wrap"><table class="data-table"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join("")}</tr></thead><tbody><tr><td class="empty-row" colspan="${cols.length}"><span class="empty-table-icon">▤</span><b>No verified records yet</b><small>Connect the authorised backend when you are ready. No sample customer or financial data is displayed here.</small></td></tr></tbody></table></div>`;
  const notice=`<div class="info-banner"><strong>Preview mode.</strong> This screen contains no live customer records or fabricated figures. Backend data will appear only after secure server-side authentication, CEO authorization and access checks are verified.</div>`;
  const go=(label,id,style="secondary")=>`<button class="btn ${style}" data-screen="${id}">${label}</button>`;
  const pages={
    overview:()=>`${head("Executive workspace","Admin dashboard","Your central view of CryptoInvest platform oversight.") }
      <section class="dashboard-hero"><div><p class="eyebrow">CRYPTOINVEST · ADMINISTRATION</p><h2>Platform overview</h2><p>One clear starting point for customer accounts, investment records and verified reporting.</p><div class="hero-meta"><span class="hero-status"><i></i> Live market feed</span><span>·</span><span>Read-only workspace</span><span>·</span><span>Live market stream · private records locked</span></div></div><div class="hero-mark"><img src="./logo.svg" alt=""></div></section>
      <div class="section-heading"><div><h2>Customer accounts</h2><p>Verified account totals will appear after the protected data service is connected.</p></div><span class="tag">Awaiting verified data</span></div>
      <div class="grid three dashboard-metrics"><article class="metric"><div class="metric-top"><span class="metric-icon">♙</span><span class="metric-label">Total customer accounts</span><span class="metric-trend">Awaiting data</span></div><div class="metric-value waiting">— — —</div><div class="metric-note">Verified account count</div></article><article class="metric"><div class="metric-top"><span class="metric-icon">✓</span><span class="metric-label">Verified accounts</span><span class="metric-trend">Awaiting data</span></div><div class="metric-value waiting">— — —</div><div class="metric-note">Identity checks completed</div></article><article class="metric"><div class="metric-top"><span class="metric-icon">◎</span><span class="metric-label">Accounts requiring review</span><span class="metric-trend">Awaiting data</span></div><div class="metric-value waiting">— — —</div><div class="metric-note">Items awaiting human review</div></article></div>
      <section class="panel market-live-panel"><div class="panel-head"><div><h2>Live market overview</h2><p>Continuous market ticker stream with Supabase snapshots and stored market history</p></div><span id="market-home-provider" class="market-status-pill pending">Connecting…</span></div><div id="market-home-summary" class="market-summary-grid"><div class="market-stat"><small>Tracked assets</small><b>—</b></div><div class="market-stat"><small>Fresh quotes</small><b>—</b></div><div class="market-stat"><small>Average 24h move</small><b>—</b></div></div><div id="market-home-table" class="market-table-wrap"><div class="market-loading">Loading verified market readings…</div></div><div class="market-panel-foot"><span id="market-home-updated">Waiting for backend response</span><button class="text-link" data-screen="market-monitor">Open full market monitor ↗</button></div></section>
      <div class="dashboard-grid-main">
        <section class="panel dashboard-panel"><div class="panel-head"><div><h2>Platform activity</h2><p>Verified operational events will appear here</p></div><button class="text-link" data-screen="platform-activity">View activity ↗</button></div><div class="dashboard-empty"><span class="empty-illustration">⌁</span><b>Activity feed is waiting for a data source</b><p>Once connected, this area will show recent account, review and system events with their source and timestamp.</p></div></section>
        <section class="panel dashboard-panel"><div class="panel-head"><div><h2>Operational readiness</h2><p>Current workspace configuration</p></div><span class="tag">Preview</span></div><div class="readiness-list"><div class="readiness-row"><span class="readiness-icon">◈</span><span><b>CEO authentication</b><small>Secure login flow intentionally not included yet</small></span><em class="readiness-pending">Pending</em></div><div class="readiness-row"><span class="readiness-icon">⌘</span><span><b>Live market data</b><small>Supabase snapshots and live public ticker stream</small></span><em class="readiness-safe">Connected</em></div><div class="readiness-row"><span class="readiness-icon">▤</span><span><b>Private platform records</b><small>Customer and investment records await CEO MFA authorization</small></span><em class="readiness-pending">Protected</em></div><div class="readiness-row"><span class="readiness-icon">◉</span><span><b>Financial operations</b><small>Safety gate remains disabled</small></span><em class="readiness-safe">Disabled</em></div></div></section>
      </div>

`,
    customers:()=>`${head("Customer management","Customer directory","Search and review customer accounts through authorised, read-only access.",go("Verification queue","customer-verification"))}${notice}${panel("Customer accounts","Customer identity and account metadata",table(["Customer reference","Account status","Verification","Created","Last updated"]))}`,
    "customer-detail":()=>`${head("Customer management","Customer profile","A protected view of an individual customer record.")}${notice}<div class="grid two">${panel("Profile information","Loaded by customer reference",empty("No customer selected","Select a customer after the protected directory service is connected."))}${panel("Account status","Verification and access",empty("Awaiting backend","Customer identity and verification details are not exposed in this preview."))}</div>`,
    "customer-verification":()=>`${head("Customer management","Customer verification","Review verification states from the authorised customer records.")}${notice}${panel("Verification queue","No sample identities are displayed",table(["Customer reference","Verification state","Submitted","Review status"]))}`,
    "customer-status":()=>`${head("Customer management","Customer account status","Read-only account status and access overview.")}${notice}${panel("Account status register","Backend-sourced status only",table(["Customer reference","Account status","Restriction state","Last updated"]))}`,
    "investment-records":()=>`${head("Investment records","Investment record directory","Auditable recordkeeping and history. No transaction execution.")}${notice}${panel("Investment records","Permission-checked backend records",table(["Record reference","Customer reference","Plan","Record status","Updated"]))}`,
    "investment-plans":()=>`${head("Investment records","Investment plans","Review plan descriptions and publication status. Changes are not enabled in this preview.")}${notice}${panel("Plan catalogue","CEO-approved plan metadata only",table(["Plan reference","Plan name","Published status","Last updated"]))}`,
    "investment-detail":()=>`${head("Investment records","Investment record details","A read-only detail view for an authorised record.")}${notice}${panel("Record detail","No record selected",empty("Select a record","Detailed record metadata will load from the protected records endpoint."))}`,
    "investment-history":()=>`${head("Investment records","Investment history","Chronological record history from verified sources.")}${notice}${panel("Record history","No fabricated events",table(["Event reference","Record reference","Event type","Recorded at"]))}`,
    performance:()=>`${head("Reporting","Performance reports","Read-only summaries based on recorded and verified information.")}${notice}<div class="grid three">${metric("Recorded performance","Authorised records only")}${metric("Recorded gains / losses","No estimates or projections")}${metric("Reporting period","Backend-selected period")}</div><div style="margin-top:15px">${panel("Performance history","Verified report data",empty("No report data available","Charts and report exports will activate after the verified reporting endpoint is connected."))}</div>`,
    "customer-reports":()=>`${head("Reporting","Customer reports","Customer-scoped reporting with permission checks.")}${notice}${panel("Customer report register","No customer report data loaded",table(["Report reference","Customer reference","Period","Generated at"]))}`,
    "platform-reports":()=>`${head("Reporting","Platform reports","Aggregated platform reports from approved data sources.")}${notice}${panel("Platform report register","Verified reporting only",table(["Report reference","Report type","Period","Status"]))}`,
    "report-history":()=>`${head("Reporting","Report history","Audit-backed history of generated reports.")}${notice}${panel("Report history","No sample report history",table(["Report reference","Requested by","Report type","Created at"]))}`,
    "ai-operations":()=>`${head("Platform intelligence","AI operations centre","A human-reviewed assistant for operational explanations, data quality and security context.")}<div class="ai-status-card"><div class="ai-orb">✧</div><div><b>AI assistant is not connected yet</b><p>The workspace is prepared. The assistant will activate only after a secure backend connection, CEO authorization and approved AI service are verified.</p><span class="status offline">Waiting for backend connection</span></div></div><div class="grid two" style="margin-top:15px">${panel("Assistant workspace","Future assistant conversations",empty("Assistant is currently inactive","No prompts are sent and no AI responses are simulated in preview mode."))}${panel("Operational guardrails","Human approval remains required",'<div class="settings-row"><span><b>Read-only operational explanations</b><small>Only approved backend context may be used</small></span><span class="status offline">Not active</span></div><div class="settings-row"><span><b>Human review of recommendations</b><small>No autonomous administrative changes</small></span><span class="status">Required</span></div><div class="settings-row"><span><b>Financial actions</b><small>Not available to the assistant</small></span><span class="status">Disabled</span></div>')}</div><section class="panel ai-composer"><label for="ai-prompt">Ask the CryptoInvest assistant</label><textarea id="ai-prompt" rows="3" placeholder="Assistant activates after secure backend connection…" disabled></textarea><div class="ai-composer-foot"><small>Input disabled until backend and access checks are verified.</small><button class="btn" disabled>Send to assistant</button></div></section>`,
    "market-monitor":()=>`${head("Platform operations","Live market monitor","Live read-only market quotes and stored candlestick readings from the verified market feed.")}<section class="panel market-monitor-panel"><div class="panel-head"><div><h2>All tracked market assets</h2><p>Current stored quotes, 24-hour movement and source timestamps</p></div><span id="market-monitor-provider" class="market-status-pill pending">Connecting…</span></div><div id="market-monitor-summary" class="market-summary-grid"></div><div class="table-tools"><label class="table-search"><span>⌕</span><input type="search" data-table-filter placeholder="Filter assets by symbol or name" aria-label="Filter market assets"></label><span id="market-monitor-count" class="table-count">Waiting for readings</span></div><div id="market-monitor-table" class="market-table-wrap"><div class="market-loading">Loading market readings…</div></div><div class="market-panel-foot"><span id="market-monitor-updated">Market source timestamp pending</span><button class="btn secondary" id="market-refresh">Refresh readings</button></div></section><section class="panel candle-panel"><div class="panel-head"><div><h2>Stored candlestick readings</h2><p>OHLCV records persisted by the backend ingestion service</p></div><span id="market-candle-status" class="market-status-pill pending">Checking candles…</span></div><div class="candle-controls"><label>Asset<select id="market-candle-symbol"><option>BTC</option><option>ETH</option><option>BNB</option><option>SOL</option></select></label><label>Interval<select id="market-candle-interval"><option value="5m">5 minutes</option><option value="1h">1 hour</option></select></label></div><div id="market-candle-chart" class="market-candle-chart"><div class="market-loading">Loading live candlestick chart…</div></div><div id="market-candle-table" class="market-table-wrap"><div class="market-loading">Loading candlesticks…</div></div></section>`,
    "data-quality":()=>`${head("Platform operations","Data quality monitoring","Review validation status and data integrity signals.")}${notice}${panel("Data quality checks","Checks will be reported by verified backend jobs",table(["Check","Dataset","Result","Checked at"]))}`,
    "review-queue":()=>`${head("Platform operations","Review queue","Human review of flagged records and proposed operational recommendations.")}${notice}${panel("Items awaiting review","No actions are available in preview",table(["Review reference","Category","Priority","Submitted","Status"]))}`,
    "platform-activity":()=>`${head("Platform operations","Platform activity","Recent verified platform events from the protected activity feed.")}${notice}${panel("Platform activity timeline","System and operational events",table(["Event reference","Event category","Summary","Recorded at"]))}`,
    audit:()=>`${head("Governance","Platform activity & audit","Append-only history for authorised administrative activity.")}${notice}${panel("Audit event register","No sample or fabricated events are shown",table(["Event reference","Actor","Action","Target","Outcome","Timestamp"]))}`,
    security:()=>`${head("Security & governance","Security centre","Review authentication, sessions and access-control posture.")}${notice}<div class="grid three">${metric("Administrator identity","CEO allowlist check")}${metric("MFA assurance","AAL2 verification")}${metric("Session state","Server validated")}</div><div style="margin-top:15px">${panel("Access policy","Administrator and customer roles remain separate",'<div class="settings-row"><span><b>CEO-only administrator access</b><small>Server-side authorization required</small></span><span class="status offline">Not verified</span></div><div class="settings-row"><span><b>Customer row-level isolation</b><small>Customer may access own records only</small></span><span class="status offline">Not verified</span></div><div class="settings-row"><span><b>Financial operations</b><small>Platform safety control</small></span><span class="status">Disabled</span></div>')}</div>`,
    mfa:()=>`${head("Security & governance","CEO identity and MFA","Future secure identity flow. This preview does not collect credentials or verification codes.")}${notice}${panel("Required authentication checks","Server-enforced controls",'<div class="settings-row"><span><b>Supabase Auth session</b><small>Password sign-in</small></span><span class="status offline">Not connected</span></div><div class="settings-row"><span><b>CEO allowlist</b><small>Single authorised administrator</small></span><span class="status offline">Not verified</span></div><div class="settings-row"><span><b>MFA assurance</b><small>AAL2 required</small></span><span class="status offline">Not verified</span></div>')}`,
    profile:()=>`${head("Security & governance","Administrator profile","Authenticated administrator details and session information.")}${notice}${panel("Administrator identity","Loaded only after CEO authentication",empty("Profile not loaded","A protected profile endpoint is required."))}`,
    "session-management":()=>`${head("Security & governance","Session management","Server-validated administrator sessions.")}${notice}${panel("Active sessions","Private session data",table(["Session reference","Device","Created","Last active","Status"]))}`,
    "system-status":()=>`${head("System configuration","System status","Service health from verified checks only.")}${notice}<div class="grid three">${metric("Supabase connection","Server-side health check")}${metric("Admin API","Authenticated health check")}${metric("Hosting status","Verified deployment state")}</div><section id="market-system-status" class="panel market-live-panel"><div class="panel-head"><div><h2>Market feed health</h2><p>Provider and candlestick freshness from Supabase</p></div><span class="market-status-pill pending">Loading…</span></div></section>`,
    "backend-config":()=>`${head("System configuration","Backend configuration","Connection requirements and verification state. No credentials are displayed or collected.")}${notice}${panel("Backend connection","Protected server-side configuration",'<div class="settings-row"><span><b>Supabase project</b><small>Configured only in protected environment</small></span><span class="status offline">Not connected</span></div><div class="settings-row"><span><b>CEO authorization & AAL2</b><small>Server-side enforcement</small></span><span class="status offline">Not verified</span></div><div class="settings-row"><span><b>Financial operations</b><small>Safety gate</small></span><span class="status">Disabled</span></div>')}`,
    settings:()=>`${head("System configuration","Application settings","Application preferences and configuration status.")}${notice}${panel("Brand and interface","CryptoInvest identity",'<div class="settings-row"><span><b>Brand identity</b><small>Navy, charcoal and luxury gold design system</small></span><span class="tag">Preview</span></div><div class="settings-row"><span><b>Financial operations</b><small>Safety gate</small></span><span class="status">Disabled</span></div>')}`,
    "notification-settings":()=>`${head("System configuration","Notification settings","Review notification preferences and delivery configuration.")}${notice}${panel("Notification configuration","Delivery is not enabled in this preview",empty("Notification service not connected","No messages are sent from this interface."))}`,
    notifications:()=>`${head("Communications","Notifications","Review delivery state and approved message records.")}${notice}<div class="grid two">${panel("Notification history","Backend delivery records",empty("No notifications loaded","Delivery records will appear when the protected notification service is connected."))}${panel("Announcements","Human-reviewed communication",empty("No announcements loaded","Sending is not available in this preview."))}</div>`,
    support:()=>`${head("Support","Help & support","Guidance for authorised administrators and system maintainers.")}${notice}<div class="list-cards"><article class="list-card"><h3>Administrator access</h3><p>CEO authentication, MFA and session-control guidance.</p></article><article class="list-card"><h3>Data and recordkeeping</h3><p>Record provenance, customer access boundaries and audit history.</p></article></div>`,
    documentation:()=>`${head("Support","Documentation","Administrator guides and system operating notes.")}${notice}${panel("Documentation library","Guides will be published here",empty("Documentation is being prepared","No unsupported procedures are shown in this preview."))}`,
    "system-info":()=>`${head("Support","System information","Application identity and environment information.")}${notice}${panel("Environment","Preview build",'<div class="settings-row"><span><b>Application</b><small>CryptoInvest Admin Console</small></span><span class="tag">Preview</span></div><div class="settings-row"><span><b>Data access</b><small>Read-only preview</small></span><span class="status offline">Backend pending</span></div><div class="settings-row"><span><b>Financial operations</b><small>Platform safety gate</small></span><span class="status">Disabled</span></div>')}`
  };
  const primaryNavItems = [["overview","Home","⌂"],["customers","Customers","♙"],["investment-records","Investments","▤"],["performance","Reports","⌁"],["ai-operations","AI assistant","✧"]];
  const primaryScreenIds = new Set(primaryNavItems.map(([id])=>id));
  function renderPrimaryBottomNav(active){
    const nav=document.getElementById("primary-bottom-nav");
    nav.innerHTML=primaryNavItems.map(([id,label,icon])=>'<button type="button" class="primary-bottom-link'+(active===id?' active':'')+'" data-screen="'+id+'" aria-current="'+(active===id?'page':'false')+'"><span class="primary-bottom-icon">'+icon+'</span><span>'+label+'</span></button>').join("");
  }
  function renderNav(){
    // Keep all secondary destinations in the Home sidebar; primary screens
    // are available only through the persistent five-item bottom navigation.
    const excludedPrimaryIds=new Set(["overview","customers","investment-records","performance","ai-operations"]);
    const nav=document.getElementById("main-nav");
    const secondaryGroups=navGroups.map(([title,items])=>[title,items.filter(([id])=>!excludedPrimaryIds.has(id))]).filter(([,items])=>items.length);
    nav.innerHTML=secondaryGroups.map(([title,items])=>'<div class="nav-caption nav-caption-spaced">'+title+'</div>'+items.map(([id,name,icon])=>'<button class="nav-link" data-screen="'+id+'"><span class="nav-symbol">'+icon+'</span>'+name+'</button>').join("")).join("");
    nav.setAttribute("aria-label","Secondary screen navigation");
  }
  function navigate(id,writeHash=true){
    if(!pages[id])id="overview";
    activeScreen=id;
    const home=id==="overview";
    const primary=primaryScreenIds.has(id);
    const secondary=!primary;
    document.body.classList.toggle("home-screen",home);
    document.body.classList.toggle("primary-screen",primary);
    document.body.classList.toggle("secondary-screen",secondary);
    // The sidebar exists only on Home. Hide it at the DOM level on every other route.
    sidebar.hidden=!home;
    document.getElementById("mobile-overlay").classList.remove("show");
    document.getElementById("menu-toggle").setAttribute("aria-expanded","false");
    sidebar.toggleAttribute("inert",!home);
    sidebar.setAttribute("aria-hidden",String(!home));
    sidebar.classList.remove("open");
    document.getElementById("menu-toggle").hidden=!home;
    document.getElementById("back-home").hidden=!secondary;
    document.getElementById("nav-search-wrap").hidden=!home;
    document.getElementById("top-notifications").hidden=!home;
    document.querySelector(".profile-chip").hidden=!home;
    document.querySelector(".breadcrumbs").hidden=primary;
    crumb.textContent=labels[id]||"Home dashboard";
    view.innerHTML=pages[id]();
    if(["overview","market-monitor","system-status"].includes(id)){refreshMarketOverview();startMarketTicker();}else stopMarketTicker();
    if(id==="market-monitor")refreshMarketCandles();else stopMarketCandleSocket();
    renderPrimaryBottomNav(id);
    document.querySelectorAll(".nav-link").forEach(b=>{const active=b.dataset.screen===id;b.classList.toggle("active",active);if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");});
    if(writeHash)history.pushState({screen:id},"","#"+id);
    window.scrollTo({top:0,behavior:"instant"});
    view.focus({preventScroll:true});
  }
  renderNav();
  document.addEventListener("click",e=>{
    const target=e.target.closest("[data-screen]");
    if(target){e.preventDefault();navigate(target.dataset.screen);return;}
    if(e.target.closest("#menu-toggle")){const opened=sidebar.classList.toggle("open");document.getElementById("mobile-overlay").classList.toggle("show",opened);document.getElementById("menu-toggle").setAttribute("aria-expanded",String(opened));}
    if(e.target.closest("#mobile-overlay")){sidebar.classList.remove("open");document.getElementById("mobile-overlay").classList.remove("show");document.getElementById("menu-toggle").setAttribute("aria-expanded","false");}
  });
  document.addEventListener("change",e=>{
    if(e.target.matches("#market-candle-symbol,#market-candle-interval"))refreshMarketCandles();
  });
  document.addEventListener("click",e=>{
    if(e.target.closest("#market-refresh")){refreshMarketOverview();refreshMarketCandles();}
  });
  document.addEventListener("input",e=>{
    if(!e.target.matches("[data-table-filter]"))return;
    const query=e.target.value.trim().toLowerCase();
    const table=e.target.closest(".panel")?.querySelector(".data-table");
    if(!table)return;
    table.querySelectorAll("tbody tr").forEach(row=>{row.hidden=!!query&&!row.textContent.toLowerCase().includes(query);});
  });
  document.getElementById("back-home").addEventListener("click",()=>navigate("overview"));
  document.getElementById("top-notifications").addEventListener("click",()=>navigate("notifications"));
  document.getElementById("sidebar-notifications").addEventListener("click",()=>navigate("notifications"));
  document.getElementById("nav-search").addEventListener("input",e=>{
    const q=e.target.value.toLowerCase();
    document.querySelectorAll(".nav-link").forEach(b=>b.hidden=!b.textContent.toLowerCase().includes(q));
    document.querySelectorAll(".nav-caption").forEach(c=>{let n=c.nextElementSibling,visible=false;while(n&&n.classList.contains("nav-link")){if(!n.hidden)visible=true;n=n.nextElementSibling;}c.hidden=!visible;});
  });
  document.getElementById("nav-search").addEventListener("keydown",e=>{if(e.key==="Enter"){const first=[...document.querySelectorAll(".nav-link")].find(b=>!b.hidden);if(first)navigate(first.dataset.screen);}});
  window.addEventListener("popstate",()=>navigate(location.hash.slice(1)||"overview",false));
  document.addEventListener("keydown",e=>{if(e.key==="/"&&!e.ctrlKey&&!e.metaKey&&!["INPUT","TEXTAREA"].includes(document.activeElement.tagName)){const search=document.getElementById("nav-search");if(!search.closest("[hidden]")&&!search.disabled){e.preventDefault();search.focus();}}if(e.key==="Escape"){sidebar.classList.remove("open");document.getElementById("mobile-overlay").classList.remove("show");document.getElementById("menu-toggle").setAttribute("aria-expanded","false");}});
  navigate(location.hash.slice(1)||"overview",false);
  window.setInterval(()=>{if(["overview","market-monitor","system-status"].includes(activeScreen))refreshMarketOverview();if(activeScreen==="market-monitor")refreshMarketCandles();},30000);
})();