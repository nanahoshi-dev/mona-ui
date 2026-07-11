import { cva } from "class-variance-authority";

export const reinaNotificationContainerBaseVariants = cva(`p-2 z-40000`, {
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

export const reinaNotificationActionVariants = cva(
    `
        absolute top-0 right-0
        flex items-start h-auto
        [&>svg.lucide]:cursor-pointer
        [&>svg.lucide]:-mt-1
    `
);

export const reinaNotificationBaseVariants = cva(
    `
        w-fit h-fit relative
        overflow-hidden flex flex-col
        mb-2 bg-background text-foreground shadow-sm
        rounded-lg border border-input-border
    `
);

export const reinaNotificationBodyVariants = cva(
    `
        flex flex-1 p-2 ps-0 pe-8
    `
);

export const reinaNotificationContentVariants = cva(
    `
        flex flex-1 w-full items-center
    `
);

export const reinaNotificationHeaderVariants = cva(
    `
        w-full flex flex-row items-center
        flex-1 text-sm font-medium
        select-none
    `
);

export const reinaNotificationIconVariants = cva(
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

export const reinaNotificationTextVariants = cva(
    `
        text-sm text-foreground
    `
);
