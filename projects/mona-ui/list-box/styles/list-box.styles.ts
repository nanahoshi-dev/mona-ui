import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    listBoxBaseVariants as monaListBoxBaseVariants,
    listBoxToolbarVariants as monaListBoxToolbarVariants
} from "./list-box.mona.styles";

const listBoxBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaListBoxBaseVariants },
    monaListBoxBaseVariants
);

export const listBoxBaseThemeVariants = (theme: ThemeStyle) => listBoxBaseThemeVariantsStrategy.resolve(theme);

const listBoxToolbarThemeVariantsStrategy = createThemeStrategy(
    { mona: monaListBoxToolbarVariants },
    monaListBoxToolbarVariants
);

export const listBoxToolbarThemeVariants = (theme: ThemeStyle) => listBoxToolbarThemeVariantsStrategy.resolve(theme);

type ListBoxBaseVariantProps = VariantProps<ReturnType<typeof listBoxBaseThemeVariants>>;
type ListBoxBaseVariantInputs = Omit<VariantInputs<ListBoxBaseVariantProps>, "direction" | "reversed">;

type ListBoxToolbarVariantProps = VariantProps<ReturnType<typeof listBoxToolbarThemeVariants>>;
type ListBoxToolbarVariantInputs = Omit<VariantInputs<ListBoxToolbarVariantProps>, "direction">;

export type ListBoxVariantProps = ListBoxBaseVariantProps & ListBoxToolbarVariantProps;
export type ListBoxVariantInputs = ListBoxBaseVariantInputs & ListBoxToolbarVariantInputs;
