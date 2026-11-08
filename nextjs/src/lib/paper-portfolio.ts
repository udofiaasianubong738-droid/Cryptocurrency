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
  quantityMicrounits: bigint;
  averageCostMinor: bigint;
  latestPriceMinor: bigint;
};

export type PaperPortfolioInput = {
  mode: "paper";
  currency: "USD";
  assets: PaperAsset[];
};

export type PaperPortfolioSummary = {
  mode: "paper";
  currency: "USD";
  investedPrincipalMinor: bigint;
  currentValueMinor: bigint;
  profitLossMinor: bigint;
  profitLossPercent: number | null;
};

function nonNegative(value: bigint, field: string): void {
  if (value < 0n) throw new Error(field + " must be non-negative");
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

  let investedPrincipalMinor = 0n;
  let currentValueMinor = 0n;

  for (const asset of input.assets) {
    if (!/^[A-Z0-9]{2,12}$/.test(asset.assetCode)) {
      throw new Error("Invalid demo asset code");
    }
    nonNegative(asset.quantityMicrounits, "quantityMicrounits");
    nonNegative(asset.averageCostMinor, "averageCostMinor");
    nonNegative(asset.latestPriceMinor, "latestPriceMinor");

    // Quantity is represented in millionths to avoid floating-point quantity math.
    investedPrincipalMinor +=
      (asset.quantityMicrounits * asset.averageCostMinor) / 1_000_000n;
    currentValueMinor +=
      (asset.quantityMicrounits * asset.latestPriceMinor) / 1_000_000n;
  }

  const profitLossMinor = currentValueMinor - investedPrincipalMinor;
  const profitLossPercent =
    investedPrincipalMinor === 0n
      ? null
      : Number((profitLossMinor * 10_000n) / investedPrincipalMinor) / 100;

  return {
    mode: "paper",
    currency: input.currency,
    investedPrincipalMinor,
    currentValueMinor,
    profitLossMinor,
    profitLossPercent,
  };
}

export type PaperValuationPoint = {
  capturedAt: string;
  portfolioValueMinor: bigint;
};

/**
 * Orders demo valuation points and reports direction between adjacent points.
 * It does not infer or forecast future returns.
 */
export function getPaperMarketDirection(
  points: PaperValuationPoint[],
): Array<{
  capturedAt: string;
  portfolioValueMinor: bigint;
  direction: "up" | "down" | "unchanged" | "first";
}> {
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
