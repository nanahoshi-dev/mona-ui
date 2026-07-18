import { cva } from "class-variance-authority";

export const listVariants = cva(`flex h-full flex-col overflow-hidden outline-none`);

export const listInnerListVariants = cva(
    `m-0 h-full list-none overflow-x-hidden overflow-y-auto p-0 outline-none [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]`
);

export const listGroupHeaderVariants = cva(``, {
    variants: {
        hasTemplate: { true: "", false: "py-1 font-bold" }
    }
});

export const listGroupHeaderTextVariants = cva(`select-none text-muted-foreground`, {
    variants: {
        hasTemplate: { true: "", false: "w-full px-3 py-1 font-bold" }
    }
});

export const listItemBaseVariants = cva(`flex h-full w-full items-center gap-2`);

export const listItemContentVariants = cva(
    `relative flex cursor-default select-none items-center px-3 py-1 text-foreground outline-none hover:bg-hover focus:bg-hover`,
    {
        variants: {
            checkboxes: { true: "gap-2", false: "" },
            highlighted: {
                true: "bg-hover text-foreground inset-ring-1 inset-ring-focus-indicator/35",
                false: ""
            },
            selected: { true: "bg-active text-foreground", false: "" },
            disabled: {
                true: "pointer-events-none cursor-default text-disabled-foreground",
                false: "cursor-pointer"
            }
        },
        compoundVariants: [
            {
                selected: true,
                checkboxes: false,
                class: "bg-active text-foreground hover:bg-active hover:text-foreground focus:bg-active focus:text-foreground"
            },
            {
                highlighted: true,
                selected: true,
                checkboxes: false,
                class: "bg-active text-foreground inset-ring-1 inset-ring-focus-indicator/35 hover:bg-active hover:text-foreground focus:bg-active focus:text-foreground"
            },
            { selected: true, checkboxes: true, class: "bg-transparent text-foreground" }
        ]
    }
);
