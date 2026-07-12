import { cva } from "class-variance-authority";

export const dialogBaseVariants = cva(
    `
        flex flex-col gap-0.5
        w-full h-full
        bg-surface-raised text-foreground
        border border-border shadow-overlay
        outline-none overflow-hidden
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg"
            }
        },
        defaultVariants: {
            rounded: "medium"
        }
    }
);

export const dialogContentContainerVariants = cva(
    `
        flex flex-row gap-1 flex-1
    `
);

export const dialogBodyVariants = cva(
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

export const dialogHeaderVariants = cva(
    `
        flex flex-row gap-2
        pt-4 select-none
    `
);

export const dialogIconContainerVariants = cva(
    `
        flex items-start justify-center pt-8 pr-4 pl-6
    `
);

export const dialogIconVariants = cva(
    `
        rounded-full w-fit h-fit p-1.5 border relative
        [&>span]:absolute [&>span]:flex [&>span]:rounded-full
        [&>span]:-top-3 [&>span]:-right-3 [&>span]:-bottom-3 [&>span]:-left-3
        [&>span]:border [&>span]:min-w-full [&>span]:min-h-full
    `,
    {
        variants: {
            type: {
                confirm: "border-success-border bg-success-subtle text-success [&>span]:border-success-border [&>span]:bg-success-subtle",
                error: "border-error-border bg-error-subtle text-error [&>span]:border-error-border [&>span]:bg-error-subtle",
                warning: "border-warning-border bg-warning-subtle text-warning [&>span]:border-warning-border [&>span]:bg-warning-subtle",
                info: "border-info-border bg-info-subtle text-info [&>span]:border-info-border [&>span]:bg-info-subtle",
                success: "border-success-border bg-success-subtle text-success [&>span]:border-success-border [&>span]:bg-success-subtle"
            }
        },
        defaultVariants: {
            type: "info"
        }
    }
);

export const dialogTitleContainerVariants = cva(
    `
        flex flex-1 items-center justify-start select-none p-1
    `
);

export const dialogCloseButtonContainerVariants = cva(
    `
        flex items-start justify-end
    `
);

export const dialogTitleVariants = cva(
    `
        text-lg font-semibold leading-none tracking-tight
    `
);

export const dialogDescriptionVariants = cva(
    `
        text-sm text-muted-foreground
        select-none
    `
);

export const dialogContentVariants = cva(
    `
        flex-1 overflow-auto p-1
    `
);

export const dialogFooterVariants = cva(
    `
        flex flex-row
        gap-2 px-4 py-2
        border-t border-border
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
                small: "rounded-es-sm rounded-ee-sm",
                medium: "rounded-es-md rounded-ee-md",
                large: "rounded-es-lg rounded-ee-lg"
            }
        },
        defaultVariants: {
            rounded: "medium"
        }
    }
);
