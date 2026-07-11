import { createThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    listBoxBaseVariants as monaListBoxBaseVariants,
    listBoxToolbarVariants as monaListBoxToolbarVariants
} from "./list-box.mona.styles";
import { reinaListBoxBaseVariants, reinaListBoxToolbarVariants } from "./list-box.reina.styles";
import { createListBoxBaseVariants, createListBoxToolbarVariants } from "./list-box.style-composition";
import type { ListBoxStyleOverrides, ListBoxStyleStrategy, ListBoxVariantsFunctions } from "./list-box.types";

export function createListBoxStyleStrategy(overrides: readonly ListBoxStyleOverrides[] = []): ListBoxStyleStrategy {
    const mona: ListBoxVariantsFunctions = {
        base: createListBoxBaseVariants(monaListBoxBaseVariants, overrides, "mona"),
        toolbar: createListBoxToolbarVariants(monaListBoxToolbarVariants, overrides, "mona")
    };
    const reina: ListBoxVariantsFunctions = {
        base: createListBoxBaseVariants(reinaListBoxBaseVariants, overrides, "reina"),
        toolbar: createListBoxToolbarVariants(reinaListBoxToolbarVariants, overrides, "reina")
    };
    return createThemeStrategy<ListBoxVariantsFunctions>({ mona, reina }, mona);
}
