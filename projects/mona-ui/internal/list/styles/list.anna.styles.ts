import { cva } from "class-variance-authority";

export const listVariants = cva(`flex h-full flex-col overflow-hidden bg-surface outline-none`);

export const listInnerListVariants = cva(
    `m-0 h-full list-none overflow-x-hidden overflow-y-auto p-0 outline-none [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]`
);

export const listGroupHeaderVariants = cva(``, {
    variants: {
        hasTemplate: { true: "", false: "border-y border-border-subtle bg-surface-muted py-1 font-semibold" }
    }
});

export const listGroupHeaderTextVariants = cva(`select-none text-muted-foreground`, {
    variants: {
        hasTemplate: { true: "", false: "w-full px-3 py-1 font-semibold" }
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
            selected: { true: "bg-primary text-primary-foreground", false: "" },
            disabled: {
                true: "pointer-events-none cursor-default bg-disabled-background text-disabled-foreground",
                false: "cursor-pointer"
            }
        },
        compoundVariants: [
            {
                selected: true,
                checkboxes: false,
                class: "bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
            },
            {
                highlighted: true,
                selected: true,
                checkboxes: false,
                class: "bg-primary text-primary-foreground inset-ring-1 inset-ring-focus-indicator/35 hover:bg-primary-hover hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
            },
            { selected: true, checkboxes: true, class: "bg-transparent text-foreground" }
        ]
    }
);
