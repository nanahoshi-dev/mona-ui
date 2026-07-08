import { VariantInputs } from "@mirei/mona-ui/common";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    dateTimePickerBaseVariants as monaDateTimePickerBaseVariants,
    dateTimePickerFooterVariants as monaDateTimePickerFooterVariants,
    dateTimePickerHeaderVariants as monaDateTimePickerHeaderVariants
} from "./datetime-picker.mona.styles";

export const dateTimePickerBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDateTimePickerBaseVariants;
        default:
            return monaDateTimePickerBaseVariants;
    }
};

export const dateTimePickerHeaderThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDateTimePickerHeaderVariants;
        default:
            return monaDateTimePickerHeaderVariants;
    }
};

export const dateTimePickerFooterThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDateTimePickerFooterVariants;
        default:
            return monaDateTimePickerFooterVariants;
    }
};

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
