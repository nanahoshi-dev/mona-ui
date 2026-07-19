import { cva } from "class-variance-authority";
import { themeControlSurfaceClasses, VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const buttonThemeVariants = cva(
    `
        inline-flex items-center justify-center gap-2
        cursor-pointer whitespace-nowrap
        text-sm font-medium
        outline-none
        transition-colors duration-100 ease-in-out
    `,

    {
        variants: {
            disabled: {
                true: `
                    pointer-events-none cursor-not-allowed select-none
                    disabled:border-disabled-border disabled:bg-disabled-background disabled:text-disabled-foreground
                    disabled:shadow-none
                `,
                false: ""
            },
            iconOnly: {
                true: "aspect-square",
                false: "aspect-auto"
            },
            loading: {
                true: "pointer-events-none",
                false: ""
            },
            look: {
                default: `
                    ${themeControlSurfaceClasses} text-foreground
                    border border-input-border
                    hover:bg-hover active:bg-active
                    focus-visible:border-focus-indicator focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                primary: `
                    bg-primary text-primary-foreground
                    hover:bg-primary-hover active:bg-primary-active
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                success: `
                    bg-success text-success-foreground
                    hover:bg-success-hover
                    active:bg-success-active
                    focus-visible:ring-2 focus-visible:ring-success/35
                `,
                error: `
                    bg-error text-error-foreground
                    hover:bg-error-hover
                    active:bg-error-active
                    focus-visible:ring-2 focus-visible:ring-error/35
                `,
                warning: `
                    bg-warning text-warning-foreground
                    hover:bg-warning-hover
                    active:bg-warning-active
                    focus-visible:ring-2 focus-visible:ring-warning/35
                `,
                info: `
                    bg-info text-info-foreground
                    hover:bg-info-hover
                    active:bg-info-active
                    focus-visible:ring-2 focus-visible:ring-info/35
                `,
                outline: `
                    ${themeControlSurfaceClasses} text-foreground
                    border border-input-border
                    hover:bg-hover active:bg-active
                    focus-visible:border-focus-indicator focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                secondary: `
                    bg-secondary text-secondary-foreground
                    hover:bg-secondary-hover
                    active:bg-secondary-active
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                ghost: `
                    bg-transparent text-foreground
                    shadow-none
                    hover:bg-hover active:bg-active
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                link: `
                    bg-transparent text-foreground
                    shadow-none
                    underline-offset-4 hover:underline
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                clear: `
                    bg-transparent
                    border-0 shadow-none
                    hover:bg-transparent active:bg-transparent
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
                large: "h-10 px-6",
                medium: "h-9 px-4",
                small: "h-8 px-3 text-xs"
            },
            selected: {
                true: ""
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
                    hover:bg-primary-selected hover:text-primary-foreground
                    active:bg-primary-active active:text-primary-foreground
                `
            },
            {
                look: "secondary",
                selected: true,
                class: `
                    bg-secondary-selected text-secondary-foreground
                    hover:bg-secondary-selected hover:text-secondary-foreground
                    active:bg-secondary-active active:text-secondary-foreground
                `
            },
            {
                look: "success",
                selected: true,
                class: `
                    bg-success-selected text-success-foreground
                    hover:bg-success-selected hover:text-success-foreground
                    active:bg-success-active active:text-success-foreground
                `
            },
            {
                look: "error",
                selected: true,
                class: `
                    bg-error-selected text-error-foreground
                    hover:bg-error-selected hover:text-error-foreground
                    active:bg-error-active active:text-error-foreground
                `
            },
            {
                look: "warning",
                selected: true,
                class: `
                    bg-warning-selected text-warning-foreground
                    hover:bg-warning-selected hover:text-warning-foreground
                    active:bg-warning-active active:text-warning-foreground
                `
            },
            {
                look: "info",
                selected: true,
                class: `
                    bg-info-selected text-info-foreground
                    hover:bg-info-selected hover:text-info-foreground
                    active:bg-info-active active:text-info-foreground
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
            },
            {
                look: "link",
                selected: true,
                class: `
                    bg-(--color-selected) text-(--color-selected-foreground)
                    hover:bg-(--color-selected-hover) hover:text-(--color-selected-hover-foreground)
                    active:bg-(--color-selected-active) active:text-(--color-selected-active-foreground)
                `
            },
            {
                look: "clear",
                selected: true,
                class: `
                    bg-transparent border-0
                    hover:bg-transparent active:bg-transparent
                `
            },
            {
                disabled: true,
                look: "ghost",
                class: "disabled:bg-transparent disabled:text-disabled-foreground"
            },
            {
                iconOnly: true,
                loading: false,
                size: "small",
                class: "h-8 w-8 p-0"
            },
            {
                iconOnly: true,
                loading: false,
                size: "medium",
                class: "h-9 w-9 p-0"
            },
            {
                iconOnly: true,
                loading: false,
                size: "large",
                class: "h-10 w-10 p-0"
            }
        ],
        defaultVariants: {
            look: "default",
            rounded: "medium",
            size: "medium"
        }
    }
);

export type ButtonVariantProps = VariantProps<typeof buttonThemeVariants>;

export type ButtonVariantsInput = VariantInputs<ButtonVariantProps>;
