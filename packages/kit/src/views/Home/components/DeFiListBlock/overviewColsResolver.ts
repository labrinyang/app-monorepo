export type IOverviewCols = 4 | 5 | 6;

export type IOverviewMediaFlags = {
  gtXl?: boolean;
  gtLg?: boolean;
  gtMd?: boolean;
};

/**
 * Map Tamagui media flags to the tile-grid column count.
 *
 *   gtXl (>=1280)  -> 6
 *   gtLg (>=1024)  -> 5
 *   gtMd (>=768)   -> 4
 *   below gtMd     -> 4 (defensive; the DeFi tableLayout branch
 *                       already gates everything behind gtMd)
 */
export function resolveOverviewCols(media: IOverviewMediaFlags): IOverviewCols {
  if (media.gtXl) return 6;
  if (media.gtLg) return 5;
  return 4;
}
