import { cva } from "class-variance-authority";

export const placeholderBaseVariants = cva(
    `
        flex items-center justify-center
        h-full w-full
        p-2
        bg-surface-muted/50
    `
);

export const placeholderTextVariants = cva(
    `
        uppercase text-muted-foreground
    `
);
