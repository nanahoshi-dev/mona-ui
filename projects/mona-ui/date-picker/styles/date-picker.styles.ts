import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { datePickerBaseVariants as monaDatePickerBaseVariants } from "./date-picker.mona.styles";

export const datePickerBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDatePickerBaseVariants;
        default:
            return monaDatePickerBaseVariants;
    }
};

type DatePickerBaseVariantProps = VariantProps<ReturnType<typeof datePickerBaseThemeVariants>>;
type DatePickerBaseVariantInput = VariantInputs<DatePickerBaseVariantProps>;

export type DatePickerVariantProps = DatePickerBaseVariantProps;
export type DatePickerVariantInput = Omit<DatePickerBaseVariantInput, "focused">;
