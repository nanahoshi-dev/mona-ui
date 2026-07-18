import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import { dropdownPopupVariants as annaDropdownPopupVariants } from "./dropdown-popup.anna.styles";
import { dropdownPopupVariants as monaDropdownPopupVariants } from "./dropdown-popup.mona.styles";

export const dropdownPopupThemeVariants = createThemeStrategy({
    anna: annaDropdownPopupVariants,
    mona: monaDropdownPopupVariants
});

export type DropdownPopupVariantProps = VariantProps<ReturnType<typeof dropdownPopupThemeVariants>>;
export type DropdownPopupVariantInput = VariantInputs<DropdownPopupVariantProps>;
