import { cva } from "class-variance-authority";

export const dialogBaseVariants = cva(
    `
        flex flex-col gap-0.5
        w-full h-full
        bg-background
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
        flex flex-row gap-2 flex-1
    `
);

export const dialogBodyVariants = cva(
    `
        flex flex-col gap-2 pb-4
        w-full h-full
    `,
    {
        variants: {
            hasIcon: {
                true: "",
                false: "pl-4"
            }
        }
    }
);

export const dialogHeaderVariants = cva(
    `
        flex flex-row gap-2
        p-4 pb-0 pl-0 select-none
    `
);

export const dialogIconContainerVariants = cva(
    `
        flex items-start justify-center pt-8 pr-4 pl-6
        [&>div]:rounded-full [&>div]:w-fit [&>div]:h-fit [&>div]:p-1.5 [&>div]:border
        [&>div]:relative
        [&>div>span]:absolute [&>div>span]:flex [&>div>span]:rounded-full
        [&>div>span]:-top-3 [&>div>span]:-right-3 [&>div>span]:-bottom-3 [&>div>span]:-left-3
        [&>div>span]:border [&>div>span]:min-w-full [&>div>span]:min-h-full
    `,
    {
        variants: {
            type: {
                confirm:
                    "[&>div]:border-success/10 [&>div]:bg-success/10 [&>div>span]:border-success/5 [&>div>span]:bg-success/5",
                error: "[&>div]:border-error/10 [&>div]:bg-error/10 [&>div>span]:border-error/5 [&>div>span]:bg-error/5",
                warning:
                    "[&>div]:border-warning/10 [&>div]:bg-warning/10 [&>div>span]:border-warning/5 [&>div>span]:bg-warning/5",
                info: "[&>div]:border-info/10 [&>div]:bg-info/10 [&>div>span]:border-info/5 [&>div>span]:bg-info/5",
                success:
                    "[&>div]:border-success/10 [&>div]:bg-success/10 [&>div>span]:border-success/5 [&>div>span]:bg-success/5"
            }
        },
        defaultVariants: {
            type: "info"
        }
    }
);

export const dialogTitleContainerVariants = cva(
    `
        flex flex-1 items-center justify-start select-none
        pl-2
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
        pr-4 pl-2 select-none
    `
);

export const dialogContentVariants = cva(
    `
        flex-1 overflow-auto
        pr-4
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
