import { createButtonRecipe } from "./button.shared.styles";

export const buttonVariants = createButtonRecipe({
    base: `
        inline-flex items-center justify-center gap-2
        text-sm font-medium cursor-pointer whitespace-nowrap
        outline-none shadow-xs
        focus-visible:outline-none focus-visible:shadow
        transition-colors duration-100 ease-in-out
    `,
    disabledClass: "pointer-events-none opacity-50 cursor-not-allowed select-none",
    iconOnlySizes: {
        small: "w-8 h-8 p-0",
        medium: "w-9 h-9 p-0",
        large: "w-10 h-10 p-0"
    },
    looks: {
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
            shadow-none
            hover:bg-secondary-hover
            active:bg-secondary-active
            focus-visible:ring-2 focus-visible:ring-primary/40
        `,
        link: `
            shadow-none
            underline-offset-4 hover:underline
            focus-visible:ring-2 focus-visible:ring-primary/40
        `,
        clear: `
            bg-transparent border-0 shadow-none
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
    selectedClass: {
        default: `
            bg-selected text-foreground
             hover:bg-selected/95 hover:text-foreground
            active:bg-selected/100 active:text-foreground
        `,
        primary: `
            bg-primary-selected text-primary-foreground
            hover:bg-primary-selected/95 hover:text-primary-foreground
            active:bg-primary-selected/100 active:text-primary-foreground
        `,
        secondary: `
            bg-secondary-selected text-secondary-foreground
            hover:bg-secondary-selected/95 hover:text-secondary-foreground
            active:bg-secondary-selected/100 active:text-secondary-foreground
        `,
        success: `
            bg-success-selected text-success-foreground
            hover:bg-success-selected/95 hover:text-success-foreground
            active:bg-success-selected/100 active:text-success-foreground
        `,
        error: `
            bg-error-selected text-error-foreground
            hover:bg-error-selected/95 hover:text-error-foreground
            active:bg-error-selected/100 active:text-error-foreground
        `,
        warning: `
            bg-warning-selected text-warning-foreground
            hover:bg-warning-selected/95 hover:text-warning-foreground
            active:bg-warning-selected/100 active:text-warning-foreground
        `,
        info: `
            bg-info-selected text-info-foreground
            hover:bg-info-selected/95 hover:text-info-foreground
            active:bg-info-selected/100 active:text-info-foreground
        `,
        outline: `
            bg-primary-selected text-primary-foreground
            hover:bg-primary-selected/95 hover:text-primary-foreground
            active:bg-primary-selected/100 active:text-primary-foreground
        `,
        ghost: `
            bg-secondary-selected text-secondary-foreground
            hover:bg-secondary-selected/95 hover:text-secondary-foreground
            active:bg-secondary-selected/100 active:text-secondary-foreground
        `,
        link: `
            bg-secondary-selected text-secondary-foreground
            hover:bg-secondary-selected/95 hover:text-secondary-foreground
            active:bg-secondary-selected/100 active:text-secondary-foreground
        `,
        clear: `
            bg-transparent border-0
            hover:bg-transparent active:bg-transparent
        `
    },
    sizes: {
        large: "px-6 h-10",
        medium: "px-4 h-9",
        small: "px-3 text-xs h-8"
    }
});
