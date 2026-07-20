import { cva } from "class-variance-authority";
import { themeOverlaySurfaceClasses } from "@nanahoshi/mona-ui/internal";

//---------------------------------
// Notification Container Component
//---------------------------------

export const notificationContainerBaseThemeVariants = cva(`p-2 z-40000`, {
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

export const notificationActionThemeVariants = cva(
    `
        absolute top-0 right-0 flex h-auto items-start
        [&>svg.lucide]:cursor-pointer
        [&>svg.lucide]:-mt-1
    `
);

export const notificationBaseThemeVariants = cva(
    `
        relative mb-2 flex h-fit w-fit flex-col overflow-hidden
        ${themeOverlaySurfaceClasses} text-foreground
        border border-border shadow-(--shadow-overlay)
    `
);

export const notificationBodyThemeVariants = cva(
    `
        flex flex-1 p-2 ps-0 pe-8
    `
);

export const notificationContentThemeVariants = cva(
    `
        flex w-full flex-1 items-center
    `
);

export const notificationHeaderThemeVariants = cva(
    `
        flex w-full flex-1 flex-row items-center
        text-sm font-medium
        select-none
    `
);

export const notificationIconThemeVariants = cva(
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

export const notificationTextThemeVariants = cva(
    `
        text-sm text-foreground
    `
);
