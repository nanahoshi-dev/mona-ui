import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import { chipVariants as monaChipVariants } from "./chip.mona.styles";

export const reinaChipVariants = createInheritedVariants(monaChipVariants, {
    add: "font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 transition-[background-color,color,opacity] duration-150 ease-out",
    remove: "font-medium shadow-xs transition-colors duration-200 ease-in-out",
    variants: {
        disabled: {
            true: {
                add: "opacity-40",
                remove: "opacity-50"
            }
        },
        look: {
            default: {
                add: "bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-active",
                remove: "bg-background text-foreground border border-border hover:bg-hover hover:text-accent-foreground active:bg-active active:text-accent-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
            },
            primary: {
                add: "hover:opacity-90 active:opacity-80",
                remove: "hover:bg-primary-hover hover:text-primary-foreground active:bg-primary-active active:text-primary-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
            },
            success: {
                add: "hover:opacity-90 active:opacity-80",
                remove: "hover:bg-success-hover hover:text-success-foreground active:bg-success-active active:text-success-foreground focus-visible:ring-2 focus-visible:ring-success/40"
            },
            error: {
                add: "hover:opacity-90 active:opacity-80",
                remove: "hover:bg-error-hover hover:text-error-foreground active:bg-error-active active:text-error-foreground focus-visible:ring-2 focus-visible:ring-error/40"
            },
            warning: {
                add: "hover:opacity-90 active:opacity-80",
                remove: "hover:bg-warning-hover hover:text-warning-foreground active:bg-warning-active active:text-warning-foreground focus-visible:ring-2 focus-visible:ring-warning/40"
            },
            info: {
                add: "hover:opacity-90 active:opacity-80",
                remove: "hover:bg-info-hover hover:text-info-foreground active:bg-info-active active:text-info-foreground focus-visible:ring-2 focus-visible:ring-info/40"
            },
            outline: {
                add: "bg-transparent text-foreground border-input-border active:bg-accent-hover",
                remove: "border-border hover:text-accent-foreground active:bg-accent-dark active:text-accent-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
            },
            secondary: {
                add: "bg-primary/12 text-primary hover:bg-primary/18 active:bg-primary/24",
                remove: "bg-secondary text-secondary-foreground hover:bg-secondary-hover hover:text-secondary-foreground active:bg-secondary-active active:text-secondary-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
            },
            ghost: {
                add: "bg-transparent text-foreground hover:bg-accent active:bg-accent-hover",
                remove: "hover:bg-secondary-hover hover:text-secondary-foreground active:bg-secondary-active active:text-secondary-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
            }
        },
        rounded: {
            large: {
                add: "rounded-3xl",
                remove: "rounded-lg"
            },
            medium: {
                add: "rounded-2xl",
                remove: "rounded-md"
            },
            small: {
                add: "rounded-xl",
                remove: "rounded-sm"
            }
        }
    },
    compoundVariants: [
        {
            when: {
                look: "default",
                selected: true
            },
            add: "hover:bg-selected/90 active:bg-selected/80",
            remove: "hover:bg-selected/95 hover:text-foreground active:bg-selected/100 active:text-foreground"
        },
        {
            when: {
                look: "primary",
                selected: true
            },
            add: "hover:bg-primary-selected/90 active:bg-primary-selected/80",
            remove: "hover:bg-primary-selected/95 hover:text-primary-foreground active:bg-primary-selected/100 active:text-primary-foreground"
        },
        {
            when: {
                look: "success",
                selected: true
            },
            add: "hover:bg-success-selected/90 active:bg-success-selected/80",
            remove: "hover:bg-success-selected/95 hover:text-success-foreground active:bg-success-selected/100 active:text-success-foreground"
        },
        {
            when: {
                look: "error",
                selected: true
            },
            add: "hover:bg-error-selected/90 active:bg-error-selected/80",
            remove: "hover:bg-error-selected/95 hover:text-error-foreground active:bg-error-selected/100 active:text-error-foreground"
        },
        {
            when: {
                look: "warning",
                selected: true
            },
            add: "hover:bg-warning-selected/90 active:bg-warning-selected/80",
            remove: "hover:bg-warning-selected/95 hover:text-warning-foreground active:bg-warning-selected/100 active:text-warning-foreground"
        },
        {
            when: {
                look: "info",
                selected: true
            },
            add: "hover:bg-info-selected/90 active:bg-info-selected/80",
            remove: "hover:bg-info-selected/95 hover:text-info-foreground active:bg-info-selected/100 active:text-info-foreground"
        },
        {
            when: {
                look: "outline",
                selected: true
            },
            add: "border-transparent hover:bg-primary-selected/90 active:bg-primary-selected/80",
            remove: "hover:bg-primary-selected/95 hover:text-primary-foreground active:bg-primary-selected/100 active:text-primary-foreground"
        },
        {
            when: {
                look: "secondary",
                selected: true
            },
            add: "bg-primary-selected text-primary-foreground hover:bg-primary-selected/90 active:bg-primary-selected/80",
            remove: "bg-secondary-selected text-secondary-foreground hover:bg-secondary-selected/95 hover:text-secondary-foreground active:bg-secondary-selected/100 active:text-secondary-foreground"
        },
        {
            when: {
                look: "ghost",
                selected: true
            },
            add: "hover:bg-secondary-selected/90 active:bg-secondary-selected/80",
            remove: "hover:bg-secondary-selected/95 hover:text-secondary-foreground active:bg-secondary-selected/100 active:text-secondary-foreground"
        }
    ]
});
