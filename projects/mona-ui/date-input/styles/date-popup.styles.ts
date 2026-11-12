import { cva } from "class-variance-authority";
import { themeOverlaySurfaceClasses, type VariantInputs } from "@nanahoshi/mona-ui/internal";
import type { VariantProps } from "class-variance-authority";

/** @hidden Exported for Mona UI's other entry points; applications don't need it. */
export const datePopupThemeVariants = cva(
    `
        h-full overflow-auto
        [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]
        ${themeOverlaySurfaceClasses} text-foreground
        border border-border shadow-(--shadow-overlay)
        [&_mona-calendar]:[background-color:var(--mona-date-popup-calendar-background,var(--mona-calendar-background))]!
        [&_mona-calendar]:[background-image:var(--mona-date-popup-calendar-background-image,var(--mona-effect-raised-background-image))]!
        [&_mona-calendar]:[backdrop-filter:var(--mona-date-popup-calendar-backdrop-filter,var(--mona-effect-raised-backdrop-filter))]!
        [&_mona-calendar]:[-webkit-backdrop-filter:var(--mona-date-popup-calendar-backdrop-filter,var(--mona-effect-raised-backdrop-filter))]!
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
                medium: "text-base",
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
