import { createInheritedThemeStrategy } from "@nanahoshi/mona-ui/theme";
import {
    menubarBaseVariants as monaMenubarBaseVariants,
    menubarListItemVariants as monaMenubarListItemVariants,
    menubarListVariants as monaMenubarListVariants
} from "./menu.mona.styles";
import { reinaMenubarBaseVariants, reinaMenubarListItemVariants, reinaMenubarListVariants } from "./menu.reina.styles";
import {
    createMenubarBaseVariants,
    createMenubarListItemVariants,
    createMenubarListVariants
} from "./menu.style-composition";
import type { MenubarStyleOverrides, MenubarStyleStrategy, MenubarVariantsFunctions } from "./menu.types";

export function createMenubarStyleStrategy(overrides: readonly MenubarStyleOverrides[] = []): MenubarStyleStrategy {
    const mona: MenubarVariantsFunctions = {
        base: createMenubarBaseVariants(monaMenubarBaseVariants, overrides, "mona"),
        list: createMenubarListVariants(monaMenubarListVariants, overrides, "mona"),
        listItem: createMenubarListItemVariants(monaMenubarListItemVariants, overrides, "mona")
    };
    const reina: MenubarVariantsFunctions = {
        base: createMenubarBaseVariants(reinaMenubarBaseVariants, overrides, "reina"),
        list: createMenubarListVariants(reinaMenubarListVariants, overrides, "reina"),
        listItem: createMenubarListItemVariants(reinaMenubarListItemVariants, overrides, "reina")
    };
    return createInheritedThemeStrategy<MenubarVariantsFunctions>(mona, { reina: reina });
}
