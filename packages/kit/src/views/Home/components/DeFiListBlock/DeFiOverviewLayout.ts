import type { IOverviewCols } from './overviewColsResolver';

export type IOverviewGridStyle = {
  display: 'grid';
  gridTemplateColumns: string;
};

export function buildOverviewGridStyle(
  cols: IOverviewCols,
): IOverviewGridStyle {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
  } as IOverviewGridStyle;
}

/**
 * @deprecated Pre-cols-aware constant. Will be removed once
 * `DeFiOverviewCard` (the only remaining caller) is replaced by
 * `DeFiOverviewGrid` in a later task.
 *
 * Cast through `unknown` to preserve the original `as any` escape hatch the
 * existing `$gtMd={OVERVIEW_GRID_STYLE}` call site relies on, without
 * spreading `any` into new code.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const OVERVIEW_GRID_STYLE = buildOverviewGridStyle(4) as unknown as any;
