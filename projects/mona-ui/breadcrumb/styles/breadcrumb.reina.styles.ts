import { cva } from "class-variance-authority";

export const reinaBreadcrumbListVariants = cva(
    `
        flex items-center
        overflow-hidden gap-1
        list-none select-none py-1 px-2
    `,
    {
        variants: {
            disabled: {
                true: "cursor-not-allowed pointer-events-none opacity-40",
                false: ""
            }
        }
    }
);

export const reinaBreadcrumbListItemVariants = cva(
    `
        flex items-center
        truncate cursor-pointer
        h-full text-foreground/50 font-medium
        bg-transparent border-0
        outline-none rounded-md px-1.5
        transition-colors duration-150 ease-out
        hover:text-primary hover:bg-primary/10
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35
    `,
    {
        variants: {
            disabled: {
                true: "cursor-not-allowed pointer-events-none",
                false: ""
            },
            listDisabled: {
                true: "",
                false: ""
            }
        },
        compoundVariants: [{ disabled: true, listDisabled: false, class: "opacity-40" }],
        defaultVariants: {
            disabled: false,
            listDisabled: false
        }
    }
);

export const reinaBreadcrumbCurrentItemVariants = cva(
    `flex items-center truncate cursor-default font-semibold text-primary`
);
