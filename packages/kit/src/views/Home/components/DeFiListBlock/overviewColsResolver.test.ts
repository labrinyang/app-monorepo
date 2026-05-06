import { resolveOverviewCols } from './overviewColsResolver';

describe('resolveOverviewCols', () => {
  it('returns 6 when gtXl is true', () => {
    expect(resolveOverviewCols({ gtXl: true, gtLg: true, gtMd: true })).toBe(6);
  });

  it('returns 5 when gtLg is true and gtXl is false', () => {
    expect(resolveOverviewCols({ gtXl: false, gtLg: true, gtMd: true })).toBe(
      5,
    );
  });

  it('returns 4 when only gtMd is true', () => {
    expect(resolveOverviewCols({ gtXl: false, gtLg: false, gtMd: true })).toBe(
      4,
    );
  });

  it('returns 4 as a safe fallback below gtMd (caller should gate, but resolver is defensive)', () => {
    expect(resolveOverviewCols({ gtXl: false, gtLg: false, gtMd: false })).toBe(
      4,
    );
  });

  it('treats missing flags as false', () => {
    expect(resolveOverviewCols({})).toBe(4);
  });
});
