import { cva } from "class-variance-authority";
import { themeOverlaySurfaceClasses, type VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { VariantProps } from "class-variance-authority";

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
export const dropdownPopupThemeVariants = cva(
    `
        h-full max-h-64 overflow-auto
        [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]
        text-foreground
        ${themeOverlaySurfaceClasses}
        [&_mona-list]:[background-color:var(--mona-dropdown-popup-list-background,var(--mona-list-background))]!
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
                large: "text-base",
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
