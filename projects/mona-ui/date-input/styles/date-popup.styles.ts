import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { datePopupVariants as monaDatePopupVariants } from "./date-popup.mona.styles";

const datePopupThemeVariantsStrategy = createThemeStrategy({ mona: monaDatePopupVariants }, monaDatePopupVariants);

export const datePopupThemeVariants = (theme: ThemeStyle) => datePopupThemeVariantsStrategy.resolve(theme);

export type DatePopupVariantProps = VariantProps<ReturnType<typeof datePopupThemeVariants>>;
export type DatePopupVariantInput = VariantInputs<DatePopupVariantProps>;
