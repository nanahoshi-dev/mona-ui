import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

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

/**
 * Three columns: title, actions, icon. The heading and its button span them all through subgrid and put the title and
 * icon in the outer two, so the button fills the row while the actions, its sibling, sit in the middle one above it.
 */
export const expansionPanelHeaderThemeVariants = cva(
    `
        relative grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-stretch
        bg-surface-muted
    `,
    {
        variants: {
            collapsed: {
                true: "border-b-transparent",
                false: "border-0 border-b border-border-subtle"
            }
        }
    }
);

export const expansionPanelHeadingThemeVariants = cva(`col-span-full row-start-1 grid grid-cols-subgrid`);

/** Inset focus, because the panel clips anything outside it. */
export const expansionPanelTriggerThemeVariants = cva(
    `
        col-span-full grid grid-cols-subgrid items-center
        px-2 py-2
        text-start font-medium
        select-none
        bg-transparent
        transition-colors duration-(--mona-motion-fast) motion-reduce:transition-none
        focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-indicator
    `,
    {
        variants: {
            disabled: {
                true: "cursor-not-allowed bg-disabled-background text-disabled-foreground",
                false: "cursor-pointer text-foreground hover:bg-hover active:bg-active"
            }
        }
    }
);

export const expansionPanelActionsThemeVariants = cva(
    `relative z-10 col-start-2 row-start-1 flex items-center self-center`
);

export const expansionPanelHeaderTitleThemeVariants = cva(`col-start-1 row-start-1 min-w-0`);

export const expansionPanelIconContainerThemeVariants = cva(`col-start-3 row-start-1`, {
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
        transition-[grid-template-rows] duration-(--mona-motion-standard) ease-out motion-reduce:transition-none
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

type ExpansionPanelTriggerVariantProps = VariantProps<typeof expansionPanelTriggerThemeVariants>;

type ExpansionPanelTriggerVariantInput = VariantInputs<ExpansionPanelTriggerVariantProps>;

type ExpansionPanelContentVariantProps = VariantProps<typeof expansionPanelContentThemeVariants>;

type ExpansionPanelContentVariantInput = VariantInputs<ExpansionPanelContentVariantProps>;

type ExpansionPanelIconContainerVariantProps = VariantProps<typeof expansionPanelIconContainerThemeVariants>;

type ExpansionPanelIconContainerVariantInput = VariantInputs<ExpansionPanelIconContainerVariantProps>;

export type ExpansionPanelVariantProps = ExpansionPanelBaseVariantProps &
    ExpansionPanelHeaderVariantProps &
    ExpansionPanelTriggerVariantProps &
    ExpansionPanelContentVariantProps &
    ExpansionPanelIconContainerVariantProps;

export type ExpansionPanelVariantInput = ExpansionPanelBaseVariantInput &
    Omit<ExpansionPanelHeaderVariantInput, "collapsed"> &
    ExpansionPanelTriggerVariantInput &
    ExpansionPanelContentVariantInput &
    Omit<ExpansionPanelIconContainerVariantInput, "hasTemplate">;
