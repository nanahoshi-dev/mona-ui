import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export const tabListBaseThemeVariants = cva(
    `
        flex max-w-full min-w-0 overflow-hidden
    `,
    {
        variants: {
            position: {
                top: "flex-row border-b border-border",
                bottom: "flex-row border-t border-border",
                left: "flex-col max-h-full min-h-0 border-e border-border",
                right: "flex-col max-h-full min-h-0 border-s border-border"
            }
        },
        defaultVariants: {
            position: "top"
        }
    }
);

export const tabListListWrapperThemeVariants = cva(`flex-1 min-w-0 min-h-0 overflow-hidden`);

export const tabListListThemeVariants = cva(
    `
        flex list-none overflow-hidden
        cursor-default select-none whitespace-nowrap
        transition-colors duration-(--mona-motion-standard) ease-out
    `,
    {
        variants: {
            position: {
                top: "flex-row max-w-full min-w-0",
                bottom: "flex-row max-w-full min-w-0",
                left: "flex-col max-h-full min-h-0",
                right: "flex-col max-h-full min-h-0"
            }
        },
        defaultVariants: {
            position: "top"
        }
    }
);

export const tabListListItemThemeVariants = cva(
    `
        relative flex shrink-0 cursor-pointer
        transition-colors duration-(--mona-motion-standard) ease-out
    `,
    {
        variants: {
            active: {
                true: `
                    text-foreground font-semibold
                    after:absolute after:content-[''] after:bg-[var(--mona-indicator-color,var(--color-primary))]
                    after:forced-color-adjust-none forced-colors:after:bg-[Highlight]
                `,
                false: "text-muted-foreground hover:bg-hover hover:text-foreground"
            },
            disabled: {
                true: "pointer-events-none cursor-not-allowed select-none text-disabled-foreground after:hidden",
                false: ""
            },
            position: {
                top: "items-center justify-center whitespace-nowrap after:inset-x-0 after:bottom-0 after:h-[2px]",
                bottom: "items-center justify-center whitespace-nowrap after:inset-x-0 after:top-0 after:h-[2px]",
                left: "w-full items-center justify-start text-start after:inset-y-0 after:end-0 after:w-[2px]",
                right: "w-full items-center justify-start text-start after:inset-y-0 after:start-0 after:w-[2px]"
            },
            size: {
                small: "h-8 text-xs",
                medium: "h-9 text-sm",
                large: "h-10 text-sm"
            }
        },
        defaultVariants: {
            position: "top",
            size: "medium"
        }
    }
);

/** Inset, because the strip clips anything outside it. */
export const tabListTabThemeVariants = cva(
    `
        flex h-full min-w-0 flex-1 items-center
        focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-indicator
    `,
    {
        variants: {
            position: {
                top: "justify-center whitespace-nowrap",
                bottom: "justify-center whitespace-nowrap",
                left: "justify-start text-start",
                right: "justify-start text-start"
            },
            size: {
                small: "px-2",
                medium: "px-3",
                large: "px-4"
            }
        },
        defaultVariants: {
            position: "top",
            size: "medium"
        }
    }
);

/** The icon is 16 pixels. The pseudo-element makes the target 24. */
export const tabListCloseButtonThemeVariants = cva(
    `
        relative -ms-1 me-2 h-fit w-min self-center px-0
        before:absolute before:-inset-1 before:content-['']
    `
);

export const tabListScrollButtonThemeVariants = cva(
    `
        flex self-stretch items-center justify-center px-2
        text-muted-foreground
        hover:bg-hover hover:text-foreground
        active:bg-active
    `
);

export const tabContentThemeVariants = cva(
    `
        flex-1 min-w-0 min-h-0 overflow-auto
        [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]
        text-foreground
    `
);

export const tabsBaseThemeVariants = cva(
    `
        flex max-w-full min-w-0 min-h-0
    `,
    {
        variants: {
            position: {
                top: "flex-col",
                bottom: "flex-col-reverse",
                left: "flex-row",
                right: "flex-row-reverse"
            }
        },
        defaultVariants: {
            position: "top"
        }
    }
);

type TabListBaseVariantProps = VariantProps<typeof tabListBaseThemeVariants>;

type TabListBaseVariantInput = VariantInputs<TabListBaseVariantProps>;

type TabListListWrapperVariantProps = VariantProps<typeof tabListListWrapperThemeVariants>;

type TabListListWrapperVariantInput = VariantInputs<TabListListWrapperVariantProps>;

type TabListListVariantProps = VariantProps<typeof tabListListThemeVariants>;

type TabListListVariantInput = VariantInputs<TabListListVariantProps>;

export type TabListListItemVariantProps = VariantProps<typeof tabListListItemThemeVariants>;

export type TabListListItemVariantInput = VariantInputs<TabListListItemVariantProps>;

type TabListTabVariantProps = VariantProps<typeof tabListTabThemeVariants>;

export type TabListScrollButtonVariantProps = VariantProps<typeof tabListScrollButtonThemeVariants>;

export type TabListScrollButtonVariantInput = VariantInputs<TabListScrollButtonVariantProps>;

type TabContentVariantProps = VariantProps<typeof tabContentThemeVariants>;

type TabContentVariantInput = VariantInputs<TabContentVariantProps>;

type TabsBaseVariantProps = VariantProps<typeof tabsBaseThemeVariants>;

type TabsBaseVariantInput = VariantInputs<TabsBaseVariantProps>;

export type TabListVariantProps = TabListBaseVariantProps &
    TabListListWrapperVariantProps &
    TabListListVariantProps &
    TabListListItemVariantProps &
    TabListTabVariantProps &
    TabListScrollButtonVariantProps;

export type TabListVariantInput = TabListBaseVariantInput &
    TabListListWrapperVariantInput &
    TabListListVariantInput &
    Omit<TabListListItemVariantInput, "active" | "disabled"> &
    TabListScrollButtonVariantInput;

export type TabsVariantProps = TabsBaseVariantProps & TabListVariantProps & TabContentVariantProps;

export type TabsVariantInput = TabsBaseVariantInput & TabListVariantInput & TabContentVariantInput;
