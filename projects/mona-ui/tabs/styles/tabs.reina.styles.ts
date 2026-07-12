import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    tabListBaseVariants as monaTabListBaseVariants,
    tabListListWrapperVariants as monaTabListListWrapperVariants,
    tabListListVariants as monaTabListListVariants,
    tabListListItemVariants as monaTabListListItemVariants,
    tabListScrollButtonVariants as monaTabListScrollButtonVariants,
    tabContentVariants as monaTabContentVariants,
    tabsBaseVariants as monaTabsBaseVariants
} from "./tabs.mona.styles";

export const reinaTabListBaseVariants = createInheritedVariants(monaTabListBaseVariants, {});

export const reinaTabListListWrapperVariants = createInheritedVariants(monaTabListListWrapperVariants, {});

export const reinaTabListListVariants = createInheritedVariants(monaTabListListVariants, {
    add: "duration-150",
    remove: "duration-300"
});

export const reinaTabListListItemVariants = createInheritedVariants(monaTabListListItemVariants, {
    add: "transition-[color,box-shadow,background-color] duration-150 ease-out focus-visible:ring-primary/35",
    remove: "focus-visible:ring-focus-indicator",
    variants: {
        active: {
            true: {
                add: "bg-background",
                remove: "bg-surface-muted"
            }
        },
        disabled: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        }
    }
});

export const reinaTabListScrollButtonVariants = createInheritedVariants(monaTabListScrollButtonVariants, {});

export const reinaTabContentVariants = createInheritedVariants(monaTabContentVariants, {
    add: "border-input-border",
    remove: "border-border"
});

export const reinaTabsBaseVariants = createInheritedVariants(monaTabsBaseVariants, {});
