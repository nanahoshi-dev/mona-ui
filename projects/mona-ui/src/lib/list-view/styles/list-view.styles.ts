import type { VariantProps } from "class-variance-authority";
import type { ThemeStyle } from "mona-ui/theme/models/Theme";
import type { VariantInputs } from "mona-ui/utils/VariantInputs";
import { listViewBaseVariants as monaListViewBaseVariants } from "./list-view.mona.styles";

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
