import { memo, useMemo } from 'react';

import { YStack, useMedia } from '@onekeyhq/components';
import type {
  IDeFiProtocol,
  IProtocolSummary,
} from '@onekeyhq/shared/types/defi';

import { DeFiOverviewGrid } from './DeFiOverviewGrid';
import { DeFiPortfolioStackedBar } from './DeFiPortfolioStackedBar';
import { buildPortfolioSliceLookup } from './DeFiPortfolioStats';
import { resolveOverviewCols } from './overviewColsResolver';

import type { IPortfolioStats } from './DeFiPortfolioStats';

export type IDeFiAllocationCardProps = {
  stats: IPortfolioStats;
  protocols: IDeFiProtocol[] | undefined;
  protocolMap: Record<string, IProtocolSummary>;
  isLoading?: boolean;
  isAllNetworks?: boolean;
  getNetWorth: (p: IDeFiProtocol) => number;
  onPressProtocol: (p: IDeFiProtocol) => void;
};

function DeFiAllocationCard({
  stats,
  protocols,
  protocolMap,
  isLoading,
  isAllNetworks,
  getNetWorth,
  onPressProtocol,
}: IDeFiAllocationCardProps) {
  const media = useMedia();

  const cols = useMemo(
    () =>
      resolveOverviewCols({
        gtXl: media.gtXl,
        gtLg: media.gtLg,
        gtMd: media.gtMd,
      }),
    [media.gtXl, media.gtLg, media.gtMd],
  );

  // The bar's slice palette is the dictionary every tile consults
  // for its color rail and percent suffix. Compute once, hand both
  // siblings the same reference so they stay perfectly in sync.
  const sliceLookup = useMemo(
    () => buildPortfolioSliceLookup(stats.slices),
    [stats.slices],
  );

  // No outer card chrome: each tile is a $bgSubdued card sitting on the
  // page's $bgApp directly, matching the OneKey ProtocolRow pattern.
  // The stacked bar is its own bare block above the grid; bar segments
  // and tile cards both read directly on the page bg.
  return (
    <YStack userSelect="none" gap="$5">
      <DeFiPortfolioStackedBar slices={stats.slices} isLoading={isLoading} />
      <DeFiOverviewGrid
        cols={cols}
        protocols={protocols}
        protocolMap={protocolMap}
        sliceLookup={sliceLookup}
        getNetWorth={getNetWorth}
        onPressProtocol={onPressProtocol}
        isLoading={isLoading}
        isAllNetworks={isAllNetworks}
      />
    </YStack>
  );
}

DeFiAllocationCard.displayName = 'DeFiAllocationCard';

const MemoDeFiAllocationCard = memo(DeFiAllocationCard);
MemoDeFiAllocationCard.displayName = 'DeFiAllocationCard';

export { MemoDeFiAllocationCard as DeFiAllocationCard };
