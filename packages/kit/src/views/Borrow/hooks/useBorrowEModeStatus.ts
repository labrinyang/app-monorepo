import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { usePromiseResult } from '@onekeyhq/kit/src/hooks/usePromiseResult';

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
      if (!networkId || !provider || !marketAddress || !accountId || !enabled) {
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
