import { cva, type VariantProps } from "class-variance-authority";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";

/**
 * The shape every badge shares, the sidebar's included. The transparent border keeps the badge's edge in forced colors,
 * where its fill doesn't paint.
 * @hidden
 */
export const BADGE_BASE_CLASSES = `
    inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap
    border border-transparent font-medium tabular-nums
    forced-colors:border-[CanvasText]
    [&>svg]:pointer-events-none [&>svg]:shrink-0
`;

export const badgeThemeVariants = cva(BADGE_BASE_CLASSES, {
    variants: {
        fill: {
            outline: "bg-transparent",
            solid: "",
            subtle: ""
        },
        look: {
            error: "",
            info: "",
            primary: "",
            secondary: "",
            success: "",
            warning: ""
        },
        rounded: {
            full: "rounded-full",
            large: "rounded-lg",
            medium: "rounded-md",
            none: "rounded-none",
            small: "rounded-sm"
        },
        size: {
            small: "h-4 min-w-4 px-1 text-[0.625rem] leading-none [&>svg]:size-2.5",
            medium: "h-5 min-w-5 px-1.5 text-xs [&>svg]:size-3",
            large: "h-6 min-w-6 px-2 text-sm [&>svg]:size-3.5"
        }
    },
    compoundVariants: [
        { fill: "solid", look: "primary", class: "bg-primary text-primary-foreground" },
        { fill: "solid", look: "secondary", class: "bg-secondary text-secondary-foreground" },
        { fill: "solid", look: "success", class: "bg-success text-success-foreground" },
        { fill: "solid", look: "warning", class: "bg-warning text-warning-foreground" },
        { fill: "solid", look: "error", class: "bg-error text-error-foreground" },
        { fill: "solid", look: "info", class: "bg-info text-info-foreground" },
        { fill: "subtle", look: "primary", class: "bg-primary-subtle text-primary-subtle-foreground" },
        { fill: "subtle", look: "secondary", class: "bg-secondary-subtle text-secondary-subtle-foreground" },
        { fill: "subtle", look: "success", class: "bg-success-subtle text-success-subtle-foreground" },
        { fill: "subtle", look: "warning", class: "bg-warning-subtle text-warning-subtle-foreground" },
        { fill: "subtle", look: "error", class: "bg-error-subtle text-error-subtle-foreground" },
        { fill: "subtle", look: "info", class: "bg-info-subtle text-info-subtle-foreground" },
        { fill: "outline", look: "primary", class: "border-primary-border text-foreground" },
        { fill: "outline", look: "secondary", class: "border-border text-foreground" },
        { fill: "outline", look: "success", class: "border-success-border text-foreground" },
        { fill: "outline", look: "warning", class: "border-warning-border text-foreground" },
        { fill: "outline", look: "error", class: "border-error-border text-foreground" },
        { fill: "outline", look: "info", class: "border-info-border text-foreground" }
    ],
    defaultVariants: {
        fill: "solid",
        look: "secondary",
        rounded: "medium",
        size: "medium"
    }
});

export type BadgeVariantProps = VariantProps<typeof badgeThemeVariants>;

export type BadgeVariantInputs = VariantInputs<BadgeVariantProps>;
