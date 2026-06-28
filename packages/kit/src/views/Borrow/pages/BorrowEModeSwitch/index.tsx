import { type ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';

import { useIntl } from 'react-intl';

import {
  Button,
  Page,
  SizableText,
  Skeleton,
  XStack,
  YStack,
} from '@onekeyhq/components';
import { AccountSelectorProviderMirror } from '@onekeyhq/kit/src/components/AccountSelector';
import useAppNavigation from '@onekeyhq/kit/src/hooks/useAppNavigation';
import { useAppRoute } from '@onekeyhq/kit/src/hooks/useAppRoute';
import { useRouteIsFocused } from '@onekeyhq/kit/src/hooks/useRouteIsFocused';
import { useBorrowEModeStatus } from '@onekeyhq/kit/src/views/Borrow/hooks/useBorrowEModeStatus';
import { EJotaiContextStoreNames } from '@onekeyhq/kit-bg/src/states/jotai/atoms';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import { EModalStakingRoutes } from '@onekeyhq/shared/src/routes';
import type { IModalStakingParamList } from '@onekeyhq/shared/src/routes';
import { EAccountSelectorSceneName } from '@onekeyhq/shared/types';

import { DiscoveryBrowserProviderMirror } from '../../../Discovery/components/DiscoveryBrowserProviderMirror';
import { EarnProviderMirror } from '../../../Earn/EarnProviderMirror';
import { useEarnAccount } from '../../../Staking/hooks/useEarnAccount';

import { EModeBeforeAfter } from './EModeBeforeAfter';
import { buildEModeRows, getEModeRowAction } from './emodeUtils';
import { useBorrowEModeRowChecks } from './useBorrowEModeRowChecks';
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
  const isFocused = useRouteIsFocused();
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

  const { targetEModeId, check, isChecking, runCheck, confirmSwitch } =
    useEModeSwitch({
      networkId,
      accountId,
      provider,
      marketAddress,
      onSwitched: () => {
        void refresh();
        navigation.pop();
      },
    });

  // Re-check when B regains focus (e.g. after the Need Action screen pops),
  // so a resolved blocker flips canSwitch and enables Confirm. Read the
  // target through a ref so this fires on focus transitions only, not on
  // every selection (selection already calls runCheck directly).
  const targetRef = useRef(targetEModeId);
  targetRef.current = targetEModeId;
  useEffect(() => {
    if (isFocused && targetRef.current !== null) {
      void runCheck(targetRef.current);
    }
  }, [isFocused, runCheck]);

  const rows = buildEModeRows(
    eModeStatus,
    intl.formatMessage({ id: ETranslations.defi_emode_off }),
  );
  const selectedRow = rows.find((r) => r.selected);
  const targetRow = rows.find((r) => r.eModeId === targetEModeId);

  const currentEModeId = eModeStatus?.eModeId ?? 0;
  // Non-current, *selectable* targets only, plus the synthetic Off row
  // (eModeId 0, turning e-mode off, which can itself be blocked). A
  // `disabled:true` category is not selectable — borrowBuildSetEModeTransaction
  // rejects it with 70110 even when switch-check returns canSwitch:true — so it
  // renders
  // Unavailable directly (via getEModeRowAction's disabled gate) and is not
  // switch-checked here.
  const targetEModeIds = useMemo(
    () =>
      [
        0,
        ...(eModeStatus?.categories ?? [])
          .filter((c) => !c.disabled)
          .map((c) => c.eModeId),
      ].filter((id) => id !== currentEModeId),
    [eModeStatus, currentEModeId],
  );
  const checksEnabled = !!accountId && !!eModeStatus;
  const { checks, refresh: refreshRowChecks } = useBorrowEModeRowChecks({
    networkId,
    accountId,
    provider,
    marketAddress,
    targetEModeIds,
    enabled: checksEnabled,
  });

  // Re-run the per-row switch-checks when the screen regains focus (e.g. after
  // a blocker is resolved in Need Action and Back is tapped), so a stale row
  // refreshes. Skip the initial mount — the hook already runs on mount.
  const eModeChecksFocusedRef = useRef(false);
  useEffect(() => {
    if (!isFocused) {
      return;
    }
    if (eModeChecksFocusedRef.current) {
      refreshRowChecks();
    } else {
      eModeChecksFocusedRef.current = true;
    }
  }, [isFocused, refreshRowChecks]);

  // Hero = current Max LTV (stable anchor). Prefer the precise server value
  // from a check; fall back to the current category row's coarse ltv.
  const heroLtv =
    check?.maxLtv?.current?.title?.text ??
    (selectedRow?.ltv ? `${selectedRow.ltv}%` : '—');

  const openNeedAction = useCallback(
    (eModeId: number, label: string) => {
      navigation.push(EModalStakingRoutes.BorrowEModeNeedAction, {
        accountId,
        indexedAccountId,
        networkId,
        provider,
        marketAddress,
        targetEModeId: eModeId,
        categoryLabel: label,
      });
    },
    [
      navigation,
      accountId,
      indexedAccountId,
      networkId,
      provider,
      marketAddress,
    ],
  );

  const blocked = !!check && !check.canSwitch;

  const onFooterConfirm = useCallback(() => {
    if (blocked && targetEModeId !== null) {
      openNeedAction(targetEModeId, targetRow?.label ?? '');
      return;
    }
    void confirmSwitch();
  }, [blocked, targetEModeId, openNeedAction, targetRow, confirmSwitch]);

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
            <YStack gap="$1" pt="$2">
              <SizableText size="$bodyMd" color="$textSubdued">
                {intl.formatMessage({ id: ETranslations.defi_max_ltv })}
              </SizableText>
              <SizableText size="$heading5xl">{heroLtv}</SizableText>
              {selectedRow ? (
                <SizableText size="$bodyMd" color="$textSubdued">
                  {selectedRow.label}
                </SizableText>
              ) : null}
            </YStack>

            <SizableText size="$headingSm">
              {intl.formatMessage({
                id: ETranslations.defi_emode_select_category,
              })}
            </SizableText>
            {rows.map((row) => {
              const rowCheck = checks[row.eModeId];
              const action = getEModeRowAction({
                selected: row.selected,
                disabled: row.disabled,
                isChecking: rowCheck?.isChecking ?? checksEnabled,
                errored: rowCheck?.errored ?? false,
                canSwitch: rowCheck?.canSwitch,
                itemCount: rowCheck?.itemCount ?? 0,
              });
              const isTarget = targetEModeId === row.eModeId;
              let control: ReactNode;
              if (action === 'current') {
                control = (
                  <SizableText size="$bodyMdMedium" color="$textSubdued">
                    {intl.formatMessage({ id: ETranslations.global_current })}
                  </SizableText>
                );
              } else if (action === 'loading') {
                control = <Skeleton h="$8" w="$20" borderRadius="$2" />;
              } else if (action === 'unavailable') {
                control = (
                  <SizableText size="$bodyMdMedium" color="$textDisabled">
                    {intl.formatMessage({
                      id: ETranslations.defi_emode_unavailable,
                    })}
                  </SizableText>
                );
              } else if (action === 'needAction') {
                control = (
                  <Button
                    size="small"
                    variant="secondary"
                    testID={`borrow-e-mode-need-action-btn-${row.eModeId}`}
                    onPress={() => openNeedAction(row.eModeId, row.label)}
                  >
                    {intl.formatMessage({
                      id: ETranslations.defi_emode_need_action,
                    })}
                  </Button>
                );
              } else {
                control = (
                  <Button
                    size="small"
                    variant="primary"
                    testID={`borrow-e-mode-switch-${row.eModeId}`}
                    onPress={() => runCheck(row.eModeId)}
                  >
                    {intl.formatMessage({ id: ETranslations.global_switch })}
                  </Button>
                );
              }
              return (
                <XStack
                  key={row.eModeId}
                  testID={`borrow-e-mode-category-${row.eModeId}`}
                  ai="center"
                  jc="space-between"
                  gap="$3"
                  p="$3"
                  borderRadius="$3"
                  borderWidth={1}
                  borderColor={isTarget ? '$borderActive' : '$borderSubdued'}
                  animation="quick"
                >
                  <YStack flex={1}>
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
                  {control}
                </XStack>
              );
            })}

            {isChecking ? (
              <Skeleton h="$24" w="100%" borderRadius="$3" />
            ) : null}
            {check && !isChecking ? <EModeBeforeAfter check={check} /> : null}
          </>
        )}
      </Page.Body>
      <Page.Footer
        onConfirmText={intl.formatMessage({
          id: blocked
            ? ETranslations.defi_emode_resolve_to_switch
            : ETranslations.defi_emode_confirm,
        })}
        confirmButtonProps={{ disabled: isChecking || !check }}
        onConfirm={onFooterConfirm}
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
