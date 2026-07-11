import { cva } from "class-variance-authority";

export const reinaCalendarBaseVariants = cva(
    `
        flex flex-col gap-2 p-3 min-w-64
        bg-background/95 backdrop-blur-xl text-foreground
        border border-input-border
        shadow-lg select-none
        data-[invalid='true']:border-error
        data-[invalid='true']:ring-2 data-[invalid='true']:ring-error/40
    `,
    {
        variants: {
            disabled: {
                true: "opacity-40 cursor-not-allowed pointer-events-none"
            },
            readonly: {
                true: "pointer-events-none"
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-xl",
                medium: "rounded-2xl",
                large: "rounded-3xl",
                full: "rounded-full"
            }
        }
    }
);

export const reinaCalendarHeaderVariants = cva(
    `
        flex items-center justify-center
        [&>button+button]:not-focus:border-s-0
        [&>button:nth-of-type(2)]:flex-1
        [&>button:nth-of-type(3)]:rounded-se-none
        [&>button:nth-of-type(3)]:rounded-ee-none
        [&>button:nth-of-type(4)]:rounded-ss-none
        [&>button:nth-of-type(4)]:rounded-es-none
        [&>button]:outline-none
    `
);

export const reinaCalendarMonthViewDayVariants = cva(
    `
        hover:bg-accent cursor-pointer font-medium
        transition-colors duration-100 ease-out
    `,
    {
        variants: {
            disabled: {
                true: "opacity-40 cursor-not-allowed pointer-events-none"
            },
            focused: {
                true: "ring-1 ring-inset ring-primary/40 bg-accent outline-none"
            },
            outside: {
                true: "opacity-40"
            },
            rangePreview: {
                true: "bg-primary/15 hover:bg-primary/25"
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-lg",
                medium: "rounded-xl",
                large: "rounded-2xl",
                full: "rounded-full"
            },
            selected: {
                true: "bg-primary text-primary-foreground hover:bg-primary/90"
            },
            today: {
                true: "font-bold text-primary"
            }
        },
        compoundVariants: [
            {
                selected: true,
                today: true,
                class: "text-primary-foreground"
            }
        ],
        defaultVariants: {
            rounded: "medium"
        }
    }
);

export const reinaCalendarMonthViewGridVariants = cva(
    `
        grid gap-0.5
        justify-center
        [&>div]:h-full [&>div]:flex
        [&>div]:items-center [&>div]:justify-center
        [&>div]:aspect-square
    `
);

export const reinaCalendarMonthViewGridHeaderVariants = cva(
    `
        grid justify-center
        gap-0.5 font-semibold text-sm text-foreground/50 tracking-tight
        [&>div]:h-full [&>div]:flex
        [&>div]:items-center [&>div]:justify-center
        [&>div]:aspect-square
    `
);

export const reinaCalendarYearViewGridVariants = cva(
    `
        grid grid-cols-3 gap-0.5
        justify-center
        [&>div]:h-full [&>div]:flex
        [&>div]:items-center [&>div]:justify-center
        [&>div]:h-12
    `
);

export const reinaCalendarYearViewCellVariants = cva(
    `
        py-2 cursor-pointer font-medium
        transition-colors duration-100 ease-out
        hover:bg-accent
        active:bg-accent-active
    `,
    {
        variants: {
            focused: {
                true: "ring-1 ring-inset ring-primary/40 bg-accent outline-none"
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-lg",
                medium: "rounded-xl",
                large: "rounded-2xl",
                full: "rounded-full"
            }
        }
    }
);

export const reinaCalendarDecadeViewGridVariants = cva(
    `
        grid grid-cols-4 gap-0.5
        justify-center
        [&>div]:h-full [&>div]:flex
        [&>div]:items-center [&>div]:justify-center
        [&>div]:h-12
    `
);

export const reinaCalendarDecadeViewCellVariants = cva(
    `
        py-2 cursor-pointer font-medium
        transition-colors duration-100 ease-out
        hover:bg-accent
        active:bg-accent-active
    `,
    {
        variants: {
            focused: {
                true: "ring-1 ring-inset ring-primary/40 bg-accent outline-none"
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-lg",
                medium: "rounded-xl",
                large: "rounded-2xl",
                full: "rounded-full"
            }
        }
    }
);
