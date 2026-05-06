import type { IOverviewCols } from './overviewColsResolver';

/** Bento row height. Hero (rowSpan=2) becomes 2*ROW + gap = 200px. */
export const OVERVIEW_BENTO_ROW_HEIGHT = 96;

export type IOverviewGridStyle = {
  display: 'grid';
  gridTemplateColumns: string;
  gridAutoRows: string;
  gridAutoFlow: 'dense';
};

export function buildOverviewGridStyle(
  cols: IOverviewCols,
): IOverviewGridStyle {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gridAutoRows: `${OVERVIEW_BENTO_ROW_HEIGHT}px`,
    // dense lets the hero (2x2) coexist with smaller cells filling holes
    // around it without leaving gaps in the bento.
    gridAutoFlow: 'dense',
  } as IOverviewGridStyle;
}
