import { useCallback, useMemo } from 'react';

import {
  BlurView,
  Carousel,
  Image,
  InnerStroke,
  SizableText,
  Skeleton,
  Stack,
  XStack,
  YStack,
} from '@onekeyhq/components';
import { openUrlExternal } from '@onekeyhq/shared/src/utils/openUrlUtils';
import type { IEarnPageBannerListItem } from '@onekeyhq/shared/types/earn';

import {
  handleDeepLinkUrl,
  tryHandleOneKeyUniversalLink,
} from '../../../routes/config/deeplink';
import { EarnTestIDs } from '../testIDs';

const BANNER_HEIGHT = 200;
// Figma bar height (56). A size token rather than a raw number so it tracks the
// Android UI scale that the icon and padding inside the bar already follow.
const BANNER_INFO_HEIGHT = '$14';
// Figma: 10px between the card bottom edge and the pagination dots.
const BANNER_PAGINATION_GAP = 10;
// The card shadow (offset 2 + radius 4) bleeds ~6px below the card and the
// Carousel viewport clips it, so the viewport reserves this much extra height
// and the dot gap is reduced by the same amount to keep the designed spacing.
// Keep this below BANNER_PAGINATION_GAP or the dots' margin goes negative.
const BANNER_SHADOW_BLEED = 8;
// Figma "Section - Banner" is 232 tall: 200 card + 10 dot gap + 6 dots ($1.5)
// + 16 bottom padding.
const BANNER_SECTION_HEIGHT = 232;
// 与管理后台 BannerPreview 的 text-shadow 对齐，保证深浅底图都可读
const BANNER_IMAGE_COPY_SHADOW = {
  textShadowColor: 'rgba(0,0,0,0.45)',
  textShadowRadius: 4,
  textShadowOffset: { width: 0, height: 1 },
} as const;
// Figma 默认文字色（双兜底：优先服务端下发的配置色，缺省回退这里）
const BANNER_DEFAULT_COLORS = {
  imageTitle: 'rgba(0,0,0,0.88)',
  imageSubtitle: 'rgba(0,0,0,0.61)',
  title: 'rgba(0,0,0,0.88)',
  subtitle: 'rgba(0,0,0,0.61)',
} as const;

function EarnHomeBannerItem({ item }: { item: IEarnPageBannerListItem }) {
  const handlePress = useCallback(async () => {
    if (!item.href) {
      return;
    }
    // 官方 universal link (如 earn 详情页 URL) 优先原生内跳，即使运营把
    // hrefType 配成了 external 也不该弹网页 (产品反馈)
    if (await tryHandleOneKeyUniversalLink(item.href)) {
      return;
    }
    if (item.hrefType === 'external') {
      void openUrlExternal(item.href);
      return;
    }
    handleDeepLinkUrl({ url: item.href });
  }, [item.href, item.hrefType]);

  const hasImageCopy = Boolean(item.imageTitle || item.imageSubtitle);

  return (
    // 外层承载向下投影 (产品反馈)：iOS 上 overflow:hidden 会裁掉自身阴影，
    // 所以阴影放 wrapper、内层负责圆角裁切
    <YStack
      h={BANNER_HEIGHT}
      borderRadius="$3"
      borderCurve="continuous"
      bg="$bgApp"
      shadowColor="$shadowColor"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.12}
      shadowRadius={4}
    >
      <YStack
        testID={EarnTestIDs.bannerItem(item.bannerId)}
        flex={1}
        borderRadius="$3"
        borderCurve="continuous"
        overflow="hidden"
        bg="$bgApp"
      >
        {/* 背景图全幅铺满 (OK-58503：底条悬浮在图片上，不再上下切分) */}
        <YStack position="absolute" top={0} right={0} left={0} bottom={0}>
          <Image
            w="100%"
            h="100%"
            src={item.backgroundImage}
            resizeMode="cover"
            skeleton={<Stack w="100%" h="100%" bg="$bgSubdued" />}
          />
        </YStack>
        <Stack flex={1} />
        {/* 图片左下 campaign 文案。多语言长文案：限行 + 换行，不溢出卡片。
          颜色双兜底：优先管理后台配置色，缺省回退 Figma 默认深色；
          轻阴影提升深浅底图的可读性 (OK-58503)。 */}
        {hasImageCopy ? (
          <YStack px="$3" pb="$3" gap="$1" pr="$8">
            {item.imageTitle ? (
              <SizableText
                size="$headingXl"
                color={item.imageTitleColor || BANNER_DEFAULT_COLORS.imageTitle}
                numberOfLines={2}
                style={BANNER_IMAGE_COPY_SHADOW}
              >
                {item.imageTitle}
              </SizableText>
            ) : null}
            {item.imageSubtitle ? (
              <SizableText
                size="$bodyLg"
                color={
                  item.imageSubtitleColor || BANNER_DEFAULT_COLORS.imageSubtitle
                }
                numberOfLines={1}
                style={BANNER_IMAGE_COPY_SHADOW}
              >
                {item.imageSubtitle}
              </SizableText>
            ) : null}
          </YStack>
        ) : null}
        {/* Bottom info bar: flush to the card edges, frosted glass (BlurView wraps
          both platforms; the translucent white is the no-blur fallback).
          All four corners are rounded per Figma - the two top corners curve away
          from the card edge and let the artwork show through.
          The radius is set on the BlurView itself rather than relying on the
          card's overflow hidden: on iOS the native UIVisualEffectView is not
          reliably clipped by an RN ancestor and leaks square corners. */}
        <BlurView
          intensity={50}
          minHeight={BANNER_INFO_HEIGHT}
          borderRadius="$3"
          borderCurve="continuous"
          overflow="hidden"
          bg="rgba(255,255,255,0.75)"
          contentStyle={{ flex: 1 }}
        >
          <XStack
            flex={1}
            minHeight={BANNER_INFO_HEIGHT}
            px="$3"
            py="$2"
            gap="$3"
            ai="center"
          >
            {item.icon ? (
              // $9 (36) matches the two-line text block beside it
              // (bodyMdMedium 20 + bodySm 16) so the logo shares the row's top
              // and bottom edge instead of looming over the copy.
              <Image
                src={item.icon}
                w="$9"
                h="$9"
                borderRadius="$2"
                resizeMode="contain"
              />
            ) : null}
            <YStack flex={1} minWidth={0} jc="center">
              <SizableText
                size="$bodyMdMedium"
                color={item.titleColor || BANNER_DEFAULT_COLORS.title}
                numberOfLines={1}
              >
                {item.title}
              </SizableText>
              <SizableText
                size="$bodySm"
                color={item.subtitleColor || BANNER_DEFAULT_COLORS.subtitle}
                numberOfLines={1}
              >
                {item.subtitle}
              </SizableText>
            </YStack>
            {item.button && item.href ? (
              <XStack
                testID={EarnTestIDs.bannerButton(item.bannerId)}
                role="button"
                flexShrink={0}
                px={11}
                py={5}
                borderRadius="$full"
                bg="$bgPrimary"
                cursor="pointer"
                pressStyle={{ bg: '$bgPrimaryActive' }}
                onPress={handlePress}
              >
                <SizableText
                  size="$bodyMdMedium"
                  color="$textInverse"
                  numberOfLines={1}
                >
                  {item.button}
                </SizableText>
              </XStack>
            ) : null}
          </XStack>
          {/* Hairline rim above the bar's own content, so the frosted sheet
              reads as a material with an edge instead of a flat translucent
              rectangle - it also traces the rounded top corners. */}
          <InnerStroke borderRadius="$3" />
        </BlurView>
      </YStack>
    </YStack>
  );
}

export function EarnHomeBanner({
  banners,
  isLoading,
}: {
  banners: IEarnPageBannerListItem[];
  isLoading: boolean;
}) {
  const validBanners = useMemo(
    () =>
      banners.filter(
        (banner) =>
          Boolean(banner.bannerId) && Boolean(banner.backgroundImage?.trim()),
      ),
    [banners],
  );

  const renderItem = useCallback(
    ({ item }: { item: IEarnPageBannerListItem }) => (
      <EarnHomeBannerItem item={item} />
    ),
    [],
  );

  if (isLoading && validBanners.length === 0) {
    return (
      <YStack h={BANNER_SECTION_HEIGHT} px="$pagePadding" pb="$4">
        <Skeleton h={BANNER_HEIGHT} borderRadius="$3" />
      </YStack>
    );
  }

  if (validBanners.length === 0) {
    return null;
  }

  return (
    <YStack
      testID={EarnTestIDs.banner}
      h={BANNER_SECTION_HEIGHT}
      px="$pagePadding"
      pb="$4"
    >
      <Carousel
        data={validBanners}
        renderItem={renderItem}
        autoPlayInterval={5000}
        loop={validBanners.length > 1}
        showPagination={validBanners.length > 1}
        containerStyle={{ height: BANNER_HEIGHT + BANNER_SHADOW_BLEED }}
        paginationContainerStyle={{
          mt: BANNER_PAGINATION_GAP - BANNER_SHADOW_BLEED,
          h: '$1.5',
        }}
        renderPaginationItem={({ activeDotStyle, onPress }, index) => (
          <YStack
            key={validBanners[index]?.bannerId ?? index}
            w="$1.5"
            h="$1.5"
            mr={index === validBanners.length - 1 ? '$0' : '$1.5'}
            borderRadius="$full"
            bg={activeDotStyle ? '$bgPrimary' : '$neutral5'}
            onPress={onPress}
          />
        )}
      />
    </YStack>
  );
}
