import { cva } from "class-variance-authority";

export const progressBarBaseVariants = cva(
    `
        relative flex items-center justify-center
        w-full h-5.5
        bg-input-background border border-input-border
        overflow-hidden select-none
        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-50
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
        absolute w-full h-full
        flex items-center justify-center
        bg-[repeating-linear-gradient(135deg,var(--color-background),var(--color-background)_10px,var(--color-secondary)_10px,var(--color-secondary)_20px)]
        bg-size-[200%_200%]
    `
)

export const progressBarLabelVariants = cva(
    `
        px-1.5
    `
);

export const progressBarTrackVariants = cva(
    `
        relative
        flex items-center justify-center
        w-full h-full
        text-xs font-medium
        bg-primary text-primary-foreground
        data-[prev='true']:transition-[background-color]
        data-[prev='true']:duration-200
        data-[prev='true']:ease-in
        data-[next='true']:absolute
        data-[next='true']:bg-background
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
)
