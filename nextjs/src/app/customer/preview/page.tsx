"use client";

import { useState } from "react";

const navigation = [
  ["Dashboard", "⌂"],
  ["My Profile", "♙"],
  ["Investment Plans", "▣"],
  ["My Investments", "↗"],
  ["Deposit", "⇩"],
  ["Withdrawals", "⇧"],
  ["Profit & Loss", "⌁"],
  ["Transactions", "☷"],
  ["Notifications", "♟"],
  ["Documents", "▤"],
  ["Support", "?"],
  ["Security", "⬡"],
] as const;

export default function CustomerPreviewPage() {
  const [active, setActive] = useState("Dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="ci-dashboard">
      <aside className={mobileOpen ? "ci-sidebar ci-sidebar-open" : "ci-sidebar"}>
        <a className="ci-brand" href="#dashboard">
          <span className="ci-brand-mark">↗</span>
          <span><strong>Crypto<span>Invest</span></strong><small>INVEST · GROW · PROSPER</small></span>
        </a>
        <div className="ci-nav-label">CUSTOMER MENU</div>
        <nav aria-label="Customer navigation">
          {navigation.map(([label, icon]) => (
            <button key={label} className={active === label ? "ci-nav-link active" : "ci-nav-link"} onClick={() => { setActive(label); setMobileOpen(false); }}>
              <span className="ci-nav-icon" aria-hidden="true">{icon}</span>{label}
              {label === "Notifications" && <b className="ci-count">3</b>}
            </button>
          ))}
        </nav>
        <div className="ci-sidebar-bottom">
          <div className="ci-secure"><span>◇</span><div><strong>Demo workspace</strong><small>Sample data only</small></div><i>✓</i></div>
          <div className="ci-sidebar-foot">CryptoInvest · Customer preview</div>
        </div>
      </aside>

      <div className="ci-main">
        <header className="ci-topbar">
          <button className="ci-hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">☰</button>
          <span className="ci-top-title">Customer Portal <i>/ {active}</i></span>
          <div className="ci-top-right"><span className="ci-demo-pill">● DEMO MODE</span><button className="ci-bell" aria-label="Notifications">♟<b>3</b></button><span className="ci-user-avatar">JD</span><span className="ci-user-name">John Doe⌄</span></div>
        </header>

        <main className="ci-content" id="dashboard">
          <div className="ci-demo-alert"><strong>DEMO PREVIEW — FICTIONAL SAMPLE CONTENT</strong><span>All balances, returns and activity below are illustrative only. No live account or financial services are connected.</span></div>

          {active === "Dashboard" ? (
            <>
              <section className="ci-hero">
                <div className="ci-hero-copy">
                  <p className="ci-eyebrow">YOUR FINANCIAL OVERVIEW</p>
                  <h1>Welcome back, <span>John Doe!</span></h1>
                  <p>Your investment journey continues. Stay informed and explore your portfolio overview.</p>
                  <button className="ci-gold-button" onClick={() => setActive("Investment Plans")}>View Investment Plans <span>→</span></button>
                </div>
                <div className="ci-hero-art" aria-hidden="true"><div className="ci-globe">₿</div><div className="ci-orbit orbit-one"/><div className="ci-orbit orbit-two"/></div>
              </section>

              <section className="ci-metrics" aria-label="Sample account summary">
                <article className="ci-metric"><div className="ci-metric-head"><span>Account Balance</span><b>▣</b></div><strong>$12,500.00</strong><small>Illustrative sample balance</small></article>
                <article className="ci-metric"><div className="ci-metric-head"><span>Total Investments</span><b>▥</b></div><strong>$10,000.00</strong><small>Fictional recorded amount</small></article>
                <article className="ci-metric"><div className="ci-metric-head"><span>Total Profit / Loss</span><b>↗</b></div><strong>$1,250.00</strong><small>Not an actual return</small></article>
                <article className="ci-metric"><div className="ci-metric-head"><span>Active Plans</span><b>★</b></div><strong>02</strong><small>Sample plan count</small></article>
              </section>

              <section className="ci-middle">
                <article className="ci-panel ci-performance">
                  <div className="ci-panel-title"><div><span className="ci-panel-icon">▥</span><h2>Portfolio Performance</h2></div><span className="ci-period">Sample · 30 days⌄</span></div>
                  <div className="ci-chart">
                    <div className="ci-y-labels"><span>20%</span><span>15%</span><span>10%</span><span>5%</span><span>0%</span></div>
                    <svg viewBox="0 0 620 205" role="img" aria-label="Illustrative portfolio performance chart">
                      <defs><linearGradient id="ci-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#d99b1e" stopOpacity=".48"/><stop offset="100%" stopColor="#d99b1e" stopOpacity=".02"/></linearGradient></defs>
                      {[10,55,100,145,190].map(y=><line key={y} x1="0" y1={y} x2="620" y2={y} stroke="#343434" strokeDasharray="3 5"/>)}
                      <path d="M0 174 C35 163 43 151 65 143 S105 155 130 138 S170 121 190 104 S236 110 260 119 S295 91 320 101 S354 112 375 85 S411 44 437 62 S472 88 495 73 S526 61 550 76 S588 58 620 43 L620 190 L0 190Z" fill="url(#ci-fill)"/>
                      <path d="M0 174 C35 163 43 151 65 143 S105 155 130 138 S170 121 190 104 S236 110 260 119 S295 91 320 101 S354 112 375 85 S411 44 437 62 S472 88 495 73 S526 61 550 76 S588 58 620 43" fill="none" stroke="#e8aa2e" strokeWidth="3.5" strokeLinecap="round"/>
                      <circle cx="620" cy="43" r="5" fill="#e8aa2e" stroke="#fff" strokeWidth="2"/>
                    </svg>
                    <div className="ci-x-labels"><span>Apr 1</span><span>Apr 8</span><span>Apr 15</span><span>Apr 22</span><span>Apr 30</span></div>
                  </div>
                  <p className="ci-chart-note">Illustrative chart only — not calculated from a live portfolio.</p>
                </article>

                <div className="ci-right-stack">
                  <article className="ci-panel ci-plan">
                    <div className="ci-panel-title"><div><span className="ci-panel-icon">▣</span><h2>Your Investment Plans</h2></div><button className="ci-text-button" onClick={() => setActive("Investment Plans")}>View All →</button></div>
                    <div className="ci-plan-body"><div className="ci-plan-art">₿<span>₿</span></div><div className="ci-plan-copy"><strong>Premium Growth Plan</strong><small>Sample minimum: $1,000</small><small>Illustrative return: 15%</small><em>DEMO PLAN</em></div><button className="ci-outline-button" onClick={() => setActive("Investment Plans")}>View Plan</button></div>
                  </article>
                  <article className="ci-panel ci-activity">
                    <div className="ci-panel-title"><div><span className="ci-panel-icon">▣</span><h2>Recent Activity</h2></div><button className="ci-text-button" onClick={() => setActive("Transactions")}>View All →</button></div>
                    <div className="ci-activity-row"><b className="ci-activity-icon green">↓</b><span><strong>Sample deposit record</strong><small>Demo entry · Pending</small></span><strong className="ci-amount">$1,000.00</strong></div>
                    <div className="ci-activity-row"><b className="ci-activity-icon blue">↗</b><span><strong>Sample account update</strong><small>Demo entry · Apr 28</small></span><strong className="ci-amount">$250.00</strong></div>
                    <div className="ci-activity-row"><b className="ci-activity-icon purple">♟</b><span><strong>New notification</strong><small>Sample message · Apr 27</small></span><strong className="ci-amount muted">Demo</strong></div>
                  </article>
                </div>
              </section>

              <section className="ci-bottom">
                <article className="ci-panel ci-quick">
                  <div className="ci-panel-title"><div><span className="ci-panel-icon">✦</span><h2>Quick Actions</h2></div></div>
                  <div className="ci-quick-grid">
                    <button onClick={() => setActive("Deposit")}><b className="green">↓</b><strong>Deposit</strong><small>View sample records</small></button>
                    <button onClick={() => setActive("Withdrawals")}><b className="blue">↑</b><strong>Withdrawals</strong><small>View sample records</small></button>
                    <button onClick={() => setActive("Transactions")}><b className="purple">☷</b><strong>Transactions</strong><small>View activity</small></button>
                    <button onClick={() => setActive("Support")}><b className="gold">◉</b><strong>Contact Support</strong><small>Explore help</small></button>
                  </div>
                </article>
                <article className="ci-panel ci-status"><div className="ci-panel-title"><div><span className="ci-panel-icon">⬡</span><h2>Account Status</h2></div></div><div className="ci-status-body"><b>✓</b><span><strong>Demo account</strong><small>Identity verification is not performed in this preview.</small></span></div><button className="ci-gold-button small" onClick={() => setActive("Security")}>View Security <span>→</span></button></article>
                <article className="ci-panel ci-help"><div className="ci-help-symbol">◉</div><h2>Need Help?</h2><p>Explore the customer support area for assistance and common questions.</p><button className="ci-gold-button small" onClick={() => setActive("Support")}>Contact Support <span>→</span></button></article>
              </section>
            </>
          ) : (
            <section className="ci-section-placeholder">
              <p className="ci-eyebrow">CUSTOMER WORKSPACE · DEMO</p><h1>{active}</h1>
              <p>This screen is part of the customer portal design preview. Its live data and normal account connections will be planned and implemented only after the frontend has been approved.</p>
              <div className="ci-placeholder-card"><strong>{active === "Deposit" || active === "Withdrawals" ? "Financial actions are disabled" : "Screen layout preview"}</strong><span>{active === "Deposit" || active === "Withdrawals" ? "No payment, withdrawal or money movement can be initiated here." : "No customer database or live account is connected to this page."}</span></div>
              <button className="ci-gold-button" onClick={() => setActive("Dashboard")}>← Back to Dashboard</button>
            </section>
          )}
          <footer className="ci-footer"><span>© 2026 CryptoInvest. All rights reserved.</span><span>Secure customer experience · Demo preview</span></footer>
        </main>
      </div>

      <style jsx global>{`
        .ci-dashboard{--gold:#e5aa2b;--gold2:#c88a12;--bg:#0b0b0c;--panel:#151517;--line:#303034;--muted:#a8a8b0;min-height:100vh;background:var(--bg);color:#f5f5f7;font-family:Arial,Helvetica,sans-serif;font-size:14px}
        .ci-dashboard *{box-sizing:border-box}.ci-dashboard button{font:inherit;cursor:pointer}.ci-sidebar{position:fixed;z-index:20;inset:0 auto 0 0;width:232px;padding:25px 15px 18px;background:#101012;border-right:1px solid #29292d;display:flex;flex-direction:column}.ci-brand{display:flex;align-items:center;gap:11px;padding:0 8px 30px;color:#fff;text-decoration:none}.ci-brand-mark{display:grid;place-items:center;width:43px;height:43px;border:2px solid var(--gold);border-radius:50%;color:var(--gold);font-size:28px;font-weight:800}.ci-brand strong{display:block;font-size:20px;letter-spacing:-.8px}.ci-brand strong span{color:var(--gold)}.ci-brand small{display:block;margin-top:4px;color:#c8c8ce;font-size:8px;letter-spacing:1.4px}.ci-nav-label{padding:0 10px 10px;color:#77777f;font-size:9px;font-weight:800;letter-spacing:1.4px}.ci-sidebar nav{display:grid;gap:5px}.ci-nav-link{display:flex;align-items:center;gap:13px;width:100%;min-height:43px;padding:9px 12px;border:0;border-radius:9px;background:transparent;color:#e4e4e8;text-align:left;font-size:12px}.ci-nav-link:hover{background:#222226}.ci-nav-link.active{background:linear-gradient(100deg,#e7b43b,#bd850d);color:#17120a;font-weight:800}.ci-nav-icon{display:grid;place-items:center;width:21px;font-size:19px}.ci-count{margin-left:auto;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#e33b32;color:white;font-size:10px}.ci-sidebar-bottom{margin-top:auto}.ci-secure{display:flex;align-items:center;gap:10px;padding:13px 10px;border:1px solid #a97b1b;border-radius:11px}.ci-secure>span{color:var(--gold);font-size:24px}.ci-secure strong,.ci-secure small{display:block}.ci-secure strong{font-size:11px}.ci-secure small{margin-top:4px;color:#aaa;font-size:9px}.ci-secure i{margin-left:auto;color:#42d88c}.ci-sidebar-foot{padding:16px 3px 0;color:#6f6f77;font-size:9px}.ci-main{min-height:100vh;margin-left:232px}.ci-topbar{height:68px;display:flex;align-items:center;gap:18px;padding:0 30px;background:#101012;border-bottom:1px solid #2b2b30}.ci-hamburger{border:0;background:none;color:#fff;font-size:24px}.ci-top-title{color:#ddd;font-size:12px}.ci-top-title i{color:#8d8d96;font-style:normal}.ci-top-right{display:flex;align-items:center;gap:13px;margin-left:auto}.ci-demo-pill{color:#e8bb5d;font-size:9px;font-weight:800;letter-spacing:1px}.ci-bell{position:relative;border:0;background:none;color:#eee;font-size:20px}.ci-bell b{position:absolute;top:-7px;right:-7px;display:grid;place-items:center;width:16px;height:16px;border-radius:50%;background:#e43d32;color:white;font-size:9px}.ci-user-avatar{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--gold);color:#19130a;font-size:11px;font-weight:900}.ci-user-name{font-size:11px}.ci-content{max-width:1600px;margin:auto;padding:20px 22px 18px}.ci-demo-alert{display:flex;flex-wrap:wrap;gap:8px 15px;padding:10px 13px;margin-bottom:15px;border:1px solid #6c501c;border-radius:8px;background:#251c0d;color:#f3d58d;font-size:10px}.ci-demo-alert strong{letter-spacing:.5px}.ci-demo-alert span{color:#d4c39e}.ci-hero{position:relative;display:flex;align-items:center;min-height:220px;overflow:hidden;padding:25px 30px;margin-bottom:16px;border:1px solid #3d2e12;border-radius:14px;background:radial-gradient(ellipse at 78% 45%,#69430e 0%,#2a1d0b 30%,#111 70%)}.ci-hero:after{position:absolute;content:"";inset:0;background:repeating-linear-gradient(165deg,transparent 0 42px,#c58a1b12 43px 44px);pointer-events:none}.ci-hero-copy{position:relative;z-index:2;max-width:580px}.ci-eyebrow{margin:0 0 9px;color:var(--gold);font-size:9px;font-weight:800;letter-spacing:1.7px}.ci-hero h1{margin:0 0 9px;font-size:clamp(25px,3vw,39px);letter-spacing:-1.4px}.ci-hero h1 span{color:var(--gold)}.ci-hero-copy>p:not(.ci-eyebrow){max-width:520px;margin:0 0 17px;color:#d1d1d5;font-size:13px;line-height:1.6}.ci-gold-button{display:inline-flex;align-items:center;gap:16px;padding:11px 17px;border:0;border-radius:9px;background:linear-gradient(100deg,#f0c24f,#d99a1a);color:#17120a;font-size:11px;font-weight:900}.ci-gold-button:hover{filter:brightness(1.08)}.ci-gold-button span{font-size:17px}.ci-gold-button.small{padding:9px 13px;font-size:10px}.ci-hero-art{position:absolute;inset:0 0 0 53%;overflow:hidden}.ci-globe{position:absolute;right:12%;top:50%;display:grid;place-items:center;width:178px;height:178px;transform:translateY(-50%);border:2px solid #dca22e;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f6ca65,#98600d 55%,#251708 80%);box-shadow:0 0 35px #d99b2e77,inset 0 0 30px #f9d77a66;color:#4a2b05;font-size:72px;font-weight:900}.ci-orbit{position:absolute;right:1%;top:50%;width:340px;height:130px;border:1px solid #dca22e88;border-radius:50%;transform:translateY(-50%) rotate(-22deg)}.orbit-two{right:4%;width:390px;height:170px;transform:translateY(-50%) rotate(25deg);border-color:#e4a52c44}.ci-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin-bottom:16px}.ci-metric,.ci-panel{min-width:0;border:1px solid var(--line);border-radius:12px;background:linear-gradient(145deg,#19191c,#121214);box-shadow:0 8px 22px #0003}.ci-metric{padding:16px 17px}.ci-metric-head{display:flex;align-items:center;justify-content:space-between;color:#c6c6cd;font-size:11px}.ci-metric-head b{color:var(--gold);font-size:22px}.ci-metric>strong{display:block;margin:10px 0 5px;font-size:24px;letter-spacing:-.7px}.ci-metric>small{color:#92929a;font-size:9px}.ci-middle{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(360px,.88fr);gap:14px;margin-bottom:14px}.ci-panel{padding:16px}.ci-panel-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:15px}.ci-panel-title>div{display:flex;align-items:center;gap:10px;min-width:0}.ci-panel-icon{color:var(--gold);font-size:19px}.ci-panel h2{margin:0;font-size:14px;letter-spacing:-.2px}.ci-period{padding:7px 9px;border:1px solid #3a3a40;border-radius:7px;color:#ddd;font-size:9px}.ci-chart{display:grid;grid-template-columns:32px minmax(0,1fr);gap:7px}.ci-y-labels{display:flex;flex-direction:column;justify-content:space-between;padding:1px 0 24px;color:#c6c6ca;font-size:9px}.ci-chart svg{display:block;width:100%;height:190px;overflow:visible}.ci-x-labels{grid-column:2;display:flex;justify-content:space-between;color:#c6c6ca;font-size:9px}.ci-chart-note{margin:10px 0 0;color:#77777f;font-size:8px}.ci-right-stack{display:grid;grid-template-rows:auto 1fr;gap:14px;min-width:0}.ci-text-button{border:0;background:none;color:var(--gold);font-size:10px;font-weight:700;white-space:nowrap}.ci-plan-body{display:flex;align-items:center;gap:12px}.ci-plan-art{display:grid;place-items:center;position:relative;flex:0 0 78px;height:67px;border-radius:8px;background:radial-gradient(circle at 50% 30%,#dca63a,#57390f 65%,#1b1409);color:#f4cf75;font-size:37px}.ci-plan-art span{position:absolute;right:9px;bottom:3px;font-size:18px}.ci-plan-copy{display:grid;gap:5px;min-width:0}.ci-plan-copy strong{font-size:11px}.ci-plan-copy small{color:#b2b2b9;font-size:9px}.ci-plan-copy em{width:fit-content;padding:4px 7px;border:1px solid #97701d;border-radius:5px;color:#edc15b;font-size:8px;font-style:normal;font-weight:800}.ci-outline-button{margin-left:auto;padding:8px 9px;border:1px solid var(--gold);border-radius:7px;background:transparent;color:var(--gold);font-size:9px;white-space:nowrap}.ci-activity{padding-bottom:10px}.ci-activity .ci-panel-title{margin-bottom:8px}.ci-activity-row{display:flex;align-items:center;gap:9px;padding:8px 0;border-top:1px solid #2d2d31}.ci-activity-icon{display:grid;place-items:center;flex:0 0 29px;width:29px;height:29px;border-radius:50%;font-size:16px}.ci-activity-icon.green,.ci-quick-grid b.green{background:#123d2b;color:#39d98b}.ci-activity-icon.blue,.ci-quick-grid b.blue{background:#142c47;color:#4ca5f7}.ci-activity-icon.purple,.ci-quick-grid b.purple{background:#321849;color:#d06aff}.ci-activity-row>span{display:grid;gap:4px;min-width:0}.ci-activity-row>span strong{font-size:9px}.ci-activity-row>span small{color:#9d9da5;font-size:8px}.ci-amount{margin-left:auto;color:#39d98b;font-size:10px;white-space:nowrap}.ci-amount.muted{color:#aaa}.ci-bottom{display:grid;grid-template-columns:1.25fr .9fr .95fr;gap:14px}.ci-quick-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.ci-quick-grid button{display:flex;align-items:center;flex-direction:column;gap:6px;padding:10px 4px;border:1px solid #333338;border-radius:9px;background:#1b1b1f;color:#f5f5f5}.ci-quick-grid button:hover{border-color:#a47b27}.ci-quick-grid b{display:grid;place-items:center;width:33px;height:33px;border-radius:50%;font-size:18px}.ci-quick-grid b.gold{background:#44320f;color:var(--gold)}.ci-quick-grid strong{font-size:9px}.ci-quick-grid small{color:#92929a;font-size:8px;text-align:center}.ci-status-body{display:flex;align-items:center;gap:10px;margin:17px 0}.ci-status-body>b{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;background:#123d2b;color:#3de08d;font-size:20px}.ci-status-body span{display:grid;gap:5px}.ci-status-body strong{color:#e8bd58;font-size:11px}.ci-status-body small{color:#a8a8b0;font-size:9px;line-height:1.5}.ci-help{background:radial-gradient(circle at 90% 80%,#56350e,#1a1711 65%)}.ci-help-symbol{color:var(--gold);font-size:23px}.ci-help h2{margin:5px 0 7px}.ci-help p{max-width:260px;margin:0 0 14px;color:#bdbdc4;font-size:10px;line-height:1.6}.ci-footer{display:flex;justify-content:space-between;gap:12px;padding:17px 2px 0;color:#77777f;font-size:9px}.ci-section-placeholder{min-height:65vh;padding:38px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}.ci-section-placeholder h1{font-size:32px}.ci-section-placeholder>p:not(.ci-eyebrow){max-width:650px;color:#aaa;line-height:1.7}.ci-placeholder-card{display:grid;gap:8px;max-width:550px;padding:20px;margin:25px 0;border:1px dashed #65501f;border-radius:10px;background:#211a0d}.ci-placeholder-card strong{color:#e9bd5b}.ci-placeholder-card span{color:#c1b69d;font-size:12px}.ci-dashboard button:focus-visible{outline:2px solid #f4c34d;outline-offset:3px}
        @media(max-width:1250px){.ci-middle{grid-template-columns:1fr}.ci-right-stack{grid-template-columns:1fr 1fr;grid-template-rows:auto}.ci-bottom{grid-template-columns:1fr 1fr}.ci-help{grid-column:span 2}.ci-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:850px){.ci-sidebar{transform:translateX(-102%);transition:transform .2s ease;box-shadow:10px 0 30px #0008}.ci-sidebar-open{transform:translateX(0)}.ci-main{margin-left:0}.ci-topbar{padding:0 16px}.ci-content{padding:15px}.ci-hero{min-height:210px}.ci-hero-art{opacity:.5;left:45%}.ci-bottom{grid-template-columns:1fr 1fr}.ci-quick{grid-column:span 2}}
        @media(max-width:560px){.ci-topbar{height:58px;gap:9px;padding:0 11px}.ci-top-title{font-size:10px}.ci-demo-pill{font-size:8px}.ci-user-name{display:none}.ci-top-right{gap:8px}.ci-user-avatar{width:30px;height:30px}.ci-content{padding:12px}.ci-demo-alert{display:grid;font-size:9px}.ci-hero{min-height:220px;padding:22px 17px}.ci-hero h1{font-size:26px}.ci-hero-copy>p:not(.ci-eyebrow){max-width:280px;font-size:11px}.ci-hero-art{left:40%;opacity:.27}.ci-globe{right:0;width:130px;height:130px;font-size:54px}.ci-metrics{gap:8px}.ci-metric{padding:12px}.ci-metric>strong{font-size:19px}.ci-metric-head{font-size:9px}.ci-metric>small{font-size:8px}.ci-middle{gap:10px}.ci-panel{padding:13px}.ci-panel h2{font-size:12px}.ci-right-stack{grid-template-columns:1fr;grid-template-rows:auto auto}.ci-plan-body{gap:8px}.ci-plan-art{flex-basis:62px;height:60px}.ci-plan-copy strong{font-size:10px}.ci-outline-button{font-size:8px;padding:7px}.ci-bottom{grid-template-columns:1fr}.ci-quick,.ci-help{grid-column:auto}.ci-quick-grid{gap:5px}.ci-quick-grid button{padding:9px 2px}.ci-quick-grid strong{font-size:8px}.ci-quick-grid small{font-size:7px}.ci-footer{font-size:8px;flex-direction:column}.ci-section-placeholder{padding:22px 16px}.ci-section-placeholder h1{font-size:26px}}
      `}</style>
    </div>
  );
}
