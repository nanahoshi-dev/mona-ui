import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import {
    timeSelectorBaseVariants as monaTimeSelectorBaseVariants,
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

type TimeSelectorListVariantProps = VariantProps<ReturnType<typeof timeSelectorListThemeVariants>>;
type TimeSelectorListVariantInput = VariantInputs<TimeSelectorListVariantProps>;

export type TimeSelectorListItemVariantProps = VariantProps<ReturnType<typeof timeSelectorListItemThemeVariants>>;
export type TimeSelectorListItemVariantInput = VariantInputs<TimeSelectorListItemVariantProps>;

export type TimeSelectorVariantProps = TimeSelectorBaseVariantProps &
    Omit<TimeSelectorListVariantProps, "size"> &
    Omit<TimeSelectorListItemVariantProps, "size">;
export type TimeSelectorVariantInput = TimeSelectorBaseVariantInput &
    Omit<TimeSelectorListVariantInput, "size"> &
    Omit<TimeSelectorListItemVariantInput, "size" | "selected">;
