import { cva } from "class-variance-authority";

export const listThemeVariants = cva(`flex h-full flex-col overflow-hidden bg-(--mona-list-background) outline-none`);

export const listInnerListThemeVariants = cva(
    `m-0 h-full list-none overflow-x-hidden overflow-y-auto p-0 outline-none [scrollbar-color:var(--color-scrollbar-thumb)_var(--color-scrollbar-track)] [scrollbar-width:thin]`
);

export const listGroupHeaderThemeVariants = cva(``, {
    variants: {
        hasTemplate: {
            true: "",
            false: "border-y-[length:var(--mona-list-group-border-width)] border-border-subtle bg-(--mona-list-group-background) py-1 font-[var(--mona-list-group-font-weight)]"
        }
    }
});

export const listGroupHeaderTextThemeVariants = cva(`select-none text-muted-foreground`, {
    variants: {
        hasTemplate: { true: "", false: "w-full px-3 py-1 font-[var(--mona-list-group-font-weight)]" }
    }
});

export const listItemBaseThemeVariants = cva(`flex h-full w-full items-center gap-2`);

export const listItemContentThemeVariants = cva(
    `relative flex cursor-default select-none items-center px-3 py-1 text-foreground outline-none hover:bg-hover focus:bg-hover`,
    {
        variants: {
            checkboxes: { true: "gap-2", false: "" },
            highlighted: {
                true: "bg-hover text-foreground inset-ring-1 inset-ring-focus-indicator/35",
                false: ""
            },
            selected: { true: "bg-(--color-selected) text-(--color-selected-foreground)", false: "" },
            disabled: {
                true: "pointer-events-none cursor-default bg-(--mona-list-disabled-background) text-disabled-foreground",
                false: "cursor-pointer"
            }
        },
        compoundVariants: [
            {
                selected: true,
                checkboxes: false,
                class: "bg-(--color-selected) text-(--color-selected-foreground) hover:bg-(--color-selected-hover) hover:text-(--color-selected-hover-foreground) focus:bg-(--color-selected-focus) focus:text-(--color-selected-focus-foreground)"
            },
            {
                highlighted: true,
                selected: true,
                checkboxes: false,
                class: "bg-(--color-selected) text-(--color-selected-foreground) inset-ring-1 inset-ring-focus-indicator/35 hover:bg-(--color-selected-hover) hover:text-(--color-selected-hover-foreground) focus:bg-(--color-selected-focus) focus:text-(--color-selected-focus-foreground)"
            },
            { selected: true, checkboxes: true, class: "bg-transparent text-foreground" }
        ]
    }
);
