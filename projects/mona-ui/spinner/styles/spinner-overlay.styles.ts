import { cva, type VariantProps } from "class-variance-authority";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";

export const spinnerOverlayThemeVariants = cva(
    `
        flex items-center justify-center
        pointer-events-auto select-none
        bg-background/60 backdrop-blur-xs
        text-foreground
    `,
    {
        variants: {
            fullPage: {
                true: "fixed inset-0 z-50",
                false: "absolute inset-0 z-1"
            }
        },
        defaultVariants: {
            fullPage: false
        }
    }
);

export type SpinnerOverlayVariantProps = VariantProps<typeof spinnerOverlayThemeVariants>;

export type SpinnerOverlayVariantInput = VariantInputs<SpinnerOverlayVariantProps>;
