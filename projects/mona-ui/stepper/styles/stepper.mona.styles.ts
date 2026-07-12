import { cva } from "class-variance-authority";

export const stepperBaseVariants = cva(
    `
        relative grid outline-none
    `,
    {
        variants: {
            orientation: {
                horizontal: "w-full h-auto",
                vertical: "h-full w-auto"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);

export const stepperStepListVariants = cva(
    `
        absolute flex list-none col-span-full
        font-medium z-1
    `,
    {
        variants: {
            orientation: {
                horizontal: `
                    flex-row w-full
                    -translate-y-3
                `,
                vertical: `
                    flex-col h-full w-max
                    -translate-x-3
                `
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);

export const stepperStepListItemVariants = cva(
    `
        flex items-center
        grow-1 shrink-0 basis-auto
        z-1
    `,
    {
        variants: {
            orientation: {
                horizontal: "flex-col gap-2",
                vertical: "flex-row gap-2 justify-start"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);

export const stepperStepIndicatorVariants = cva(
    `
        w-8 h-8
        flex items-center justify-center
        bg-surface border border-border
        text-foreground outline-none
        transition-colors duration-150 ease-in-out motion-reduce:transition-none
    `,
    {
        variants: {
            active: {
                true: "bg-primary text-primary-foreground",
                false: ""
            },
            focused: {
                true: "ring-2 ring-focus-indicator/35",
                false: ""
            },
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            }
        }
    }
);

export const stepperTrackVariants = cva(
    `
        relative grid
        bg-surface text-foreground border border-border
    `,
    {
        variants: {
            orientation: {
                horizontal: "w-full h-2",
                vertical: "h-full w-2"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);

export const stepperTrackLineVariants = cva(
    `
        absolute bg-primary
    `,
    {
        variants: {
            orientation: {
                horizontal: "h-full transition-[width] duration-150 ease-in-out motion-reduce:transition-none",
                vertical: "w-full transition-[height] duration-150 ease-in-out motion-reduce:transition-none"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);
