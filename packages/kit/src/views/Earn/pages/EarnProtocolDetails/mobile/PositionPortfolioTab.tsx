import { useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { useIntl } from 'react-intl';

import { SizableText, XStack, YStack } from '@onekeyhq/components';
import { useCurrency } from '@onekeyhq/kit/src/components/Currency';
import NumberSizeableTextWrapper from '@onekeyhq/kit/src/components/NumberSizeableTextWrapper';
import { GridItem } from '@onekeyhq/kit/src/views/Staking/components/ProtocolDetails/GridItemV2';
import { ETranslations } from '@onekeyhq/shared/src/locale';

import { PositionPanels } from '../../EarnPositions/mobile/EarnPositionCard';
import { getDemoInvestmentCells } from '../../EarnPositions/mobile/positionRowActionsDemo';

import type { IEarnPositionView } from '../../EarnPositions/mobile/earnPositionModel';

/**
 * The detail page's Portfolio tab, product 10-14: My investment, then the
 * holding's card panels exactly as My portfolio draws them. The page title
 * already names the holding, so the card's header line is left out. A
 * deposit row's Redeem is the page's own, the footer's, as on the server's
 * Portfolio tab (product 10-15: every row the user can act on carries its
 * action): it runs the page's handler, which opens the position picker for
 * the providers that redeem per position. My investment leads with the
 * balance and the 24h earnings; the APY cell that repeated the headline is
 * gone, and Spark keeps its Effective APY (the user's own rate, not the
 * headline's).
 */
export function PositionPortfolioTab({
  position,
  canRedeem,
  onRedeem,
}: {
  position: IEarnPositionView;
  /** whether the page's footer offers Redeem */
  canRedeem?: boolean;
  /** the page footer's Redeem */
  onRedeem?: () => void;
}) {
  const intl = useIntl();
  const currencyInfo = useCurrency();
  const earnings24h = position.source.earn.investment.earnings24hFiatValue;
  const earnings24hValue = new BigNumber(earnings24h || '0');
  const extraCells = getDemoInvestmentCells(position, intl.locale);
  const pageRedeem = useMemo(
    () => ({ canRedeem: Boolean(canRedeem && onRedeem), onRedeem }),
    [canRedeem, onRedeem],
  );

  return (
    <YStack gap="$6">
      <YStack gap="$2">
        <SizableText size="$headingMd" color="$text">
          {intl.formatMessage({
            id: ETranslations.wallet_defi_position_module_investment,
          })}
        </SizableText>
        <XStack flexWrap="wrap" m="$-3">
          <GridItem
            title={{
              text: intl.formatMessage({ id: ETranslations.global_balance }),
            }}
            descriptionComponent={
              <NumberSizeableTextWrapper
                hideValue
                size="$bodyLgMedium"
                formatter="value"
                formatterOptions={{ currency: currencyInfo.symbol }}
                numberOfLines={1}
              >
                {String(position.value.value)}
              </NumberSizeableTextWrapper>
            }
          />
          <GridItem
            title={{
              text: intl.formatMessage({
                id: ETranslations.earn_24h_earnings,
              }),
            }}
            descriptionComponent={
              <NumberSizeableTextWrapper
                hideValue
                size="$bodyLgMedium"
                color={earnings24hValue.gt(0) ? '$textSuccess' : '$text'}
                formatter="value"
                formatterOptions={{
                  currency: currencyInfo.symbol,
                  showPlusMinusSigns: earnings24hValue.gt(0),
                }}
                numberOfLines={1}
              >
                {earnings24hValue.toFixed()}
              </NumberSizeableTextWrapper>
            }
          />
          {extraCells.map((cell) => (
            <GridItem
              key={cell.title}
              title={{ text: cell.title }}
              description={{ text: cell.value }}
            />
          ))}
        </XStack>
      </YStack>
      <PositionPanels position={position} pageRedeem={pageRedeem} />
    </YStack>
  );
}
