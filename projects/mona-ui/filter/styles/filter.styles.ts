import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantProps } from "class-variance-authority";
import {
    filterMenuActionVariants as monaFilterMenuActionVariants,
    filterMenuBaseVariants as monaFilterMenuBaseVariants,
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

type FilterMenuBaseVariantProps = VariantProps<ReturnType<typeof filterMenuBaseThemeVariants>>;
type FilterMenuBaseVariantInput = VariantInputs<FilterMenuBaseVariantProps>;

export type FilterMenuVariantProps = FilterMenuBaseVariantProps;
export type FilterMenuVariantInput = FilterMenuBaseVariantInput;
