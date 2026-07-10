import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { dropdownPopupVariants as monaDropdownPopupVariants } from "./dropdown-popup.mona.styles";

const dropdownPopupThemeVariantsStrategy = createThemeStrategy(
    { mona: monaDropdownPopupVariants },
    monaDropdownPopupVariants
);

export const dropdownPopupThemeVariants = (theme: ThemeStyle) => dropdownPopupThemeVariantsStrategy.resolve(theme);

export type DropdownPopupVariantProps = VariantProps<ReturnType<typeof dropdownPopupThemeVariants>>;
export type DropdownPopupVariantInput = VariantInputs<DropdownPopupVariantProps>;
