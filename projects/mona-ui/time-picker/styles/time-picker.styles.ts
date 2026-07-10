import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { timePickerBaseVariants as monaTimePickerBaseVariants } from "./time-picker.mona.styles";

const timePickerBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaTimePickerBaseVariants },
    monaTimePickerBaseVariants
);

export const timePickerBaseThemeVariants = (theme: ThemeStyle) => timePickerBaseThemeVariantsStrategy.resolve(theme);

type TimePickerBaseVariantProps = VariantProps<ReturnType<typeof timePickerBaseThemeVariants>>;
type TimePickerBaseVariantInput = VariantInputs<TimePickerBaseVariantProps>;

export type TimePickerVariantProps = TimePickerBaseVariantProps;
export type TimePickerVariantInput = Omit<TimePickerBaseVariantInput, "focused">;
