import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    popupMenuBaseVariants as monaPopupMenuBaseVariants,
    popupMenuContainerVariants as monaPopupMenuContainerVariants,
    popupMenuGroupHeaderVariants as monaPopupMenuGroupHeaderVariants,
    popupMenuIconContainerVariants as monaPopupMenuIconContainerVariants,
    popupMenuItemVariants as monaPopupMenuItemVariants,
    popupMenuLinkVariants as monaPopupMenuLinkVariants
} from "./popup-menu.mona.styles";

export const reinaPopupMenuBaseVariants = createInheritedVariants(monaPopupMenuBaseVariants, {
    variants: {
        rounded: {
            small: {
                add: "rounded-xl",
                remove: "rounded-sm"
            },
            medium: {
                add: "rounded-2xl",
                remove: "rounded-md"
            },
            large: {
                add: "rounded-3xl",
                remove: "rounded-lg"
            }
        }
    }
});

export const reinaPopupMenuContainerVariants = createInheritedVariants(monaPopupMenuContainerVariants, {
    add: "bg-background/95 backdrop-blur-xl border-input-border p-1.5 shadow-lg",
    remove: "bg-surface-overlay border-border p-1 shadow-overlay",
    variants: {
        rounded: {
            small: {
                add: "rounded-xl",
                remove: "rounded-sm"
            },
            medium: {
                add: "rounded-2xl",
                remove: "rounded-md"
            },
            large: {
                add: "rounded-3xl",
                remove: "rounded-lg"
            }
        }
    }
});

export const reinaPopupMenuGroupHeaderVariants = createInheritedVariants(monaPopupMenuGroupHeaderVariants, {
    add: "font-semibold tracking-tight text-foreground/50",
    remove: "font-bold inline-flex",
    variants: {
        size: {
            small: {
                add: "text-[11px]",
                remove: "text-xs"
            },
            medium: {
                add: "text-xs",
                remove: "text-sm"
            },
            large: {
                add: "text-sm",
                remove: "text-md"
            }
        }
    }
});

export const reinaPopupMenuIconContainerVariants = createInheritedVariants(monaPopupMenuIconContainerVariants, {});

export const reinaPopupMenuItemVariants = createInheritedVariants(monaPopupMenuItemVariants, {
    add: "py-1.5 font-medium transition-colors duration-100 ease-out hover:bg-accent hover:text-accent-foreground data-[disabled='true']:opacity-40 data-[active='true']:bg-accent data-[active='true']:text-accent-foreground",
    remove: "py-1 hover:bg-hover hover:text-accent-foreground data-[disabled='true']:opacity-50 data-[active='true']:bg-hover data-[active='true']:text-accent-foreground motion-reduce:transition-none",
    variants: {
        rounded: {
            small: {
                add: "rounded-lg",
                remove: "rounded-sm"
            },
            medium: {
                add: "rounded-xl",
                remove: "rounded-md"
            },
            large: {
                add: "rounded-2xl",
                remove: "rounded-lg"
            }
        }
    }
});

export const reinaPopupMenuLinkVariants = createInheritedVariants(monaPopupMenuLinkVariants, {});
