import { VariantInputs } from "@mirei/mona-ui/common";
import { ThemeStyle } from "@mirei/mona-ui/theme";
import { VariantProps } from "class-variance-authority";
import {
    listBoxBaseVariants as monaListBoxBaseVariants,
    listBoxToolbarVariants as monaListBoxToolbarVariants
} from "./list-box.mona.styles";

export const listBoxBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaListBoxBaseVariants;
        default:
            return monaListBoxBaseVariants;
    }
};

export const listBoxToolbarThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaListBoxToolbarVariants;
        default:
            return monaListBoxToolbarVariants;
    }
};

type ListBoxBaseVariantProps = VariantProps<ReturnType<typeof listBoxBaseThemeVariants>>;
type ListBoxBaseVariantInputs = Omit<VariantInputs<ListBoxBaseVariantProps>, "direction" | "reversed">;

type ListBoxToolbarVariantProps = VariantProps<ReturnType<typeof listBoxToolbarThemeVariants>>;
type ListBoxToolbarVariantInputs = Omit<VariantInputs<ListBoxToolbarVariantProps>, "direction">;

export type ListBoxVariantProps = ListBoxBaseVariantProps & ListBoxToolbarVariantProps;
export type ListBoxVariantInputs = ListBoxBaseVariantInputs & ListBoxToolbarVariantInputs;
