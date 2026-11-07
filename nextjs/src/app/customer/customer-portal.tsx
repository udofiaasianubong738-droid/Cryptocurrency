"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

type Section = "home" | "profile" | "plans" | "investments" | "deposit" | "withdrawals" | "performance" | "transactions" | "notifications" | "documents" | "support" | "security";
type Row = Record<string, unknown>;
const nav: { id: Section; label: string; icon: string }[] = [
  { id: "home", label: "Overview", icon: "⌂" }, { id: "profile", label: "My profile", icon: "♙" },
  { id: "plans", label: "Investment plans", icon: "◇" }, { id: "investments", label: "My investments", icon: "▥" },
  { id: "deposit", label: "Deposit request", icon: "↓" }, { id: "withdrawals", label: "Withdrawals", icon: "↑" },
  { id: "performance", label: "Profit & loss", icon: "↗" }, { id: "transactions", label: "Transactions", icon: "≋" },
  { id: "notifications", label: "Notifications", icon: "♧" }, { id: "documents", label: "Documents", icon: "▤" },
  { id: "support", label: "Support", icon: "?" }, { id: "security", label: "Security", icon: "⬡" },
];
const titles: Record<Section, string> = {
  home:"Your overview", profile:"My profile", plans:"Investment plans", investments:"My investments",
  deposit:"Deposit request", withdrawals:"Withdrawal requests", performance:"Profit and loss",
  transactions:"Transactions", notifications:"Notifications", documents:"My documents", support:"Customer support", security:"Account security",
};
const sources: Partial<Record<Section, { table: string; columns: string; ownerColumn?: "customer_id" | "user_id"; activeOnly?: boolean }>> = {
  home: { table: "investments", columns: "id, asset_code, principal_amount, currency_code, status, created_at", ownerColumn: "customer_id" },
  plans: { table: "investment_plans", columns: "id, name, asset_code, network, description, risk_level, minimum_amount, maximum_amount, currency_code, risk_disclosure", activeOnly: true },
  investments: { table: "investments", columns: "id, plan_id, asset_code, principal_amount, currency_code, status, approved_return, realized_profit_loss, opened_at, closed_at, created_at", ownerColumn: "customer_id" },
  deposit: { table: "deposit_requests", columns: "id, amount, currency_code, asset_code, network, status, created_at, updated_at", ownerColumn: "customer_id" },
  withdrawals: { table: "withdrawal_requests", columns: "id, amount, currency_code, asset_code, network, status, created_at, updated_at", ownerColumn: "customer_id" },
  performance: { table: "investments", columns: "id, asset_code, principal_amount, currency_code, status, realized_profit_loss, closed_at, created_at", ownerColumn: "customer_id" },
  transactions: { table: "ledger_entries", columns: "id, entry_type, amount, currency_code, created_at", ownerColumn: "customer_id" },
  notifications: { table: "user_notifications", columns: "id, category, title, body, read_at, created_at", ownerColumn: "user_id" },
  support: { table: "support_tickets", columns: "id, subject, message, status, created_at, updated_at, closed_at", ownerColumn: "user_id" },
};
