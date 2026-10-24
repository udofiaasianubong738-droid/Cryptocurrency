import type { ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  BookOpenText,
  BriefcaseBusiness,
  Cpu,
  FileText,
  LayoutGrid,
  PieChart,
  Search,
  ServerCog,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Users,
  WalletCards,
} from 'lucide-react';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

export function MetricCard({ metric }: { metric: { label: string; value: string; tone?: StatusTone; detail: string } }) {
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

export function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
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

export function PageTemplate({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
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

export function TableSection({ columns, rows }: { columns: string[]; rows: ReactNode[][] }) {
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

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`logo ${compact ? 'compact' : ''}`}>
      <div className="logo-mark">
        <ArrowUpRight size={compact ? 14 : 20} />
      </div>
      {!compact ? <span>CryptoInvest</span> : null}
    </div>
  );
}

export function renderIcon(iconName: string) {
  const iconMap: Record<string, ReactNode> = {
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
    Search: <Search size={16} />,
    Activity: <Activity size={14} />,
    AlertTriangle: <AlertTriangle size={28} />,
  };
  return iconMap[iconName] || <Cpu size={16} />;
}
