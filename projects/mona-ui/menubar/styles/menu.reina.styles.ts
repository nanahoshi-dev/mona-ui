import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    menubarBaseVariants as monaMenubarBaseVariants,
    menubarListItemVariants as monaMenubarListItemVariants,
    menubarListVariants as monaMenubarListVariants
} from "./menu.mona.styles";

export const reinaMenubarBaseVariants = createInheritedVariants(monaMenubarBaseVariants, {
    add: "border-input-border data-[disabled='true']:opacity-40",
    remove: "border-border data-[disabled='true']:opacity-50"
});

export const reinaMenubarListItemVariants = createInheritedVariants(monaMenubarListItemVariants, {
    add: "transition-colors duration-100 ease-out hover:bg-accent hover:text-accent-foreground data-[disabled='true']:opacity-40",
    remove: "hover:bg-hover hover:text-accent-foreground data-[disabled='true']:opacity-50 motion-reduce:transition-none"
});

export const reinaMenubarListVariants = createInheritedVariants(monaMenubarListVariants, {});
