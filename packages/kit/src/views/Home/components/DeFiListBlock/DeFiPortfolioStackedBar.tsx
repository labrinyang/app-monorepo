import { memo, useMemo } from 'react';

import {
  SizableText,
  Skeleton,
  Stack,
  Tooltip,
  XStack,
} from '@onekeyhq/components';
import NumberSizeableTextWrapper from '@onekeyhq/kit/src/components/NumberSizeableTextWrapper';

import { buildStackedBarSegments } from './DeFiPortfolioStackedBarLayout';

import type { IPortfolioSlice } from './DeFiPortfolioStats';

export type IDeFiPortfolioStackedBarProps = {
  slices: IPortfolioSlice[];
  currencySymbol: string;
  hideValue?: boolean;
  height?: number;
  gap?: number;
  borderRadius?: number;
  isLoading?: boolean;
};

const DEFAULT_HEIGHT = 28;
const DEFAULT_GAP = 2;
const DEFAULT_BORDER_RADIUS = 6;

function DeFiPortfolioStackedBar({
  slices,
  currencySymbol,
  hideValue,
  height = DEFAULT_HEIGHT,
  gap = DEFAULT_GAP,
  borderRadius = DEFAULT_BORDER_RADIUS,
  isLoading,
}: IDeFiPortfolioStackedBarProps) {
  const segments = useMemo(() => buildStackedBarSegments(slices), [slices]);

  if (isLoading) {
    return (
      <Skeleton height={height} borderRadius={borderRadius} width="100%" />
    );
  }

  if (segments.length === 0) {
    return (
      <Stack
        height={height}
        borderRadius={borderRadius}
        bg="$bgStrong"
        width="100%"
      />
    );
  }

  return (
    <XStack
      height={height}
      borderRadius={borderRadius}
      overflow="hidden"
      width="100%"
    >
      {segments.map((seg, index) => (
        <XStack
          key={seg.key}
          flexBasis={`${seg.flexBasis}%`}
          flexGrow={0}
          flexShrink={0}
          alignItems="stretch"
        >
          {index > 0 ? (
            <Stack width={gap} bg="$bgApp" flexShrink={0} />
          ) : null}
          <Stack flex={1} minWidth={0}>
            <Tooltip
              renderContent={
                <Stack px="$2" py="$1.5" gap="$0.5">
                  <SizableText size="$bodyMdMedium">
                    {seg.sliceLabel}
                  </SizableText>
                  <SizableText size="$bodySm" color="$textSubdued">
                    {seg.label}
                  </SizableText>
                  <NumberSizeableTextWrapper
                    hideValue={hideValue}
                    size="$bodySm"
                    formatter="value"
                    formatterOptions={{ currency: currencySymbol }}
                  >
                    {String(seg.netWorth)}
                  </NumberSizeableTextWrapper>
                </Stack>
              }
              renderTrigger={
                <Stack
                  width="100%"
                  height="100%"
                  bg={seg.colorToken}
                  alignItems="center"
                  justifyContent="center"
                  cursor="default"
                >
                  {seg.showLabel ? (
                    <SizableText
                      size="$bodySmMedium"
                      color="$whiteA12"
                      selectable={false}
                    >
                      {seg.label}
                    </SizableText>
                  ) : null}
                </Stack>
              }
            />
          </Stack>
        </XStack>
      ))}
    </XStack>
  );
}

DeFiPortfolioStackedBar.displayName = 'DeFiPortfolioStackedBar';

const MemoDeFiPortfolioStackedBar = memo(DeFiPortfolioStackedBar);
MemoDeFiPortfolioStackedBar.displayName = 'DeFiPortfolioStackedBar';

export { MemoDeFiPortfolioStackedBar as DeFiPortfolioStackedBar };
