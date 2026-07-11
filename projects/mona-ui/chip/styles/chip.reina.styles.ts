import { createChipRecipe } from "./chip.shared.styles";

export const reinaChipVariants = createChipRecipe({
    base: `
        inline-flex items-center justify-between gap-1.5
        text-xs font-semibold tracking-tight cursor-pointer shrink-0
        outline-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35
        transition-[background-color,color,opacity] duration-150 ease-out
    `,
    disabledClass: "pointer-events-none opacity-40 cursor-not-allowed select-none",
    looks: {
        default: `
            bg-accent text-accent-foreground
            hover:bg-accent-hover active:bg-accent-active
        `,
        primary: `
            bg-primary text-primary-foreground
            hover:opacity-90 active:opacity-80
        `,
        success: `
            bg-success text-success-foreground
            hover:opacity-90 active:opacity-80
        `,
        error: `
            bg-error text-error-foreground
            hover:opacity-90 active:opacity-80
        `,
        warning: `
            bg-warning text-warning-foreground
            hover:opacity-90 active:opacity-80
        `,
        info: `
            bg-info text-info-foreground
            hover:opacity-90 active:opacity-80
        `,
        outline: `
            bg-transparent text-foreground
            border border-input-border
            hover:bg-accent active:bg-accent-hover
        `,
        secondary: `
            bg-primary/12 text-primary
            hover:bg-primary/18 active:bg-primary/24
        `,
        ghost: `
            bg-transparent text-foreground
            hover:bg-accent active:bg-accent-hover
        `
    },
    rounded: {
        full: "rounded-full",
        large: "rounded-3xl",
        medium: "rounded-2xl",
        none: "rounded-none",
        small: "rounded-xl"
    },
    selectedClass: {
        default: "bg-selected text-foreground hover:bg-selected/90 active:bg-selected/80",
        primary: "bg-primary-selected text-primary-foreground hover:bg-primary-selected/90 active:bg-primary-selected/80",
        secondary: "bg-primary-selected text-primary-foreground hover:bg-primary-selected/90 active:bg-primary-selected/80",
        success: "bg-success-selected text-success-foreground hover:bg-success-selected/90 active:bg-success-selected/80",
        error: "bg-error-selected text-error-foreground hover:bg-error-selected/90 active:bg-error-selected/80",
        warning: "bg-warning-selected text-warning-foreground hover:bg-warning-selected/90 active:bg-warning-selected/80",
        info: "bg-info-selected text-info-foreground hover:bg-info-selected/90 active:bg-info-selected/80",
        outline: "bg-primary-selected text-primary-foreground border-transparent hover:bg-primary-selected/90 active:bg-primary-selected/80",
        ghost: "bg-secondary-selected text-secondary-foreground hover:bg-secondary-selected/90 active:bg-secondary-selected/80"
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
