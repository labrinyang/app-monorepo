import { useCallback, useRef, useState } from 'react';

import { useIntl } from 'react-intl';

import { Toast } from '@onekeyhq/components';
import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import {
  useUniversalBorrowSetCollateral,
  useUniversalBorrowSetEMode,
} from '@onekeyhq/kit/src/views/Borrow/hooks/useUniversalBorrowHooks';
import { buildBorrowTag } from '@onekeyhq/kit/src/views/Staking/utils/utils';
import { ETranslations } from '@onekeyhq/shared/src/locale';
import earnUtils from '@onekeyhq/shared/src/utils/earnUtils';
import { EEarnLabels } from '@onekeyhq/shared/types/staking';
import type {
  IBorrowEModeSwitchCheck,
  IStakingInfo,
} from '@onekeyhq/shared/types/staking';

export function useEModeSwitch({
  networkId,
  accountId,
  provider,
  marketAddress,
  onSwitched,
}: {
  networkId: string;
  accountId: string;
  provider: string;
  marketAddress: string;
  onSwitched: () => void;
}) {
  const intl = useIntl();
  const [targetEModeId, setTargetEModeId] = useState<number | null>(null);
  const [check, setCheck] = useState<IBorrowEModeSwitchCheck | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  // Sequence id so an out-of-order (stale) switch-check response can never
  // overwrite the latest one; only the newest runCheck call applies state.
  const checkSeqRef = useRef(0);
  const setEMode = useUniversalBorrowSetEMode({ networkId, accountId });
  const setCollateral = useUniversalBorrowSetCollateral({
    networkId,
    accountId,
  });

  const stakingInfo = useCallback(
    (action: 'setEMode' | 'setCollateral'): IStakingInfo => ({
      label: EEarnLabels.Borrow,
      protocol: earnUtils.getEarnProviderName({ providerName: provider }),
      tags: [EEarnLabels.Borrow, buildBorrowTag({ provider, action })],
    }),
    [provider],
  );

  const runCheck = useCallback(
    async (eModeId: number) => {
      const seq = (checkSeqRef.current += 1);
      setTargetEModeId(eModeId);
      setCheck(null);
      setIsChecking(true);
      try {
        const resp =
          await backgroundApiProxy.serviceStaking.borrowSwitchCheckEMode({
            networkId,
            accountId,
            provider,
            marketAddress,
            targetEModeId: eModeId,
          });
        if (checkSeqRef.current === seq) {
          setCheck(resp.code === 0 ? resp.data : null);
        }
      } catch (error) {
        if (checkSeqRef.current === seq) {
          setCheck(null);
          Toast.error({
            title:
              error instanceof Error && error.message
                ? error.message
                : intl.formatMessage({ id: ETranslations.global_failed }),
          });
        }
      } finally {
        if (checkSeqRef.current === seq) {
          setIsChecking(false);
        }
      }
    },
    [networkId, accountId, provider, marketAddress, intl],
  );

  const confirmSwitch = useCallback(async () => {
    if (targetEModeId === null) {
      return;
    }
    await setEMode({
      provider,
      marketAddress,
      eModeId: targetEModeId,
      stakingInfo: stakingInfo('setEMode'),
      onSuccess: () => onSwitched(),
    });
  }, [
    targetEModeId,
    setEMode,
    provider,
    marketAddress,
    stakingInfo,
    onSwitched,
  ]);

  const disableCollateral = useCallback(
    async (reserveAddress: string) => {
      await setCollateral({
        provider,
        marketAddress,
        reserveAddress,
        useAsCollateral: false,
        eModeId: targetEModeId ?? undefined,
        stakingInfo: stakingInfo('setCollateral'),
        onSuccess: () => {
          if (targetEModeId !== null) {
            void runCheck(targetEModeId);
          }
        },
      });
    },
    [
      setCollateral,
      provider,
      marketAddress,
      targetEModeId,
      stakingInfo,
      runCheck,
    ],
  );

  return {
    targetEModeId,
    check,
    isChecking,
    runCheck,
    confirmSwitch,
    disableCollateral,
  };
}
