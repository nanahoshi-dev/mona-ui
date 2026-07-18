import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { datePickerBaseVariants as annaDatePickerBaseVariants } from "./date-picker.anna.styles";
import { datePickerBaseVariants as monaDatePickerBaseVariants } from "./date-picker.mona.styles";

export const datePickerBaseThemeVariants = createThemeStrategy({
    anna: annaDatePickerBaseVariants,
    mona: monaDatePickerBaseVariants
});

type DatePickerBaseVariantProps = VariantProps<ReturnType<typeof datePickerBaseThemeVariants>>;
type DatePickerBaseVariantInput = VariantInputs<DatePickerBaseVariantProps>;

export type DatePickerVariantProps = DatePickerBaseVariantProps;
export type DatePickerVariantInput = Omit<DatePickerBaseVariantInput, "focused">;
