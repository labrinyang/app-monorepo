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
    selected: currentId === 0,
    isOff: true,
  };
  const categoryRows: IEModeRow[] = (status.categories ?? []).map((c) => ({
    eModeId: c.eModeId,
    label: c.label,
    ltv: c.ltv,
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
  canSwitch?: boolean;
}

// Collapse a switch-check response into the row-check summary the button reads.
// A null / non-zero code / missing data response yields no canSwitch, so the row
// falls through to Need Action (its detail screen re-checks). `canSwitch` is the
// only field the button needs beyond `isChecking`.
export function summarizeSwitchCheck(
  resp: { code: number; data: IBorrowEModeSwitchCheck | null } | null,
): IEModeRowCheck {
  if (!resp || resp.code !== 0 || !resp.data) {
    return { isChecking: false };
  }
  return { isChecking: false, canSwitch: resp.data.canSwitch };
}

export type IEModeRowAction = 'current' | 'switch' | 'needAction' | 'loading';

// Per-row trailing control on the e-mode switch list.
//
// `canSwitch` (from switch-check) is the ONLY switch / need-action signal:
//   true => Switch; false / errored / unknown => Need Action (the detail screen
//   re-checks and surfaces the blockers, or lets the user proceed). `loading`
//   shows while the row's check is in flight; `current` is the active row.
//
// `disabled` (from status) is intentionally NOT used: it is account-derived and
// unreliable — verified live that an account with every category `disabled`
// still returned canSwitch:true on the one category matching its positions, and
// an on-chain simulation CONFIRMED that switch succeeds. switch-check tracks the
// chain; `disabled` does not. Do NOT reinstate a `disabled` gate: the build step
// can still 70110 a canSwitch:true category, but that is a backend
// switch-check-vs-build bug, not a real chain restriction.
//
// Approach A: when status returns canSwitch per category, feed it here and drop
// the per-row checks — this mapping is unchanged.
export function getEModeRowAction(input: {
  selected: boolean;
  isChecking: boolean;
  canSwitch?: boolean;
}): IEModeRowAction {
  if (input.selected) {
    return 'current';
  }
  if (input.isChecking) {
    return 'loading';
  }
  return input.canSwitch === true ? 'switch' : 'needAction';
}
