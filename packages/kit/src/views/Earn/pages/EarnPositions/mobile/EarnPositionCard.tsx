import { memo, useCallback } from 'react';

import BigNumber from 'bignumber.js';
import { useIntl } from 'react-intl';

import {
  Badge,
  Button,
  Icon,
  NumberSizeableText,
  SizableText,
  Stack,
  XStack,
  YStack,
} from '@onekeyhq/components';
import { useCurrency } from '@onekeyhq/kit/src/components/Currency';
import { DeFiPositionHealthFactorRow } from '@onekeyhq/kit/src/components/DeFi/DeFiPositionHealthFactorRow';
import { ProtocolValueCell } from '@onekeyhq/kit/src/components/DeFi/ProtocolValueCell';
import { isProtocolAssetValueUnavailable } from '@onekeyhq/kit/src/components/DeFi/protocolValueUtils';
import NumberSizeableTextWrapper from '@onekeyhq/kit/src/components/NumberSizeableTextWrapper';
import { Token } from '@onekeyhq/kit/src/components/Token';
import useAppNavigation from '@onekeyhq/kit/src/hooks/useAppNavigation';
import { DottedUnderlineText } from '@onekeyhq/kit/src/views/Staking/components/ProtocolDetails/DottedUnderline';
import { EarnText } from '@onekeyhq/kit/src/views/Staking/components/ProtocolDetails/EarnText';
import { EarnTooltip } from '@onekeyhq/kit/src/views/Staking/components/ProtocolDetails/EarnTooltip';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import { EModalRoutes, EModalStakingRoutes } from '@onekeyhq/shared/src/routes';
import earnUtils from '@onekeyhq/shared/src/utils/earnUtils';
import { numberFormat } from '@onekeyhq/shared/src/utils/numberUtils';
import type {
  IEarnPortfolioPosition,
  IEarnPositionEffectiveDeposit,
  IEarnPositionManageTarget,
} from '@onekeyhq/shared/types/earn/portfolioPositions';

import {
  WrappedActionButton,
  getRewardButtonText,
} from '../../../components/PortfolioTabContent';
import { EarnTestIDs } from '../../../testIDs';

import { isCheckRow } from './earnPositionModel';
import {
  hasPositionDetailPage,
  toPositionCancel,
  toPositionClaim,
  toPositionRewardClaim,
} from './myPortfolio.utils';

import type {
  IEarnPositionSectionAsset,
  IEarnPositionSectionView,
  IEarnPositionView,
} from './earnPositionModel';
import type { IEarnPositionClaim } from './myPortfolio.utils';

export type IEarnPositionCardHandlers = {
  /** opens the position's own Earn detail page (EarnNavigation.pushToEarnProtocolDetails) */
  onManage?: (target: IEarnPositionManageTarget) => void;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// The small button is 30 pt tall; the slop brings its tap area to 44 pt,
// and out to the panel's edge on the right.
const ROW_ACTION_HIT_SLOP = { top: 7, bottom: 7, left: 8, right: 12 };
// Where a row's text starts: past the token logo ($8) and its gap ($2).
// A line that hangs under a row (days left, effective deposits) starts here.
const ROW_TEXT_INSET = '$10';

/** Whole days until a withdrawal frees up, counted up; none once the date has passed. */
function daysLeftOf(unlockAt: number | undefined): number | undefined {
  if (!unlockAt) {
    return undefined;
  }
  const days = Math.ceil((unlockAt - Date.now()) / DAY_MS);
  return days > 0 ? days : undefined;
}

/**
 * Redeem on a deposit follows the detail page's footer: Pendle sells its PT
 * instead (Sell early / Redeem at maturity, on its own page), Ethena USDe is
 * managed rather than redeemed, and a holding with no page has nothing to
 * open.
 */
function canRedeemFromCard(position: IEarnPortfolioPosition): boolean {
  const { manage } = position.earn;
  return (
    hasPositionDetailPage(position) &&
    !earnUtils.isPendleProvider({ providerName: manage.provider }) &&
    manage.symbol.toUpperCase() !== 'USDE'
  );
}

type IRowAction =
  | { kind: 'redeem' }
  | { kind: 'button'; claim: IEarnPositionClaim }
  | { kind: 'pending' };

/**
 * What a row offers, the way the detail page's Portfolio row does (product
 * 10-14): Redeem on a deposit, the server's Claim (or Lista's Check) on a
 * reward, a Pending badge on a reward the user cannot claim yet, Cancel on a
 * withdrawal the provider lets be called back, and Claim on the principal
 * out of its cooldown. A withdrawal shows its days left either way.
 */
function rowActionOf({
  section,
  asset,
  showRedeem,
}: {
  section: IEarnPositionSectionView;
  asset: IEarnPositionSectionAsset;
  showRedeem: boolean;
}): IRowAction | undefined {
  switch (section.kind) {
    // A loan's Supplied and Borrowed rows carry none: taking collateral out
    // or repaying moves the health factor, which the Borrow flows handle.
    case 'deposited':
      return showRedeem && canRedeemFromCard(asset.origin)
        ? { kind: 'redeem' }
        : undefined;
    case 'rewards': {
      if (asset.status === 'pending') {
        return { kind: 'pending' };
      }
      if (!asset.claim) {
        return undefined;
      }
      return {
        kind: 'button',
        claim: toPositionRewardClaim(asset.origin, {
          ...asset,
          claim: asset.claim,
        }),
      };
    }
    case 'pendingWithdrawal': {
      const cancel = toPositionCancel(asset.origin);
      return cancel ? { kind: 'button', claim: cancel } : undefined;
    }
    case 'claimable': {
      const claim = toPositionClaim(asset.origin);
      return claim ? { kind: 'button', claim } : undefined;
    }
    default:
      return undefined;
  }
}

/**
 * A reward the user cannot claim yet: the detail page's badge, in the slot
 * a button would take, which opens the reason when the server gave one. The
 * badge is 20 pt tall; padding that the negative margins take back makes
 * its tap area 44 pt without moving it.
 */
function PendingBadge({ asset }: { asset: IEarnPositionSectionAsset }) {
  const intl = useIntl();
  const badge = (
    <Badge badgeType="info" badgeSize="sm">
      <Badge.Text>
        {intl.formatMessage({ id: ETranslations.global_pending })}
      </Badge.Text>
    </Badge>
  );
  if (!asset.tooltip) {
    return badge;
  }
  return (
    <EarnTooltip
      title={asset.symbol}
      tooltip={asset.tooltip}
      renderTrigger={
        <Stack py="$3" my="$-3" px="$2" mx="$-2">
          {badge}
        </Stack>
      }
    />
  );
}

function DaysLeftText({ days }: { days: number }) {
  const intl = useIntl();
  return (
    <SizableText size="$bodySm" color="$textSubdued" numberOfLines={1}>
      {intl.formatMessage(
        { id: ETranslations.earn_number_days_left },
        { number: days },
      )}
    </SizableText>
  );
}

type IRowButton = Extract<IRowAction, { kind: 'redeem' | 'button' }>;

/**
 * A row's Redeem, Claim, Check or Cancel: the app's small secondary button,
 * the same for every action. Several rows of a panel can read "Claim", so a
 * screen reader hears the token as well.
 */
function RowAction({
  action,
  symbol,
  onRedeem,
}: {
  action: IRowButton;
  symbol: string;
  onRedeem: () => void;
}) {
  const intl = useIntl();
  if (action.kind === 'redeem') {
    const label = intl.formatMessage({ id: ETranslations.earn_redeem });
    return (
      <Button
        testID={EarnTestIDs.portfolioRedeemButton}
        size="small"
        variant="secondary"
        hitSlop={ROW_ACTION_HIT_SLOP}
        aria-label={`${label} ${symbol}`}
        onPress={onRedeem}
      >
        {label}
      </Button>
    );
  }
  const label = getRewardButtonText(action.claim.reward.button)?.text;
  return (
    <WrappedActionButton
      asset={action.claim.asset}
      reward={action.claim.reward}
      rewardSymbol={action.claim.rewardSymbol}
      buttonProps={{
        hitSlop: ROW_ACTION_HIT_SLOP,
        'aria-label': label ? `${label} ${symbol}` : undefined,
      }}
    />
  );
}

/**
 * The part of the deposit that came through OneKey (Spark): a line hung
 * under the deposit row, flush with its value the way a withdrawal's days
 * left are (the margin takes back the row's padding and the panel's gap;
 * the padding below gives a row's back). The label is the way to its
 * explanation, padded to a finger's height; the amount hides with the
 * balances.
 */
function EffectiveDepositRow({
  effectiveDeposit,
}: {
  effectiveDeposit: IEarnPositionEffectiveDeposit;
}) {
  const { label, tooltip } = effectiveDeposit;
  return (
    <XStack
      pl={ROW_TEXT_INSET}
      mt="$-2"
      pb="$1"
      ai="center"
      columnGap="$2"
      flexWrap="wrap"
    >
      {tooltip ? (
        <EarnTooltip
          title={label.text}
          tooltip={tooltip}
          renderTrigger={
            <Stack py="$3" my="$-3">
              <DottedUnderlineText
                size="$bodySm"
                color="$textSubdued"
                numberOfLines={1}
              >
                {label.text}
              </DottedUnderlineText>
            </Stack>
          }
        />
      ) : (
        <SizableText size="$bodySm" color="$textSubdued" numberOfLines={1}>
          {label.text}
        </SizableText>
      )}
      <NumberSizeableTextWrapper
        hideValue
        size="$bodySmMedium"
        formatter="balance"
        formatterOptions={{ tokenSymbol: effectiveDeposit.symbol }}
        numberOfLines={1}
      >
        {effectiveDeposit.amount}
      </NumberSizeableTextWrapper>
    </XStack>
  );
}

/**
 * One asset of a panel (product 10-14): the token's amount and name over
 * its value on the left, and the row's one button, or its Pending badge,
 * alone on the right. With every number on the left, a button never pushes
 * a number aside. The logo and the button center on the amount and value;
 * a withdrawal's days left hang under them, so a taller row keeps that
 * alignment, and the same padding on every row keeps rows apart however
 * many lines they have. Status and action stay on the row and never move
 * up to the panel: a panel holds several assets, each in its own state.
 */
function PositionRow({
  asset,
  action,
  networkId,
  onRedeem,
}: {
  asset: IEarnPositionSectionAsset;
  action: IRowAction | undefined;
  networkId: string;
  onRedeem: () => void;
}) {
  const intl = useIntl();
  const currencyInfo = useCurrency();
  const isCheck = isCheckRow(asset);
  const days = daysLeftOf(asset.unlockAt);
  const button =
    action?.kind === 'redeem' || action?.kind === 'button' ? action : undefined;
  return (
    <YStack py="$1">
      <XStack ai="center" gap="$3" minHeight={36}>
        <XStack ai="center" gap="$2" flex={1} minWidth={0}>
          <Token
            size="md"
            tokenImageUri={asset.meta?.logoUrl}
            showNetworkIcon
            networkId={networkId}
          />
          <YStack flexShrink={1} minWidth={0}>
            {isCheck ? (
              // Lista's reward is unknown until Check reveals it: the name alone.
              <SizableText size="$bodyMdMedium" numberOfLines={1}>
                {asset.symbol}
              </SizableText>
            ) : (
              <>
                <NumberSizeableTextWrapper
                  hideValue
                  size="$bodyMdMedium"
                  formatter="balance"
                  formatterOptions={{ tokenSymbol: asset.symbol }}
                  numberOfLines={1}
                >
                  {asset.amount}
                </NumberSizeableTextWrapper>
                <ProtocolValueCell
                  value={asset.value}
                  currencySymbol={currencyInfo.symbol}
                  priceUnavailableLabel={intl.formatMessage({
                    id: ETranslations.wallet_price_unavailable,
                  })}
                  isUnavailable={isProtocolAssetValueUnavailable(asset)}
                  size="$bodySm"
                  color="$textSubdued"
                  justifyContent="flex-start"
                  numberOfLines={1}
                />
              </>
            )}
          </YStack>
        </XStack>
        {button ? (
          <RowAction
            action={button}
            symbol={asset.symbol}
            onRedeem={onRedeem}
          />
        ) : null}
        {action?.kind === 'pending' ? <PendingBadge asset={asset} /> : null}
      </XStack>
      {days ? (
        <Stack pl={ROW_TEXT_INSET}>
          <DaysLeftText days={days} />
        </Stack>
      ) : null}
    </YStack>
  );
}

/**
 * The card's panels, on My portfolio and on the detail page's Portfolio
 * tab alike (product 10-14): one panel per section, its title on top, the
 * token rows under it, each with its own status and action. The detail
 * page leaves Redeem to its footer.
 */
export function PositionPanels({
  position,
  showRedeem,
}: {
  position: IEarnPositionView;
  /** Redeem on the deposit rows; the detail page has it in its footer instead */
  showRedeem: boolean;
}) {
  const navigation = useAppNavigation();
  const { source } = position;
  const rows = position.sections.map((section) => ({
    section,
    actions: section.assets.map((asset) =>
      rowActionOf({ section, asset, showRedeem }),
    ),
  }));

  // Same destination as the detail page's Redeem for most providers: the
  // manage page on its withdraw tab. Providers that redeem per position
  // (Babylon, Stakefish SOL/ETH, Everstake SOL) open their position picker
  // from the detail page, which knows the provider's actions; the card does
  // not, so wiring those is left to the implementation.
  const handleRedeem = useCallback(() => {
    const { manage } = source.earn;
    navigation.pushModal(EModalRoutes.StakingModal, {
      screen: EModalStakingRoutes.ManagePosition,
      params: {
        networkId: manage.networkId,
        symbol: manage.symbol,
        provider: manage.provider,
        vault: manage.vault,
        tab: 'withdraw',
        tokenImageUri: source.assets[0]?.meta?.logoUrl,
      },
    });
  }, [navigation, source]);

  return (
    <YStack gap="$3">
      {rows.map(({ section, actions }) => (
        <YStack
          key={section.key}
          gap="$1"
          px="$3"
          py="$2"
          borderRadius="$3"
          bg="$bgSubdued"
        >
          <SizableText size="$bodySmMedium" color="$textSubdued" py="$1">
            {section.title}
          </SizableText>
          {section.assets.map((asset, index) => (
            <PositionRow
              key={`${section.key}-${asset.symbol}-${index}`}
              asset={asset}
              action={actions[index]}
              networkId={source.networkId}
              onRedeem={handleRedeem}
            />
          ))}
          {position.effectiveDeposit &&
          (section.kind === 'deposited' || section.kind === 'supplied') ? (
            <EffectiveDepositRow effectiveDeposit={position.effectiveDeposit} />
          ) : null}
        </YStack>
      ))}
    </YStack>
  );
}

/**
 * The PnL under the card value (figma 30490-21077): "+$0.84 (+1.69%)",
 * the server's numbers formatted here, green up and red down. A server that
 * only sends the styled texts (before 6.6.1) still gets them; a provider
 * that reports "Total earned" instead keeps that line, subdued.
 */
function PositionPnlLine({ position }: { position: IEarnPortfolioPosition }) {
  const intl = useIntl();
  const currencyInfo = useCurrency();
  const { pnl, investment } = position.earn;
  if (pnl) {
    const fiat = new BigNumber(pnl.fiatValue);
    let color = '$textSubdued';
    if (fiat.gt(0)) {
      color = '$textSuccess';
    } else if (fiat.lt(0)) {
      color = '$textCritical';
    }
    const percent =
      pnl.percent === undefined
        ? undefined
        : numberFormat(pnl.percent, {
            formatter: 'priceChange',
            formatterOptions: { showPlusMinusSigns: true },
          });
    return (
      <XStack ai="center" gap="$1">
        <NumberSizeableText
          size="$bodySm"
          color={color}
          formatter="value"
          formatterOptions={{
            currency: currencyInfo.symbol,
            showPlusMinusSigns: true,
          }}
          numberOfLines={1}
        >
          {pnl.fiatValue}
        </NumberSizeableText>
        {percent ? (
          <SizableText size="$bodySm" color={color} numberOfLines={1}>
            {`(${percent})`}
          </SizableText>
        ) : null}
      </XStack>
    );
  }
  const { netPnl, netPnlFiatValue, totalReward } = investment;
  if (netPnl) {
    return (
      <XStack ai="center" gap="$1">
        <EarnText size="$bodySm" text={netPnlFiatValue} />
        <EarnText size="$bodySm" text={netPnl} />
      </XStack>
    );
  }
  if (totalReward) {
    return (
      <XStack ai="center" gap="$1">
        <EarnText
          size="$bodySm"
          color="$textSubdued"
          text={totalReward.description}
        />
        <EarnText
          size="$bodySm"
          color="$textSubdued"
          text={{
            text: intl.formatMessage({
              id: ETranslations.earn_referral_total_earned,
            }),
          }}
        />
      </XStack>
    );
  }
  return null;
}

/**
 * One holding (product 10-14): badge, name, value with its PnL under it and
 * a chevron on the header line, which opens the detail page; an optional
 * health factor line; then the panels, each row with its own action. No
 * Manage or Claim under the card: every action sits on its row.
 */
function EarnPositionCardCmp({
  position,
  onManage,
}: { position: IEarnPositionView } & IEarnPositionCardHandlers) {
  const intl = useIntl();
  const currencyInfo = useCurrency();
  const { value, meta, source, action, hasDeposit } = position;
  const canOpen =
    Boolean(action) && Boolean(onManage) && hasPositionDetailPage(source);
  const openDetail =
    canOpen && action ? () => onManage?.(action.target) : undefined;

  return (
    <YStack gap="$3" testID={EarnTestIDs.portfolioItem(source.protocolName)}>
      <YStack
        {...(openDetail
          ? {
              onPress: openDetail,
              cursor: 'pointer',
              pressStyle: { opacity: 0.6 },
            }
          : {})}
      >
        <XStack ai="center" jc="space-between" gap="$2" minHeight={28}>
          <XStack ai="center" gap="$2" flex={1} minWidth={0}>
            {/* one color for every badge: Locked is a state, not a warning */}
            <Badge badgeType="success" badgeSize="sm" flexShrink={0}>
              <Badge.Text>{position.badgeLabel}</Badge.Text>
            </Badge>
            {position.name ? (
              <SizableText
                size="$bodyMd"
                color="$textSubdued"
                numberOfLines={1}
                flex={1}
              >
                {position.name}
              </SizableText>
            ) : null}
          </XStack>
          <XStack ai="center" gap="$1" flexShrink={0}>
            <ProtocolValueCell
              value={value.value}
              currencySymbol={currencyInfo.symbol}
              priceUnavailableLabel={intl.formatMessage({
                id: ETranslations.wallet_price_unavailable,
              })}
              partialPriceUnavailableLabel={intl.formatMessage({
                id: ETranslations.wallet_partial_price_unavailable,
              })}
              isUnavailable={!value.hasAvailableValue}
              showPriceUnavailableTooltip={
                value.hasAvailableValue && value.hasUnavailableValue
              }
              size="$bodyLgMedium"
              textAlign="right"
              numberOfLines={1}
            />
            {openDetail ? (
              <Icon
                name="ChevronRightSmallOutline"
                size="$5"
                color="$iconSubdued"
              />
            ) : null}
          </XStack>
        </XStack>
        {hasDeposit ? (
          // Right-aligned under the value (the padding skips the chevron),
          // on a line of its own: a long "Total earned" takes the room under
          // the name instead of squeezing the badge and name out.
          <XStack jc="flex-end" pr={openDetail ? '$6' : undefined}>
            <PositionPnlLine position={source} />
          </XStack>
        ) : null}
      </YStack>

      {meta?.kind === 'healthFactor' ? (
        <DeFiPositionHealthFactorRow healthFactor={meta.healthFactor} />
      ) : null}

      <PositionPanels position={position} showRedeem />
    </YStack>
  );
}

export const EarnPositionCard = memo(EarnPositionCardCmp);
