import type { IOverviewCols } from './overviewColsResolver';

/** Bento row height. Hero (rowSpan=2) becomes 2*ROW + gap = 200px. */
export const OVERVIEW_BENTO_ROW_HEIGHT = 96;

/**
 * Triple-layered card shadow shared with ProtocolRow / RichBlockContent.
 * Defines the OneKey "card row" elevation language. Web-only (boxShadow);
 * native uses a hairline border for visual parity (see Token sizes scale
 * for ratio).
 */
export const OVERVIEW_TILE_SHADOW =
  '0 0 0 1px rgba(0, 0, 0, 0.04), 0 0 2px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';

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
