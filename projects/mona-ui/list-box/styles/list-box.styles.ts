import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    listBoxBaseVariants as annaListBoxBaseVariants,
    listBoxToolbarVariants as annaListBoxToolbarVariants
} from "./list-box.anna.styles";
import {
    listBoxBaseVariants as monaListBoxBaseVariants,
    listBoxToolbarVariants as monaListBoxToolbarVariants
} from "./list-box.mona.styles";

export const listBoxBaseThemeVariants = createThemeStrategy({
    anna: annaListBoxBaseVariants,
    mona: monaListBoxBaseVariants
});

export const listBoxToolbarThemeVariants = createThemeStrategy({
    anna: annaListBoxToolbarVariants,
    mona: monaListBoxToolbarVariants
});

type ListBoxBaseVariantProps = VariantProps<ReturnType<typeof listBoxBaseThemeVariants>>;
type ListBoxBaseVariantInputs = Omit<VariantInputs<ListBoxBaseVariantProps>, "direction" | "reversed">;

type ListBoxToolbarVariantProps = VariantProps<ReturnType<typeof listBoxToolbarThemeVariants>>;
type ListBoxToolbarVariantInputs = Omit<VariantInputs<ListBoxToolbarVariantProps>, "direction">;

export type ListBoxVariantProps = ListBoxBaseVariantProps & ListBoxToolbarVariantProps;
export type ListBoxVariantInputs = ListBoxBaseVariantInputs & ListBoxToolbarVariantInputs;
