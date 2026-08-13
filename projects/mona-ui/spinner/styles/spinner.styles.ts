import { cva, type VariantProps } from "class-variance-authority";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";

export const spinnerThemeVariants = cva("inline-flex items-center justify-center flex-none aspect-square relative text-current select-none", {
    variants: {
        size: {
            small: "w-3 h-3",
            medium: "w-4 h-4",
            large: "w-6 h-6"
        }
    },
    defaultVariants: {
        size: "medium"
    }
});

export type SpinnerVariantProps = VariantProps<typeof spinnerThemeVariants>;

export type SpinnerVariantInput = VariantInputs<SpinnerVariantProps>;
