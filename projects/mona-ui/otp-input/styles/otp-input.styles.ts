import { cva, type VariantProps } from "class-variance-authority";
import { themeControlSurfaceClasses, type VariantInputs } from "@nanahoshi/mona-ui/internal";

export const otpInputHostThemeVariants = cva(
    `
        relative inline-flex items-center gap-2
        outline-none
        transition-[color,box-shadow,border] duration-(--mona-motion-standard) ease-in-out
        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[readonly='true']:cursor-default
    `
);

export const otpInputFieldThemeVariants = cva(
    `pointer-events-none absolute inset-0 size-full opacity-0 outline-none select-none -z-10`
);

export const otpInputSlotThemeVariants = cva(
    `
        relative inline-flex items-center justify-center
        text-center font-mono tabular-nums select-none
        overflow-hidden
        ${themeControlSurfaceClasses} text-foreground
        border border-input-border shadow-(--shadow-control)
        outline-none
        transition-[color,box-shadow,border,background-color] duration-(--mona-motion-standard) ease-in-out

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:border-disabled-border
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:text-disabled-foreground
        data-[disabled='true']:shadow-none

        data-[readonly='true']:cursor-default

        data-[active='true']:border-focus-indicator
        data-[active='true']:ring-2 data-[active='true']:ring-focus-indicator/35
        data-[active='true']:z-10

        data-[selected='true']:bg-primary/10

        data-[placeholder='true']:text-muted-foreground

        data-[invalid='true']:border-error
        data-[invalid='true']:data-[active='true']:border-error
        data-[invalid='true']:data-[active='true']:ring-2
        data-[invalid='true']:data-[active='true']:ring-error/35
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
                large: "h-10 w-10 min-w-10 text-md",
                medium: "h-9 w-9 min-w-9 text-sm",
                small: "h-8 w-8 min-w-8 text-xs"
            }
        },
        defaultVariants: {
            rounded: "medium",
            size: "medium"
        }
    }
);

export type OtpInputSlotVariantProps = VariantProps<typeof otpInputSlotThemeVariants>;
export type OtpInputSlotVariantInput = VariantInputs<OtpInputSlotVariantProps>;

export type OtpInputVariantProps = OtpInputSlotVariantProps;
export type OtpInputVariantInput = OtpInputSlotVariantInput;
