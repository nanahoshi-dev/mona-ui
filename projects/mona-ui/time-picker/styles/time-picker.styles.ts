import { cva } from "class-variance-authority";
import { themeControlSurfaceClasses, type VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { VariantProps } from "class-variance-authority";

export const timePickerBaseThemeVariants = cva(
    `
        flex w-full items-center
        ${themeControlSurfaceClasses} text-foreground
        border border-input-border shadow-(--shadow-control)
        outline-none focus-visible:outline-hidden

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:border-disabled-border
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:text-disabled-foreground
        data-[disabled='true']:shadow-none
        data-[readonly='true']:cursor-default

        focus-within:border-focus-indicator
        focus-within:ring-(length:--mona-focus-ring-width,2px) focus-within:ring-focus-indicator/(--mona-focus-ring-opacity,35%)

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-(length:--mona-focus-ring-width,2px) data-[invalid='true']:ring-error/(--mona-focus-ring-opacity,35%)
        data-[invalid='true']:focus-within:border-error
        data-[invalid='true']:focus-within:ring-error/(--mona-focus-ring-opacity,35%)

        [&_mona-text-box]:h-full
        [&_mona-text-box]:border-none
        [&_mona-text-box]:shadow-none
        [&_mona-text-box]:focus-within:ring-0
        [&_mona-text-box[data-invalid='true']]:ring-0
    `,
    {
        variants: {
            focused: {
                true: "border-focus-indicator ring-(length:--mona-focus-ring-width,2px) ring-focus-indicator/(--mona-focus-ring-opacity,35%)",
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
                large: "h-10 text-base",
                medium: "h-9 text-sm",
                small: "h-8 text-xs"
            }
        },
        compoundVariants: [
            {
                focused: true,
                class: "data-[invalid='true']:border-error data-[invalid='true']:ring-error/(--mona-focus-ring-opacity,35%)"
            }
        ]
    }
);

type TimePickerBaseVariantProps = VariantProps<typeof timePickerBaseThemeVariants>;

type TimePickerBaseVariantInput = VariantInputs<TimePickerBaseVariantProps>;

export type TimePickerVariantProps = TimePickerBaseVariantProps;

export type TimePickerVariantInput = Omit<TimePickerBaseVariantInput, "focused">;
