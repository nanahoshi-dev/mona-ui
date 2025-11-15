import { ThemeStyle } from "mona-ui/theme/models/Theme";
import { listBoxBaseVariants as monaListBoxBaseVariants } from "mona-ui/list-box/styles/list-box.mona.styles";
import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "mona-ui/utils/VariantInputs";

export const listBoxBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaListBoxBaseVariants;
        default:
            return monaListBoxBaseVariants;
    }
};

type ListBoxBaseVariantProps = VariantProps<ReturnType<typeof listBoxBaseThemeVariants>>;
type ListBoxBaseVariantInputs = VariantInputs<ListBoxBaseVariantProps>;

export type ListBoxVariantProps = ListBoxBaseVariantProps;
export type ListBoxVariantInputs = ListBoxBaseVariantInputs;
