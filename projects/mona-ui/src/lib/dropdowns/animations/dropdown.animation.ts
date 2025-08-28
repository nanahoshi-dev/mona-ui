import { animate, AnimationMetadata, style } from "@angular/animations";

export const dropdownPopupHideAnimation: AnimationMetadata[] = [
    animate(
        "150ms cubic-bezier(0.4, 0, 0.2, 1)",
        style({
            opacity: 0,
            transform: "scale(0.95)",
            transformOrigin: "top center"
        })
    )
];

export const dropdownPopupShowAnimation: AnimationMetadata[] = [
    style({
        opacity: 0,
        transform: "scale(0.95)",
        transformOrigin: "top center"
    }),
    animate(
        "150ms cubic-bezier(0.4, 0, 0.2, 1)",
        style({
            opacity: 1,
            transform: "scale(1)",
            transformOrigin: "top center"
        })
    )
];
