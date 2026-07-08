import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantInputs } from "@mirei/mona-ui/common";
import {
    timeSelectorBaseVariants as monaTimeSelectorBaseVariants,
    timeSelectorFooterVariants as monaTimeSelectorFooterVariants,
    timeSelectorHeaderVariants as monaTimeSelectorHeaderVariants,
    timeSelectorInfoContainerVariants as monaTimeSelectorInfoContainerVariants,
    timeSelectorListContainerVariants as monaTimeSelectorListContainerVariants,
    timeSelectorListItemVariants as monaTimeSelectorListItemVariants,
    timeSelectorListVariants as monaTimeSelectorListVariants
} from "./time-selector.mona.styles";

export const timeSelectorBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTimeSelectorBaseVariants;
        default:
            return monaTimeSelectorBaseVariants;
    }
};

export const timeSelectorFooterThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTimeSelectorFooterVariants;
        default:
            return monaTimeSelectorFooterVariants;
    }
};

export const timeSelectorHeaderThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTimeSelectorHeaderVariants;
        default:
            return monaTimeSelectorHeaderVariants;
    }
};

export const timeSelectorInfoContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTimeSelectorInfoContainerVariants;
        default:
            return monaTimeSelectorInfoContainerVariants;
    }
};

export const timeSelectorListContainerThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTimeSelectorListContainerVariants;
        default:
            return monaTimeSelectorListContainerVariants;
    }
};

export const timeSelectorListThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTimeSelectorListVariants;
        default:
            return monaTimeSelectorListVariants;
    }
};

export const timeSelectorListItemThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTimeSelectorListItemVariants;
        default:
            return monaTimeSelectorListItemVariants;
    }
};

type TimeSelectorBaseVariantProps = VariantProps<ReturnType<typeof timeSelectorBaseThemeVariants>>;
type TimeSelectorBaseVariantInput = VariantInputs<TimeSelectorBaseVariantProps>;

type TimeSelectorHeaderVariantProps = VariantProps<ReturnType<typeof timeSelectorHeaderThemeVariants>>;
type TimeSelectorHeaderVariantInput = VariantInputs<TimeSelectorHeaderVariantProps>;

type TimeSelectorInfoContainerVariantProps = VariantProps<ReturnType<typeof timeSelectorInfoContainerThemeVariants>>;
type TimeSelectorInfoContainerVariantInput = VariantInputs<TimeSelectorInfoContainerVariantProps>;

export type TimeSelectorListVariantProps = VariantProps<ReturnType<typeof timeSelectorListThemeVariants>>;
export type TimeSelectorListVariantInput = VariantInputs<TimeSelectorListVariantProps>;

export type TimeSelectorListItemVariantProps = VariantProps<ReturnType<typeof timeSelectorListItemThemeVariants>>;
export type TimeSelectorListItemVariantInput = VariantInputs<TimeSelectorListItemVariantProps>;

export type TimeSelectorVariantProps = TimeSelectorBaseVariantProps &
    TimeSelectorHeaderVariantProps &
    TimeSelectorInfoContainerVariantProps &
    Omit<TimeSelectorListVariantProps, "size"> &
    Omit<TimeSelectorListItemVariantProps, "size">;
export type TimeSelectorVariantInput = TimeSelectorBaseVariantInput &
    TimeSelectorHeaderVariantInput &
    TimeSelectorInfoContainerVariantInput &
    Omit<TimeSelectorListVariantInput, "size"> &
    Omit<TimeSelectorListItemVariantInput, "size" | "selected">;
