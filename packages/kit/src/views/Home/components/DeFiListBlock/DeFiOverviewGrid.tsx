import { memo, useCallback, useMemo, useRef } from 'react';

import { Skeleton, XStack } from '@onekeyhq/components';
import { useDeFiListSlicedAtom } from '@onekeyhq/kit/src/states/jotai/contexts/deFiList';
import type {
  IDeFiProtocol,
  IProtocolSummary,
} from '@onekeyhq/shared/types/defi';

import { DeFiOverviewDesktopGrid } from './DeFiOverviewDesktopGrid';
import {
  OVERVIEW_BENTO_ROW_HEIGHT,
  buildOverviewGridStyle,
} from './DeFiOverviewLayout';
import {
  buildDeFiOverviewRenderCells,
  getBentoMediumCount,
  getBentoSmallCount,
} from './DeFiOverviewPlanner';
import { useDeFiOverviewTopN } from './hooks/useDeFiOverviewTopN';

import type { IDeFiOverviewSize } from './DeFiOverviewPlanner';
import type { IOverviewCols } from './overviewColsResolver';

const OVERVIEW_TOGGLE_PRESS_LOCK_MS = 600;

const SKELETON_SIZE_TO_GRID_STYLE: Record<
  Extract<IDeFiOverviewSize, 'hero' | 'medium' | 'small'>,
  React.CSSProperties
> = {
  hero: { gridColumnEnd: 'span 2', gridRowEnd: 'span 2' },
  medium: { gridColumnEnd: 'span 2', gridRowEnd: 'span 1' },
  small: { gridColumnEnd: 'span 1', gridRowEnd: 'span 1' },
};

type ISkeletonShape = Extract<IDeFiOverviewSize, 'hero' | 'medium' | 'small'>;

function buildSkeletonShapes(cols: IOverviewCols): ISkeletonShape[] {
  // Mirror the bento composition so the loading state has the same visual
  // rhythm the loaded view will assume.
  const mediumCount = getBentoMediumCount(cols);
  const smallCount = getBentoSmallCount(cols);
  return [
    'hero' as const,
    ...Array.from({ length: mediumCount }, () => 'medium' as const),
    ...Array.from({ length: smallCount }, () => 'small' as const),
  ];
}

export type IDeFiOverviewGridProps = {
  cols: IOverviewCols;
  protocols: IDeFiProtocol[] | undefined;
  protocolMap: Record<string, IProtocolSummary>;
  isLoading?: boolean;
  isAllNetworks?: boolean;
  getNetWorth: (p: IDeFiProtocol) => number;
  onPressProtocol: (p: IDeFiProtocol) => void;
};

function DeFiOverviewGrid({
  cols,
  protocols,
  protocolMap,
  isLoading,
  isAllNetworks,
  getNetWorth,
  onPressProtocol,
}: IDeFiOverviewGridProps) {
  const [isSliced, setIsSliced] = useDeFiListSlicedAtom();
  const isExpanded = !isSliced;

  const rankedProtocols = useDeFiOverviewTopN(protocols, getNetWorth);
  const overviewExposureTotal = useMemo(
    () =>
      rankedProtocols.reduce((acc, cell) => acc + Math.abs(cell.netWorth), 0),
    [rankedProtocols],
  );

  const cells = useMemo(
    () =>
      buildDeFiOverviewRenderCells({
        rankedProtocols,
        protocolMap,
        isExpanded,
        exposureTotal: overviewExposureTotal,
        cols,
      }),
    [rankedProtocols, protocolMap, isExpanded, overviewExposureTotal, cols],
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
    const shapes = buildSkeletonShapes(cols);
    // Tamagui's $gtMd prop is typed against StackStyle (which doesn't allow
    // `display: 'grid'`). Cast through `unknown` so we can pass a CSS-grid
    // template object without spreading `any` into the call site.
    const gridStyle = buildOverviewGridStyle(cols) as unknown as Record<
      string,
      unknown
    >;
    return (
      <XStack width="100%" flexWrap="wrap" gap="$2" $gtMd={gridStyle}>
        {shapes.map((shape, i) => {
          const skeletonHeight =
            shape === 'hero'
              ? OVERVIEW_BENTO_ROW_HEIGHT * 2 + 8
              : OVERVIEW_BENTO_ROW_HEIGHT;
          return (
            <XStack
              // eslint-disable-next-line react/no-array-index-key
              key={`defi-overview-skeleton-${shape}-${i}`}
              minWidth={0}
              flex={1}
              style={SKELETON_SIZE_TO_GRID_STYLE[shape]}
            >
              <Skeleton
                height={skeletonHeight}
                borderRadius="$3"
                flex={1}
              />
            </XStack>
          );
        })}
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
