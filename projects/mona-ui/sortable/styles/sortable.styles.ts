/**
 * While a list is sorted, its other items glide out of the way, and the dragged item's slot shows it faded. The
 * preview, a copy of the item that follows the pointer, floats with an overlay's shadow, then glides into the slot. A
 * theme's translucent surfaces would show the slot through the preview, so what's behind it is blurred.
 */
export const SORTABLE_ITEM_CLASSES = `
    [&.cdk-drag-placeholder]:opacity-40
    [&.cdk-drag-preview]:shadow-(--shadow-overlay) [&.cdk-drag-preview]:backdrop-blur-sm
    [.cdk-drop-list-dragging_&:not(.cdk-drag-placeholder)]:transition-transform
    [.cdk-drop-list-dragging_&:not(.cdk-drag-placeholder)]:duration-200
    [.cdk-drop-list-dragging_&:not(.cdk-drag-placeholder)]:ease-[cubic-bezier(0.2,0,0,1)]
    motion-reduce:[.cdk-drop-list-dragging_&:not(.cdk-drag-placeholder)]:transition-none
    [&.cdk-drag-animating]:transition-transform [&.cdk-drag-animating]:duration-200
    [&.cdk-drag-animating]:ease-[cubic-bezier(0.2,0,0,1)]
    motion-reduce:[&.cdk-drag-animating]:transition-none
`;

/** On a touch screen, how long a press on an item lasts before it's picked up, so a swipe still scrolls. */
export const SORTABLE_TOUCH_DELAY = 250;
