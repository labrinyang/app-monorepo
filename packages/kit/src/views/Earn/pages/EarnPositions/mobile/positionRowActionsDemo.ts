import { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { useIntl } from 'react-intl';

import { ETranslations } from '@onekeyhq/shared/src/locale';
import type {
  IEarnPortfolioPosition,
  IEarnPortfolioPositionsResponse,
  IEarnPositionRewardAsset,
} from '@onekeyhq/shared/types/earn/portfolioPositions';

import { buildEarnPortfolioView } from './earnPositionModel';
import {
  ACCRUING_TOOLTIP,
  CANCEL_BUTTON,
  EARN_PORTFOLIO_POSITIONS_FIXTURE,
  token,
} from './earnPositionModel.fixtures';
import { canRedeemFromCard } from './myPortfolio.utils';
import demoData from './positionRowActionsDemo.data.json';

import type { IEarnPositionView } from './earnPositionModel';

/**
 * Product demo (10-14): row actions on the phone position card, and the
 * detail page's Portfolio tab reusing the card. With this on, My portfolio
 * and the detail page read the fixed dataset below instead of the account's
 * positions, so the design can be reviewed with `yarn app:web` and no
 * wallet. The dataset is the unit-test fixture (every row state, including
 * Native's Cancel) plus Spark and Bitway as the test API returned them for
 * the demo address. Turn it off before anything ships.
 */
export const DEMO_POSITION_ROW_ACTIONS: boolean = true;

const DAY_MS = 24 * 60 * 60 * 1000;

type IDemoData = {
  tokenLogos: Record<string, string>;
  protocolLogos: Record<string, string>;
  response: IEarnPortfolioPositionsResponse;
};

const DEMO_DATA = demoData as unknown as IDemoData;

/**
 * Spark's pending USDT reward: the detail page lists it, the positions API
 * does not send it yet (backend request), so the demo adds it the way the
 * detail page shows it.
 */
const SPARK_PENDING_REWARDS: Record<string, string> = {
  USDC: '0.01053',
  USDT: '0.000483',
};

/**
 * Spark's Effective APY, as the detail page's My investment showed it for
 * the demo address on 10-14; the positions API has no field for it.
 */
const SPARK_EFFECTIVE_APY: Record<string, string> = {
  USDC: '23.48%',
  USDT: '23.56%',
};

/**
 * Logos for the unit-test fixture's tokens the saved responses do not carry.
 * A PT shows its underlying's logo, the way the server sends PT-sUSDe.
 */
const EXTRA_TOKEN_LOGOS: Record<string, string> = {
  WETH: 'https://uni.onekey-asset.com/server-service-indexer/evm--1/tokens/address-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
  MORPHO:
    'https://coin-images.coingecko.com/coins/images/29837/large/Morpho-token-icon.png',
  SOL: 'https://uni.onekey-asset.com/static/chain/sol.png',
  'PT-USD3':
    'https://uni.onekey-asset.com/server-service-indexer/evm--1/tokens/address-0x0d86883faf4ffd7aeb116390af37746f45b6f378.png',
};

const EXTRA_PROTOCOL_LOGOS: Record<string, string> = {
  native: 'https://uni.onekey-asset.com/static/logo/native.png',
};

function withRealLogo<
  T extends { symbol: string; meta?: { logoUrl?: string } },
>(asset: T): T {
  const logoUrl =
    DEMO_DATA.tokenLogos[asset.symbol] ?? EXTRA_TOKEN_LOGOS[asset.symbol];
  if (!logoUrl || !asset.meta?.logoUrl?.startsWith('https://logo/')) {
    return asset;
  }
  return { ...asset, meta: { ...asset.meta, logoUrl } };
}

/**
 * A Rewards panel mixing states, the way Morpho's Katana market reads on
 * the test API (KAT claimable next to KAT still accruing): the loan card's
 * MORPHO and KAT claims get a pending KAT row under them.
 */
function morphoLoanPendingReward(
  position: IEarnPortfolioPosition,
): IEarnPositionRewardAsset[] {
  if (position.groupId !== 'morpho:evm--1:market:weth-usdc') {
    return [];
  }
  return [
    {
      ...withRealLogo(
        token({
          symbol: 'KAT',
          amount: '0.04976',
          price: 0.05,
          category: 'reward',
        }),
      ),
      status: 'pending',
      tooltip: ACCRUING_TOOLTIP,
    },
  ];
}

function sparkPendingReward(
  position: IEarnPortfolioPosition,
): IEarnPositionRewardAsset[] {
  const amount = SPARK_PENDING_REWARDS[position.earn.manage.symbol];
  if (position.protocol !== 'spark' || !amount) {
    return [];
  }
  return [
    {
      symbol: 'USDT',
      address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      amount,
      price: 1,
      value: new BigNumber(amount).toNumber(),
      category: 'reward',
      meta: {
        decimals: 6,
        logoUrl: DEMO_DATA.tokenLogos.USDT ?? '',
        isVerified: true,
      },
      status: 'pending',
    },
  ];
}

/**
 * Bitway's normal unstake can be called back while it waits (the detail
 * page's own tip: "cancellable while pending"), but neither the positions
 * API nor the detail page sends the Cancel yet (backend request), so the
 * demo gives each Bitway withdrawal the Cancel Native's comes with.
 */
function bitwayCancel(
  position: IEarnPortfolioPosition,
): Partial<IEarnPortfolioPosition['earn']> {
  if (position.protocol !== 'bitway' || !position.earn.unstaking) {
    return {};
  }
  return { action: 'cancel', cancel: CANCEL_BUTTON };
}

type ITranslate = (id: ETranslations) => string;

/**
 * The server sends its button labels in the request's language; the saved
 * data is English, so the demo puts them in the app's language.
 */
const SERVER_BUTTON_LABELS: Record<string, ETranslations> = {
  Claim: ETranslations.earn_claim,
  Cancel: ETranslations.global_cancel,
  Check: ETranslations.global_check,
};

/** Any server button (a `type`, its `text` and `disabled`), wherever it sits. */
function localizeButtonLabels(value: unknown, translate: ITranslate): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => localizeButtonLabels(entry, translate));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const button = value as { type?: unknown; text?: { text?: unknown } };
  const label = button.text?.text;
  const id =
    button.type !== undefined && typeof label === 'string'
      ? SERVER_BUTTON_LABELS[label]
      : undefined;
  if (id) {
    return { ...button, text: { ...button.text, text: translate(id) } };
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      localizeButtonLabels(entry, translate),
    ]),
  );
}

/**
 * The fixture's holdings come without 24h earnings; give each the day's
 * share of a 3% year so the detail page does not read $0.00 on $15,907.
 */
function withDemoEarnings24h(
  position: IEarnPortfolioPosition,
): IEarnPortfolioPosition['earn'] {
  const { investment } = position.earn;
  if (!new BigNumber(investment.earnings24hFiatValue || '0').isZero()) {
    return position.earn;
  }
  return {
    ...position.earn,
    investment: {
      ...investment,
      earnings24hFiatValue: new BigNumber(investment.totalFiatValue || '0')
        .times(0.03)
        .div(365)
        .toFixed(),
    },
  };
}

function buildDemoResponse(
  translate: ITranslate,
): IEarnPortfolioPositionsResponse {
  const now = Date.now();
  let unlockIndex = 0;
  const positions: IEarnPortfolioPositionsResponse['positions'] = {};
  const append = (networkId: string, list: IEarnPortfolioPosition[]) => {
    (positions[networkId] ??= []).push(...list);
  };
  Object.entries(EARN_PORTFOLIO_POSITIONS_FIXTURE.positions).forEach(
    ([networkId, list]) => append(networkId, list),
  );
  Object.entries(DEMO_DATA.response.positions).forEach(([networkId, list]) =>
    append(networkId, list),
  );
  Object.keys(positions).forEach((networkId) => {
    positions[networkId] = positions[networkId].map((position) => {
      const { unstaking } = position.earn;
      // The fixture's withdrawals are dated in the past; keep every one of
      // them a few days out so the rows show their days left.
      let shiftedUnstaking = {};
      if (unstaking?.unlockAt) {
        shiftedUnstaking = {
          unstaking: {
            unlockAt: now + (2 + 3 * unlockIndex) * DAY_MS + DAY_MS / 2,
          },
        };
        unlockIndex += 1;
      }
      return {
        ...position,
        assets: position.assets.map(withRealLogo),
        debts: position.debts.map(withRealLogo),
        rewards: [
          ...position.rewards.map(withRealLogo),
          ...sparkPendingReward(position),
          ...morphoLoanPendingReward(position),
        ],
        earn: {
          ...withDemoEarnings24h(position),
          ...shiftedUnstaking,
          ...bitwayCancel(position),
        },
      };
    });
    positions[networkId] = localizeButtonLabels(
      positions[networkId],
      translate,
    ) as IEarnPortfolioPosition[];
  });
  const protocolSummaries = [
    ...EARN_PORTFOLIO_POSITIONS_FIXTURE.protocolSummaries,
    ...DEMO_DATA.response.protocolSummaries,
  ].map((summary) => ({
    ...summary,
    protocolLogo:
      summary.protocolLogo ||
      DEMO_DATA.protocolLogos[summary.protocol] ||
      EXTRA_PROTOCOL_LOGOS[summary.protocol] ||
      '',
  }));
  return { positions, protocolSummaries, errors: [] };
}

const demoResponses = new Map<string, IEarnPortfolioPositionsResponse>();

/** The demo dataset in the app's language, built once per language. */
export function getDemoPositionsResponse({
  locale,
  translate,
}: {
  locale: string;
  translate: ITranslate;
}): IEarnPortfolioPositionsResponse {
  let response = demoResponses.get(locale);
  if (!response) {
    response = buildDemoResponse(translate);
    demoResponses.set(locale, response);
  }
  return response;
}

/**
 * The holding a detail page shows on its Portfolio tab: the card whose
 * detail page this is (network, provider, symbol, vault). Production reads
 * the same positions for the page's network and provider.
 */
export function useDemoPagePosition({
  networkId,
  provider,
  symbol,
  vault,
}: {
  networkId: string;
  provider: string;
  symbol: string;
  vault?: string;
}): IEarnPositionView | undefined {
  const intl = useIntl();
  const translate = useCallback(
    (id: ETranslations) => intl.formatMessage({ id }),
    [intl],
  );
  return useMemo(() => {
    if (!DEMO_POSITION_ROW_ACTIONS) {
      return undefined;
    }
    const view = buildEarnPortfolioView({
      response: getDemoPositionsResponse({ locale: intl.locale, translate }),
      translate,
    });
    return view.protocols
      .flatMap((protocol) => protocol.positions)
      .find(({ action }) => {
        const target = action?.target;
        return (
          target?.networkId === networkId &&
          target.provider.toLowerCase() === provider.toLowerCase() &&
          target.symbol === symbol &&
          (target.vault ?? '').toLowerCase() === (vault ?? '').toLowerCase()
        );
      });
  }, [networkId, provider, symbol, vault, translate, intl.locale]);
}

/**
 * Whether the detail page can redeem the holding, for its footer and its
 * deposit rows. The web preview's account holds none of the demo positions,
 * so the server answers that nothing can be redeemed and the footer's Redeem
 * greys out; the demo asks the card's rule instead. Production keeps the
 * server's answer: for the test address's real holdings it matched the
 * card's rule (checked 10-14: Lido, Morpho, Spark, Bitway and Lista redeem;
 * Ethena USDe does not). Pendle's footer sells rather than redeems and does
 * not read this.
 */
export function getDemoPageCanRedeem(
  position: IEarnPositionView | undefined,
): boolean | undefined {
  if (!DEMO_POSITION_ROW_ACTIONS || !position) {
    return undefined;
  }
  return position.sections.some(
    (section) =>
      section.kind === 'deposited' &&
      section.assets.some((asset) => canRedeemFromCard(asset.origin)),
  );
}

/** Cells the server would add to My investment for this holding (Spark's Effective APY). */
export function getDemoInvestmentCells(
  position: IEarnPositionView,
  locale: string,
): { title: string; value: string }[] {
  const { manage } = position.source.earn;
  const apy =
    position.source.protocol === 'spark'
      ? SPARK_EFFECTIVE_APY[manage.symbol]
      : undefined;
  if (!apy) {
    return [];
  }
  return [
    {
      title: locale.startsWith('zh') ? '有效 APY' : 'Effective APY',
      value: apy,
    },
  ];
}
