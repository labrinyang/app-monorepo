import type { IDeFiProtocol } from '@onekeyhq/shared/types/defi';

import { buildPortfolioStats, roundToOneDecimal } from './DeFiPortfolioStats';

function makeProtocol(protocol: string, networkId = 'evm--1'): IDeFiProtocol {
  return {
    protocol,
    networkId,
  } as IDeFiProtocol;
}

describe('buildPortfolioStats', () => {
  it('returns total: 0 when protocols is undefined', () => {
    expect(
      buildPortfolioStats({
        protocols: undefined,
        getNetWorth: () => 0,
      }),
    ).toEqual({ total: 0 });
  });

  it('returns total: 0 when protocols is empty', () => {
    expect(
      buildPortfolioStats({
        protocols: [],
        getNetWorth: () => 0,
      }),
    ).toEqual({ total: 0 });
  });

  it('sums netWorths across all protocols', () => {
    const protocols = [
      makeProtocol('a'),
      makeProtocol('b'),
      makeProtocol('c'),
    ];
    const values: Record<string, number> = { a: 50, b: 30, c: 20 };
    expect(
      buildPortfolioStats({
        protocols,
        getNetWorth: (p) => values[p.protocol] ?? 0,
      }),
    ).toEqual({ total: 100 });
  });

  it('counts the same protocol on different networks separately in the total', () => {
    // Aggregation by slug is not the concern of buildPortfolioStats anymore;
    // the total is just sum-of-netWorths regardless of how the planner groups
    // them downstream.
    const aaveEth = makeProtocol('aave', 'evm--1');
    const aaveArb = makeProtocol('aave', 'evm--42161');
    expect(
      buildPortfolioStats({
        protocols: [aaveEth, aaveArb],
        getNetWorth: () => 50,
      }),
    ).toEqual({ total: 100 });
  });

  it('skips non-finite netWorth values without poisoning the total', () => {
    const protocols = [makeProtocol('a'), makeProtocol('b'), makeProtocol('c')];
    const values: Record<string, number> = {
      a: 50,
      b: Number.NaN,
      c: Number.POSITIVE_INFINITY,
    };
    expect(
      buildPortfolioStats({
        protocols,
        getNetWorth: (p) => values[p.protocol],
      }),
    ).toEqual({ total: 50 });
  });
});

describe('roundToOneDecimal', () => {
  it('rounds to one decimal place', () => {
    expect(roundToOneDecimal(33.333_33)).toBe(33.3);
    expect(roundToOneDecimal(33.36)).toBe(33.4);
  });

  it('returns 0 for non-finite inputs', () => {
    expect(roundToOneDecimal(Number.NaN)).toBe(0);
    expect(roundToOneDecimal(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
