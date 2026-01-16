import { VariantProps } from "class-variance-authority";
import { TextBoxVariantInput, TextBoxVariantProps } from "../../../inputs/text-box/styles/textbox.styles";
import { ThemeStyle } from "../../../theme/models/Theme";
import { VariantInputs } from "../../../utils/VariantInputs";
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

export type DatePickerVariantProps = DatePickerBaseVariantProps & Pick<TextBoxVariantProps, "rounded" | "size">;
export type DatePickerVariantInput = Omit<DatePickerBaseVariantInput, "focused"> &
    Pick<TextBoxVariantInput, "rounded" | "size">;
