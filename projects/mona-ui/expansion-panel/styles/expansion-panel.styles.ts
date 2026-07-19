import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const expansionPanelBaseThemeVariants = cva(
    `
        relative block w-full overflow-hidden
        bg-surface text-foreground border border-border
        not-last:border-b-transparent not-last:rounded-b-none not-first:rounded-t-none
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                none: "rounded-none"
            }
        }
    }
);

export const expansionPanelHeaderThemeVariants = cva(
    `
        relative flex w-full items-center justify-between
        px-2 py-1
        cursor-pointer
        select-none
        font-medium text-foreground
        bg-surface-muted
        transition-colors duration-(--mona-motion-fast)
        hover:bg-hover active:bg-active
        focus-visible:z-10 focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-indicator/35
    `,
    {
        variants: {
            collapsed: {
                true: "border-b-transparent",
                false: "border-0 border-b border-border-subtle"
            },
            disabled: {
                true: "pointer-events-none cursor-not-allowed select-none bg-disabled-background text-disabled-foreground",
                false: ""
            }
        }
    }
);

export const expansionPanelHeaderTitleThemeVariants = cva(
    `
        p-1 flex-1
    `
);

export const expansionPanelIconContainerThemeVariants = cva(``, {
    variants: {
        hasTemplate: {
            true: "",
            false: "px-2"
        }
    }
});

export const expansionPanelContentThemeVariants = cva(
    `
        text-foreground
        grid
        transition-[grid-template-rows] duration-(--mona-motion-standard) ease-out
        [&>div]:overflow-hidden
    `,
    {
        variants: {
            expanded: {
                true: "grid-rows-[1fr]",
                false: "grid-rows-[0fr]"
            }
        }
    }
);

type ExpansionPanelBaseVariantProps = VariantProps<typeof expansionPanelBaseThemeVariants>;

type ExpansionPanelBaseVariantInput = VariantInputs<ExpansionPanelBaseVariantProps>;

type ExpansionPanelHeaderVariantProps = VariantProps<typeof expansionPanelHeaderThemeVariants>;

type ExpansionPanelHeaderVariantInput = VariantInputs<ExpansionPanelHeaderVariantProps>;

type ExpansionPanelContentVariantProps = VariantProps<typeof expansionPanelContentThemeVariants>;

type ExpansionPanelContentVariantInput = VariantInputs<ExpansionPanelContentVariantProps>;

type ExpansionPanelIconContainerVariantProps = VariantProps<typeof expansionPanelIconContainerThemeVariants>;

type ExpansionPanelIconContainerVariantInput = VariantInputs<ExpansionPanelIconContainerVariantProps>;

export type ExpansionPanelVariantProps = ExpansionPanelBaseVariantProps &
    ExpansionPanelHeaderVariantProps &
    ExpansionPanelContentVariantProps &
    ExpansionPanelIconContainerVariantProps;

export type ExpansionPanelVariantInput = ExpansionPanelBaseVariantInput &
    Omit<ExpansionPanelHeaderVariantInput, "collapsed"> &
    ExpansionPanelContentVariantInput &
    Omit<ExpansionPanelIconContainerVariantInput, "hasTemplate">;
