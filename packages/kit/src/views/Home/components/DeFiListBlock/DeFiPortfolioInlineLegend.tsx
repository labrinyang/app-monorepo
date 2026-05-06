import { memo } from 'react';

import { SizableText, Skeleton, Stack, XStack } from '@onekeyhq/components';

import { formatPortfolioPercent } from './formatPortfolioPercent';

import type { IPortfolioSlice } from './DeFiPortfolioStats';

export type IDeFiPortfolioInlineLegendProps = {
  slices: IPortfolioSlice[];
  isLoading?: boolean;
};

function DeFiPortfolioInlineLegend({
  slices,
  isLoading,
}: IDeFiPortfolioInlineLegendProps) {
  if (isLoading) {
    return (
      <XStack flexWrap="wrap" gap="$2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton
            // eslint-disable-next-line react/no-array-index-key
            key={`legend-skeleton-${i}`}
            width={96}
            height={24}
            borderRadius="$2"
          />
        ))}
      </XStack>
    );
  }

  if (slices.length === 0) {
    return null;
  }

  return (
    <XStack flexWrap="wrap" gap="$2">
      {slices.map((s) => (
        <XStack
          key={s.key}
          alignItems="center"
          gap="$1.5"
          px="$2"
          py="$1"
          bg="$bgStrong"
          borderRadius="$2"
        >
          <Stack
            width={8}
            height={8}
            borderRadius="$full"
            bg={s.colorToken}
          />
          <SizableText size="$bodyMd">{s.label}</SizableText>
          <SizableText size="$bodyMd" color="$textSubdued">
            {formatPortfolioPercent(s.percent)}
          </SizableText>
        </XStack>
      ))}
    </XStack>
  );
}

DeFiPortfolioInlineLegend.displayName = 'DeFiPortfolioInlineLegend';

const MemoDeFiPortfolioInlineLegend = memo(DeFiPortfolioInlineLegend);
MemoDeFiPortfolioInlineLegend.displayName = 'DeFiPortfolioInlineLegend';

export { MemoDeFiPortfolioInlineLegend as DeFiPortfolioInlineLegend };
