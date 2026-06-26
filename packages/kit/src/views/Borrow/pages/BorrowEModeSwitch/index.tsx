import { useCallback } from 'react';

import { useIntl } from 'react-intl';

import {
  Icon,
  Page,
  SizableText,
  Skeleton,
  XStack,
  YStack,
} from '@onekeyhq/components';
import { AccountSelectorProviderMirror } from '@onekeyhq/kit/src/components/AccountSelector';
import useAppNavigation from '@onekeyhq/kit/src/hooks/useAppNavigation';
import { useAppRoute } from '@onekeyhq/kit/src/hooks/useAppRoute';
import { useBorrowEModeStatus } from '@onekeyhq/kit/src/views/Borrow/hooks/useBorrowEModeStatus';
import { EJotaiContextStoreNames } from '@onekeyhq/kit-bg/src/states/jotai/atoms';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import type {
  EModalStakingRoutes,
  IModalStakingParamList,
} from '@onekeyhq/shared/src/routes';
import { EAccountSelectorSceneName } from '@onekeyhq/shared/types';

import { DiscoveryBrowserProviderMirror } from '../../../Discovery/components/DiscoveryBrowserProviderMirror';
import { EarnProviderMirror } from '../../../Earn/EarnProviderMirror';
import { useEarnAccount } from '../../../Staking/hooks/useEarnAccount';

import { EModeBeforeAfter } from './EModeBeforeAfter';
import { buildEModeRows } from './emodeUtils';
import { useEModeSwitch } from './useEModeSwitch';

function BorrowEModeSwitchView() {
  const route = useAppRoute<
    IModalStakingParamList,
    EModalStakingRoutes.BorrowEModeSwitch
  >();
  const {
    accountId: routeAccountId,
    indexedAccountId,
    networkId,
    provider,
    marketAddress,
  } = route.params;
  const intl = useIntl();
  const navigation = useAppNavigation();
  const { earnAccount } = useEarnAccount({
    networkId,
    accountId: routeAccountId,
    indexedAccountId,
  });
  const accountId = earnAccount?.account?.id || routeAccountId || '';

  const { eModeStatus, isLoading, refresh } = useBorrowEModeStatus({
    networkId,
    provider,
    marketAddress,
    accountId,
    enabled: !!accountId,
  });

  const {
    targetEModeId,
    check,
    isChecking,
    runCheck,
    confirmSwitch,
    disableCollateral,
  } = useEModeSwitch({
    networkId,
    accountId,
    provider,
    marketAddress,
    onSwitched: () => {
      void refresh();
      navigation.pop();
    },
  });

  const onGoRepay = useCallback(() => {
    // Repay blockers route to the existing repay flow; user returns and re-checks.
    navigation.pop();
  }, [navigation]);

  const rows = buildEModeRows(
    eModeStatus,
    intl.formatMessage({ id: ETranslations.defi_emode_off }),
  );

  return (
    <Page scrollEnabled>
      <Page.Header
        title={intl.formatMessage({ id: ETranslations.defi_emode_title })}
      />
      <Page.Body px="$5" gap="$4">
        {isLoading && !eModeStatus ? (
          <YStack gap="$3" py="$4">
            <Skeleton h="$12" w="100%" borderRadius="$3" />
            <Skeleton h="$24" w="100%" borderRadius="$3" />
          </YStack>
        ) : (
          <>
            <SizableText size="$headingSm">
              {intl.formatMessage({
                id: ETranslations.defi_emode_select_category,
              })}
            </SizableText>
            {rows.map((row) => (
              <XStack
                key={row.eModeId}
                testID={`borrow-e-mode-category-${row.eModeId}`}
                ai="center"
                jc="space-between"
                p="$3"
                borderRadius="$3"
                borderWidth={1}
                borderColor={row.selected ? '$borderActive' : '$borderSubdued'}
                opacity={row.disabled ? 0.5 : 1}
                onPress={row.disabled ? undefined : () => runCheck(row.eModeId)}
              >
                <YStack>
                  <SizableText size="$bodyLgMedium">{row.label}</SizableText>
                  {row.ltv ? (
                    <SizableText size="$bodySm" color="$textSubdued">
                      {intl.formatMessage(
                        { id: ETranslations.defi_emode_max_ltv },
                        { ltv: row.ltv },
                      )}
                    </SizableText>
                  ) : null}
                </YStack>
                {targetEModeId === row.eModeId ||
                (targetEModeId === null && row.selected) ? (
                  <Icon name="CheckRadioSolid" size="$5" color="$iconActive" />
                ) : null}
              </XStack>
            ))}

            {isChecking ? (
              <Skeleton h="$24" w="100%" borderRadius="$3" />
            ) : null}
            {check && !isChecking ? (
              <EModeBeforeAfter
                check={check}
                onDisableCollateral={disableCollateral}
                onGoRepay={onGoRepay}
              />
            ) : null}
          </>
        )}
      </Page.Body>
      <Page.Footer
        onConfirmText={intl.formatMessage({
          id: ETranslations.defi_emode_confirm,
        })}
        confirmButtonProps={{ disabled: !check?.canSwitch || isChecking }}
        onConfirm={confirmSwitch}
      />
    </Page>
  );
}

function BorrowEModeSwitch() {
  return (
    <AccountSelectorProviderMirror
      config={{ sceneName: EAccountSelectorSceneName.home, sceneUrl: '' }}
      enabledNum={[0]}
    >
      <EarnProviderMirror storeName={EJotaiContextStoreNames.earn}>
        <DiscoveryBrowserProviderMirror>
          <BorrowEModeSwitchView />
        </DiscoveryBrowserProviderMirror>
      </EarnProviderMirror>
    </AccountSelectorProviderMirror>
  );
}

export default BorrowEModeSwitch;
