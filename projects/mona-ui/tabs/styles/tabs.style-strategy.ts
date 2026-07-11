import { createThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    tabContentVariants as monaTabContentVariants,
    tabListBaseVariants as monaTabListBaseVariants,
    tabListListItemVariants as monaTabListListItemVariants,
    tabListListVariants as monaTabListListVariants,
    tabListListWrapperVariants as monaTabListListWrapperVariants,
    tabListScrollButtonVariants as monaTabListScrollButtonVariants,
    tabsBaseVariants as monaTabsBaseVariants
} from "./tabs.mona.styles";
import {
    reinaTabContentVariants,
    reinaTabListBaseVariants,
    reinaTabListListItemVariants,
    reinaTabListListVariants,
    reinaTabListListWrapperVariants,
    reinaTabListScrollButtonVariants,
    reinaTabsBaseVariants
} from "./tabs.reina.styles";
import {
    createTabContentVariants,
    createTabListBaseVariants,
    createTabListListItemVariants,
    createTabListListVariants,
    createTabListListWrapperVariants,
    createTabListScrollButtonVariants,
    createTabsBaseVariants
} from "./tabs.style-composition";
import type { TabsStyleOverrides, TabsStyleStrategy, TabsVariantsFunctions } from "./tabs.types";

export function createTabsStyleStrategy(overrides: readonly TabsStyleOverrides[] = []): TabsStyleStrategy {
    const mona: TabsVariantsFunctions = {
        base: createTabsBaseVariants(monaTabsBaseVariants, overrides, "mona"),
        content: createTabContentVariants(monaTabContentVariants, overrides, "mona"),
        listBase: createTabListBaseVariants(monaTabListBaseVariants, overrides, "mona"),
        listWrapper: createTabListListWrapperVariants(monaTabListListWrapperVariants, overrides, "mona"),
        list: createTabListListVariants(monaTabListListVariants, overrides, "mona"),
        listItem: createTabListListItemVariants(monaTabListListItemVariants, overrides, "mona"),
        scrollButton: createTabListScrollButtonVariants(monaTabListScrollButtonVariants, overrides, "mona")
    };
    const reina: TabsVariantsFunctions = {
        base: createTabsBaseVariants(reinaTabsBaseVariants, overrides, "reina"),
        content: createTabContentVariants(reinaTabContentVariants, overrides, "reina"),
        listBase: createTabListBaseVariants(reinaTabListBaseVariants, overrides, "reina"),
        listWrapper: createTabListListWrapperVariants(reinaTabListListWrapperVariants, overrides, "reina"),
        list: createTabListListVariants(reinaTabListListVariants, overrides, "reina"),
        listItem: createTabListListItemVariants(reinaTabListListItemVariants, overrides, "reina"),
        scrollButton: createTabListScrollButtonVariants(reinaTabListScrollButtonVariants, overrides, "reina")
    };
    return createThemeStrategy<TabsVariantsFunctions>({ mona, reina }, mona);
}
