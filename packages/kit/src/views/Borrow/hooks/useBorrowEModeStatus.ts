import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { usePromiseResult } from '@onekeyhq/kit/src/hooks/usePromiseResult';
import { EBorrowProviderEnum } from '@onekeyhq/shared/types/staking';

interface IUseBorrowEModeStatusParams {
  networkId?: string;
  provider?: string;
  marketAddress?: string;
  accountId?: string;
  enabled?: boolean;
}

export const useBorrowEModeStatus = ({
  networkId,
  provider,
  marketAddress,
  accountId,
  enabled = true,
}: IUseBorrowEModeStatusParams) => {
  const {
    result: eModeStatus,
    run,
    isLoading,
  } = usePromiseResult(
    async () => {
      // e-mode is an Aave-only feature; never query it for other providers
      // (e.g. Kamino), which the backend rejects with "not implemented".
      if (
        !networkId ||
        !provider ||
        !marketAddress ||
        !accountId ||
        !enabled ||
        provider.toLowerCase() !== EBorrowProviderEnum.Aave
      ) {
        return null;
      }
      return backgroundApiProxy.serviceStaking.getBorrowEModeStatus({
        networkId,
        provider,
        marketAddress,
        accountId,
      });
    },
    [networkId, provider, marketAddress, accountId, enabled],
    {
      initResult: null,
      watchLoading: true,
      alwaysSetState: true,
      checkIsFocused: true,
      revalidateOnFocus: true,
    },
  );

  return { eModeStatus, isLoading, refresh: run };
};
