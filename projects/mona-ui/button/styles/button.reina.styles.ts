import { createButtonRecipe } from "./button.shared.styles";

export const reinaButtonVariants = createButtonRecipe({
    base: `
        inline-flex items-center justify-center gap-2
        text-sm font-semibold tracking-tight cursor-pointer whitespace-nowrap
        outline-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35
        transition-[background-color,color,opacity,transform] duration-150 ease-out
    `,
    disabledClass: "pointer-events-none opacity-40 cursor-not-allowed select-none",
    iconOnlySizes: {
        large: "w-12 h-12 p-0",
        medium: "w-10 h-10 p-0",
        small: "w-8 h-8 p-0"
    },
    looks: {
        clear: `
            bg-transparent text-foreground
            hover:bg-transparent active:bg-transparent
        `,
        default: `
            bg-accent text-accent-foreground
            hover:bg-accent-hover active:bg-accent-active
        `,
        error: `
            bg-error text-error-foreground
            hover:opacity-90 active:opacity-80
        `,
        ghost: `
            bg-transparent text-foreground
            hover:bg-accent active:bg-accent-hover
        `,
        info: `
            bg-info text-info-foreground
            hover:opacity-90 active:opacity-80
        `,
        link: `
            bg-transparent text-primary shadow-none
            hover:opacity-70 active:opacity-60
        `,
        outline: `
            bg-transparent text-foreground
            border border-input-border
            hover:bg-accent active:bg-accent-hover
        `,
        primary: `
            bg-primary text-primary-foreground
            hover:opacity-90 active:opacity-80
        `,
        secondary: `
            bg-primary/12 text-primary
            hover:bg-primary/18 active:bg-primary/24
        `,
        success: `
            bg-success text-success-foreground
            hover:opacity-90 active:opacity-80
        `,
        warning: `
            bg-warning text-warning-foreground
            hover:opacity-90 active:opacity-80
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
        clear: "bg-transparent border-0 hover:bg-transparent active:bg-transparent",
        default: "bg-selected text-foreground hover:opacity-90 active:opacity-80",
        error: "bg-error-selected text-error-foreground hover:opacity-90 active:opacity-80",
        ghost: "bg-secondary-selected text-secondary-foreground hover:opacity-90 active:opacity-80",
        info: "bg-info-selected text-info-foreground hover:opacity-90 active:opacity-80",
        link: "text-primary font-bold",
        outline: "bg-primary-selected text-primary-foreground border-transparent hover:opacity-90 active:opacity-80",
        primary: "bg-primary-selected text-primary-foreground hover:opacity-90 active:opacity-80",
        secondary: "bg-primary-selected text-primary-foreground hover:opacity-90 active:opacity-80",
        success: "bg-success-selected text-success-foreground hover:opacity-90 active:opacity-80",
        warning: "bg-warning-selected text-warning-foreground hover:opacity-90 active:opacity-80"
    },
    sizes: {
        large: "px-7 h-12 text-base",
        medium: "px-5 h-10",
        small: "px-3.5 text-xs h-8"
    }
});
