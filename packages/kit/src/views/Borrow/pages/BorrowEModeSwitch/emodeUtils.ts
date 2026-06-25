import type { IBorrowEModeStatus } from '@onekeyhq/shared/types/staking';

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
