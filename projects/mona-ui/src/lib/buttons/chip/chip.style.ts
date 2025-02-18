import { cva, VariantProps } from "class-variance-authority";
import { VariantInputs } from "mona-ui/utils/VariantInputs";

export const chipVariants = cva(
    `
        inline-flex items-center justify-center rounded-md
        text-sm px-2 gap-2 cursor-default
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/10
        focus-visible:shadow select-none
        data-disabled:pointer-events-none data-disabled:opacity-50
    `,
    {
        variants: {
            look: {
                default:
                    "bg-primary text-primary-foreground shadow hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/40",
                destructive:
                    "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90 focus-visible:ring-2",
                outline:
                    "border border-input bg-background text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
                secondary: "bg-secondary text-secondary-foreground"
            }
        },
        defaultVariants: {
            look: "default"
        }
    }
);

export type ChipVariantProps = VariantProps<typeof chipVariants>;
export type ChipVariantInputs = VariantInputs<ChipVariantProps>;
