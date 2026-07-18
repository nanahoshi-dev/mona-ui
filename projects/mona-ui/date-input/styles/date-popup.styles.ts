import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { datePopupVariants as annaDatePopupVariants } from "./date-popup.anna.styles";
import { datePopupVariants as monaDatePopupVariants } from "./date-popup.mona.styles";

export const datePopupThemeVariants = createThemeStrategy({
    anna: annaDatePopupVariants,
    mona: monaDatePopupVariants
});

export type DatePopupVariantProps = VariantProps<ReturnType<typeof datePopupThemeVariants>>;
export type DatePopupVariantInput = VariantInputs<DatePopupVariantProps>;
