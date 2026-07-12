import { cva } from "class-variance-authority";

export const numericTextboxVariants = cva(
    `
        flex items-center w-full min-w-0
        bg-input-background shadow-control
        border border-border-control p-0
        outline-none overflow-hidden

        placeholder:text-muted-foreground

        selection:bg-primary selection:text-primary-foreground
        transition-[color,box-shadow,border-color] ease-in-out duration-150 motion-reduce:transition-none

        data-[disabled='true']:pointer-events-none
        data-[disabled='true']:cursor-not-allowed
        data-[disabled='true']:bg-disabled-background
        data-[disabled='true']:opacity-50
        data-[disabled='true']:text-disabled
        data-[disabled='true']:border-border-subtle

        focus-within:border-focus-indicator focus-within:ring-2 focus-within:ring-focus-indicator/35

        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/35
        data-[invalid='true']:focus-within:border-error data-[invalid='true']:focus-within:ring-error/35
    `,
    {
        variants: {
            rounded: {
                full: "rounded-full",
                large: "rounded-lg",
                medium: "rounded-md",
                none: "rounded-none",
                small: "rounded-sm"
            },
            size: {
                large: "h-10 text-md",
                medium: "h-9 text-sm",
                small: "h-8 text-xs"
            }
        }
    }
);

export const numericTextboxInputVariants = cva(
    `
        border-0 outline-none ring-0
        h-full w-full
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
                    rounded-tl-lg rounded-bl-lg
                `,
                medium: `
                    rounded-tl-md rounded-bl-md
                `,
                none: `
                    rounded-tl-none rounded-bl-none
                `,
                small: `
                    rounded-tl-sm rounded-bl-sm
                `
            },
            rightRounded: {
                full: `
                    rounded-tr-full rounded-br-full
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `,
                large: `
                    rounded-tr-lg rounded-br-lg
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `,
                medium: `
                    rounded-tr-md rounded-br-md
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `,
                none: `
                    rounded-tr-none rounded-br-none
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `,
                small: `
                    rounded-tr-sm rounded-br-sm
                    data-[spinners='true']:rounded-tr-none data-[spinners='true']:rounded-br-none
                `
            }
        }
    }
);

export const numericTextboxButtonVariants = cva(
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
                large: "min-w-16 w-16",
                medium: "min-w-10 w-10",
                small: "min-w-8 w-8"
            }
        }
    }
);
