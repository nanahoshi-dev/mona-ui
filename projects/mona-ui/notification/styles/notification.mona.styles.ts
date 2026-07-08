import { cva } from "class-variance-authority";

//---------------------------------
// Notification Container Component
//---------------------------------

export const notificationContainerBaseVariants = cva(`p-2 z-40000`, {
    variants: {
        position: {
            bottom: "bottom-0 left-1/2 -translate-x-1/2",
            bottomleft: "bottom-0 left-0",
            bottomright: "bottom-0 right-0",
            top: "top-0 left-1/2 -translate-x-1/2",
            topleft: "top-0 left-0",
            topright: "top-0 right-0"
        },
        positionType: {
            fixed: "fixed",
            absolute: "absolute"
        }
    },
    defaultVariants: {
        positionType: "fixed"
    }
});

//-----------------------
// Notification Component
//-----------------------

export const notificationActionVariants = cva(
    `
        absolute top-0 right-0
        flex items-start h-auto
        [&>svg.lucide]:cursor-pointer
        [&>svg.lucide]:-mt-1
    `
);

export const notificationBaseVariants = cva(
    `
        w-fit h-fit relative
        overflow-hidden flex flex-col
        mb-2 bg-background shadow-md
        border border-border
    `
);

export const notificationBodyVariants = cva(
    `
        flex flex-1 p-2 ps-0 pe-8
    `
);

export const notificationContentVariants = cva(
    `
        flex flex-1 w-full items-center
    `
);

export const notificationHeaderVariants = cva(
    `
        w-full flex flex-row items-center
        flex-1 text-sm font-medium
        select-none
    `
);

export const notificationIconVariants = cva(
    `
        flex items-center justify-center px-4
    `,
    {
        variants: {
            type: {
                info: "text-info",
                success: "text-success",
                warning: "text-warning",
                error: "text-error"
            }
        }
    }
);

export const notificationTextVariants = cva(
    `
        text-sm text-foreground
    `
);
