import { cva } from "class-variance-authority";

export const switchVariants = cva(
    `
        relative flex items-center cursor-pointer select-none
        w-11 h-6 p-1
        rounded-full text-sm
        transition-[background]
        data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-50
    `,
    {
        variants: {
            state: {
                on: "bg-primary text-primary-foreground",
                off: "bg-secondary"
            }
        }
    }
);

export const switchHandleVariants = cva(
    `
        absolute inline-flex w-4.5 h-4.5 rounded-full
        outline-none transition-[left,background] ease-out duration-200
        border border-border bg-background
    `,
    {
        variants: {
            state: {
                on: "left-[calc(100%-22px)]",
                off: "left-1"
            }
        }
    }
);

export const switchLabelVariants = cva(
    `
        h-full flex flex-1 items-center justify-center text-xs
    `
);
