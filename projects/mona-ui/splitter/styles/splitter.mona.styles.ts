import { cva } from "class-variance-authority";

export const splitterBaseVariants = cva(
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

export const splitterResizerVariants = cva(
    `
        relative flex shrink-0 items-center justify-center
        bg-border-subtle outline-none
        transition-colors
        hover:bg-border-control active:bg-border-control-hover
        focus-visible:bg-border-control
        focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-indicator/35
    `,
    {
        variants: {
            orientation: {
                horizontal: "w-0.5 flex-col ",
                vertical: "h-0.5 flex-row"
            },
            resizing: {
                true: "bg-border-control-hover",
                false: ""
            }
        },
        defaultVariants: {
            orientation: "horizontal",
            resizing: false
        }
    }
);

export const splitterResizerHandleVariants = cva(
    `
        flex items-center justify-center
        [&_button]:p-0
    `,
    {
        variants: {
            orientation: {
                horizontal: "flex-row [&_button]:w-3.5 [&_button]:h-6",
                vertical: "flex-col [&_button]:h-3.5 [&_button]:w-6"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);
