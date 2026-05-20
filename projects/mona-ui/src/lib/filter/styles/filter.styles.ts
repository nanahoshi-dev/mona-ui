import type { ThemeStyle } from "../../theme/models/Theme";
import {
    filterMenuBaseVariants as monaFilterMenuBaseVariants,
    filterMenuActionVariants as monaFilterMenuActionVariants,
    filterMenuItemVariants as monaFilterMenuItemVariants
} from "./filter.mona.styles";

export const filterMenuBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaFilterMenuBaseVariants;
        default:
            return monaFilterMenuBaseVariants;
    }
};

export const filterMenuActionsThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaFilterMenuActionVariants;
        default:
            return monaFilterMenuActionVariants;
    }
};

export const filterMenuItemThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaFilterMenuItemVariants;
        default:
            return monaFilterMenuItemVariants;
    }
};
