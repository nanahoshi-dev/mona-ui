import { cva } from "class-variance-authority";

export const dialogBaseVariants = cva(
    `
        flex flex-col gap-0.5
        w-full h-full
        bg-background text-foreground
        border border-border shadow-sm
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
                confirm: "border-success/10 bg-success/10 [&>span]:border-success/5 [&>span]:bg-success/5",
                error: "border-error/10 bg-error/10 [&>span]:border-error/5 [&>span]:bg-error/5",
                warning: "border-warning/10 bg-warning/10 [&>span]:border-warning/5 [&>span]:bg-warning/5",
                info: "border-info/10 bg-info/10 [&>span]:border-info/5 [&>span]:bg-info/5",
                success: "border-success/10 bg-success/10 [&>span]:border-success/5 [&>span]:bg-success/5"
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
