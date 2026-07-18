import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    dateTimePickerBaseVariants as annaDateTimePickerBaseVariants,
    dateTimePickerFooterVariants as annaDateTimePickerFooterVariants,
    dateTimePickerHeaderVariants as annaDateTimePickerHeaderVariants
} from "./datetime-picker.anna.styles";
import {
    dateTimePickerBaseVariants as monaDateTimePickerBaseVariants,
    dateTimePickerFooterVariants as monaDateTimePickerFooterVariants,
    dateTimePickerHeaderVariants as monaDateTimePickerHeaderVariants
} from "./datetime-picker.mona.styles";

export const dateTimePickerBaseThemeVariants = createThemeStrategy({
    anna: annaDateTimePickerBaseVariants,
    mona: monaDateTimePickerBaseVariants
});

export const dateTimePickerHeaderThemeVariants = createThemeStrategy({
    anna: annaDateTimePickerHeaderVariants,
    mona: monaDateTimePickerHeaderVariants
});

export const dateTimePickerFooterThemeVariants = createThemeStrategy({
    anna: annaDateTimePickerFooterVariants,
    mona: monaDateTimePickerFooterVariants
});

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
