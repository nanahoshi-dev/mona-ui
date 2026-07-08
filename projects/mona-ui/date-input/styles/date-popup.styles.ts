import { VariantInputs } from "@mirei/mona-ui/internal";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { datePopupVariants as monaDatePopupVariants } from "./date-popup.mona.styles";

export const datePopupThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDatePopupVariants;
        default:
            return monaDatePopupVariants;
    }
};

export type DatePopupVariantProps = VariantProps<ReturnType<typeof datePopupThemeVariants>>;
export type DatePopupVariantInput = VariantInputs<DatePopupVariantProps>;
