import { cva } from "class-variance-authority";

// Rows are spaced with margins, not a gap, so the error row takes no room while it's empty. It stays rendered because
// it's the live region that announces new errors.

export const formFieldThemeVariants = cva(
    `
        grid
        min-w-0
    `,
    {
        variants: {
            orientation: {
                horizontal: "grid-cols-[var(--mona-form-field-label-width,10rem)_minmax(0,1fr)] gap-x-4",
                vertical: "grid-cols-1"
            }
        },
        defaultVariants: {
            orientation: "vertical"
        }
    }
);

export const formFieldLabelThemeVariants = cva(
    `
        inline-flex
        flex-wrap
        items-baseline
        justify-self-start
        text-sm
        font-medium
        leading-snug
        text-foreground
    `,
    {
        variants: {
            orientation: {
                horizontal: "col-start-1 row-start-1 self-center",
                vertical: "mb-1.5"
            }
        },
        defaultVariants: {
            orientation: "vertical"
        }
    }
);

export const formFieldOptionalThemeVariants = cva(
    `
        ms-1
        text-xs
        font-normal
        text-muted-foreground
    `
);

export const formFieldRequiredThemeVariants = cva(
    `
        ms-0.5
        text-error
    `
);

export const formFieldControlThemeVariants = cva(
    `
        min-w-0
    `,
    {
        variants: {
            orientation: {
                horizontal: "col-start-2 row-start-1",
                vertical: ""
            }
        },
        defaultVariants: {
            orientation: "vertical"
        }
    }
);

export const formFieldHintThemeVariants = cva(
    `
        mt-1.5
        text-xs
        text-muted-foreground
    `,
    {
        variants: {
            orientation: {
                horizontal: "col-start-2",
                vertical: ""
            }
        },
        defaultVariants: {
            orientation: "vertical"
        }
    }
);

export const formFieldErrorThemeVariants = cva(
    `
        text-xs
        text-error
    `,
    {
        variants: {
            orientation: {
                horizontal: "col-start-2",
                vertical: ""
            }
        },
        defaultVariants: {
            orientation: "vertical"
        }
    }
);

export const formFieldErrorItemThemeVariants = cva(
    `
        mt-1.5
    `
);
