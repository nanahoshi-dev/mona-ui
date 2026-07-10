import { VariantProps } from "class-variance-authority";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import {
    timeSelectorBaseVariants as monaTimeSelectorBaseVariants,
    timeSelectorFooterVariants as monaTimeSelectorFooterVariants,
    timeSelectorHeaderVariants as monaTimeSelectorHeaderVariants,
    timeSelectorInfoContainerVariants as monaTimeSelectorInfoContainerVariants,
    timeSelectorListContainerVariants as monaTimeSelectorListContainerVariants,
    timeSelectorListItemVariants as monaTimeSelectorListItemVariants,
    timeSelectorListVariants as monaTimeSelectorListVariants
} from "./time-selector.mona.styles";

const timeSelectorBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTimeSelectorBaseVariants },
    monaTimeSelectorBaseVariants
);

export const timeSelectorBaseThemeVariants = (theme: ThemeStyle) =>
    timeSelectorBaseThemeVariantsStrategy.resolve(theme);

const timeSelectorFooterThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTimeSelectorFooterVariants },
    monaTimeSelectorFooterVariants
);

export const timeSelectorFooterThemeVariants = (theme: ThemeStyle) =>
    timeSelectorFooterThemeVariantsStrategy.resolve(theme);

const timeSelectorHeaderThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTimeSelectorHeaderVariants },
    monaTimeSelectorHeaderVariants
);

export const timeSelectorHeaderThemeVariants = (theme: ThemeStyle) =>
    timeSelectorHeaderThemeVariantsStrategy.resolve(theme);

const timeSelectorInfoContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTimeSelectorInfoContainerVariants },
    monaTimeSelectorInfoContainerVariants
);

export const timeSelectorInfoContainerThemeVariants = (theme: ThemeStyle) =>
    timeSelectorInfoContainerThemeVariantsStrategy.resolve(theme);

const timeSelectorListContainerThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTimeSelectorListContainerVariants },
    monaTimeSelectorListContainerVariants
);

export const timeSelectorListContainerThemeVariants = (theme: ThemeStyle) =>
    timeSelectorListContainerThemeVariantsStrategy.resolve(theme);

const timeSelectorListThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTimeSelectorListVariants },
    monaTimeSelectorListVariants
);

export const timeSelectorListThemeVariants = (theme: ThemeStyle) =>
    timeSelectorListThemeVariantsStrategy.resolve(theme);

const timeSelectorListItemThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTimeSelectorListItemVariants },
    monaTimeSelectorListItemVariants
);

export const timeSelectorListItemThemeVariants = (theme: ThemeStyle) =>
    timeSelectorListItemThemeVariantsStrategy.resolve(theme);

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
