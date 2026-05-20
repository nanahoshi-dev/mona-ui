import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    `
        inline-flex items-center justify-center gap-2
        text-sm font-medium cursor-pointer whitespace-nowrap
        outline-none
        focus-visible:outline-none focus-visible:shadow
        transition-colors duration-100 ease-in-out
    `,

    {
        variants: {
            disabled: {
                true: "pointer-events-none opacity-50 cursor-not-allowed select-none",
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
                    bg-background text-foreground
                    border border-input-border
                    hover:bg-hover active:bg-active
                    focus-visible:ring-2 focus-visible:ring-primary/40
                `,
                primary: `
                    bg-primary text-primary-foreground
                    hover:bg-primary-hover active:bg-primary-active
                    focus-visible:ring-2 focus-visible:ring-primary/40
                `,
                success: `
                    bg-success text-success-foreground
                    hover:bg-success-hover
                    active:bg-success-active
                    focus-visible:ring-2 focus-visible:ring-success/40
                `,
                error: `
                    bg-error text-error-foreground
                    hover:bg-error-hover
                    active:bg-error-active
                    focus-visible:ring-2 focus-visible:ring-error/40
                `,
                warning: `
                    bg-warning text-warning-foreground
                    hover:bg-warning-hover
                    active:bg-warning-active
                    focus-visible:ring-2 focus-visible:ring-warning/40
                `,
                info: `
                    bg-info text-info-foreground
                    hover:bg-info-hover
                    active:bg-info-active
                    focus-visible:ring-2 focus-visible:ring-info/40
                `,
                outline: `
                    border border-border
                    hover:bg-accent
                    active:bg-accent-dark
                    focus-visible:ring-2 focus-visible:ring-primary/40
                `,
                secondary: `
                    bg-secondary text-secondary-foreground
                    hover:bg-secondary-hover
                    active:bg-secondary-active
                    focus-visible:ring-2 focus-visible:ring-primary/40
                `,
                ghost: `
                    hover:bg-secondary-hover
                    active:bg-secondary-active
                    focus-visible:ring-2 focus-visible:ring-primary/40
                `,
                link: `
                    underline-offset-4 hover:underline
                    focus-visible:ring-2 focus-visible:ring-primary/40
                `,
                clear: `
                    bg-transparent border-0
                    hover:bg-transparent active:bg-transparent
                    focus-visible:ring-2 focus-visible:ring-primary/40
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
                large: "px-6 h-10",
                medium: "px-4 h-9",
                small: "px-3 text-xs h-8"
            },
            selected: {
                true: "bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground"
            }
        },
        compoundVariants: [
            {
                look: "default",
                selected: true,
                class: `
                    bg-selected text-foreground
                    hover:bg-selected/95
                    active:bg-selected/100
                `
            },
            {
                look: "primary",
                selected: true,
                class: `
                    bg-primary-selected text-primary-foreground
                    hover:bg-primary-selected/95
                    active:bg-primary-selected/100
                `
            },
            {
                look: "secondary",
                selected: true,
                class: `
                    bg-secondary-selected text-secondary-foreground
                    hover:bg-secondary-selected/95
                    active:bg-secondary-selected/100
                `
            },
            {
                look: "success",
                selected: true,
                class: `
                    bg-success-selected text-success-foreground
                    hover:bg-success-selected/95
                    active:bg-success-selected/100
                `
            },
            {
                look: "error",
                selected: true,
                class: `
                    bg-error-selected text-error-foreground
                    hover:bg-error-selected/95
                    active:bg-error-selected/100
                `
            },
            {
                look: "warning",
                selected: true,
                class: `
                    bg-warning-selected text-warning-foreground
                    hover:bg-warning-selected/95
                    active:bg-warning-selected/100
                `
            },
            {
                look: "info",
                selected: true,
                class: `
                    bg-info-selected text-info-foreground
                    hover:bg-info-selected/95
                    active:bg-info-selected/100
                `
            },
            {
                look: "outline",
                selected: true,
                class: `
                    bg-primary-selected text-primary-foreground
                    hover:bg-primary-selected/95
                    active:bg-primary-selected/100
                `
            },
            {
                look: "ghost",
                selected: true,
                class: `
                    bg-secondary-selected text-secondary-foreground
                    hover:bg-secondary-selected/95
                    active:bg-secondary-selected/100
                `
            },
            {
                look: "link",
                selected: true,
                class: `
                    bg-secondary-selected text-secondary-foreground
                    hover:bg-secondary-selected/95
                    active:bg-secondary-selected/100
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
                iconOnly: true,
                loading: false,
                size: "small",
                class: "w-8 h-8 p-0"
            },
            {
                iconOnly: true,
                loading: false,
                size: "medium",
                class: "w-9 h-9 p-0"
            },
            {
                iconOnly: true,
                loading: false,
                size: "large",
                class: "w-10 h-10 p-0"
            }
        ],
        defaultVariants: {
            look: "default",
            rounded: "medium",
            size: "medium"
        }
    }
);
