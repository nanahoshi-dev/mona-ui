import { cva } from "class-variance-authority";
import { themeOverlaySurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const datePopupThemeVariants = cva(
    `
        h-full overflow-auto
        [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]
        ${themeOverlaySurfaceClasses} text-foreground
        border border-border shadow-(--shadow-overlay)
        [&_mona-calendar]:border-none
        [&_mona-calendar]:shadow-none
    `,
    {
        variants: {
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-lg"
            },
            size: {
                large: "text-lg",
                medium: "text-md",
                small: "text-sm"
            }
        },
        defaultVariants: {
            rounded: "medium",
            size: "medium"
        }
    }
);

export type DatePopupVariantProps = VariantProps<typeof datePopupThemeVariants>;

export type DatePopupVariantInput = VariantInputs<DatePopupVariantProps>;
