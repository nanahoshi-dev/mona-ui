import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import {
    dialogBaseVariants as monaDialogBaseVariants,
    dialogContentContainerVariants as monaDialogContentContainerVariants,
    dialogBodyVariants as monaDialogBodyVariants,
    dialogHeaderVariants as monaDialogHeaderVariants,
    dialogIconContainerVariants as monaDialogIconContainerVariants,
    dialogIconVariants as monaDialogIconVariants,
    dialogTitleContainerVariants as monaDialogTitleContainerVariants,
    dialogCloseButtonContainerVariants as monaDialogCloseButtonContainerVariants,
    dialogTitleVariants as monaDialogTitleVariants,
    dialogDescriptionVariants as monaDialogDescriptionVariants,
    dialogContentVariants as monaDialogContentVariants,
    dialogFooterVariants as monaDialogFooterVariants
} from "./dialog.mona.styles";

export const reinaDialogBaseVariants = createInheritedVariants(monaDialogBaseVariants, {
    add: "border-border/60 shadow-xl",
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

export const reinaDialogContentContainerVariants = createInheritedVariants(monaDialogContentContainerVariants, {});

export const reinaDialogBodyVariants = createInheritedVariants(monaDialogBodyVariants, {});

export const reinaDialogHeaderVariants = createInheritedVariants(monaDialogHeaderVariants, {});

export const reinaDialogIconContainerVariants = createInheritedVariants(monaDialogIconContainerVariants, {});

export const reinaDialogIconVariants = createInheritedVariants(monaDialogIconVariants, {
    variants: {
        type: {
            confirm: {
                add: "border-success/15 bg-success/15 [&>span]:border-success/8 [&>span]:bg-success/8",
                remove: "border-success/10 bg-success/10 [&>span]:border-success/5 [&>span]:bg-success/5"
            },
            error: {
                add: "border-error/15 bg-error/15 [&>span]:border-error/8 [&>span]:bg-error/8",
                remove: "border-error/10 bg-error/10 [&>span]:border-error/5 [&>span]:bg-error/5"
            },
            warning: {
                add: "border-warning/15 bg-warning/15 [&>span]:border-warning/8 [&>span]:bg-warning/8",
                remove: "border-warning/10 bg-warning/10 [&>span]:border-warning/5 [&>span]:bg-warning/5"
            },
            info: {
                add: "border-info/15 bg-info/15 [&>span]:border-info/8 [&>span]:bg-info/8",
                remove: "border-info/10 bg-info/10 [&>span]:border-info/5 [&>span]:bg-info/5"
            },
            success: {
                add: "border-success/15 bg-success/15 [&>span]:border-success/8 [&>span]:bg-success/8",
                remove: "border-success/10 bg-success/10 [&>span]:border-success/5 [&>span]:bg-success/5"
            }
        }
    }
});

export const reinaDialogTitleContainerVariants = createInheritedVariants(monaDialogTitleContainerVariants, {});

export const reinaDialogCloseButtonContainerVariants = createInheritedVariants(
    monaDialogCloseButtonContainerVariants,
    {}
);

export const reinaDialogTitleVariants = createInheritedVariants(monaDialogTitleVariants, {});

export const reinaDialogDescriptionVariants = createInheritedVariants(monaDialogDescriptionVariants, {
    add: "text-foreground/60",
    remove: "text-muted-foreground"
});

export const reinaDialogContentVariants = createInheritedVariants(monaDialogContentVariants, {});

export const reinaDialogFooterVariants = createInheritedVariants(monaDialogFooterVariants, {
    add: "border-border/60",
    remove: "border-border",
    variants: {
        rounded: {
            small: {
                add: "rounded-es-lg rounded-ee-lg",
                remove: "rounded-es-sm rounded-ee-sm"
            },
            medium: {
                add: "rounded-es-xl rounded-ee-xl",
                remove: "rounded-es-md rounded-ee-md"
            },
            large: {
                add: "rounded-es-2xl rounded-ee-2xl",
                remove: "rounded-es-lg rounded-ee-lg"
            }
        }
    }
});
