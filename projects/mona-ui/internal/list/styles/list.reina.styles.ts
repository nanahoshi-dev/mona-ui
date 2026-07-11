import { cva } from "class-variance-authority";

export const reinaListVariants = cva(
    `
        h-full flex flex-col overflow-hidden outline-none
    `
);

export const reinaListInnerListVariants = cva(
    `
        list-none p-0 m-0 overflow-x-hidden overflow-y-auto
        h-full outline-none
    `
);

export const reinaListGroupHeaderVariants = cva(``, {
    variants: {
        hasTemplate: {
            true: "",
            false: "py-1 font-semibold"
        }
    }
});

export const reinaListGroupHeaderTextVariants = cva(`select-none`, {
    variants: {
        hasTemplate: {
            true: "",
            false: "font-semibold tracking-tight text-foreground/60 w-full px-3 py-1"
        }
    }
});

export const reinaListItemBaseVariants = cva(
    `
        w-full h-full flex gap-2 items-center
    `
);

export const reinaListItemContentVariants = cva(
    `
        relative flex cursor-default select-none items-center
        outline-none px-3 py-1
        rounded-md
        transition-colors ease-out duration-150
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
                true: "bg-accent text-accent-foreground inset-ring-1 inset-ring-primary/40",
                false: ""
            },
            selected: {
                true: "bg-primary text-primary-foreground inset-ring-1 inset-ring-primary-foreground/35",
                false: ""
            },
            disabled: {
                true: "pointer-events-none opacity-40 cursor-default",
                false: "cursor-pointer"
            }
        },
        compoundVariants: [
            {
                selected: true,
                checkboxes: false,
                class: `
                    bg-primary text-primary-foreground
                    inset-ring-1 inset-ring-primary-foreground/35
                    hover:bg-primary hover:text-primary-foreground
                    focus:bg-primary focus:text-primary-foreground
                `
            },
            {
                highlighted: true,
                selected: true,
                checkboxes: false,
                class: `
                    bg-primary text-primary-foreground
                    inset-ring-1 inset-ring-primary-foreground/35
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
