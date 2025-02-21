import { cva, VariantProps } from "class-variance-authority";
import { VariantInputs } from "mona-ui/utils/VariantInputs";

export const buttonVariants = cva(
    `
        inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md
        text-sm font-medium
        disabled:pointer-events-none disabled:opacity-50
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/10
        focus-visible:shadow
        [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer
    `,
    {
        variants: {
            look: {
                default:
                    "bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/40",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 focus-visible:ring-2",
                outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline"
            },
            size: {
                default: "h-9 px-4 py-2",
                small: "h-8 rounded-md px-3 text-xs",
                large: "h-10 rounded-md px-8",
                icon: "h-9 w-9"
            },
            selected: {
                true: "bg-accent text-accent-foreground hover:bg-accent/90 hover:text-accent-foreground"
            }
        },
        defaultVariants: {
            look: "default",
            size: "default"
        }
    }
);

export const splitButtonVariants = cva(
    `
        flex flex-nowrap items-center
    `,
    {
        variants: {}
    }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;
export type ButtonVariantsInput = VariantInputs<ButtonVariantProps>;

export type DropdownButtonVariantInputs = Omit<ButtonVariantsInput, "selected">;
export type SplitButtonVariantInputs = Omit<ButtonVariantsInput, "selected">;
