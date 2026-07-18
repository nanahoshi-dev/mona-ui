import { cva } from "class-variance-authority";

export const progressBarBaseVariants = cva(
    `
        relative flex items-center justify-center
        h-5.5 w-full
        overflow-hidden select-none
        bg-surface-muted
        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:text-disabled-foreground
        data-[disabled='true']:[&_[data-prev='true']]:bg-disabled-foreground
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            }
        }
    }
);

export const progressBarIndeterminateVariants = cva(
    `
        absolute flex h-full w-full items-center justify-center
        bg-[repeating-linear-gradient(135deg,var(--color-surface-muted),var(--color-surface-muted)_10px,var(--color-primary)_10px,var(--color-primary)_20px)]
        bg-size-[200%_200%]
    `
);

export const progressBarLabelVariants = cva(
    `
        px-1.5
    `
);

export const progressBarTrackVariants = cva(
    `
        relative flex h-full w-full items-center justify-center
        text-xs font-medium
        bg-primary text-primary-foreground
        data-[prev='true']:transition-[background-color]
        data-[prev='true']:duration-200
        data-[prev='true']:ease-in
        data-[next='true']:absolute
        data-[next='true']:bg-surface-muted
        data-[next='true']:text-foreground
        data-[next='true']:transition-[clip-path]
        data-[next='true']:duration-200
        data-[next='true']:ease-in
        data-[value='0']:bg-transparent
        data-[left='true']:justify-start
        data-[right='true']:justify-end
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            }
        }
    }
);
