import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantProps } from "class-variance-authority";
import {
    filterMenuActionVariants as annaFilterMenuActionVariants,
    filterMenuBaseVariants as annaFilterMenuBaseVariants,
    filterMenuItemVariants as annaFilterMenuItemVariants
} from "./filter.anna.styles";
import {
    filterMenuActionVariants as monaFilterMenuActionVariants,
    filterMenuBaseVariants as monaFilterMenuBaseVariants,
    filterMenuItemVariants as monaFilterMenuItemVariants
} from "./filter.mona.styles";

export const filterMenuBaseThemeVariants = createThemeStrategy({
    anna: annaFilterMenuBaseVariants,
    mona: monaFilterMenuBaseVariants
});

export const filterMenuActionsThemeVariants = createThemeStrategy({
    anna: annaFilterMenuActionVariants,
    mona: monaFilterMenuActionVariants
});

export const filterMenuItemThemeVariants = createThemeStrategy({
    anna: annaFilterMenuItemVariants,
    mona: monaFilterMenuItemVariants
});

type FilterMenuBaseVariantProps = VariantProps<ReturnType<typeof filterMenuBaseThemeVariants>>;
type FilterMenuBaseVariantInput = VariantInputs<FilterMenuBaseVariantProps>;

export type FilterMenuVariantProps = FilterMenuBaseVariantProps;
export type FilterMenuVariantInput = FilterMenuBaseVariantInput;
