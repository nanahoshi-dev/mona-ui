import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { themeSelectionBorderClasses } from "@nanahoshi/mona-ui/internal";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

/** A line strip is ruled off from the content beside it. A pill strip stands on its own, as in a titlebar. */
export const tabListBaseThemeVariants = cva(
    `
        flex max-w-full min-w-0 overflow-hidden
    `,
    {
        variants: {
            look: {
                line: "",
                pill: ""
            },
            position: {
                top: "flex-row",
                bottom: "flex-row",
                left: "flex-col max-h-full min-h-0",
                right: "flex-col max-h-full min-h-0"
            }
        },
        compoundVariants: [
            { look: "line", position: "top", class: "border-b border-border" },
            { look: "line", position: "bottom", class: "border-t border-border" },
            { look: "line", position: "left", class: "border-e border-border" },
            { look: "line", position: "right", class: "border-s border-border" }
        ],
        defaultVariants: {
            look: "line",
            position: "top"
        }
    }
);

export const tabListListWrapperThemeVariants = cva(`flex-1 min-w-0 min-h-0 overflow-hidden`);

/** Pills are spaced apart, and inset so the strip, which clips, doesn't cut off the selected one's shadow. */
export const tabListListThemeVariants = cva(
    `
        flex list-none overflow-hidden
        cursor-default select-none whitespace-nowrap
        transition-colors duration-(--mona-motion-standard) ease-out
    `,
    {
        variants: {
            look: {
                line: "",
                pill: "gap-1 p-1"
            },
            position: {
                top: "flex-row max-w-full min-w-0",
                bottom: "flex-row max-w-full min-w-0",
                left: "flex-col max-h-full min-h-0",
                right: "flex-col max-h-full min-h-0"
            }
        },
        defaultVariants: {
            look: "line",
            position: "top"
        }
    }
);

/**
 * A tab being dragged to a new place floats as a raised copy of itself.
 *
 * A line tab marks the selection with an indicator along the strip's edge. A pill tab raises the selected tab on a
 * background: `--mona-tab-pill-background` when it's set, else the raised surface. Shadows and backgrounds don't paint
 * in forced colors, so there the selected pill is ringed in the highlight color, and in the text color when the user
 * asks for more contrast. Pill tabs keep one weight, so selecting one doesn't shift the strip.
 */
export const tabListListItemThemeVariants = cva(
    `
        relative flex shrink-0 cursor-pointer
        transition-colors duration-(--mona-motion-standard) ease-out
        [&.cdk-drag-preview]:rounded-md [&.cdk-drag-preview]:border [&.cdk-drag-preview]:border-border
        [&.cdk-drag-preview]:bg-surface-raised
    `,
    {
        variants: {
            active: {
                true: "text-foreground",
                false: "text-muted-foreground hover:bg-hover hover:text-foreground"
            },
            disabled: {
                true: "pointer-events-none cursor-not-allowed select-none text-disabled-foreground",
                false: ""
            },
            look: {
                line: "",
                pill: "rounded-md font-medium"
            },
            position: {
                top: "items-center justify-center whitespace-nowrap",
                bottom: "items-center justify-center whitespace-nowrap",
                left: "w-full items-center justify-start text-start",
                right: "w-full items-center justify-start text-start"
            },
            size: {
                small: "text-xs",
                medium: "text-sm",
                large: "text-sm"
            }
        },
        compoundVariants: [
            {
                look: "line",
                active: true,
                class: `
                    font-semibold
                    after:absolute after:content-[''] after:bg-[var(--mona-indicator-color,var(--color-primary))]
                    after:forced-color-adjust-none forced-colors:after:bg-[Highlight]
                `
            },
            { look: "line", disabled: true, class: "after:hidden" },
            { look: "line", position: "top", class: "after:inset-x-0 after:bottom-0 after:h-[2px]" },
            { look: "line", position: "bottom", class: "after:inset-x-0 after:top-0 after:h-[2px]" },
            { look: "line", position: "left", class: "after:inset-y-0 after:end-0 after:w-[2px]" },
            { look: "line", position: "right", class: "after:inset-y-0 after:start-0 after:w-[2px]" },
            { look: "line", size: "small", class: "h-8" },
            { look: "line", size: "medium", class: "h-9" },
            { look: "line", size: "large", class: "h-10" },
            {
                look: "pill",
                active: true,
                class: `
                    [background-color:var(--mona-tab-pill-background,var(--color-surface-raised))] shadow-(--shadow-raised)
                    ${themeSelectionBorderClasses}
                    after:content-[''] after:forced-color-adjust-none forced-colors:after:border-[Highlight]
                `
            },
            { look: "pill", size: "small", class: "h-7" },
            { look: "pill", size: "medium", class: "h-8" },
            { look: "pill", size: "large", class: "h-9" }
        ],
        defaultVariants: {
            look: "line",
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
            look: {
                line: "",
                pill: "rounded-md"
            },
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
            look: "line",
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

/** A strip in a row of other controls, such as a titlebar's, shrinks with the row and scrolls its tabs. */
export const tabStripThemeVariants = cva(
    `
        flex max-w-full min-w-0
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

/** A strip is always horizontal, so it has no position. */
export type TabStripVariantProps = Omit<TabListVariantProps, "position">;

export type TabStripVariantInput = Omit<TabListVariantInput, "position">;
