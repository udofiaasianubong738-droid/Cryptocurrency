/**
 * CryptoInvest paper-portfolio domain model.
 *
 * SAFETY BOUNDARY:
 * - Educational/demo calculations only.
 * - No persistence, payment rails, card data, wallet addresses, exchange APIs,
 *   blockchain RPC, transaction signing, deposits, withdrawals or execution.
 * - This module is intentionally not imported by customer routes or connected
 *   to Supabase. Do not use it to represent real customer balances.
 */

export type PaperAsset = {
  assetCode: string;
  quantityMicrounits: number;
  averageCostMinor: number;
  latestPriceMinor: number;
};

export type PaperPortfolioInput = {
  mode: "paper";
  currency: "USD";
  availableBalanceMinor: number;
  assets: PaperAsset[];
};

export type PaperPortfolioSummary = {
  mode: "paper";
  currency: "USD";
  investedPrincipalMinor: number;
  currentValueMinor: number;
  totalAccountBalanceMinor: number;
  profitLossMinor: number;
  profitLossPercent: number | null;
};

function nonNegative(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(field + " must be a non-negative safe integer");
  }
}

/**
 * Computes an illustrative paper portfolio from caller-supplied demo values.
 * Values use integer minor units; quantities use integer microunits.
 * It never fetches prices or changes balances.
 */
export function calculatePaperPortfolio(
  input: PaperPortfolioInput,
): PaperPortfolioSummary {
  if (input.mode !== "paper") {
    throw new Error("Only paper-mode portfolios are supported here");
  }

  nonNegative(input.availableBalanceMinor, "availableBalanceMinor");
  let investedPrincipalMinor = 0;
  let currentValueMinor = 0;

  for (const asset of input.assets) {
    if (!/^[A-Z0-9]{2,12}$/.test(asset.assetCode)) {
      throw new Error("Invalid demo asset code");
    }
    nonNegative(asset.quantityMicrounits, "quantityMicrounits");
    nonNegative(asset.averageCostMinor, "averageCostMinor");
    nonNegative(asset.latestPriceMinor, "latestPriceMinor");

    // Quantity is represented in millionths to avoid floating-point quantity math.
    const principalProduct = asset.quantityMicrounits * asset.averageCostMinor;
    const valueProduct = asset.quantityMicrounits * asset.latestPriceMinor;
    if (!Number.isSafeInteger(principalProduct) || !Number.isSafeInteger(valueProduct)) {
      throw new Error("Demo portfolio value exceeds safe calculation limits");
    }
    investedPrincipalMinor += Math.round(principalProduct / 1_000_000);
    currentValueMinor += Math.round(valueProduct / 1_000_000);
    nonNegative(investedPrincipalMinor, "investedPrincipalMinor");
    nonNegative(currentValueMinor, "currentValueMinor");
  }

  const totalAccountBalanceMinor = input.availableBalanceMinor + currentValueMinor;
  nonNegative(totalAccountBalanceMinor, "totalAccountBalanceMinor");
  const profitLossMinor = currentValueMinor - investedPrincipalMinor;
  const profitLossPercent =
    investedPrincipalMinor === 0
      ? null
      : Number(((profitLossMinor * 10_000) / investedPrincipalMinor).toFixed(0)) / 100;

  return {
    mode: "paper",
    currency: input.currency,
    investedPrincipalMinor,
    currentValueMinor,
    totalAccountBalanceMinor,
    profitLossMinor,
    profitLossPercent,
  };
}

export type PaperValuationPoint = {
  capturedAt: string;
  portfolioValueMinor: number;
};

/**
 * Orders demo valuation points and reports direction between adjacent points.
 * It does not infer or forecast future returns.
 */
export function getPaperMarketDirection(
  points: PaperValuationPoint[],
): Array<{
  capturedAt: string;
  portfolioValueMinor: number;
  direction: "up" | "down" | "unchanged" | "first";
}> {
  for (const point of points) {
  }
  const ordered = [...points].sort(
    (a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt),
  );

  return ordered.map((point, index) => {
    if (!Number.isFinite(Date.parse(point.capturedAt))) {
      throw new Error("Invalid demo valuation timestamp");
    }
    nonNegative(point.portfolioValueMinor, "portfolioValueMinor");
    if (index === 0) {
      return { ...point, direction: "first" as const };
    }
    const previous = ordered[index - 1].portfolioValueMinor;
    return {
      ...point,
      direction:
        point.portfolioValueMinor > previous
          ? ("up" as const)
          : point.portfolioValueMinor < previous
            ? ("down" as const)
            : ("unchanged" as const),
    };
  });
}
