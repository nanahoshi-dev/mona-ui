import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";
import type { TabsPosition } from "../models/TabsPosition";

export const tabListBaseThemeVariants = cva(
    `
        flex max-w-full min-w-0 overflow-hidden
    `,
    {
        variants: {
            position: {
                top: "flex-row border-b border-border",
                bottom: "flex-row border-t border-border",
                left: "flex-col max-h-full min-h-0 border-r border-border",
                right: "flex-col max-h-full min-h-0 border-l border-border"
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
        relative flex shrink-0 cursor-pointer outline-none
        focus-visible:ring-2 focus-visible:ring-focus-indicator/35
        transition-colors duration-(--mona-motion-standard) ease-out
    `,
    {
        variants: {
            active: {
                true: `
                    text-foreground font-semibold
                    after:absolute after:content-[''] after:bg-primary
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
                left: "w-full items-center justify-start text-start after:inset-y-0 after:right-0 after:w-[2px]",
                right: "w-full items-center justify-start text-start after:inset-y-0 after:left-0 after:w-[2px]"
            },
            size: {
                small: "h-8 px-2 text-xs",
                medium: "h-9 px-3 text-sm",
                large: "h-10 px-4 text-sm"
            }
        },
        defaultVariants: {
            position: "top",
            size: "medium"
        }
    }
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
    TabListScrollButtonVariantProps;

export type TabListVariantInput = TabListBaseVariantInput &
    TabListListWrapperVariantInput &
    TabListListVariantInput &
    Omit<TabListListItemVariantInput, "active" | "disabled"> &
    TabListScrollButtonVariantInput;

export type TabsVariantProps = TabsBaseVariantProps & TabListVariantProps & TabContentVariantProps;

export type TabsVariantInput = TabsBaseVariantInput & TabListVariantInput & TabContentVariantInput;
