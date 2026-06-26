import type {
  IBorrowEModeBlockerAsset,
  IBorrowEModeStatus,
  IBorrowEModeSwitchCheck,
  IEarnText,
} from '@onekeyhq/shared/types/staking';

export interface IEModeRow {
  eModeId: number; // 0 = off
  label: string;
  ltv?: string;
  disabled: boolean;
  selected: boolean;
  isOff: boolean;
}

export function buildEModeRows(
  status: IBorrowEModeStatus | null | undefined,
  offLabel: string,
): IEModeRow[] {
  if (!status) {
    return [];
  }
  const currentId = status.eModeId ?? 0;
  const offRow: IEModeRow = {
    eModeId: 0,
    label: offLabel,
    disabled: false,
    selected: currentId === 0,
    isOff: true,
  };
  const categoryRows: IEModeRow[] = (status.categories ?? []).map((c) => ({
    eModeId: c.eModeId,
    label: c.label,
    ltv: c.ltv,
    disabled: c.disabled,
    selected: currentId === c.eModeId,
    isOff: false,
  }));
  return [offRow, ...categoryRows];
}

export interface IEModeNeedActionItem {
  kind: 'repay' | 'removeCollateral';
  reserveAddress: string;
  symbol: string;
  logoURI?: string;
  amount?: IEarnText; // server-formatted, e.g. "Borrowed 100 USDC"
}

export function buildNeedActionItems(
  check: IBorrowEModeSwitchCheck | null | undefined,
): IEModeNeedActionItem[] {
  if (!check) {
    return [];
  }
  // Server only guarantees `reasons`; the blocker arrays may be absent, so
  // default every one with `?? []`. When absent this returns [] and the
  // Need Action screen falls back to the reasons[] prose.
  const toRepay = (a: IBorrowEModeBlockerAsset): IEModeNeedActionItem => ({
    kind: 'repay',
    reserveAddress: a.reserveAddress,
    symbol: a.token.symbol,
    logoURI: a.token.logoURI,
    amount: a.borrowed?.title,
  });
  const toRemoveCollateral = (
    a: IBorrowEModeBlockerAsset,
  ): IEModeNeedActionItem => ({
    kind: 'removeCollateral',
    reserveAddress: a.reserveAddress,
    symbol: a.token.symbol,
    logoURI: a.token.logoURI,
    amount: a.supplied?.title,
  });
  return [
    ...(check.repayAssets ?? []).map(toRepay),
    ...(check.additionalRepayAssets ?? []).map(toRepay),
    ...(check.disableCollateralAssets ?? []).map(toRemoveCollateral),
  ];
}
