import type { VariantProps } from "class-variance-authority";
import { listViewBaseVariants as monaListViewBaseVariants } from "./list-view.mona.styles";
import { createThemeStrategy, type ThemeStyle } from "@nanahoshi/mona-ui/theme";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";

const listViewBaseThemeVariantsStrategy = createThemeStrategy(
    { mona: monaListViewBaseVariants },
    monaListViewBaseVariants
);

export const listViewBaseThemeVariants = (theme: ThemeStyle) => listViewBaseThemeVariantsStrategy.resolve(theme);

type ListViewBaseVariantProps = VariantProps<ReturnType<typeof listViewBaseThemeVariants>>;
type ListViewBaseVariantInputs = VariantInputs<ListViewBaseVariantProps>;

export type ListViewVariantProps = ListViewBaseVariantProps;
export type ListViewVariantInputs = ListViewBaseVariantInputs;
