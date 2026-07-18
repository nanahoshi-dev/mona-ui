import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { timePickerBaseVariants as annaTimePickerBaseVariants } from "./time-picker.anna.styles";
import { timePickerBaseVariants as monaTimePickerBaseVariants } from "./time-picker.mona.styles";

export const timePickerBaseThemeVariants = createThemeStrategy({
    anna: annaTimePickerBaseVariants,
    mona: monaTimePickerBaseVariants
});

type TimePickerBaseVariantProps = VariantProps<ReturnType<typeof timePickerBaseThemeVariants>>;
type TimePickerBaseVariantInput = VariantInputs<TimePickerBaseVariantProps>;

export type TimePickerVariantProps = TimePickerBaseVariantProps;
export type TimePickerVariantInput = Omit<TimePickerBaseVariantInput, "focused">;
