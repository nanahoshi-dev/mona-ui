import type { VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export const splitterBaseThemeVariants = cva(
    `
        flex h-full w-full min-h-0 min-w-0 overflow-hidden
    `,
    {
        variants: {
            orientation: {
                horizontal: "flex-row",
                vertical: "flex-col"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);

/** The bar's place in the layout. Above the panes, because its hit area and focus outline reach over them. */
export const splitterResizerThemeVariants = cva(`relative z-10 flex shrink-0 items-center justify-center`, {
    variants: {
        orientation: {
            horizontal: "w-0.5 flex-col",
            vertical: "h-0.5 flex-row"
        }
    },
    defaultVariants: {
        orientation: "horizontal"
    }
});

/**
 * The bar itself. It's 2 pixels wide, so the hit area reaches past it: 12 pixels, or 24 for a coarse pointer, where more
 * of the pane can be given up. `touch-none`, or the browser takes a touch drag as a scroll and cancels the pointer.
 */
export const splitterSeparatorThemeVariants = cva(
    `
        absolute inset-0 touch-none
        transition-colors
        hover:bg-border-control active:bg-border-control-hover
        focus-visible:bg-border-control
        focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-indicator
        forced-color-adjust-none forced-colors:bg-[CanvasText]
        before:absolute before:content-['']
    `,
    {
        variants: {
            orientation: {
                horizontal: "before:inset-y-0 before:-inset-x-[5px] pointer-coarse:before:-inset-x-[11px]",
                vertical: "before:inset-x-0 before:-inset-y-[5px] pointer-coarse:before:-inset-y-[11px]"
            },
            resizing: {
                true: "bg-border-control-hover",
                false: "bg-border-subtle"
            }
        },
        defaultVariants: {
            orientation: "horizontal",
            resizing: false
        }
    }
);

/** Sits over the bar without taking its pointer, except for the buttons, which are 24 pixels so a finger can hit them. */
export const splitterResizerHandleThemeVariants = cva(
    `
        pointer-events-none
        flex items-center justify-center
        [&_button]:pointer-events-auto [&_button]:size-6 [&_button]:p-0
    `,
    {
        variants: {
            orientation: {
                horizontal: "flex-row",
                vertical: "flex-col"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);

type SplitterBaseVariantProps = VariantProps<typeof splitterBaseThemeVariants>;

type SplitterBaseVariantInput = VariantInputs<SplitterBaseVariantProps>;

type SplitterResizerVariantProps = VariantProps<typeof splitterResizerThemeVariants>;

type SplitterResizerVariantInput = VariantInputs<SplitterResizerVariantProps>;

type SplitterResizerHandleVariantProps = VariantProps<typeof splitterResizerHandleThemeVariants>;

type SplitterResizerHandleVariantInput = VariantInputs<SplitterResizerHandleVariantProps>;

export type SplitterVariantProps = SplitterBaseVariantProps &
    SplitterResizerVariantProps &
    SplitterResizerHandleVariantProps;

export type SplitterVariantInput = SplitterBaseVariantInput &
    SplitterResizerVariantInput &
    SplitterResizerHandleVariantInput;
