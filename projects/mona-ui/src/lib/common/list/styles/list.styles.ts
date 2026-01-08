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

export const listGroupHeaderVariants = cva(``, {
    variants: {
        hasTemplate: {
            true: "",
            false: "py-1 font-bold"
        }
    }
});

export const listGroupHeaderTextVariants = cva(`select-none`, {
    variants: {
        hasTemplate: {
            true: "",
            false: "font-bold w-full px-3 py-1"
        }
    }
});

export const listItemBaseVariants = cva(
    `
        w-full h-full flex gap-2 items-center
    `
);

export const listItemContentVariants = cva(
    `
        relative flex cursor-default select-none items-center
        outline-none px-3 py-1
        hover:bg-accent hover:text-accent-foreground
        focus:bg-accent focus:text-accent-foreground
    `,
    {
        variants: {
            checkboxes: {
                true: "gap-2",
                false: ""
            },
            highlighted: {
                true: "bg-accent text-accent-foreground rounded-none inset-ring-1 inset-ring-gray-400/70",
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
                checkboxes: false,
                class: `
                    bg-primary text-primary-foreground rounded-none
                    hover:bg-primary hover:text-primary-foreground
                    focus:bg-primary focus:text-primary-foreground
                `
            },
            {
                highlighted: true,
                selected: true,
                checkboxes: false,
                class: `
                    bg-primary text-primary-foreground rounded-none
                    hover:bg-primary hover:text-primary-foreground
                    focus:bg-primary focus:text-primary-foreground
                `
            },
            {
                selected: true,
                checkboxes: true,
                class: `bg-transparent text-foreground`
            }
        ]
    }
);
