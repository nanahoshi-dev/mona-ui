import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
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

const scrollViewBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaScrollViewBaseVariants },
    monaScrollViewBaseVariants
);

export const scrollViewBaseThemeVariants = (theme: ThemeStyle) => scrollViewBaseThemeVariantsStrategy.resolve(theme);

const scrollViewContentThemeVariantsStrategy = createThemeStrategy(
    { mona: monaScrollViewContentVariants },
    monaScrollViewContentVariants
);

export const scrollViewContentThemeVariants = (theme: ThemeStyle) =>
    scrollViewContentThemeVariantsStrategy.resolve(theme);

const scrollViewListThemeVariantsStrategy = createThemeStrategy(
    { mona: monaScrollViewListVariants },
    monaScrollViewListVariants
);

export const scrollViewListThemeVariants = (theme: ThemeStyle) => scrollViewListThemeVariantsStrategy.resolve(theme);

const scrollViewArrowThemeVariantsStrategy = createThemeStrategy(
    { mona: monaScrollViewArrowVariants },
    monaScrollViewArrowVariants
);

export const scrollViewArrowThemeVariants = (theme: ThemeStyle) => scrollViewArrowThemeVariantsStrategy.resolve(theme);

const scrollViewPagerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaScrollViewPagerVariants },
    monaScrollViewPagerVariants
);

export const scrollViewPagerThemeVariants = (theme: ThemeStyle) => scrollViewPagerThemeVariantsStrategy.resolve(theme);

const scrollViewPagerListContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaScrollViewPagerListContainerVariants },
    monaScrollViewPagerListContainerVariants
);

export const scrollViewPagerListContainerThemeVariants = (theme: ThemeStyle) =>
    scrollViewPagerListContainerThemeVariantsStrategy.resolve(theme);

const scrollViewPagerListThemeVariantsStrategy = createThemeStrategy(
    { mona: monaScrollViewPagerListVariants },
    monaScrollViewPagerListVariants
);

export const scrollViewPagerListThemeVariants = (theme: ThemeStyle) =>
    scrollViewPagerListThemeVariantsStrategy.resolve(theme);

const scrollViewPagerListItemThemeVariantsStrategy = createThemeStrategy(
    { mona: monaScrollViewPagerListItemVariants },
    monaScrollViewPagerListItemVariants
);

export const scrollViewPagerListItemThemeVariants = (theme: ThemeStyle) =>
    scrollViewPagerListItemThemeVariantsStrategy.resolve(theme);

const scrollViewPagerArrowThemeVariantsStrategy = createThemeStrategy(
    { mona: monaScrollViewPagerArrowVariants },
    monaScrollViewPagerArrowVariants
);

export const scrollViewPagerArrowThemeVariants = (theme: ThemeStyle) =>
    scrollViewPagerArrowThemeVariantsStrategy.resolve(theme);

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
