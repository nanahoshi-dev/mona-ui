import { cva } from "class-variance-authority";

export const stepperBaseVariants = cva(
    `
        relative grid outline-none
    `,
    {
        variants: {
            orientation: {
                horizontal: "h-auto w-full",
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
        absolute z-1 col-span-full flex list-none
        font-medium
    `,
    {
        variants: {
            orientation: {
                horizontal: `
                    w-full flex-row
                    -translate-y-3
                `,
                vertical: `
                    h-full w-max flex-col
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
        z-1 flex grow-1 shrink-0 basis-auto items-center
    `,
    {
        variants: {
            orientation: {
                horizontal: "flex-col gap-2",
                vertical: "flex-row justify-start gap-2"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);

export const stepperStepIndicatorVariants = cva(
    `
        flex h-6.5 w-6.5 items-center justify-center
        bg-surface-raised text-foreground
        border border-border outline-none
        transition-colors duration-400 ease-in-out
    `,
    {
        variants: {
            active: {
                true: "bg-primary text-primary-foreground",
                false: ""
            },
            focused: {
                true: "border-focus-indicator ring-2 ring-focus-indicator/35",
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
        bg-surface-muted text-foreground
        border border-border-subtle
    `,
    {
        variants: {
            orientation: {
                horizontal: "h-2 w-full",
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
                horizontal: "h-full transition-width duration-150 ease-out",
                vertical: "w-full transition-height duration-150 ease-out"
            }
        },
        defaultVariants: {
            orientation: "horizontal"
        }
    }
);
