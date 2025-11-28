import { cva } from "class-variance-authority";

export const splitterBaseVariants = cva(
    `
        flex w-full h-full overflow-hidden min-w-0 min-h-0
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
        flex items-center justify-center
        relative bg-accent
        hover:bg-accent-hover
        active:bg-primary/40
        shrink-0 outline-none
        focus-visible:bg-primary
    `,
    {
        variants: {
            orientation: {
                horizontal: "w-0.5 flex-col ",
                vertical: "h-0.5 flex-row"
            },
            resizing: {
                true: "",
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
