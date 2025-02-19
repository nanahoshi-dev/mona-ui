import { animate, AnimationMetadata, style } from "@angular/animations";

export const defaultPopupHideAnimation: AnimationMetadata[] = [
    animate(
        "150ms cubic-bezier(0.4, 0, 0.2, 1)",
        style({
            opacity: 0,
            transform: "scale(0.95)",
            transformOrigin: "center" // Use CSS variable
        })
    )
];

export const defaultPopupShowAnimation: AnimationMetadata[] = [
    style({
        opacity: 0,
        transform: "scale(0.95)",
        transformOrigin: "center" // Use CSS variable
    }),
    animate(
        "150ms cubic-bezier(0.4, 0, 0.2, 1)",
        style({
            opacity: 1,
            transform: "scale(1)",
            transformOrigin: "center" // Use CSS variable
        })
    )
];
