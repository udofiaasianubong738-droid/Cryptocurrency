
type MetricTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  tone: MetricTone;
};

export const mockMetrics: DashboardMetric[] = [
  {
    label: 'Registered customers',
    value: '1,248',
    detail: '+3.2% vs last month',
    tone: 'info',
  },
  {
    label: 'Pending deposits',
    value: '14',
    detail: '3 require review',
    tone: 'warning',
  },
  {
    label: 'Pending withdrawals',
    value: '7',
    detail: '2 flagged for review',
    tone: 'neutral',
  },
  {
    label: 'Portfolio exposure',
    value: '$7.42M',
    detail: 'Simulation only',
    tone: 'success',
  },
  {
    label: 'Realized P/L',
    value: '$128.4K',
    detail: 'Separate from market moves',
    tone: 'success',
  },
  {
    label: 'Unrealized P/L',
    value: '$245.7K',
    detail: 'Market-based estimate',
    tone: 'info',
  },
];
