import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    windowBaseVariants as monaWindowBaseVariants,
    windowContentContainerVariants as monaWindowContentContainerVariants,
    windowContentVariants as monaWindowContentVariants,
    windowResizerVariants as monaWindowResizerVariants,
    windowTitleBarActionVariants as monaWindowTitleBarActionVariants,
    windowTitleBarVariants as monaWindowTitleBarVariants,
    windowTitleContainerVariants as monaWindowTitleContainerVariants,
    windowTitleVariants as monaWindowTitleVariants
} from "./window.mona.styles";

export const reinaWindowBaseVariants = createInheritedVariants(monaWindowBaseVariants, {
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

export const reinaWindowContentContainerVariants = createInheritedVariants(monaWindowContentContainerVariants, {
    add: "border-border/60 shadow-lg",
    remove: "border-border shadow-sm",
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

export const reinaWindowContentVariants = createInheritedVariants(monaWindowContentVariants, {});

export const reinaWindowResizerVariants = createInheritedVariants(monaWindowResizerVariants, {});

export const reinaWindowTitleBarActionVariants = createInheritedVariants(monaWindowTitleBarActionVariants, {});

export const reinaWindowTitleBarVariants = createInheritedVariants(monaWindowTitleBarVariants, {
    add: "border-border/60",
    remove: "border-border",
    variants: {
        look: {
            default: {
                add: "bg-background-dark",
                remove: "bg-secondary"
            }
        },
        rounded: {
            small: {
                add: "rounded-ss-lg rounded-se-lg",
                remove: "rounded-ss-sm rounded-se-sm"
            },
            medium: {
                add: "rounded-ss-xl rounded-se-xl",
                remove: "rounded-ss-md rounded-se-md"
            },
            large: {
                add: "rounded-ss-2xl rounded-se-2xl",
                remove: "rounded-ss-lg rounded-se-lg"
            }
        }
    }
});

export const reinaWindowTitleContainerVariants = createInheritedVariants(monaWindowTitleContainerVariants, {});

export const reinaWindowTitleVariants = createInheritedVariants(monaWindowTitleVariants, {
    add: "tracking-tight"
});
