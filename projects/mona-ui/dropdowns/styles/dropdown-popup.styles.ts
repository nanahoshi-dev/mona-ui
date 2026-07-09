import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
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
