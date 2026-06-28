import { useCallback, useEffect, useRef, useState } from 'react';

import backgroundApiProxy from '@onekeyhq/kit/src/background/instance/backgroundApiProxy';
import { EBorrowProviderEnum } from '@onekeyhq/shared/types/staking';

import { summarizeSwitchCheck } from './emodeUtils';

import type { IEModeRowCheck } from './emodeUtils';

const CHECKING: IEModeRowCheck = {
  isChecking: true,
  errored: false,
  itemCount: 0,
};

const ERRORED: IEModeRowCheck = {
  isChecking: false,
  errored: true,
  itemCount: 0,
};

// Approach B: run one switch-check per non-current target (the screen passes
// the target eModeIds, including the synthetic Off=0). Results stream into a
// map keyed by eModeId so each row leaves its skeleton as soon as its own
// check resolves. Replaceable by reading status.canSwitch (approach A) with
// no change to the consuming screen's button logic.
export function useBorrowEModeRowChecks({
  networkId,
  accountId,
  provider,
  marketAddress,
  targetEModeIds,
  enabled,
}: {
  networkId: string;
  accountId: string;
  provider: string;
  marketAddress: string;
  targetEModeIds: number[];
  enabled: boolean;
}): { checks: Record<number, IEModeRowCheck>; refresh: () => void } {
  const [checks, setChecks] = useState<Record<number, IEModeRowCheck>>({});
  // Generation guard: only the latest batch may write into state, so a stale
  // in-flight batch (account / market switch, or a refresh) cannot clobber
  // fresher results.
  const genRef = useRef(0);

  const targetsKey = [...targetEModeIds].toSorted((a, b) => a - b).join(',');

  const refresh = useCallback(() => {
    const ids = targetsKey ? targetsKey.split(',').map(Number) : [];
    if (
      !enabled ||
      !networkId ||
      !accountId ||
      !provider ||
      !marketAddress ||
      provider.toLowerCase() !== EBorrowProviderEnum.Aave ||
      ids.length === 0
    ) {
      genRef.current += 1;
      setChecks({});
      return;
    }
    const gen = (genRef.current += 1);
    setChecks(Object.fromEntries(ids.map((id) => [id, CHECKING])));
    ids.forEach((targetEModeId) => {
      backgroundApiProxy.serviceStaking
        .borrowSwitchCheckEMode({
          networkId,
          accountId,
          provider,
          marketAddress,
          targetEModeId,
        })
        .then((resp) => {
          if (genRef.current !== gen) {
            return;
          }
          setChecks((prev) => ({
            ...prev,
            [targetEModeId]: summarizeSwitchCheck(resp),
          }));
        })
        .catch(() => {
          if (genRef.current !== gen) {
            return;
          }
          setChecks((prev) => ({ ...prev, [targetEModeId]: ERRORED }));
        });
    });
  }, [enabled, networkId, accountId, provider, marketAddress, targetsKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { checks, refresh };
}
