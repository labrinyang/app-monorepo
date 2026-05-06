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
