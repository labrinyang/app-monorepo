import defiUtils from '@onekeyhq/shared/src/utils/defiUtils';
import type {
  IDeFiProtocol,
  IProtocolSummary,
} from '@onekeyhq/shared/types/defi';

import { roundToOneDecimal } from './DeFiPortfolioStats';

import type { IDeFiOverviewCell } from './hooks/useDeFiOverviewTopN';
import type { IOverviewCols } from './overviewColsResolver';

export const OVERVIEW_MORE_PREVIEW_COUNT = 3;

/**
 * Bento-grid sizes. The size determines both grid spans (rendered by the
 * web grid) and internal layout (rendered by the tile). One protocol gets
 * 'hero' (2x2), a small group gets 'medium' (2x1), the rest get 'small'
 * (1x1). The 'more'/'less' sizes are reserved for the toggle cells.
 */
export type IDeFiOverviewSize =
  | 'hero'
  | 'medium'
  | 'small'
  | 'more'
  | 'less';

/**
 * Number of protocols rendered as 2x1 medium tiles right after the hero.
 *
 * - 6-col bento packs the full 1+4+6 (=11 protocols) over 3 rows: hero
 *   takes the left 2x2 block, four mediums fill the right side rows 1-2,
 *   and six smalls fill row 3.
 * - At 4-5 cols the right side has fewer free columns, so the medium
 *   count drops to 2 (the rest become smalls). Top-3 stays clearly
 *   highlighted, and the bento math still fills the rows cleanly.
 */
export function getBentoMediumCount(cols: IOverviewCols): number {
  return cols === 6 ? 4 : 2;
}

/** Total cell weight a column row carries when accounting for spans. */
function getBentoTotalCells(cols: IOverviewCols): number {
  return cols * 3;
}

/** Number of small (1x1) protocol tiles in a fully-filled bento. */
export function getBentoSmallCount(cols: IOverviewCols): number {
  const heroCells = 4; // 2x2
  const mediumCells = getBentoMediumCount(cols) * 2; // each medium = 2 cells
  return getBentoTotalCells(cols) - heroCells - mediumCells;
}

/**
 * Maximum number of protocols a fully-expanded bento can render in one
 * uninterrupted block. Beyond this, the grid either continues with extra
 * small tiles (when expanded) or shows a More toggle (when collapsed).
 *
 * - cols=6: 1 + 4 + 6 = 11
 * - cols=5: 1 + 2 + 7 = 10
 * - cols=4: 1 + 2 + 4 = 7
 */
export function getBentoProtocolLimit(cols: IOverviewCols): number {
  return 1 + getBentoMediumCount(cols) + getBentoSmallCount(cols);
}

/**
 * Number of protocols visible when collapsed with overflow. The trailing
 * pair of small cells is replaced by the More toggle (which itself is 2x1),
 * so we lose exactly two protocols from the limit.
 */
export function getBentoVisibleCollapsed(cols: IOverviewCols): number {
  return getBentoProtocolLimit(cols) - 2;
}

/**
 * Maps a protocol's rank (0-indexed) to the bento size it should render at.
 * Rank 0 is always the hero; ranks 1..mediumCount are mediums; the rest
 * fall through to small.
 */
export function getOverviewProtocolSize(
  rank: number,
  cols: IOverviewCols,
): Extract<IDeFiOverviewSize, 'hero' | 'medium' | 'small'> {
  if (rank === 0) return 'hero';
  if (rank <= getBentoMediumCount(cols)) return 'medium';
  return 'small';
}

export type IDeFiOverviewProtocolRenderCell = {
  kind: 'protocol';
  key: string;
  size: Extract<IDeFiOverviewSize, 'hero' | 'medium' | 'small'>;
  rank: number;
  protocol: IDeFiProtocol;
  protocolInfo: IProtocolSummary | undefined;
  netWorth: number;
  percent: number | undefined;
};

export type IDeFiOverviewMoreRenderCell = {
  kind: 'more';
  key: 'more';
  size: 'more';
  extraProtocols: IDeFiProtocol[];
  extraCount: number;
};

export type IDeFiOverviewLessRenderCell = {
  kind: 'less';
  key: 'less';
  size: 'less';
};

export type IDeFiOverviewRenderCell =
  | IDeFiOverviewProtocolRenderCell
  | IDeFiOverviewMoreRenderCell
  | IDeFiOverviewLessRenderCell;

function toProtocolCell(
  cell: IDeFiOverviewCell,
  rank: number,
  cols: IOverviewCols,
  protocolMap: Record<string, IProtocolSummary>,
  exposureTotal: number,
): IDeFiOverviewProtocolRenderCell {
  const key = defiUtils.buildProtocolMapKey({
    protocol: cell.protocol.protocol,
    networkId: cell.protocol.networkId,
  });
  return {
    kind: 'protocol',
    key,
    size: getOverviewProtocolSize(rank, cols),
    rank,
    protocol: cell.protocol,
    protocolInfo: protocolMap[key],
    netWorth: cell.netWorth,
    percent:
      exposureTotal > 0
        ? roundToOneDecimal((Math.abs(cell.netWorth) / exposureTotal) * 100)
        : undefined,
  };
}

export function buildDeFiOverviewRenderCells({
  rankedProtocols,
  protocolMap,
  isExpanded,
  exposureTotal,
  cols,
}: {
  rankedProtocols: IDeFiOverviewCell[];
  protocolMap: Record<string, IProtocolSummary>;
  isExpanded: boolean;
  exposureTotal: number;
  cols: IOverviewCols;
}): IDeFiOverviewRenderCell[] {
  const toCell = (c: IDeFiOverviewCell, rank: number) =>
    toProtocolCell(c, rank, cols, protocolMap, exposureTotal);

  const protocolLimit = getBentoProtocolLimit(cols);
  const visibleCollapsed = getBentoVisibleCollapsed(cols);

  if (rankedProtocols.length <= protocolLimit) {
    return rankedProtocols.map((c, i) => toCell(c, i));
  }

  if (isExpanded) {
    return [
      ...rankedProtocols.map((c, i) => toCell(c, i)),
      { kind: 'less', key: 'less', size: 'less' },
    ];
  }

  const visible = rankedProtocols.slice(0, visibleCollapsed);
  const hidden = rankedProtocols.slice(visibleCollapsed);

  return [
    ...visible.map((c, i) => toCell(c, i)),
    {
      kind: 'more',
      key: 'more',
      size: 'more',
      extraProtocols: hidden
        .slice(0, OVERVIEW_MORE_PREVIEW_COUNT)
        .map((c) => c.protocol),
      extraCount: hidden.length,
    },
  ];
}
