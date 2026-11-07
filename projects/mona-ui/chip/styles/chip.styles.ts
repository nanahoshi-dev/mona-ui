import { cva } from "class-variance-authority";
import { themeRaisedSurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

/**
 * The removable, interactive chip's own control, beside the remove button. Its focus ring stays off that button.
 */
export const CHIP_BODY_CONTROL_CLASSES = `
    inline-flex items-center gap-1.5 [border-radius:inherit]
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-indicator
`;

export const chipThemeVariants = cva(
    `
        relative inline-flex shrink-0 items-center justify-between gap-1.5
        text-xs font-medium
        shadow-(--shadow-control)
        transition-colors duration-(--mona-motion-fast) ease-in-out motion-reduce:transition-none
        [&_button[data-chip-remove='true']]:relative
        [&_button[data-chip-remove='true']]:before:absolute
    `,
    {
        variants: {
            disabled: {
                true: "pointer-events-none opacity-50 cursor-not-allowed select-none",
                false: ""
            },
            interactive: {
                true: `
                    cursor-pointer
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-indicator
                `,
                false: ""
            },
            look: {
                default: `
                    ${themeRaisedSurfaceClasses} text-foreground
                    border border-border
                `,
                primary: "bg-primary text-primary-foreground",
                success: "bg-success text-success-foreground",
                error: "bg-error text-error-foreground",
                warning: "bg-warning text-warning-foreground",
                info: "bg-info text-info-foreground",
                outline: "bg-transparent text-foreground border border-input-border",
                secondary: "bg-secondary text-secondary-foreground",
                ghost: "bg-transparent text-foreground shadow-none"
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
                    px-1 py-0.5
                    [&_button[data-chip-remove='true']]:w-3
                    [&_button[data-chip-remove='true']]:h-3
                    [&_button[data-chip-remove='true']]:before:-inset-1.5
                `,
                medium: `
                    px-1.5 py-1
                    [&_button[data-chip-remove='true']]:w-4
                    [&_button[data-chip-remove='true']]:h-4
                    [&_button[data-chip-remove='true']]:before:-inset-1
                `,
                large: `
                    px-2 py-1.5
                    [&_button[data-chip-remove='true']]:w-5
                    [&_button[data-chip-remove='true']]:h-5
                    [&_button[data-chip-remove='true']]:before:-inset-0.5
                `
            },
            selected: {
                // A border in the text's color, so selected doesn't rest on the background alone, and forced colors keep it.
                true: `
                    after:pointer-events-none after:absolute after:inset-0
                    after:rounded-[inherit] after:border-2 after:border-current
                `,
                false: ""
            }
        },
        compoundVariants: [
            {
                look: "default",
                selected: true,
                class: "bg-(--color-selected) text-(--color-selected-foreground)"
            },
            {
                look: "primary",
                selected: true,
                class: "bg-primary-selected text-primary-foreground"
            },
            {
                look: "secondary",
                selected: true,
                class: "bg-secondary-selected text-secondary-foreground"
            },
            {
                look: "success",
                selected: true,
                class: "bg-success-selected text-success-foreground"
            },
            {
                look: "error",
                selected: true,
                class: "bg-error-selected text-error-foreground"
            },
            {
                look: "warning",
                selected: true,
                class: "bg-warning-selected text-warning-foreground"
            },
            {
                look: "info",
                selected: true,
                class: "bg-info-selected text-info-foreground"
            },
            {
                look: "outline",
                selected: true,
                class: "bg-(--color-selected) text-(--color-selected-foreground)"
            },
            {
                look: "ghost",
                selected: true,
                class: "bg-(--color-selected) text-(--color-selected-foreground)"
            },
            {
                look: "default",
                interactive: true,
                selected: false,
                class: `
                    hover:bg-hover hover:text-foreground
                    active:bg-(--color-selected-active) active:text-(--color-selected-active-foreground)
                `
            },
            {
                look: "primary",
                interactive: true,
                selected: false,
                class: `
                    hover:bg-primary-hover hover:text-primary-foreground
                    active:bg-primary-active active:text-primary-foreground
                `
            },
            {
                look: "secondary",
                interactive: true,
                selected: false,
                class: `
                    hover:bg-secondary-hover hover:text-secondary-foreground
                    active:bg-secondary-active active:text-secondary-foreground
                `
            },
            {
                look: "success",
                interactive: true,
                selected: false,
                class: `
                    hover:bg-success-hover hover:text-success-foreground
                    active:bg-success-active active:text-success-foreground
                `
            },
            {
                look: "error",
                interactive: true,
                selected: false,
                class: `
                    hover:bg-error-hover hover:text-error-foreground
                    active:bg-error-active active:text-error-foreground
                `
            },
            {
                look: "warning",
                interactive: true,
                selected: false,
                class: `
                    hover:bg-warning-hover hover:text-warning-foreground
                    active:bg-warning-active active:text-warning-foreground
                `
            },
            {
                look: "info",
                interactive: true,
                selected: false,
                class: `
                    hover:bg-info-hover hover:text-info-foreground
                    active:bg-info-active active:text-info-foreground
                `
            },
            {
                look: "outline",
                interactive: true,
                selected: false,
                class: `
                    hover:bg-hover hover:text-foreground
                    active:bg-(--color-selected-active) active:text-(--color-selected-active-foreground)
                `
            },
            {
                look: "ghost",
                interactive: true,
                selected: false,
                class: `
                    hover:bg-hover hover:text-foreground
                    active:bg-(--color-selected-active) active:text-(--color-selected-active-foreground)
                `
            },
            {
                look: "default",
                interactive: true,
                selected: true,
                class: `
                    hover:bg-(--color-selected-hover) hover:text-(--color-selected-hover-foreground)
                    active:bg-(--color-selected-active) active:text-(--color-selected-active-foreground)
                `
            },
            {
                look: "primary",
                interactive: true,
                selected: true,
                class: `
                    hover:bg-primary-selected/95 hover:text-primary-foreground
                    active:bg-primary-selected/100 active:text-primary-foreground
                `
            },
            {
                look: "secondary",
                interactive: true,
                selected: true,
                class: `
                    hover:bg-secondary-selected/95 hover:text-secondary-foreground
                    active:bg-secondary-selected/100 active:text-secondary-foreground
                `
            },
            {
                look: "success",
                interactive: true,
                selected: true,
                class: `
                    hover:bg-success-selected/95 hover:text-success-foreground
                    active:bg-success-selected/100 active:text-success-foreground
                `
            },
            {
                look: "error",
                interactive: true,
                selected: true,
                class: `
                    hover:bg-error-selected/95 hover:text-error-foreground
                    active:bg-error-selected/100 active:text-error-foreground
                `
            },
            {
                look: "warning",
                interactive: true,
                selected: true,
                class: `
                    hover:bg-warning-selected/95 hover:text-warning-foreground
                    active:bg-warning-selected/100 active:text-warning-foreground
                `
            },
            {
                look: "info",
                interactive: true,
                selected: true,
                class: `
                    hover:bg-info-selected/95 hover:text-info-foreground
                    active:bg-info-selected/100 active:text-info-foreground
                `
            },
            {
                look: "outline",
                interactive: true,
                selected: true,
                class: `
                    hover:bg-(--color-selected-hover) hover:text-(--color-selected-hover-foreground)
                    active:bg-(--color-selected-active) active:text-(--color-selected-active-foreground)
                `
            },
            {
                look: "ghost",
                interactive: true,
                selected: true,
                class: `
                    hover:bg-(--color-selected-hover) hover:text-(--color-selected-hover-foreground)
                    active:bg-(--color-selected-active) active:text-(--color-selected-active-foreground)
                `
            }
        ],
        defaultVariants: {
            interactive: false,
            rounded: "medium",
            selected: false
        }
    }
);

export type ChipVariantProps = VariantProps<typeof chipThemeVariants>;

export type ChipVariantInputs = VariantInputs<Omit<ChipVariantProps, "interactive">>;
