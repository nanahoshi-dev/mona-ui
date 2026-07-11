import type { ClassValue } from "clsx";
import type { VariantProps } from "class-variance-authority";
import type { ThemeStrategy, ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type {
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

export type ScrollViewBaseVariantsFunction = (props?: ScrollViewBaseVariantProps) => string;
export type ScrollViewBaseVariantProps = VariantProps<typeof monaScrollViewBaseVariants>;

export type ScrollViewContentVariantsFunction = (props?: ScrollViewContentVariantProps) => string;
export type ScrollViewContentVariantProps = VariantProps<typeof monaScrollViewContentVariants>;

export type ScrollViewListVariantsFunction = (props?: ScrollViewListVariantProps) => string;
export type ScrollViewListVariantProps = VariantProps<typeof monaScrollViewListVariants>;

export type ScrollViewArrowVariantsFunction = (props?: ScrollViewArrowVariantProps) => string;
export type ScrollViewArrowVariantProps = VariantProps<typeof monaScrollViewArrowVariants>;

export type ScrollViewPagerVariantsFunction = (props?: ScrollViewPagerVariantProps) => string;
export type ScrollViewPagerVariantProps = VariantProps<typeof monaScrollViewPagerVariants>;

export type ScrollViewPagerListContainerVariantsFunction = (props?: ScrollViewPagerListContainerVariantProps) => string;
export type ScrollViewPagerListContainerVariantProps = VariantProps<typeof monaScrollViewPagerListContainerVariants>;

export type ScrollViewPagerListVariantsFunction = (props?: ScrollViewPagerListVariantProps) => string;
export type ScrollViewPagerListVariantProps = VariantProps<typeof monaScrollViewPagerListVariants>;

export type ScrollViewPagerListItemVariantsFunction = (props?: ScrollViewPagerListItemVariantProps) => string;
export type ScrollViewPagerListItemVariantProps = VariantProps<typeof monaScrollViewPagerListItemVariants>;

export type ScrollViewPagerArrowVariantsFunction = (props?: ScrollViewPagerArrowVariantProps) => string;
export type ScrollViewPagerArrowVariantProps = VariantProps<typeof monaScrollViewPagerArrowVariants>;

export type ScrollViewBaseVariantInput = VariantInputs<ScrollViewBaseVariantProps>;
export type ScrollViewContentVariantInput = VariantInputs<ScrollViewContentVariantProps>;
export type ScrollViewListVariantInput = VariantInputs<ScrollViewListVariantProps>;
export type ScrollViewArrowVariantInput = VariantInputs<ScrollViewArrowVariantProps>;
export type ScrollViewPagerVariantInput = VariantInputs<ScrollViewPagerVariantProps>;
export type ScrollViewPagerListContainerVariantInput = VariantInputs<ScrollViewPagerListContainerVariantProps>;
export type ScrollViewPagerListVariantInput = VariantInputs<ScrollViewPagerListVariantProps>;
export type ScrollViewPagerListItemVariantInput = VariantInputs<ScrollViewPagerListItemVariantProps>;
export type ScrollViewPagerArrowVariantInput = VariantInputs<ScrollViewPagerArrowVariantProps>;

export type ScrollViewVariantProps = ScrollViewBaseVariantProps &
    ScrollViewContentVariantProps &
    ScrollViewListVariantProps &
    ScrollViewArrowVariantProps &
    ScrollViewPagerVariantProps &
    ScrollViewPagerListContainerVariantProps &
    ScrollViewPagerListVariantProps &
    ScrollViewPagerListItemVariantProps &
    ScrollViewPagerArrowVariantProps;

export type ScrollViewVariantInput = ScrollViewBaseVariantInput &
    ScrollViewContentVariantInput &
    ScrollViewListVariantInput &
    Omit<ScrollViewArrowVariantInput, "hidden" | "left" | "right"> &
    ScrollViewPagerVariantInput &
    ScrollViewPagerListContainerVariantInput &
    ScrollViewPagerListVariantInput &
    Omit<ScrollViewPagerListItemVariantInput, "active"> &
    ScrollViewPagerArrowVariantInput;

export interface ScrollViewVariantsFunctions {
    readonly arrow: ScrollViewArrowVariantsFunction;
    readonly base: ScrollViewBaseVariantsFunction;
    readonly content: ScrollViewContentVariantsFunction;
    readonly list: ScrollViewListVariantsFunction;
    readonly pager: ScrollViewPagerVariantsFunction;
    readonly pagerArrow: ScrollViewPagerArrowVariantsFunction;
    readonly pagerList: ScrollViewPagerListVariantsFunction;
    readonly pagerListContainer: ScrollViewPagerListContainerVariantsFunction;
    readonly pagerListItem: ScrollViewPagerListItemVariantsFunction;
}

export type ScrollViewStyleStrategy = ThemeStrategy<ScrollViewVariantsFunctions>;

export interface ScrollViewBaseCompoundStyleOverride {
    readonly when: Partial<ScrollViewBaseVariantProps>;
    readonly class: ClassValue;
}

export interface ScrollViewBaseStyleOverrides {
    readonly base?: ClassValue;
    readonly rounded?: Partial<Record<NonNullable<ScrollViewBaseVariantProps["rounded"]>, ClassValue>>;
    readonly compoundVariants?: readonly ScrollViewBaseCompoundStyleOverride[];
}

export interface ScrollViewContentStyleOverrides {
    readonly base?: ClassValue;
}

export interface ScrollViewListStyleOverrides {
    readonly base?: ClassValue;
}

export interface ScrollViewArrowCompoundStyleOverride {
    readonly when: Partial<ScrollViewArrowVariantProps>;
    readonly class: ClassValue;
}

export interface ScrollViewArrowStyleOverrides {
    readonly base?: ClassValue;
    readonly hidden?: Partial<Record<`${NonNullable<ScrollViewArrowVariantProps["hidden"]>}`, ClassValue>>;
    readonly left?: Partial<Record<`${NonNullable<ScrollViewArrowVariantProps["left"]>}`, ClassValue>>;
    readonly right?: Partial<Record<`${NonNullable<ScrollViewArrowVariantProps["right"]>}`, ClassValue>>;
    readonly compoundVariants?: readonly ScrollViewArrowCompoundStyleOverride[];
}

export interface ScrollViewPagerCompoundStyleOverride {
    readonly when: Partial<ScrollViewPagerVariantProps>;
    readonly class: ClassValue;
}

export interface ScrollViewPagerStyleOverrides {
    readonly base?: ClassValue;
    readonly pagerOverlay?: Partial<Record<NonNullable<ScrollViewPagerVariantProps["pagerOverlay"]>, ClassValue>>;
    readonly compoundVariants?: readonly ScrollViewPagerCompoundStyleOverride[];
}

export interface ScrollViewPagerListContainerStyleOverrides {
    readonly base?: ClassValue;
}

export interface ScrollViewPagerListStyleOverrides {
    readonly base?: ClassValue;
}

export interface ScrollViewPagerListItemCompoundStyleOverride {
    readonly when: Partial<ScrollViewPagerListItemVariantProps>;
    readonly class: ClassValue;
}

export interface ScrollViewPagerListItemStyleOverrides {
    readonly base?: ClassValue;
    readonly active?: Partial<Record<`${NonNullable<ScrollViewPagerListItemVariantProps["active"]>}`, ClassValue>>;
    readonly pagerRounded?: Partial<
        Record<NonNullable<ScrollViewPagerListItemVariantProps["pagerRounded"]>, ClassValue>
    >;
    readonly compoundVariants?: readonly ScrollViewPagerListItemCompoundStyleOverride[];
}

export interface ScrollViewPagerArrowStyleOverrides {
    readonly base?: ClassValue;
}

export interface ScrollViewStyleOverrides {
    readonly theme?: ThemeStyle;
    readonly arrow?: ScrollViewArrowStyleOverrides;
    readonly base?: ScrollViewBaseStyleOverrides;
    readonly content?: ScrollViewContentStyleOverrides;
    readonly list?: ScrollViewListStyleOverrides;
    readonly pager?: ScrollViewPagerStyleOverrides;
    readonly pagerArrow?: ScrollViewPagerArrowStyleOverrides;
    readonly pagerList?: ScrollViewPagerListStyleOverrides;
    readonly pagerListContainer?: ScrollViewPagerListContainerStyleOverrides;
    readonly pagerListItem?: ScrollViewPagerListItemStyleOverrides;
}

export type ScrollViewStylesProviderConfig = ScrollViewStyleOverrides | { readonly strategy: ScrollViewStyleStrategy };
