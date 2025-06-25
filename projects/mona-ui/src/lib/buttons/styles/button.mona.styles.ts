import { cva } from "class-variance-authority";

export const buttonVariants = cva(
    `
        inline-flex items-center justify-center gap-2 whitespace-nowrap
        text-sm font-medium
        disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed
        disabled:select-none
    `,
    {
        variants: {
            look: {
                default: "bg-primary text-primary-foreground",
                destructive: "bg-destructive text-destructive-foreground",
                outline: "border border-input bg-background",
                secondary: "bg-secondary text-secondary-foreground",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline"
            },
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            },
            size: {
                icon: "h-9 w-9",
                large: "h-10 px-8",
                medium: "h-9 px-4 py-2",
                small: "h-8 px-3 text-xs"
            },
            selected: {
                true: "bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground"
            }
        },
        defaultVariants: {
            look: "default",
            rounded: "medium",
            size: "medium"
        }
    }
);
