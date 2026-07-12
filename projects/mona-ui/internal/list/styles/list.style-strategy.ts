import { createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    listGroupHeaderTextVariants as monaListGroupHeaderTextVariants,
    listGroupHeaderVariants as monaListGroupHeaderVariants,
    listInnerListVariants as monaListInnerListVariants,
    listItemBaseVariants as monaListItemBaseVariants,
    listItemContentVariants as monaListItemContentVariants,
    listVariants as monaListVariants
} from "./list.mona.styles";
import {
    reinaListGroupHeaderTextVariants,
    reinaListGroupHeaderVariants,
    reinaListInnerListVariants,
    reinaListItemBaseVariants,
    reinaListItemContentVariants,
    reinaListVariants
} from "./list.reina.styles";
import {
    createListGroupHeaderTextVariants,
    createListGroupHeaderVariants,
    createListInnerListVariants,
    createListItemBaseVariants,
    createListItemContentVariants,
    createListVariants
} from "./list.style-composition";
import type { ListStylesOverrides, ListStylesVariantsFunctions, ListStyleStrategy } from "./list.types";

export function createListStyleStrategy(overrides: readonly ListStylesOverrides[] = []): ListStyleStrategy {
    const mona: ListStylesVariantsFunctions = {
        list: createListVariants(monaListVariants, overrides, "mona"),
        innerList: createListInnerListVariants(monaListInnerListVariants, overrides, "mona"),
        groupHeader: createListGroupHeaderVariants(monaListGroupHeaderVariants, overrides, "mona"),
        groupHeaderText: createListGroupHeaderTextVariants(monaListGroupHeaderTextVariants, overrides, "mona"),
        itemBase: createListItemBaseVariants(monaListItemBaseVariants, overrides, "mona"),
        itemContent: createListItemContentVariants(monaListItemContentVariants, overrides, "mona")
    };
    const reina: ListStylesVariantsFunctions = {
        list: createListVariants(reinaListVariants, overrides, "reina"),
        innerList: createListInnerListVariants(reinaListInnerListVariants, overrides, "reina"),
        groupHeader: createListGroupHeaderVariants(reinaListGroupHeaderVariants, overrides, "reina"),
        groupHeaderText: createListGroupHeaderTextVariants(reinaListGroupHeaderTextVariants, overrides, "reina"),
        itemBase: createListItemBaseVariants(reinaListItemBaseVariants, overrides, "reina"),
        itemContent: createListItemContentVariants(reinaListItemContentVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<ListStylesVariantsFunctions>(mona, { reina: reina });
}
