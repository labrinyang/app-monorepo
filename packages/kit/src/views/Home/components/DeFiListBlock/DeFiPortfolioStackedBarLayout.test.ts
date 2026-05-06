import {
  MIN_LABEL_PERCENT,
  buildStackedBarSegments,
} from './DeFiPortfolioStackedBarLayout';

import type { IPortfolioSlice } from './DeFiPortfolioStats';

const slice = (
  key: string,
  percent: number,
  netWorth = percent * 10,
): IPortfolioSlice => ({
  key,
  label: key,
  percent,
  netWorth,
  colorToken: '$bgInfo',
  networkIds: [],
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

  it('formats the label as integer-percent for slices >= MIN_LABEL_PERCENT', () => {
    const out = buildStackedBarSegments([slice('a', 12.7)]);
    expect(out[0].label).toBe('12.7%');
    expect(out[0].showLabel).toBe(true);
  });

  it('hides the label when the slice is below MIN_LABEL_PERCENT', () => {
    const out = buildStackedBarSegments([slice('big', 95), slice('tiny', 5)]);
    const tiny = out.find((s) => s.key === 'tiny');
    expect(tiny?.showLabel).toBe(false);
    // color band still renders — flexBasis is preserved
    expect(tiny?.flexBasis).toBe(5);
  });

  it('exposes the slice colorToken and netWorth on the segment', () => {
    const s: IPortfolioSlice = {
      key: 'k',
      label: 'K',
      percent: 50,
      netWorth: 1234,
      colorToken: '$bgSuccess',
      networkIds: [],
    };
    const [seg] = buildStackedBarSegments([s]);
    expect(seg.colorToken).toBe('$bgSuccess');
    expect(seg.netWorth).toBe(1234);
    expect(seg.sliceLabel).toBe('K');
  });

  it('MIN_LABEL_PERCENT is the documented 6%', () => {
    expect(MIN_LABEL_PERCENT).toBe(6);
  });
});
