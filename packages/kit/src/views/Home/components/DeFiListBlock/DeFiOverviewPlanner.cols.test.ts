import defiUtils from '@onekeyhq/shared/src/utils/defiUtils';
import type {
  IDeFiProtocol,
  IProtocolSummary,
} from '@onekeyhq/shared/types/defi';

import {
  buildDeFiOverviewRenderCells,
  getBentoMediumCount,
  getBentoProtocolLimit,
  getBentoSmallCount,
  getBentoVisibleCollapsed,
  getOverviewProtocolSize,
} from './DeFiOverviewPlanner';

import type { IDeFiOverviewCell } from './hooks/useDeFiOverviewTopN';
import type { IOverviewCols } from './overviewColsResolver';

function makeRanked(count: number, base = 1000): IDeFiOverviewCell[] {
  return Array.from({ length: count }, (_, i) => ({
    protocol: { protocol: `p${i}`, networkId: 'evm--1' } as IDeFiProtocol,
    netWorth: base - i,
  }));
}

function makeMap(count: number): Record<string, IProtocolSummary> {
  const map: Record<string, IProtocolSummary> = {};
  for (let i = 0; i < count; i += 1) {
    const key = defiUtils.buildProtocolMapKey({
      protocol: `p${i}`,
      networkId: 'evm--1',
    });
    map[key] = { protocolName: `p${i}`, protocolLogo: '' } as IProtocolSummary;
  }
  return map;
}

describe('bento helpers', () => {
  it.each<[IOverviewCols, number, number, number, number, number]>([
    // [cols, mediumCount, smallCount, protocolLimit, visibleCollapsed, totalCells]
    [6, 4, 6, 11, 9, 18],
    [5, 2, 7, 10, 8, 15],
    [4, 2, 4, 7, 5, 12],
  ])(
    'cols=%i: medium=%i small=%i limit=%i collapsed=%i cells=%i',
    (cols, mediumCount, smallCount, limit, collapsed, totalCells) => {
      expect(getBentoMediumCount(cols)).toBe(mediumCount);
      expect(getBentoSmallCount(cols)).toBe(smallCount);
      expect(getBentoProtocolLimit(cols)).toBe(limit);
      expect(getBentoVisibleCollapsed(cols)).toBe(collapsed);
      // Hero(4) + mediums(2 each) + smalls(1 each) must exactly fill the
      // 3-row bento at every breakpoint.
      expect(4 + mediumCount * 2 + smallCount * 1).toBe(totalCells);
    },
  );
});

describe('getOverviewProtocolSize', () => {
  it('cols=6: rank 0 hero, ranks 1-4 medium, rank 5+ small', () => {
    expect(getOverviewProtocolSize(0, 6)).toBe('hero');
    expect(getOverviewProtocolSize(1, 6)).toBe('medium');
    expect(getOverviewProtocolSize(4, 6)).toBe('medium');
    expect(getOverviewProtocolSize(5, 6)).toBe('small');
    expect(getOverviewProtocolSize(99, 6)).toBe('small');
  });

  it('cols=5: rank 0 hero, ranks 1-2 medium, rank 3+ small', () => {
    expect(getOverviewProtocolSize(0, 5)).toBe('hero');
    expect(getOverviewProtocolSize(1, 5)).toBe('medium');
    expect(getOverviewProtocolSize(2, 5)).toBe('medium');
    expect(getOverviewProtocolSize(3, 5)).toBe('small');
  });

  it('cols=4: rank 0 hero, ranks 1-2 medium, rank 3+ small', () => {
    expect(getOverviewProtocolSize(0, 4)).toBe('hero');
    expect(getOverviewProtocolSize(1, 4)).toBe('medium');
    expect(getOverviewProtocolSize(2, 4)).toBe('medium');
    expect(getOverviewProtocolSize(3, 4)).toBe('small');
  });
});

describe('buildDeFiOverviewRenderCells with bento sizing', () => {
  it('cols=6: assigns hero/medium/small to top-1, top-2..5, rank 5+', () => {
    const cells = buildDeFiOverviewRenderCells({
      rankedProtocols: makeRanked(11),
      protocolMap: makeMap(11),
      isExpanded: false,
      exposureTotal: 100,
      cols: 6,
    });
    expect(cells).toHaveLength(11);
    const sizes = cells.map((c) => c.kind === 'protocol' && c.size);
    expect(sizes).toEqual([
      'hero',
      'medium',
      'medium',
      'medium',
      'medium',
      'small',
      'small',
      'small',
      'small',
      'small',
      'small',
    ]);
    cells.forEach((c, i) => {
      if (c.kind === 'protocol') {
        expect(c.rank).toBe(i);
      }
    });
  });

  it('returns all protocols with no More cell when length <= protocolLimit (cols=4)', () => {
    const cells = buildDeFiOverviewRenderCells({
      rankedProtocols: makeRanked(7),
      protocolMap: makeMap(7),
      isExpanded: false,
      exposureTotal: 100,
      cols: 4,
    });
    expect(cells).toHaveLength(7);
    expect(cells.every((c) => c.kind === 'protocol')).toBe(true);
  });

  it('cols=4 collapsed with overflow: 5 protocols + More(size=more)', () => {
    const cells = buildDeFiOverviewRenderCells({
      rankedProtocols: makeRanked(15),
      protocolMap: makeMap(15),
      isExpanded: false,
      exposureTotal: 100,
      cols: 4,
    });
    expect(cells).toHaveLength(6);
    expect(cells.slice(0, 5).every((c) => c.kind === 'protocol')).toBe(true);
    expect(cells[5]).toMatchObject({ kind: 'more', size: 'more' });
  });

  it('cols=5 collapsed with overflow: 8 protocols + More(size=more)', () => {
    const cells = buildDeFiOverviewRenderCells({
      rankedProtocols: makeRanked(20),
      protocolMap: makeMap(20),
      isExpanded: false,
      exposureTotal: 100,
      cols: 5,
    });
    expect(cells).toHaveLength(9);
    expect(cells[8]).toMatchObject({ kind: 'more', size: 'more' });
  });

  it('cols=6 collapsed with overflow: 9 protocols + More(size=more)', () => {
    const cells = buildDeFiOverviewRenderCells({
      rankedProtocols: makeRanked(25),
      protocolMap: makeMap(25),
      isExpanded: false,
      exposureTotal: 100,
      cols: 6,
    });
    expect(cells).toHaveLength(10);
    expect(cells[9]).toMatchObject({ kind: 'more', size: 'more' });
  });

  it('expanded with overflow: all protocols + Less(size=less)', () => {
    const cells = buildDeFiOverviewRenderCells({
      rankedProtocols: makeRanked(25),
      protocolMap: makeMap(25),
      isExpanded: true,
      exposureTotal: 100,
      cols: 6,
    });
    expect(cells).toHaveLength(26);
    expect(cells[25]).toMatchObject({ kind: 'less', size: 'less' });
  });

  it('expanded but length <= protocolLimit emits no Less cell', () => {
    const cells = buildDeFiOverviewRenderCells({
      rankedProtocols: makeRanked(7),
      protocolMap: makeMap(7),
      isExpanded: true,
      exposureTotal: 100,
      cols: 4,
    });
    expect(cells).toHaveLength(7);
    expect(cells.every((c) => c.kind === 'protocol')).toBe(true);
  });

  it('returns empty array for empty input', () => {
    expect(
      buildDeFiOverviewRenderCells({
        rankedProtocols: [],
        protocolMap: {},
        isExpanded: false,
        exposureTotal: 0,
        cols: 6,
      }),
    ).toEqual([]);
  });
});
