import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    `
        inline-flex items-center justify-center gap-2
        text-sm font-medium cursor-pointer whitespace-nowrap
        outline-none shadow-control
        focus-visible:outline-none focus-visible:shadow
        transition-colors duration-100 ease-in-out motion-reduce:transition-none
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
                    bg-input-background text-foreground
                    border border-border-control
                    hover:bg-secondary active:bg-secondary-active
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
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
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                error: `
                    bg-error text-error-foreground
                    hover:bg-error-hover
                    active:bg-error-active
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                warning: `
                    bg-warning text-warning-foreground
                    hover:bg-warning-hover
                    active:bg-warning-active
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                info: `
                    bg-info text-info-foreground
                    hover:bg-info-hover
                    active:bg-info-active
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                outline: `
                    border border-border
                    hover:bg-accent hover:text-accent-foreground
                    active:bg-accent-dark active:text-accent-foreground
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                secondary: `
                    bg-secondary text-secondary-foreground
                    hover:bg-secondary-hover
                    active:bg-secondary-active
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                ghost: `
                    shadow-none
                    hover:bg-secondary-hover hover:text-secondary-foreground
                    active:bg-secondary-active active:text-secondary-foreground
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                link: `
                    shadow-none
                    text-primary hover:text-primary-hover active:text-primary-active
                    underline-offset-4 hover:underline
                    focus-visible:ring-2 focus-visible:ring-focus-indicator/35
                `,
                clear: `
                    bg-transparent border-0 shadow-none
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
                     hover:bg-selected/95 hover:text-foreground
                    active:bg-selected/100 active:text-foreground
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
                    bg-primary-selected text-primary-foreground
                    hover:bg-primary-selected/95 hover:text-primary-foreground
                    active:bg-primary-selected/100 active:text-primary-foreground
                `
            },
            {
                look: "ghost",
                selected: true,
                class: `
                    bg-secondary-selected text-secondary-foreground
                    hover:bg-secondary-selected/95 hover:text-secondary-foreground
                    active:bg-secondary-selected/100 active:text-secondary-foreground
                `
            },
            {
                look: "link",
                selected: true,
                class: `
                    bg-secondary-selected text-secondary-foreground
                    hover:bg-secondary-selected/95 hover:text-secondary-foreground
                    active:bg-secondary-selected/100 active:text-secondary-foreground
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
