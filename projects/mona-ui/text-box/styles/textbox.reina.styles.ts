import { cva } from "class-variance-authority";

/**
 * Reina's radius tokens (xl/2xl/3xl) are large enough that "medium" and "large" clip to a
 * full pill once a box's height drops to `size="small"` (12px+ radius on a 32px-tall box).
 * Each rounded level is therefore scaled per `size` so it stays comfortably under half the
 * box height, keeping none/small/medium/large/full visually distinct at every size.
 */
const roundedBySize = [
    { rounded: "small" as const, size: "small" as const, class: "rounded-md" },
    { rounded: "medium" as const, size: "small" as const, class: "rounded-lg" },
    { rounded: "large" as const, size: "small" as const, class: "rounded-xl" },
    { rounded: "small" as const, size: "medium" as const, class: "rounded-lg" },
    { rounded: "medium" as const, size: "medium" as const, class: "rounded-xl" },
    { rounded: "large" as const, size: "medium" as const, class: "rounded-2xl" },
    { rounded: "small" as const, size: "large" as const, class: "rounded-xl" },
    { rounded: "medium" as const, size: "large" as const, class: "rounded-2xl" },
    { rounded: "large" as const, size: "large" as const, class: "rounded-[1.25rem]" }
];

export const reinaTextBoxVariants = cva(
    `
        flex items-center w-full min-w-0
        overflow-hidden

        bg-input-background text-foreground font-medium
        border border-input-border outline-none
        selection:bg-primary selection:text-primary-foreground

        transition-[color,box-shadow,border,background-color] ease-out duration-150

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-40

        focus-within:ring-2 focus-within:ring-primary/35
        focus-within:border-primary

        [&>input]:w-full [&>input]:h-full
        [&>input]:bg-transparent
        [&>input]:border-0 [&>input]:outline-none
        [&>input]:placeholder:text-foreground/40
        [&>input]:px-3

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "",
                medium: "",
                none: "rounded-none",
                small: ""
            },
            size: {
                large: "h-12 text-base",
                medium: "h-10 text-sm",
                small: "h-8 text-xs"
            }
        },
        compoundVariants: roundedBySize,
        defaultVariants: {
            size: "medium"
        }
    }
);

export const reinaInputVariants = cva(
    `
        bg-input-background
        px-3

        border border-input-border outline-none
        selection:bg-primary selection:text-primary-foreground
        font-medium

        transition-[color,box-shadow,border,background-color] ease-out duration-150

        shadow-none

        file:text-foreground
        file:inline-flex file:border-0
        file:bg-transparent file:text-xs
        file:font-medium

        placeholder:text-foreground/40

        disabled:pointer-events-none
        disabled:cursor-not-allowed
        disabled:opacity-40

        focus-visible:ring-2 focus-visible:ring-primary/35
        focus-visible:border-primary

        [&.ng-touched.ng-invalid]:border-error
        [&.ng-touched.ng-invalid]:ring-error/35
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full px-4",
                large: "",
                medium: "",
                none: "rounded-none",
                small: ""
            },
            size: {
                large: "h-12 text-base",
                medium: "h-10 text-sm",
                small: "h-8 text-xs"
            }
        },
        compoundVariants: [
            ...roundedBySize,
            {
                rounded: "full",
                size: "large",
                class: "px-4"
            },
            {
                rounded: "full",
                size: "medium",
                class: "px-4"
            },
            {
                rounded: "full",
                size: "small",
                class: "px-4"
            }
        ],
        defaultVariants: {
            size: "medium"
        }
    }
);
