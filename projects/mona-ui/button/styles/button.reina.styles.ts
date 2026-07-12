import { createInheritedVariants } from "@nanahoshi/mona-ui/theme";
import { buttonVariants as monaButtonVariants } from "./button.mona.styles";

export const reinaButtonVariants = createInheritedVariants(monaButtonVariants, {
    add: "font-semibold tracking-tight focus-visible:ring-2 focus-visible:ring-primary/35 transition-[background-color,color,opacity,transform] duration-150 ease-out",
    remove: "font-medium shadow-control focus-visible:shadow transition-colors duration-100 ease-in-out motion-reduce:transition-none",
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
                remove: "bg-input-background text-foreground border border-border-control hover:bg-secondary active:bg-secondary-active focus-visible:ring-2 focus-visible:ring-focus-indicator"
            },
            primary: {
                add: "hover:opacity-90 active:opacity-80",
                remove: "hover:bg-primary-hover active:bg-primary-active focus-visible:ring-2 focus-visible:ring-primary/40"
            },
            success: {
                add: "hover:opacity-90 active:opacity-80",
                remove: "hover:bg-success-hover active:bg-success-active focus-visible:ring-2 focus-visible:ring-success/40"
            },
            error: {
                add: "hover:opacity-90 active:opacity-80",
                remove: "hover:bg-error-hover active:bg-error-active focus-visible:ring-2 focus-visible:ring-error/40"
            },
            warning: {
                add: "hover:opacity-90 active:opacity-80",
                remove: "hover:bg-warning-hover active:bg-warning-active focus-visible:ring-2 focus-visible:ring-warning/40"
            },
            info: {
                add: "hover:opacity-90 active:opacity-80",
                remove: "hover:bg-info-hover active:bg-info-active focus-visible:ring-2 focus-visible:ring-info/40"
            },
            outline: {
                add: "bg-transparent text-foreground border-input-border active:bg-accent-hover",
                remove: "border-border active:bg-accent-dark focus-visible:ring-2 focus-visible:ring-primary/40"
            },
            secondary: {
                add: "bg-primary/12 text-primary hover:bg-primary/18 active:bg-primary/24",
                remove: "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active focus-visible:ring-2 focus-visible:ring-primary/40"
            },
            ghost: {
                add: "bg-transparent text-foreground hover:bg-accent active:bg-accent-hover",
                remove: "shadow-none hover:bg-secondary-hover active:bg-secondary-active focus-visible:ring-2 focus-visible:ring-primary/40"
            },
            link: {
                add: "bg-transparent text-primary hover:opacity-70 active:opacity-60",
                remove: "underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary/40"
            },
            clear: {
                add: "text-foreground",
                remove: "border-0 shadow-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
        },
        size: {
            large: {
                add: "px-7 h-12 text-base",
                remove: "px-6 h-10"
            },
            medium: {
                add: "px-5 h-10",
                remove: "px-4 h-9"
            },
            small: {
                add: "px-3.5",
                remove: "px-3"
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
        },
        {
            when: {
                look: "link",
                selected: true
            },
            add: "text-primary font-bold",
            remove: "bg-secondary-selected text-secondary-foreground hover:bg-secondary-selected/95 hover:text-secondary-foreground active:bg-secondary-selected/100 active:text-secondary-foreground"
        },
        {
            when: {
                iconOnly: true,
                loading: false,
                size: "medium"
            },
            add: "w-10 h-10",
            remove: "w-9 h-9"
        },
        {
            when: {
                iconOnly: true,
                loading: false,
                size: "large"
            },
            add: "w-12 h-12",
            remove: "w-10 h-10"
        }
    ]
});
