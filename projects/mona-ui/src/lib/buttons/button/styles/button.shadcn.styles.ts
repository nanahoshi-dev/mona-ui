import { cva, VariantProps } from "class-variance-authority";
import { VariantInputs } from "mona-ui/utils/VariantInputs";

export const buttonVariants = cva(
    `
        inline-flex items-center justify-center gap-2
        text-sm font-medium cursor-pointer whitespace-nowrap
        outline-none
        focus-visible:outline-none focus-visible:shadow
        transition-colors duration-100 ease-in-out
        disabled:pointer-events-none disabled:opacity-50
        disabled:cursor-not-allowed disabled:select-none
    `,
    {
        variants: {
            look: {
                default: `
                    bg-background text-foreground
                    border border-border
                    hover:bg-accent hover:text-foreground
                    active:bg-accent-dark active:text-foreground
                    focus-visible:ring-2 focus-visible:ring-ring/40
                `,
                primary: `
                    bg-primary text-primary-foreground
                    hover:bg-primary/90 hover:text-primary-foreground
                    active:bg-primary-active active:text-primary-foreground
                    focus-visible:ring-2 focus-visible:ring-primary/40
                `,
                success: `
                    bg-success text-success-foreground
                    hover:bg-success/90 hover:text-success-foreground
                    active:bg-success-active active:text-success-foreground
                    focus-visible:ring-2 focus-visible:ring-success/40
                `,
                error: `
                    bg-error text-error-foreground
                    hover:bg-error-hover hover:text-error-foreground
                    active:bg-error-active active:text-error-foreground
                    focus-visible:ring-2 focus-visible:ring-error/40
                `,
                warning: `
                    bg-warning text-warning-foreground
                    hover:bg-warning-hover hover:text-warning-foreground
                    active:bg-warning-active active:text-warning-foreground
                    focus-visible:ring-2 focus-visible:ring-warning/40
                `,
                info: `
                    bg-info text-info-foreground
                    hover:bg-info-hover hover:text-info-foreground
                    active:bg-info-active active:text-info-foreground
                    focus-visible:ring-2 focus-visible:ring-info/40
                `,
                outline: `
                    border border-border
                    hover:bg-accent hover:text-accent-foreground
                    active:bg-accent-dark active:text-accent-foreground,
                    focus-visible:ring-2 focus-visible:ring-primary/40
                `,
                secondary: `
                    bg-secondary text-secondary-foreground
                    hover:bg-secondary-hover hover:text-secondary-foreground
                    active:bg-secondary-active active:text-secondary-foreground
                    focus-visible:ring-2 focus-visible:ring-secondary/40
                `,
                ghost: `
                    hover:bg-secondary-hover hover:text-secondary-foreground
                    active:bg-secondary-active active:text-secondary-foreground,
                    focus-visible:ring-2 focus-visible:ring-secondary-foreground/40
                `,
                link: `
                    text-primary underline-offset-4
                    hover:underline hover:text-primary-hover
                    active:text-primary-active
                `
            },
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                none: "rounded-none",
                large: "rounded-lg",
                full: "rounded-full"
            },
            size: {
                medium: "h-9 px-4 py-2",
                small: "h-8 px-3 text-xs",
                large: "h-10 px-8"
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
            }
        ],
        defaultVariants: {
            look: "default",
            rounded: "medium",
            size: "medium"
        }
    }
);

export const splitButtonVariants = cva(
    `
        flex flex-nowrap items-center
        focus-visible:outline-none
    `,
    {
        variants: {}
    }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
export type ButtonVariantsInput = VariantInputs<ButtonVariantProps>;

export type DropdownButtonVariantInputs = Omit<ButtonVariantsInput, "selected">;
export type SplitButtonVariantInputs = Omit<ButtonVariantsInput, "selected">;
