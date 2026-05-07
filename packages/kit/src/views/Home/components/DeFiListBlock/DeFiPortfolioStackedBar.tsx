import { memo, useMemo } from 'react';

import { StyleSheet } from 'react-native';

import {
  SizableText,
  Skeleton,
  Stack,
  Tooltip,
  XStack,
} from '@onekeyhq/components';
import { NetworkAvatarGroup } from '@onekeyhq/kit/src/components/NetworkAvatar';

import { buildStackedBarSegments } from './DeFiPortfolioStackedBarLayout';
import { formatPortfolioPercent } from './formatPortfolioPercent';

import type { IPortfolioSlice } from './DeFiPortfolioStats';

export type IDeFiPortfolioStackedBarProps = {
  slices: IPortfolioSlice[];
  height?: number;
  gap?: number;
  isLoading?: boolean;
};

const DEFAULT_HEIGHT = 24;
/**
 * Segment gap rendered as the page background ($bgApp). The "gap is
 * the surface, not transparent or white" rule (per GitHub's language
 * bar and macOS Storage) is what makes the bar read as a single tiled
 * unit instead of a stack of separate pills. 2px = $0.5.
 */
const DEFAULT_GAP = 2;
/**
 * Triple-layered shadow language reused from ProtocolRow / Tile. The
 * INSET form (web only) gives the bar a "recessed instrument" feel
 * borrowed from macOS Storage. It costs one declaration, with a large
 * polish gain.
 */
const STACKED_BAR_INSET_SHADOW =
  'inset 0 0 0 1px rgba(0, 0, 0, 0.04), inset 0 1px 1px 0 rgba(0, 0, 0, 0.05)';

const TABULAR_NUMS: ['tabular-nums'] = ['tabular-nums'];

function buildA11yLabel(slices: IPortfolioSlice[]): string {
  if (slices.length === 0) return 'Portfolio allocation';
  const parts = slices.map(
    (s) => `${s.label} ${formatPortfolioPercent(s.percent, s.netWorth)}`,
  );
  return `Portfolio allocation: ${parts.join(', ')}`;
}

function renderTooltipContent(
  seg: ReturnType<typeof buildStackedBarSegments>[number],
) {
  const showChainRow = seg.networkIds.length > 1;
  return (
    <Stack px="$2" py="$1.5" gap="$2">
      <XStack alignItems="center" gap="$2">
        <Stack
          width="$2"
          height="$2"
          borderRadius="$full"
          bg={seg.colorToken}
          flexShrink={0}
        />
        <SizableText size="$bodyMdMedium" numberOfLines={1}>
          {seg.sliceLabel}
        </SizableText>
      </XStack>
      {showChainRow ? (
        <NetworkAvatarGroup
          networkIds={seg.networkIds}
          size="$5"
          variant="overlapped"
        />
      ) : null}
      <SizableText size="$bodySm" color="$textSubdued">
        {formatPortfolioPercent(seg.flexBasis, seg.netWorth)}
      </SizableText>
    </Stack>
  );
}

function DeFiPortfolioStackedBar({
  slices,
  height = DEFAULT_HEIGHT,
  gap = DEFAULT_GAP,
  isLoading,
}: IDeFiPortfolioStackedBarProps) {
  const segments = useMemo(() => buildStackedBarSegments(slices), [slices]);
  const a11yLabel = useMemo(() => buildA11yLabel(slices), [slices]);

  // Loading / empty / loaded all share the same shell chrome — radius,
  // continuous curve, inset shadow on web, hairline on native — so the
  // load → render transition has zero shape jump. Only the bar's
  // *contents* (skeleton shimmer / strong-neutral fill / segments) swap.
  if (isLoading) {
    return (
      <Skeleton
        height={height}
        width="100%"
        borderRadius="$3"
        borderCurve="continuous"
        $platform-web={{
          boxShadow: STACKED_BAR_INSET_SHADOW,
        }}
        $platform-native={{
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: '$borderSubdued',
        }}
      />
    );
  }

  if (segments.length === 0) {
    return (
      <Stack
        height={height}
        borderRadius="$3"
        borderCurve="continuous"
        bg="$bgStrong"
        width="100%"
        overflow="hidden"
        accessibilityRole="image"
        accessibilityLabel="Portfolio allocation: empty"
        $platform-web={{
          boxShadow: STACKED_BAR_INSET_SHADOW,
        }}
        $platform-native={{
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: '$borderSubdued',
        }}
      />
    );
  }

  return (
    <XStack
      height={height}
      borderRadius="$3"
      borderCurve="continuous"
      overflow="hidden"
      width="100%"
      accessibilityRole="image"
      accessibilityLabel={a11yLabel}
      $platform-web={{
        boxShadow: STACKED_BAR_INSET_SHADOW,
      }}
      $platform-native={{
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '$borderSubdued',
      }}
    >
      {segments.map((seg, index) => (
        <XStack
          key={seg.key}
          flexBasis={`${seg.flexBasis}%`}
          flexGrow={0}
          flexShrink={0}
          alignItems="stretch"
        >
          {index > 0 ? <Stack width={gap} bg="$bgApp" flexShrink={0} /> : null}
          <Stack
            flex={1}
            minWidth={0}
            bg={seg.colorToken}
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
            px="$1"
          >
            {seg.showLabel ? (
              <SizableText
                size="$bodySmMedium"
                color={seg.labelColorToken}
                selectable={false}
                numberOfLines={1}
                fontVariant={TABULAR_NUMS}
              >
                {seg.label}
              </SizableText>
            ) : null}
            <Tooltip
              renderContent={renderTooltipContent(seg)}
              renderTrigger={
                <Stack
                  position="absolute"
                  left={0}
                  top={0}
                  right={0}
                  bottom={0}
                  cursor="default"
                />
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
