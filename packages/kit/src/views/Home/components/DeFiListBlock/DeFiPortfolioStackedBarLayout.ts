import { PORTFOLIO_OTHERS_TOKEN } from './DeFiPortfolioPalette';

import type { IPortfolioSlice } from './DeFiPortfolioStats';

/**
 * Below this percent the segment color band still renders, but the
 * "XX%" text is suppressed inside the bar. The tooltip carries the
 * precise value for every segment regardless.
 *
 * Why 10%: matches the Mantine "graceful threshold" convention. 5-10%
 * is the documented industry range; 10% is the upper bound on
 * dashboards. At our 24px height + integer-percent labels, slices
 * below 10% fight to fit the label and the result reads as cluttered
 * rather than informative. Small slices defer to hover.
 */
export const MIN_LABEL_PERCENT = 10;

const JEWEL_LABEL_COLOR_TOKEN = '$whiteA12';
/**
 * White on $neutral6 (Others) fails contrast on light theme. Route
 * Others to the theme-aware neutral text token so the label stays
 * readable while still reading as visually subordinate.
 */
const NEUTRAL_LABEL_COLOR_TOKEN = '$textSubdued';

export type IStackedBarSegment = {
  key: string;
  /** 0..100. Used as `flexBasis: ${flexBasis}%` by the renderer; also
   * the source of truth for the tooltip's one-decimal percent string. */
  flexBasis: number;
  colorToken: string;
  /** Token for the in-segment label text. Differs for Others to
   * preserve contrast on the neutral background. */
  labelColorToken: string;
  /** Integer-percent label for in-bar use, e.g. "13%". Tooltip uses
   * one-decimal precision via formatPortfolioPercent instead. */
  label: string;
  showLabel: boolean;
  /** Source slice label, exposed for tooltips. */
  sliceLabel: string;
  /** Source net worth, exposed for tooltips. */
  netWorth: number;
  /** Network IDs the protocol spans. Tooltip surfaces multi-chain
   * logos when length > 1; transparent in single-chain contexts. */
  networkIds: string[];
};

function formatInlinePercentLabel(p: number): string {
  // Integer percent for in-bar density. The tooltip carries the
  // one-decimal precision.
  return `${Math.round(p)}%`;
}

function resolveLabelColorToken(colorToken: string): string {
  return colorToken === PORTFOLIO_OTHERS_TOKEN
    ? NEUTRAL_LABEL_COLOR_TOKEN
    : JEWEL_LABEL_COLOR_TOKEN;
}

export function buildStackedBarSegments(
  slices: IPortfolioSlice[],
): IStackedBarSegment[] {
  return slices.map((s) => ({
    key: s.key,
    flexBasis: s.percent,
    colorToken: s.colorToken,
    labelColorToken: resolveLabelColorToken(s.colorToken),
    label: formatInlinePercentLabel(s.percent),
    showLabel: s.percent >= MIN_LABEL_PERCENT,
    sliceLabel: s.label,
    netWorth: s.netWorth,
    networkIds: s.networkIds,
  }));
}
