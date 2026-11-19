import { CSP_NONCE, DOCUMENT, inject } from "@angular/core";

/** Marks the style element, so a document gets one however many lists it has. */
const LAYER_ORDER_MARKER = "data-mona-cdk-resets";

/**
 * The CDK resets a drag preview's popover styles, its padding, border and background, in a `cdk-resets` cascade layer
 * that it adds at runtime, after the app's style sheets. Of two layers, the one declared later wins, so the reset
 * would beat Tailwind's `utilities` layer and strip the preview of the item's look. Declaring the layer ahead of the
 * first style sheet makes it the weakest author layer, as the CDK means it to be. Call it in an injection context.
 */
export function declareCdkResetsLayerFirst(): void {
    const document = inject(DOCUMENT);
    const head = document.head as HTMLHeadElement | null;
    if (!head || head.querySelector(`style[${LAYER_ORDER_MARKER}]`)) {
        return;
    }
    const style = document.createElement("style");
    style.setAttribute(LAYER_ORDER_MARKER, "");
    const nonce = inject(CSP_NONCE, { optional: true });
    if (nonce) {
        style.setAttribute("nonce", nonce);
    }
    style.textContent = "@layer cdk-resets;";
    head.insertBefore(style, head.querySelector("link[rel~='stylesheet'], style"));
}
