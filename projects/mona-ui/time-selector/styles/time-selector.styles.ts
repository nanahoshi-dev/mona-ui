import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    timeSelectorBaseVariants as annaTimeSelectorBaseVariants,
    timeSelectorFooterVariants as annaTimeSelectorFooterVariants,
    timeSelectorHeaderVariants as annaTimeSelectorHeaderVariants,
    timeSelectorInfoContainerVariants as annaTimeSelectorInfoContainerVariants,
    timeSelectorListContainerVariants as annaTimeSelectorListContainerVariants,
    timeSelectorListItemVariants as annaTimeSelectorListItemVariants,
    timeSelectorListVariants as annaTimeSelectorListVariants
} from "./time-selector.anna.styles";
import {
    timeSelectorBaseVariants as monaTimeSelectorBaseVariants,
    timeSelectorFooterVariants as monaTimeSelectorFooterVariants,
    timeSelectorHeaderVariants as monaTimeSelectorHeaderVariants,
    timeSelectorInfoContainerVariants as monaTimeSelectorInfoContainerVariants,
    timeSelectorListContainerVariants as monaTimeSelectorListContainerVariants,
    timeSelectorListItemVariants as monaTimeSelectorListItemVariants,
    timeSelectorListVariants as monaTimeSelectorListVariants
} from "./time-selector.mona.styles";

export const timeSelectorBaseThemeVariants = createThemeStrategy({
    anna: annaTimeSelectorBaseVariants,
    mona: monaTimeSelectorBaseVariants
});

export const timeSelectorFooterThemeVariants = createThemeStrategy({
    anna: annaTimeSelectorFooterVariants,
    mona: monaTimeSelectorFooterVariants
});

export const timeSelectorHeaderThemeVariants = createThemeStrategy({
    anna: annaTimeSelectorHeaderVariants,
    mona: monaTimeSelectorHeaderVariants
});

export const timeSelectorInfoContainerThemeVariants = createThemeStrategy({
    anna: annaTimeSelectorInfoContainerVariants,
    mona: monaTimeSelectorInfoContainerVariants
});

export const timeSelectorListContainerThemeVariants = createThemeStrategy({
    anna: annaTimeSelectorListContainerVariants,
    mona: monaTimeSelectorListContainerVariants
});

export const timeSelectorListThemeVariants = createThemeStrategy({
    anna: annaTimeSelectorListVariants,
    mona: monaTimeSelectorListVariants
});

export const timeSelectorListItemThemeVariants = createThemeStrategy({
    anna: annaTimeSelectorListItemVariants,
    mona: monaTimeSelectorListItemVariants
});

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
