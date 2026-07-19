import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const dialogBaseThemeVariants = cva(
    `
        flex h-full w-full flex-col gap-0.5 overflow-hidden
        bg-surface-overlay text-foreground
        border border-border shadow-(--shadow-overlay) outline-none
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

export const dialogContentContainerThemeVariants = cva(
    `
        flex flex-1 flex-row gap-1
    `
);

export const dialogBodyThemeVariants = cva(
    `
        flex h-full w-full flex-col gap-0 pr-2 pb-2
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

export const dialogHeaderThemeVariants = cva(
    `
        flex flex-row gap-2 pt-4
        select-none
    `
);

export const dialogIconContainerThemeVariants = cva(
    `
        flex items-start justify-center pt-8 pr-4 pl-6
    `
);

export const dialogIconThemeVariants = cva(
    `
        relative h-fit w-fit rounded-full border p-1.5
        [&>span]:absolute [&>span]:flex [&>span]:rounded-full
        [&>span]:-top-3 [&>span]:-right-3 [&>span]:-bottom-3 [&>span]:-left-3
        [&>span]:min-h-full [&>span]:min-w-full [&>span]:border
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

export const dialogTitleContainerThemeVariants = cva(
    `
        flex flex-1 items-center justify-start p-1
        select-none
    `
);

export const dialogCloseButtonContainerThemeVariants = cva(
    `
        flex items-start justify-end
    `
);

export const dialogTitleThemeVariants = cva(
    `
        text-lg font-semibold leading-none tracking-tight
    `
);

export const dialogDescriptionThemeVariants = cva(
    `
        text-sm text-muted-foreground
        select-none
    `
);

export const dialogContentThemeVariants = cva(
    `
        flex-1 overflow-auto p-1
        [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]
    `
);

export const dialogFooterThemeVariants = cva(
    `
        flex flex-row gap-2 px-4 py-2
        select-none
        bg-surface-muted
        border-t border-border-subtle
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

type DialogBaseVariantProps = VariantProps<typeof dialogBaseThemeVariants>;

type DialogBaseVariantInput = VariantInputs<DialogBaseVariantProps>;

type DialogIconContainerVariantProps = VariantProps<typeof dialogIconContainerThemeVariants>;

type DialogIconContainerVariantInput = VariantInputs<DialogIconContainerVariantProps>;

export type DialogIconVariantProps = VariantProps<typeof dialogIconThemeVariants>;

type DialogIconVariantInput = VariantInputs<DialogIconVariantProps>;

export type DialogVariantProps = DialogBaseVariantProps & DialogIconContainerVariantProps & DialogIconVariantProps;

export type DialogVariantInput = DialogBaseVariantInput & DialogIconContainerVariantInput & DialogIconVariantInput;
