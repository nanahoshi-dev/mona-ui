import { cva } from "class-variance-authority";

export const calendarBaseVariants = cva(
    `
        block p-2 w-80
        flex flex-col gap-2
        bg-background text-foreground
        border border-input-border
        shadow-sm select-none

    `,
    {
        variants: {
            disabled: {
                true: "opacity-50 cursor-not-allowed pointer-events-none"
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            },
            size: {
                large: "text-lg",
                medium: "text-md",
                small: "text-sm"
            }
        }
    }
);

export const calendarDecadeViewTableVariants = cva(
    `
        w-full border-collapse
        [&_th,_td]:text-center
        [&_th,_td]:h-12
        [&_td]:cursor-pointer
        [&_td]:hover:bg-hover
        [&_td]:active:bg-active
    `
);

export const calendarHeaderVariants = cva(
    `
        flex items-center justify-center
        w-full
        [&>button+button]:border-s-0
        [&>button:nth-of-type(1)]:rounded-se-none
        [&>button:nth-of-type(1)]:rounded-ee-none
        [&>button:nth-of-type(2)]:flex-1
        [&>button:nth-of-type(2)]:rounded-none
        [&>button:nth-of-type(3)]:rounded-ss-none
        [&>button:nth-of-type(3)]:rounded-es-none
        [&>button]:bg-secondary
    `
);

export const calendarMonthViewDayVariants = cva(
    `
        focus-visible:ring-1 ring-inset ring-primary/40
        focus-visible:outline-none
        hover:bg-hover
        cursor-pointer
    `,
    {
        variants: {
            disabled: {
                true: "opacity-50 cursor-not-allowed"
            },
            focused: {
                true: "ring-1 ring-inset ring-primary/40 bg-accent"
            },
            outside: {
                true: "opacity-50"
            },
            rounded: {
                none: "rounded-none",
                small: "rounded-sm",
                medium: "rounded-md",
                large: "rounded-lg",
                full: "rounded-full"
            },
            selected: {
                true: "bg-primary text-primary-foreground hover:bg-primary-hover"
            }
        },
        defaultVariants: {
            rounded: "medium"
        }
    }
);

export const calendarMonthViewTableVariants = cva(
    `
        w-full border-collapse
        table-fixed
        [&_th,_td]:text-center
        [&_th,_td]:h-8
        [&_th,_td]:w-8
        [&_th,_td]:aspect-square

        [&>thead]:pointer-events-none
        [&>thead_th]:pb-1
        [&>thead_th]:font-bold

        [&>tbody_td]:py-1
        [&>tbody_td]:px-0
        [&>tbody>tr:first>td]:mt-1
    `
);

export const calendarYearViewTableVariants = cva(
    `
        w-full border-collapse
        [&_th,_td]:text-center
        [&_th,_td]:h-12
        [&_td]:cursor-pointer
        [&_td]:hover:bg-hover
        [&_td]:active:bg-active
    `
);
