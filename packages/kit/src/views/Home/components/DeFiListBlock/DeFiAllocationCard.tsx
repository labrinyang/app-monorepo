import { memo, useMemo } from 'react';

import { useIntl } from 'react-intl';

import {
  SizableText,
  Skeleton,
  XStack,
  YStack,
  useMedia,
} from '@onekeyhq/components';
import {
  useSettingsPersistAtom,
  useSettingsValuePersistAtom,
} from '@onekeyhq/kit-bg/src/states/jotai/atoms';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import type {
  IDeFiProtocol,
  IProtocolSummary,
} from '@onekeyhq/shared/types/defi';

import { DeFiOverviewGrid } from './DeFiOverviewGrid';
import { DeFiPortfolioInlineLegend } from './DeFiPortfolioInlineLegend';
import { DeFiPortfolioStackedBar } from './DeFiPortfolioStackedBar';
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
  const intl = useIntl();
  const [settings] = useSettingsPersistAtom();
  const [settingsValue] = useSettingsValuePersistAtom();
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

  const protocolCount = protocols?.length ?? 0;

  return (
    <YStack
      bg="$bgSubdued"
      borderRadius="$3"
      p="$5"
      gap="$5"
      userSelect="none"
    >
      <XStack justifyContent="space-between" alignItems="center">
        <SizableText size="$headingLg" role="heading" aria-level={3}>
          {intl.formatMessage({ id: ETranslations.defi_allocation })}
        </SizableText>
        {isLoading ? (
          <Skeleton width={88} height={16} borderRadius="$1" />
        ) : (
          <SizableText size="$bodyMd" color="$textSubdued">
            {intl.formatMessage(
              { id: ETranslations.defi_n_protocols },
              { count: protocolCount },
            )}
          </SizableText>
        )}
      </XStack>

      <YStack gap="$3">
        <DeFiPortfolioStackedBar
          slices={stats.slices}
          currencySymbol={settings.currencyInfo.symbol}
          hideValue={settingsValue.hideValue}
          isLoading={isLoading}
        />
        <DeFiPortfolioInlineLegend slices={stats.slices} isLoading={isLoading} />
      </YStack>

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
