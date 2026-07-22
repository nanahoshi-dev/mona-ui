import { cva } from "class-variance-authority";
import { themeControlSurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const textAreaThemeVariants = cva(
    `
        px-2 py-1
        text-sm text-foreground
        ${themeControlSurfaceClasses}
        border border-input-border shadow-(--shadow-control)
        outline-none
        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border] duration-(--mona-motion-standard) ease-in-out
        placeholder:text-muted-foreground

        disabled:pointer-events-none disabled:cursor-not-allowed disabled:select-none
        disabled:border-disabled-border disabled:bg-disabled-background disabled:text-disabled-foreground
        disabled:shadow-none
        read-only:cursor-default

        focus-visible:border-focus-indicator
        focus-visible:ring-2 focus-visible:ring-focus-indicator/35

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        data-[invalid='true']:focus-visible:border-error
        data-[invalid='true']:focus-visible:ring-error/35
    `,
    {
        variants: {
            rounded: {
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            }
        }
    }
);

export type TextAreaVariantProps = VariantProps<typeof textAreaThemeVariants>;

export type TextAreaVariantInput = VariantInputs<TextAreaVariantProps>;
