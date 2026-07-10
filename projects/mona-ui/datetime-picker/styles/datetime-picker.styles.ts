import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    dateTimePickerBaseVariants as monaDateTimePickerBaseVariants,
    dateTimePickerFooterVariants as monaDateTimePickerFooterVariants,
    dateTimePickerHeaderVariants as monaDateTimePickerHeaderVariants
} from "./datetime-picker.mona.styles";

const dateTimePickerBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDateTimePickerBaseVariants },
    monaDateTimePickerBaseVariants
);

export const dateTimePickerBaseThemeVariants = (theme: ThemeStyle) =>
    dateTimePickerBaseThemeVariantsStrategy.resolve(theme);

const dateTimePickerHeaderThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDateTimePickerHeaderVariants },
    monaDateTimePickerHeaderVariants
);

export const dateTimePickerHeaderThemeVariants = (theme: ThemeStyle) =>
    dateTimePickerHeaderThemeVariantsStrategy.resolve(theme);

const dateTimePickerFooterThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDateTimePickerFooterVariants },
    monaDateTimePickerFooterVariants
);

export const dateTimePickerFooterThemeVariants = (theme: ThemeStyle) =>
    dateTimePickerFooterThemeVariantsStrategy.resolve(theme);

type DateTimePickerBaseVariantProps = VariantProps<ReturnType<typeof dateTimePickerBaseThemeVariants>>;
type DateTimePickerBaseVariantInput = VariantInputs<DateTimePickerBaseVariantProps>;

type DateTimePickerHeaderVariantProps = VariantProps<ReturnType<typeof dateTimePickerHeaderThemeVariants>>;
type DateTimePickerHeaderVariantInput = VariantInputs<DateTimePickerHeaderVariantProps>;

type DateTimePickerFooterVariantProps = VariantProps<ReturnType<typeof dateTimePickerFooterThemeVariants>>;
type DateTimePickerFooterVariantInput = VariantInputs<DateTimePickerFooterVariantProps>;

export type DateTimePickerVariantProps = DateTimePickerBaseVariantProps &
    DateTimePickerHeaderVariantProps &
    DateTimePickerFooterVariantProps;
export type DateTimePickerVariantInput = Omit<DateTimePickerBaseVariantInput, "focused"> &
    DateTimePickerHeaderVariantInput &
    DateTimePickerFooterVariantInput;
