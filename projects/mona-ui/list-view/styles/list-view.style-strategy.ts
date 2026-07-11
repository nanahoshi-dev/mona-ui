import { createThemeStrategy } from "@nanahoshi/mona-ui/theme";
import { listViewBaseVariants as monaListViewBaseVariants } from "./list-view.mona.styles";
import { reinaListViewBaseVariants } from "./list-view.reina.styles";
import { createListViewBaseVariants } from "./list-view.style-composition";
import type { ListViewStyleOverrides, ListViewStyleStrategy, ListViewVariantsFunctions } from "./list-view.types";

export function createListViewStyleStrategy(overrides: readonly ListViewStyleOverrides[] = []): ListViewStyleStrategy {
    const mona: ListViewVariantsFunctions = {
        base: createListViewBaseVariants(monaListViewBaseVariants, overrides, "mona")
    };
    const reina: ListViewVariantsFunctions = {
        base: createListViewBaseVariants(reinaListViewBaseVariants, overrides, "reina")
    };
    return createThemeStrategy<ListViewVariantsFunctions>({ mona, reina }, mona);
}
