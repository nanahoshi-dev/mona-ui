import type { VariantProps } from "class-variance-authority";
import { listViewBaseVariants as monaListViewBaseVariants } from "./list-view.mona.styles";
import { ThemeStyle } from "../../theme/models/Theme";
import { VariantInputs } from "../../utils/VariantInputs";

export const listViewBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaListViewBaseVariants;
        default:
            return monaListViewBaseVariants;
    }
};

type ListViewBaseVariantProps = VariantProps<ReturnType<typeof listViewBaseThemeVariants>>;
type ListViewBaseVariantInputs = VariantInputs<ListViewBaseVariantProps>;

export type ListViewVariantProps = ListViewBaseVariantProps;
export type ListViewVariantInputs = ListViewBaseVariantInputs;
