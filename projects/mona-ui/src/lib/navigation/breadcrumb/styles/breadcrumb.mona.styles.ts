import { cva } from "class-variance-authority";

export const breadcrumbListVariants = cva(
    `
        flex items-center
        overflow-hidden gap-1
        list-none select-none py-1
    `,
    {
        variants: {
            disabled: {
                true: "cursor-not-allowed pointer-events-none opacity-50",
                false: ""
            }
        }
    }
);

export const breadcrumbListItemVariants = cva(
    `
        flex items-center
        truncate cursor-pointer
        h-full
        outline-none rounded-sm px-1
        hover:bg-hover hover:text-foreground
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
        transition-colors duration-100 ease-in-out
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
        compoundVariants: [{ disabled: true, listDisabled: false, class: "opacity-50" }],
        defaultVariants: {
            disabled: false,
            listDisabled: false
        }
    }
);

export const breadcrumbCurrentItemVariants = cva(`flex items-center truncate cursor-default font-medium`);
