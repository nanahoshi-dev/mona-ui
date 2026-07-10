import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import type { VariantProps } from "class-variance-authority";
import {
    filterMenuActionVariants as monaFilterMenuActionVariants,
    filterMenuBaseVariants as monaFilterMenuBaseVariants,
    filterMenuItemVariants as monaFilterMenuItemVariants
} from "./filter.mona.styles";

const filterMenuBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaFilterMenuBaseVariants },
    monaFilterMenuBaseVariants
);

export const filterMenuBaseThemeVariants = (theme: ThemeStyle) => filterMenuBaseThemeVariantsStrategy.resolve(theme);

const filterMenuActionsThemeVariantsStrategy = createThemeStrategy(
    { mona: monaFilterMenuActionVariants },
    monaFilterMenuActionVariants
);

export const filterMenuActionsThemeVariants = (theme: ThemeStyle) =>
    filterMenuActionsThemeVariantsStrategy.resolve(theme);

const filterMenuItemThemeVariantsStrategy = createThemeStrategy(
    { mona: monaFilterMenuItemVariants },
    monaFilterMenuItemVariants
);

export const filterMenuItemThemeVariants = (theme: ThemeStyle) => filterMenuItemThemeVariantsStrategy.resolve(theme);

type FilterMenuBaseVariantProps = VariantProps<ReturnType<typeof filterMenuBaseThemeVariants>>;
type FilterMenuBaseVariantInput = VariantInputs<FilterMenuBaseVariantProps>;

export type FilterMenuVariantProps = FilterMenuBaseVariantProps;
export type FilterMenuVariantInput = FilterMenuBaseVariantInput;
