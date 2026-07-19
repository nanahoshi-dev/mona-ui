import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const chipThemeVariants = cva(
    `
        inline-flex shrink-0 items-center justify-between gap-1.5
        cursor-pointer text-xs font-medium
        shadow-(--shadow-control) outline-none
        transition-colors duration-(--mona-motion-fast) ease-in-out
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none opacity-50 cursor-not-allowed select-none",
                false: ""
            },
            look: {
                default: `
                    bg-surface-raised text-foreground
                    border border-border
                    hover:bg-hover hover:text-foreground
                    active:bg-(--color-selected-active) active:text-(--color-selected-active-foreground)
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                primary: `
                    bg-primary text-primary-foreground
                    hover:bg-primary-hover hover:text-primary-foreground
                    active:bg-primary-active active:text-primary-foreground
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                success: `
                    bg-success text-success-foreground
                    hover:bg-success-hover hover:text-success-foreground
                    active:bg-success-active active:text-success-foreground
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                error: `
                    bg-error text-error-foreground
                    hover:bg-error-hover hover:text-error-foreground
                    active:bg-error-active active:text-error-foreground
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                warning: `
                    bg-warning text-warning-foreground
                    hover:bg-warning-hover hover:text-warning-foreground
                    active:bg-warning-active active:text-warning-foreground
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                info: `
                    bg-info text-info-foreground
                    hover:bg-info-hover hover:text-info-foreground
                    active:bg-info-active active:text-info-foreground
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                outline: `
                    bg-transparent text-foreground
                    border border-input-border
                    hover:bg-hover hover:text-foreground
                    active:bg-(--color-selected-active) active:text-(--color-selected-active-foreground)
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                secondary: `
                    bg-secondary text-secondary-foreground
                    hover:bg-secondary-hover hover:text-secondary-foreground
                    active:bg-secondary-active active:text-secondary-foreground
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                ghost: `
                    bg-transparent text-foreground shadow-none
                    hover:bg-hover hover:text-foreground
                    active:bg-(--color-selected-active) active:text-(--color-selected-active-foreground)
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `
            },
            rounded: {
                full: "rounded-full",
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            },
            size: {
                small: `
                    ps-1 pe-1 py-0.5
                    [&_button[data-chip-remove='true']]:w-3
                    [&_button[data-chip-remove='true']]:h-3
                `,
                medium: `
                    ps-1.5 pe-1.5 py-1
                    [&_button[data-chip-remove='true']]:w-4
                    [&_button[data-chip-remove='true']]:h-4
                `,
                large: `
                    ps-2 pe-2 py-1.5
                    [&_button[data-chip-remove='true']]:w-5
                    [&_button[data-chip-remove='true']]:h-5
                `
            },
            selected: {
                true: "",
                false: ""
            }
        },
        compoundVariants: [
            {
                look: "default",
                selected: true,
                class: `
                    bg-(--color-selected) text-(--color-selected-foreground)
                    hover:bg-(--color-selected-hover) hover:text-(--color-selected-hover-foreground)
                    active:bg-(--color-selected-active) active:text-(--color-selected-active-foreground)
                `
            },
            {
                look: "primary",
                selected: true,
                class: `
                    bg-primary-selected text-primary-foreground
                    hover:bg-primary-selected/95 hover:text-primary-foreground
                    active:bg-primary-selected/100 active:text-primary-foreground
                `
            },
            {
                look: "secondary",
                selected: true,
                class: `
                    bg-secondary-selected text-secondary-foreground
                    hover:bg-secondary-selected/95 hover:text-secondary-foreground
                    active:bg-secondary-selected/100 active:text-secondary-foreground
                `
            },
            {
                look: "success",
                selected: true,
                class: `
                    bg-success-selected text-success-foreground
                    hover:bg-success-selected/95 hover:text-success-foreground
                    active:bg-success-selected/100 active:text-success-foreground
                `
            },
            {
                look: "error",
                selected: true,
                class: `
                    bg-error-selected text-error-foreground
                    hover:bg-error-selected/95 hover:text-error-foreground
                    active:bg-error-selected/100 active:text-error-foreground
                `
            },
            {
                look: "warning",
                selected: true,
                class: `
                    bg-warning-selected text-warning-foreground
                    hover:bg-warning-selected/95 hover:text-warning-foreground
                    active:bg-warning-selected/100 active:text-warning-foreground
                `
            },
            {
                look: "info",
                selected: true,
                class: `
                    bg-info-selected text-info-foreground
                    hover:bg-info-selected/95 hover:text-info-foreground
                    active:bg-info-selected/100 active:text-info-foreground
                `
            },
            {
                look: "outline",
                selected: true,
                class: `
                    bg-(--color-selected) text-(--color-selected-foreground)
                    hover:bg-(--color-selected-hover) hover:text-(--color-selected-hover-foreground)
                    active:bg-(--color-selected-active) active:text-(--color-selected-active-foreground)
                `
            },
            {
                look: "ghost",
                selected: true,
                class: `
                    bg-(--color-selected) text-(--color-selected-foreground)
                    hover:bg-(--color-selected-hover) hover:text-(--color-selected-hover-foreground)
                    active:bg-(--color-selected-active) active:text-(--color-selected-active-foreground)
                `
            }
        ],
        defaultVariants: {
            selected: false
        }
    }
);

export type ChipVariantProps = VariantProps<typeof chipThemeVariants>;

export type ChipVariantInputs = VariantInputs<ChipVariantProps>;
