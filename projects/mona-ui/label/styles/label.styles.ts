import { cva } from "class-variance-authority";

export const labelComponentThemeVariants = cva(
    `
        inline-flex
        flex-col
        gap-1.5
        text-sm
        font-medium
        leading-none
        text-foreground
    `
);

export const labelDirectiveThemeVariants = cva(
    `
        text-sm
        font-medium
        leading-none
        text-foreground
    `
);

export const labelCaptionThemeVariants = cva(
    `
        inline-flex
        items-baseline
    `
);

export const labelOptionalThemeVariants = cva(
    `
        ms-1
        text-xs
        font-normal
        text-muted-foreground
    `
);
