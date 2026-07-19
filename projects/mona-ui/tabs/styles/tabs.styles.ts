import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const tabListBaseThemeVariants = cva(
    `
        flex w-fit max-w-full overflow-hidden
        text-sm font-medium
        bg-surface-muted
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            },
            size: {
                small: "h-8",
                medium: "h-9",
                large: "h-10"
            }
        }
    }
);

export const tabListListWrapperThemeVariants = cva(`h-full w-full overflow-hidden`);

export const tabListListThemeVariants = cva(
    `
        flex h-full w-full list-none overflow-hidden p-[3px]
        cursor-default select-none whitespace-nowrap
        transition-colors duration-(--mona-motion-standard) ease-out
    `
);

export const tabListListItemThemeVariants = cva(
    `
        flex items-center justify-center px-2
        cursor-pointer outline-none
        focus-visible:ring-2 focus-visible:ring-focus-indicator/35
    `,
    {
        variants: {
            active: {
                true: "bg-surface-raised font-semibold text-foreground shadow-(--shadow-control) inset-ring-1 inset-ring-border-subtle",
                false: ""
            },
            disabled: {
                true: "pointer-events-none cursor-not-allowed select-none text-disabled-foreground",
                false: ""
            },
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            }
        },
        defaultVariants: {
            rounded: "medium"
        }
    }
);

export const tabListScrollButtonThemeVariants = cva(
    `
        flex h-full items-center justify-center px-2
        text-muted-foreground
        hover:bg-hover hover:text-foreground
        active:bg-active
    `
);

export const tabContentThemeVariants = cva(
    `
        flex-1 w-full overflow-auto
        [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]
        bg-(--mona-tab-content-background) text-foreground
        border border-border shadow-(--shadow-raised)
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            }
        },
        defaultVariants: {
            rounded: "medium"
        }
    }
);

export const tabsBaseThemeVariants = cva(
    `
        flex max-w-full flex-col gap-2
    `
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
