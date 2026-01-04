import { cva } from "class-variance-authority";

export const chipVariants = cva(
    `
        inline-flex items-center justify-between gap-1.5
        text-xs font-medium cursor-pointer shrink-0
        outline-none
        data-[disabled]:pointer-events-none data-[disabled]:opacity-50
        data-[disabled]:cursor-not-allowed data-[disabled]:select-none
    `,
    {
        variants: {
            look: {
                default: `
                    bg-background text-foreground
                    border border-border
                    hover:bg-accent hover:text-accent-foreground
                    focus-visible:ring-2 focus-visible:ring-primary/40
                `,
                primary: `
                    bg-primary text-primary-foreground
                    hover:bg-primary-hover hover:text-primary-foreground
                    focus-visible:ring-2 focus-visible:ring-primary/40
                `,
                success: `
                    bg-success text-success-foreground
                    hover:bg-success/90 hover:text-success-foreground
                    focus-visible:ring-2 focus-visible:ring-success/40
                `,
                error: `
                    bg-error text-error-foreground
                    hover:bg-error-hover hover:text-error-foreground
                    focus-visible:ring-2 focus-visible:ring-error/40
                `,
                warning: `
                    bg-warning text-warning-foreground
                    hover:bg-warning-hover hover:text-warning-foreground
                    focus-visible:ring-2 focus-visible:ring-warning/40
                `,
                info: `
                    bg-info text-info-foreground
                    hover:bg-info-hover hover:text-info-foreground
                    focus-visible:ring-2 focus-visible:ring-info/40
                `,
                outline: `
                    border border-border
                    hover:bg-accent hover:text-accent-foreground
                    focus-visible:ring-2 focus-visible:ring-primary/40
                `,
                secondary: `
                    bg-secondary text-secondary-foreground
                    hover:bg-secondary-hover hover:text-secondary-foreground
                    focus-visible:ring-2 focus-visible:ring-primary/40
                `,
                ghost: `
                    hover:bg-secondary-hover hover:text-secondary-foreground
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
                small: `px-1 py-0.5`,
                medium: `px-1.5 py-1`,
                large: `px-2 py-1.5`
            }
        }
    }
);
