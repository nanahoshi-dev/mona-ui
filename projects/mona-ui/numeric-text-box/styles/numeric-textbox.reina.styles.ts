import { cva } from "class-variance-authority";

export const reinaNumericTextboxVariants = cva(
    `
        flex items-center w-full min-w-0
        bg-transparent
        border border-input-border p-0
        outline-none overflow-hidden

        placeholder:text-foreground/40

        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border,background-color] ease-out duration-150

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:opacity-40

        focus-within:ring-2 focus-within:ring-primary/35
        focus-within:border-primary

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "rounded-3xl",
                medium: "rounded-2xl",
                none: "rounded-none",
                small: "rounded-xl"
            },
            size: {
                large: "h-12 text-base",
                medium: "h-10 text-sm",
                small: "h-8 text-xs"
            }
        }
    }
);

export const reinaNumericTextboxInputVariants = cva(
    `
        border-0 outline-none ring-0
        h-full w-full
        font-medium
        focus-visible:ring-0 shadow-none
        rounded-none
    `,
    {
        variants: {
            leftRounded: {
                full: `
                    rounded-tl-full rounded-bl-full
                `,
                large: `
                    rounded-tl-3xl rounded-bl-3xl
                `,
                medium: `
                    rounded-tl-2xl rounded-bl-2xl
                `,
                none: `
                    rounded-tl-none rounded-bl-none
                `,
                small: `
                    rounded-tl-xl rounded-bl-xl
                `
            },
            rightRounded: {
                full: `
                    rounded-tr-full rounded-br-full
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `,
                large: `
                    rounded-tr-3xl rounded-br-3xl
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `,
                medium: `
                    rounded-tr-2xl rounded-br-2xl
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `,
                none: `
                    rounded-tr-none rounded-br-none
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `,
                small: `
                    rounded-tr-xl rounded-br-xl
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `
            }
        }
    }
);

export const reinaNumericTextboxButtonVariants = cva(
    `
        h-full flex flex-col border-l border-input-border
        overflow-y-hidden
        [&>button]:flex-1
        [&>button]:flex
        [&>button]:items-center
        [&>button]:p-0
        [&>button]:rounded-none

        [&>button]:first:rounded-tl-none
        [&>button]:first:rounded-bl-none
        [&>button]:first:rounded-br-none
        [&>button]:first:h-1/2
        [&>button]:last:rounded-tl-none
        [&>button]:last:rounded-bl-none
        [&>button]:last:rounded-tr-none
        [&>button]:last:h-1/2
    `,
    {
        variants: {
            size: {
                large: "min-w-12 w-12",
                medium: "min-w-10 w-10",
                small: "min-w-8 w-8"
            }
        }
    }
);
