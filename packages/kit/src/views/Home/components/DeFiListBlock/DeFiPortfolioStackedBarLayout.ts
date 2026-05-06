import type { IPortfolioSlice } from './DeFiPortfolioStats';

/**
 * Below this percent the segment color band still renders but the
 * "XX%" text is suppressed — at < 6% width the label cannot fit
 * inside the segment without bleeding into its neighbors.
 */
export const MIN_LABEL_PERCENT = 6;

export type IStackedBarSegment = {
  key: string;
  /** Percent (0-100). Used as `flexBasis: ${flexBasis}%` by the renderer. */
  flexBasis: number;
  colorToken: string;
  /** Human-facing percent label, e.g. "12.7%". */
  label: string;
  showLabel: boolean;
  /** Original slice label, exposed for tooltips. */
  sliceLabel: string;
  /** Original net worth, exposed for tooltips. */
  netWorth: number;
};

function formatPercentLabel(p: number): string {
  // One decimal place, drop trailing ".0".
  const rounded = Math.round(p * 10) / 10;
  return `${rounded}%`;
}

export function buildStackedBarSegments(
  slices: IPortfolioSlice[],
): IStackedBarSegment[] {
  return slices.map((s) => ({
    key: s.key,
    flexBasis: s.percent,
    colorToken: s.colorToken,
    label: formatPercentLabel(s.percent),
    showLabel: s.percent >= MIN_LABEL_PERCENT,
    sliceLabel: s.label,
    netWorth: s.netWorth,
  }));
}
