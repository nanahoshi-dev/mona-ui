import { createChipRecipe } from "./chip.shared.styles";

export const chipVariants = createChipRecipe({
    base: `
        inline-flex items-center justify-between gap-1.5
        text-xs font-medium cursor-pointer shrink-0
        outline-none shadow-xs
        transition-colors duration-200 ease-in-out
    `,
    disabledClass: "pointer-events-none opacity-50 cursor-not-allowed select-none",
    looks: {
        default: `
            bg-background text-foreground
            border border-border
            hover:bg-hover hover:text-accent-foreground
            active:bg-active active:text-accent-foreground
            focus-visible:ring-2 focus-visible:ring-primary/40
        `,
        primary: `
            bg-primary text-primary-foreground
            hover:bg-primary-hover hover:text-primary-foreground
            active:bg-primary-active active:text-primary-foreground
            focus-visible:ring-2 focus-visible:ring-primary/40
        `,
        success: `
            bg-success text-success-foreground
            hover:bg-success-hover hover:text-success-foreground
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
            active:bg-accent-dark active:text-accent-foreground
            focus-visible:ring-2 focus-visible:ring-primary/40
        `,
        secondary: `
            bg-secondary text-secondary-foreground
            hover:bg-secondary-hover hover:text-secondary-foreground
            active:bg-secondary-active active:text-secondary-foreground
            focus-visible:ring-2 focus-visible:ring-primary/40
        `,
        ghost: `
            hover:bg-secondary-hover hover:text-secondary-foreground
            active:bg-secondary-active active:text-secondary-foreground
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
        `
    },
    sizes: {
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
    }
});
