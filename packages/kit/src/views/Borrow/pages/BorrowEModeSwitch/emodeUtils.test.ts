import type {
  IBorrowEModeBlockerAsset,
  IBorrowEModeSwitchCheck,
} from '@onekeyhq/shared/types/staking';

import {
  buildEModeRows,
  buildNeedActionItems,
  getEModeRowAction,
  summarizeSwitchCheck,
} from './emodeUtils';

const status = {
  eModeId: 1,
  originalLtv: '80',
  categories: [
    {
      eModeId: 1,
      label: 'ETH correlated',
      ltv: '93',
      disabled: false,
      assets: [],
    },
    { eModeId: 2, label: 'Stablecoins', ltv: '95', disabled: true, assets: [] },
  ],
};

describe('buildEModeRows', () => {
  it('returns [] for null status', () => {
    expect(buildEModeRows(null, 'Off')).toEqual([]);
  });

  it('prepends an Off row and marks the current category selected', () => {
    const rows = buildEModeRows(status, 'Off');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      eModeId: 0,
      isOff: true,
      selected: false,
      disabled: false,
    });
    expect(rows[1]).toMatchObject({
      eModeId: 1,
      label: 'ETH correlated',
      ltv: '93',
      selected: true,
    });
    expect(rows[2]).toMatchObject({
      eModeId: 2,
      disabled: true,
      selected: false,
    });
  });

  it('marks Off selected when eModeId is 0', () => {
    const rows = buildEModeRows({ ...status, eModeId: 0 }, 'Off');
    expect(rows[0].selected).toBe(true);
    expect(rows.some((r) => !r.isOff && r.selected)).toBe(false);
  });
});

const blocker = (symbol: string, addr: string): IBorrowEModeBlockerAsset =>
  ({
    reserveAddress: addr,
    token: { symbol, logoURI: `logo-${symbol}` },
    borrowed: { title: { text: `Borrowed ${symbol}` }, number: '1' },
    supplied: { title: { text: `Supplied ${symbol}` }, number: '1' },
  }) as unknown as IBorrowEModeBlockerAsset;

describe('buildNeedActionItems', () => {
  it('returns [] for null/undefined check', () => {
    expect(buildNeedActionItems(null)).toEqual([]);
    expect(buildNeedActionItems(undefined)).toEqual([]);
  });

  it('does not throw when blocker arrays are absent (server only sends reasons)', () => {
    const check = {
      canSwitch: false,
      reasons: ['x'],
    } as unknown as IBorrowEModeSwitchCheck;
    expect(buildNeedActionItems(check)).toEqual([]);
  });

  it('maps repay + additionalRepay to repay items and collateral to removeCollateral', () => {
    const check = {
      canSwitch: false,
      reasons: [],
      repayAssets: [blocker('USDC', '0xusdc')],
      additionalRepayAssets: [blocker('DAI', '0xdai')],
      disableCollateralAssets: [blocker('ETH', '0xeth')],
    } as unknown as IBorrowEModeSwitchCheck;
    const items = buildNeedActionItems(check);
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      kind: 'repay',
      symbol: 'USDC',
      reserveAddress: '0xusdc',
      logoURI: 'logo-USDC',
    });
    expect(items[1]).toMatchObject({ kind: 'repay', symbol: 'DAI' });
    expect(items[2]).toMatchObject({
      kind: 'removeCollateral',
      symbol: 'ETH',
      reserveAddress: '0xeth',
    });
    expect(items[0].amount).toEqual({ text: 'Borrowed USDC' });
    expect(items[2].amount).toEqual({ text: 'Supplied ETH' });
  });
});

describe('getEModeRowAction', () => {
  const base = {
    selected: false,
    disabled: false,
    isChecking: false,
    errored: false,
    itemCount: 0,
  };

  it('selected wins over everything', () => {
    expect(
      getEModeRowAction({ ...base, selected: true, isChecking: true }),
    ).toBe('current');
  });

  it('disabled (not selectable) => unavailable', () => {
    expect(getEModeRowAction({ ...base, disabled: true })).toBe('unavailable');
  });

  it('disabled beats canSwitch:true => unavailable (the 70110 case)', () => {
    expect(
      getEModeRowAction({ ...base, disabled: true, canSwitch: true }),
    ).toBe('unavailable');
  });

  it('in-flight check => loading', () => {
    expect(getEModeRowAction({ ...base, isChecking: true })).toBe('loading');
  });

  it('errored check => unavailable', () => {
    expect(getEModeRowAction({ ...base, errored: true })).toBe('unavailable');
  });

  it('canSwitch true => switch', () => {
    expect(getEModeRowAction({ ...base, canSwitch: true })).toBe('switch');
  });

  it('canSwitch false with blockers => needAction', () => {
    expect(getEModeRowAction({ ...base, canSwitch: false, itemCount: 2 })).toBe(
      'needAction',
    );
  });

  it('canSwitch false with no blockers => unavailable', () => {
    expect(getEModeRowAction({ ...base, canSwitch: false, itemCount: 0 })).toBe(
      'unavailable',
    );
  });

  it('canSwitch unknown (no value) => unavailable', () => {
    expect(getEModeRowAction({ ...base })).toBe('unavailable');
  });
});

describe('summarizeSwitchCheck', () => {
  const okData: IBorrowEModeSwitchCheck = {
    canSwitch: false,
    reasons: ['x'],
    repayAssets: [],
    additionalRepayAssets: [
      {
        reserveAddress: '0xusdc',
        token: {
          address: '0xusdc',
          name: 'USD Coin',
          symbol: 'USDC',
          decimals: 6,
          logoURI: '',
        },
      } as any,
    ],
    disableCollateralAssets: [],
    collateral: {} as any,
    debt: {} as any,
    maxLtv: {} as any,
    healthFactor: {} as any,
  };

  it('null response => errored', () => {
    expect(summarizeSwitchCheck(null)).toEqual({
      isChecking: false,
      errored: true,
      itemCount: 0,
    });
  });

  it('non-zero code => errored', () => {
    expect(summarizeSwitchCheck({ code: 70_014, data: null })).toEqual({
      isChecking: false,
      errored: true,
      itemCount: 0,
    });
  });

  it('zero code with null data => errored', () => {
    expect(summarizeSwitchCheck({ code: 0, data: null })).toEqual({
      isChecking: false,
      errored: true,
      itemCount: 0,
    });
  });

  it('ok response => canSwitch + blocker count', () => {
    expect(summarizeSwitchCheck({ code: 0, data: okData })).toEqual({
      isChecking: false,
      errored: false,
      canSwitch: false,
      itemCount: 1,
    });
  });
});

describe('buildEModeRows canSwitch passthrough', () => {
  it('carries canSwitch from category to row', () => {
    const rows = buildEModeRows(
      {
        eModeId: 0,
        originalLtv: '80',
        categories: [
          {
            eModeId: 7,
            label: 'Z',
            ltv: '70',
            disabled: false,
            canSwitch: false,
            assets: [],
          },
        ],
      },
      'Off',
    );
    expect(rows.find((r) => r.eModeId === 7)?.canSwitch).toBe(false);
  });
});
