import { type ThemeStyle, createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    scrollViewArrowVariants as monaScrollViewArrowVariants,
    scrollViewBaseVariants as monaScrollViewBaseVariants,
    scrollViewContentVariants as monaScrollViewContentVariants,
    scrollViewListVariants as monaScrollViewListVariants,
    scrollViewPagerArrowVariants as monaScrollViewPagerArrowVariants,
    scrollViewPagerListContainerVariants as monaScrollViewPagerListContainerVariants,
    scrollViewPagerListItemVariants as monaScrollViewPagerListItemVariants,
    scrollViewPagerListVariants as monaScrollViewPagerListVariants,
    scrollViewPagerVariants as monaScrollViewPagerVariants
} from "./scroll-view.mona.styles";
import {
    reinaScrollViewArrowVariants,
    reinaScrollViewBaseVariants,
    reinaScrollViewContentVariants,
    reinaScrollViewListVariants,
    reinaScrollViewPagerArrowVariants,
    reinaScrollViewPagerListContainerVariants,
    reinaScrollViewPagerListItemVariants,
    reinaScrollViewPagerListVariants,
    reinaScrollViewPagerVariants
} from "./scroll-view.reina.styles";
import {
    createScrollViewArrowVariants,
    createScrollViewBaseVariants,
    createScrollViewContentVariants,
    createScrollViewListVariants,
    createScrollViewPagerArrowVariants,
    createScrollViewPagerListContainerVariants,
    createScrollViewPagerListItemVariants,
    createScrollViewPagerListVariants,
    createScrollViewPagerVariants
} from "./scroll-view.style-composition";
import type {
    ScrollViewArrowVariantsFunction,
    ScrollViewBaseVariantsFunction,
    ScrollViewContentVariantsFunction,
    ScrollViewListVariantsFunction,
    ScrollViewPagerArrowVariantsFunction,
    ScrollViewPagerListContainerVariantsFunction,
    ScrollViewPagerListItemVariantsFunction,
    ScrollViewPagerListVariantsFunction,
    ScrollViewPagerVariantsFunction,
    ScrollViewStyleOverrides,
    ScrollViewStyleStrategy,
    ScrollViewVariantsFunctions
} from "./scroll-view.types";

const defaultScrollViewBaseStrategy = createInheritedThemeStrategy<ScrollViewBaseVariantsFunction>(
    monaScrollViewBaseVariants,
    { reina: reinaScrollViewBaseVariants }
);
const defaultScrollViewContentStrategy = createInheritedThemeStrategy<ScrollViewContentVariantsFunction>(
    monaScrollViewContentVariants,
    { reina: reinaScrollViewContentVariants }
);
const defaultScrollViewListStrategy = createInheritedThemeStrategy<ScrollViewListVariantsFunction>(
    monaScrollViewListVariants,
    { reina: reinaScrollViewListVariants }
);
const defaultScrollViewArrowStrategy = createInheritedThemeStrategy<ScrollViewArrowVariantsFunction>(
    monaScrollViewArrowVariants,
    { reina: reinaScrollViewArrowVariants }
);
const defaultScrollViewPagerStrategy = createInheritedThemeStrategy<ScrollViewPagerVariantsFunction>(
    monaScrollViewPagerVariants,
    { reina: reinaScrollViewPagerVariants }
);
const defaultScrollViewPagerListContainerStrategy =
    createInheritedThemeStrategy<ScrollViewPagerListContainerVariantsFunction>(
        monaScrollViewPagerListContainerVariants,
        { reina: reinaScrollViewPagerListContainerVariants }
    );
const defaultScrollViewPagerListStrategy = createInheritedThemeStrategy<ScrollViewPagerListVariantsFunction>(
    monaScrollViewPagerListVariants,
    { reina: reinaScrollViewPagerListVariants }
);
const defaultScrollViewPagerListItemStrategy = createInheritedThemeStrategy<ScrollViewPagerListItemVariantsFunction>(
    monaScrollViewPagerListItemVariants,
    { reina: reinaScrollViewPagerListItemVariants }
);
const defaultScrollViewPagerArrowStrategy = createInheritedThemeStrategy<ScrollViewPagerArrowVariantsFunction>(
    monaScrollViewPagerArrowVariants,
    { reina: reinaScrollViewPagerArrowVariants }
);

export const scrollViewBaseThemeVariants = (theme: ThemeStyle): ScrollViewBaseVariantsFunction =>
    defaultScrollViewBaseStrategy.resolve(theme);
export const scrollViewContentThemeVariants = (theme: ThemeStyle): ScrollViewContentVariantsFunction =>
    defaultScrollViewContentStrategy.resolve(theme);
export const scrollViewListThemeVariants = (theme: ThemeStyle): ScrollViewListVariantsFunction =>
    defaultScrollViewListStrategy.resolve(theme);
export const scrollViewArrowThemeVariants = (theme: ThemeStyle): ScrollViewArrowVariantsFunction =>
    defaultScrollViewArrowStrategy.resolve(theme);
export const scrollViewPagerThemeVariants = (theme: ThemeStyle): ScrollViewPagerVariantsFunction =>
    defaultScrollViewPagerStrategy.resolve(theme);
export const scrollViewPagerListContainerThemeVariants = (
    theme: ThemeStyle
): ScrollViewPagerListContainerVariantsFunction => defaultScrollViewPagerListContainerStrategy.resolve(theme);
export const scrollViewPagerListThemeVariants = (theme: ThemeStyle): ScrollViewPagerListVariantsFunction =>
    defaultScrollViewPagerListStrategy.resolve(theme);
export const scrollViewPagerListItemThemeVariants = (theme: ThemeStyle): ScrollViewPagerListItemVariantsFunction =>
    defaultScrollViewPagerListItemStrategy.resolve(theme);
export const scrollViewPagerArrowThemeVariants = (theme: ThemeStyle): ScrollViewPagerArrowVariantsFunction =>
    defaultScrollViewPagerArrowStrategy.resolve(theme);

export function createScrollViewStyleStrategy(
    overrides: readonly ScrollViewStyleOverrides[] = []
): ScrollViewStyleStrategy {
    const mona: ScrollViewVariantsFunctions = {
        arrow: createScrollViewArrowVariants(monaScrollViewArrowVariants, overrides, "mona"),
        base: createScrollViewBaseVariants(monaScrollViewBaseVariants, overrides, "mona"),
        content: createScrollViewContentVariants(monaScrollViewContentVariants, overrides, "mona"),
        list: createScrollViewListVariants(monaScrollViewListVariants, overrides, "mona"),
        pager: createScrollViewPagerVariants(monaScrollViewPagerVariants, overrides, "mona"),
        pagerArrow: createScrollViewPagerArrowVariants(monaScrollViewPagerArrowVariants, overrides, "mona"),
        pagerList: createScrollViewPagerListVariants(monaScrollViewPagerListVariants, overrides, "mona"),
        pagerListContainer: createScrollViewPagerListContainerVariants(
            monaScrollViewPagerListContainerVariants,
            overrides,
            "mona"
        ),
        pagerListItem: createScrollViewPagerListItemVariants(monaScrollViewPagerListItemVariants, overrides, "mona")
    };
    const reina: ScrollViewVariantsFunctions = {
        arrow: createScrollViewArrowVariants(reinaScrollViewArrowVariants, overrides, "reina"),
        base: createScrollViewBaseVariants(reinaScrollViewBaseVariants, overrides, "reina"),
        content: createScrollViewContentVariants(reinaScrollViewContentVariants, overrides, "reina"),
        list: createScrollViewListVariants(reinaScrollViewListVariants, overrides, "reina"),
        pager: createScrollViewPagerVariants(reinaScrollViewPagerVariants, overrides, "reina"),
        pagerArrow: createScrollViewPagerArrowVariants(reinaScrollViewPagerArrowVariants, overrides, "reina"),
        pagerList: createScrollViewPagerListVariants(reinaScrollViewPagerListVariants, overrides, "reina"),
        pagerListContainer: createScrollViewPagerListContainerVariants(
            reinaScrollViewPagerListContainerVariants,
            overrides,
            "reina"
        ),
        pagerListItem: createScrollViewPagerListItemVariants(reinaScrollViewPagerListItemVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<ScrollViewVariantsFunctions>(mona, { reina: reina });
}
