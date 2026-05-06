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
import { formatPortfolioPercent } from './formatPortfolioPercent';
import { formatPortfolioTotal } from './formatPortfolioTotal';

const TABULAR_NUMS: ['tabular-nums'] = ['tabular-nums'];

export type IDeFiOverviewTileSize = 'hero' | 'medium' | 'small';

export type IDeFiOverviewTileProps = {
  protocol: IDeFiProtocol;
  protocolInfo: IProtocolSummary | undefined;
  netWorth: number | string;
  percent?: number;
  size?: IDeFiOverviewTileSize;
  isAllNetworks?: boolean;
  onPress: () => void;
};

// Shared tile shell. Web uses the OneKey ProtocolRow / RichBlock card
// elevation (triple-layered boxShadow); native uses a hairline border to
// keep tile edges visible on a system that doesn't honor boxShadow.
// Focus + animation are constants here so all three internal layouts
// (hero / medium / small) read identically as keyboard-focusable buttons.
const SHELL_BASE = {
  bg: '$bgSubdued',
  borderRadius: '$3',
  cursor: 'pointer',
  animation: 'quick',
  focusable: true,
  focusVisibleStyle: {
    outlineColor: '$focusRing',
    outlineStyle: 'solid',
    outlineWidth: 2,
  },
  hoverStyle: { bg: '$bgHover' },
  pressStyle: { bg: '$bgActive' },
  '$platform-web': { boxShadow: OVERVIEW_TILE_SHADOW },
  '$platform-native': {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '$borderSubdued',
  },
} as const;

function DeFiOverviewTile({
  protocol,
  protocolInfo,
  netWorth,
  percent,
  size = 'small',
  isAllNetworks,
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
  const formattedPercent =
    typeof percent === 'number'
      ? formatPortfolioPercent(percent, netWorth)
      : null;

  if (size === 'hero') {
    // Hero (2x2): logo + name as a quiet kicker on top, amount as the
    // typographic moment on bottom-left, pct subdued on bottom-right.
    // Amount jumps to $heading3xl (28) — a 1.55x ratio over medium and
    // 2.0x over small, well above the design system's 1.25 minimum.
    return (
      <YStack
        {...SHELL_BASE}
        flex={1}
        height="100%"
        width="100%"
        p="$5"
        justifyContent="space-between"
        gap="$4"
        onPress={onPress}
        role="button"
        aria-label={`${name}. ${detailsLabel}`}
      >
        <XStack alignItems="center" gap="$3">
          <Stack
            width={48}
            height={48}
            flexShrink={0}
            alignItems="center"
            justifyContent="center"
            borderRadius="$full"
            bg="$bgApp"
          >
            <Token
              size="lg"
              tokenImageUri={logo}
              networkId={protocol.networkId}
              showNetworkIcon={Boolean(isAllNetworks && protocol.networkId)}
            />
          </Stack>
          <SizableText
            size="$bodyMdMedium"
            numberOfLines={1}
            ellipsizeMode="tail"
            flex={1}
            minWidth={0}
          >
            {name}
          </SizableText>
        </XStack>
        <YStack gap="$1">
          <SizableText
            size="$heading3xl"
            numberOfLines={1}
            fontVariant={TABULAR_NUMS}
            // Tighten the 28px display number — default heading tracking
            // reads loose at this size.
            letterSpacing={-0.5}
          >
            {formattedNetWorth}
          </SizableText>
          {formattedPercent ? (
            <SizableText
              size="$bodyMd"
              color="$textSubdued"
              numberOfLines={1}
              fontVariant={TABULAR_NUMS}
            >
              {formattedPercent}
            </SizableText>
          ) : null}
        </YStack>
      </YStack>
    );
  }

  if (size === 'medium') {
    // Medium (2x1): horizontal row. Logo on the left, amount + name in the
    // body with amount as primary typography, pct right-aligned subdued.
    // Amount = $headingLg (18) — 1.29x small, well above the 1.25 floor.
    return (
      <XStack
        {...SHELL_BASE}
        flex={1}
        height="100%"
        width="100%"
        px="$4"
        py="$3"
        alignItems="center"
        gap="$3"
        onPress={onPress}
        role="button"
        aria-label={`${name}. ${detailsLabel}`}
      >
        <Stack
          width={32}
          height={32}
          flexShrink={0}
          alignItems="center"
          justifyContent="center"
          borderRadius="$full"
          bg="$bgApp"
        >
          <Token
            size="md"
            tokenImageUri={logo}
            networkId={protocol.networkId}
            showNetworkIcon={Boolean(isAllNetworks && protocol.networkId)}
          />
        </Stack>
        <YStack flex={1} minWidth={0} gap="$0.5">
          <SizableText
            size="$headingLg"
            numberOfLines={1}
            fontVariant={TABULAR_NUMS}
          >
            {formattedNetWorth}
          </SizableText>
          <SizableText
            size="$bodyMd"
            color="$textSubdued"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {name}
          </SizableText>
        </YStack>
        {formattedPercent ? (
          <SizableText
            size="$bodySm"
            color="$textSubdued"
            numberOfLines={1}
            fontVariant={TABULAR_NUMS}
          >
            {formattedPercent}
          </SizableText>
        ) : null}
      </XStack>
    );
  }

  // Small (1x1, default): the compact stacked layout, kept close to the
  // pre-bento tile so existing screens (and the native fallback) read
  // identically. Amount = $bodyMdMedium (14, semi-bold), pct = $bodyXs
  // (11, subdued).
  return (
    <XStack
      {...SHELL_BASE}
      flex={1}
      height="100%"
      width="100%"
      px="$3"
      py="$3"
      alignItems="center"
      gap="$3"
      onPress={onPress}
      role="button"
      aria-label={`${name}. ${detailsLabel}`}
    >
      <Stack
        width={32}
        height={32}
        flexShrink={0}
        alignItems="center"
        justifyContent="center"
        borderRadius="$full"
        bg="$bgApp"
      >
        <Token
          size="md"
          tokenImageUri={logo}
          networkId={protocol.networkId}
          showNetworkIcon={Boolean(isAllNetworks && protocol.networkId)}
        />
      </Stack>
      <YStack flex={1} minWidth={0} gap="$0.5">
        <SizableText
          size="$bodySm"
          color="$textSubdued"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {name}
        </SizableText>
        <SizableText
          size="$bodyMdMedium"
          numberOfLines={1}
          fontVariant={TABULAR_NUMS}
        >
          {formattedNetWorth}
        </SizableText>
        {formattedPercent ? (
          <SizableText
            size="$bodyXs"
            color="$textSubdued"
            numberOfLines={1}
            fontVariant={TABULAR_NUMS}
          >
            {formattedPercent}
          </SizableText>
        ) : null}
      </YStack>
    </XStack>
  );
}

export { DeFiOverviewTile };
