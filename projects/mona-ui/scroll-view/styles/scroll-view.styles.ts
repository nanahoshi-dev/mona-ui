import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import {
    scrollViewBaseVariants as annaScrollViewBaseVariants,
    scrollViewContentVariants as annaScrollViewContentVariants,
    scrollViewListVariants as annaScrollViewListVariants,
    scrollViewArrowVariants as annaScrollViewArrowVariants,
    scrollViewPagerVariants as annaScrollViewPagerVariants,
    scrollViewPagerListContainerVariants as annaScrollViewPagerListContainerVariants,
    scrollViewPagerListVariants as annaScrollViewPagerListVariants,
    scrollViewPagerListItemVariants as annaScrollViewPagerListItemVariants,
    scrollViewPagerArrowVariants as annaScrollViewPagerArrowVariants
} from "./scroll-view.anna.styles";
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
import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";

export const scrollViewBaseThemeVariants = createThemeStrategy({
    anna: annaScrollViewBaseVariants,
    mona: monaScrollViewBaseVariants
});

export const scrollViewContentThemeVariants = createThemeStrategy({
    anna: annaScrollViewContentVariants,
    mona: monaScrollViewContentVariants
});

export const scrollViewListThemeVariants = createThemeStrategy({
    anna: annaScrollViewListVariants,
    mona: monaScrollViewListVariants
});

export const scrollViewArrowThemeVariants = createThemeStrategy({
    anna: annaScrollViewArrowVariants,
    mona: monaScrollViewArrowVariants
});

export const scrollViewPagerThemeVariants = createThemeStrategy({
    anna: annaScrollViewPagerVariants,
    mona: monaScrollViewPagerVariants
});

export const scrollViewPagerListContainerThemeVariants = createThemeStrategy({
    anna: annaScrollViewPagerListContainerVariants,
    mona: monaScrollViewPagerListContainerVariants
});

export const scrollViewPagerListThemeVariants = createThemeStrategy({
    anna: annaScrollViewPagerListVariants,
    mona: monaScrollViewPagerListVariants
});

export const scrollViewPagerListItemThemeVariants = createThemeStrategy({
    anna: annaScrollViewPagerListItemVariants,
    mona: monaScrollViewPagerListItemVariants
});

export const scrollViewPagerArrowThemeVariants = createThemeStrategy({
    anna: annaScrollViewPagerArrowVariants,
    mona: monaScrollViewPagerArrowVariants
});

type ScrollViewBaseVariantProps = VariantProps<ReturnType<typeof scrollViewBaseThemeVariants>>;
type ScrollViewBaseVariantInput = VariantInputs<ScrollViewBaseVariantProps>;

type ScrollViewContentVariantProps = VariantProps<ReturnType<typeof scrollViewContentThemeVariants>>;
type ScrollViewContentVariantInput = VariantInputs<ScrollViewContentVariantProps>;

type ScrollViewListVariantProps = VariantProps<ReturnType<typeof scrollViewListThemeVariants>>;
type ScrollViewListVariantInput = VariantInputs<ScrollViewListVariantProps>;

type ScrollViewPagerVariantProps = VariantProps<ReturnType<typeof scrollViewPagerThemeVariants>>;
type ScrollViewPagerVariantInput = VariantInputs<ScrollViewPagerVariantProps>;

type ScrollViewPagerListContainerVariantProps = VariantProps<
    ReturnType<typeof scrollViewPagerListContainerThemeVariants>
>;
type ScrollViewPagerListContainerVariantInput = VariantInputs<ScrollViewPagerListContainerVariantProps>;

type ScrollViewPagerListVariantProps = VariantProps<ReturnType<typeof scrollViewPagerListThemeVariants>>;
type ScrollViewPagerListVariantInput = VariantInputs<ScrollViewPagerListVariantProps>;

type ScrollViewPagerListItemVariantProps = VariantProps<ReturnType<typeof scrollViewPagerListItemThemeVariants>>;
type ScrollViewPagerListItemVariantInput = VariantInputs<ScrollViewPagerListItemVariantProps>;

type ScrollViewArrowVariantProps = VariantProps<ReturnType<typeof scrollViewArrowThemeVariants>>;
type ScrollViewArrowVariantInput = VariantInputs<ScrollViewArrowVariantProps>;

type ScrollViewPagerArrowVariantProps = VariantProps<ReturnType<typeof scrollViewPagerArrowThemeVariants>>;
type ScrollViewPagerArrowVariantInput = VariantInputs<ScrollViewPagerArrowVariantProps>;

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
