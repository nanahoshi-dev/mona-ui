import { cva } from "class-variance-authority";

/**
 * Switch tracks/handles are far shorter than buttons or text-boxes, so Reina's usual
 * xl/2xl/3xl radius tokens would clip straight to a pill at every non-"full" rounded level
 * (see the text-box radius fix). Each rounded level is scaled per `size` instead, staying
 * comfortably under half the element's height so none/small/medium/large/full stay distinct.
 */
const trackRoundedBySize = [
    { rounded: "small" as const, size: "small" as const, class: "rounded-sm" },
    { rounded: "medium" as const, size: "small" as const, class: "rounded" },
    { rounded: "large" as const, size: "small" as const, class: "rounded-md" },
    { rounded: "small" as const, size: "medium" as const, class: "rounded" },
    { rounded: "medium" as const, size: "medium" as const, class: "rounded-md" },
    { rounded: "large" as const, size: "medium" as const, class: "rounded-lg" },
    { rounded: "small" as const, size: "large" as const, class: "rounded-md" },
    { rounded: "medium" as const, size: "large" as const, class: "rounded-lg" },
    { rounded: "large" as const, size: "large" as const, class: "rounded-xl" }
];

const handleRoundedBySize = [
    { rounded: "small" as const, size: "small" as const, class: "rounded-sm" },
    { rounded: "medium" as const, size: "small" as const, class: "rounded" },
    { rounded: "large" as const, size: "small" as const, class: "rounded-md" },
    { rounded: "small" as const, size: "medium" as const, class: "rounded" },
    { rounded: "medium" as const, size: "medium" as const, class: "rounded-md" },
    { rounded: "large" as const, size: "medium" as const, class: "rounded-lg" },
    { rounded: "small" as const, size: "large" as const, class: "rounded-md" },
    { rounded: "medium" as const, size: "large" as const, class: "rounded-lg" },
    { rounded: "large" as const, size: "large" as const, class: "rounded-[0.625rem]" }
];

export const reinaSwitchVariants = cva(
    `
        relative flex items-center cursor-pointer select-none
        transition-colors duration-150 ease-out

        bg-input-background
        border border-input-border
        outline-none

        focus-within:ring-2 focus-within:ring-primary/35

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:opacity-40

        data-[active='true']:bg-primary
        data-[active='true']:border-primary
        data-[active='true']:text-primary-foreground

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
                large: "w-14 h-7.5 text-md",
                medium: "w-12 h-6.5 text-sm",
                small: "w-10 h-5.5 text-xs"
            }
        },
        compoundVariants: trackRoundedBySize,
        defaultVariants: {
            size: "medium"
        }
    }
);

export const reinaSwitchHandleVariants = cva(
    `
        absolute inline-flex
        items-center justify-center
        outline-none transition-[left,box-shadow] ease-out duration-300
        bg-background text-foreground
        shadow-sm
        data-[active='true']:shadow-md
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
                large: `
                    w-6 h-6
                    data-[active='true']:left-[calc(100%-26px)]
                    data-[active='false']:left-0.5
                `,
                medium: `
                    w-5 h-5
                    data-[active='true']:left-[calc(100%-22px)]
                    data-[active='false']:left-0.5
                `,
                small: `
                    w-4 h-4
                    data-[active='true']:left-[calc(100%-18px)]
                    data-[active='false']:left-0.5
                `
            }
        },
        compoundVariants: handleRoundedBySize,
        defaultVariants: {
            size: "medium"
        }
    }
);

export const reinaSwitchLabelVariants = cva(
    `
        h-full flex flex-1 items-center justify-center text-xs font-medium tracking-tight
    `
);
