import { XStack } from '@onekeyhq/components';
import type {
  IDeFiProtocol,
  IProtocolSummary,
} from '@onekeyhq/shared/types/defi';

import { DeFiOverviewLessTile } from './DeFiOverviewLessTile';
import { DeFiOverviewMoreTile } from './DeFiOverviewMoreTile';
import { DeFiOverviewTile } from './DeFiOverviewTile';

import type { IDeFiOverviewRenderCell } from './DeFiOverviewPlanner';
import type { IOverviewCols } from './overviewColsResolver';

export type IDeFiOverviewDesktopGridProps = {
  cells: IDeFiOverviewRenderCell[];
  cols: IOverviewCols;
  protocolMap: Record<string, IProtocolSummary>;
  onPressProtocol: (protocol: IDeFiProtocol) => void;
  onPressMore: () => void;
  onPressLess: () => void;
  isAllNetworks?: boolean;
};

/**
 * Native fallback grid. Bento sizing is web-only (CSS Grid driven); on
 * native platforms we render every protocol tile in the compact `small`
 * layout via flexbox flow. The cell.size from the planner is intentionally
 * ignored here so a hero-style internal layout never collides with a
 * narrow flex={1} row.
 */
function DeFiOverviewDesktopGrid({
  cells,
  cols: _cols,
  protocolMap,
  onPressProtocol,
  onPressMore,
  onPressLess,
  isAllNetworks,
}: IDeFiOverviewDesktopGridProps) {
  return (
    <XStack width="100%" flexWrap="wrap" gap="$2">
      {cells.map((cell) => (
        <XStack key={cell.key} minWidth={0} flex={1}>
          {cell.kind === 'protocol' ? (
            <DeFiOverviewTile
              size="small"
              protocol={cell.protocol}
              protocolInfo={cell.protocolInfo}
              netWorth={cell.netWorth}
              percent={cell.percent}
              onPress={() => onPressProtocol(cell.protocol)}
              isAllNetworks={isAllNetworks}
            />
          ) : null}
          {cell.kind === 'more' ? (
            <DeFiOverviewMoreTile
              extraProtocols={cell.extraProtocols}
              protocolMap={protocolMap}
              extraCount={cell.extraCount}
              onPress={onPressMore}
            />
          ) : null}
          {cell.kind === 'less' ? (
            <DeFiOverviewLessTile onPress={onPressLess} />
          ) : null}
        </XStack>
      ))}
    </XStack>
  );
}

DeFiOverviewDesktopGrid.displayName = 'DeFiOverviewDesktopGrid';

export { DeFiOverviewDesktopGrid };
