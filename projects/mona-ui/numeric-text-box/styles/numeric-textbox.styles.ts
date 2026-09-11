import { cva } from "class-variance-authority";
import { themeControlSurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const numericTextboxThemeVariants = cva(
    `
        flex w-full min-w-0 items-center
        overflow-hidden p-0
        ${themeControlSurfaceClasses} text-foreground
        border border-input-border shadow-(--shadow-control)
        outline-none
        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border] duration-300 ease-in-out
        placeholder:text-muted-foreground

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:border-disabled-border
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:text-disabled-foreground
        data-[disabled='true']:shadow-none
        data-[readonly='true']:cursor-default

        focus-within:border-focus-indicator
        focus-within:ring-2 focus-within:ring-focus-indicator/35

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        data-[invalid='true']:focus-within:border-error
        data-[invalid='true']:focus-within:ring-error/35
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            },
            size: {
                large: "h-10 text-md",
                medium: "h-9 text-sm",
                small: "h-8 text-xs"
            }
        }
    }
);

export const numericTextboxInputThemeVariants = cva(
    `
        h-full w-full
        bg-transparent
        border-0 shadow-none
        rounded-none
        outline-none ring-0
        focus-visible:border-transparent focus-visible:ring-0
    `,
    {
        variants: {
            startRounded: {
                full: "rounded-s-full",
                large: "rounded-s-lg",
                medium: "rounded-s-md",
                none: "rounded-s-none",
                small: "rounded-s-sm"
            },
            endRounded: {
                full: `
                    rounded-e-full
                    data-[spinners='true']:rounded-e-none
                `,
                large: `
                    rounded-e-lg
                    data-[spinners='true']:rounded-e-none
                `,
                medium: `
                    rounded-e-md
                    data-[spinners='true']:rounded-e-none
                `,
                none: `
                    rounded-e-none
                    data-[spinners='true']:rounded-e-none
                `,
                small: `
                    rounded-e-sm
                    data-[spinners='true']:rounded-e-none
                `
            }
        }
    }
);

export const numericTextboxButtonThemeVariants = cva(
    `
        flex h-full flex-col
        overflow-y-hidden
        border-s border-border-subtle

        [&>button]:flex [&>button]:flex-1 [&>button]:items-center
        [&>button]:rounded-none [&>button]:p-0
        [&>button]:first:rounded-s-none
        [&>button]:first:rounded-b-none
        [&>button]:first:h-1/2
        [&>button]:last:rounded-s-none
        [&>button]:last:rounded-t-none
        [&>button]:last:h-1/2
    `,
    {
        variants: {
            size: {
                large: "w-16 min-w-16",
                medium: "w-10 min-w-10",
                small: "w-8 min-w-8"
            }
        }
    }
);

export type NumericTextboxVariantProps = VariantProps<typeof numericTextboxThemeVariants>;

export type NumericTextboxVariantInputs = VariantInputs<NumericTextboxVariantProps>;
