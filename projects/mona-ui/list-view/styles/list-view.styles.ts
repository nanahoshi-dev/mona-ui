import type { VariantProps } from "class-variance-authority";
import { listViewBaseVariants as annaListViewBaseVariants } from "./list-view.anna.styles";
import { listViewBaseVariants as monaListViewBaseVariants } from "./list-view.mona.styles";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";

export const listViewBaseThemeVariants = createThemeStrategy({
    anna: annaListViewBaseVariants,
    mona: monaListViewBaseVariants
});

type ListViewBaseVariantProps = VariantProps<ReturnType<typeof listViewBaseThemeVariants>>;
type ListViewBaseVariantInputs = VariantInputs<ListViewBaseVariantProps>;

export type ListViewVariantProps = ListViewBaseVariantProps;
export type ListViewVariantInputs = ListViewBaseVariantInputs;
