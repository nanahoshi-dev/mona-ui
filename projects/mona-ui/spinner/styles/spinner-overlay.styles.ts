import { cva, type VariantProps } from "class-variance-authority";
import { themeBackdropFilterClasses, type VariantInputs } from "@nanahoshi/mona-ui/internal";

export const spinnerOverlayThemeVariants = cva(
    `
        isolate flex items-center justify-center
        pointer-events-auto select-none
        bg-background/60 ${themeBackdropFilterClasses}
        text-foreground
    `,
    {
        variants: {
            fullPage: {
                true: "fixed inset-0",
                false: "absolute inset-0"
            }
        },
        defaultVariants: {
            fullPage: false
        }
    }
);

export type SpinnerOverlayVariantProps = VariantProps<typeof spinnerOverlayThemeVariants>;

export type SpinnerOverlayVariantInput = VariantInputs<SpinnerOverlayVariantProps>;
