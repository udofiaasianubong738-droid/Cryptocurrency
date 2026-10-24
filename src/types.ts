export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export type Customer = {
  id: string;
  name: string;
  status: 'verified' | 'pending' | 'restricted';
  email: string;
  portfolio: string;
  lastActive: string;
};

export type DepositRequest = {
  id: string;
  customer: string;
  asset: string;
  amount: string;
  currency: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  reference: string;
  createdAt: string;
};

export type WithdrawalRequest = {
  id: string;
  customer: string;
  asset: string;
  amount: string;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  destination: string;
  createdAt: string;
};

export type Metric = {
  label: string;
  value: string;
  tone?: StatusTone;
  detail: string;
};

export type NavItem = {
  label: string;
  to: string;
  icon: string;
};
