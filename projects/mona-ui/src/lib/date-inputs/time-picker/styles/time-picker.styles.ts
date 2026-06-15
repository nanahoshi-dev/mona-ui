import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
import { timePickerBaseVariants as monaTimePickerBaseVariants } from "./time-picker.mona.styles";

export const timePickerBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaTimePickerBaseVariants;
        default:
            return monaTimePickerBaseVariants;
    }
};

type TimePickerBaseVariantProps = VariantProps<ReturnType<typeof timePickerBaseThemeVariants>>;
type TimePickerBaseVariantInput = VariantInputs<TimePickerBaseVariantProps>;

export type TimePickerVariantProps = TimePickerBaseVariantProps;
export type TimePickerVariantInput = Omit<TimePickerBaseVariantInput, "focused">;
