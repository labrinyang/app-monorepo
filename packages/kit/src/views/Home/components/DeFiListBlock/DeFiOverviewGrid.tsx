import { memo, useCallback, useMemo, useRef } from 'react';

import { Skeleton, XStack } from '@onekeyhq/components';
import { useDeFiListSlicedAtom } from '@onekeyhq/kit/src/states/jotai/contexts/deFiList';
import type {
  IDeFiProtocol,
  IProtocolSummary,
} from '@onekeyhq/shared/types/defi';

import { DeFiOverviewDesktopGrid } from './DeFiOverviewDesktopGrid';
import { buildOverviewGridStyle } from './DeFiOverviewLayout';
import {
  buildDeFiOverviewRenderCells,
  getOverviewCellsLimit,
} from './DeFiOverviewPlanner';
import { useDeFiOverviewTopN } from './hooks/useDeFiOverviewTopN';

import type { IPortfolioSliceLookup } from './DeFiPortfolioStats';
import type { IOverviewCols } from './overviewColsResolver';

const SKELETON_TILE_HEIGHT = 60;

const OVERVIEW_TOGGLE_PRESS_LOCK_MS = 600;

export type IDeFiOverviewGridProps = {
  cols: IOverviewCols;
  protocols: IDeFiProtocol[] | undefined;
  protocolMap: Record<string, IProtocolSummary>;
  sliceLookup?: IPortfolioSliceLookup;
  isLoading?: boolean;
  isAllNetworks?: boolean;
  getNetWorth: (p: IDeFiProtocol) => number;
  onPressProtocol: (p: IDeFiProtocol) => void;
};

function DeFiOverviewGrid({
  cols,
  protocols,
  protocolMap,
  sliceLookup,
  isLoading,
  isAllNetworks,
  getNetWorth,
  onPressProtocol,
}: IDeFiOverviewGridProps) {
  const [isSliced, setIsSliced] = useDeFiListSlicedAtom();
  const isExpanded = !isSliced;

  const rankedProtocols = useDeFiOverviewTopN(protocols, getNetWorth);

  const cells = useMemo(
    () =>
      buildDeFiOverviewRenderCells({
        rankedProtocols,
        protocolMap,
        isExpanded,
        cols,
        sliceLookup,
      }),
    [rankedProtocols, protocolMap, isExpanded, cols, sliceLookup],
  );

  const pressLockUntilRef = useRef(0);
  const isPressLocked = useCallback(
    () => pressLockUntilRef.current > Date.now(),
    [],
  );
  const lockPress = useCallback(() => {
    pressLockUntilRef.current = Date.now() + OVERVIEW_TOGGLE_PRESS_LOCK_MS;
  }, []);
  const handleMore = useCallback(() => {
    if (isPressLocked()) return;
    setIsSliced(false);
    lockPress();
  }, [setIsSliced, lockPress, isPressLocked]);
  const handleLess = useCallback(() => {
    if (isPressLocked()) return;
    setIsSliced(true);
    lockPress();
  }, [setIsSliced, lockPress, isPressLocked]);
  const handleProtocolPress = useCallback(
    (p: IDeFiProtocol) => {
      if (isPressLocked()) return;
      onPressProtocol(p);
    },
    [onPressProtocol, isPressLocked],
  );

  if (isLoading) {
    const skeletonCount = getOverviewCellsLimit(cols);
    // Tamagui's $gtMd prop is typed against StackStyle (which doesn't allow
    // `display: 'grid'`). Cast through `unknown` so we can pass a CSS-grid
    // template object without spreading `any` into the call site.
    const gridStyle = buildOverviewGridStyle(cols) as unknown as Record<
      string,
      unknown
    >;
    return (
      <XStack width="100%" flexWrap="wrap" gap="$2" $gtMd={gridStyle}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <XStack
            // eslint-disable-next-line react/no-array-index-key
            key={`defi-overview-skeleton-${i}`}
            minWidth={0}
            flex={1}
          >
            <Skeleton
              height={SKELETON_TILE_HEIGHT}
              borderRadius="$3"
              flex={1}
            />
          </XStack>
        ))}
      </XStack>
    );
  }

  if (!protocols || rankedProtocols.length < 2) {
    return null;
  }

  return (
    <DeFiOverviewDesktopGrid
      cells={cells}
      cols={cols}
      protocolMap={protocolMap}
      onPressProtocol={handleProtocolPress}
      onPressMore={handleMore}
      onPressLess={handleLess}
      isAllNetworks={isAllNetworks}
    />
  );
}

DeFiOverviewGrid.displayName = 'DeFiOverviewGrid';

const MemoDeFiOverviewGrid = memo(DeFiOverviewGrid);
MemoDeFiOverviewGrid.displayName = 'DeFiOverviewGrid';

export { MemoDeFiOverviewGrid as DeFiOverviewGrid };
