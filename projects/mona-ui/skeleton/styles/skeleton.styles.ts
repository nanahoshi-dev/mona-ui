import { cva, type VariantProps } from "class-variance-authority";
import type { VariantInputs } from "@nanahoshi/mona-ui/internal";

export const skeletonBaseThemeVariants = cva(
    `
        block shrink-0
        bg-accent
        motion-safe:animate-pulse
    `,
    {
        variants: {
            rounded: {
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full",
                none: "rounded-none"
            }
        }
    }
);

export type SkeletonVariantProps = VariantProps<typeof skeletonBaseThemeVariants>;

export type SkeletonVariantInput = VariantInputs<SkeletonVariantProps>;
