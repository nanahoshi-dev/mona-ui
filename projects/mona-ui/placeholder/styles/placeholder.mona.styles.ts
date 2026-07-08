import { cva } from "class-variance-authority";

export const placeholderBaseVariants = cva(
    `
        flex items-center justify-center
        w-full h-full
        p-2
    `
);

export const placeholderTextVariants = cva(
    `
        text-muted-foreground
        uppercase
    `
);
