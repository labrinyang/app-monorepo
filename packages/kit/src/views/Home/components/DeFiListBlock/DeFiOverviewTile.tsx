import { useIntl } from 'react-intl';
import { StyleSheet } from 'react-native';

import { SizableText, Stack, XStack, YStack } from '@onekeyhq/components';
import { Token } from '@onekeyhq/kit/src/components/Token';
import {
  useSettingsPersistAtom,
  useSettingsValuePersistAtom,
} from '@onekeyhq/kit-bg/src/states/jotai/atoms';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import type {
  IDeFiProtocol,
  IProtocolSummary,
} from '@onekeyhq/shared/types/defi';

import { OVERVIEW_TILE_SHADOW } from './DeFiOverviewLayout';
import { formatPortfolioTotal } from './formatPortfolioTotal';

import type { IDeFiOverviewSliceBinding } from './DeFiOverviewPlanner';

const TABULAR_NUMS: ['tabular-nums'] = ['tabular-nums'];

export type IDeFiOverviewTileProps = {
  protocol: IDeFiProtocol;
  protocolInfo: IProtocolSummary | undefined;
  netWorth: number | string;
  isAllNetworks?: boolean;
  /**
   * Bar-slice binding. Set only for top-N protocols; tail tiles leave
   * it undefined so the rail and percent suffix are suppressed,
   * mirroring the bar's aggregate Others band.
   */
  slice?: IDeFiOverviewSliceBinding;
  onPress: () => void;
};

// The tile owns the absolute dollar value; the rail color and percent
// suffix bridge it to the stacked bar slice it represents.
function DeFiOverviewTile({
  protocol,
  protocolInfo,
  netWorth,
  isAllNetworks,
  slice,
  onPress,
}: IDeFiOverviewTileProps) {
  const intl = useIntl();
  const [settings] = useSettingsPersistAtom();
  const [settingsValue] = useSettingsValuePersistAtom();
  const currencySymbol = settings.currencyInfo.symbol;
  const name = protocolInfo?.protocolName ?? protocol.protocol;
  const logo = protocolInfo?.protocolLogo;
  const detailsLabel = intl.formatMessage({ id: ETranslations.global_details });
  const formattedNetWorth = formatPortfolioTotal(
    Number(netWorth) || 0,
    currencySymbol,
    settingsValue.hideValue,
  );
  const hasSlice = Boolean(slice && Number.isFinite(slice.percent));
  // Integer percent matches the bar's inline labels exactly; the
  // tooltip continues to carry one-decimal precision when needed.
  const inlinePercent = hasSlice ? `${Math.round(slice?.percent ?? 0)}%` : '';

  return (
    <XStack
      flex={1}
      bg="$bgSubdued"
      borderRadius="$3"
      px="$4"
      py="$3.5"
      alignItems="center"
      gap="$3"
      cursor="pointer"
      focusable
      focusVisibleStyle={{
        outlineColor: '$focusRing',
        outlineStyle: 'solid',
        outlineWidth: 2,
      }}
      hoverStyle={{ bg: '$bgHover' }}
      pressStyle={{ bg: '$bgActive' }}
      $platform-web={{ boxShadow: OVERVIEW_TILE_SHADOW }}
      $platform-native={{
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '$borderSubdued',
      }}
      onPress={onPress}
      role="button"
      aria-label={`${name}. ${detailsLabel}`}
    >
      {slice ? (
        // 3px color rail bonds this tile to its bar slice; inset
        // top/bottom so it reads as an accent stripe instead of
        // chrome bleeding into the tile's rounded corners.
        <Stack
          position="absolute"
          left={0}
          top="8%"
          bottom="8%"
          width={3}
          borderTopRightRadius={1.5}
          borderBottomRightRadius={1.5}
          bg={slice.colorToken}
          pointerEvents="none"
        />
      ) : null}
      <Stack
        width={36}
        height={36}
        flexShrink={0}
        alignItems="center"
        justifyContent="center"
      >
        <Stack
          width={32}
          height={32}
          borderRadius="$full"
          bg="$bgApp"
          alignItems="center"
          justifyContent="center"
        >
          <Token
            size="md"
            tokenImageUri={logo}
            networkId={protocol.networkId}
            showNetworkIcon={Boolean(isAllNetworks && protocol.networkId)}
          />
        </Stack>
      </Stack>
      <YStack flex={1} minWidth={0} gap="$1">
        <XStack alignItems="baseline" gap="$1.5" minWidth={0}>
          <SizableText
            size="$bodyMd"
            color="$textSubdued"
            numberOfLines={1}
            ellipsizeMode="tail"
            flexShrink={1}
          >
            {name}
          </SizableText>
          {hasSlice ? (
            // flexShrink={0} so a long protocol name truncates first;
            // the percent is the cross-link to the bar and must never
            // be the piece that gets cut.
            <SizableText
              size="$bodySm"
              color="$textDisabled"
              fontVariant={TABULAR_NUMS}
              flexShrink={0}
              selectable={false}
            >
              {inlinePercent}
            </SizableText>
          ) : null}
        </XStack>
        <SizableText
          size="$bodyLgMedium"
          numberOfLines={1}
          fontVariant={TABULAR_NUMS}
        >
          {formattedNetWorth}
        </SizableText>
      </YStack>
    </XStack>
  );
}

export { DeFiOverviewTile };
