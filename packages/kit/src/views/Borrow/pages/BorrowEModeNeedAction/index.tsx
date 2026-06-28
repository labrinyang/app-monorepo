import { useCallback, useEffect } from 'react';

import { useIntl } from 'react-intl';

import {
  Button,
  Icon,
  Page,
  SizableText,
  Skeleton,
  Spinner,
  XStack,
  YStack,
} from '@onekeyhq/components';
import { AccountSelectorProviderMirror } from '@onekeyhq/kit/src/components/AccountSelector';
import { Token } from '@onekeyhq/kit/src/components/Token';
import useAppNavigation from '@onekeyhq/kit/src/hooks/useAppNavigation';
import { useAppRoute } from '@onekeyhq/kit/src/hooks/useAppRoute';
import { useRouteIsFocused } from '@onekeyhq/kit/src/hooks/useRouteIsFocused';
import { BorrowNavigation } from '@onekeyhq/kit/src/views/Borrow/borrowUtils';
import {
  type IEModeNeedActionItem,
  buildNeedActionItems,
} from '@onekeyhq/kit/src/views/Borrow/pages/BorrowEModeSwitch/emodeUtils';
import { useEModeSwitch } from '@onekeyhq/kit/src/views/Borrow/pages/BorrowEModeSwitch/useEModeSwitch';
import { useStakingPendingTxsByInfo } from '@onekeyhq/kit/src/views/Earn/hooks/useStakingPendingTxs';
import { EarnText } from '@onekeyhq/kit/src/views/Staking/components/ProtocolDetails/EarnText';
import { EJotaiContextStoreNames } from '@onekeyhq/kit-bg/src/states/jotai/atoms';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import type {
  EModalStakingRoutes,
  IModalStakingParamList,
} from '@onekeyhq/shared/src/routes';
import { EAccountSelectorSceneName } from '@onekeyhq/shared/types';
import {
  EEarnLabels,
  EManagePositionType,
} from '@onekeyhq/shared/types/staking';

import { DiscoveryBrowserProviderMirror } from '../../../Discovery/components/DiscoveryBrowserProviderMirror';
import { EarnProviderMirror } from '../../../Earn/EarnProviderMirror';
import { useEarnAccount } from '../../../Staking/hooks/useEarnAccount';

function NeedActionRow({
  item,
  accountId,
  networkId,
  provider,
  marketAddress,
  onRemove,
}: {
  item: IEModeNeedActionItem;
  accountId: string;
  networkId: string;
  provider: string;
  marketAddress: string;
  onRemove: (reserveAddress: string) => void;
}) {
  const intl = useIntl();
  const navigation = useAppNavigation();
  const routeManage = (type: EManagePositionType) =>
    BorrowNavigation.pushToBorrowManagePosition(navigation, {
      accountId,
      networkId,
      provider,
      marketAddress,
      reserveAddress: item.reserveAddress,
      symbol: item.symbol,
      logoURI: item.logoURI,
      type,
    });
  return (
    <YStack
      gap="$2.5"
      p="$3.5"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderSubdued"
    >
      <XStack ai="center" gap="$3">
        <Token size="md" tokenImageUri={item.logoURI} />
        <YStack flex={1}>
          <SizableText size="$bodyLgMedium">
            {item.kind === 'repay'
              ? intl.formatMessage(
                  { id: ETranslations.defi_emode_repay_symbol },
                  { symbol: item.symbol },
                )
              : intl.formatMessage(
                  { id: ETranslations.defi_emode_disable_collateral },
                  { symbol: item.symbol },
                )}
          </SizableText>
          {item.amount ? (
            <EarnText text={item.amount} size="$bodySm" color="$textSubdued" />
          ) : null}
        </YStack>
      </XStack>
      <XStack gap="$2.5" jc="flex-end">
        {item.kind === 'repay' ? (
          <Button
            size="small"
            variant="primary"
            testID={`borrow-e-mode-need-action-repay-${item.reserveAddress}`}
            onPress={() => routeManage(EManagePositionType.Repay)}
          >
            {intl.formatMessage({ id: ETranslations.defi_repay })}
          </Button>
        ) : (
          <>
            <Button
              size="small"
              variant="primary"
              testID={`borrow-e-mode-need-action-remove-${item.reserveAddress}`}
              onPress={() => onRemove(item.reserveAddress)}
            >
              {intl.formatMessage({ id: ETranslations.global_remove })}
            </Button>
            <Button
              size="small"
              variant="secondary"
              testID={`borrow-e-mode-need-action-withdraw-${item.reserveAddress}`}
              onPress={() => routeManage(EManagePositionType.Withdraw)}
            >
              {intl.formatMessage({ id: ETranslations.global_withdraw })}
            </Button>
          </>
        )}
      </XStack>
    </YStack>
  );
}

function BorrowEModeNeedActionView() {
  const route = useAppRoute<
    IModalStakingParamList,
    EModalStakingRoutes.BorrowEModeNeedAction
  >();
  const {
    accountId: routeAccountId,
    indexedAccountId,
    networkId,
    provider,
    marketAddress,
    targetEModeId,
    categoryLabel,
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

  const { check, isChecking, runCheck, confirmSwitch, disableCollateral } =
    useEModeSwitch({
      networkId,
      accountId,
      provider,
      marketAddress,
      // After the switch lands, close the whole e-mode modal stack; the
      // Overview re-reads e-mode status on focus.
      onSwitched: () => navigation.popStack(),
    });

  // Track this account/network's borrow txs (Repay / Remove / Withdraw). When
  // they confirm on-chain, force a fresh switch-check after a short backend
  // sync delay so a resolved blocker drops off and canSwitch can flip true.
  const pendingTagMatcher = useCallback(
    (tag: string) =>
      tag === EEarnLabels.Borrow ||
      tag.startsWith(`borrow:${provider.toLowerCase()}:`),
    [provider],
  );
  const { filteredTxs: pendingTxs = [] } = useStakingPendingTxsByInfo({
    networkIds: [networkId],
    tagMatcher: pendingTagMatcher,
    onRefresh: () => {
      void runCheck(targetEModeId);
    },
    onRefreshDelayMs: 3000,
  });
  const isPending = pendingTxs.length > 0;
  const canSwitch = !!check?.canSwitch;

  // Re-check on every focus: initial mount AND each time a routed Repay /
  // Withdraw modal closes and returns here, so resolved blockers drop off.
  // The seq-guard inside runCheck makes overlapping checks safe.
  useEffect(() => {
    if (isFocused && accountId) {
      void runCheck(targetEModeId);
    }
  }, [isFocused, accountId, targetEModeId, runCheck]);

  const items = buildNeedActionItems(check);

  return (
    <Page scrollEnabled>
      <Page.Header
        title={intl.formatMessage({
          id: ETranslations.defi_emode_need_action_title,
        })}
      />
      <Page.Body px="$5" gap="$4">
        <SizableText size="$bodyMd" color="$textSubdued">
          {intl.formatMessage(
            { id: ETranslations.defi_emode_need_action_subtitle },
            { category: categoryLabel },
          )}
        </SizableText>

        {isPending ? (
          <XStack ai="center" gap="$2">
            <Spinner size="small" />
            <SizableText size="$bodyMd" color="$textSubdued">
              {intl.formatMessage({ id: ETranslations.global_processing })}
            </SizableText>
          </XStack>
        ) : null}

        {isChecking && !check ? (
          <YStack gap="$3">
            <Skeleton h="$16" w="100%" borderRadius="$3" />
            <Skeleton h="$16" w="100%" borderRadius="$3" />
          </YStack>
        ) : null}

        {items.map((item) => (
          <NeedActionRow
            key={`${item.kind}-${item.reserveAddress}`}
            item={item}
            accountId={accountId}
            networkId={networkId}
            provider={provider}
            marketAddress={marketAddress}
            onRemove={disableCollateral}
          />
        ))}

        {check?.reasons?.length ? (
          <YStack gap="$2">
            {check.reasons.map((r) => (
              <XStack key={r} gap="$2" ai="flex-start">
                <Icon
                  name="InfoCircleOutline"
                  size="$4"
                  color="$iconSubdued"
                  mt="$0.5"
                />
                <SizableText size="$bodySm" color="$textSubdued" flex={1}>
                  {r}
                </SizableText>
              </XStack>
            ))}
          </YStack>
        ) : null}

        {!isChecking &&
        !isPending &&
        check &&
        items.length === 0 &&
        !canSwitch ? (
          <SizableText size="$bodyMd" color="$textSubdued">
            {intl.formatMessage({
              id: ETranslations.defi_emode_unavailable_desc,
            })}
          </SizableText>
        ) : null}
      </Page.Body>
      <Page.Footer
        onConfirmText={intl.formatMessage({
          id: canSwitch
            ? ETranslations.global_switch
            : ETranslations.global_done,
        })}
        confirmButtonProps={{
          disabled: canSwitch && (isChecking || isPending),
        }}
        onConfirm={() => {
          if (canSwitch) {
            void confirmSwitch();
            return;
          }
          navigation.pop();
        }}
      />
    </Page>
  );
}

function BorrowEModeNeedAction() {
  return (
    <AccountSelectorProviderMirror
      config={{ sceneName: EAccountSelectorSceneName.home, sceneUrl: '' }}
      enabledNum={[0]}
    >
      <EarnProviderMirror storeName={EJotaiContextStoreNames.earn}>
        <DiscoveryBrowserProviderMirror>
          <BorrowEModeNeedActionView />
        </DiscoveryBrowserProviderMirror>
      </EarnProviderMirror>
    </AccountSelectorProviderMirror>
  );
}

export default BorrowEModeNeedAction;
