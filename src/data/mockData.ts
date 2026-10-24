export const mockNavItems = [
  { label: 'Dashboard', to: '/', icon: 'LayoutGrid' },
  { label: 'Customers', to: '/customers', icon: 'Users' },
  { label: 'Deposits', to: '/deposits', icon: 'WalletCards' },
  { label: 'Withdrawals', to: '/withdrawals', icon: 'ArrowDownLeft' },
  { label: 'Investment Plans', to: '/plans', icon: 'BriefcaseBusiness' },
  { label: 'Orders', to: '/orders', icon: 'ShoppingCart' },
  { label: 'Portfolio', to: '/portfolio', icon: 'PieChart' },
  { label: 'Reports', to: '/reports', icon: 'BarChart3' },
  { label: 'Transactions', to: '/ledger', icon: 'BookOpenText' },
  { label: 'Reconciliation', to: '/reconciliation', icon: 'ShieldCheck' },
  { label: 'Audit Logs', to: '/audit', icon: 'FileText' },
  { label: 'Integrations', to: '/integrations', icon: 'ServerCog' },
  { label: 'Security', to: '/security', icon: 'Shield' },
];

export const mockMetrics = [
  { label: 'Registered customers', value: '1,248', detail: '+3.2% vs last month', tone: 'info' },
  { label: 'Pending deposits', value: '14', detail: '3 require review', tone: 'warning' },
  { label: 'Pending withdrawals', value: '7', detail: '2 flagged for review', tone: 'neutral' },
  { label: 'Portfolio exposure', value: '$7.42M', detail: 'Simulation only', tone: 'success' },
  { label: 'Realized P/L', value: '$128.4K', detail: 'Separate from market moves', tone: 'success' },
  { label: 'Unrealized P/L', value: '$245.7K', detail: 'Market-based estimate', tone: 'info' },
];

export const mockCustomers = [
  { id: 'C-1001', name: 'Ava Walker', status: 'verified', email: 'ava@northstar.io', portfolio: '$245,000', lastActive: '4 min ago' },
  { id: 'C-1002', name: 'Leo Morgan', status: 'pending', email: 'leo@signalcap.com', portfolio: '$98,400', lastActive: '31 min ago' },
  { id: 'C-1003', name: 'Noah Singh', status: 'restricted', email: 'noah@peakvault.com', portfolio: '$62,900', lastActive: '2 hours ago' },
];

export const mockDepositRequests = [
  { id: 'DEP-2024-001', customer: 'Ava Walker', asset: 'USDT', amount: '12000', currency: 'USD', status: 'pending', reference: 'P-9782', createdAt: '2026-10-23 08:42 UTC' },
  { id: 'DEP-2024-002', customer: 'Leo Morgan', asset: 'BTC', amount: '0.240', currency: 'BTC', status: 'under_review', reference: 'TX-48310', createdAt: '2026-10-23 06:15 UTC' },
  { id: 'DEP-2024-003', customer: 'Noah Singh', asset: 'ETH', amount: '3.80', currency: 'ETH', status: 'approved', reference: 'TX-87451', createdAt: '2026-10-22 19:00 UTC' },
];

export const mockWithdrawalRequests = [
  { id: 'WDR-5301', customer: 'Ava Walker', asset: 'USDC', amount: '4200', status: 'pending', destination: '0xA8c3...bF14', createdAt: '2026-10-23 10:12 UTC' },
  { id: 'WDR-5302', customer: 'Leo Morgan', asset: 'BTC', amount: '0.12', status: 'processing', destination: 'bc1q...9d4a', createdAt: '2026-10-22 18:40 UTC' },
  { id: 'WDR-5303', customer: 'Noah Singh', asset: 'ETH', amount: '1.50', status: 'rejected', destination: '0x7a81...12c7', createdAt: '2026-10-21 11:00 UTC' },
];
