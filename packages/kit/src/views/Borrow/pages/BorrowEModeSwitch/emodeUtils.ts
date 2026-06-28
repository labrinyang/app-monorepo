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
  canSwitch?: boolean;
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
    canSwitch: c.canSwitch,
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

export interface IEModeRowCheck {
  isChecking: boolean;
  errored: boolean;
  canSwitch?: boolean;
  itemCount: number;
}

// Collapse a switch-check response into the minimal facts the row button
// needs. A null / non-zero code / missing data response is treated as
// errored (the row renders as Unavailable rather than a dead-end action).
export function summarizeSwitchCheck(
  resp: { code: number; data: IBorrowEModeSwitchCheck | null } | null,
): IEModeRowCheck {
  if (!resp || resp.code !== 0 || !resp.data) {
    return { isChecking: false, errored: true, itemCount: 0 };
  }
  return {
    isChecking: false,
    errored: false,
    canSwitch: resp.data.canSwitch,
    itemCount: buildNeedActionItems(resp.data).length,
  };
}

export type IEModeRowAction =
  | 'current'
  | 'switch'
  | 'needAction'
  | 'unavailable'
  | 'loading';

// Drives the per-row trailing control on the e-mode switch list. Driven by
// the real switch-check result (approach B), NOT by status.disabled (which
// only means "selectable" and proved an unreliable proxy). When the backend
// later returns canSwitch per category in the status response (approach A),
// feed category.canSwitch + 0 itemCount here and stop running per-row
// checks — this mapping is unchanged.
export function getEModeRowAction(input: {
  selected: boolean;
  isChecking: boolean;
  errored: boolean;
  canSwitch?: boolean;
  itemCount: number;
}): IEModeRowAction {
  if (input.selected) {
    return 'current';
  }
  if (input.isChecking) {
    return 'loading';
  }
  if (input.errored) {
    return 'unavailable';
  }
  if (input.canSwitch === true) {
    return 'switch';
  }
  if (input.canSwitch === false && input.itemCount > 0) {
    return 'needAction';
  }
  // canSwitch:false with no actionable blockers, or unknown => not switchable.
  return 'unavailable';
}
