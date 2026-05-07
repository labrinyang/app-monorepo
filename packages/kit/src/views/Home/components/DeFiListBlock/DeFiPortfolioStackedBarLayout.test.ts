import { PORTFOLIO_OTHERS_TOKEN } from './DeFiPortfolioPalette';
import {
  MIN_LABEL_PERCENT,
  buildStackedBarSegments,
} from './DeFiPortfolioStackedBarLayout';

import type { IPortfolioSlice } from './DeFiPortfolioStats';

const slice = (
  key: string,
  percent: number,
  colorToken = '$blue9',
  netWorth = percent * 10,
  networkIds: string[] = [],
): IPortfolioSlice => ({
  key,
  label: key,
  percent,
  netWorth,
  colorToken,
  networkIds,
});

describe('buildStackedBarSegments', () => {
  it('returns an empty array when no slices', () => {
    expect(buildStackedBarSegments([])).toEqual([]);
  });

  it('uses the slice percent verbatim for flexBasis', () => {
    const out = buildStackedBarSegments([slice('a', 60), slice('b', 40)]);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ key: 'a', flexBasis: 60 });
    expect(out[1]).toMatchObject({ key: 'b', flexBasis: 40 });
  });

  it('formats the inline label as integer percent (no decimal)', () => {
    const out = buildStackedBarSegments([slice('a', 12.7)]);
    expect(out[0].label).toBe('13%');
  });

  it('rounds half-down values toward the nearest integer', () => {
    const out = buildStackedBarSegments([slice('a', 12.4), slice('b', 12.5)]);
    expect(out[0].label).toBe('12%');
    // Math.round behavior: .5 rounds up.
    expect(out[1].label).toBe('13%');
  });

  it('shows the inline label when percent >= MIN_LABEL_PERCENT', () => {
    const out = buildStackedBarSegments([slice('a', MIN_LABEL_PERCENT)]);
    expect(out[0].showLabel).toBe(true);
  });

  it('hides the inline label when percent < MIN_LABEL_PERCENT', () => {
    const out = buildStackedBarSegments([
      slice('big', 95),
      slice('tiny', MIN_LABEL_PERCENT - 1),
    ]);
    const tiny = out.find((s) => s.key === 'tiny');
    expect(tiny?.showLabel).toBe(false);
    // Color band still renders — flexBasis preserved.
    expect(tiny?.flexBasis).toBe(MIN_LABEL_PERCENT - 1);
  });

  it('MIN_LABEL_PERCENT is 10 (matches the Mantine convention)', () => {
    expect(MIN_LABEL_PERCENT).toBe(10);
  });

  it('exposes colorToken and netWorth on the segment', () => {
    const [seg] = buildStackedBarSegments([
      { ...slice('k', 50, '$purple9', 1234), label: 'K' },
    ]);
    expect(seg.colorToken).toBe('$purple9');
    expect(seg.netWorth).toBe(1234);
    expect(seg.sliceLabel).toBe('K');
  });

  it('routes jewel-tone slices to $whiteA12 for inline label color', () => {
    const out = buildStackedBarSegments([
      slice('a', 50, '$blue9'),
      slice('b', 30, '$pink9'),
      slice('c', 20, '$orange9'),
    ]);
    out.forEach((seg) => expect(seg.labelColorToken).toBe('$whiteA12'));
  });

  it('routes the Others (neutral) slice to $textSubdued for contrast', () => {
    const out = buildStackedBarSegments([
      slice('jewel', 80, '$blue9'),
      slice('others', 20, PORTFOLIO_OTHERS_TOKEN),
    ]);
    expect(out[0].labelColorToken).toBe('$whiteA12');
    expect(out[1].labelColorToken).toBe('$textSubdued');
  });

  it('passes networkIds through transparently for tooltip multi-chain logos', () => {
    const out = buildStackedBarSegments([
      slice('aave', 50, '$blue9', 500, ['evm--1', 'evm--42161', 'evm--137']),
      slice('lido', 50, '$purple9', 500, ['evm--1']),
    ]);
    expect(out[0].networkIds).toEqual(['evm--1', 'evm--42161', 'evm--137']);
    expect(out[1].networkIds).toEqual(['evm--1']);
  });
});
