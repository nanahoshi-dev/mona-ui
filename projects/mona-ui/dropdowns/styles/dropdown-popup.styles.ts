import { cva } from "class-variance-authority";
import { themeOverlaySurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const dropdownPopupThemeVariants = cva(
    `
        h-full max-h-64 overflow-auto
        [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]
        text-foreground
        ${themeOverlaySurfaceClasses}
        border border-border shadow-(--shadow-overlay)
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
                large: "text-md",
                medium: "text-sm",
                small: "text-xs"
            }
        },
        defaultVariants: {
            rounded: "medium",
            size: "medium"
        }
    }
);

export type DropdownPopupVariantProps = VariantProps<typeof dropdownPopupThemeVariants>;

export type DropdownPopupVariantInput = VariantInputs<DropdownPopupVariantProps>;
