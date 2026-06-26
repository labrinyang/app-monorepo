import { useIntl } from 'react-intl';

import { Icon, YStack } from '@onekeyhq/components';
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

// Impact card: Health factor / Collateral / Debt only. Max LTV is the hero
// in screen B and is never repeated here.
export function EModeBeforeAfter({
  check,
}: {
  check: IBorrowEModeSwitchCheck;
}) {
  const intl = useIntl();
  return (
    <YStack
      gap="$3"
      p="$3.5"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderSubdued"
      animation="quick"
      enterStyle={{ opacity: 0, y: 8 }}
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
        title={intl.formatMessage({ id: ETranslations.defi_health_factor })}
        data={check.healthFactor}
      />
    </YStack>
  );
}
