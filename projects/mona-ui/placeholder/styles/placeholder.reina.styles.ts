import { cva } from "class-variance-authority";

export const reinaPlaceholderBaseVariants = cva(
    `
        flex items-center justify-center
        w-full h-full
        p-2
    `
);

export const reinaPlaceholderTextVariants = cva(
    `
        text-foreground/35
        font-medium tracking-wide
    `
);
