import {
  ArrowDownLeft,
  BarChart3,
  Bell,
  BookOpenText,
  BriefcaseBusiness,
  ChevronLeft,
  Cpu,
  FileText,
  LayoutGrid,
  LogOut,
  PieChart,
  Search,
  ServerCog,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Users,
  WalletCards,
  Activity,
  ArrowUpRight,
  AlertTriangle,
} from 'lucide-react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { mockCustomers, mockDepositRequests, mockMetrics, mockWithdrawalRequests, mockNavItems } from './data/mockData';
import type { StatusTone } from './types';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

function ProtectedLayout() {
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  return (
    <div className="app-shell">
      {isDashboard ? <Sidebar /> : null}
      <main className={`main-content ${isDashboard ? 'dashboard-main' : 'secondary-main'}`}>
        {!isDashboard ? <TopHeader /> : null}
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/deposits" element={<DepositsPage />} />
          <Route path="/withdrawals" element={<WithdrawalsPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/ledger" element={<LedgerPage />} />
          <Route path="/reconciliation" element={<ReconciliationPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-wrap">
        <Logo />
      </div>
      <nav className="nav-group">
        {mockNavItems.map((item) => (
          <Link key={item.to} to={item.to} className="nav-item">
            <span className="nav-icon">{renderIcon(item.icon)}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="avatar-chip">CEO</div>
        <div>
          <strong>Alex Morgan</strong>
          <small>Chief Executive</small>
        </div>
      </div>
    </aside>
  );
}

function TopHeader() {
  const navigate = useNavigate();
  return (
    <header className="topbar">
      <div className="back-row">
        <button className="ghost-button" onClick={() => navigate('/')}>
          <ChevronLeft size={16} /> Back to dashboard
        </button>
      </div>
      <div className="topbar-right">
        <div className="search-box">
          <Search size={15} />
          <input placeholder="Quick search" aria-label="Quick search" />
        </div>
        <button className="icon-button" aria-label="Notifications">
          <Bell size={16} />
        </button>
        <button className="icon-button" aria-label="Sign out" onClick={() => navigate('/login')}>
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

function DashboardPage() {
  return (
    <div className="page-wrap">
      <header className="page-header dashboard-header">
        <div>
          <p className="eyebrow">Operations overview</p>
          <h1>CEO dashboard</h1>
        </div>
        <div className="header-actions">
          <button className="secondary-button">Refresh</button>
          <button className="primary-button">Review pending</button>
        </div>
      </header>

      <div className="metrics-grid">
        {mockMetrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="content-grid two-col">
        <SectionCard title="Portfolio allocation" subtitle="Simulated allocation — development only">
          <div className="allocation-list">
            {[
              { asset: 'Bitcoin', value: '38%', color: 'var(--primary-blue)' },
              { asset: 'Ethereum', value: '27%', color: 'var(--electric-cyan)' },
              { asset: 'Solana', value: '14%', color: 'var(--dark-navy)' },
              { asset: 'Stablecoins', value: '11%', color: 'var(--success-green)' },
              { asset: 'Other', value: '10%', color: 'var(--accent-purple)' },
            ].map((item) => (
              <div key={item.asset} className="allocation-row">
                <span className="swatch" style={{ background: item.color }} />
                <span>{item.asset}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="System health" subtitle="Integration status">
          <div className="stack-list">
            {[
              { name: 'Supabase', status: 'Connected', tone: 'success' },
              { name: 'Cloudflare Worker', status: 'Operational', tone: 'success' },
              { name: 'Market data feed', status: 'Degraded', tone: 'warning' },
              { name: 'Wallet provider', status: 'Not configured', tone: 'neutral' },
            ].map((item) => (
              <div key={item.name} className="status-row">
                <span>{item.name}</span>
                <StatusBadge tone={item.tone as StatusTone}>{item.status}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="content-grid two-col">
        <SectionCard title="Recent activity" subtitle="Administrative events">
          <ul className="timeline">
            {[
              'Deposit approved for Ava Walker',
              'Risk review queued for Noah Singh',
              'BTC buy order simulation created',
              'Market data provider check resumed',
            ].map((item) => (
              <li key={item}>
                <Activity size={14} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Pending review" subtitle="Customer-facing operations requiring action">
          <div className="stack-list">
            <div className="status-row"><span>Deposits</span><strong>14</strong></div>
            <div className="status-row"><span>Withdrawals</span><strong>7</strong></div>
            <div className="status-row"><span>Orders</span><strong>9</strong></div>
            <div className="status-row"><span>Reconciliation</span><strong>3 warnings</strong></div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function CustomersPage() {
  return (
    <PageTemplate title="Customer management" subtitle="Account review and user records">
      <TableSection
        columns={['Customer', 'Email', 'Status', 'Portfolio', 'Last active']}
        rows={mockCustomers.map((customer) => [
          customer.name,
          customer.email,
          <StatusBadge key={`${customer.id}-status`} tone={customer.status === 'verified' ? 'success' : customer.status === 'pending' ? 'warning' : 'danger'}>{customer.status}</StatusBadge>,
          customer.portfolio,
          customer.lastActive,
        ])}
      />
    </PageTemplate>
  );
}

function DepositsPage() {
  return (
    <PageTemplate title="Deposit requests" subtitle="Review and approve incoming funds in development mode">
      <TableSection
        columns={['ID', 'Customer', 'Asset', 'Amount', 'Status', 'Reference']}
        rows={mockDepositRequests.map((request) => [
          request.id,
          request.customer,
          `${request.asset} / ${request.currency}`,
          `${request.amount} ${request.asset}`,
          <StatusBadge key={`${request.id}-status`} tone={request.status === 'approved' ? 'success' : request.status === 'pending' ? 'warning' : 'neutral'}>{request.status}</StatusBadge>,
          request.reference,
        ])}
      />
    </PageTemplate>
  );
}

function WithdrawalsPage() {
  return (
    <PageTemplate title="Withdrawal requests" subtitle="Review payout requests and route to providers">
      <TableSection
        columns={['ID', 'Customer', 'Asset', 'Amount', 'Status', 'Destination']}
        rows={mockWithdrawalRequests.map((request) => [
          request.id,
          request.customer,
          request.asset,
          `${request.amount} ${request.asset}`,
          <StatusBadge key={`${request.id}-status`} tone={request.status === 'completed' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'}>{request.status}</StatusBadge>,
          request.destination,
        ])}
      />
    </PageTemplate>
  );
}

function PlansPage() {
  return (
    <PageTemplate title="Investment plans" subtitle="Publicly available simulated strategies">
      <div className="list-grid">
        {[
          { name: 'Balanced Growth', status: 'Approved', risk: 'Medium' },
          { name: 'Alpha Momentum', status: 'Simulation', risk: 'High' },
          { name: 'Stable Yield', status: 'Disabled', risk: 'Low' },
        ].map((plan) => (
          <SectionCard key={plan.name} title={plan.name} subtitle={plan.risk}>
            <div className="plan-meta">
              <StatusBadge tone={plan.status === 'Approved' ? 'success' : plan.status === 'Simulation' ? 'info' : 'neutral'}>{plan.status}</StatusBadge>
            </div>
          </SectionCard>
        ))}
      </div>
    </PageTemplate>
  );
}

function OrdersPage() {
  return (
    <PageTemplate title="Orders" subtitle="Simulated order management">
      <TableSection
        columns={['Order', 'Type', 'Asset', 'Amount', 'Status', 'Mode']}
        rows={[
          ['ORD-4401', 'Buy', 'BTC', '0.18 BTC', 'Simulated', 'Simulation'],
          ['ORD-4402', 'Sell', 'ETH', '2.1 ETH', 'Pending', 'Simulation'],
          ['ORD-4403', 'Buy', 'SOL', '40 SOL', 'Rejected', 'Simulation'],
        ]}
      />
    </PageTemplate>
  );
}

function PortfolioPage() {
  return (
    <PageTemplate title="Portfolio" subtitle="Position overview and value tracking">
      <div className="content-grid two-col">
        {[
          { asset: 'BTC', size: '1.82 BTC', value: '$118,400', pnl: '+$12,200' },
          { asset: 'ETH', size: '14.4 ETH', value: '$41,600', pnl: '+$5,400' },
          { asset: 'SOL', size: '440 SOL', value: '$31,800', pnl: '-$1,850' },
        ].map((position) => (
          <SectionCard key={position.asset} title={position.asset} subtitle={position.size}>
            <div className="position-row">
              <span>Value</span>
              <strong>{position.value}</strong>
            </div>
            <div className="position-row">
              <span>P/L</span>
              <strong>{position.pnl}</strong>
            </div>
          </SectionCard>
        ))}
      </div>
    </PageTemplate>
  );
}

function ReportsPage() {
  return (
    <PageTemplate title="Reports" subtitle="Performance and activity views">
      <div className="content-grid two-col">
        <SectionCard title="Realized P/L" subtitle="Verified execution output">
          <div className="kpi">+$128.4K</div>
        </SectionCard>
        <SectionCard title="Unrealized valuation" subtitle="Market-based change">
          <div className="kpi">+$245.7K</div>
        </SectionCard>
      </div>
    </PageTemplate>
  );
}

function LedgerPage() {
  return (
    <PageTemplate title="Transactions and ledger" subtitle="Read-only posting records">
      <TableSection
        columns={['ID', 'Type', 'Asset', 'Amount', 'Status', 'Reference']}
        rows={[
          ['LED-8891', 'Credit', 'USD', '+$12,000', 'Posted', 'DEP-2024-001'],
          ['LED-8892', 'Debit', 'BTC', '-0.18 BTC', 'Posted', 'ORD-4401'],
          ['LED-8893', 'Fee', 'ETH', '-0.018 ETH', 'Posted', 'ORD-4402'],
        ]}
      />
    </PageTemplate>
  );
}

function ReconciliationPage() {
  return (
    <PageTemplate title="Reconciliation" subtitle="Source comparison and discrepancy tracking">
      <TableSection
        columns={['Run ID', 'Source', 'Status', 'Total', 'Discrepancy']}
        rows={[
          ['REC-401', 'Market Feed', 'Warning', '12 records', '3 mismatches'],
          ['REC-402', 'Ledger Reconciliation', 'Passed', '176 records', '0 mismatches'],
        ]}
      />
    </PageTemplate>
  );
}

function AuditPage() {
  return (
    <PageTemplate title="Audit logs" subtitle="Administrative actions and permissions">
      <TableSection
        columns={['Actor', 'Action', 'Entity', 'Outcome', 'Time']}
        rows={[
          ['CEO Admin', 'Deposit approved', 'DEP-2024-001', 'Success', '12 min ago'],
          ['System', 'Webhook retry', 'WH-8291', 'Queued', '35 min ago'],
          ['Security', 'MFA check', 'Session 442', 'Verified', '1 hour ago'],
        ]}
      />
    </PageTemplate>
  );
}

function IntegrationsPage() {
  return (
    <PageTemplate title="Integrations and system health" subtitle="Current connection and configuration state">
      <div className="stack-list">
        {[
          { name: 'Supabase', state: 'Connected' },
          { name: 'Cloudflare Worker', state: 'Operational' },
          { name: 'Market feed', state: 'Degraded' },
          { name: 'Wallet provider', state: 'Not configured' },
        ].map((item) => (
          <div className="status-row" key={item.name}>
            <span>{item.name}</span>
            <StatusBadge tone={item.state === 'Connected' || item.state === 'Operational' ? 'success' : item.state === 'Degraded' ? 'warning' : 'neutral'}>{item.state}</StatusBadge>
          </div>
        ))}
      </div>
    </PageTemplate>
  );
}

function SecurityPage() {
  return (
    <PageTemplate title="Security and settings" subtitle="CEO access control and platform state">
      <div className="content-grid two-col">
        <SectionCard title="Platform control" subtitle="Admin policy">
          <div className="status-row"><span>Financial operations enabled</span><StatusBadge tone="neutral">False</StatusBadge></div>
          <div className="status-row"><span>Maintenance mode</span><StatusBadge tone="warning">Off</StatusBadge></div>
        </SectionCard>
        <SectionCard title="Authentication" subtitle="MFA and session state">
          <div className="status-row"><span>MFA</span><StatusBadge tone="success">Required</StatusBadge></div>
          <div className="status-row"><span>CEO access</span><StatusBadge tone="success">Explicitly authorized</StatusBadge></div>
        </SectionCard>
      </div>
    </PageTemplate>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Logo compact />
        <h1>CryptoInvest</h1>
        <p className="auth-subtitle">CEO admin portal</p>
        <button className="primary-button full-width" onClick={() => navigate('/')}>Continue to dashboard</button>
      </div>
    </div>
  );
}

function UnauthorizedPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card warning-card">
        <AlertTriangle size={28} />
        <h1>Access denied</h1>
        <p>CEO-only administrative access is required.</p>
        <Link to="/login" className="primary-button full-width text-link">Return to login</Link>
      </div>
    </div>
  );
}

function PageTemplate({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="page-wrap">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin portal</p>
          <h1>{title}</h1>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        <button className="primary-button">Create action</button>
      </header>
      {children}
    </div>
  );
}

function TableSection({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <SectionCard title="Records" subtitle="System output">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function MetricCard({ metric }: { metric: { label: string; value: string; tone?: StatusTone; detail: string } }) {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <span>{metric.label}</span>
      </div>
      <div className="metric-value">{metric.value}</div>
      <small>{metric.detail}</small>
    </div>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="panel-card">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function StatusBadge({ tone, children }: { tone: StatusTone; children: React.ReactNode }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`logo ${compact ? 'compact' : ''}`}>
      <div className="logo-mark">
        <ArrowUpRight size={compact ? 14 : 20} />
      </div>
      {!compact ? <span>CryptoInvest</span> : null}
    </div>
  );
}

function renderIcon(iconName: string) {
  const iconMap: Record<string, React.ReactNode> = {
    LayoutGrid: <LayoutGrid size={16} />,
    Users: <Users size={16} />,
    WalletCards: <WalletCards size={16} />,
    ArrowDownLeft: <ArrowDownLeft size={16} />,
    BriefcaseBusiness: <BriefcaseBusiness size={16} />,
    ShoppingCart: <ShoppingCart size={16} />,
    PieChart: <PieChart size={16} />,
    BarChart3: <BarChart3 size={16} />,
    BookOpenText: <BookOpenText size={16} />,
    ShieldCheck: <ShieldCheck size={16} />,
    FileText: <FileText size={16} />,
    ServerCog: <ServerCog size={16} />,
    Shield: <Shield size={16} />,
  };
  return iconMap[iconName] || <Cpu size={16} />;
}

export default App;
