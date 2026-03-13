import { cva } from "class-variance-authority";

export const breadcrumbListVariants = cva(
    `
        flex items-center
        overflow-hidden gap-1
        list-none select-none py-1

    `
);

export const breadcrumbListItemVariants = cva(
    `
        flex items-center
        truncate cursor-pointer
        h-full
    `,
    {
        variants: {
            active: {
                true: "font-semibold",
                false: ""
            },
            disabled: {
                true: "cursor-not-allowed pointer-events-none opacity-50",
                false: ""
            }
        }
    }
);
