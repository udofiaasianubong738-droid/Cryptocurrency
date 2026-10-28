export type DemoAccount = {
  id: string;
  customer_id: string | null;
  label: string;
  currency_code: string;
  status: string;
  virtual_balance: number;
  created_at: string;
};

export type DemoInvestment = {
  id: string;
  demo_account_id: string;
  asset_code: string;
  plan_name: string;
  principal_amount: number;
  currency_code: string;
  status: string;
  outcome_amount: number | null;
  customer_message: string | null;
  created_at: string;
  updated_at: string;
};

export type DemoOrder = {
  id: string;
  demo_account_id: string;
  asset_code: string;
  side: string;
  quantity: number;
  reference_price: number;
  notional: number;
  realized_profit_loss: number | null;
  status: string;
  execution_mode: string;
  created_at: string;
};

export type DemoPosition = {
  id: string;
  demo_account_id: string;
  asset_code: string;
  quantity: number;
  average_entry_price: number;
  realized_profit_loss: number;
  currency_code: string;
  updated_at: string;
};

export type MarketProvider = {
  provider: string;
  status: string;
  last_success_at: string | null;
  last_error_at?: string | null;
  latency_ms?: number | null;
};

export type DemoDashboardData = {
  ok?: boolean;
  demo_only?: boolean;
  accounts?: DemoAccount[];
  recent_investments?: DemoInvestment[];
  recent_orders?: DemoOrder[];
  positions?: DemoPosition[];
  market_providers?: MarketProvider[];
  latest_market_analytics?: { captured_at?: string; [key: string]: unknown } | null;
  live_money_operations_enabled?: boolean;
  error?: string;
};
