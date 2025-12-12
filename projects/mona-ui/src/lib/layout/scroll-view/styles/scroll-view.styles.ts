import { ThemeStyle } from "../../../theme/models/Theme";
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
import { VariantInputs } from "../../../utils/VariantInputs";

export const scrollViewBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaScrollViewBaseVariants;
        default:
            return monaScrollViewBaseVariants;
    }
};

export const scrollViewContentThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaScrollViewContentVariants;
        default:
            return monaScrollViewContentVariants;
    }
};

export const scrollViewListThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaScrollViewListVariants;
        default:
            return monaScrollViewListVariants;
    }
};

export const scrollViewArrowThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaScrollViewArrowVariants;
        default:
            return monaScrollViewArrowVariants;
    }
};

export const scrollViewPagerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaScrollViewPagerVariants;
        default:
            return monaScrollViewPagerVariants;
    }
};

export const scrollViewPagerListContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaScrollViewPagerListContainerVariants;
        default:
            return monaScrollViewPagerListContainerVariants;
    }
};

export const scrollViewPagerListThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaScrollViewPagerListVariants;
        default:
            return monaScrollViewPagerListVariants;
    }
};

export const scrollViewPagerListItemThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaScrollViewPagerListItemVariants;
        default:
            return monaScrollViewPagerListItemVariants;
    }
};

export const scrollViewPagerArrowThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaScrollViewPagerArrowVariants;
        default:
            return monaScrollViewPagerArrowVariants;
    }
};

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
