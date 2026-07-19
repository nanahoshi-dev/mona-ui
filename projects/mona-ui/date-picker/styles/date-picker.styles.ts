import { cva } from "class-variance-authority";
import { themeControlSurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const datePickerBaseThemeVariants = cva(
    `
        flex w-auto items-center
        ${themeControlSurfaceClasses} text-foreground
        border border-input-border shadow-(--shadow-control)
        outline-none

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

        [&_mona-text-box]:h-full
        [&_mona-text-box]:border-none
        [&_mona-text-box]:shadow-none
        [&_mona-text-box]:focus-within:ring-0
        [&_mona-text-box[data-invalid='true']]:ring-0
    `,
    {
        variants: {
            focused: {
                true: "border-focus-indicator ring-2 ring-focus-indicator/35",
                false: ""
            },
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
        },
        compoundVariants: [
            {
                focused: true,
                class: "data-[invalid='true']:border-error data-[invalid='true']:ring-error/35"
            }
        ]
    }
);

type DatePickerBaseVariantProps = VariantProps<typeof datePickerBaseThemeVariants>;

type DatePickerBaseVariantInput = VariantInputs<DatePickerBaseVariantProps>;

export type DatePickerVariantProps = DatePickerBaseVariantProps;

export type DatePickerVariantInput = Omit<DatePickerBaseVariantInput, "focused">;
