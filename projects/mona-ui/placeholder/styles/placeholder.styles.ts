import { cva } from "class-variance-authority";
import { VariantInputs } from "@nanahoshi/mona-ui/internal";
import { VariantProps } from "class-variance-authority";

export const placeholderBaseThemeVariants = cva(
    `
        flex items-center justify-center
        h-full w-full
        p-2
        bg-surface-muted/50
    `
);

export const placeholderTextThemeVariants = cva(
    `
        uppercase text-muted-foreground
    `
);

type PlaceholderBaseVariantProps = VariantProps<typeof placeholderBaseThemeVariants>;

type PlaceholderBaseVariantInput = VariantInputs<PlaceholderBaseVariantProps>;

type PlaceholderTextVariantProps = VariantProps<typeof placeholderTextThemeVariants>;

type PlaceholderTextVariantInput = VariantInputs<PlaceholderTextVariantProps>;

export type PlaceholderVariantProps = PlaceholderBaseVariantProps & PlaceholderTextVariantProps;

export type PlaceholderVariantInput = PlaceholderBaseVariantInput & PlaceholderTextVariantInput;
