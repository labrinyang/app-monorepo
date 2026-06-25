import { buildEModeRows } from './emodeUtils';

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
