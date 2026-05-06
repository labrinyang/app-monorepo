import { memo, useMemo } from 'react';

import { YStack, useMedia } from '@onekeyhq/components';
import type {
  IDeFiProtocol,
  IProtocolSummary,
} from '@onekeyhq/shared/types/defi';

import { DeFiOverviewGrid } from './DeFiOverviewGrid';
import { resolveOverviewCols } from './overviewColsResolver';

export type IDeFiAllocationCardProps = {
  protocols: IDeFiProtocol[] | undefined;
  protocolMap: Record<string, IProtocolSummary>;
  isLoading?: boolean;
  isAllNetworks?: boolean;
  getNetWorth: (p: IDeFiProtocol) => number;
  onPressProtocol: (p: IDeFiProtocol) => void;
};

function DeFiAllocationCard({
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

  return (
    <YStack bg="$bgSubdued" borderRadius="$3" p="$5" userSelect="none">
      <DeFiOverviewGrid
        cols={cols}
        protocols={protocols}
        protocolMap={protocolMap}
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
