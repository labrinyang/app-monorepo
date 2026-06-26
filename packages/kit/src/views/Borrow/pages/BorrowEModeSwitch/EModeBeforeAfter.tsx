import { useIntl } from 'react-intl';

import { Button, Icon, SizableText, YStack } from '@onekeyhq/components';
import { BorrowInfoItem } from '@onekeyhq/kit/src/views/Borrow/components/BorrowInfoItem';
import { EarnText } from '@onekeyhq/kit/src/views/Staking/components/ProtocolDetails/EarnText';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import type {
  IBorrowEModeConfirmRow,
  IBorrowEModeHfRow,
  IBorrowEModeSwitchCheck,
} from '@onekeyhq/shared/types/staking';

function ConfirmRow({
  title,
  data,
}: {
  title: string;
  data: IBorrowEModeConfirmRow;
}) {
  return (
    <BorrowInfoItem title={title} variant="highlight">
      <YStack ai="flex-end">
        <EarnText
          text={data.current?.title}
          size="$headingMd"
          opacity={data.latest ? 0.5 : 1}
        />
        <EarnText
          text={data.current?.description}
          size="$bodySmMedium"
          opacity={data.latest ? 0.5 : 1}
        />
      </YStack>
      {data.latest ? (
        <Icon name="ArrowRightSolid" size="$4" color="$iconDisabled" />
      ) : null}
      {data.latest ? (
        <YStack ai="flex-end">
          <EarnText text={data.latest?.title} size="$headingMd" />
          <EarnText text={data.latest?.description} size="$bodySmMedium" />
        </YStack>
      ) : null}
    </BorrowInfoItem>
  );
}

function HfRow({ title, data }: { title: string; data: IBorrowEModeHfRow }) {
  return (
    <BorrowInfoItem title={title} variant="highlight">
      <EarnText
        text={data.current?.title}
        size="$headingMd"
        opacity={data.latest ? 0.5 : 1}
      />
      {data.latest ? (
        <Icon name="ArrowRightSolid" size="$4" color="$iconDisabled" />
      ) : null}
      {data.latest ? (
        <EarnText text={data.latest?.title} size="$headingMd" />
      ) : null}
    </BorrowInfoItem>
  );
}

export function EModeBeforeAfter({
  check,
  onDisableCollateral,
}: {
  check: IBorrowEModeSwitchCheck;
  onDisableCollateral: (reserveAddress: string) => void;
}) {
  const intl = useIntl();
  return (
    <YStack
      gap="$3"
      p="$3.5"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderSubdued"
    >
      <ConfirmRow
        title={intl.formatMessage({ id: ETranslations.defi_collateral })}
        data={check.collateral}
      />
      <ConfirmRow
        title={intl.formatMessage({ id: ETranslations.defi_debt })}
        data={check.debt}
      />
      <HfRow
        title={intl.formatMessage({ id: ETranslations.defi_max_ltv })}
        data={check.maxLtv}
      />
      <HfRow
        title={intl.formatMessage({ id: ETranslations.defi_health_factor })}
        data={check.healthFactor}
      />

      {check.reasons.map((r) => (
        <SizableText key={r} size="$bodySm" color="$textCritical">
          {r}
        </SizableText>
      ))}

      {check.disableCollateralAssets.map((a) => (
        <Button
          key={a.reserveAddress}
          testID={`borrow-e-mode-disable-collateral-${a.reserveAddress}`}
          variant="secondary"
          onPress={() => onDisableCollateral(a.reserveAddress)}
        >
          {intl.formatMessage(
            { id: ETranslations.defi_emode_disable_collateral },
            { symbol: a.token.symbol },
          )}
        </Button>
      ))}
    </YStack>
  );
}
