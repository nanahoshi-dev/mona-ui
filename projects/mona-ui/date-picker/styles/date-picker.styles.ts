import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { datePickerBaseVariants as monaDatePickerBaseVariants } from "./date-picker.mona.styles";

const datePickerBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDatePickerBaseVariants },
    monaDatePickerBaseVariants
);

export const datePickerBaseThemeVariants = (theme: ThemeStyle) => datePickerBaseThemeVariantsStrategy.resolve(theme);

type DatePickerBaseVariantProps = VariantProps<ReturnType<typeof datePickerBaseThemeVariants>>;
type DatePickerBaseVariantInput = VariantInputs<DatePickerBaseVariantProps>;

export type DatePickerVariantProps = DatePickerBaseVariantProps;
export type DatePickerVariantInput = Omit<DatePickerBaseVariantInput, "focused">;
