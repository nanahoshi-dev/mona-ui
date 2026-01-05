import { VariantProps } from "class-variance-authority";
import { ThemeStyle } from "../../theme/models/Theme";
import { VariantInputs } from "../../utils/VariantInputs";
import { dropdownPopupVariants as monaDropdownPopupVariants } from "./dropdown-popup.mona.styles";

export const dropdownPopupThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaDropdownPopupVariants;
        default:
            return monaDropdownPopupVariants;
    }
};

export type DropdownPopupVariantProps = VariantProps<ReturnType<typeof dropdownPopupThemeVariants>>;
export type DropdownPopupVariantInput = VariantInputs<DropdownPopupVariantProps>;
