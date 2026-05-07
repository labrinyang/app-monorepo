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

const TABULAR_NUMS: ['tabular-nums'] = ['tabular-nums'];

export type IDeFiOverviewTileProps = {
  protocol: IDeFiProtocol;
  protocolInfo: IProtocolSummary | undefined;
  netWorth: number | string;
  isAllNetworks?: boolean;
  /**
   * Color/percent of the bar slice this protocol owns. Set only for
   * top-N protocols (those with their own slice). Tail protocols leave
   * both undefined; the rail and percent suffix are then suppressed,
   * mirroring the aggregate Others band in the bar above.
   */
  sliceColorToken?: string;
  slicePercent?: number;
  onPress: () => void;
};

// The tile owns the absolute dollar value. The percent suffix and
// color rail are the bridge to the stacked bar above: same rank,
// same color, same percent. Without them, bar and grid live in
// parallel universes — color carries identity in the bar but lacks
// any anchor in the grid.
function DeFiOverviewTile({
  protocol,
  protocolInfo,
  netWorth,
  isAllNetworks,
  sliceColorToken,
  slicePercent,
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
  const hasSlice =
    Boolean(sliceColorToken) &&
    typeof slicePercent === 'number' &&
    Number.isFinite(slicePercent);
  // Integer percent here matches the bar's inline labels exactly.
  // The bar's tooltip continues to carry one-decimal precision when
  // a user wants the exact share.
  const inlinePercent = hasSlice ? `${Math.round(slicePercent ?? 0)}%` : '';

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
      {sliceColorToken ? (
        // 3px color rail — the bar↔tile bond. Inset 8% top/bottom so
        // it reads as an accent stripe, not chrome bleeding into the
        // tile's rounded corners. Token comes straight from the bar's
        // PORTFOLIO_PALETTE so rail and segment match by construction.
        <Stack
          position="absolute"
          left={0}
          top="8%"
          bottom="8%"
          width={3}
          borderTopRightRadius={1.5}
          borderBottomRightRadius={1.5}
          bg={sliceColorToken}
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
