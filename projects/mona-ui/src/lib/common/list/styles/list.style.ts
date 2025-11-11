import { cva } from "class-variance-authority";

export const listVariants = cva(
    `
        h-full flex flex-col overflow-hidden outline-none
    `
);

export const listInnerListVariants = cva(
    `
        list-none p-0 m-0 overflow-x-hidden overflow-y-auto
        h-full outline-none
    `
);

export const listGroupHeaderVariants = cva(
    `
        px-3 py-1 font-bold select-none
    `
);

export const listGroupHeaderTextVariants = cva(`select-none`, {
    variants: {
        hasTemplate: {
            true: "",
            false: "font-bold w-full px-3 py-1"
        }
    }
});

export const listItemTextVariants = cva(``, {
    variants: {}
});

export const listItemVariants = cva(
    `
        relative flex cursor-default select-none items-center
        outline-none px-3 py-1
        hover:bg-accent hover:text-accent-foreground
        focus:bg-accent focus:text-accent-foreground
    `,
    {
        variants: {
            highlighted: {
                true: "bg-accent text-accent-foreground rounded-none",
                false: ""
            },
            selected: {
                true: "bg-primary text-primary-foreground",
                false: ""
            },
            disabled: {
                true: "pointer-events-none opacity-50 cursor-default",
                false: "cursor-pointer"
            }
        },
        compoundVariants: [
            {
                selected: true,
                class: `
                    bg-primary text-primary-foreground rounded-none
                    hover:bg-primary hover:text-primary-foreground
                    focus:bg-primary focus:text-primary-foreground
                `
            },
            {
                highlighted: true,
                selected: true,
                class: `
                    bg-primary text-primary-foreground rounded-none
                    hover:bg-primary hover:text-primary-foreground
                    focus:bg-primary focus:text-primary-foreground
                `
            }
        ]
    }
);
