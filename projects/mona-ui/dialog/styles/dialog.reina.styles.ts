import { cva } from "class-variance-authority";

export const reinaDialogBaseVariants = cva(
    `
        flex flex-col gap-0.5
        w-full h-full
        bg-background text-foreground
        border border-border/60 shadow-xl
        outline-none overflow-hidden
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-lg",
                medium: "rounded-xl",
                large: "rounded-2xl"
            }
        },
        defaultVariants: {
            rounded: "medium"
        }
    }
);

export const reinaDialogContentContainerVariants = cva(
    `
        flex flex-row gap-1 flex-1
    `
);

export const reinaDialogBodyVariants = cva(
    `
        flex flex-col gap-0 pb-2
        w-full h-full pr-2
    `,
    {
        variants: {
            hasIcon: {
                true: "",
                false: "pl-5"
            }
        }
    }
);

export const reinaDialogHeaderVariants = cva(
    `
        flex flex-row gap-2
        pt-4 select-none
    `
);

export const reinaDialogIconContainerVariants = cva(
    `
        flex items-start justify-center pt-8 pr-4 pl-6
    `
);

export const reinaDialogIconVariants = cva(
    `
        rounded-full w-fit h-fit p-1.5 border relative
        [&>span]:absolute [&>span]:flex [&>span]:rounded-full
        [&>span]:-top-3 [&>span]:-right-3 [&>span]:-bottom-3 [&>span]:-left-3
        [&>span]:border [&>span]:min-w-full [&>span]:min-h-full
    `,
    {
        variants: {
            type: {
                confirm: "border-success/15 bg-success/15 [&>span]:border-success/8 [&>span]:bg-success/8",
                error: "border-error/15 bg-error/15 [&>span]:border-error/8 [&>span]:bg-error/8",
                warning: "border-warning/15 bg-warning/15 [&>span]:border-warning/8 [&>span]:bg-warning/8",
                info: "border-info/15 bg-info/15 [&>span]:border-info/8 [&>span]:bg-info/8",
                success: "border-success/15 bg-success/15 [&>span]:border-success/8 [&>span]:bg-success/8"
            }
        },
        defaultVariants: {
            type: "info"
        }
    }
);

export const reinaDialogTitleContainerVariants = cva(
    `
        flex flex-1 items-center justify-start select-none p-1
    `
);

export const reinaDialogCloseButtonContainerVariants = cva(
    `
        flex items-start justify-end
    `
);

export const reinaDialogTitleVariants = cva(
    `
        text-lg font-semibold leading-none tracking-tight
    `
);

export const reinaDialogDescriptionVariants = cva(
    `
        text-sm text-foreground/60
        select-none
    `
);

export const reinaDialogContentVariants = cva(
    `
        flex-1 overflow-auto p-1
    `
);

export const reinaDialogFooterVariants = cva(
    `
        flex flex-row
        gap-2 px-4 py-2
        border-t border-border/60
        select-none
    `,
    {
        variants: {
            layout: {
                center: "justify-center",
                end: "justify-end",
                start: "justify-start",
                stretched: "[&>*]:flex-1"
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-es-lg rounded-ee-lg",
                medium: "rounded-es-xl rounded-ee-xl",
                large: "rounded-es-2xl rounded-ee-2xl"
            }
        },
        defaultVariants: {
            rounded: "medium"
        }
    }
);
