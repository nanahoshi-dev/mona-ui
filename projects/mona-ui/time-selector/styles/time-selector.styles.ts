import { cva } from "class-variance-authority";
import { VariantProps } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";

export const timeSelectorBaseThemeVariants = cva(
    `
        flex h-full w-full flex-col overflow-hidden
        data-[invalid='true']:border data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none cursor-not-allowed text-disabled-foreground",
                false: ""
            },
            size: {
                small: "text-xs",
                medium: "text-sm",
                large: "text-md"
            }
        }
    }
);

export const timeSelectorFooterThemeVariants = cva(
    `
        flex w-full items-center justify-end px-1 py-1
        bg-surface-muted
        border-0 border-t border-border-subtle
    `
);

export const timeSelectorHeaderThemeVariants = cva(
    `
        flex
        text-xs font-semibold uppercase
        bg-surface-muted text-foreground
        border-b border-border-subtle
        [&>div]:flex-1 [&>div]:py-2 [&>div]:text-center
    `
);

export const timeSelectorInfoContainerThemeVariants = cva(
    `
        flex items-center justify-between
        px-2 py-1
        border-b border-border-subtle
        [&>span]:text-xs [&>span]:font-medium [&>span]:select-none
    `
);

export const timeSelectorListContainerThemeVariants = cva(
    `
        relative flex w-full flex-row overflow-hidden
    `
);

export const timeSelectorListThemeVariants = cva(
    `
        h-full flex-1 overflow-y-auto
        [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]
        scrollbar-hide scroll-smooth
        snap-y snap-mandatory
        scrollbar-width:none
        select-none outline-none
        [&::-webkit-scrollbar]:hidden
        focus-visible:bg-(--color-focus-surface)
        focus-within:bg-(--color-focus-surface)
    `,
    {
        variants: {
            size: {
                small: "h-24",
                medium: "h-32",
                large: "h-40"
            }
        }
    }
);

export const timeSelectorListItemThemeVariants = cva(
    `
        relative z-10 flex cursor-pointer snap-center items-center justify-center
        text-foreground
        hover:bg-hover active:bg-active
    `,
    {
        variants: {
            selected: {
                true: "bg-active font-medium text-foreground hover:bg-active",
                false: ""
            },
            size: {
                small: "h-6",
                medium: "h-7",
                large: "h-8"
            }
        },
        defaultVariants: {
            selected: false
        }
    }
);

type TimeSelectorBaseVariantProps = VariantProps<typeof timeSelectorBaseThemeVariants>;

type TimeSelectorBaseVariantInput = VariantInputs<TimeSelectorBaseVariantProps>;

type TimeSelectorHeaderVariantProps = VariantProps<typeof timeSelectorHeaderThemeVariants>;

type TimeSelectorHeaderVariantInput = VariantInputs<TimeSelectorHeaderVariantProps>;

type TimeSelectorInfoContainerVariantProps = VariantProps<typeof timeSelectorInfoContainerThemeVariants>;

type TimeSelectorInfoContainerVariantInput = VariantInputs<TimeSelectorInfoContainerVariantProps>;

export type TimeSelectorListVariantProps = VariantProps<typeof timeSelectorListThemeVariants>;

export type TimeSelectorListVariantInput = VariantInputs<TimeSelectorListVariantProps>;

export type TimeSelectorListItemVariantProps = VariantProps<typeof timeSelectorListItemThemeVariants>;

export type TimeSelectorListItemVariantInput = VariantInputs<TimeSelectorListItemVariantProps>;

export type TimeSelectorVariantProps = TimeSelectorBaseVariantProps &
    TimeSelectorHeaderVariantProps &
    TimeSelectorInfoContainerVariantProps &
    Omit<TimeSelectorListVariantProps, "size"> &
    Omit<TimeSelectorListItemVariantProps, "size">;

export type TimeSelectorVariantInput = TimeSelectorBaseVariantInput &
    TimeSelectorHeaderVariantInput &
    TimeSelectorInfoContainerVariantInput &
    Omit<TimeSelectorListVariantInput, "size"> &
    Omit<TimeSelectorListItemVariantInput, "size" | "selected">;
