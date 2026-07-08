import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantInputs } from "@mirei/mona-ui/common";
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
