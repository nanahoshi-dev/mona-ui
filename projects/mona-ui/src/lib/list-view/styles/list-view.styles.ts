import type { VariantProps } from "class-variance-authority";
import type { ThemeStyle } from "mona-ui/theme/models/Theme";
import type { VariantInputs } from "mona-ui/utils/VariantInputs";
import {
    listViewBaseVariants as monaListViewBaseVariants,
    listViewListVariants as monaListViewListVariants
} from "./list-view.mona.styles";

export const listViewBaseThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaListViewBaseVariants;
        default:
            return monaListViewBaseVariants;
    }
};

export const listViewListThemeVariants = (theme: ThemeStyle) => {
    switch (theme) {
        case "mona":
            return monaListViewListVariants;
        default:
            return monaListViewListVariants;
    }
};

type ListViewBaseVariantProps = VariantProps<ReturnType<typeof listViewBaseThemeVariants>>;
type ListViewBaseVariantInputs = VariantInputs<ListViewBaseVariantProps>;

type ListViewListVariantProps = VariantProps<ReturnType<typeof listViewListThemeVariants>>;
type ListViewListVariantInputs = VariantInputs<ListViewListVariantProps>;

export type ListViewVariantProps = ListViewBaseVariantProps & ListViewListVariantProps;
export type ListViewVariantInputs = ListViewBaseVariantInputs & ListViewListVariantInputs;
