import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    scrollViewBaseVariants as monaScrollViewBaseVariants,
    scrollViewContentVariants as monaScrollViewContentVariants,
    scrollViewListVariants as monaScrollViewListVariants,
    scrollViewArrowVariants as monaScrollViewArrowVariants,
    scrollViewPagerVariants as monaScrollViewPagerVariants,
    scrollViewPagerListContainerVariants as monaScrollViewPagerListContainerVariants,
    scrollViewPagerListVariants as monaScrollViewPagerListVariants,
    scrollViewPagerListItemVariants as monaScrollViewPagerListItemVariants,
    scrollViewPagerArrowVariants as monaScrollViewPagerArrowVariants
} from "./scroll-view.mona.styles";

export const reinaScrollViewBaseVariants = createInheritedVariants(monaScrollViewBaseVariants, {
    add: "border-border/60",
    remove: "border border-border",
    variants: {
        rounded: {
            small: {
                add: "rounded-md",
                remove: "rounded-sm"
            },
            medium: {
                add: "rounded-xl",
                remove: "rounded-md"
            },
            large: {
                add: "rounded-2xl",
                remove: "rounded-lg"
            }
        }
    }
});

export const reinaScrollViewContentVariants = createInheritedVariants(monaScrollViewContentVariants, {});

export const reinaScrollViewListVariants = createInheritedVariants(monaScrollViewListVariants, {});

export const reinaScrollViewArrowVariants = createInheritedVariants(monaScrollViewArrowVariants, {});

export const reinaScrollViewPagerVariants = createInheritedVariants(monaScrollViewPagerVariants, {});

export const reinaScrollViewPagerListContainerVariants = createInheritedVariants(
    monaScrollViewPagerListContainerVariants,
    {}
);

export const reinaScrollViewPagerListVariants = createInheritedVariants(monaScrollViewPagerListVariants, {});

export const reinaScrollViewPagerListItemVariants = createInheritedVariants(monaScrollViewPagerListItemVariants, {
    add: "border-border/60",
    remove: "border-border"
});

export const reinaScrollViewPagerArrowVariants = createInheritedVariants(monaScrollViewPagerArrowVariants, {});
