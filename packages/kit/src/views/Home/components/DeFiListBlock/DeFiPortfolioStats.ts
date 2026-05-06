import type { IDeFiProtocol } from '@onekeyhq/shared/types/defi';

export type IPortfolioStats = {
  total: number;
};

type IBuildPortfolioStatsInput = {
  protocols: IDeFiProtocol[] | undefined;
  getNetWorth: (p: IDeFiProtocol) => number;
};

export function roundToOneDecimal(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

/**
 * Aggregates the portfolio total across all protocols. Non-finite per-protocol
 * netWorth values (NaN, Infinity) are skipped rather than poisoning the sum.
 */
export function buildPortfolioStats(
  input: IBuildPortfolioStatsInput,
): IPortfolioStats {
  const { protocols, getNetWorth } = input;
  if (!protocols || protocols.length === 0) {
    return { total: 0 };
  }
  const total = protocols.reduce((acc, p) => {
    const v = getNetWorth(p);
    return Number.isFinite(v) ? acc + v : acc;
  }, 0);
  return { total };
}
